import React from 'react';

function Modal({ isOpen, title, message, type = 'info', onClose, onConfirm }) {
  const icons = {
    warning: 'fa-exclamation-triangle',
    success: 'fa-check-circle',
    info: 'fa-info-circle',
    error: 'fa-times-circle'
  };

  return (
    <div className={`modal ${isOpen ? 'open' : ''}`}>
      <div className="modal-backdrop" onClick={onClose}></div>
      <div className="modal-content">
        <div className={`modal-icon ${type}`}>
          <i className={`fas ${icons[type]}`}></i>
        </div>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default Modal;
