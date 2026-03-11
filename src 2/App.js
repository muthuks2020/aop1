/**
 * App.js — v5 Updated Routing
 *
 * ★ v5.2.0 CHANGES:
 *   - All role-specific direct routes now wrapped in ProtectedRoute
 *   - Added allowedRoles enforcement to prevent cross-role dashboard access
 *   - Added role debug logging
 *
 * @version 5.2.0
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

      {/* ★ Main dashboard — renders based on user.role */}
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>{getDashboardByRole(user?.role)}</ProtectedRoute>
        }
      />

      {/* ★ Direct role routes — now ALL protected with allowedRoles */}
      <Route
        path="/tbm/dashboard"
        element={
          <ProtectedRoute allowedRoles={['tbm']}>
            <TBMDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/abm/dashboard"
        element={
          <ProtectedRoute allowedRoles={['abm']}>
            <ABMDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/zbm/dashboard"
        element={
          <ProtectedRoute allowedRoles={['zbm']}>
            <ZBMDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/saleshead/dashboard"
        element={
          <ProtectedRoute allowedRoles={['sales_head']}>
            <SalesHeadDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/specialist/dashboard"
        element={
          <ProtectedRoute allowedRoles={SPECIALIST_ROLES}>
            <SpecialistDashboard />
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route
        path="/"
        element={<Navigate to={user ? '/dashboard' : '/login'} replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
