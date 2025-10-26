const collectionModel = require('../models/collectionModel');

exports.createCollection = (req, res) => {
    try {
        const userId = req.session.user.id;
        const { title, description, is_private } = req.body;

        collectionModel.getUserCollectionsByTitle(userId, title.trim(), (err, existingCollection) => {
            if (err) {
                console.error('Error checking existing collection:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (existingCollection) return res.status(400).json({ error: 'You already have a collection with this title' });

            collectionModel.createCollection({ user_id: userId, title: title.trim(), description: description?.trim(), is_private: is_private || false }, (err, results) => {
                if (err) {
                    console.error('Error creating collection:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                collectionModel.getCollectionById(results.insertId, (err, newCollection) => {
                    if (err) {
                        console.error('Error fetching new collection:', err);
                        return res.status(500).json({ error: 'Collection created successfully' });
                    }

                    res.status(201).json({
                        message: 'Collection created successfully',
                        collection: newCollection
                    });
                });
            });
        });
    } catch (error) {
        console.error('Error creating collection:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getUserCollections = (req, res) => {
    try {
        const userId = req.session.user.id;

        collectionModel.getUserCollections(userId, (err, collections) => {
            if (err) {
                console.error('Error fetching user collections:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            res.json({ collections });
        });
    } catch (error) {
        console.error('Error fetching user collections:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getPublicCollections = (req, res) => {
    try {
        collectionModel.getPublicCollections((err, collections) => {
            if (err) {
                console.error('Error fetching public collections:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            res.json({ collections });
        });
    } catch (error) {
        console.error('Error fetching public collections:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getCollectionById = (req, res) => {
    try {
        const collectionId = req.params.collection_id;
        const userId = req.session.user?.id;

        collectionModel.getCollectionById(collectionId, (err, collection) => {
            if (err) {
                console.error('Error fetching collection:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (!collection) return res.status(404).json({ error: 'Collection not found' });
            if (collection.is_private && collection.user_id !== userId) return res.status(403).json({ error: 'Access denied to private collection' });

            res.json({ collection });
        });
    } catch (error) {
        console.error('Error fetching collection:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateCollection = (req, res) => {
    try {
        const collectionId = req.params.collection_id;
        const userId = req.session.user.id;
        const { title, description, is_private } = req.body;

        collectionModel.getCollectionById(collectionId, (err, collection) => {
            if (err) {
                console.error('Error fetching collection:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (!collection) return res.status(404).json({ error: 'Collection not found' });
            if (collection.user_id !== userId) return res.status(403).json({ error: 'You can only edit your own collections' });

            const updateFields = {};
            if (title !== undefined) updateFields.title = title.trim();
            if (description !== undefined) updateFields.description = description?.trim();
            if (is_private !== undefined) updateFields.is_private = is_private;
            if (Object.keys(updateFields).length === 0) {
                return res.status(400).json({ error: 'No valid fields to update' });
            }

            if (updateFields.title && updateFields.title !== collection.title) {
                collectionModel.getUserCollectionsByTitle(userId, updateFields.title, (err, existingCollection) => {
                    if (err) {
                        console.error('Error checking existing collection:', err);
                        return res.status(500).json({ error: 'Internal server error' });
                    }
                    if (existingCollection) { return res.status(400).json({ error: 'You already have a collection with this title' });}

                    performUpdate();
                });
            } else {
                performUpdate();
            }

            function performUpdate() {
                collectionModel.updateCollection(collectionId, updateFields, (err) => {
                    if (err) {
                        console.error('Error updating collection:', err);
                        return res.status(500).json({ error: 'Internal server error' });
                    }

                    collectionModel.getCollectionById(collectionId, (err, updatedCollection) => {
                        if (err) {
                            console.error('Error fetching updated collection:', err);
                            return res.status(500).json({ error: 'Collection updated successfully' });
                        }

                        res.json({
                            message: 'Collection updated successfully',
                            collection: updatedCollection
                        });
                    });
                });
            }
        });
    } catch (error) {
        console.error('Error updating collection:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deleteCollection = (req, res) => {
    try {
        const collectionId = req.params.collection_id;
        const userId = req.session.user.id;

        collectionModel.getCollectionById(collectionId, (err, collection) => {
            if (err) {
                console.error('Error fetching collection:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (!collection) return res.status(404).json({ error: 'Collection not found' });
            if (collection.user_id !== userId) return res.status(403).json({ error: 'You can only delete your own collections' });

            collectionModel.deleteCollection(collectionId, (err) => {
                if (err) {
                    console.error('Error deleting collection:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                res.json({ message: 'Collection deleted successfully' });
            });
        });
    } catch (error) {
        console.error('Error deleting collection:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getCollectionPosts = (req, res) => {
    try {
        const collectionId = req.params.collection_id;
        const userId = req.session.user?.id;

        collectionModel.getCollectionById(collectionId, (err, collection) => {
            if (err) {
                console.error('Error fetching collection:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (!collection) return res.status(404).json({ error: 'Collection not found' });
            if (collection.is_private && collection.user_id !== userId) {
                return res.status(403).json({ error: 'Access denied to private collection' });
            }

            collectionModel.getCollectionPosts(collectionId, (err, posts) => {
                if (err) {
                    console.error('Error fetching collection posts:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                res.json({
                    collection,
                    posts
                });
            });
        });
    } catch (error) {
        console.error('Error fetching collection posts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.addPostToCollection = (req, res) => {
    try {
        const collectionId = req.params.collection_id;
        const postId = req.params.post_id;
        const userId = req.session.user.id;

        collectionModel.getCollectionById(collectionId, (err, collection) => {
            if (err) {
                console.error('Error fetching collection:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (!collection) return res.status(404).json({ error: 'Collection not found' });
            if (collection.user_id !== userId)  return res.status(403).json({ error: 'You can only add posts to your own collections' });

            const postModel = require('../models/postModel');
            postModel.getPostByID(postId, (err, post) => {
                if (err) {
                    console.error('Error fetching post:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }
                if (!post) return res.status(404).json({ error: 'Post not found' });

                if (post.status !== 'active') {
                    return res.status(400).json({ error: 'Cannot add inactive posts to collection' });
                }

                collectionModel.isPostInCollection(collectionId, postId, (err, isInCollection) => {
                    if (err) {
                        console.error('Error checking if post in the collection');
                        return res.status(500).json({ erro: 'Internal server error' });
                    }
                    if (isInCollection) return res.status(400).json({ error: 'Post already in collection' });

                    collectionModel.addPostToCollection(collectionId, postId, (err) => {
                        if (err) {
                            console.error('Error adding post to collection:', err);
                            return res.status(500).json({ error: 'Internal server error' });
                        }

                        res.json({ message: 'Post added to collection successfully' });
                    });
                });
            });
        });
    } catch (error) {
        console.error('Error adding post to collection:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


exports.removePostFromCollection = (req, res) => {
    try {
        const collectionId = req.params.collection_id;
        const postId = req.params.post_id;
        const userId = req.session.user.id;

        collectionModel.getCollectionById(collectionId, (err, collection) => {
            if (err) {
                console.error('Error fetching collection:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (!collection) return res.status(404).json({ error: 'Collection not found' });
            if (collection.user_id !== userId) {
                return res.status(403).json({ error: 'You can only remove posts from your own collections' });
            }

            collectionModel.removePostFromCollection(collectionId, postId, (err, results) => {
                if (err) {
                    console.error('Error removing post from collection:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }
                if (results.affectedRows === 0) return res.status(404).json({ error: 'Post not found in collection' });

                res.json({ message: 'Post removed from collection successfully' });
            });
        });
    } catch (error) {
        console.error('Error removing post from collection:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
