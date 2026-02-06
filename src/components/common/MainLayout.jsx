// Main Layout Component
// Provides consistent layout with sidebar for authenticated pages

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { colors } from '../../constants/theme';

/**
 * MainLayout Component
 * Wraps page content with sidebar navigation
 * 
 * @param {React.ReactNode} children - Page content
 * @param {string} role - Current user role for sidebar styling
 * @param {Function} onLogout - Logout callback
 */
const MainLayout = ({ children, role, onLogout }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onLogout={onLogout}
      />

      {/* Main Content */}
      <main 
        style={{
          ...styles.main,
          marginLeft: sidebarCollapsed ? '72px' : '260px',
        }}
      >
        {children}
      </main>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    background: colors.neutral[50],
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  
  main: {
    flex: 1,
    minHeight: '100vh',
    transition: 'margin-left 0.2s ease',
  },
};

export default MainLayout;
