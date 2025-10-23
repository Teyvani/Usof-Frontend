import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { updatePost, fetchPostById, selectCurrentPost, selectPostsLoading } from '../store/slices/postsSlice';
import { selectUser, selectIsAuthenticated } from '../store/slices/authSlice';
import axios from '../services/axios';

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
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
            <div style={{ background: 'white', padding: '30px', borderRadius: '8px' }}>
                <h1 style={{ color: '#1e40af', marginBottom: '30px' }}>Edit Post</h1>
                {error && (
                    <div style={{ background: '#fee', color: '#c00', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '25px' }}>
                        <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>Title *</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="What's your question?"
                            required
                            maxLength="200"
                            style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '15px' }}
                        />
                        <small style={{ display: 'block', color: '#6b7280', marginTop: '5px' }}>
                            {formData.title.length}/200 characters
                        </small>
                    </div>

                    <div style={{ marginBottom: '25px' }}>
                        <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                            Content *
                        </label>
                        <textarea
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            placeholder="Provide details..."
                            required
                            rows="10"
                            style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '15px', resize: 'vertical' }}
                        />
                    </div>

                    <div style={{ marginBottom: '25px' }}>
                        <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                            Categories * (Select at least one)
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                            {categories.map(category => (
                                <label key={category.id} style={{ display: 'flex', alignItems: 'center', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.categories.includes(category.id)}
                                        onChange={() => handleCategoryChange(category.id)}
                                        style={{ marginRight: '8px' }}
                                    />
                                    <span>{category.title}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                        <button type="submit" className="btn-primary" disabled={submitting} style={{ padding: '12px 30px', fontSize: '16px' }}>
                            {submitting ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button type="button" onClick={() => navigate(`/posts/${id}`)} className="btn-secondary" style={{ padding: '12px 30px', fontSize: '16px' }}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditPostPage;
