import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

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

const FRONTEND_ROLE_MAP = {

  'sales_rep'                         : 'sales_rep',
  'sales rep'                         : 'sales_rep',
  'salesrep'                          : 'sales_rep',
  'sales representative'              : 'sales_rep',
  'sales_representative'              : 'sales_rep',
  'salesrepresentative'               : 'sales_rep',
  'sr'                                : 'sales_rep',

  'tbm'                               : 'tbm',
  'territory business manager'        : 'tbm',
  'territory_business_manager'        : 'tbm',
  'territorybusinessmanager'          : 'tbm',
  'territory manager'                 : 'tbm',
  'territory_manager'                 : 'tbm',

  'abm'                               : 'abm',
  'area business manager'             : 'abm',
  'area_business_manager'             : 'abm',
  'areabusinessmanager'               : 'abm',
  'area manager'                      : 'abm',
  'area_manager'                      : 'abm',

  'zbm'                               : 'zbm',
  'zonal business manager'            : 'zbm',
  'zonal_business_manager'            : 'zbm',
  'zonalbusinessmanager'              : 'zbm',
  'zonal manager'                     : 'zbm',
  'zonal_manager'                     : 'zbm',

  'sales_head'                        : 'sales_head',
  'sales head'                        : 'sales_head',
  'saleshead'                         : 'sales_head',
  'head of sales'                     : 'sales_head',
  'head_of_sales'                     : 'sales_head',
  'national sales head'               : 'sales_head',
  'sh'                                : 'sales_head',
  'sales head (surgical)'             : 'sales_head',
  'sales head (diagnostic)'           : 'sales_head',
  'sales head surgical'               : 'sales_head',
  'sales head diagnostic'             : 'sales_head',
  'sales_head_surgical'               : 'sales_head',
  'sales_head_diagnostic'             : 'sales_head',

  'at_iol_specialist'                 : 'at_iol_specialist',
  'at iol specialist'                 : 'at_iol_specialist',
  'iol specialist'                    : 'at_iol_specialist',
  'iol_specialist'                    : 'at_iol_specialist',
  'at/iol specialist'                 : 'at_iol_specialist',

  'eq_spec_diagnostic'                : 'eq_spec_diagnostic',
  'eq spec diagnostic'                : 'eq_spec_diagnostic',
  'equipment specialist diagnostic'   : 'eq_spec_diagnostic',
  'equipment_specialist_diagnostic'   : 'eq_spec_diagnostic',
  'equipment specialist (diagnostic)' : 'eq_spec_diagnostic',

  'eq_spec_surgical'                  : 'eq_spec_surgical',
  'eq spec surgical'                  : 'eq_spec_surgical',
  'equipment specialist surgical'     : 'eq_spec_surgical',
  'equipment_specialist_surgical'     : 'eq_spec_surgical',
  'equipment specialist (surgical)'   : 'eq_spec_surgical',

  'at_iol_manager'                    : 'at_iol_manager',
  'at iol manager'                    : 'at_iol_manager',
  'iol manager'                       : 'at_iol_manager',
  'iol_manager'                       : 'at_iol_manager',
  'at/iol manager'                    : 'at_iol_manager',

  'eq_mgr_diagnostic'                 : 'eq_mgr_diagnostic',
  'eq mgr diagnostic'                 : 'eq_mgr_diagnostic',
  'equipment manager diagnostic'      : 'eq_mgr_diagnostic',
  'equipment_manager_diagnostic'      : 'eq_mgr_diagnostic',
  'equipment manager (diagnostic)'    : 'eq_mgr_diagnostic',

  'eq_mgr_surgical'                   : 'eq_mgr_surgical',
  'eq mgr surgical'                   : 'eq_mgr_surgical',
  'equipment manager surgical'        : 'eq_mgr_surgical',
  'equipment_manager_surgical'        : 'eq_mgr_surgical',
  'equipment manager (surgical)'      : 'eq_mgr_surgical',

  'admin'                             : 'admin',
  'administrator'                     : 'admin',
  'system administrator'              : 'admin',
  'system_administrator'              : 'admin',
  'sysadmin'                          : 'admin',
};

function normalizeRole(rawRole) {
  if (!rawRole) return rawRole;

  if (FRONTEND_ROLE_MAP[rawRole]) return FRONTEND_ROLE_MAP[rawRole];

  const key = rawRole.trim().toLowerCase();
  const mapped = FRONTEND_ROLE_MAP[key];
  if (!mapped) {
    console.warn(`[AuthContext] Unrecognized role from backend: "${rawRole}" — routing may fail`);
  }
  return mapped || rawRole;
}

const mapUserFromBackend = (backendUser) => {
  if (!backendUser) return null;

  const normalizedRole = normalizeRole(backendUser.role);
  return {
    id: backendUser.id,
    employeeCode: backendUser.employeeCode || backendUser.employee_code,
    username: backendUser.username,
    name: backendUser.fullName || backendUser.full_name || backendUser.name,
    fullName: backendUser.fullName || backendUser.full_name || backendUser.name,
    email: backendUser.email,
    role: normalizedRole,
    roleLabel: ROLE_LABELS[normalizedRole] || backendUser.roleLabel || backendUser.role,
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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
    } catch {  }
    localStorage.removeItem('appasamy_token');
    localStorage.removeItem('appasamy_refresh_token');
    localStorage.removeItem('appasamy_user');
    setUser(null);
  }, []);

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

            logout();
          }
        } catch {

          try { setUser(JSON.parse(savedUser)); } catch { logout(); }
        }
      }
      setLoading(false);
    };

    restoreSession();

  }, []);

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
      localStorage.removeItem('appasamy_refresh_token');
      localStorage.setItem('appasamy_user',  JSON.stringify(mappedUser));
      setUser(mappedUser);
      console.log('[Auth] Login success — role:', mappedUser?.role);
      return { success: true, user: mappedUser };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

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
