import React, { useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    confirmEmail,
    clearError,
    clearMessages,
    selectAuthLoading,
    selectAuthError,
    selectConfirmationMessage
} from '../store/slices/authSlice';

const EmailConfirmationPage = () => {
    const [searchParams] = useSearchParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const loading = useSelector(selectAuthLoading);
    const error = useSelector(selectAuthError);
    const message =  useSelector(selectConfirmationMessage);

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) { dispatch(confirmEmail(token)); }

        return () => {
            dispatch(clearError());
            dispatch(clearMessages());
        }
    }, [dispatch, searchParams]);

    useEffect(() => {
        if (message && !error) { setTimeout(() => navigate('/login'), 2000);}
    }, [message, error, navigate]);

    return (
        <div className='auth-page'>
            <div className='auth-card'>
                <h2 className='auth-title'>Email Confirmation</h2>
            </div>
            {loading && (
                <p className='confirmation-message'>Confirming your email...</p>
            )}

            {error && (
                <div className='error-message'>
                    {error}
                    <div className='form-footer'>
                        <Link to='/login' className='auth-link'>Go to Login</Link>
                        <Link to='/register' className='auth-link'>Go to Register</Link>
                    </div>
                </div>
            )}

            {message && (
                <div className='success-message'>
                    <p>{message}</p>
                    <p className='redirect-text'>Redirecting to login...</p>
                </div>
            )}
        </div>
    );
};

export default EmailConfirmationPage;
