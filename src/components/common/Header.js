import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Utils } from '../../utils/helpers';

function Header({ 
  user, 
  onRefresh, 
  completionPercent, 
  submittedCount, 
  totalCount, 
  approvedCount, 
  pendingCount 
}) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-left">
          <div className="logo-box">
            <img src={process.env.PUBLIC_URL + '/appasamy-logo.png'} alt="Appasamy Associates" className="logo-image" />
          </div>
          <div className="header-title">
            <h1>Product Commitment</h1>
            <div className="header-subtitle">
              <span className="fiscal-badge">
                <i className="fas fa-calendar-alt"></i> FY 2025-26
              </span>
              <span className="territory-badge">
                <i className="fas fa-map-marker-alt"></i> {user?.territory || 'Territory'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="header-right">
          <button className="icon-btn" onClick={onRefresh} title="Refresh">
            <i className="fas fa-sync-alt"></i>
          </button>
          
          <div className="user-chip-wrapper" style={{ position: 'relative' }}>
            <div 
              className="user-chip" 
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="user-avatar">
                <span>{Utils.getInitials(user?.name)}</span>
                <span className="status-dot online"></span>
              </div>
              <div className="user-info">
                <span className="user-name">{user?.name}</span>
                <span className="user-role">{user?.roleLabel}</span>
              </div>
              <i className="fas fa-chevron-down"></i>
            </div>
            
            {showUserMenu && (
              <div className="user-menu" style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0.5rem',
                background: 'var(--surface)',
                borderRadius: 'var(--radius)',
                boxShadow: 'var(--shadow-lg)',
                minWidth: '200px',
                zIndex: 100,
                overflow: 'hidden'
              }}>
                <div style={{ 
                  padding: '1rem', 
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--surface-alt)'
                }}>
                  <div style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{user?.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{user?.roleLabel}</div>
                </div>
                <button 
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: 'none',
                    background: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.625rem',
                    color: 'var(--danger)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    transition: 'var(--transition)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'var(--danger-light)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <i className="fas fa-sign-out-alt"></i>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Progress Section */}
      <div className="progress-section">
        <div className="progress-stats">
          <div className="progress-stat">
            <span className="progress-label">Completion</span>
            <span className="progress-value">{completionPercent}%</span>
          </div>
          <div className="progress-stat">
            <span className="progress-label">Submitted</span>
            <span className="progress-value">{submittedCount}/{totalCount}</span>
          </div>
          <div className="progress-stat">
            <span className="progress-label">Approved</span>
            <span className="progress-value approved">{approvedCount}</span>
          </div>
          <div className="progress-stat">
            <span className="progress-label">Pending</span>
            <span className="progress-value pending">{pendingCount}</span>
          </div>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${completionPercent}%` }}
          ></div>
        </div>
      </div>
    </header>
  );
}

export default Header;
