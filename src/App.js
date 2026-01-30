import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import SalesRepDashboard from './pages/SalesRep/Dashboard';
import TBMDashboard from './pages/TBM/Dashboard';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  const { user } = useAuth();

  const getDashboardByRole = (role) => {
    switch (role) {
      case 'sales_rep':
        return <SalesRepDashboard />;
      case 'tbm':
      case 'abm':
      case 'zbm':
      case 'sales_head':
        return <TBMDashboard />;
      default:
        return <SalesRepDashboard />;
    }
  };

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>
            {getDashboardByRole(user?.role)}
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
