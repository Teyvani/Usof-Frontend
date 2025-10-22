import { createSlice, createAsyncThunk, current } from "@reduxjs/toolkit";
import axios from '../../services/axios';

export const fetchPosts =  createAsyncThunk('posts/fetchPosts', async (filters = {}, { rejectWithValue }) => {
    try {
        const params = new URLSearchParams();
        if (filters.sort_by) params.append('sort_by', filters.sort_by);
        if (filters.categories) params.append('categories', filters.categories);
        if (filters.status) params.append('categories', filters.status);
        if (filters.date_from) params.append('date_from', filters.date_from);
        if (filters.date_to) params.append('date_to', filters.date_to);
        if (filters.limit) params.append('limit', filters.limit);
        if (filters.offset) params.append('offset', filters.offset);

        const response = await axios.get(`/posts?${params}`);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.error || 'Failed to fetch posts');
    }
});

export const fetchPostById = createAsyncThunk('posts/fetchPostById', async (postId, { rejectWithValue }) => {
    try {
        const response = await axios.get(`/posts/${postId}`);
        return response.data.post;
    } catch (error) {
        return rejectWithValue(error.response?.data?.error || 'Failed to fetch post');
    }
});

export const createPost = createAsyncThunk('posts/createPost', async (formData, { rejectWithValue }) => {
    try {
        const response = await axios.post('/posts', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data.post;
    } catch (error) {
        return rejectWithValue(error.response?.data?.error || 'Failed to create post');
    }
});

export const updatePost = createAsyncThunk('posts/updatePost', async ({ postId, data }, { rejectWithValue }) => {
    try {
        const response = await axios.patch(`/posts/${postId}`, data);
        return response.data.post;
    } catch (error) {
        return rejectWithValue(error.response?.data?.error || 'Failed to update post');
    }
});

export const deletePost = createAsyncThunk('posts/deletePost', async (postId, { rejectWithValue }) => {
    try {
        await axios.delete(`/posts/${postId}`);
        return postId;
    } catch (error) {
        return rejectWithValue(error.response?.data?.error || 'Failed to delete post');
    }
});

export const likePost = createAsyncThunk('posts/likePost', async ({ postId, type }, { rejectWithValue }) => {
    try {
        const response = await axios.post(`/posts/${postId}/like`, { type });
        return { postId, ...response.data };
    } catch (error) {
        return rejectWithValue(error.response?.data?.error || 'Failed to like post');
    }
});

export const unlikePost = createAsyncThunk('posts/unlikePost', async (postId, { rejectWithValue }) => {
    try {
        await axios.delete(`/posts/${postId}/like`);
        return postId;
    } catch (error) {
        return rejectWithValue(error.response?.data?.error || 'Failed to unlike post');
    }
});

export const followPost = createAsyncThunk('posts/followPost', async (postId, { rejectWithValue }) => {
    try {
        await axios.post(`/posts/${postId}/follow`);
        return postId;
    } catch (error) {
        return rejectWithValue(error.response?.data?.error || 'Failed to follow post');
    }
});

export const unfollowPost = createAsyncThunk('posts/unfollowPost', async (postId, { rejectWithValue }) => {
    try {
        await axios.delete(`/posts/${postId}/follow`);
        return postId;
    } catch (error) {
        return rejectWithValue(error.response?.data?.error || 'Failed to unfollow post');
    }
});

export const fetchPostComments = createAsyncThunk('posts/fetchPostComments', async (postId, { rejectWithValue }) => {
    try {
        const response = await axios.get(`/posts/${postId}/comments`);
        return { postId, comments: response.data.comments };
    } catch (error) {
        return rejectWithValue(error.response?.data?.error || 'Failed to fetch comments');
    }
});

export const createComment = createAsyncThunk('posts/createComment', async ({ postId, content, parent_comment_id }, { rejectWithValue }) => {
    try {
        const response = await axios.post(`/posts/${postId}/comments`, {
            content,
            parent_comment_id
        });
        return { postId, comment: response.data.comment };
    } catch (error) {
        return rejectWithValue(error.response?.data?.error || 'Failed to create comment');
    }
});

export const updateComment = createAsyncThunk('posts/updateComment', async ({ commentId, content }, { rejectWithValue }) => {
    try {
        const response = await axios.patch(`/comments/${commentId}`, { content });
        return response.data.comment;
    } catch (error) {
        return rejectWithValue(error.response?.data?.error || 'Failed to update comment');
    }
});

export const deleteComment = createAsyncThunk('posts/deleteComment', async ({ commentId, postId }, { rejectWithValue }) => {
    try {
        await axios.delete(`/comments/${commentId}`);
        return { commentId, postId };
    } catch (error) {
        return rejectWithValue(error.response?.data?.error || 'Failed to delete comment');
    }
});

export const likeComment = createAsyncThunk('posts/likeComment', async ({ commentId, type }, { rejectWithValue }) => {
    try {
        const response = await axios.post(`/comments/${commentId}/like`, { type });
        return { commentId, ...response.data };
    } catch (error) {
        return rejectWithValue(error.response?.data?.error || 'Failed to like comment');
    }
});

export const unlikeComment = createAsyncThunk('posts/unlikeComment', async (commentId, { rejectWithValue }) => {
    try {
        await axios.delete(`/comments/${commentId}/like`);
        return commentId;
    } catch (error) {
        return rejectWithValue(error.response?.data?.error || 'Failed to unlike comment');
    }
});

const postsSlice = createSlice({
    name: 'posts',
    initialState: {
        posts: [],
        currentPost: null,
        comments: {},
        loading: false,
        pagination: {
            limit: 20,
            offset: 0,
            hasMore: true
        },
        error: null
    },
    reducers: {
        clearError: (state) => { state.error = null; },
        clearCurrentPost: (state) => { state.currentPost = null; }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchPosts.pending, (state) => {
                state.loading = true;
                state.error = null
            })
            .addCase(fetchPosts.fulfilled, (state, action) => {
                state.loading = false;
                state.posts = action.payload.posts;
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchPosts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(fetchPostById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPostById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentPost = action.payload;
            })
            .addCase(fetchPostById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(createPost.fulfilled, (state, action) => {
                state.posts.unshift(action.payload);
            })
            .addCase(updatePost.fulfilled, (state, action) => {
                const index = state.posts.findIndex(p => p.id === action.payload.id);
                if (index !== -1) state.posts[index] = action.payload;
                if (state.currentPost?.id === action.payload.id) {
                    state.currentPost = action.payload;
                }
            })
            .addCase(deletePost.fulfilled, (state, action) => {
                state.posts = state.posts.filter(p => p.id !== action.payload);
                if (state.currentPost?.id === action.payload) {
                    state.currentPost = null;
                }
            })
            .addCase(fetchPostComments.fulfilled, (state, action) => {
                state.comments[action.payload.postId] = action.payload.comments;
            })
            .addCase(createComment.fulfilled, (state, action) => {
                const { postId, comment } = action.payload;
                if (!state.comments[postId]) { state.comments[postId] = []; }
                state.comments[postId].push(comment);
                if (state.currentPost?.id === postId) {
                    state.currentPost.comments_count++;
                }
            })
            .addCase(deleteComment.fulfilled, (state, action) => {
                const { commentId, postId } = action.payload;
                if (state.comments[postId]) {
                    state.comments[postId] = state.comments[postId].filter(c => c.id !== commentId);
                }
                if (state.currentPost?.id === postId) {
                    state.currentPost.comments_count--;
                }
            })
            .addCase(updateComment.fulfilled, (state, action) => {
                const comment = action.payload;
                Object.keys(state.comments).forEach(postId => {
                    const index = state.comments[postId].findIndex(c => c.id === comment.id);
                    if (index !== -1) {
                        state.comments[postId][index] = comment;
                    }
                });
            });
    }
});

export const { clearError, clearCurrentPost } = postsSlice.actions;
export default postsSlice.reducer;

export const selectPosts = (state) => state.posts.posts;
export const selectCurrentPost = (state) => state.posts.currentPost;
export const selectPostComments = (postId) => (state) => state.posts.comments[postId] || [];
export const selectPostsLoading = (state) => state.posts.loading;
export const selectPostsError = (state) => state.posts.error;
export const selectPagination = (state) => state.posts.pagination;
