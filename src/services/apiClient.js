/**
 * apiClient.js — Shared API request helper
 *
 * All service files import this to make authenticated API calls.
 * Features:
 * - Automatic Bearer token injection
 * - 401 auto-refresh with retry
 * - Consistent error handling
 * - Configurable base URL from env
 *
 * @version 5.0.0
 */

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

/**
 * Get auth headers with current JWT token
 */
export const getAuthHeaders = () => {
  const token = localStorage.getItem('appasamy_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

/**
 * Attempt silent token refresh
 * @returns {boolean} true if refresh succeeded
 */
const attemptRefresh = async () => {
  const refreshToken = localStorage.getItem('appasamy_refresh_token');
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!response.ok) return false;
    const data = await response.json();
    localStorage.setItem('appasamy_token', data.token);
    if (data.refresh_token) {
      localStorage.setItem('appasamy_refresh_token', data.refresh_token);
    }
    return true;
  } catch {
    return false;
  }
};

/**
 * Make an authenticated API request with auto-retry on 401
 *
 * @param {string} endpoint  – API path, e.g. '/products'
 * @param {object} options   – fetch options (method, body, etc.)
 * @returns {Promise<any>}   – parsed JSON response
 */
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;

  const doFetch = async () => {
    const response = await fetch(url, {
      headers: getAuthHeaders(),
      ...options,
      // Ensure headers from options are merged, not replaced
      ...(options.headers && {
        headers: { ...getAuthHeaders(), ...options.headers },
      }),
    });
    return response;
  };

  let response = await doFetch();

  // If 401, try refresh once then retry
  if (response.status === 401) {
    const refreshed = await attemptRefresh();
    if (refreshed) {
      response = await doFetch();
    }

    if (response.status === 401) {
      // Still 401 — force re-login
      localStorage.removeItem('appasamy_token');
      localStorage.removeItem('appasamy_refresh_token');
      localStorage.removeItem('appasamy_user');
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    let errorMessage = `API Error ${response.status}: ${response.statusText}`;
    try {
      const parsed = JSON.parse(errorBody);
      errorMessage = parsed.message || errorMessage;
    } catch { /* use default */ }
    throw new Error(errorMessage);
  }

  return response.json();
};

export { API_URL };
export default apiRequest;
