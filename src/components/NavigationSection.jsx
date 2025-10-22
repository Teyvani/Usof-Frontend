import React from "react";
import { useNavigate, Link } from "react-router-dom";

const NavigationSection = () => {
    return (
        <div className="navigation">
            <div><Link to='/'>Home</Link></div>
            <div><Link to='/posts'>Posts</Link></div>
            <div>Categories</div>
            <div>Collections</div>
        </div>
    );
}

export default NavigationSection;
