/**
 * AuthContext — v5 Live Backend + SSO Dual-Auth
 *
 * CHANGES from v3 (mock):
 * - REMOVED DUMMY_USERS array entirely
 * - login() calls POST /auth/login
 * - Added ssoLogin() for Azure AD
 * - Added refreshSession() for silent token renewal
 * - logout() calls POST /auth/logout
 * - Session restore via GET /auth/me with auto-refresh on 401
 * - mapUserFromBackend() keeps backward-compat fields (name, territory)
 * - Added specialist subtypes to USER_ROLES / ROLE_LABELS
 *
 * @version 5.0.0 — Live backend + SSO ready
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

// ═══════════════════════════════════════════════════════════════════════════
// ROLE CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

export const USER_ROLES = {
  SALES_REP: 'sales_rep',
  TBM: 'tbm',
  ABM: 'abm',
  ZBM: 'zbm',
  SALES_HEAD: 'sales_head',
  ADMIN: 'admin',
  SPECIALIST: 'specialist',
  AT_IOL_SPECIALIST: 'at_iol_specialist',
  EQ_SPEC_DIAGNOSTIC: 'eq_spec_diagnostic',
  EQ_SPEC_SURGICAL: 'eq_spec_surgical',
  AT_IOL_MANAGER: 'at_iol_manager',
  EQ_MGR_DIAGNOSTIC: 'eq_mgr_diagnostic',
  EQ_MGR_SURGICAL: 'eq_mgr_surgical',
};

export const ROLE_LABELS = {
  sales_rep: 'Sales Representative',
  tbm: 'Territory Business Manager',
  abm: 'Area Business Manager',
  zbm: 'Zonal Business Manager',
  sales_head: 'Sales Head',
  admin: 'System Administrator',
  specialist: 'Specialist',
  at_iol_specialist: 'AT/IOL Specialist',
  eq_spec_diagnostic: 'Equipment Specialist (Diagnostic)',
  eq_spec_surgical: 'Equipment Specialist (Surgical)',
  at_iol_manager: 'AT/IOL Manager',
  eq_mgr_diagnostic: 'Equipment Manager (Diagnostic)',
  eq_mgr_surgical: 'Equipment Manager (Surgical)',
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Map backend user shape → frontend user with backward compat
// ═══════════════════════════════════════════════════════════════════════════

const mapUserFromBackend = (backendUser) => {
  if (!backendUser) return null;
  return {
    id: backendUser.id,
    employeeCode: backendUser.employeeCode || backendUser.employee_code,
    username: backendUser.username,
    // Backward compat — components can use user.name OR user.fullName
    name: backendUser.fullName || backendUser.full_name || backendUser.name,
    fullName: backendUser.fullName || backendUser.full_name || backendUser.name,
    email: backendUser.email,
    role: backendUser.role,
    roleLabel: ROLE_LABELS[backendUser.role] || backendUser.roleLabel || backendUser.role,
    designation: backendUser.designation,
    // Backward compat — components can use user.territory OR user.territoryName
    territory: backendUser.territoryName || backendUser.territory_name || backendUser.territory || 'Not Assigned',
    territoryName: backendUser.territoryName || backendUser.territory_name || backendUser.territory,
    territoryCode: backendUser.territoryCode || backendUser.territory_code,
    zoneCode: backendUser.zoneCode || backendUser.zone_code,
    zoneName: backendUser.zoneName || backendUser.zone_name,
    areaCode: backendUser.areaCode || backendUser.area_code,
    areaName: backendUser.areaName || backendUser.area_name,
    reportsTo: backendUser.reportsTo || backendUser.reports_to,
    managerName: backendUser.managerName || backendUser.manager_name,
    authProvider: backendUser.authProvider || backendUser.auth_provider || 'local',
    phone: backendUser.phone,
    isVacant: backendUser.isVacant || false,
    isActive: backendUser.isActive !== undefined ? backendUser.isActive : true,
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// AUTH PROVIDER
// ═══════════════════════════════════════════════════════════════════════════

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ─── Refresh Session ────────────────────────────────────────────────
  const refreshSession = useCallback(async () => {
    const refreshToken = localStorage.getItem('appasamy_refresh_token');
    if (!refreshToken) return false;
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!response.ok) return false;
      const data = await response.json();
      localStorage.setItem('appasamy_token', data.token);
      if (data.refresh_token) {
        localStorage.setItem('appasamy_refresh_token', data.refresh_token);
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  // ─── Logout ─────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    const token = localStorage.getItem('appasamy_token');
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
    } catch {
      /* ignore */
    }
    localStorage.removeItem('appasamy_token');
    localStorage.removeItem('appasamy_refresh_token');
    localStorage.removeItem('appasamy_user');
    setUser(null);
  }, []);

  // ─── Session Restore on Mount ───────────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('appasamy_token');
      const savedUser = localStorage.getItem('appasamy_user');

      if (token && savedUser) {
        try {
          const response = await fetch(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            const data = await response.json();
            const mappedUser = mapUserFromBackend(data.user || data);
            setUser(mappedUser);
            localStorage.setItem('appasamy_user', JSON.stringify(mappedUser));
          } else {
            // Token expired — try refresh
            const refreshed = await refreshSession();
            if (refreshed) {
              const retryResp = await fetch(`${API_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('appasamy_token')}` },
              });
              if (retryResp.ok) {
                const retryData = await retryResp.json();
                const mappedUser = mapUserFromBackend(retryData.user || retryData);
                setUser(mappedUser);
                localStorage.setItem('appasamy_user', JSON.stringify(mappedUser));
              } else {
                logout();
              }
            } else {
              logout();
            }
          }
        } catch {
          // Network error — use cached user for offline support
          try {
            setUser(JSON.parse(savedUser));
          } catch {
            logout();
          }
        }
      }
      setLoading(false);
    };

    restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Login (local credentials) ──────────────────────────────────────
  const login = async (username, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Login failed');
      }

      const data = await response.json();
      // data = { success, token, refresh_token, user: { ... } }

      localStorage.setItem('appasamy_token', data.token);
      if (data.refresh_token) {
        localStorage.setItem('appasamy_refresh_token', data.refresh_token);
      }

      const mappedUser = mapUserFromBackend(data.user);
      setUser(mappedUser);
      localStorage.setItem('appasamy_user', JSON.stringify(mappedUser));

      return { success: true, user: mappedUser };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // ─── SSO Login (Azure AD token exchange) ────────────────────────────
  const ssoLogin = async (azureIdToken, userData = {}) => {
    try {
      const response = await fetch(`${API_URL}/auth/sso-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          azure_token: azureIdToken,
          email: userData.email,
          name: userData.name,
          azure_oid: userData.azure_oid,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'SSO login failed');
      }

      const data = await response.json();
      localStorage.setItem('appasamy_token', data.token);
      if (data.refresh_token) {
        localStorage.setItem('appasamy_refresh_token', data.refresh_token);
      }

      const mappedUser = mapUserFromBackend(data.user);
      setUser(mappedUser);
      localStorage.setItem('appasamy_user', JSON.stringify(mappedUser));

      return { success: true, user: mappedUser };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // ─── Context Value ──────────────────────────────────────────────────
  const value = {
    user,
    login,
    ssoLogin,
    logout,
    refreshSession,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
