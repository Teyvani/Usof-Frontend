import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import postsReducer from './slices/postsSlice';
/*import notificationsReducer from './slices/notificationsSlice';
*/

export const store = configureStore({
    reducer: {
        auth: authReducer,
        posts: postsReducer
        /*notifications: notificationsReducer,*/
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }),
    devTools: process.env.NODE_ENV !== 'production',
});

export default store;
