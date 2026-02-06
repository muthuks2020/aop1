// Authentication Context
// Manages user authentication state, roles, and provides SSO integration hooks

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// User roles enum
export const USER_ROLES = {
  ADMIN: 'admin',
  MAKER: 'maker',
  CHECKER: 'checker',
};

// Role display names and descriptions
export const ROLE_INFO = {
  [USER_ROLES.ADMIN]: {
    name: 'Administrator',
    description: 'Full access to configuration masters and system settings',
    icon: 'Shield',
    color: '#7C3AED',
  },
  [USER_ROLES.MAKER]: {
    name: 'QC Person (Maker)',
    description: 'Perform quality inspections and enter QC data',
    icon: 'ClipboardCheck',
    color: '#003366',
  },
  [USER_ROLES.CHECKER]: {
    name: 'QC Validator (Checker)',
    description: 'Review and validate QC entries made by makers',
    icon: 'CheckCircle',
    color: '#059669',
  },
};

// Dummy users for development/testing
const DUMMY_USERS = {
  admin: {
    id: 'usr_admin_001',
    username: 'admin',
    password: 'admin123',
    email: 'admin@appasamy.com',
    name: 'System Administrator',
    role: USER_ROLES.ADMIN,
    avatar: null,
    department: 'IT',
    employeeId: 'EMP001',
  },
  maker: {
    id: 'usr_maker_001',
    username: 'qcmaker',
    password: 'maker123',
    email: 'qcmaker@appasamy.com',
    name: 'Ravi Kumar',
    role: USER_ROLES.MAKER,
    avatar: null,
    department: 'Quality Control',
    employeeId: 'EMP042',
  },
  checker: {
    id: 'usr_checker_001',
    username: 'qcchecker',
    password: 'checker123',
    email: 'qcchecker@appasamy.com',
    name: 'Priya Sharma',
    role: USER_ROLES.CHECKER,
    avatar: null,
    department: 'Quality Assurance',
    employeeId: 'EMP023',
  },
};

// Auth context
const AuthContext = createContext(null);

// Auth provider configuration
const AUTH_CONFIG = {
  // Storage key for persisting auth state
  storageKey: 'appasamy_qc_auth',
  
  // Session timeout in milliseconds (8 hours)
  sessionTimeout: 8 * 60 * 60 * 1000,
  
  // SSO Configuration (for future Office 365 integration)
  sso: {
    enabled: false, // Set to true when SSO is ready
    provider: 'microsoft',
    tenantId: '', // Add your Azure AD tenant ID
    clientId: '', // Add your Azure AD client ID
    redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '',
    scopes: ['openid', 'profile', 'email', 'User.Read'],
  },
};

/**
 * AuthProvider Component
 * Provides authentication state and methods to the app
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    checkAuthState();
  }, []);

  /**
   * Check authentication state from storage
   */
  const checkAuthState = useCallback(() => {
    try {
      const storedAuth = localStorage.getItem(AUTH_CONFIG.storageKey);
      if (storedAuth) {
        const authData = JSON.parse(storedAuth);
        const now = Date.now();
        
        // Check if session is still valid
        if (authData.expiresAt && now < authData.expiresAt) {
          setUser(authData.user);
          setIsAuthenticated(true);
        } else {
          // Session expired, clear storage
          localStorage.removeItem(AUTH_CONFIG.storageKey);
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        // No stored auth - user needs to login
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('Error checking auth state:', err);
      localStorage.removeItem(AUTH_CONFIG.storageKey);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setAuthChecked(true);
      setIsLoading(false);
    }
  }, []);

  /**
   * Login with username and password
   * @param {string} username 
   * @param {string} password 
   * @returns {Promise<{success: boolean, user?: object, error?: string}>}
   */
  const login = useCallback(async (username, password) => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Find matching user
      const matchedUser = Object.values(DUMMY_USERS).find(
        u => u.username === username && u.password === password
      );

      if (matchedUser) {
        // Remove password from stored user object
        const { password: _, ...userWithoutPassword } = matchedUser;
        
        const authData = {
          user: userWithoutPassword,
          expiresAt: Date.now() + AUTH_CONFIG.sessionTimeout,
          loginTime: Date.now(),
        };

        // Persist to storage
        localStorage.setItem(AUTH_CONFIG.storageKey, JSON.stringify(authData));
        
        setUser(userWithoutPassword);
        setIsAuthenticated(true);
        
        return { success: true, user: userWithoutPassword };
      } else {
        const errorMsg = 'Invalid username or password';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      const errorMsg = 'An error occurred during login';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout current user
   */
  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_CONFIG.storageKey);
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    // Note: authChecked stays true since we've checked, user just logged out
  }, []);

  /**
   * Initiate SSO login (Office 365)
   * This is a placeholder for future SSO integration
   */
  const loginWithSSO = useCallback(async () => {
    if (!AUTH_CONFIG.sso.enabled) {
      console.warn('SSO is not enabled');
      return { success: false, error: 'SSO is not enabled' };
    }

    try {
      // Microsoft OAuth 2.0 authorization URL
      const authUrl = new URL('https://login.microsoftonline.com');
      authUrl.pathname = `/${AUTH_CONFIG.sso.tenantId}/oauth2/v2.0/authorize`;
      authUrl.searchParams.set('client_id', AUTH_CONFIG.sso.clientId);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('redirect_uri', AUTH_CONFIG.sso.redirectUri);
      authUrl.searchParams.set('scope', AUTH_CONFIG.sso.scopes.join(' '));
      authUrl.searchParams.set('response_mode', 'query');
      authUrl.searchParams.set('state', crypto.randomUUID());
      authUrl.searchParams.set('nonce', crypto.randomUUID());

      // Redirect to Microsoft login
      window.location.href = authUrl.toString();
      
      return { success: true };
    } catch (err) {
      console.error('SSO login error:', err);
      return { success: false, error: 'Failed to initiate SSO login' };
    }
  }, []);

  /**
   * Handle SSO callback
   * This will be called after redirect from Microsoft
   */
  const handleSSOCallback = useCallback(async (code) => {
    // Placeholder for SSO callback handling
    // In production, exchange the code for tokens via your backend
    console.log('SSO callback received with code:', code);
    
    // After successful token exchange, you would:
    // 1. Validate the tokens
    // 2. Extract user info
    // 3. Map Microsoft user to your app roles
    // 4. Call setUser with the mapped user data
    
    return { success: false, error: 'SSO callback handling not implemented' };
  }, []);

  /**
   * Check if user has a specific role
   */
  const hasRole = useCallback((role) => {
    return user?.role === role;
  }, [user]);

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = useCallback((roles) => {
    return roles.includes(user?.role);
  }, [user]);

  /**
   * Get the home route for the current user's role
   */
  const getHomeRoute = useCallback(() => {
    if (!user) return '/login';
    
    switch (user.role) {
      case USER_ROLES.ADMIN:
        return '/admin';
      case USER_ROLES.MAKER:
        return '/maker';
      case USER_ROLES.CHECKER:
        return '/checker';
      default:
        return '/login';
    }
  }, [user]);

  const value = {
    // State
    user,
    isLoading,
    error,
    isAuthenticated,
    authChecked,
    
    // Auth methods
    login,
    logout,
    loginWithSSO,
    handleSSOCallback,
    
    // Role helpers
    hasRole,
    hasAnyRole,
    getHomeRoute,
    
    // Config
    ssoEnabled: AUTH_CONFIG.sso.enabled,
    
    // Constants
    roles: USER_ROLES,
    roleInfo: ROLE_INFO,
    dummyUsers: DUMMY_USERS, // Expose for demo purposes
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
