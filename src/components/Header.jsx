import React from 'react';
import '../styles/header.css';
import default_avatar from '../assets/icons/default_avatar.svg'

const Header = () => {
    return (
        <header>
            <div className='logo'>
                <h1>Usof</h1>
            </div>
            <div className='user-data'>
                <img src={default_avatar}></img>
                <p>Guest</p>
            </div>
            <div>
                <p>Log in</p>
                <p>Log out</p>
            </div>
        </header>
    );
}

export default Header;
