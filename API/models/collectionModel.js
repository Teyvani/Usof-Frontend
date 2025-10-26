const db = require('../db.js');

function createCollection({ user_id, title, description, is_private }, callback) {
    const sql = 'INSERT INTO collections (user_id, title, description, is_private) VALUES (?, ?, ?, ?)';
    db.query(sql, [user_id, title, description || null, is_private || false], (err, results) => {
        if (err) return callback(err);
        callback(null, results);
    });
}

function getUserCollections(userId, callback) {
    const sql = `
        SELECT c.*, COUNT(cp.post_id) as posts_count
        FROM collections c
        LEFT JOIN collection_posts cp ON c.id = cp.collection_id
        WHERE c.user_id = ?
        GROUP BY c.id
        ORDER BY c.created_at DESC`;
    
    db.query(sql, [userId], (err, results) => {
        if (err) return callback(err);
        callback(null, results);
    });
}

function getPublicCollections(callback) {
    const sql = `
        SELECT c.*, u.login as owner_login, u.full_name as owner_name, 
               COUNT(cp.post_id) as posts_count
        FROM collections c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN collection_posts cp ON c.id = cp.collection_id
        WHERE c.is_private = FALSE
        GROUP BY c.id
        ORDER BY c.created_at DESC`;
    
    db.query(sql, (err, results) => {
        if (err) return callback(err);
        callback(null, results);
    });
}

function getCollectionById(collectionId, callback) {
    const sql = `
        SELECT c.*, u.login as owner_login, u.full_name as owner_name,
               COUNT(cp.post_id) as posts_count
        FROM collections c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN collection_posts cp ON c.id = cp.collection_id
        WHERE c.id = ?
        GROUP BY c.id`;
    
    db.query(sql, [collectionId], (err, results) => {
        if (err) return callback(err);
        callback(null, results.length > 0 ? results[0] : null);
    });
}

function updateCollection(collectionId, fields, callback) {
    const fieldsToUpdate = [];
    const values = [];
    
    for (const field in fields) {
        if (['title', 'description', 'is_private'].includes(field)) {
            fieldsToUpdate.push(`${field} = ?`);
            values.push(fields[field]);
        }
    }
    
    if (fieldsToUpdate.length === 0) { return callback(new Error('No valid fields to update')); }
    values.push(collectionId);

    const sql = `UPDATE collections SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
    db.query(sql, values, (err, results) => {
        if (err) return callback(err);
        callback(null, results);
    });
}

function deleteCollection(collectionId, callback) {
    const sql = 'DELETE FROM collections WHERE id = ?';
    db.query(sql, [collectionId], (err, results) => {
        if (err) return callback(err);
        callback(null, results);
    });
}

function addPostToCollection(collectionId, postId, callback) {
    const sql = 'INSERT INTO collection_posts (collection_id, post_id) VALUES (?, ?)';
    db.query(sql, [collectionId, postId], (err, results) => {
        if (err) return callback(err);
        callback(null, results);
    });
}

function removePostFromCollection(collectionId, postId, callback) {
    const sql = 'DELETE FROM collection_posts WHERE collection_id = ? AND post_id = ?';
    db.query(sql, [collectionId, postId], (err, results) => {
        if (err) return callback(err);
        callback(null, results);
    });
}

function getCollectionPosts(collectionId, callback) {
    const sql = `
        SELECT p.*, u.login as author_login, u.full_name as author_name,
               GROUP_CONCAT(DISTINCT c.title) AS categories,
               GROUP_CONCAT(DISTINCT i.image_path) AS images
        FROM collection_posts cp
        JOIN posts p ON cp.post_id = p.id
        JOIN users u ON p.author_id = u.id
        LEFT JOIN post_categories pc ON p.id = pc.post_id
        LEFT JOIN categories c ON pc.category_id = c.id
        LEFT JOIN post_images i ON p.id = i.post_id
        WHERE cp.collection_id = ? AND p.status = 'active'
        GROUP BY p.id
        ORDER BY cp.id DESC`;
    
    db.query(sql, [collectionId], (err, results) => {
        if (err) return callback(err);
        results.forEach(r => {
            r.categories = r.categories ? r.categories.split(',') : [];
            r.images = r.images ? r.images.split(',') : [];
        });
        callback(null, results);
    });
}

function isPostInCollection(collectionId, postId, callback) {
    const sql = 'SELECT * FROM collection_posts WHERE collection_id = ? AND post_id = ?';
    db.query(sql, [collectionId, postId], (err, results) => {
        if (err) return callback(err);
        callback(null, results.length > 0);
    });
}

function getUserCollectionsByTitle(userId, title, callback) {
    const sql = 'SELECT * FROM collections WHERE user_id = ? AND title = ?';
    db.query(sql, [userId, title], (err, results) => {
        if (err) return callback(err);
        callback(null, results.length > 0 ? results[0] : null);
    });
}

module.exports = {
    createCollection,
    getUserCollections,
    getPublicCollections,
    getCollectionById,
    updateCollection,
    deleteCollection,
    addPostToCollection,
    removePostFromCollection,
    getCollectionPosts,
    isPostInCollection,
    getUserCollectionsByTitle
};
