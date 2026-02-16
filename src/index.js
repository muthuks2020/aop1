/**
 * index.js — Updated with admin CSS import
 * CHANGE: Added adminDashboard.css import. No other changes.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './styles/index.css';
import './styles/login.css';
import './styles/targetEntryGrid.css';
import './styles/admin/adminDashboard.css';  // ← NEW
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

serviceWorkerRegistration.register();
