import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    selectNotifications,
    selectUnreadCount
} from '../store/slices/notificationsSlice';

const NotificationDropdown = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const notifications = useSelector(selectNotifications);
    const unreadCount = useSelector(selectUnreadCount);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        dispatch(fetchUnreadCount());
        const interval = setInterval(() => { dispatch(fetchUnreadCount()); }, 30000);
        return () => clearInterval(interval);
    }, [dispatch]);

    useEffect(() => {
        if (isOpen) { dispatch(fetchNotifications()); }
    }, [isOpen, dispatch]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) { setIsOpen(false); }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = async (notification) => {
        if (!notification.is_read) {
            await dispatch(markAsRead(notification.id));
        }
        
        if (notification.target_type === 'post' && notification.target_id) {
            navigate(`/posts/${notification.target_id}`);
        } else if (notification.target_type === 'comment' && notification.target_id) {
            navigate(`/posts/${notification.target_id}`);
        }
        
        setIsOpen(false);
    };

    const handleMarkAllRead = () => {
        dispatch(markAllAsRead());
    };

    const handleDelete = (e, id) => {
        e.stopPropagation();
        dispatch(deleteNotification(id));
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="notification-dropdown" ref={dropdownRef}>
            <button className="notification-bell" onClick={() => setIsOpen(!isOpen)}>
                🔔
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div className="notification-panel">
                    <div className="notification-header">
                        <h3>Notifications</h3>
                        {notifications.length > 0 && (
                            <button onClick={handleMarkAllRead} className="mark-all-btn">
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <div className="no-notifications">
                                <p>No notifications</p>
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <div
                                    key={notif.id}
                                    className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
                                    onClick={() => handleNotificationClick(notif)}
                                >
                                    <div className="notification-content">
                                        <p className="notification-message">{notif.message}</p>
                                        <span className="notification-time">
                                            {formatDate(notif.created_at)}
                                        </span>
                                    </div>
                                    <button className="delete-notif-btn"onClick={(e) => handleDelete(e, notif.id)}>×</button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
