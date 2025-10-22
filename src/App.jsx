import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { checkAuth } from './store/slices/authSlice';

 //Layout
import Header from './components/Header';
/*
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
*/

//Sections
import PostsSection from './components/PostsSection';

// Routes
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EmailConfirmationPage from './pages/EmailConfirmationPage';
//Add component on the login page to resend email token where you can put your email
import RequestPasswordResetPage from './pages/RequestPasswordResetPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import PostDetailPage from './pages/PostDetailPage';
/*import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import CreatePostPage from './pages/CreatePostPage';
import EditPostPage from './pages/EditPostPage';
import CategoryPage from './pages/CategoryPage';
import CollectionsPage from './pages/CollectionsPage';
import MyCollectionsPage from './pages/MyCollectionsPage';
import CollectionDetailPage from './pages/CollectionDetailPage';
import NotificationsPage from './pages/NotificationsPage';
import FollowedPostsPage from './pages/FollowedPostsPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
*/

const Layout = () => {
    return (
        <div>
            <Header />
            <main className="flex-grow">
                <Outlet />
            </main>
        </div>
    );
}

function App() {
    const dispatch = useDispatch();

    useEffect(() => { 
        dispatch(checkAuth()); 
    }, [dispatch]);

    return (
        <BrowserRouter>
            <Routes>
                <Route element={<Layout />}>
                <Route path="/" element={<HomePage />}>
                    <Route path="/posts" element={<PostsSection />} />
                    <Route path="/posts/:id" element={<PostDetailPage />} />

                </Route>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/confirm-email" element={<EmailConfirmationPage />} />
                <Route path="/request-reset-password" element={<RequestPasswordResetPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
