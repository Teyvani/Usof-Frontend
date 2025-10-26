import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from '../services/axios';
import { selectUser, selectIsAuthenticated, updateProfile, uploadAvatar } from '../store/slices/authSlice';
import default_avatar from '../assets/icons/default_avatar.svg';
import '../styles/profile.css';

const ProfilePage = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const currentUser = useSelector(selectUser);
    const isAuthenticated = useSelector(selectIsAuthenticated);

    const [user, setUser] = useState(null);
    const [allPosts, setAllPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        login: '',
        email: '',
        full_name: ''
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [searchTerm, setSearchTerm] = useState('');

    const isOwnProfile = isAuthenticated && currentUser?.id === Number(id);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const userRes = await axios.get(`/users/${id}`);
                setUser(userRes.data.user);
                setFormData({
                    login: userRes.data.user.login,
                    email: userRes.data.user.email,
                    full_name: userRes.data.user.full_name || ''
                });

                const postsRes = await axios.get(`/posts?status=all`);
                const userPosts = (postsRes.data.posts || []).filter(post => post.author_id === Number(id));
                setAllPosts(userPosts);
            } catch (err) {
                console.error('Failed to load profile:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setSelectedFile(file);
        if (file) {
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage('');

        try {
            await dispatch(updateProfile({ 
                userId: id, 
                data: formData 
            })).unwrap();

            if (selectedFile) {
                const data = new FormData();
                data.append('avatar', selectedFile);
                await dispatch(uploadAvatar(data)).unwrap();
            }
            setMessage('Profile updated successfully!');
            setEditMode(false);
            
            const userRes = await axios.get(`/users/${id}`);
            setUser(userRes.data.user);
            setSelectedFile(null);
            setPreview(null);
        } catch (err) {
            console.error(err);
            setMessage('Error updating profile.');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    const filteredPosts = allPosts
        .filter(post =>
            post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.content.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            if (sortBy === 'likes') {
                return (b.likes_count || 0) - (a.likes_count || 0);
            } else {
                return new Date(b.published_at) - new Date(a.published_at);
            }
        });

    if (loading) return <div className="loading">Loading profile...</div>;
    if (!user) return <div className="error-message">User not found</div>;

    const avatarUrl = preview 
        ? preview
        : user.profile_picture && user.profile_picture !== 'uploads/default_profile.png'
        ? `http://localhost:3000/${user.profile_picture}`
        : default_avatar;

    return (
        <div className="profile-page-container">
            <div className="home-background"></div>
            <div className="profile-sidebar">
                <div className="profile-card">
                    <img src={avatarUrl} alt="avatar" className="profile-avatar" />

                    {isOwnProfile && editMode && (
                        <label className="upload-label">
                            Change avatar
                            <input type="file" accept="image/*" onChange={handleFileChange} hidden />
                        </label>
                    )}

                    {!editMode ? (
                        <>
                            <h2>{user.login}</h2>
                            <p className="profile-role">{user.role}</p>
                            <p className="profile-full-name">{user.full_name || 'No name provided'}</p>
                            <p className="profile-email">{user.email}</p>
                            <p className="profile-rating">Rating: {user.rating || 0}</p>

                            {isOwnProfile && (
                                <button onClick={() => setEditMode(true)} className="btn-primary">
                                    Edit Profile
                                </button>
                            )}
                        </>
                    ) : (
                        <form onSubmit={handleSave} className="edit-form">
                            <label>Login</label>
                            <input name="login" value={formData.login} onChange={handleChange} disabled className="disabled-input"/>
                            <label>Full Name</label>
                            <input name="full_name" value={formData.full_name} onChange={handleChange} placeholder="Enter your full name"/>
                            <label>Email</label>
                            <input name="email" type="email" value={formData.email} onChange={handleChange}/>

                            <div className="form-buttons">
                                <button type="submit" className="btn-primary" disabled={submitting}>
                                    {submitting ? 'Saving...' : 'Save changes'}
                                </button>
                                <button type="button" className="btn-secondary" onClick={() => {
                                        setEditMode(false);
                                        setMessage('');
                                        setPreview(null);
                                        setSelectedFile(null);
                                    }}
                                >Cancel</button>
                            </div>
                        </form>
                    )}

                    {message && <p className="message">{message}</p>}
                </div>
            </div>

            <div className="profile-posts-section">
                <div className="posts-section-header">
                    <h1>{user.login}'s Posts ({allPosts.length})</h1>
                </div>

                <div className="filters-section">
                    <div className="search-bar">
                        <input type="text" placeholder="Search posts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input"/>
                    </div>

                    <div className="filter-controls">
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-select">
                            <option value="likes">Most Liked</option>
                            <option value="date">Most Recent</option>
                        </select>
                    </div>
                </div>

                <div className="posts-list">
                    {filteredPosts.length === 0 ? (
                        <div className="no-posts">
                            <p>{searchTerm ? 'No posts match your search.' : 'No posts yet.'}</p>
                            {isOwnProfile && !searchTerm && (
                                <Link to="/posts/create" className="btn-primary">Create First Post</Link>
                            )}
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
                                    <Link to={`/posts/${post.id}`} className="post-title">
                                        {post.title}
                                    </Link>
                                    
                                    <p className="post-excerpt">
                                        {post.content.substring(0, 200)}
                                        {post.content.length > 200 ? '...' : ''}
                                    </p>

                                    <div className="post-meta">
                                        <div className="post-categories">
                                            {post.categories && post.categories.map((category, idx) => (
                                                <span key={idx} className="category-badge">
                                                    {category}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="post-date">
                                            {formatDate(post.published_at)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
