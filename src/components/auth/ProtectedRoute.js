/**
 * ProtectedRoute — v5
 *
 * CHANGES:
 * - Attempts token refresh if user becomes null after loading
 * - Redirects to /login with return path on auth failure
 *
 * @version 5.0.0
 */

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, refreshSession } = useAuth();
  const location = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // If user is null after loading, attempt one token refresh
  useEffect(() => {
    if (!loading && !user && !isRefreshing) {
      const token = localStorage.getItem('appasamy_token');
      if (token) {
        setIsRefreshing(true);
        refreshSession?.().finally(() => setIsRefreshing(false));
      }
    }
  }, [loading, user, isRefreshing, refreshSession]);

  if (loading || isRefreshing) {
    return (
      <div
        className="loading-screen"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--background)',
        }}
      >
        <div
          className="loading-spinner"
          style={{
            width: '48px',
            height: '48px',
            border: '4px solid var(--gray-200)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        ></div>
        <p style={{ marginTop: '1rem', color: 'var(--gray-600)' }}>Loading...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
