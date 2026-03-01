/**
 * Header Component — v5
 *
 * Works with both old (user.name, user.territory) and new
 * (user.fullName, user.territoryName) fields thanks to backward compat
 * mapping in AuthContext.mapUserFromBackend().
 *
 * CHANGES:
 * - Uses user.fullName with user.name fallback
 * - Shows geography breadcrumb if available
 * - Shows email in user menu if available
 *
 * @version 5.0.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Utils } from '../../utils/helpers';

function Header({ user: userProp, onRefresh }) {
  const { logout, user: authUser } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Use prop first, fallback to auth context
  const user = userProp || authUser;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Display name: fullName > name > 'User'
  const displayName = user?.fullName || user?.name || 'User';
  // Display territory: territoryName > territory > 'Territory'
  const displayTerritory = user?.territoryName || user?.territory || 'Territory';

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-left">
          <div className="logo-box">
            <img
              src={process.env.PUBLIC_URL + '/appasamy-logo.png'}
              alt="Appasamy Associates"
              className="logo-image"
              onError={(e) => (e.target.style.display = 'none')}
            />
          </div>
          <div className="header-title">
            <h1>Product Commitment</h1>
            <div className="header-subtitle">
              <span className="fiscal-badge">
                <i className="fas fa-calendar-alt"></i> FY 2026-27
              </span>
              <span className="territory-badge">
                <i className="fas fa-map-marker-alt"></i> {displayTerritory}
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
                {Utils.getInitials(displayName)}
              </div>
              <div className="user-info">
                <span className="user-name">{displayName}</span>
                <span className="user-role">{user?.roleLabel}</span>
              </div>
              <i
                className={`fas fa-chevron-${showUserMenu ? 'up' : 'down'}`}
              ></i>
            </div>

            {showUserMenu && (
              <div
                className="user-menu"
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '0.5rem',
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius)',
                  boxShadow: 'var(--shadow-lg)',
                  border: '1px solid var(--border)',
                  minWidth: '220px',
                  zIndex: 1000,
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--gray-800)' }}>
                    {displayName}
                  </div>
                  {user?.email && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.15rem' }}>
                      {user.email}
                    </div>
                  )}
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                    {user?.roleLabel}
                    {user?.employeeCode && ` · ${user.employeeCode}`}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '0.25rem' }}>
                    <i className="fas fa-map-marker-alt" style={{ marginRight: '0.25rem' }}></i>
                    {user?.zoneName || user?.areaName
                      ? Utils.formatGeography(user)
                      : displayTerritory}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--danger)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                >
                  <i className="fas fa-sign-out-alt"></i> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
