/**
 * AuthContext — v5 Configurable Auth (Mock + Live API + SSO)
 *
 * MODE SWITCH (in .env):
 *   REACT_APP_USE_MOCK=true   → Mock login with DUMMY_USERS (DEFAULT)
 *   REACT_APP_USE_MOCK=false  → Live backend API at REACT_APP_API_URL
 *   REACT_APP_SSO_ENABLED=true → Show SSO button on login page
 *
 * @version 5.1.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const USE_MOCK = true;  // ← SET TO false WHEN BACKEND IS LIVE
const API_URL  = process.env.REACT_APP_API_URL || 'http://10.0.2.227:3002/api/v1';

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
// MOCK USERS — used when USE_MOCK = true
// ═══════════════════════════════════════════════════════════════════════════

const DUMMY_USERS = [
  { id: 1, username: 'salesrep',   password: 'demo123', name: 'Vasanthakumar C',  role: 'sales_rep',   territory: 'Central Delhi',    employeeCode: 'SR-001',  zoneCode: 'Z-NORTH', zoneName: 'North Zone',  areaCode: 'A-DEL', areaName: 'Delhi NCR',    territoryCode: 'T-CDEL', territoryName: 'Central Delhi',  reportsTo: 'TBM-001' },
  { id: 2, username: 'tbm',        password: 'demo123', name: 'Rajesh Kumar',     role: 'tbm',         territory: 'North Zone',       employeeCode: 'TBM-001', zoneCode: 'Z-NORTH', zoneName: 'North Zone',  areaCode: 'A-DEL', areaName: 'Delhi NCR',    territoryCode: 'T-NZ',   territoryName: 'North Zone',     reportsTo: 'ABM-001' },
  { id: 3, username: 'abm',        password: 'demo123', name: 'Priya Sharma',     role: 'abm',         territory: 'Delhi NCR',        employeeCode: 'ABM-001', zoneCode: 'Z-NORTH', zoneName: 'North Zone',  areaCode: 'A-DEL', areaName: 'Delhi NCR',    territoryCode: null,     territoryName: null,             reportsTo: 'ZBM-001' },
  { id: 4, username: 'zbm',        password: 'demo123', name: 'Amit Singh',       role: 'zbm',         territory: 'Northern Region',  employeeCode: 'ZBM-001', zoneCode: 'Z-NORTH', zoneName: 'North Zone',  areaCode: null,    areaName: null,           territoryCode: null,     territoryName: null,             reportsTo: 'SH-001'  },
  { id: 5, username: 'saleshead',  password: 'demo123', name: 'Dr. Srinivasan',   role: 'sales_head',  territory: 'All India',        employeeCode: 'SH-001',  zoneCode: null,      zoneName: null,          areaCode: null,    areaName: null,           territoryCode: null,     territoryName: null,             reportsTo: null       },
  { id: 6, username: 'admin',      password: 'demo123', name: 'System Admin',     role: 'admin',       territory: 'System',           employeeCode: 'ADM-001', zoneCode: null,      zoneName: null,          areaCode: null,    areaName: null,           territoryCode: null,     territoryName: null,             reportsTo: null       },
  { id: 7, username: 'specialist', password: 'demo123', name: 'Dr. Ananya Rao',   role: 'specialist',  territory: 'Delhi NCR',        employeeCode: 'SP-001',  zoneCode: 'Z-NORTH', zoneName: 'North Zone',  areaCode: 'A-DEL', areaName: 'Delhi NCR',    territoryCode: 'T-CDEL', territoryName: 'Central Delhi',  reportsTo: 'ABM-001' },
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Map backend user shape → frontend user with backward compat
// ═══════════════════════════════════════════════════════════════════════════

const mapUserFromBackend = (backendUser) => {
  if (!backendUser) return null;
  return {
    id: backendUser.id,
    employeeCode: backendUser.employeeCode || backendUser.employee_code,
    username: backendUser.username,
    name: backendUser.fullName || backendUser.full_name || backendUser.name,
    fullName: backendUser.fullName || backendUser.full_name || backendUser.name,
    email: backendUser.email,
    role: backendUser.role,
    roleLabel: ROLE_LABELS[backendUser.role] || backendUser.roleLabel || backendUser.role,
    designation: backendUser.designation,
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

  // ─── Refresh Session (live only) ────────────────────────────────────
  const refreshSession = useCallback(async () => {
    if (USE_MOCK) return false;
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
      if (data.refresh_token) localStorage.setItem('appasamy_refresh_token', data.refresh_token);
      return true;
    } catch { return false; }
  }, []);

  // ─── Logout ─────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    if (!USE_MOCK) {
      const token = localStorage.getItem('appasamy_token');
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });
      } catch { /* ignore */ }
    }
    localStorage.removeItem('appasamy_token');
    localStorage.removeItem('appasamy_refresh_token');
    localStorage.removeItem('appasamy_user');
    setUser(null);
  }, []);

  // ─── Session Restore on Mount ───────────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      const savedUser = localStorage.getItem('appasamy_user');

      if (USE_MOCK) {
        // Mock mode: just restore from localStorage
        if (savedUser) {
          try { setUser(JSON.parse(savedUser)); } catch { localStorage.removeItem('appasamy_user'); }
        }
        setLoading(false);
        return;
      }

      // Live mode: verify token with backend
      const token = localStorage.getItem('appasamy_token');
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
              } else { logout(); }
            } else { logout(); }
          }
        } catch {
          // Network error — use cached user for offline support
          try { setUser(JSON.parse(savedUser)); } catch { logout(); }
        }
      }
      setLoading(false);
    };

    restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Login ──────────────────────────────────────────────────────────
  const login = async (username, password) => {
    // ── MOCK MODE ──
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 600));
      const foundUser = DUMMY_USERS.find(
        (u) => u.username === username && u.password === password
      );
      if (foundUser) {
        const userData = {
          id: foundUser.id,
          employeeCode: foundUser.employeeCode,
          username: foundUser.username,
          name: foundUser.name,
          fullName: foundUser.name,
          role: foundUser.role,
          roleLabel: ROLE_LABELS[foundUser.role],
          territory: foundUser.territory,
          territoryName: foundUser.territory,
          territoryCode: foundUser.territoryCode,
          zoneCode: foundUser.zoneCode,
          zoneName: foundUser.zoneName,
          areaCode: foundUser.areaCode,
          areaName: foundUser.areaName,
          reportsTo: foundUser.reportsTo,
          authProvider: 'local',
          isActive: true,
        };
        setUser(userData);
        localStorage.setItem('appasamy_user', JSON.stringify(userData));
        localStorage.setItem('appasamy_token', `mock-jwt-${Date.now()}`);
        return { success: true, user: userData };
      }
      return { success: false, error: 'Invalid username or password' };
    }

    // ── LIVE MODE ──
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
      localStorage.setItem('appasamy_token', data.token);
      if (data.refresh_token) localStorage.setItem('appasamy_refresh_token', data.refresh_token);
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
    if (USE_MOCK) {
      // Mock SSO: derive a user from Azure claims
      const role = 'sales_rep';
      const mockUser = {
        id: Date.now(),
        employeeCode: `SSO-${Math.floor(Math.random() * 900) + 100}`,
        username: (userData.email || 'ssouser').split('@')[0],
        name: userData.name || 'SSO User',
        fullName: userData.name || 'SSO User',
        email: userData.email,
        role,
        roleLabel: ROLE_LABELS[role],
        territory: 'Unassigned',
        authProvider: 'azure_ad',
        isActive: true,
      };
      setUser(mockUser);
      localStorage.setItem('appasamy_user', JSON.stringify(mockUser));
      localStorage.setItem('appasamy_token', `mock-sso-jwt-${Date.now()}`);
      return { success: true, user: mockUser };
    }

    // Live SSO
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
      if (data.refresh_token) localStorage.setItem('appasamy_refresh_token', data.refresh_token);
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
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export default AuthContext;
