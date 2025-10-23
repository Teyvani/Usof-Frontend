import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createPost } from '../store/slices/postsSlice';
import { selectUser, selectIsAuthenticated } from '../store/slices/authSlice';
import axios from '../services/axios';
//import '../styles/createPost.css';

const CreatePostPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const user = useSelector(selectUser);
    const isAuthenticated = useSelector(selectIsAuthenticated);

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        categories: []
    });
    const [images, setImages] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [imagePreviews, setImagePreviews] = useState([]);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        const fetchCategories = async () => {
            try {
                const response = await axios.get('/categories');
                setCategories(response.data.categories);
            } catch (error) {
                console.error('Failed to fetch categories:', error);
            }
        };
        fetchCategories();
    }, [isAuthenticated, navigate]);

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

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + images.length > 10) {
            setError('Maximum 10 images allowed');
            return;
        }
        setImages(prev => [...prev, ...files]);

        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviews(prev => [...prev, reader.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
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
        setLoading(true);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('title', formData.title);
            formDataToSend.append('content', formData.content);
            formDataToSend.append('categories', formData.categories.join(','));

            images.forEach(image => {
                formDataToSend.append('postImages', image);
            });

            const result = await dispatch(createPost(formDataToSend)).unwrap();
            navigate(`/posts/${result.id}`);
        } catch (error) {
            setError(error || 'Failed to create post');
            setLoading(false);
        }
    };

    return (
        <div className="create-post-page">
            <div className="create-post-container">
                <h1>Ask a Question</h1>
                {error && (<div className="error-message">{error}</div>)}

                <form onSubmit={handleSubmit} className="create-post-form">
                    <div className="form-group">
                        <label htmlFor="title">Title *</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="What's your question? Be specific."
                            required
                            maxLength="200"
                        />
                        <small>{formData.title.length}/200 characters</small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="content">Description *</label>
                        <textarea
                            id="content"
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            placeholder="Provide details about your question..."
                            required
                            rows="10"
                        />
                    </div>

                    <div className="form-group">
                        <label>Categories * (Select at least one)</label>
                        <div className="categories-grid">
                            {categories.map(category => (
                                <label key={category.id} className="category-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={formData.categories.includes(category.id)}
                                        onChange={() => handleCategoryChange(category.id)}
                                    />
                                    <span>{category.title}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="images">Images (Optional, max 10)</label>
                        <input
                            type="file"
                            id="images"
                            accept="image/*"
                            multiple
                            onChange={handleImageChange}
                            disabled={images.length >= 10}
                        />
                        <small>Current: {images.length}/10</small>

                        {imagePreviews.length > 0 && (
                            <div className="image-previews">
                                {imagePreviews.map((preview, index) => (
                                    <div key={index} className="image-preview">
                                        <img src={preview} alt={`Preview ${index + 1}`} />
                                        <button type="button" onClick={() => removeImage(index)} className="remove-image-btn"> × </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Post Question'}</button>
                        <button type="button" onClick={() => navigate('/posts')} className="btn-secondary" > Cancel </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreatePostPage;
