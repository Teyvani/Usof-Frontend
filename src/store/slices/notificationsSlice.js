import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from '../../services/axios';

export const fetchNotifications = createAsyncThunk('notifications/fetchNotifications', async (__dirname, { rejectWithValue }) => {
    try {
        const response = await axios.get('/notifications');
        return response.data.notifications;
    } catch (error) {
        return rejectWithValue(error.response?.data?.error || 'Failed to fetch notifications');
    }
});

export const fetchUnreadCount = createAsyncThunk(
    'notifications/fetchUnreadCount',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get('/notifications/unread-count');
            return response.data.unread_count;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch count');
        }
    }
);

export const markAsRead = createAsyncThunk(
    'notifications/markAsRead',
    async (notificationId, { rejectWithValue }) => {
        try {
            await axios.patch(`/notifications/${notificationId}/read`);
            return notificationId;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to mark as read');
        }
    }
);

export const markAllAsRead = createAsyncThunk(
    'notifications/markAllAsRead',
    async (_, { rejectWithValue }) => {
        try {
            await axios.patch('/notifications/mark-all-read');
            return true;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to mark all as read');
        }
    }
);

export const deleteNotification = createAsyncThunk(
    'notifications/deleteNotification',
    async (notificationId, { rejectWithValue }) => {
        try {
            await axios.delete(`/notifications/${notificationId}`);
            return notificationId;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to delete');
        }
    }
);

const notificationsSlice = createSlice({
    name: 'notifications',
    initialState: {
        notifications: [],
        unreadCount: 0,
        loading: false,
        error: null
    },
    reducers: {
        clearError: (state) => {
            state.error = null;
        }
    }});
