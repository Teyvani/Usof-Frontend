import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    resetPassword,
    clearError,
    clearMessages,
    selectAuthLoading,
    selectAuthError,
    selectResetMessage
} from '../store/slices/authSlice';

const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [localError, setLocalError] = useState('');

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const loading = useSelector(selectAuthLoading);
    const error = useSelector(selectAuthError);
    const message = useSelector(selectResetMessage);

    useEffect(() => {
        return () => {
            dispatch(clearError());
            dispatch(clearMessages());
        }
    }, [dispatch]);

    useEffect(() => {
        if (message && !error) {
            setTimeout(() => navigate('/login'), 2000);
        }
    }, [message, error, navigate]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setLocalError('');

        if (formData.password !== formData.confirmPassword) {
            setLocalError('Passwords do not match');
            return;
        }
        if (formData.password.length < 8) {
            setLocalError('Password must be at least 8 characters');
            return;
        }

        const token = searchParams.get('token');
        console.log(token || "can't see");
        
        dispatch(resetPassword({
            token,
            password: formData.password,
            confirmPassword: formData.confirmPassword
        }));
    }

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className='auth-page'>
            <div className="home-background"></div>
            <div className='auth-card'>
                <h2 className='auth-title'>Reset Password</h2>
                {localError && <div className='error-message'>{localError}</div>}
                {error && <div className='error-message'>{error}</div>}
                {message && (<div className='success-message'>
                    <p>{message}</p>
                    <p className='redirect-text'>Redirecting to login...</p>
                    </div>
                )}
                {!message && (
                    <form onSubmit={handleSubmit} className='auth-form'>
                        <div className='form-group'>
                            <label htmlFor='password'>New Password</label>
                            <input
                                type='password'
                                id='password'
                                name='password'
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className='form-group'>
                            <label htmlFor='confirmPassword'>Confirm Password</label>
                            <input
                                type='password'
                                id='confirmPassword'
                                name='confirmPassword'
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>
                            <button type='submit' className='auth-button submit-button' disabled={loading}>
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPasswordPage;
