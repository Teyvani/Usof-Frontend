const categoryModel = require('../models/categoryModel');

exports.getAllCategories = (req, res) => {
    try {
        categoryModel.getAllCategories((err, categories) => {
            if(err) {
                console.error('Error fetching categories:', err);
                return res.status(500).json({ error: 'Internal server error '});
            }

            res.json({ categories });
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getCategoryById = (req, res) => {
    try {
        const categoryId = req.params.category_id;

        categoryModel.getCategoryById(categoryId, (err, category) => {
            if (err) {
                console.error('Error fetching category:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (!category) { return res.status(404).json({ error: 'Category not found' });}
            res.json({ category });
        });
    } catch (error) {
        console.error('Unexpected error fetching category:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getCategoryPosts = (req, res) => {
    try {
        const categoryId = req.params.category_id;

        categoryModel.getCategoryById(categoryId, (err, category) => {
            if (err) {
                console.error('Error fetching category:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (!category) { return res.status(404).json({ error: 'Category not found' }); }

            categoryModel.getCategoryPosts(categoryId, (err, posts) => {
                if (err) {
                    console.error('Error fetching category posts:', err);
                    return res.status(500).json({ error: 'Internal server error.' });
                }

                res.json({
                    category,
                    posts
                });
            });
        });
    } catch (error) {
        console.error('Error fetching category posts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.createCategory = (req, res) => {
    try {
        const { title } = req.body;

        if (!title || title.trim() === '') {
            return res.status(400).json({ error: 'Category title is required' });
        }

        categoryModel.getCategoryByTitle(title.trim(), (err, existingCategory) => {
            if (err) {
                console.error('Error checking existing category:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (existingCategory) {return res.status(400).json({ error: 'Category with this title already exists' });}

            categoryModel.createCategory(title.trim(), (err, results) => {
                if (err) {
                    console.error('Error creating category:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                categoryModel.getCategoryById(results.insertId, (err, newCategory) => {
                    if (err) {
                        console.error('Error fetching new category:', err);
                        return res.status(500).json({ error: 'Internal server error' });
                    }
        
                    res.status(201).json({
                        message: 'Category created successfully',
                        category: newCategory
                    });
                });
            });
        });
    } catch (error) {
        console.error('Unexpected error creating category:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateCategory = (req, res) => {
    try {
        const categoryId = req.params.category_id;
        const { title } = req.body;

        if (!title || title.trim() === '') {
            return res.status(400).json({ error: 'Category title is required' });
        }

        categoryModel.getCategoryById(categoryId, (err, category) => {
            if (err) {
                console.error('Error fetching category:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (!category) {return res.status(404).json({ error: 'Category not found' });}

            categoryModel.getCategoryByTitle(title.trim(), (err, existingCategory) => {
                if (err) {
                    console.error('Error checking existing category:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }
                if (existingCategory && existingCategory.id != categoryId) {
                    return res.status(400).json({ error: 'Category with this title already exists' });
                }

                categoryModel.updateCategory(categoryId, { title: title.trim() }, (err) => {
                    if (err) {
                        console.error('Error updating category:', err);
                        return res.status(500).json({ error: 'Internal server error' });
                    }

                    categoryModel.getCategoryById(categoryId, (err, updatedCategory) => {
                        if (err) {
                            console.error('Error fetching updated category:', err);
                            return res.status(500).json({ error: 'Internal server error' });
                        }

                        res.json({
                            message: 'Category updated successfully',
                            category: updatedCategory
                        });
                    });
                });
            });
        });
    } catch (error) {
        console.error('Unexpected error updating category:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deleteCategory = (req, res) => {
    try {
        const categoryId = req.params.category_id;

        categoryModel.getCategoryById(categoryId, (err, category) => {
            if (err) {
                console.error('Error fetching category:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (!category) {return res.status(404).json({ error: 'Category not found' });}

            categoryModel.deleteCategory(categoryId, (err) => {
                if (err) {
                    console.error('Error deleting category:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                res.json({ message: 'Category deleted successfully' });
            });
        });
    } catch (error) {
        console.error('Unexpected error deleting category:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
