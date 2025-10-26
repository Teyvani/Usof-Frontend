const db = require('../db.js');

function createComment({ post_id, author_id, content, parent_comment_id = null }, callback) {
    const sql = 'INSERT INTO comments (post_id, author_id, content, parent_comment_id) VALUES (?, ?, ?, ?)';
    db.query(sql, [post_id, author_id, content, parent_comment_id], (err, results) => {
        if (err) return callback(err);
        callback(null, results);
    });
}

function getCommentById(id, callback) {
    const sql = `
        SELECT c.*, u.login as author_login, u.full_name as author_name, u.profile_picture as author_avatar
        FROM comments c
        JOIN users u ON c.author_id = u.id
        WHERE c.id = ?`;
    
    db.query(sql, [id], (err, results) => {
        if (err) return callback(err);
        callback(null, results.length > 0 ? results[0] : null);
    });
}

function getPostComments(postId, callback) {
    const sql = `
        SELECT c.*, u.login as author_login, u.full_name as author_name, u.profile_picture as author_avatar
        FROM comments c
        JOIN users u ON c.author_id = u.id
        WHERE c.post_id = ? AND c.status = 'active'
        ORDER BY c.published_at ASC`;
    
    db.query(sql, [postId], (err, results) => {
        if (err) return callback(err);

        const comments = {};
        const rootComments = [];
        
        results.forEach(comment => {
            comment.replies = [];
            comments[comment.id] = comment;
            
            if (comment.parent_comment_id === null) {
                rootComments.push(comment);
            } else if (comments[comment.parent_comment_id]) {
                comments[comment.parent_comment_id].replies.push(comment);
            }
        });
        
        callback(null, rootComments);
    });
}

function getAllComments(callback) {
    const sql = `
        SELECT c.*, u.login as author_login, u.full_name as author_name, 
               p.title as post_title
        FROM comments c
        JOIN users u ON c.author_id = u.id
        JOIN posts p ON c.post_id = p.id
        ORDER BY c.published_at DESC`;
    
    db.query(sql, (err, results) => {
        if (err) return callback(err);
        callback(null, results);
    });
}

function updateComment(id, fields, callback) {
    const fieldsToUpdate = [];
    const values = [];
    
    for (const field in fields) {
        if (['content', 'status'].includes(field)) {
            fieldsToUpdate.push(`${field} = ?`);
            values.push(fields[field]);
        }
    }
    
    if (fieldsToUpdate.length === 0) {
        return callback(new Error('No valid fields to update'));
    }
    values.push(id);

    const sql = `UPDATE comments SET ${fieldsToUpdate.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    db.query(sql, values, (err, results) => {
        if (err) return callback(err);
        callback(null, results);
    });
}

function deleteComment(id, callback) {
    const sql = `DELETE FROM comments WHERE id = ?`;
    db.query(sql, [id], (err, results) => {
        if (err) return callback(err);
        callback(null, results);
    });
}

function getCommentsByUserId(userId, callback) {
    const sql = `
        SELECT c.*, p.title as post_title
        FROM comments c
        JOIN posts p ON c.post_id = p.id
        WHERE c.author_id = ?
        ORDER BY c.published_at DESC`;
    
    db.query(sql, [userId], (err, results) => {
        if (err) return callback(err);
        callback(null, results);
    });
}

function updateCommentStats(commentId, callback) {
    const updateLikesCountSql = `
        UPDATE comments 
        SET likes_count = (
            SELECT COALESCE(SUM(CASE WHEN type = 'like' THEN 1 WHEN type = 'dislike' THEN -1 ELSE 0 END), 0)
            FROM likes 
            WHERE target_type = 'comment' AND target_id = ?
        )
        WHERE id = ?`;
    
    db.query(updateLikesCountSql, [commentId, commentId], callback);
}

function updatePostCommentCount(postId, callback) {
    const sql = `
        UPDATE posts 
        SET comments_count = (
            SELECT COUNT(*) 
            FROM comments 
            WHERE post_id = ? AND status = 'active'
        )
        WHERE id = ?`;
    
    db.query(sql, [postId, postId], callback);
}

module.exports = { createComment, getCommentById, getPostComments, getAllComments, updateComment, deleteComment, getCommentsByUserId, updateCommentStats, updatePostCommentCount };