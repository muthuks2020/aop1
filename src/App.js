/**
 * App.js — UPDATED with ZBM Dashboard route
 * 
 * CHANGES MADE:
 * 1. Added import for ZBMDashboard
 * 2. Updated getDashboardByRole to route 'zbm' to ZBMDashboard
 * 3. Added /zbm/dashboard route
 * 
 * IMPORTANT: Only the ZBM-related lines are new. All other routes remain unchanged.
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import SalesRepDashboard from './pages/SalesRep/Dashboard';
import TBMDashboard from './pages/TBM/Dashboard';
import ABMDashboard from './pages/ABM/Dashboard';
import ZBMDashboard from './pages/ZBM/Dashboard';       // ★ NEW
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  const { user } = useAuth();
  const getDashboardByRole = (role) => {
    switch (role) {
      case 'sales_rep': return <SalesRepDashboard />;
      case 'tbm': return <TBMDashboard />;
      case 'abm': return <ABMDashboard />;
      case 'zbm': return <ZBMDashboard />;              // ★ CHANGED — was TBMDashboard
      case 'sales_head': return <TBMDashboard />;
      default: return <SalesRepDashboard />;
    }
  };
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/dashboard/*" element={<ProtectedRoute>{getDashboardByRole(user?.role)}</ProtectedRoute>} />
      <Route path="/tbm/dashboard" element={<TBMDashboard />} />
      <Route path="/abm/dashboard" element={<ABMDashboard />} />
      <Route path="/zbm/dashboard" element={<ZBMDashboard />} />  {/* ★ NEW */}
      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
export default App;
