import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../store/slices/authSlice';
import messageIcon from '../assets/icons/message-icon.svg';
import follow from '../assets/icons/follow.svg';
import star from '../assets/icons/star.svg';
import '../styles/home.css';

const HomePage = () => {
    const isAuthenticated = useSelector(selectIsAuthenticated);

    return (
        <div className="home-page">
            <div className="home-background"></div>
            <div className="home-content">
                <div className="hero-section">
                    <h1 className="hero-title">Welcome to USOF</h1>
                    <p className="hero-subtitle">
                        Your Ultimate Q&A Platform
                    </p>
                    <p className="hero-description">
                        Ask questions, share knowledge, and connect with developers worldwide.
                        Join our community and get answers to your programming challenges!
                    </p>
                    
                    <div className="hero-actions">
                        {!isAuthenticated ? (
                            <>
                                <Link to="/register" className="hero-btn primary">Get Started</Link>
                                <Link to="/login" className="hero-btn secondary">Sign In</Link>
                            </>
                        ) : (
                            <>
                                <Link to="/posts" className="hero-btn primary">Browse Questions</Link>
                                <Link to="/posts/create" className="hero-btn secondary">Ask a Question</Link>
                            </>
                        )}
                    </div>
                </div>

                <div className="features-section">
                    <div className="feature-card">
                        <div className="feature-icon"><img src={messageIcon} alt="message icon" /></div>
                        <h3>Ask & Answer</h3>
                        <p>Post your questions and get answers from experienced developers</p>
                    </div>
                    
                    <div className="feature-card">
                        <h3>Build Reputation</h3>
                        <p>Earn points by helping others and sharing your knowledge</p>
                        <div className="feature-icon"><img src={star} alt="star icon" /></div>
                    </div>
                    
                    <div className="feature-card">
                        <div className="feature-icon"><img src={follow} alt="follow icon" /></div>
                        <h3>Follow</h3>
                        <p>Follow topics that interest you</p>
                    </div>
                </div>

                <div className="cta-section">
                    <h2>Ready to start learning?</h2>
                    <p>Join other developers sharing knowledge</p>
                    <Link to="/posts" className="cta-button">Go to the Posts →</Link>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
