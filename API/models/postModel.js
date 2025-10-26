const db = require('../db.js');

function createPost({ author_id, title, content }, callback){
    const sql = 'INSERT INTO posts (author_id, title, content) VALUES (?, ?, ?)';
    db.query(sql, [author_id, title, content], (err, results) => {
        callback(err, results);
    });
}

function getAllPosts(filters = {}, callback){
    let sql = `
        SELECT p.*, u.login as author_login, u.full_name as author_name,
                u.profile_picture AS author_avatar,
               GROUP_CONCAT(DISTINCT c.title) AS categories,
               GROUP_CONCAT(DISTINCT c.id) AS category_ids,
               GROUP_CONCAT(DISTINCT i.image_path) AS images
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        LEFT JOIN post_categories pc ON p.id = pc.post_id
        LEFT JOIN categories c ON pc.category_id = c.id
        LEFT JOIN post_images i ON p.id = i.post_id
        WHERE 1=1`;
    const params = [];

    if (filters.userId) {
        sql += ' AND (p.status = ? OR (p.status = ? AND p.author_id = ?))';
        params.push('active', 'inactive', filters.userId);
    } else if (filters.status && filters.status !== 'all') {
        sql += ' AND p.status = ?';
        params.push(filters.status);
    }
    
    if (filters.categories && filters.categories.length > 0) {
        const placeholders = filters.categories.map(() => '?').join(',');
        sql += ` AND p.id IN (
            SELECT DISTINCT pc.post_id 
            FROM post_categories pc 
            WHERE pc.category_id IN (${placeholders})
        )`;
        params.push(...filters.categories);
    }
    if (filters.dateFrom) {
        sql += ' AND p.published_at >= ?';
        params.push(filters.dateFrom);
    }
    if (filters.dateTo) {
        sql += ' AND p.published_at <= ?';
        params.push(filters.dateTo);
    }   
    sql += ' GROUP BY p.id';
    if (filters.sortBy === 'date') {
        sql += ' ORDER BY p.published_at DESC';
    } else {
        sql += ' ORDER BY p.likes_count DESC, p.published_at DESC';
    }
    
    if (filters.limit) {
        sql += ' LIMIT ?';
        params.push(parseInt(filters.limit));
        if (filters.offset) {
            sql += ' OFFSET ?';
            params.push(parseInt(filters.offset));
        }
    }
    
    db.query(sql, params, (err, results) => {
        if (err) return callback(err);
        results.forEach(r => {
            r.categories = r.categories ? r.categories.split(',') : [];
            r.category_ids = r.category_ids ? r.category_ids.split(',').map(id => parseInt(id)) : [];
            r.images = r.images ? r.images.split(',') : [];
        });
        callback(null, results);
    });
}

function getPostByID(id, callback) {
    const sql = `
        SELECT p.*, u.login as author_login, u.full_name as author_name, u.profile_picture as author_avatar,
               GROUP_CONCAT(DISTINCT c.title) AS categories,
               GROUP_CONCAT(DISTINCT c.id) AS category_ids,
               GROUP_CONCAT(DISTINCT i.image_path) AS images
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        LEFT JOIN post_categories pc ON p.id = pc.post_id
        LEFT JOIN categories c ON pc.category_id = c.id
        LEFT JOIN post_images i ON p.id = i.post_id
        WHERE p.id = ?
        GROUP BY p.id`;
    
    db.query(sql, [id], (err, results) => {
        if (err) return callback(err);
        if (!results.length) return callback(null, null);

        const post = results[0];
        post.categories = post.categories ? post.categories.split(',') : [];
        post.category_ids = post.category_ids ? post.category_ids.split(',').map(id => parseInt(id)) : [];
        post.images = post.images ? post.images.split(',') : [];
        callback(null, post);
    });
}

function updatePost(id, fields, callback){
    const fieldsToUpdate = [];
    const values = [];
    for (const field in fields) {
        fieldsToUpdate.push(`${field} = ?`);
        values.push(fields[field]);
    }
    values.push(id);

    const sql = `UPDATE posts SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
    db.query(sql, values, (err, results) => {
        if (err) return callback(err);
        callback(null, results);
    });
}

function deletePost(id, callback){
    const sql = `DELETE FROM posts WHERE id = ?`;
    db.query(sql, [id], (err, results) => {
        if(err) return callback(err);
        callback(null, results);
    });
}

function getPostsByUserId(userId, includeInactive = false, callback) {
    let sql = `
        SELECT p.*, 
               GROUP_CONCAT(DISTINCT c.title) AS categories,
               GROUP_CONCAT(DISTINCT i.image_path) AS images
        FROM posts p
        LEFT JOIN post_categories pc ON p.id = pc.post_id
        LEFT JOIN categories c ON pc.category_id = c.id
        LEFT JOIN post_images i ON p.id = i.post_id
        WHERE p.author_id = ?`;
    
    if (!includeInactive) {
        sql += ' AND p.status = "active"';
    }
    sql += ' GROUP BY p.id ORDER BY p.published_at DESC';
    
    db.query(sql, [userId], (err, results) => {
        if (err) return callback(err);
        results.forEach(r => {
            r.categories = r.categories ? r.categories.split(',') : [];
            r.images = r.images ? r.images.split(',') : [];
        });
        callback(null, results);
    });
}

function addCategoriesToPost(postId, categoryIds, callback) {
    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
        return callback(null, { affectedRows: 0 });
    }
    
    const deleteSql = 'DELETE FROM post_categories WHERE post_id = ?';
    db.query(deleteSql, [postId], (err) => {
        if (err) return callback(err);
        
        const values = categoryIds.map(catId => [postId, catId]);
        const insertSql = `INSERT INTO post_categories (post_id, category_id) VALUES ?`;
        db.query(insertSql, [values], (err, results) => {
            if (err) return callback(err);
            callback(null, results);
        });
    });
}

function addImagesToPost(postId, imagePaths, callback){
    if (!Array.isArray(imagePaths) || imagePaths.length === 0) {
        return callback(null, { affectedRows: 0 });
    }
    
    const values = imagePaths.map(path => [postId, path]);
    const sql = `INSERT INTO post_images (post_id, image_path) VALUES ?`;
    db.query(sql, [values], (err, results) => {
        if (err) return callback(err);
        callback(null, results);
    });
}

function removeImagesFromPost(postId, callback) {
    const sql = 'DELETE FROM post_images WHERE post_id = ?';
    db.query(sql, [postId], callback);
}

function getPostCategories(postId, callback) {
    const sql = `
        SELECT c.id, c.title
        FROM categories c
        JOIN post_categories pc ON c.id = pc.category_id
        WHERE pc.post_id = ?`;
    
    db.query(sql, [postId], callback);
}

function updatePostStats(postId, callback) {
    const updateLikesCountSql = `
        UPDATE posts 
        SET likes_count = (
            SELECT COALESCE(SUM(CASE WHEN type = 'like' THEN 1 WHEN type = 'dislike' THEN -1 ELSE 0 END), 0)
            FROM likes 
            WHERE target_type = 'post' AND target_id = ?
        )
        WHERE id = ?`;
    
    const updateCommentsCountSql = `
        UPDATE posts 
        SET comments_count = (
            SELECT COUNT(*) 
            FROM comments 
            WHERE post_id = ? AND status = 'active'
        )
        WHERE id = ?`;
    
    db.query(updateLikesCountSql, [postId, postId], (err) => {
        if (err) return callback(err);
        db.query(updateCommentsCountSql, [postId, postId], callback);
    });
}

module.exports = {createPost, getAllPosts, getPostByID, updatePost, deletePost, getPostsByUserId, addCategoriesToPost, addImagesToPost, removeImagesFromPost, getPostCategories, updatePostStats};
