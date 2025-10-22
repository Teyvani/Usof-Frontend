import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from 'react-router-dom';
import {
    createComment,
    updateComment,
    deleteComment,
    likeComment,
    unlikeComment
} from '../store/slices/postsSlice';
import { selectUser, selectIsAuthenticated } from '../store/slices/authSlice';

const Comment = ({ comment, postId, level = 0 }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const user = useSelector(selectUser);
    const isAuthenticated = useSelector(selectIsAuthenticated);

    const [isReplying, setIsReplying] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [editContent, setEditContent] = useState(comment.content);
    const [userLikeStatus, setUserLikeStatus] = useState(null);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleReply = async (e) => {
        e.preventDefault();
        if (!replyContent.trim()) return;
        await dispatch(createComment({
            postId,
            content: replyContent,
            parent_comment_id: comment.id
        }));
        setReplyContent('');
        setIsReplying(false);
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        if (!editContent.trim()) return;
        await dispatch(updateComment({
            commentId: comment.id,
            content: editContent
        }));
        setIsEditing(false);
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this comment?')) {
            await dispatch(deleteComment({ commentId: comment.id, postId }));
        }
    };

    const handleLike = async (type) => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        if (userLikeStatus === type) {
            await dispatch(unlikeComment(comment.id));
            setUserLikeStatus(null);
        } else {
            await dispatch(likeComment({ commentId: comment.id, type }));
            setUserLikeStatus(type);
        }
    };
    const isAuthor = user && user.id === comment.author_id;
    const canEdit = isAuthor || user?.role === 'admin';
    const maxNestLevel = 3;

    return (
        <div className={`comment ${level > 0 ? 'comment-nested' : ''}`} style={{ marginLeft: level * 30 }}>
            <div className="comment-vote">
                <button
                    className={`vote-btn-small ${userLikeStatus === 'like' ? 'active' : ''}`}
                    onClick={() => handleLike('like')}
                    disabled={!isAuthenticated}
                > ▲ </button>
                <span className="vote-count-small">{comment.likes_count || 0}</span>
                <button
                    className={`vote-btn-small ${userLikeStatus === 'dislike' ? 'active' : ''}`}
                    onClick={() => handleLike('dislike')}
                    disabled={!isAuthenticated}
                > ▼ </button>
            </div>

            <div className="comment-body">
                <div className="comment-header">
                    <Link to={`/profile/${comment.author_id}`} className="comment-author">
                        {comment.author_login}
                    </Link>
                    <span className="comment-date">{formatDate(comment.published_at)}</span>
                </div>

                {isEditing ? (
                    <form onSubmit={handleEdit} className="comment-form">
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="comment-textarea"
                            rows="3"
                        />
                        <div className="comment-form-actions">
                            <button type="submit" className="btn-primary btn-small">
                                Save
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="btn-secondary btn-small"
                            > Cancel </button>
                        </div>
                    </form>
                ) : (<p className="comment-content">{comment.content}</p>)}

                <div className="comment-actions">
                    {isAuthenticated && level < maxNestLevel && !isEditing && (
                        <button onClick={() => setIsReplying(!isReplying)} className="comment-action-btn"> Reply </button>
                    )}

                    {isAuthor && !isEditing && (
                        <button onClick={() => setIsEditing(true)} className="comment-action-btn"> Edit </button>
                    )}

                    {canEdit && (
                        <button onClick={handleDelete} className="comment-action-btn danger">Delete</button>
                    )}
                </div>

                {isReplying && (
                    <form onSubmit={handleReply} className="comment-form reply-form">
                        <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Write a reply..."
                            className="comment-textarea"
                            rows="3"
                            required
                        />
                        <div className="comment-form-actions">
                            <button type="submit" className="btn-primary btn-small">
                                Reply
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsReplying(false)}
                                className="btn-secondary btn-small"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                {comment.replies && comment.replies.length > 0 && (
                    <div className="comment-replies">
                        {comment.replies.map(reply => (
                            <Comment
                                key={reply.id}
                                comment={reply}
                                postId={postId}
                                level={level + 1}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const CommentSection = ({ postId, comments }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const isAuthenticated = useSelector(selectIsAuthenticated);

    const [newComment, setNewComment] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        if (!newComment.trim()) return;
        await dispatch(createComment({
            postId,
            content: newComment,
            parent_comment_id: null
        }));
        setNewComment('');
    };

    const organizeComments = (comments) => {
        const commentMap = {};
        const rootComments = [];

        comments.forEach(comment => {
            commentMap[comment.id] = { ...comment, replies: [] };
        });
        comments.forEach(comment => {
            if (comment.parent_comment_id && commentMap[comment.parent_comment_id]) {
                commentMap[comment.parent_comment_id].replies.push(commentMap[comment.id]);
            } else {
                rootComments.push(commentMap[comment.id]);
            }
        });
        return rootComments;
    };
    const organizedComments = organizeComments(comments);

    return (
        <div className="comment-section">
            {isAuthenticated ? (
                <form onSubmit={handleSubmit} className="comment-form main-comment-form">
                    <h3>Your Answer</h3>
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write your answer here..."
                        className="comment-textarea"
                        rows="5"
                        required
                    />
                    <button type="submit" className="btn-primary">Post Your Answer</button>
                </form>
            ) : (
                <div className="login-prompt">
                    <p>Want to answer? <Link to="/login">Log in</Link> or <Link to="/register">create an account</Link>.</p>
                </div>
            )}
            <div className="comments-list">
                {organizedComments.length === 0 ? (
                    <p className="no-comments">No answers yet. Be the first to answer!</p>
                ) : (
                    organizedComments.map(comment => (
                        <Comment
                            key={comment.id}
                            comment={comment}
                            postId={postId}
                            level={0}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default CommentSection;
