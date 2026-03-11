/**
 * apiClient.js — Shared API request helper
 *
 * - Automatic Bearer token injection
 * - 401 redirect to login (no JWT refresh needed)
 * - Consistent error handling
 *
 * @version 6.0.0 - Removed JWT refresh (simple token, no expiry)
 */

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

/** Get auth headers with current session token */
export const getAuthHeaders = () => {
  const token = localStorage.getItem('appasamy_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

/**
 * Make an authenticated API request.
 *
 * @param {string} endpoint  – API path, e.g. '/products'
 * @param {object} options   – fetch options (method, body, etc.)
 * @returns {Promise<any>}   – parsed JSON response
 */
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    headers: getAuthHeaders(),
    ...options,
    ...(options.headers && {
      headers: { ...getAuthHeaders(), ...options.headers },
    }),
  });

  // 401 — force re-login
  if (response.status === 401) {
    localStorage.removeItem('appasamy_token');
    localStorage.removeItem('appasamy_user');
    window.location.href = '/login';
    throw new Error('Session expired. Please login again.');
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
