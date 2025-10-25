import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { 
    selectUser,
    selectIsAuthenticated,
    logout
} from '../store/slices/authSlice';

import '../styles/header.css';
import default_avatar from '../assets/icons/default_avatar.svg'

const Header = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const user = useSelector(selectUser);
    const [searchQuery, setSearchQuery] = useState('');

    const handleLogout = async () => {
        await dispatch(logout());
        navigate('/login');
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/posts?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    }

    return (
        <header>
            <div className='logo'>
                <Link to='/'><h1>Usof</h1></Link>
            </div>
            <nav className="main-nav">
                <Link to="/" className={`nav-link`}>Home</Link>
                <Link to="/posts" className={`nav-link`}>Posts</Link>
            </nav>
            <form className='search-bar' onSubmit={handleSearch}>
                <input id='header-search-bar' type='text' placeholder='Search posts...' className='search-input' value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
            </form>
            <div className='user-data'>
                <Link to={isAuthenticated ? `/profile/${user?.id}` : '/login'} className='user-info'>
                    <img src={isAuthenticated 
                        ? user.profile_picture !== 'uploads/default_profile.png'
                        ? `../../API/${user.profile_picture}` : default_avatar 
                        : default_avatar} alt='avatar'>
                    </img>
                    <div>
                        <p>{isAuthenticated ? user?.login : 'Guest'}</p>
                        {isAuthenticated && (<p className='user-role'>{user?.role}</p>)}
                    </div>
                </Link>
            </div>
            <div className='auth-buttons'>
                {!isAuthenticated && (
                    <>
                        <Link to="/login" className="header-btn">Log in</Link>
                        <Link to="/register" className="header-btn">Sign up</Link>
                    </>)}
                {isAuthenticated && (
                    <button onClick={handleLogout} className='header-btn logout-btn'>Log out</button>
                )}
            </div>
        </header>
    );
}

export default Header;
