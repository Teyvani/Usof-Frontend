const db = require('../db.js');

function addLike({ author_id, target_type, target_id, type }, callback) {
    const checkSql = 'SELECT * FROM likes WHERE author_id = ? AND target_type = ? AND target_id = ?';
    db.query(checkSql, [author_id, target_type, target_id], (err, results) => {
        if (err) return callback(err);

        if (results.length > 0) {
            const existingLike = results[0];

            if (existingLike.type === type) { return deleteLike(existingLike.id, callback); }
            else {
                const sql = 'UPDATE likes SET type = ? WHERE id = ?';
                db.query(sql, [type, existingLike.id], (err, results) => {
                    if (err) return callback(err);
                    callback(null, { action: 'updated', results });
                });
            }
        } else {
            const sql = 'INSERT INTO likes (author_id, target_type, target_id, type) VALUES (?, ?, ?, ?)';
            db.query(sql, [author_id, target_type, target_id, type], (err, results) => {
                if (err) return callback(err);
                callback(null, { action: 'created', results });
            });
        }
    });
}

function deleteLike(likeId, callback) {
    const sql = 'DELETE FROM likes WHERE id = ?';
    db.query(sql, [likeId], (err, results) => {
        if (err) return callback(err);
        callback(null, { action: 'deleted', results });
    });
}

function deleteLikeByUserAndTarget(author_id, targetType, targetId, callback) {
    const sql = 'DELETE FROM likes WHERE author_id = ? AND target_type = ? AND target_id = ?';
    db.query(sql, [author_id, targetType, targetId], (err, results) => {
        if (err) return callback(err);
        callback(null, { action: 'deleted', results });
    });
}

function getLikesByTarget(targetType, targetId, callback) {
    const sql = `
        SELECT l.*, u.login as author_login, u.full_name as author_name
        FROM likes l
        JOIN users u ON l.author_id = u.id
        WHERE l.target_type = ? AND l.target_id = ?
        ORDER BY l.created_at DESC`;

    db.query(sql, [targetType, targetId], (err, results) => {
        if (err) return callback(err);

        const likes = results.filter(r => r.type === 'like');
        const dislikes = results.filter(r => r.type === 'dislike');

        callback(null, { likes, dislikes, 
            total_likes: likes.length, 
            total_dislikes: dislikes.length, 
            score: likes.length - dislikes.length
        });
    });
}

function getLikesByUser(userId, callback) {
    const sql = `
        SELECT l.*, 
               CASE 
                   WHEN l.target_type = 'post' THEN p.title 
                   WHEN l.target_type = 'comment' THEN CONCAT('Comment on: ', p2.title)
                   ELSE 'Unknown'
               END as target_title
        FROM likes l
        LEFT JOIN posts p ON l.target_type = 'post' AND l.target_id = p.id
        LEFT JOIN comments c ON l.target_type = 'comment' AND l.target_id = c.id
        LEFT JOIN posts p2 ON c.post_id = p2.id
        WHERE l.author_id = ?
        ORDER BY l.created_at DESC`;
    
    db.query(sql, [userId], (err, results) => {
        if (err) return callback(err);
        callback(null, results);
    });
}

function getAllLikes(callback) {
    const sql = `
        SELECT l.*, u.login as author_login, u.full_name as author_name,
               CASE 
                   WHEN l.target_type = 'post' THEN p.title 
                   WHEN l.target_type = 'comment' THEN CONCAT('Comment on: ', p2.title)
                   ELSE 'Unknown'
               END as target_title
        FROM likes l
        JOIN users u ON l.author_id = u.id
        LEFT JOIN posts p ON l.target_type = 'post' AND l.target_id = p.id
        LEFT JOIN comments c ON l.target_type = 'comment' AND l.target_id = c.id
        LEFT JOIN posts p2 ON c.post_id = p2.id
        ORDER BY l.created_at DESC`;
    
    db.query(sql, (err, results) => {
        if (err) return callback(err);
        callback(null, results);
    });
}

function getUserLikeForTarget(userId, targetType, targetId, callback) {
    const sql = 'SELECT * FROM likes WHERE author_id = ? AND target_type = ? AND target_id = ?';
    db.query(sql, [userId, targetType, targetId], (err, results) => {
        if (err) return callback(err);
        callback(null, results.length > 0 ? results[0] : null);
    });
}

function updateTargetLikeCount(targetType, targetId, callback) {
    const targetTable = targetType === 'post' ? 'posts' : 'comments';
    
    const sql = `
        UPDATE ${targetTable} 
        SET likes_count = (
            SELECT COALESCE(SUM(CASE WHEN type = 'like' THEN 1 WHEN type = 'dislike' THEN -1 ELSE 0 END), 0)
            FROM likes 
            WHERE target_type = ? AND target_id = ?
        )
        WHERE id = ?`;
    
    db.query(sql, [targetType, targetId, targetId], callback);
}

function updateUserRating(userId, callback) {
    const sql = `
        UPDATE users 
        SET rating = (
            SELECT COALESCE(SUM(
                CASE WHEN l.type = 'like' THEN 1 
                     WHEN l.type = 'dislike' THEN -1 
                     ELSE 0 END
            ), 0)
            FROM likes l
            LEFT JOIN posts p ON l.target_type = 'post' AND l.target_id = p.id
            LEFT JOIN comments c ON l.target_type = 'comment' AND l.target_id = c.id
            WHERE p.author_id = ? OR c.author_id = ?
        )
        WHERE id = ?`;
    
    db.query(sql, [userId, userId, userId], callback);
}

module.exports = { addLike, deleteLike, deleteLikeByUserAndTarget, getLikesByTarget, getLikesByUser, getAllLikes, getUserLikeForTarget, updateTargetLikeCount, updateUserRating };
