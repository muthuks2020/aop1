/**
 * msalConfig.js — Azure AD / MSAL Configuration
 * 
 * All values are configurable via .env file.
 * Set REACT_APP_SSO_ENABLED=true to activate SSO on the login page.
 * 
 * Required .env variables for SSO:
 *   REACT_APP_SSO_ENABLED=true
 *   REACT_APP_AZURE_CLIENT_ID=<your-app-registration-client-id>
 *   REACT_APP_AZURE_TENANT_ID=<your-azure-tenant-id>
 *   REACT_APP_AZURE_REDIRECT_URI=http://localhost:3000
 * 
 * Optional:
 *   REACT_APP_AZURE_POST_LOGOUT_URI=http://localhost:3000/login
 * 
 * @version 1.0.0
 * @author Appasamy Associates - Target Setting PWA
 */

// ─── Feature flag ───────────────────────────────────────────────────────────
export const SSO_ENABLED = process.env.REACT_APP_SSO_ENABLED === 'true';

// ─── Default admin emails (get admin role automatically on first SSO login) ─
export const DEFAULT_ADMIN_EMAILS = (
  process.env.REACT_APP_DEFAULT_ADMIN_EMAILS || 'muthu@appasamy.com,yoga@appasamy.com'
).split(',').map(e => e.trim().toLowerCase());

// ─── MSAL Browser Configuration ────────────────────────────────────────────
export const msalConfig = {
  auth: {
    clientId: process.env.REACT_APP_AZURE_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${process.env.REACT_APP_AZURE_TENANT_ID || 'common'}`,
    redirectUri: process.env.REACT_APP_AZURE_REDIRECT_URI || window.location.origin,
    postLogoutRedirectUri: process.env.REACT_APP_AZURE_POST_LOGOUT_URI || `${window.location.origin}/login`,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      logLevel: process.env.NODE_ENV === 'development' ? 3 : 0,
      piiLoggingEnabled: false,
    },
  },
};

// ─── Scopes requested during login ─────────────────────────────────────────
export const loginRequest = {
  scopes: ['openid', 'profile', 'email', 'User.Read'],
};

// ─── Scopes for silent token acquisition ────────────────────────────────────
export const tokenRequest = {
  scopes: ['openid', 'profile', 'email', 'User.Read'],
};

// ─── Azure AD Security Group → App Role mapping ────────────────────────────
export const AZURE_GROUP_ROLE_MAP = {
  'SG-PWA-SalesRep':  'sales_rep',
  'SG-PWA-TBM':       'tbm',
  'SG-PWA-ABM':       'abm',
  'SG-PWA-ZBM':       'zbm',
  'SG-PWA-SalesHead': 'sales_head',
  'SG-PWA-Admin':     'admin',
};
