const likeModel = require('../models/likeModel');
const postModel = require('../models/postModel');
const commentModel = require('../models/commentModel');

exports.addPostLike = (req, res) => {
    try {
        const postId = req.params.post_id;
        const authorId = req.session.user.id;
        const { type } = req.body || {};

        if (!type) { return res.status(400).json({ error: 'Like type is required.' });}
        if (!['like', 'dislike'].includes(type)) { return res.status(400).json({ error: 'Invalid like type. Must be "like" or "dislike"' }); }

        postModel.getPostByID(postId, (err, post) => {
            if (err) {
                console.error('Error fetching post:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (!post) { return res.status(404).json({ error: 'Post not found' }); }
            if (post.status !== 'active') { return res.status(403).json({ error: 'Cannot like inactive posts' }); }
            if (post.author_id === authorId) { return res.status(403).json({ error: 'You cannot like or dislike your own post' }); }

            likeModel.addLike({ author_id: authorId, target_type: 'post', target_id: postId, type }, (err, result) => {
                if (err) {
                    console.error('Error adding like:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                likeModel.updateTargetLikeCount('post', postId, (err) => {
                    if (err) console.error('Error updating post like count:', err);
                });

                likeModel.updateUserRating(post.author_id, (err) => {
                    if (err) console.error('Error updating user rating:', err);
                });

                res.json({
                    message: `Like ${result.action} successfully`,
                    action: result.action,
                    type
                });
            });
        });
    } catch (error) {
        console.error('Error adding post like:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.addCommentLike = (req, res) => {
    try {
        const commentId = req.params.comment_id;
        const authorId = req.session.user.id;
        const { type } = req.body;

        if (!['like', 'dislike'].includes(type)) {
            return res.status(400).json({ error: 'Invalid like type. Must be "like" or "dislike"' });
        }

        commentModel.getCommentById(commentId, (err, comment) => {
            if (err) {
                console.error('Error fetching comment:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (!comment) { return res.status(404).json({ error: 'Comment not found' }); }
            if (comment.status !== 'active') { return res.status(403).json({ error: 'Cannot like inactive comments' }); }
            if (comment.author_id === authorId) { return res.status(403).json({ error: 'You cannot like or dislike your own comment' }); }

            likeModel.addLike({author_id: authorId, target_type: 'comment', target_id: commentId, type }, (err, result) => {
                if (err) {
                    console.error('Error adding like:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                likeModel.updateTargetLikeCount('comment', commentId, (err) => {
                    if (err) console.error('Error updating comment like count:', err);
                });

                likeModel.updateUserRating(comment.author_id, (err) => {
                    if (err) console.error('Error updating user rating:', err);
                });

                res.json({
                    message: `Comment ${result.action} successfully`,
                    action: result.action,
                    type
                });
            });
        });
    } catch (error) {
        console.error('Unexpected error adding comment like:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getPostLikes = (req, res) => {
    try {
        const postId = req.params.post_id;

        likeModel.getLikesByTarget('post', postId, (err, likesData) => {
            if (err) {
                console.error('Error fetching post likes:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            res.json(likesData);
        });
    } catch (error) {
        console.error('Unexpected error fetching post likes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getCommentLikes = (req, res) => {
    try {
        const commentId = req.params.comment_id;

        likeModel.getLikesByTarget('comment', commentId, (err, likesData) => {
            if (err) {
                console.error('Error fetching comment likes:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            res.json(likesData);
        });
    } catch (error) {
        console.error('Unexpected error fetching comment likes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getLikes = (req, res) => {
    try {
        const targetType = req.params.target_type || req.query.target_type;
        const targetId = req.params.target_id || req.query.target_id;

        if (!targetType || !targetId) {
            return res.status(400).json({ error: 'Target type and ID are required' });
        }

        likeModel.getLikesByTarget(targetType, targetId, (err, likesData) => {
            if (err) {
                console.error('Error fetching likes:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            res.json(likesData);
        });
    } catch (error) {
        console.error('Unexpected error fetching likes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deletePostLike = (req, res) => {
    try {
        const postId = req.params.post_id;
        const authorId = req.session.user.id;

        postModel.getPostByID(postId, (err, post) => {
            if (err) {
                console.error('Error fetching post:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (!post) { return res.status(404).json({ error: 'Post not found' }); }

            likeModel.deleteLikeByUserAndTarget(authorId, 'post', postId, (err, result) => {
                if (err) {
                    console.error('Error deleting like:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }
                if (result.results.affectedRows === 0) { return res.status(404).json({ error: 'Like not found' }); }

                likeModel.updateTargetLikeCount('post', postId, (err) => {
                    if (err) console.error('Error updating post like count:', err);
                });

                likeModel.updateUserRating(post.author_id, (err) => {
                    if (err) console.error('Error updating user rating:', err);
                });

                res.json({ message: 'Like removed successfully' });
            });
        });
    } catch (error) {
        console.error('Unexpected error deleting post like:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deleteCommentLike = (req, res) => {
    try {
        const commentId = req.params.comment_id;
        const authorId = req.session.user.id;

        commentModel.getCommentById(commentId, (err, comment) => {
            if (err) {
                console.error('Error fetching comment:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            if (!comment) { return res.status(404).json({ error: 'Comment not found' }); }

            likeModel.deleteLikeByUserAndTarget(authorId, 'comment', commentId, (err, result) => {
                if (err) {
                    console.error('Error deleting like:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }
                if (result.results.affectedRows === 0) { return res.status(404).json({ error: 'Like not found' }); }

                likeModel.updateTargetLikeCount('comment', commentId, (err) => {
                    if (err) console.error('Error updating comment like count:', err);
                });

                likeModel.updateUserRating(comment.author_id, (err) => {
                    if (err) console.error('Error updating user rating:', err);
                });

                res.json({ message: 'Like removed successfully' });
            });
        });
    } catch (error) {
        console.error('Unexpected error deleting comment like:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
