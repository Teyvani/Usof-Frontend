import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    register,
    clearError,
    selectAuthError,
    selectAuthLoading,
    selectConfirmationMessage
} from '../store/slices/authSlice';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        login: '',
        full_name: '',
        email: '',
        password: '',
        confirm_password: ''
    });
    const [localError, setLocalError] = useState('');

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const error = useSelector(selectAuthError);
    const loading = useSelector(selectAuthLoading);
    const confirmationMessage = useSelector(selectConfirmationMessage);

    useEffect(() => {
        return () => dispatch(clearError());
    }, [dispatch]);

    useEffect(() => {
        if (confirmationMessage) { setTimeout(() => navigate('/login'), 5000); }
    }, [confirmationMessage, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');
        if (loading) return;
        if (formData.password !== formData.confirm_password) {
            setLocalError('Passwords do not match');
            return;
        }
        await dispatch(register(formData));
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className='auth-page'>
            <div className='auth-card'>
                <h2 className='auth-title'>Create Account</h2>
                <form onSubmit={handleSubmit} className='auth-form'>
                    {(error || localError) && (<div className='error-message'>{error || localError}</div>)}
                    {confirmationMessage && (<div className='confirmation-message'>{confirmationMessage}<p className='redirect-text'>Redirecting to login...</p></div>)}
                    <div className='form-group'>
                        <label htmlFor='login'>Username *</label>
                        <input type='text' id='login' name='login' value={formData.login} placeholder='Choose a username' required onChange={handleChange} />
                    </div>
                    <div className='form-group'>
                        <label htmlFor='full_name'>Full Name:</label>
                        <input type='text' id='full_name' name='full_name' value={formData.full_name} placeholder='Enter your full name here' required onChange={handleChange} />
                    </div>
                    <div className='form-group'>
                        <label htmlFor='email'>Email:</label>
                        <input type='email' id='email' name='email' value={formData.email} placeholder='Enter your email here' required onChange={handleChange} />
                    </div>
                    <div className='form-group'>
                        <label htmlFor='password'>Password:</label>
                        <input type='password' id='password' name='password' value={formData.password} placeholder='Enter password here' required onChange={handleChange} />
                    </div>
                    <div className='form-group'>
                        <label htmlFor='confirm_password'>Confirm Password:</label>
                        <input type='password' id='confirm_password' name='confirm_password' value={formData.confirm_password} placeholder='Confirm password here' required onChange={handleChange} />
                    </div>
                    <div className='form-footer'>
                        <Link to='/login'>Already have an account? Log in</Link>
                    </div>
                    <button type='submit' className='submit-button' disabled={loading}>{loading ? 'Creating account...' : 'Create Account'}</button>
                </form>
            </div>
        </div>
    )
}

export default RegisterPage;
