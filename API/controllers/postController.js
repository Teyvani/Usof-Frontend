const postModel = require('../models/postModel');
const categoryModel = require('../models/categoryModel');
const fs = require('fs');

exports.createPost = (req, res) => {
    try {
        const author_id = req.session.user.id;
        const { title, content, categories } = req.body;

        let categoryArray = [];
        if (categories) {
            if (Array.isArray(categories)) {
                categoryArray = categories.map(id => parseInt(id));
            } else if (typeof categories === 'string') {
                categoryArray = categories.split(',').map(id => parseInt(id.trim()));
            }
        }
        
        const imagePaths = req.files?.map(file => file.path) || [];

        if (categoryArray.length > 0) {
            categoryModel.validateCategoriesExist(categoryArray, (err, allExist) => {
                if (err) return res.status(500).json({ error: 'Internal server error' });
                if (!allExist) return res.status(400).json({ error: 'One or more category IDs do not exist' });
                createPostHelper();
            });
        } else { createPostHelper(); }

        function createPostHelper() {
            postModel.createPost({ author_id, title, content }, (err, results) => {
                if (err) {
                    console.error('Error creating post:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                const postId = results.insertId;
                if (categoryArray.length > 0) {
                    postModel.addCategoriesToPost(postId, categoryArray, (err) => {
                        if (err) console.error('Error adding categories:', err);
                    });
                }

                if (imagePaths.length > 0) {
                    postModel.addImagesToPost(postId, imagePaths, (err) => {
                        if (err) console.error('Error adding images:', err);
                    });
                }

                postModel.getPostByID(postId, (err, newPost) => {
                    if (err) {
                        console.error('Error fetching new post:', err);
                        return res.status(500).json({ error: 'Internal server error' });
                    }

                    res.status(201).json({
                        message: 'Post created successfully',
                        post: newPost
                    });
                });
            });
        }
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getAllPosts = (req, res) => {
    try {
        const filters = {
            status: req.query.status || 'active',
            categories: req.query.categories ? req.query.categories.split(',').map(id => parseInt(id)) : null,
            dateFrom: req.query.date_from || null,
            dateTo: req.query.date_to || null,
            sortBy: req.query.sort_by || 'likes',
            limit: req.query.limit ? parseInt(req.query.limit) : 20,
            offset: req.query.offset ? parseInt(req.query.offset) : 0
        };

        if (req.session.user) {
            if (req.session.user.role !== 'admin') {
                filters.userId = req.session.user.id;
                filters.status = 'active';
            }
        } else filters.status = 'active';

        postModel.getAllPosts(filters, (err, posts) => {
            if (err) {
                console.error('Error fetching posts:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            res.json({
                posts,
                pagination: {
                    limit: filters.limit,
                    offset: filters.offset,
                    hasMore: posts.length === filters.limit
                }
            });
        });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getPostById = (req, res) => {
    try {
        const postId = req.params.post_id;

        postModel.getPostByID(postId, (err, post) => {
            if (err) {
                console.error('Error fetching post:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (!post) { return res.status(404).json({ error: 'Post not found' }); }

            const user = req.session.user;
            if (post.status === 'inactive') {
                if (!user || (user.role !== 'admin' && user.id !== post.author_id)){
                    return res.status(404).json({ error: 'Post not found' });
                }
            }

            res.json({ post });
        });
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updatePost = (req, res) => {
    try {
        const postId = req.params.post_id;
        const userId = req.session.user.id;
        const userRole = req.session.user.role;
        const { title, content, categories, status } = req.body;
        
        let categoryArray = [];
        if (categories) {
            if (Array.isArray(categories)) {
                categoryArray = categories.map(id => parseInt(id));
            } else if (typeof categories === 'string') {
                categoryArray = categories.split(',').map(id => parseInt(id.trim()));
            }
        }

        postModel.getPostByID(postId, (err, post) => {
            if (err) {
                console.error('Error fetching post for an update:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (!post) { return res.status(404).json({ error: 'Post not found' }); }

            const editPermission = userRole === 'admin' || post.author_id === userId;
            if (!editPermission) { return res.status(403).json({ error: 'You can only edit your own posts' }); }

            if (categoryArray.length > 0) {
                categoryModel.validateCategoriesExist(categoryArray, (err, allExist) => {
                    if (err) {
                        return res.status(500).json({ error: 'Internal server error' });
                    }
                    if (!allExist) {
                        return res.status(400).json({ error: 'One or more category IDs do not exist' });
                    }
                    updatePostHelper();
                });
            } else {
                updatePostHelper();
            }

            function updatePostHelper() {
                const updateFields = {};
                if (title !== undefined) updateFields.title = title;
                if (content !== undefined && post.author_id === userId) updateFields.content = content;
                if (status !== undefined && userRole === 'admin') updateFields.status = status;

                postModel.updatePost(postId, updateFields, (err) => {
                    if (err) {
                        console.error('Error updating post:', err);
                        return res.status(500).json({ error: 'Internal server error' });
                    }

                    if (categoryArray.length > 0) {
                        postModel.addCategoriesToPost(postId, categoryArray, (err) => {
                            if (err) console.error('Error updating categories:', err);
                        });
                    }

                    postModel.getPostByID(postId, (err, updatedPost) => {
                        if (err) {
                            console.error('Error fetching updated post:', err);
                            return res.status(500).json({ error: 'Internal server error' });
                        }
                
                        res.json({
                            message: 'Post updated successfully',
                            post: updatedPost
                        });
                    });
                });
            }
        });
    } catch (error) {
        console.error('Error updating a post:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

exports.deletePost = (req, res) => {
    try {
        const postId = req.params.post_id;
        const userId = req.session.user.id;
        const userRole = req.session.user.role;

        postModel.getPostByID(postId, (err, post) => {
            if (err) {
                console.error('Error fetching post for deletion:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (!post)  return res.status(404).json({ error: 'Post not found' });

            const deletePermission = userRole === 'admin' || post.author_id === userId;
            if (!deletePermission) { return res.status(403).json({ error: 'You can only delete your own posts' }); }
            if (post.images && post.images.length > 0) {
                post.images.forEach(imagePath => {
                    fs.unlink(imagePath, (err) => {
                        if (err) console.error('Error deleting image file:', err);
                    });
                });
            }

            postModel.deletePost(postId, (err) => {
                if (err) {
                    console.error('Error deleting post:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                res.json({ message: 'Post deleted successfully' });
            });
        });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getPostCategories = (req, res) => {
    try {
        const postId = req.params.post_id;

        postModel.getPostCategories(postId, (err, categories) => {
            if (err) {
                console.error('Error fetching post categories:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            res.json({ categories });
        });
    } catch (error) {
        console.error('Error fetching post categories:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
