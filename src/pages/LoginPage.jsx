import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    login,
    clearError,
    selectAuthError,
    selectAuthLoading,
    selectIsAuthenticated
} from '../store/slices/authSlice';

import '../styles/auth.css';

const LoginPage = () => {
    const [loginOrEmail, setLoginOrEmail] = useState('');
    const [password, setPassword] = useState('');
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    const error = useSelector(selectAuthError);
    const loading = useSelector(selectAuthLoading);
    const isAuthenticated = useSelector(selectIsAuthenticated);

    useEffect(() => {
        if (isAuthenticated) navigate('/');
    }, [isAuthenticated, navigate]);
    useEffect(() => {
        return () => { dispatch(clearError()) }
    }, [dispatch]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (loading) return;

        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginOrEmail);
        const payload = isEmail
            ? { email: loginOrEmail, password }
            : { login: loginOrEmail, password };
            
        const result = dispatch(login(payload));
        if (login.fulfilled.match(result)) {
            navigate('/');
        }
    };
    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    return (
        <div className='auth-page'>
            <div className='auth-card'>
                <h2 className='auth-title'>Log in to USOF</h2>
                <form onSubmit={handleSubmit} className='auth-form'>
                    {error && (<div className='error-message'>{error}</div>)}
                    <div className='form-group'>
                        <label htmlFor='login'>Login:</label>
                        <input type='text' id='login' name= 'login' placeholder='Enter your username or email' value={credentials.login} onChange={handleChange} required/> 
                    </div>
                    <div className='form-group'>
                        <label htmlFor='password'>Password:</label>
                        <input type='password' id='password' name='password' placeholder='Enter your password' value={credentials.password} onChange={handleChange} required />
                    </div>
                    <div className='form-footer'>
                        <Link to='/register'>Don't have an account? Register</Link>
                        <Link to='/reset-password'>Forgot Password?</Link>
                        {/* Add UI to resend email confirmation */}
                    </div>
                    <button type='submit' disabled={loading} className='submit-button'>{loading ? 'Logging in...' : 'Sign in'}</button>
                </form>
            </div>
        </div>
    )
}

export default LoginPage;
