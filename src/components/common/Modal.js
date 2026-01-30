import React from 'react';

function Modal({ isOpen, title, message, type, onClose, onConfirm }) {
  if (!isOpen) return null;

  const icons = {
    warning: 'fa-exclamation-triangle',
    error: 'fa-times-circle',
    success: 'fa-check-circle',
    info: 'fa-info-circle'
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className={`modal-icon ${type}`}>
          <i className={`fas ${icons[type] || icons.info}`}></i>
        </div>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          {onConfirm && (
            <button className="btn btn-primary" onClick={onConfirm}>
              Confirm
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Modal;
