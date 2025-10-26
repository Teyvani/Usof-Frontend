const notificationModel = require('../models/notificationModel');

exports.getUserNotifications = (req, res) => {
    try {
        const userId = req.session.user.id;

        notificationModel.getUserNotifications(userId, (err, notifications) => {
            if (err) {
                console.error('Error fetching notifications:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            res.json({ notifications });
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getUnreadCount = (req, res) => {
    try {
        const userId = req.session.user.id;

        notificationModel.getUnreadNotificationsCount(userId, (err, count) => {
            if (err) {
                console.error('Error fetching unread count:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            res.json({ unread_count: count });
        });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.markAsRead = (req, res) => {
    try {
        const notificationId = req.params.notification_id;
        const userId = req.session.user.id;

        notificationModel.markNotificationAsRead(notificationId, userId, (err, results) => {
            if (err) {
                console.error('Error marking notification as read:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (results.affectedRows === 0) return res.status(404).json({ error: 'Notification not found' });

            res.json({ message: 'Notification marked as read' });
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.markAllAsRead = (req, res) => {
    try {
        const userId = req.session.user.id;

        notificationModel.markAllNotificationsAsRead(userId, (err) => {
            if (err) {
                console.error('Error marking all notifications as read:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            res.json({ message: 'All notifications  marked as read' });
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deleteNotification = (req, res) => {
    try {
        const notificationId = req.params.notification_id;
        const userId = req.session.user.id;

        notificationModel.deleteNotification(notificationId, userId, (err, results) => {
            if (err) {
                console.error('Error deleting notification:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (results.affectedRows === 0) return res.status(404).json({ error: 'Notification not found' });

            res.json({ message: 'Notification deleted successfully' });
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
