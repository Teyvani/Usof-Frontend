import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { updatePost, fetchPostById, selectCurrentPost, selectPostsLoading } from '../store/slices/postsSlice';
import { selectUser, selectIsAuthenticated } from '../store/slices/authSlice';
import axios from '../services/axios';
import '../styles/post-details.css';

const EditPostPage = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const user = useSelector(selectUser);
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const post = useSelector(selectCurrentPost);
    const loading = useSelector(selectPostsLoading);

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        categories: []
    });
    const [categories, setCategories] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        dispatch(fetchPostById(id));
        const fetchCategories = async () => {
            try {
                const response = await axios.get('/categories');
                setCategories(response.data.categories);
            } catch (error) {
                console.error('Failed to fetch categories:', error);
            }
        };
        fetchCategories();
    }, [isAuthenticated, navigate, id, dispatch]);

    useEffect(() => {
        if (post && post.id === parseInt(id)) {
            if (user && user.id !== post.author_id && user.role !== 'admin') {
                navigate('/');
                return;
            }

            setFormData({
                title: post.title || '',
                content: post.content || '',
                categories: post.category_ids || []
            });
        }
    }, [post, id, user, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCategoryChange = (categoryId) => {
        setFormData(prev => {
            const currentCategories = prev.categories;
            if (currentCategories.includes(categoryId)) {
                return {
                    ...prev,
                    categories: currentCategories.filter(id => id !== categoryId)
                };
            } else {
                return {
                    ...prev,
                    categories: [...currentCategories, categoryId]
                };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.title.trim() || !formData.content.trim()) {
            setError('Title and content are required');
            return;
        }
        if (formData.categories.length === 0) {
            setError('Please select at least one category');
            return;
        }
        setSubmitting(true);

        try {
            await dispatch(updatePost({
                postId: id,
                data: {
                    title: formData.title,
                    content: formData.content,
                    categories: formData.categories
                }
            })).unwrap();

            navigate(`/posts/${id}`);
        } catch (error) {
            setError(error || 'Failed to update post');
            setSubmitting(false);
        }
    };

    if (loading && !post) { return <div className="loading">Loading post...</div>; }
    if (!post) { return <div className="error-message">Post not found</div>; }

    return (
        <div className="create-post-page">
            <div className="home-background"></div>
            <div className="create-post-container">
                <h1>Edit Post</h1>
                {error && (<div className="error-message">{error}</div>)}

                <form onSubmit={handleSubmit} className="create-post-form">
                    <div className="form-group">
                        <label>Title *</label>
                        <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="What's your question?" required maxLength="200"/>
                        <small>{formData.title.length}/200 characters</small>
                    </div>
                    <div className="form-group">
                        <label>Content *</label>
                        <textarea name="content" value={formData.content} onChange={handleChange} placeholder="Provide details..." required rows="10"/>
                    </div>
                    <div className="form-group">
                        <label>Categories * (Select at least one)</label>
                        <div className="categories-grid">
                            {categories.map(category => (
                                <label key={category.id} className="category-checkbox">
                                    <input type="checkbox" checked={formData.categories.includes(category.id)} onChange={() => handleCategoryChange(category.id)}/>
                                    <span>{category.title}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save Changes'}</button>
                        <button type="button" onClick={() => navigate(`/posts/${id}`)} className="btn-secondary">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditPostPage;
