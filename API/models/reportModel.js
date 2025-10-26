const db = require('../db.js');

function createReport({ reporter_id, post_id, comment_id, reason }, callback) {
    const sql = 'INSERT INTO reports (reporter_id, post_id, comment_id, reason) VALUES (?, ?, ?, ?)';
    db.query(sql, [reporter_id, post_id || null, comment_id || null, reason], (err, results) => {
        if (err) return callback(err);
        callback(null, results);
    });
}

function getAllReports(callback) {
    const sql = `
        SELECT r.*, 
               u.login as reporter_login, u.full_name as reporter_name,
               a.login as admin_login, a.full_name as admin_name,
               p.title as post_title,
               CASE 
                   WHEN r.post_id IS NOT NULL THEN 'post'
                   WHEN r.comment_id IS NOT NULL THEN 'comment'
                   ELSE 'unknown'
               END as target_type
        FROM reports r
        JOIN users u ON r.reporter_id = u.id
        LEFT JOIN users a ON r.admin_id = a.id
        LEFT JOIN posts p ON r.post_id = p.id
        ORDER BY r.created_at DESC`;
    
    db.query(sql, (err, results) => {
        if (err) return callback(err);
        callback(null, results);
    });
}

function getReportsByStatus(status, callback) {
    const sql = `
        SELECT r.*, 
               u.login as reporter_login, u.full_name as reporter_name,
               a.login as admin_login, a.full_name as admin_name,
               p.title as post_title,
               CASE 
                   WHEN r.post_id IS NOT NULL THEN 'post'
                   WHEN r.comment_id IS NOT NULL THEN 'comment'
                   ELSE 'unknown'
               END as target_type
        FROM reports r
        JOIN users u ON r.reporter_id = u.id
        LEFT JOIN users a ON r.admin_id = a.id
        LEFT JOIN posts p ON r.post_id = p.id
        WHERE r.status = ?
        ORDER BY r.created_at DESC`;
    
    db.query(sql, [status], (err, results) => {
        if (err) return callback(err);
        callback(null, results);
    });
}

function getReportById(reportId, callback) {
    const sql = `
        SELECT r.*, 
               u.login as reporter_login, u.full_name as reporter_name,
               a.login as admin_login, a.full_name as admin_name,
               p.title as post_title, p.content as post_content, p.author_id as post_author_id,
               c.content as comment_content, c.author_id as comment_author_id,
               CASE 
                   WHEN r.post_id IS NOT NULL THEN 'post'
                   WHEN r.comment_id IS NOT NULL THEN 'comment'
                   ELSE 'unknown'
               END as target_type
        FROM reports r
        JOIN users u ON r.reporter_id = u.id
        LEFT JOIN users a ON r.admin_id = a.id
        LEFT JOIN posts p ON r.post_id = p.id
        LEFT JOIN comments c ON r.comment_id = c.id
        WHERE r.id = ?`;
    
    db.query(sql, [reportId], (err, results) => {
        if (err) return callback(err);
        callback(null, results.length > 0 ? results[0] : null);
    });
}

function updateReportStatus(reportId, adminId, status, action, message, callback) {
    const sql = `
        UPDATE reports 
        SET status = ?, admin_id = ?, admin_action = ?, admin_message = ?, resolved_at = CURRENT_TIMESTAMP
        WHERE id = ?`;
    
    db.query(sql, [status, adminId, action, message, reportId], (err, results) => {
        if (err) return callback(err);
        callback(null, results);
    });
}

function getUserReports(userId, callback) {
    const sql = `
        SELECT r.*, 
               p.title as post_title,
               CASE 
                   WHEN r.post_id IS NOT NULL THEN 'post'
                   WHEN r.comment_id IS NOT NULL THEN 'comment'
                   ELSE 'unknown'
               END as target_type
        FROM reports r
        LEFT JOIN posts p ON r.post_id = p.id
        WHERE r.reporter_id = ?
        ORDER BY r.created_at DESC`;
    
    db.query(sql, [userId], (err, results) => {
        if (err) return callback(err);
        callback(null, results);
    });
}

function checkExistingReport(reporterId, postId, commentId, callback) {
    let sql = 'SELECT * FROM reports WHERE reporter_id = ? AND ';
    let params = [reporterId];
    
    if (postId) {
        sql += 'post_id = ?';
        params.push(postId);
    } else {
        sql += 'comment_id = ?';
        params.push(commentId);
    }
    
    db.query(sql, params, (err, results) => {
        if (err) return callback(err);
        callback(null, results.length > 0);
    });
}

function deleteReport(reportId, callback) {
    const sql = 'DELETE FROM reports WHERE id = ?';
    db.query(sql, [reportId], (err, results) => {
        if (err) return callback(err);
        callback(null, results);
    });
}

function getReportsStats(callback) {
    const sql = `
        SELECT 
            COUNT(*) as total_reports,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_reports,
            SUM(CASE WHEN status = 'reviewed' THEN 1 ELSE 0 END) as reviewed_reports,
            SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_reports
        FROM reports`;
    
    db.query(sql, (err, results) => {
        if (err) return callback(err);
        callback(null, results[0]);
    });
}

module.exports = { createReport, getAllReports, getReportsByStatus, getReportById, updateReportStatus, getUserReports, checkExistingReport, deleteReport, getReportsStats };
