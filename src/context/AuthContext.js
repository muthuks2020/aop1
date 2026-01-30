import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const USER_ROLES = {
  SALES_REP: 'sales_rep',
  TBM: 'tbm',
  ABM: 'abm',
  ZBM: 'zbm',
  SALES_HEAD: 'sales_head'
};

export const ROLE_LABELS = {
  sales_rep: 'Sales Representative',
  tbm: 'Territory Business Manager',
  abm: 'Area Business Manager',
  zbm: 'Zonal Business Manager',
  sales_head: 'Sales Head'
};

const DUMMY_USERS = [
  { id: 1, username: 'salesrep', password: 'demo123', name: 'Vasanthakumar C', role: USER_ROLES.SALES_REP, territory: 'Central Delhi' },
  { id: 2, username: 'tbm', password: 'demo123', name: 'Rajesh Kumar', role: USER_ROLES.TBM, territory: 'North Zone' },
  { id: 3, username: 'abm', password: 'demo123', name: 'Priya Sharma', role: USER_ROLES.ABM, territory: 'Delhi NCR' },
  { id: 4, username: 'zbm', password: 'demo123', name: 'Amit Singh', role: USER_ROLES.ZBM, territory: 'Northern Region' },
  { id: 5, username: 'saleshead', password: 'demo123', name: 'Dr. Srinivasan', role: USER_ROLES.SALES_HEAD, territory: 'All India' }
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('appasamy_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('appasamy_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const foundUser = DUMMY_USERS.find(
      u => u.username === username && u.password === password
    );
    
    if (foundUser) {
      const userData = {
        id: foundUser.id,
        name: foundUser.name,
        username: foundUser.username,
        role: foundUser.role,
        territory: foundUser.territory,
        roleLabel: ROLE_LABELS[foundUser.role]
      };
      setUser(userData);
      localStorage.setItem('appasamy_user', JSON.stringify(userData));
      return { success: true, user: userData };
    }
    
    return { success: false, error: 'Invalid username or password' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('appasamy_user');
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
