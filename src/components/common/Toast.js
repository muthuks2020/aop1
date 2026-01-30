import React from 'react';

function Toast({ id, title, message, type, onClose }) {
  const icons = {
    success: 'fa-check-circle',
    error: 'fa-times-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  };

  return (
    <div className={`toast ${type}`}>
      <div className="toast-icon">
        <i className={`fas ${icons[type] || icons.info}`}></i>
      </div>
      <div className="toast-content">
        <div className="toast-title">{title}</div>
        <div className="toast-message">{message}</div>
      </div>
      <button className="toast-close" onClick={() => onClose(id)}>
        <i className="fas fa-times"></i>
      </button>
    </div>
  );
}

export default Toast;
