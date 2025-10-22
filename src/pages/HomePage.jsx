import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import NavigationSection from '../components/NavigationSection';
import '../styles/home.css'


const HomePage = () => {
    return (
        <div className="home-page">
            <div className='div1'><NavigationSection /></div>
            <div className='div2'><Outlet /></div>
        </div>
    );
};

export default HomePage;
