const db = require('../db.js');

function followPost(userId, postId, callback) {
    const checkSql = 'SELECT * FROM follow_posts WHERE user_id = ? AND post_id = ?';
    db.query(checkSql, [userId, postId], (err, results) => {
        if (err) return callback(err);
        if (results.length > 0) { return callback(new Error('Already following this post')); }
        
        const sql = 'INSERT INTO follow_posts (user_id, post_id) VALUES ( ?, ?)';
        db.query(sql, [userId, postId], (err, results) => {
            if (err) return callback(err);
            callback(null, results);
        });
    });
}

function unfollowPost(userId, postId, callback) {
    const sql = 'DELETE FROM follow_posts WHERE user_id = ? AND post_id = ?';
    db.query(sql, [userId, postId], (err, results) => {
        if (err) return callback(err);
        callback(null, results);
    });
}

function isUserFollowingPost(userId, postId, callback) {
    const sql = 'SELECT * FROM follow_posts WHERE user_id = ? AND post_id = ?';
    db.query(sql, [userId, postId], (err, results) => {
        if (err) return callback(err);
        callback(null, results.length > 0);
    });
}

function getUserFollowedPosts(userId, callback) {
    const sql = `
        SELECT p.*, u.login as author_login, u.full_name as author_name,
               GROUP_CONCAT(DISTINCT c.title) AS categories,
               GROUP_CONCAT(DISTINCT i.image_path) AS images,
               fp.id as follow_id
        FROM follow_posts fp
        JOIN posts p ON fp.post_id = p.id
        JOIN users u ON p.author_id = u.id
        LEFT JOIN post_categories pc ON p.id = pc.post_id
        LEFT JOIN categories c ON pc.category_id = c.id
        LEFT JOIN post_images i ON p.id = i.post_id
        WHERE fp.user_id = ? AND p.status = 'active'
        GROUP BY p.id, fp.id
        ORDER BY fp.id DESC`;

    db.query(sql, [userId], (err, results) => {
        if (err) return callback(err);
        results.forEach(r => {
            r.categories = r.categories ? r.categories.split(',') : [];
            r.images = r.images ? r.images.split(',') : [];
        });
        callback(null, results);
    });
}

function getPostFollowers(postId, callback) {
    const sql = `
        SELECT u.id, u.login, u.full_name, u.profile_picture, fp.id as follow_id
        FROM follow_posts fp
        JOIN users u ON fp.user_id = u.id
        WHERE fp.post_id = ?
        ORDER BY fp.id DESC`;

    db.query(sql, [postId], (err, results) => {
        if (err) return callback(err);
        callback(null, results);
    });
}

function getPostFollowersCount(postId, callback) {
    const sql = 'SELECT COUNT(*) as count FROM follow_posts WHERE post_id = ?';
    db.query(sql, [postId], (err, results) => {
        if (err) return callback(err);
        callback(null, results[0].count);
    });
}

function getUserFollowedPostsCount(userId, callback) {
    const sql = 'SELECT COUNT(*) as count FROM follow_posts WHERE user_id = ?';
    db.query(sql, [userId], (err, results) => {
        if (err) return callback(err);
        callback(null, results[0].count);
    });
}

function getFollowersForNotification(postId, callback) {
    const sql = 'SELECT user_id FROM follow_posts WHERE post_id = ?';
    db.query(sql, [postId], (err, results) => {
        if (err) return callback(err);
        callback(null, results.map(r => r.user_id));
    });
}

function getUserFollowedPostsPaginated(userId, limit = 20, offset = 0, callback) {
    const sql = `
        SELECT p.*, u.login as author_login, u.full_name as author_name,
               GROUP_CONCAT(DISTINCT c.title) AS categories,
               GROUP_CONCAT(DISTINCT i.image_path) AS images,
               fp.id as follow_id
        FROM follow_posts fp
        JOIN posts p ON fp.post_id = p.id
        JOIN users u ON p.author_id = u.id
        LEFT JOIN post_categories pc ON p.id = pc.post_id
        LEFT JOIN categories c ON pc.category_id = c.id
        LEFT JOIN post_images i ON p.id = i.post_id
        WHERE fp.user_id = ? AND p.status = 'active'
        GROUP BY p.id, fp.id
        ORDER BY fp.id DESC
        LIMIT ? OFFSET ?`;
    
    db.query(sql, [userId, limit, offset], (err, results) => {
        if (err) return callback(err);
        results.forEach(r => {
            r.categories = r.categories ? r.categories.split(',') : [];
            r.images = r.images ? r.images.split(',') : [];
        });
        callback(null, results);
    });
}

function getUserFollowStats(userId, callback) {
    const sql = `
        SELECT 
            COUNT(*) as total_follows,
            COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active_follows,
            COUNT(CASE WHEN p.status = 'inactive' THEN 1 END) as inactive_follows
        FROM follow_posts fp
        JOIN posts p ON fp.post_id = p.id
        WHERE fp.user_id = ?`;
    
    db.query(sql, [userId], (err, results) => {
        if (err) return callback(err);
        callback(null, results[0]);
    });
}

function cleanupFollowsForDeletedPost(postId, callback) {
    const sql = 'DELETE FROM follow_posts WHERE post_id = ?';
    db.query(sql, [postId], (err, results) => {
        if (err) return callback(err);
        callback(null, results);
    });
}

function getRecentlyFollowedPosts(limit = 10, callback) {
    const sql = `
        SELECT p.*, u.login as author_login, u.full_name as author_name,
               COUNT(fp.id) as recent_follows,
               GROUP_CONCAT(DISTINCT c.title) AS categories
        FROM follow_posts fp
        JOIN posts p ON fp.post_id = p.id
        JOIN users u ON p.author_id = u.id
        LEFT JOIN post_categories pc ON p.id = pc.post_id
        LEFT JOIN categories c ON pc.category_id = c.id
        WHERE p.status = 'active' AND fp.id >= (
            SELECT MAX(id) - 1000 FROM follow_posts
        )
        GROUP BY p.id
        ORDER BY recent_follows DESC, p.published_at DESC
        LIMIT ?`;
    
    db.query(sql, [limit], (err, results) => {
        if (err) return callback(err);
        results.forEach(r => {
            r.categories = r.categories ? r.categories.split(',') : [];
        });
        callback(null, results);
    });
}

module.exports = { 
    followPost, 
    unfollowPost, 
    isUserFollowingPost, 
    getUserFollowedPosts, 
    getPostFollowers, 
    getPostFollowersCount,
    getUserFollowedPostsCount,
    getFollowersForNotification,
    getUserFollowedPostsPaginated,
    getUserFollowStats,
    cleanupFollowsForDeletedPost,
    getRecentlyFollowedPosts 
};
