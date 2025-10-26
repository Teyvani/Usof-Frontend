function emptyBody(req, res, next) {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: 'Request body cannot be empty' });
    }

    next();
}

function createPost(req, res, next){
    const { title, content, categories } = req.body;
    if (!title || title.trim() === '') {
        return res.status(400).json({ error: 'Post title is required' });
    }
    if (title.length < 5 || title.length > 255) {
        return res.status(400).json({ error: 'Post title must be between 5 and 255 characters' });
    }
    if (!content || content.trim() === '') {
        return res.status(400).json({ error: 'Post content is required' });
    }
    if (content.length < 10) {
        return res.status(400).json({ error: 'Post content must be at least 10 characters long' });
    }
    if (content.length > 10000) {
        return res.status(400).json({ error: 'Post content cannot exceed 10,000 characters' });
    }
    if (categories) {
        let categoryArray;
        if (typeof categories === 'string') {
            categoryArray = categories.split(',').map(id => parseInt(id.trim()));
        } else if (Array.isArray(categories)) {
            categoryArray = categories;
        } else {
            return res.status(400).json({ error: 'Categories must be an array or comma-separated string' });
        }
        if (categoryArray.length === 0) return res.status(400).json({ error: 'At least one category is required if categories are provided' });
        if (categoryArray.length > 5) return res.status(400).json({ error: 'Maximum 5 categories allowed per post' });
        
        for (let categoryId of categoryArray) {
            if (isNaN(categoryId) || categoryId <= 0) {
                return res.status(400).json({ error: 'Invalid category ID provided' });
            }
        }
    }
    if (req.files && req.files.length > 0) {
        if (req.files.length > 10) {
            return res.status(400).json({ error: 'Maximum 10 images allowed per post' });
        }

        for (let file of req.files) {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.mimetype)) {
                return res.status(400).json({ error: 'Only JPEG, PNG, GIF, and WebP images are allowed' });
            }

            if (file.size > 5 * 1024 * 1024) {
                return res.status(400).json({ error: 'Each image must be less than 5MB' });
            }
        }
    }

    next();
}

function updatePost(req, res, next) {
    const { title, content, categories, status } = req.body;

    if (title !== undefined) {
        if (typeof title !== 'string' || title.trim() === '') {
            return res.status(400).json({ error: 'Post title cannot be empty' });
        }
        if (title.length < 5 || title.length > 255) {
            return res.status(400).json({ error: 'Post title must be between 5 and 255 characters' });
        }
    }
    if (content !== undefined) {
        if (typeof content !== 'string' || content.trim() === '') {
            return res.status(400).json({ error: 'Post content cannot be empty' });
        }
        
        if (content.length < 10) {
            return res.status(400).json({ error: 'Post content must be at least 10 characters long' });
        }

        if (content.length > 10000) {
            return res.status(400).json({ error: 'Post content cannot exceed 10,000 characters' });
        }
    }
    if (categories !== undefined) {
        if (!Array.isArray(categories)) {
            return res.status(400).json({ error: 'Categories must be an array' });
        }
        
        if (categories.length === 0) {
            return res.status(400).json({ error: 'At least one category is required if categories are provided' });
        }
        
        if (categories.length > 5) {
            return res.status(400).json({ error: 'Maximum 5 categories allowed per post' });
        }
        for (let categoryId of categories) {
            if (!Number.isInteger(parseInt(categoryId)) || parseInt(categoryId) <= 0) {
                return res.status(400).json({ error: 'Invalid category ID provided' });
            }
        }
    }

    if (status !== undefined) {
        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({ error: 'Status must be either "active" or "inactive"' });
        }
    }

    next();
}

function createComment(req, res, next) {
    const { content, parent_comment_id } = req.body;

    if (!content || content.trim() === '') {
        return res.status(400).json({ error: 'Comment content is required' });
    }
    if (content.length < 1) {
        return res.status(400).json({ error: 'Comment content cannot be empty' });
    }
    if (content.length > 1000) {
        return res.status(400).json({ error: 'Comment content cannot exceed 1,000 characters' });
    }
    if (parent_comment_id !== undefined && parent_comment_id !== null) {
        if (!Number.isInteger(parseInt(parent_comment_id)) || parseInt(parent_comment_id) <= 0) {
            return res.status(400).json({ error: 'Invalid parent comment ID' });
        }
    }

    next();
}

function updateComment(req, res, next) {
    const { content, status } = req.body;

    if (content !== undefined) {
        if (typeof content !== 'string' || content.trim() === '') {
            return res.status(400).json({ error: 'Comment content cannot be empty' });
        }
        if (content.length > 1000) {
            return res.status(400).json({ error: 'Comment content cannot exceed 1,000 characters' });
        }
    }
    if (status !== undefined) {
        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({ error: 'Status must be either "active" or "inactive"' });
        }
    }
    if (content === undefined && status === undefined) {
        return res.status(400).json({ error: 'At least one field (content or status) must be provided' });
    }

    next();
}

function createCategory(req, res, next) {
    const { title } = req.body;

    if (!title || title.trim() === '') {
        return res.status(400).json({ error: 'Category title is required' });
    }
    if (title.length < 2 || title.length > 100) {
        return res.status(400).json({ error: 'Category title must be between 2 and 100 characters' });
    }
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(title)) {
        return res.status(400).json({ error: 'Category title can only contain letters, numbers, spaces, hyphens, and underscores' });
    }

    next();
}

function updateCategory(req, res, next) {
    const { title } = req.body;

    if (!title || title.trim() === '') {
        return res.status(400).json({ error: 'Category title is required' });
    }
    if (title.length < 2 || title.length > 100) {
        return res.status(400).json({ error: 'Category title must be between 2 and 100 characters' });
    }
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(title)) {
        return res.status(400).json({ error: 'Category title can only contain letters, numbers, spaces, hyphens, and underscores' });
    }

    next();
}

function addLike(req, res, next) {
    const { type } = req.body;

    if (!type || !['like', 'dislike'].includes(type)) {
        return res.status(400).json({ error: 'Like type must be either "like" or "dislike"' });
    }

    next();
}

function validateId(req, res, next) {
    const params = ['post_id', 'comment_id', 'category_id', 'user_id'];
    
    for (let param of params) {
        if (req.params[param]) {
            const id = parseInt(req.params[param]);
            if (!Number.isInteger(id) || id <= 0) {
                return res.status(400).json({ error: `Invalid ${param.replace('_', ' ')}` });
            }
        }
    }

    next();
}

module.exports = {emptyBody, createPost, updatePost, createComment, updateComment, createCategory, updateCategory, addLike, validateId};
