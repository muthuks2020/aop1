import React, { useEffect, useState } from 'react';

function Toast({ id, title, message, type = 'success', onClose }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

  const icons = {
    success: 'fa-check-circle',
    warning: 'fa-exclamation-triangle',
    error: 'fa-times-circle',
    info: 'fa-info-circle'
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  return (
    <div className={`toast ${type} ${isVisible ? 'show' : ''}`}>
      <i className={`toast-icon fas ${icons[type]}`}></i>
      <div className="toast-content">
        <div className="toast-title">{title}</div>
        <div className="toast-message">{message}</div>
      </div>
      <button className="toast-close" onClick={handleClose}>
        <i className="fas fa-times"></i>
      </button>
    </div>
  );
}

export default Toast;
