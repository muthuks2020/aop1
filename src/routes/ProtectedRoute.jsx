// Protected Route Component
// Handles role-based access control and authentication checks

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, USER_ROLES } from '../contexts/AuthContext';
import { colors } from '../constants/theme';

/**
 * ProtectedRoute Component
 * Wraps routes that require authentication and optionally specific roles
 * 
 * @param {React.ReactNode} children - The component to render if authorized
 * @param {string[]} allowedRoles - Array of roles that can access this route
 * @param {string} redirectTo - Path to redirect if not authenticated
 */
const ProtectedRoute = ({ 
  children, 
  allowedRoles = null, 
  redirectTo = '/login' 
}) => {
  const { isAuthenticated, isLoading, authChecked, user, hasAnyRole } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (isLoading || !authChecked) {
    return <LoadingScreen />;
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role-based access if roles are specified
  if (allowedRoles && allowedRoles.length > 0) {
    if (!hasAnyRole(allowedRoles)) {
      // User doesn't have required role - redirect to their home
      return <UnauthorizedPage userRole={user?.role} />;
    }
  }

  // Authorized - render children
  return children;
};

/**
 * Loading Screen Component
 */
const LoadingScreen = () => (
  <div style={styles.loadingContainer}>
    <div style={styles.loadingContent}>
      <div style={styles.spinner} />
      <p style={styles.loadingText}>Loading...</p>
    </div>
  </div>
);

/**
 * Unauthorized Page Component
 */
const UnauthorizedPage = ({ userRole }) => {
  const { getHomeRoute } = useAuth();
  const homeRoute = getHomeRoute();

  return (
    <div style={styles.unauthorizedContainer}>
      <div style={styles.unauthorizedContent}>
        <div style={styles.unauthorizedIcon}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={colors.danger} strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h1 style={styles.unauthorizedTitle}>Access Denied</h1>
        <p style={styles.unauthorizedText}>
          You don't have permission to access this page. 
          Your role ({userRole}) doesn't allow access to this resource.
        </p>
        <a href={homeRoute} style={styles.backButton}>
          Return to Dashboard
        </a>
      </div>
    </div>
  );
};

/**
 * Role-specific route wrappers
 */
export const AdminRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
    {children}
  </ProtectedRoute>
);

export const MakerRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={[USER_ROLES.MAKER]}>
    {children}
  </ProtectedRoute>
);

export const CheckerRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={[USER_ROLES.CHECKER]}>
    {children}
  </ProtectedRoute>
);

export const AdminOrMakerRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.MAKER]}>
    {children}
  </ProtectedRoute>
);

// Styles
const styles = {
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: colors.neutral[50],
  },
  
  loadingContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  
  spinner: {
    width: '40px',
    height: '40px',
    border: `3px solid ${colors.neutral[200]}`,
    borderTopColor: colors.primary,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  
  loadingText: {
    fontSize: '14px',
    color: colors.neutral[500],
  },
  
  unauthorizedContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: colors.neutral[50],
    padding: '24px',
  },
  
  unauthorizedContent: {
    textAlign: 'center',
    maxWidth: '400px',
  },
  
  unauthorizedIcon: {
    marginBottom: '24px',
  },
  
  unauthorizedTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: colors.neutral[800],
    marginBottom: '12px',
  },
  
  unauthorizedText: {
    fontSize: '14px',
    color: colors.neutral[500],
    lineHeight: 1.6,
    marginBottom: '24px',
  },
  
  backButton: {
    display: 'inline-block',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 500,
    color: 'white',
    background: colors.primary,
    borderRadius: '8px',
    textDecoration: 'none',
    transition: 'all 0.2s',
  },
};

export default ProtectedRoute;
