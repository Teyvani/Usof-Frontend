import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchPostById,
    fetchPostComments,
    likePost,
    unlikePost,
    followPost,
    unfollowPost,
    deletePost,
    selectCurrentPost,
    selectPostComments,
    selectPostsLoading,
    selectPostsError,
    clearCurrentPost
} from '../store/slices/postsSlice';
import { selectUser, selectIsAuthenticated } from '../store/slices/authSlice';
import CommentSection from '../components/CommentSection';
import '../styles/post-details.css'

const PostDetailPage = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const post = useSelector(selectCurrentPost);
    const comments = useSelector(selectPostComments(id));
    const loading = useSelector(selectPostsLoading);
    const error = useSelector(selectPostsError);
    const user = useSelector(selectUser);
    const isAuthenticated = useSelector(selectIsAuthenticated);

    const [isFollowing, setIsFollowing] = useState(false);
    const [userLikeStatus, setUserLikeStatus] = useState(null);

    useEffect(() => {
        if (post) {
        const userLike = post.likes?.find(like => like.author_id === user?.id);
        setUserLikeStatus(userLike ? userLike.type : null);

        if (typeof post?.is_following === 'boolean') { setIsFollowing(post.is_following); }
    }
    }, [post]);

    useEffect(() => {
        dispatch(fetchPostById(id));
        dispatch(fetchPostComments(id));
        
        return () => {
            dispatch(clearCurrentPost());
        };
    }, [dispatch, id]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleLike = async (type) => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        if (userLikeStatus === type) {
            await dispatch(unlikePost(id));
            setUserLikeStatus(null);
        } else {
            await dispatch(likePost({ postId: id, type }));
            setUserLikeStatus(type);
        }

        await dispatch(fetchPostById(id));
    }

    const handleFollow = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        if (isFollowing) {
            await dispatch(unfollowPost(id));
            setIsFollowing(false);
        } else {
            await dispatch(followPost(id));
            setIsFollowing(true);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            await dispatch(deletePost(id));
            navigate('/');
        }
    };

    if (loading && !post) {
        return <div className="loading-container">Loading post...</div>;
    }
    if (error) {
        return (
            <div className="error-container">
                <h2>Error</h2>
                <p>{error}</p>
                <Link to="/" className="btn-primary">Back to Home</Link>
            </div>
        );
    }
    if (!post) return null;

    const isAuthor = user && user.id === post.author_id;
    const canEdit = isAuthor;

    return (
        <div className="post-detail-page">
            <div className="post-detail-container">
                <div className="post-header">
                    <h1 className="post-title">{post.title}</h1>
                    <div className="post-meta-info">
                        <span className="meta-item">
                            Asked by{' '}<Link to={`/profile/${post.author_id}`} className="author-link">{post.author_login || post.author_name}</Link>
                        </span>
                        <span className="meta-item">{formatDate(post.published_at)}</span>
                        {post.updated_at !== post.published_at && (
                            <span className="meta-item">
                                (edited {formatDate(post.updated_at)})
                            </span>
                        )}
                    </div>
                    {post.categories && post.categories.length > 0 && (
                        <div className="post-categories">
                            {post.categories.map((category, idx) => (
                                <span key={idx} className="category-badge">
                                    {category}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                <div className="post-main">
                    <div className="vote-section">
                        <button
                            className={`vote-btn ${userLikeStatus === 'like' ? 'active' : ''}`}
                            onClick={() => handleLike('like')}
                            disabled={!isAuthenticated}
                            title={isAuthenticated ? 'Like' : 'Login to like'}
                        > ▲ </button>
                        <span className="vote-count">{post.likes_count || 0}</span>
                        <button
                            className={`vote-btn ${userLikeStatus === 'dislike' ? 'active' : ''}`}
                            onClick={() => handleLike('dislike')}
                            disabled={!isAuthenticated}
                            title={isAuthenticated ? 'Dislike' : 'Login to dislike'}
                        > ▼ </button>
                    </div>
                    <div className="post-content-area">
                        <div className="post-content">{post.content}</div>
                        {post.images && post.images.length > 0 && (
                            <div className="post-images">
                                {post.images.map((image, idx) => (
                                    <img key={idx} src={`../../API/${image}`} alt={`Post image ${idx + 1}`} className="post-image"/>
                                ))}
                            </div>
                        )}
                        <div className="post-actions">
                            {isAuthenticated && !isAuthor && (
                                <button onClick={handleFollow} className={`btn-action ${isFollowing ? 'active' : ''}`}>
                                    {isFollowing ? '★ Following' : '☆ Follow'}
                                </button>
                            )}
                            {canEdit && (<>
                                <Link to={`/posts/${id}/edit`} className="btn-action">Edit</Link>
                                <button onClick={handleDelete} className="btn-action btn-danger">Delete</button>
                                </>
                            )}
                        </div>
                        <div className="post-stats-footer">
                            <span>{post.comments_count || 0} answers</span>
                        </div>
                    </div>
                </div>
                <div className="comments-section">
                    <h2 className="comments-title">
                        {post.comments_count || 0} Answer{post.comments_count !== 1 ? 's' : ''}
                    </h2>
                    {post.is_locked ? (
                        <div className="locked-message">This post is locked. New comments cannot be added.</div>
                    ) : (<CommentSection postId={id} comments={comments} />)}
                </div>
            </div>
        </div>
    );
}

export default PostDetailPage;
