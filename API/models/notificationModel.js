const db = require('../db.js');

function createNotification({ user_id, author_id, target_type, target_id, message }, callback) {
    const sql = 'INSERT INTO notifications (user_id, author_id, target_type, target_id, message) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [user_id, author_id, target_type, target_id, message], (err, results) => {
        if (err) return callback(err);
        callback(null, results);
    });
}

function getUserNotifications(userId, callback) {
    const sql = `
        SELECT n.*, u.login as author_login, u.full_name as author_name,
               CASE 
                   WHEN n.target_type = 'post' THEN p.title
                   WHEN n.target_type = 'comment' THEN CONCAT('Comment on: ', p2.title)
                   WHEN n.target_type = 'report' THEN 'Report processed'
                   ELSE 'Unknown'
               END as target_title,
               CASE
                    WHEN n.target_type = 'post' THEN n.target_id            -- це й так id поста
                    WHEN n.target_type = 'comment' THEN c.post_id           -- беремо з коментаря
                    WHEN n.target_type = 'report' THEN r.post_id            -- (опційно) якщо хочеш тягнути з таблиці reports
                    ELSE NULL
                END AS post_id
        FROM notifications n
        LEFT JOIN users u ON n.author_id = u.id
        LEFT JOIN posts p ON n.target_type = 'post' AND n.target_id = p.id
        LEFT JOIN comments c ON n.target_type = 'comment' AND n.target_id = c.id
        LEFT JOIN posts p2 ON c.post_id = p2.id
        LEFT JOIN reports r ON n.target_type = 'report' AND n.target_id = r.id
        WHERE n.user_id = ?
        ORDER BY n.created_at DESC`;
    
    db.query(sql, [userId], (err, results) => {
        if (err) return callback(err);
        callback(null, results);
    });
}

function getUnreadNotificationsCount(userId, callback) {
    const sql = 'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE';
    db.query(sql, [userId], (err, results) => {
        if (err) return callback(err);
        callback(null, results[0].count);
    });
}

function markNotificationAsRead(notificationId, userId, callback) {
    const sql = 'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?';
    db.query(sql, [notificationId, userId], (err, results) => {
        if (err) return callback(err);
        callback(null, results);
    });
}

function markAllNotificationsAsRead(userId, callback) {
    const sql = 'UPDATE notifications SET is_read = TRUE WHERE user_id = ?';
    db.query(sql, [userId], (err, results) => {
        if (err) return callback(err);
        callback(null, results);
    });
}

function deleteNotification(notificationId, userId, callback) {
    const sql = 'DELETE FROM notifications WHERE id = ? AND user_id = ?';
    db.query(sql, [notificationId, userId], (err, results) => {
        if (err) return callback(err);
        callback(null, results);
    });
}

function notifyPostFollowers(postId, authorId, commentId, callback) {
    const sql = `
        INSERT INTO notifications (user_id, author_id, target_type, target_id, message)
        SELECT fp.user_id, ?, 'comment', ?, CONCAT('New comment on post you follow: "', p.title, '"')
        FROM follow_posts fp
        JOIN posts p ON fp.post_id = p.id
        WHERE fp.post_id = ? AND fp.user_id != ?`;
    
    db.query(sql, [authorId, commentId, postId, authorId], (err, results) => {
        if (err) return callback(err);
        callback(null, results);
    });
}

function notifyPostAuthor(postId, commentAuthorId, commentId, callback) {
    const sql = `
        INSERT INTO notifications (user_id, author_id, target_type, target_id, message)
        SELECT p.author_id, ?, 'comment', ?, CONCAT('New comment on your post: "', p.title, '"')
        FROM posts p
        WHERE p.id = ? AND p.author_id != ?`;
    
    db.query(sql, [commentAuthorId, commentId, postId, commentAuthorId], (err, results) => {
        if (err) return callback(err);
        callback(null, results);
    });
}

module.exports = { createNotification, getUserNotifications, getUnreadNotificationsCount, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, notifyPostFollowers, notifyPostAuthor };
