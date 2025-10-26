const reportModel = require('../models/reportModel');
const postModel = require('../models/postModel');
const commentModel = require('../models/commentModel');
const notificationModel = require('../models/notificationModel');

exports.createReport = (req, res) => {
    try {
        const reporterId = req.session.user.id;
        const { post_id, comment_id, reason } = req.body;

        reportModel.checkExistingReport(reporterId, post_id, comment_id, (err, exists) => {
            if (err) {
                console.error('Error checking existing report:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (exists) { return res.status(400).json({ error: 'You have already reported this content' }); }
            if (post_id) {
                postModel.getPostByID(post_id, (err, post) => {
                    if (err) {
                        console.error('Error fetching post:', err);
                        return res.status(500).json({ error: 'Internal server error' });
                    }
                    if (!post) { return res.status(404).json({ error: 'Post not found' }); }
                    if (post.author_id === reporterId) { return res.status(400).json({ error: 'You cannot report your own posts' }); }

                    createReportHelper();
                });
            } else if (comment_id) {
                commentModel.getCommentById(comment_id, (err, comment) => {
                    if (err) {
                        console.error('Error fetching comment:', err);
                        return res.status(500).json({ error: 'Internal server error' });
                    }
                    if (!comment) { return res.status(404).json({ error: 'Comment not found' }); }
                    if (comment.author_id === reporterId) { return res.status(400).json({ error: 'You cannot report your own comments' }); }

                    createReportHelper();
                });
            } else {
                return res.status(400).json({ error: 'Either post_id or comment_id must be provided' });
            }

            function createReportHelper() {
                reportModel.createReport({
                    reporter_id: reporterId,
                    post_id: post_id || null,
                    comment_id: comment_id || null,
                    reason: reason.trim() 
                }, (err, results) => {
                    if (err) {
                        console.error('Error creating report:', err);
                        return res.status(500).json({ error: 'Internal server error' });
                    }

                    res.status(201).json({
                        message: 'Report submitted successfully',
                        report_id: results.insertId
                    });
                });
            }
        });
    } catch (error) {
        console.error('Error creating report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getAllReports = (req, res) => {
    try {
        const status = req.query.status;

        if (status) {
            reportModel.getReportsByStatus(status, (err, reports) => {
                if (err) {
                    console.error('Error fetching reports by status:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                res.json({ reports });
            });
        } else {
            reportModel.getAllReports((err, reports) => {
                if (err) {
                    console.error('Error fetching all reports:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                res.json({ reports });
            });
        }
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getReportById = (req, res) => {
    try {
        const reportId = req.params.report_id;

        reportModel.getReportById(reportId, (err, report) => {
            if (err) {
                console.error('Error fetching report:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (!report) { return res.status(404).json({ error: 'Report not found' }); }

            res.json({ report });
        });
    } catch (error) {
        console.error('Error fetching report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.processReport = (req, res) => {
    try {
        const reportId = req.params.report_id;
        const adminId = req.session.user.id;
        const { action, message } = req.body;

        reportModel.getReportById(reportId, (err, report) => {
            if (err) {
                console.error('Error fetching report:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (!report) return res.status(404).json({ error: 'Report not found' });
            if (report.status !== 'pending') { return res.status(400).json({ error: 'Report has already been processed' }); }

            let status = 'resolved';
            if (action === 'ignored') updateReportAndNotify();
            else if (action === 'deleted') {
                if (report.post_id) {
                    postModel.updatePost(report.post_id, { status: 'inactive' }, (err) => {
                        if (err) {
                            console.error('Error deactivating post:', err);
                            return res.status(500).json({ error: 'Internal server error' });
                        }
                        updateReportAndNotify();
                    });
                } else if (report.comment_id) {
                    commentModel.updateComment(report.comment_id, { status: 'inactive' }, (err) => {
                        if (err) {
                            console.error('Error deactivating comment:', err);
                            return res.status(500).json({ error: 'Internal server error' });
                        }
                        updateReportAndNotify();
                    });
                } else if (action === 'warned') { updateReportAndNotify(); }
            }

            function updateReportAndNotify() {
                reportModel.updateReportStatus(reportId, adminId, status, action, message, (err) => {
                    if (err) {
                        console.error('Error updating report', err);
                        return res.status(500).json({ error: 'Internal server error' });
                    }

                     const notificationMessage = `Your report has been ${action === 'ignored' ? 'reviewed' : action}`;
                    notificationModel.createNotification({
                        user_id: report.reporter_id,
                        author_id: adminId,
                        target_type: 'report',
                        target_id: reportId,
                        message: notificationMessage
                    }, (err) => {
                        if (err) console.error('Error creating notification:', err);
                    });

                    if (action !== 'ignored') {
                        const authorId = report.post_id ? report.post_author_id : report.comment_author_id;
                        if (authorId) {
                            const authorNotificationMessage = `Your ${report.target_type} was ${action} due to a report${message ? ': ' + message : ''}`;
                            notificationModel.createNotification({
                                user_id: authorId,
                                author_id: adminId,
                                target_type: report.target_type,
                                target_id: report.post_id || report.comment_id,
                                message: authorNotificationMessage
                            }, (err) => {
                                if (err) console.error('Error creating author notification:', err);
                            });
                        }
                    }

                    res.json({
                        message: 'Report processed successfully',
                        action: action,
                        status: status
                    });
                });
            }
        });
    } catch (error) {
        console.error('Error processing report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getUserReports = (req, res) => {
    try {
        const userId = req.session.user.id;

        reportModel.getUserReports(userId, (err, reports) => {
            if (err) {
                console.error('Error fetching user reports:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            res.json({ reports });
        });
    } catch (error) {
        console.error('Error fetching user reports:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getReportsStats = (req, res) => {
    try {
        reportModel.getReportsStats((err, stats) => {
            if (err) {
                console.error('Error fetching reports stats:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            res.json({ stats });
        });
    } catch (error) {
        console.error('Unexpected error fetching reports stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deleteReport = (req, res) => {
    try {
        const reportId = req.params.report_id;
        const userId = req.session.user.id;
        const userRole = req.session.user.role;

        reportModel.getReportById(reportId, (err, report) => {
            if (err) {
                console.error('Error fetching repoort:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (!report) return res.status(404).json({ error: 'Report not found' });
            if (userRole !== 'admin' && report.reporter_id !== userId) {
                return res.status(403).json({ error: 'You can only delete your own reports' });
            }

            reportModel.deleteReport(reportId, (err, results) => {
                if (err) {
                    console.error('Error deleting report:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                res.json({ message: 'Report deleted successfuly' });
            });
        });
    } catch (error) {
        console.error('Error deleting report:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
