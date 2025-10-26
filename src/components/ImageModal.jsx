import React from 'react';
import '../styles/image-modal.css';

const ImageModal = ({ image, onClose }) => {
    if (!image) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="image-modal-backdrop" onClick={handleBackdropClick}>
            <div className="image-modal-content">
                <button className="image-modal-close" onClick={onClose}>×</button>
                <img src={image} alt="Full size" className="image-modal-img" />
            </div>
        </div>
    );
};

export default ImageModal;
