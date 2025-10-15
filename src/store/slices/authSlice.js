import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../services/axios';

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
    try {
        const response = await axios.post('/auth/login', credentials);
        sessionStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data.user;
    } catch (error) {
        return rejectWithValue(error.response?.data?.error || 'Login failed');
    }
});

export const register = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
    try {
        const response = await axios.post('/auth/register', userData);
        return response.data.message;
    } catch (error) {
        return rejectWithValue(error.response?.data?.error || 'Registration failed');
    }
});

export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
    try {
        await axios.post('/auth/logout');
        sessionStorage.removeItem('user');
        return null;
    } catch (error) {
        return rejectWithValue(error.response?.data?.error || 'Logout failed');
    }
});

export const checkAuth = createAsyncThunk('auth/checkAuth', async (_, { rejectWithValue }) => {
    try {
        const stored = sessionStorage.getItem('user');
        if (stored) { return JSON.parse(stored); }
        return null;
    } catch (error) {
        return rejectWithValue('Auth check failed');
    }
});

export const confirmEmail = createAsyncThunk('auth/confirmEmail', async (token, { rejectWithValue }) => {
    try {
        const response = await axios.get(`/auth/confirm-email?token=${token}`);
        return response.data.message;
    } catch (error) {
        return rejectWithValue(error.response?.data?.error || 'Confirmation failed');
    }
});

export const resendEmailToken = createAsyncThunk('auth/resendEmailToken', async (email, { rejectWithValue }) => {
    try {
        const response = await axios.post('/auth/send-email-token-again', { email });
        return response.data.message;
    } catch (error) {
        return rejectWithValue(error.response?.data?.error || 'Failed to resend token');
    }
});

export const requestPasswordReset = createAsyncThunk('auth/requestPasswordReset', async (email, { rejectWithValue }) => {
    try {
        const response = await axios.post('/auth/reset-password-request', { email });
        return response.data.message;
    } catch (error) {
        return rejectWithValue(error.response?.data?.error || 'Request failed');
    }
});

export const resetPassword = createAsyncThunk('auth/resetPassword' , async ({ token, password, confirmRassword }, { rejectWithValue }) => {
    try {
        const response = await axios.post('/auth/reset-password', { 
            token, 
            password,
            'confirm-password': confirmRassword
        });
        return response.data.message;
    } catch (error) {
        return rejectWithValue(error.response?.data?.error || 'Reset failed');
    }
});

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null,
        loading: false,
        isAuthenticated: false,
        emailConfirmationMessage: null,
        passwordResetMessage: null,
        error: null
    },
    reducers: {
        clearError: (state) => { state.error = null; },
        updateUser: (state, action) => { 
            state.user = { ...state.user, ...action.payload }; 
            sessionStorage.setItem('user', JSON.stringify(state.user));
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(login.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.isAuthenticated = true;
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(register.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(register.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(register.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(logout.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(logout.fulfilled, (state) => {
                state.user = null;
                state.isAuthenticated = false;
                state.loading = false;
            })
            .addCase(logout.rejected, (state, action) => {
                state.error = action.payload;
                state.loading = false;
            })
            .addCase(checkAuth.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(checkAuth.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuthenticated =!!action.payload;
                state.user = action.payload;
            })
            .addCase(checkAuth.rejected, (state) => {
                state.loading = false;
                state.user = null;
                state.isAuthenticated = false;
            })
            .addCase(confirmEmail.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.emailConfirmationMessage = null;
            })
            .addCase(confirmEmail.fulfilled, (state, action) => {
                state.loading = false;
                state.emailConfirmationMessage = action.payload;
            })
            .addCase(confirmEmail.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.emailConfirmationMessage = null;
            })
            .addCase(resendEmailToken.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.emailConfirmationMessage = null;
            })
            .addCase(resendEmailToken.fulfilled, (state, action) => {
                state.loading = false;
                state.emailConfirmationMessage = action.payload;
            })
            .addCase(resendEmailToken.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.emailConfirmationMessage = null;
            })
            .addCase(requestPasswordReset.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.passwordResetMessage = null;
            })
            .addCase(requestPasswordReset.fulfilled, (state, action) => {
                state.loading = false;
                state.passwordResetMessage = action.payload;
            })
            .addCase(requestPasswordReset.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.passwordResetMessage = null;
            });
    }
});

export const { clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;

export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsAdmin = (state) => state.auth.user?.role === 'admin';
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectConfirmationMessage = (state) => state.auth.emailConfirmationMessage;
export const selectResetMessage = (state) => state.auth.passwordResetMessage;
