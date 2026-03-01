/**
 * App.js — v5 Updated Routing
 *
 * CHANGES:
 * - Added specialist subtype roles to getDashboardByRole()
 * - All other routes preserved
 *
 * @version 5.0.0
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
import AdminDashboard from './pages/Admin/Dashboard';
import SpecialistDashboard from './pages/Specialist/Dashboard';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './styles/aopRowStyles.css';

// Specialist subtypes all use the same dashboard
const SPECIALIST_ROLES = [
  'specialist',
  'at_iol_specialist',
  'eq_spec_diagnostic',
  'eq_spec_surgical',
  'at_iol_manager',
  'eq_mgr_diagnostic',
  'eq_mgr_surgical',
];

function App() {
  const { user } = useAuth();

  const getDashboardByRole = (role) => {
    if (SPECIALIST_ROLES.includes(role)) return <SpecialistDashboard />;

    switch (role) {
      case 'sales_rep':
        return <SalesRepDashboard />;
      case 'tbm':
        return <TBMDashboard />;
      case 'abm':
        return <ABMDashboard />;
      case 'zbm':
        return <ZBMDashboard />;
      case 'sales_head':
        return <SalesHeadDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <SalesRepDashboard />;
    }
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>{getDashboardByRole(user?.role)}</ProtectedRoute>
        }
      />
      <Route path="/tbm/dashboard" element={<TBMDashboard />} />
      <Route path="/abm/dashboard" element={<ABMDashboard />} />
      <Route path="/zbm/dashboard" element={<ZBMDashboard />} />
      <Route path="/saleshead/dashboard" element={<SalesHeadDashboard />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/specialist/dashboard" element={<SpecialistDashboard />} />
      <Route
        path="/"
        element={<Navigate to={user ? '/dashboard' : '/login'} replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
