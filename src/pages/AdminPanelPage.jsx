import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser, selectIsAdmin } from '../store/slices/authSlice';
import axios from '../services/axios';
import '../styles/admin.css';

const AdminPanelPage = () => {
    const navigate = useNavigate();
    const user = useSelector(selectUser);
    const isAdmin = useSelector(selectIsAdmin);

    const [activeTab, setActiveTab] = useState('posts');
    const [posts, setPosts] = useState([]);
    const [users, setUsers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [postsLimit, setPostsLimit] = useState(10);
    const [postsOffset, setPostsOffset] = useState(0);
    const [hasMorePosts, setHasMorePosts] = useState(true);

    useEffect(() => {
        if (!isAdmin) {
            navigate('/');
            return;
        }
        fetchData();
    }, [isAdmin, navigate, activeTab]);

    const fetchData = async (reset = false) => {
        setLoading(true);
        try {
            if (activeTab === 'posts') {
                const offset = reset ? 0 : postsOffset;
                const response = await axios.get('/posts?status=all&limit=${postsLimit}&offset=${offset}');
                setPosts(response.data.posts || []);
                setHasMorePosts(response.data.pagination?.hasMore || false);
                if (reset) setPostsOffset(0);
            } else if (activeTab === 'users') {
                const response = await axios.get('/users');
                setUsers(response.data.users || []);
            } else if (activeTab === 'categories') {
                const response = await axios.get('/categories');
                setCategories(response.data.categories || []);
            } else if (activeTab === 'comments') {
                const postsRes = await axios.get('/posts?status=all&limit=100');
                const allComments = [];
                for (const post of (postsRes.data.posts || []).slice(0, 20)) {
                    try {
                        const commentsRes = await axios.get(`/posts/${post.id}/comments`);
                        const postComments = (commentsRes.data.comments || []).map(c => ({
                            ...c,
                            post_id: post.id,
                            post_title: post.title
                        }));
                        allComments.push(...postComments);
                    } catch (err) {
                        console.error(`Failed to fetch comments for post ${post.id}`, err);
                    }
                }
                setComments(allComments);
            }
            setMessage('');
        } catch (error) {
            console.error('Failed to fetch data:', error);
            setMessage('Failed to load data');
        } finally {
            setLoading(false);
        }
    };
    
    const loadMorePosts = async () => {
        if (!hasMorePosts) return;
        setLoading(true);
        try {
            const newOffset = postsOffset + postsLimit;
            const response = await axios.get(`/posts?status=all&limit=${postsLimit}&offset=${newOffset}`);
            setPosts([...posts, ...(response.data.posts || [])]);
            setPostsOffset(newOffset);
            setHasMorePosts(response.data.pagination?.hasMore || false);
        } catch (error) {
            setMessage('Failed to load more posts');
        } finally {
            setLoading(false);
        }
    };

    const handlePostStatusChange = async (postId, newStatus) => {
        try {
            await axios.patch(`/posts/${postId}`, { status: newStatus });
            setMessage('Post status updated successfully');
            fetchData();
        } catch (error) {
            setMessage('Failed to update post status');
        }
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm('Are you sure you want to delete this post?')) return;
        try {
            await axios.delete(`/posts/${postId}`);
            setMessage('Post deleted successfully');
            fetchData();
        } catch (error) {
            setMessage('Failed to delete post');
        }
    };

    const handleUserRoleChange = async (userId, newRole) => {
        try {
            await axios.patch(`/users/${userId}/role`, { role: newRole });
            setMessage('User role updated successfully');
            fetchData();
        } catch (error) {
            setMessage('Failed to update user role');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await axios.delete(`/users/${userId}`);
            setMessage('User deleted successfully');
            fetchData();
        } catch (error) {
            setMessage('Failed to delete user');
        }
    };

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        if (!newCategory.trim()) return;
        try {
            await axios.post('/categories', { title: newCategory });
            setMessage('Category created successfully');
            setNewCategory('');
            fetchData();
        } catch (error) {
            setMessage('Failed to create category');
        }
    };

    const handleUpdateCategory = async (categoryId, newTitle) => {
        const title = prompt('Enter new category name:', newTitle);
        if (!title || title === newTitle) return;
        try {
            await axios.patch(`/categories/${categoryId}`, { title });
            setMessage('Category updated successfully');
            fetchData();
        } catch (error) {
            setMessage('Failed to update category');
        }
    };

    const handleDeleteCategory = async (categoryId) => {
        if (!window.confirm('Are you sure you want to delete this category?')) return;
        try {
            await axios.delete(`/categories/${categoryId}`);
            setMessage('Category deleted successfully');
            fetchData();
        } catch (error) {
            setMessage('Failed to delete category');
        }
    };
    
    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Are you sure you want to delete this comment?')) return;
        try {
            await axios.delete(`/comments/${commentId}`);
            setMessage('Comment deleted successfully');
            fetchData();
        } catch (error) {
            setMessage('Failed to delete comment');
        }
    };

    const handleCommentStatusChange = async (commentId, newStatus) => {
        try {
            await axios.patch(`/comments/${commentId}`, { status: newStatus });
            setMessage('Comment status updated successfully');
            fetchData();
        } catch (error) {
            setMessage('Failed to update comment status');
        }
    };

    if (!isAdmin) return null;

    return (
        <div className="admin-panel">
            <div className="admin-container">
                <h1>Admin Panel</h1>
                
                {message && (
                    <div className={`admin-message ${message.includes('Failed') ? 'error' : 'success'}`}>{message}</div>
                )}

                <div className="admin-tabs">
                    <button
                        className={`admin-tab ${activeTab === 'posts' ? 'active' : ''}`}
                        onClick={() => setActiveTab('posts')}
                    >Posts Management</button>
                    <button
                        className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >Users Management</button>
                    <button
                        className={`admin-tab ${activeTab === 'categories' ? 'active' : ''}`}
                        onClick={() => setActiveTab('categories')}
                    >Categories Management</button>
                    <button
                        className={`admin-tab ${activeTab === 'comments' ? 'active' : ''}`}
                        onClick={() => setActiveTab('comments')}
                    >Comments Management</button>
                    <button className="admin-tab admin-refresh"onClick={() => fetchData(true)}>Refresh</button>
                </div>

                {loading && <div className="loading">Loading...</div>}

                <div className="admin-content">
                    {activeTab === 'posts' && (
                        <div className="admin-section">
                            <h2>All Posts ({posts.length})</h2>
                            <div className="admin-table">
                                {posts.map(post => (
                                    <div key={post.id} className="admin-row">
                                        <div className="admin-row-info">
                                            <div className="admin-post-header">
                                                <h3>{post.title}</h3>
                                                <span className="post-id">ID: {post.id}</span>
                                            </div>
                                            <p>By: {post.author_login} | Status: {post.status}</p>
                                            <p>Likes: {post.likes_count} | Comments: {post.comments_count}</p>
                                        </div>
                                        <div className="admin-row-actions">
                                            <select value={post.status} onChange={(e) => handlePostStatusChange(post.id, e.target.value)} className="admin-select">
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                            <button onClick={() => navigate(`/posts/${post.id}`)}className="btn-view">View</button>
                                            <button onClick={() => handleDeletePost(post.id)} className="btn-delete">Delete</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {hasMorePosts && (
                                <div className="load-more-section">
                                    <button onClick={loadMorePosts} className="btn-primary"disabled={loading}>{loading ? 'Loading...' : 'Load More Posts'}</button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="admin-section">
                            <h2>All Users ({users.length})</h2>
                            <div className="admin-table">
                                {users.map(u => (
                                    <div key={u.id} className="admin-row">
                                        <div className="admin-row-info">
                                            <div className="admin-post-header">
                                                <h3>{u.login}</h3>
                                                <span className="post-id">ID: {u.id}</span>
                                            </div>
                                            <p>{u.full_name} | {u.email}</p>
                                            <p>Role: {u.role} | Rating: {u.rating}</p>
                                        </div>
                                        <div className="admin-row-actions">
                                            {u.id !== user.id ? (
                                                <>
                                                    <select value={u.role} onChange={(e) => handleUserRoleChange(u.id, e.target.value)} className="admin-select">
                                                        <option value="user">User</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                    <button onClick={() => navigate(`/profile/${u.id}`)} className="btn-view">View</button>
                                                    <button onClick={() => handleDeleteUser(u.id)}className="btn-delete">Delete</button>
                                                </>
                                            ) : (
                                                <span className="self-badge">You</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'categories' && (
                        <div className="admin-section">
                            <h2>Categories Management</h2>
                            
                            <form onSubmit={handleCreateCategory} className="admin-form">
                                <input
                                    type="text"
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    placeholder="New category name"
                                    className="admin-input"
                                />
                                <button type="submit" className="btn-primary">Create Category</button>
                            </form>

                            <div className="admin-table">
                                {categories.map(category => (
                                    <div key={category.id} className="admin-row">
                                        <div className="admin-row-info">
                                            <div className="admin-post-header">
                                                <h3>{category.title}</h3>
                                                <span className="post-id">ID: {category.id}</span>
                                            </div>
                                        </div>
                                        <div className="admin-row-actions">
                                            <button onClick={() => handleUpdateCategory(category.id, category.title)} className="btn-view">Edit</button>
                                            <button onClick={() => handleDeleteCategory(category.id)} className="btn-delete">Delete</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'comments' && (
                        <div className="admin-section">
                            <h2>Comments Management ({comments.length})</h2>
                            <div className="admin-table">
                                {comments.length === 0 ? (
                                    <p className="no-data">No comments found</p>
                                ) : (
                                    comments.map(comment => (
                                        <div key={comment.id} className="admin-row">
                                            <div className="admin-row-info">
                                                <div className="admin-post-header">
                                                    <h3>Comment by {comment.author_login}</h3>
                                                    <span className="post-id">ID: {comment.id}</span>
                                                </div>
                                                <p className="comment-preview">
                                                    {comment.content.substring(0, 150)}
                                                    {comment.content.length > 150 ? '...' : ''}
                                                </p>
                                                <p>
                                                    On post: "{comment.post_title}" | 
                                                    Status: {comment.status} | 
                                                    Likes: {comment.likes_count || 0}
                                                </p>
                                            </div>
                                            <div className="admin-row-actions">
                                                <select 
                                                    value={comment.status} 
                                                    onChange={(e) => handleCommentStatusChange(comment.id, e.target.value)} 
                                                    className="admin-select"
                                                >
                                                    <option value="active">Active</option>
                                                    <option value="inactive">Inactive</option>
                                                </select>
                                                <button onClick={() => navigate(`/posts/${comment.post_id}`)} className="btn-view">View Post</button>
                                                <button onClick={() => handleDeleteComment(comment.id)} className="btn-delete">Delete</button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPanelPage;
