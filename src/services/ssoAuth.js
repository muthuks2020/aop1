/**
 * ssoAuth.js — SSO Authentication Service
 * 
 * Handles:
 * 1. MSAL popup/redirect login with Azure AD
 * 2. Exchanging Azure AD token with backend for app JWT
 * 3. Auto-provisioning logic (backend creates user on first SSO login)
 * 4. Default admin email detection
 * 
 * @version 1.0.0
 * @author Appasamy Associates - Target Setting PWA
 */

import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig, loginRequest, tokenRequest, DEFAULT_ADMIN_EMAILS } from '../config/msalConfig';

// ─── MSAL Instance (singleton) ─────────────────────────────────────────────
let msalInstance = null;

export function getMsalInstance() {
  if (!msalInstance) {
    msalInstance = new PublicClientApplication(msalConfig);
  }
  return msalInstance;
}

export async function initializeMsal() {
  const instance = getMsalInstance();
  try {
    await instance.initialize();
    const response = await instance.handleRedirectPromise();
    if (response) {
      return response;
    }
  } catch (error) {
    console.error('[SSO] MSAL initialization error:', error);
  }
  return null;
}

export async function ssoLoginPopup() {
  const instance = getMsalInstance();
  try {
    const loginResponse = await instance.loginPopup(loginRequest);
    
    if (!loginResponse || !loginResponse.account) {
      return { success: false, error: 'No account returned from Azure AD' };
    }

    const account = loginResponse.account;
    const userData = extractUserData(account, loginResponse.idTokenClaims);

    return { success: true, userData, account, idToken: loginResponse.idToken };
  } catch (error) {
    console.error('[SSO] Popup login error:', error);
    
    if (error.errorCode === 'user_cancelled') {
      return { success: false, error: 'Login cancelled' };
    }
    if (error.errorCode === 'popup_window_error') {
      return { success: false, error: 'Popup blocked. Please allow popups for this site.' };
    }
    
    return { success: false, error: error.message || 'SSO login failed' };
  }
}

export async function ssoLoginRedirect() {
  const instance = getMsalInstance();
  try {
    await instance.loginRedirect(loginRequest);
  } catch (error) {
    console.error('[SSO] Redirect login error:', error);
    return { success: false, error: error.message || 'SSO redirect failed' };
  }
}

export async function acquireTokenSilent() {
  const instance = getMsalInstance();
  const accounts = instance.getAllAccounts();
  
  if (accounts.length === 0) {
    return null;
  }

  try {
    const response = await instance.acquireTokenSilent({
      ...tokenRequest,
      account: accounts[0],
    });
    return response.idToken;
  } catch (error) {
    console.warn('[SSO] Silent token acquisition failed, trying popup:', error);
    try {
      const response = await instance.acquireTokenPopup(tokenRequest);
      return response.idToken;
    } catch (popupError) {
      console.error('[SSO] Token popup also failed:', popupError);
      return null;
    }
  }
}

export async function ssoLogout() {
  const instance = getMsalInstance();
  const accounts = instance.getAllAccounts();
  
  if (accounts.length > 0) {
    try {
      await instance.logoutPopup({
        account: accounts[0],
        postLogoutRedirectUri: msalConfig.auth.postLogoutRedirectUri,
      });
    } catch (error) {
      console.error('[SSO] Logout error:', error);
      instance.clearCache();
    }
  }
}

export function getActiveAccount() {
  const instance = getMsalInstance();
  const accounts = instance.getAllAccounts();
  return accounts.length > 0 ? accounts[0] : null;
}

export async function exchangeTokenWithBackend(idToken, userData) {
  const USE_MOCK = process.env.REACT_APP_USE_MOCK !== 'false';
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

  if (USE_MOCK) {
    return mockSsoBackendResponse(userData);
  }

  try {
    const response = await fetch(`${API_URL}/auth/sso-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        azure_token: idToken,
        email: userData.email,
        name: userData.name,
        azure_oid: userData.azure_oid,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      return {
        success: true,
        token: data.token,
        user: data.user,
      };
    }

    return {
      success: false,
      error: data.message || 'Backend authentication failed',
      needsRoleAssignment: data.needsRoleAssignment || false,
    };
  } catch (error) {
    console.error('[SSO] Backend token exchange error:', error);
    return { success: false, error: 'Unable to connect to server' };
  }
}

// ─── Helper: Extract user data from Azure AD claims ─────────────────────────
function extractUserData(account, idTokenClaims = {}) {
  const email = (
    account.username || 
    idTokenClaims.email || 
    idTokenClaims.preferred_username || 
    ''
  ).toLowerCase();

  const name = account.name || 
    idTokenClaims.name || 
    `${idTokenClaims.given_name || ''} ${idTokenClaims.family_name || ''}`.trim() ||
    email.split('@')[0];

  const groups = idTokenClaims.groups || [];

  return {
    email,
    name,
    azure_oid: account.localAccountId || idTokenClaims.oid || '',
    groups,
    isDefaultAdmin: DEFAULT_ADMIN_EMAILS.includes(email),
  };
}

// ─── Mock: Simulate backend SSO response for development ────────────────────
function mockSsoBackendResponse(userData) {
  const { email, name, azure_oid, isDefaultAdmin } = userData;

  const role = isDefaultAdmin ? 'admin' : 'sales_rep';

  const ROLE_LABELS = {
    sales_rep: 'Sales Representative',
    tbm: 'Territory Business Manager',
    abm: 'Area Business Manager',
    zbm: 'Zonal Business Manager',
    sales_head: 'Sales Head',
    admin: 'System Administrator',
  };

  const empPrefix = isDefaultAdmin ? 'ADM' : 'EMP';
  const empNum = String(Math.floor(Math.random() * 900) + 100);
  const employeeCode = `${empPrefix}-${empNum}`;

  const user = {
    id: Date.now(),
    employee_code: employeeCode,
    name: name,
    username: email.split('@')[0],
    email: email,
    role: role,
    roleLabel: ROLE_LABELS[role],
    territory: isDefaultAdmin ? 'System' : 'Unassigned',
    azure_oid: azure_oid,
    auth_provider: 'azure_ad',
  };

  return {
    success: true,
    token: `mock-jwt-sso-${Date.now()}`,
    user,
  };
}
