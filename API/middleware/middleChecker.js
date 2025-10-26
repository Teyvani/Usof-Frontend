function createReport(req, res, next) {
    const { post_id, comment_id, reason } = req.body;

    if (!reason || reason.trim() === '') {
        return res.status(400).json({ error: 'Report reason is required' }); 
    }
    if (reason.length > 500) {
        return res.status(400).json({ error: 'Report reason cannot exceed 500 characters' });
    }
    if ((!post_id && !comment_id) || (post_id && comment_id)){
        return res.status(400).json({ error: 'Either post_id or comment_id must be provided, but not both' });
    }

    next();
}

function getAllReports(req, res, next) {
    const status = req.query.status;

    if (status) {
        if (!['pending', 'reviewed', 'resolved'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Must be pending, reviewed, or resolved' });
        }
    }

    next();
}

function processReport(req, res, next) {
    const { action } = req.body;

    if (!action) return res.status(400).json({ error: '"action" is required' });
    if (!['ignored', 'deleted', 'warned'].includes(action)) {
        return res.status(400).json({ error: 'Invalid action. Must be ignored, deleted, or warned' });
    }

    next();
}

function createCollection(req, res, next) {
    const title = req.body.title;

    if (!title || title.trim() === '') {
        return res.status(400).json({ error: 'Collection title is required' });
    }
    next();
}

module.exports = { createReport, getAllReports, processReport, createCollection }
