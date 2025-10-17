import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
    requestPasswordReset,
    clearError,
    clearMessages,
    selectAuthError,
    selectAuthLoading,
    selectResetMessage
} from '../store/slices/authSlice';

const RequestPasswordResetPage = () => {
    const [email, setEmail] = useState('');
    const dispatch = useDispatch();
    const loading = useSelector(selectAuthLoading);
    const error = useSelector(selectAuthError);
    const message = useSelector(selectResetMessage);

    useEffect(() => {
        return () => {
            dispatch(clearError());
            dispatch(clearMessages());
        };
    }, [dispatch]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (loading) return;
        dispatch(requestPasswordReset(email));
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h2 className="auth-title">Request Password Reset</h2>
                <form onSubmit={handleSubmit} className="auth-form">
                    {error && <div className="error-message">{error}</div>}
                    {message && <div className="success-message">
                        <p>{message}</p>
                        <p>Check your email for reset instructions.</p>
                        </div>}
                    <div className="form-group">
                        <label htmlFor="email">Email:</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <Link to="/login" className="auth-link">Back to Login</Link>
                    </div>
                    <button type="submit" disabled={loading} className="submit-button">
                        {loading ? 'Sending...' : 'Send Password Reset Email'}
                    </button>
                </form>
            </div>
        </div>
    )
};

export default RequestPasswordResetPage;
