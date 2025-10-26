const followModel = require('../models/followModel');
const postModel = require('../models/postModel');

exports.followPost = (req, res) => {
    try {
        const postId = req.params.post_id;
        const userId = req.session.user.id;

        postModel.getPostByID(postId, (err, post) => {
            if (err) {
                console.error('Error fetching post:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (!post) return res.status(404).json({ error: 'Post not found' });
            if (post.status != 'active') return res.status(400).json({ error: 'Cannot follow innactive posts' });
            if (post.author_id === userId) return res.status(400).json({ error: 'You cannot follow your own posts' });

            followModel.followPost(userId, postId, (err) => {
                if (err) {
                    if (err.message === 'Already following this post') {
                        return res.status(400).json({ error: 'Already following this post' });
                    }
                    console.error('Error following post:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                res.json({ message: 'Post followed successfully' });
            });
        });
    } catch (error) {
        console.error('Error following post:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.unfollowPost = (req, res) => {
    try {
        const postId = req.params.post_id;
        const userId = req.session.user.id;

        followModel.unfollowPost(userId, postId, (err, results) => {
            if (err) {
                console.error('Error unfollowing post:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'You are not following this post' });
            }

            res.json({ message: 'Post unfollowed successfully' });
        });
    } catch (error) {
        console.error('Error unfollowing post:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getUserFollowedPosts = (req, res) => {
    try {
        const userId = req.session.user.id;

        followModel.getUserFollowedPosts(userId, (err, posts) => {
            if (err) {
                console.error('Error fetching followed posts:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            res.json({ followed_posts: posts });
        });
    } catch (error) {
        console.error('Error fetching followed posts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getPostFollowers = (req, res) => {
    try {
        const postId = req.params.post_id;

        postModel.getPostByID(postId, (err, post) => {
            if (err) {
                console.error('Error fetching post:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (!post) { return res.status(404).json({ error: 'Post not found' }); }

            followModel.getPostFollowers(postId, (err, followers) => {
                if (err) {
                    console.error('Error fetching post followers:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                followModel.getPostFollowersCount(postId, (err, count) => {
                    if (err) {
                        console.error('Error fetching followers count:', err);
                        return res.status(500).json({ error: 'Internal server error' });
                    }

                    res.json({
                        post: {
                            id: post.id,
                            title: post.title
                        },
                        followers,
                        followers_count: count
                    });
                });
            });
        });
    } catch (error) {
        console.error('Error fetching post followers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.checkFollowStatus = (req, res) => {
    try {
        const postId = req.params.post_id;
        const userId = req.session.user.id;

        followModel.isUserFollowingPost(userId, postId, (err, isFollowing) => {
            if (err) {
                console.error('Error checking follow status:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            res.json({ is_following: isFollowing });
        });
    } catch (error) {
        console.error('Error checking follow status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
