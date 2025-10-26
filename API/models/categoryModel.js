const db = require('../db.js');

function getAllCategories(callback){
    const sql = `SELECT * FROM categories`;
    db.query(sql, (err, results) => {
        if(err) return callback(err);
        callback(null, results);
    });
}

function getCategoryById(id, callback){
    const sql = `SELECT * FROM categories WHERE id = ?`;
    db.query(sql, [id], (err, results) => {
        if(err) return callback(err);
        callback(null, results.length > 0 ? results[0] : null);
    });
}

function getCategoryByTitle(title, callback){
    const sql = `SELECT * FROM categories WHERE title = ?`;
    db.query(sql, [title], (err, results) => {
        if(err) return callback(err);
        callback(null, results.length > 0 ? results[0] : null);
    });
}

function createCategory(title, callback){
    const sql = `INSERT INTO categories (title) VALUES (?)`;
    db.query(sql, [title], (err, results) => {callback(err, results)});
}

function updateCategory(id, fields, callback){
    const fieldsToUpdate = [];
    const values = [];
    for (const field in fields) {
        fieldsToUpdate.push(`${field} = ?`);
        values.push(fields[field]);
    }
    values.push(id);

    const sql = `UPDATE categories SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
    db.query(sql, values, (err, results) => {
        if (err) return callback(err);
        callback(null, results);
    });
}

function deleteCategory(id, callback){
    const sql = `DELETE FROM categories WHERE id = ?`;
    db.query(sql, [id], (err, results) => {
        if(err) return callback(err);
        callback(null, results);
    });
}

function getCategoryPosts(categoryId, callback){
    const sql = `
        SELECT p.*, u.login as author_login, u.full_name as author_name,
               GROUP_CONCAT(DISTINCT c2.title) AS categories,
               GROUP_CONCAT(DISTINCT i.image_path) AS images
        FROM posts p
        JOIN post_categories pc ON p.id = pc.post_id
        JOIN users u ON p.author_id = u.id
        LEFT JOIN post_categories pc2 ON p.id = pc2.post_id
        LEFT JOIN categories c2 ON pc2.category_id = c2.id
        LEFT JOIN post_images i ON p.id = i.post_id
        WHERE pc.category_id = ? AND p.status = 'active'
        GROUP BY p.id
        ORDER BY p.published_at DESC`;
    
    db.query(sql, [categoryId], (err, results) => {
        if (err) return callback(err);
        results.forEach(r => {
            r.categories = r.categories ? r.categories.split(',') : [];
            r.images = r.images ? r.images.split(',') : [];
        });
        callback(null, results);
    });
}

function validateCategoriesExist(categoryIds, callback) {
    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
        return callback(null, true);
    }
    const placeholders = categoryIds.map(() => '?').join(',');
    const sql = `SELECT COUNT(*) as count FROM categories WHERE id IN (${placeholders})`;
    
    db.query(sql, categoryIds, (err, results) => {
        if (err) return callback(err);
        const allExist = results[0].count === categoryIds.length;
        callback(null, allExist);
    });
}

module.exports = {getAllCategories, getCategoryById, getCategoryByTitle, createCategory, updateCategory, deleteCategory, getCategoryPosts, validateCategoriesExist};
