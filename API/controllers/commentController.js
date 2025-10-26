const commentModel = require('../models/commentModel');
const postModel = require('../models/postModel');

exports.createComment = (req, res) => {
    try {
        const postId = req.params.post_id;
        const authorId = req.session.user.id;
        const { content, parent_comment_id } = req.body;

        postModel.getPostByID(postId, (err, post) => {
            if (err) {
                console.error('Error fetching post:', err);
                return res.status(500).json({ error: 'Internal server errror' });
            }
            if (!post) { return res.status(404).json({ error: 'Post not found' }); }
            if (post.status !== 'active') { return res.status(403).json({ error: 'Cannot comment on inactive posts' }); }
            if (post.is_locked) { return res.status(403).json({ error: 'Post is locked for comments' }); }

            if (parent_comment_id) {
                commentModel.getCommentById(parent_comment_id, (err, parentComment) => {
                    if (err) {
                        console.error('Error fetching parent comment:', err);
                        return res.status(500).json({ error: 'Internal server error' });
                    }

                    if (!parentComment || parentComment.post_id != postId) {
                        return res.status(404).json({ error: 'Parent comment not found' });
                    }

                    createCommentHelper();
                });
            } else { createCommentHelper(); }

            function createCommentHelper() {
                commentModel.createComment({ post_id: postId, author_id: authorId, content, parent_comment_id}, (err, results) => {
                    if (err) {
                        console.error('Error creating comment:', err);
                        return res.status(500).json({ error: 'Internal server error' });
                    }

                    const commentId = results.insertId;
                    commentModel.updatePostCommentCount(postId, (err) => {
                        if (err) console.error('Error updating post comment count:');
                    });

                    const notificationModel = require('../models/notificationModel');
                    notificationModel.notifyPostAuthor(postId, authorId, commentId, (err) => {
                        if (err) console.error('Error notifying post author:', err);
                    });

                    notificationModel.notifyPostFollowers(postId, authorId, commentId, (err) => {
                        if (err) console.error('Error notifying post followers:', err);
                    });

                    commentModel.getCommentById(commentId, (err, newComment) => {
                        if (err) {
                            console.error('Error fetching new comment:', err);
                            return res.status(500).json({ error: 'Internal server error' });
                        }

                        res.status(201).json({
                            message: 'Comment created successfully',
                            comment: newComment
                        });
                    });
                });
            }
        });
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


exports.getPostComments = (req, res) => {
    try {
        const postId = req.params.post_id;

        postModel.getPostByID(postId, (err, post) => {
            if (err) {
                console.error('Error fetching post:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (!post) { return res.status(404).json({ error: 'Post not found' }); }

            commentModel.getPostComments(postId, (err, comments) => {
                if (err) {
                    console.error('Error fetching comments:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                res.json({ comments });
            });
        });
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getCommentById = (req, res) => {
    try {
        const commentId = req.params.comment_id;

        commentModel.getCommentById(commentId, (err, comment) => {
            if (err) {
                console.error('Error fetching comment:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            if (!comment) { return res.status(404).json({ error: 'Comment not found' }); }

            res.json({ comment });
        });
    } catch (error) {
        console.error('Error fetching comment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateComment = (req, res) => {
    try {
        const commentId = req.params.comment_id;
        const userId = req.session.user.id;
        const userRole = req.session.user.role;
        const { content, status } = req.body;

        commentModel.getCommentById(commentId, (err, comment) => {
            if (err) {
                console.error('Error fetching comment for an update:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (!comment) { return res.status(404).json({ error: 'Comment not found' }); }

            const updateFields = {};
            if (userRole === 'admin') {
                if (status !== undefined) { updateFields.status = status; }
                if (content !== undefined && comment.author_id !== userId) {
                    return res.status(403).json({ error: 'Admins are only allowed to change status of the comment, not its content' });
                }
            } else if (comment.author_id === userId) {
                if (content !== undefined) { updateFields.content = content; }
            } else {
                return res.status(403).json({ error: 'You can only edit your own comments' });
            }

            if (Object.keys(updateFields).length === 0) {
                return res.status(400).json({ error: 'No valid fields to update' });
            }

            commentModel.updateComment(commentId, updateFields, (err) => {
                if (err) {
                    console.error('Error updating comment:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }
                if (updateFields.status) {
                    commentModel.updatePostCommentCount(comment.post_id, (err) => {
                        if (err) console.error('Error updating post comment count:', err);
                    });
                }

                commentModel.getCommentById(commentId, (err, updatedComment) => {
                    if (err) {
                        console.error('Error fetching updated comment:', err);
                        return res.status(500).json({ error: 'Internal server error' });
                    }

                    res.json({
                        message: 'Comment updated successfully',
                        comment: updatedComment
                    });
                });
            });
        });
    } catch (error) {
        console.error('Error updating comment', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deleteComment = (req, res) => {
    try {
        const commentId = req.params.comment_id;
        const userId = req.session.user.id;
        const userRole = req.session.user.role;

        commentModel.getCommentById(commentId, (err, comment) => {
            if (err) {
                console.error('Error fetching comment for deletion:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (!comment) { return res.status(404).json({ error: 'Comment not found' }); }

            const deletePermission = userRole === 'admin' || comment.author_id === userId;
            if (!deletePermission) { return res.status(403).json({ error: 'You can only delete your own comments' }); }

            commentModel.deleteComment(commentId, (err) => {
                if (err) {
                    console.error('Error deleting comment:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                commentModel.updatePostCommentCount(comment.post_id, (err) => {
                    if (err) console.error('Error updating post comment count:', err);
                });

                res.json({ message: 'Comment deleted successfully' });
            });
        });
    } catch (error) {
        console.error('Error deleting comment:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getAllComments = (req, res) => {
    try {
        commentModel.getAllComments((err, comments) => {
            if (err) {
                console.error('Error fetching all comments:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            res.json({ comments });
        });
    } catch (error) {
        console.error('Unexpected error fetching all comments:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getCommentLikes = (req, res) => {
    try {
        const commentId = req.params.comment_id;
        req.params.target_id = commentId;
        req.params.target_type = 'comment';
        
        const likeController = require('./likeController');
        likeController.getLikes(req, res);
    } catch (error) {
        console.error('Unexpected error fetching comment likes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
