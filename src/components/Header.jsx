import React from 'react';
import { useSelector } from 'react-redux';
import '../styles/header.css';
import default_avatar from '../assets/icons/default_avatar.svg'
import { selectIsAuthenticated } from '../store/slices/authSlice';

const Header = () => {
    const isAuthenticated = useSelector(selectIsAuthenticated);

    return (
        <header>
            <div className='logo'>
                <h1>Usof</h1>
            </div>
            <div className='user-data'>
                <img src={default_avatar}></img>
                {!isAuthenticated && (<p>Guest</p>)}
            </div>
            <div>
                {!isAuthenticated && (<p>Log in</p>)}
                {!isAuthenticated && (<p>Sign up</p>)}
                {isAuthenticated && (<p>Log out</p>)}
            </div>
        </header>
    );
}

export default Header;
