const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const categoryController = require('../controllers/categoryController');
const commentController = require('../controllers/commentController');
const likeController = require('../controllers/likeController');
const postController = require('../controllers/postController');
const notificationController = require('../controllers/notificationController');
const collectionController = require('../controllers/collectionController');
const followController = require('../controllers/followController');
const reportController = require('../controllers/reportController');
const mainChecker = require('../middleware/mainChecker');
const authMiddleware = require('../middleware/authentication');
const validMiddleware = require('../middleware/validation');
const middleChecker = require('../middleware/middleChecker');

const multer = require('multer');
const path = require('path');
const fs = require('fs');

if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = file.originalname.split('.').pop();
        cb(null, file.fieldname + '-' + uniqueSuffix + '.' + ext);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
    
        if (mimetype && extname) return cb(null, true);
        else { cb(new Error('Only image files are allowed')); }
    }
});

/* Authentication Routes */
router.post('/auth/register', mainChecker.emptyBody, authMiddleware.registerErrorHandler, userController.register);
router.get('/auth/confirm-email', userController.confirmEmail);
router.post('/auth/send-email-token-again', mainChecker.emptyBody, userController.sendEmailTokenAgain);
router.post('/auth/login', mainChecker.emptyBody, authMiddleware.loginErrorHandler, userController.login);
router.post('/auth/logout', validMiddleware.isLoggedIn, userController.logout);
router.post('/auth/reset-password-request', mainChecker.emptyBody, userController.passwordResetRequest);
router.post('/auth/reset-password', mainChecker.emptyBody, authMiddleware.passwordResetErrorHandler, userController.passwordResetConfirm);
router.get('/auth/reset-password', userController.passwordTokenPage);

/* User Routes */
router.get('/users', userController.getAllUsers);
router.get('/users/:user_id', userController.getUserById);
router.post('/users', mainChecker.emptyBody, validMiddleware.isLoggedIn, validMiddleware.isAdmin, userController.createUser);
router.patch('/users/avatar', validMiddleware.isLoggedIn, upload.single('avatar'), userController.uploadAvatar);
router.patch('/users/:user_id', mainChecker.emptyBody, validMiddleware.isLoggedIn, userController.updateUser);
router.delete('/users/:user_id', validMiddleware.isLoggedIn, validMiddleware.isAdmin, userController.deleteUser);
router.patch('/users/:user_id/role', mainChecker.emptyBody, validMiddleware.isLoggedIn, validMiddleware.isAdmin, userController.updateUserRole);
router.get('/profile/avatar/:id', userController.getAvatar);

/*Category Routes*/
router.get('/categories', categoryController.getAllCategories);
router.get('/categories/:category_id', categoryController.getCategoryById);
router.get('/categories/:category_id/posts', categoryController.getCategoryPosts);
router.post('/categories', mainChecker.emptyBody, validMiddleware.isLoggedIn, validMiddleware.isAdmin, categoryController.createCategory);
router.patch('/categories/:category_id', mainChecker.emptyBody, validMiddleware.isLoggedIn, validMiddleware.isAdmin, categoryController.updateCategory);
router.delete('/categories/:category_id', validMiddleware.isLoggedIn, validMiddleware.isAdmin, categoryController.deleteCategory);

/*Comment Routes*/
router.get('/comments/:comment_id', commentController.getCommentById);
router.get('/comments/:comment_id/like', commentController.getCommentLikes);
router.post('/comments/:comment_id/like', mainChecker.emptyBody, validMiddleware.isLoggedIn, likeController.addCommentLike);
router.patch('/comments/:comment_id', mainChecker.emptyBody, validMiddleware.isLoggedIn, commentController.updateComment);
router.delete('/comments/:comment_id', validMiddleware.isLoggedIn, commentController.deleteComment);
router.delete('/comments/:comment_id/like', validMiddleware.isLoggedIn, likeController.deleteCommentLike);

/*Posts Routes*/
router.get('/posts', postController.getAllPosts);
router.get('/posts/:post_id', postController.getPostById);
router.post('/posts', validMiddleware.isLoggedIn, upload.array('postImages', 10), mainChecker.emptyBody, mainChecker.createPost, postController.createPost);
router.patch('/posts/:post_id', mainChecker.emptyBody, validMiddleware.isLoggedIn, mainChecker.updatePost, postController.updatePost);
router.delete('/posts/:post_id', validMiddleware.isLoggedIn, postController.deletePost);
router.get('/posts/:post_id/comments', commentController.getPostComments);
router.post('/posts/:post_id/comments', mainChecker.emptyBody, validMiddleware.isLoggedIn, mainChecker.createComment, commentController.createComment);
router.get('/posts/:post_id/categories', postController.getPostCategories);
router.get('/posts/:post_id/like', likeController.getPostLikes);
router.post('/posts/:post_id/like', mainChecker.emptyBody, validMiddleware.isLoggedIn, likeController.addPostLike);
router.delete('/posts/:post_id/like', validMiddleware.isLoggedIn, likeController.deletePostLike);

/*Notification Routes*/
router.get('/notifications', validMiddleware.isLoggedIn, notificationController.getUserNotifications);
router.get('/notifications/unread-count', validMiddleware.isLoggedIn, notificationController.getUnreadCount);
router.patch('/notifications/:notification_id/read', validMiddleware.isLoggedIn, mainChecker.validateId, notificationController.markAsRead);
router.patch('/notifications/mark-all-read', validMiddleware.isLoggedIn, notificationController.markAllAsRead);
router.delete('/notifications/:notification_id', validMiddleware.isLoggedIn, mainChecker.validateId, notificationController.deleteNotification);

/*Collection Routes*/
router.get('/collections', collectionController.getPublicCollections);
router.get('/collections/my', validMiddleware.isLoggedIn, collectionController.getUserCollections);
router.get('/collections/:collection_id', mainChecker.validateId, collectionController.getCollectionById);
router.get('/collections/:collection_id/posts', mainChecker.validateId, collectionController.getCollectionPosts);
router.post('/collections', mainChecker.emptyBody, validMiddleware.isLoggedIn, middleChecker.createCollection, collectionController.createCollection);
router.patch('/collections/:collection_id', mainChecker.emptyBody, validMiddleware.isLoggedIn, mainChecker.validateId, collectionController.updateCollection);
router.delete('/collections/:collection_id', validMiddleware.isLoggedIn, mainChecker.validateId, collectionController.deleteCollection);
router.post('/collections/:collection_id/posts/:post_id', mainChecker.emptyBody, validMiddleware.isLoggedIn, mainChecker.validateId, collectionController.addPostToCollection);
router.delete('/collections/:collection_id/posts/:post_id', validMiddleware.isLoggedIn, mainChecker.validateId, collectionController.removePostFromCollection);

/*Follow Routes*/
router.get('/follow/posts', validMiddleware.isLoggedIn, followController.getUserFollowedPosts);
router.post('/posts/:post_id/follow', validMiddleware.isLoggedIn, mainChecker.validateId, followController.followPost);
router.delete('/posts/:post_id/follow', validMiddleware.isLoggedIn, mainChecker.validateId, followController.unfollowPost);
router.get('/posts/:post_id/followers', mainChecker.validateId, followController.getPostFollowers);
router.get('/posts/:post_id/follow-status', validMiddleware.isLoggedIn, mainChecker.validateId, followController.checkFollowStatus);

/*Report Routes*/
router.get('/reports', validMiddleware.isLoggedIn, validMiddleware.isAdmin, middleChecker.getAllReports, reportController.getAllReports);
router.get('/reports/my', validMiddleware.isLoggedIn, reportController.getUserReports);
router.get('/reports/stats', validMiddleware.isLoggedIn, validMiddleware.isAdmin, reportController.getReportsStats);
router.get('/reports/:report_id', validMiddleware.isLoggedIn, validMiddleware.isAdmin, mainChecker.validateId, reportController.getReportById);
router.post('/reports', mainChecker.emptyBody, validMiddleware.isLoggedIn, middleChecker.createReport, reportController.createReport);
router.patch('/reports/:report_id/process', mainChecker.emptyBody, validMiddleware.isLoggedIn, validMiddleware.isAdmin, mainChecker.validateId, middleChecker.processReport, reportController.processReport);
router.delete('/reports/:report_id', validMiddleware.isLoggedIn, mainChecker.validateId, reportController.deleteReport);

module.exports = router;
