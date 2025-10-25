import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from '../services/axios';
import { Link, useSearchParams } from 'react-router-dom';
import {
    fetchPosts,
    selectPosts,
    selectPostsLoading,
    selectPostsError,
    selectPagination
} from '../store/slices/postsSlice';
import default_avatar from '../assets/icons/default_avatar.svg';

const PostsSection = () => {
    const dispatch = useDispatch();
    const [searchParams] = useSearchParams();
    const posts = useSelector(selectPosts);
    const loading = useSelector(selectPostsLoading);
    const error = useSelector(selectPostsError);
    const pagination = useSelector(selectPagination);

    const [filters, setFilters] = useState({
        sort_by: 'likes',
        status: 'all',
        categories: '',
        date_from: '',
        date_to: '',
        limit: 20,
        offset: 0
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [categories, setCategories] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);

    useEffect(() => {
        const searchFromUrl = searchParams.get('search');
        if (searchFromUrl) { setSearchTerm(searchFromUrl); }
    
        const fetchCategories = async () => {
            try {
                const { data } = await axios.get('/categories');
                setCategories(data.categories || []);
            } catch (error) {
                console.error('Failed to fetch categories:', error);
            }
        };
        fetchCategories();
    }, [searchParams]);

    useEffect(() => {
        dispatch(fetchPosts(filters));
    }, [dispatch, filters]);

    const handleCategoryToggle = (categoryId) => {
        setSelectedCategories(prev => {
            const newCategories = prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId];

            setFilters(prevFilters => ({
                ...prevFilters,
                categories: newCategories.join(','),
                offset: 0
            }));
        
            return newCategories;
        });
    }

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
            offset: 0
        }));
    };

    const handleLoadMore = () => {
        setFilters(prev => ({
            ...prev,
            offset: prev.offset + prev.limit
        }));
    };

    const filteredPosts = posts.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    return (
        <div className="posts-section">
            <div className="posts-section-header">
                <h1>All Questions</h1>
                <Link to="/posts/create" className="btn-primary">Ask Question</Link>
            </div>

            <div className="filters-section">
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Search posts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="filter-controls">
                    <div className='filter-row'>
                        <select
                            value={filters.sort_by}
                            onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                            className="filter-select"
                        >
                            <option value="likes">Most Liked</option>
                            <option value="date">Most Recent</option>
                        </select>

                        <input
                            type="date"
                            value={filters.date_from}
                            onChange={(e) => handleFilterChange('date_from', e.target.value)}
                            placeholder="From date"
                            className="filter-input"/>

                        <input
                            type="date"
                            value={filters.date_to}
                            onChange={(e) => handleFilterChange('date_to', e.target.value)}
                            placeholder="To date"
                            className="filter-input"
                        />

                        <button 
                            onClick={() => {
                                setFilters({
                                    sort_by: 'likes',
                                    categories: '',
                                    date_from: '',
                                    date_to: '',
                                    limit: 20,
                                    offset: 0
                                });
                                setSelectedCategories([]);
                            }}
                            className="btn-secondary">Clear Filters</button>
                    </div>
                    {categories.length > 0 && (
                        <div className="categories-filter">
                            <h3>Filter by Categories:</h3>
                            <div className="categories-grid">
                                {categories.map(category => (
                                    <label key={category.id} className="category-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={selectedCategories.includes(category.id)}
                                            onChange={() => handleCategoryToggle(category.id)}
                                        />
                                    <span>{category.title}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {error && (<div className="error-message">{error}</div>)}

            {loading && filters.offset === 0 && (
                <div className="loading">Loading posts...</div>
            )}

            <div className="posts-list">
                {filteredPosts.length === 0 && !loading ? (
                    <div className="no-posts">
                        <p>No posts found. Be the first to ask a question!</p>
                        <Link to="/posts/create" className="btn-primary">Create Post</Link>
                    </div>
                ) : (
                    filteredPosts.map(post => (
                        <div key={post.id} className="post-card">
                            <div className="post-stats">
                                <div className="stat">
                                    <span className="stat-number">{post.likes_count || 0}</span>
                                    <span className="stat-label">likes</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-number">{post.comments_count || 0}</span>
                                    <span className="stat-label">answers</span>
                                </div>
                            </div>

                            <div className="post-content">
                                <Link to={`/posts/${post.id}`} className="post-title">{post.title}</Link>
                                
                                <p className="post-excerpt">
                                    {post.content.substring(0, 200)}
                                    {post.content.length > 200 ? '...' : ''}
                                </p>

                                <div className="post-meta">
                                    <div className="post-categories">
                                        {post.categories && post.categories.map((category, idx) => (
                                            <span key={idx} className="category-badge">{category}</span>
                                        ))}
                                    </div>

                                    <div className="post-author">
                                        <span>asked by </span>
                                        <img src={post.author_avatar !== 'uploads/default_profile.png'
                                            ? `../../API/${post.author_avatar}`
                                            : default_avatar} alt='avatar' className="author-avatar"></img>
                                        <Link to={`/profile/${post.author_id}`} className="author-link">
                                            {post.author_name}
                                        </Link>
                                        <span className="post-date"> {formatDate(post.published_at)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {pagination.hasMore && !loading && filteredPosts.length > 0 && (
                <div className="load-more">
                    <button onClick={handleLoadMore} className="btn-secondary">Load More Posts</button>
                </div>
            )}

            {loading && filters.offset > 0 && (
                <div className="loading">Loading more posts...</div>
            )}
        </div>
    );
};

export default PostsSection;
