/**
 * App.js — Updated with Admin Dashboard route
 * 
 * CHANGE: Added AdminDashboard import and 'admin' case in getDashboardByRole
 * Added /admin/dashboard direct route
 * No other changes to existing routes.
 *
 * @version 2.0.0
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import SalesRepDashboard from './pages/SalesRep/Dashboard';
import TBMDashboard from './pages/TBM/Dashboard';
import ABMDashboard from './pages/ABM/Dashboard';
import ZBMDashboard from './pages/ZBM/Dashboard';
import SalesHeadDashboard from './pages/SalesHead/Dashboard';
import AdminDashboard from './pages/Admin/Dashboard';       // ← NEW
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  const { user } = useAuth();
  const getDashboardByRole = (role) => {
    switch (role) {
      case 'sales_rep': return <SalesRepDashboard />;
      case 'tbm': return <TBMDashboard />;
      case 'abm': return <ABMDashboard />;
      case 'zbm': return <ZBMDashboard />;
      case 'sales_head': return <SalesHeadDashboard />;
      case 'admin': return <AdminDashboard />;              // ← NEW
      default: return <SalesRepDashboard />;
    }
  };
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/dashboard/*" element={<ProtectedRoute>{getDashboardByRole(user?.role)}</ProtectedRoute>} />
      <Route path="/tbm/dashboard" element={<TBMDashboard />} />
      <Route path="/abm/dashboard" element={<ABMDashboard />} />
      <Route path="/zbm/dashboard" element={<ZBMDashboard />} />
      <Route path="/saleshead/dashboard" element={<SalesHeadDashboard />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />  {/* ← NEW */}
      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
export default App;
