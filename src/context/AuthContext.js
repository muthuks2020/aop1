/**
 * AuthContext.js — Email + Password Auth
 *
 * @version 6.0.0 - Removed mock mode, SSO, and refresh token logic
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
// HELPER: Map backend user → frontend shape
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
    } catch { /* ignore */ }
    localStorage.removeItem('appasamy_token');
    localStorage.removeItem('appasamy_user');
    setUser(null);
  }, []);

  // ─── Session Restore on Mount ───────────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      const token     = localStorage.getItem('appasamy_token');
      const savedUser = localStorage.getItem('appasamy_user');

      if (token && savedUser) {
        try {
          const response = await fetch(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const data       = await response.json();
            const mappedUser = mapUserFromBackend(data.user || data);
            console.log('[Auth] Session restored — role:', mappedUser?.role);
            setUser(mappedUser);
            localStorage.setItem('appasamy_user', JSON.stringify(mappedUser));
          } else {
            // Token invalid or expired — force re-login
            logout();
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


  // ─── Login (email + password) ────────────────────────────────────────
  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Login failed');
      }
      const data       = await response.json();
      const mappedUser = mapUserFromBackend(data.user);
      localStorage.setItem('appasamy_token', data.token);
      localStorage.setItem('appasamy_user',  JSON.stringify(mappedUser));
      setUser(mappedUser);
      console.log('[Auth] Login success — role:', mappedUser?.role);
      return { success: true, user: mappedUser };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // ─── Context Value ──────────────────────────────────────────────────
  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export default AuthContext;
