/**
 * ssoRoleMap.js — Email → Role Mapping for SSO
 *
 * ★ THIS IS THE ONLY FILE YOU NEED TO EDIT TO ADD NEW USERS ★
 *
 * Steps to add a new user:
 *   1. Add their email and role to EMAIL_ROLE_MAP below
 *   2. Save the file — done!
 *
 * Available roles:
 *   sales_rep  → Sales Representative Dashboard
 *   tbm        → Territory Business Manager Dashboard
 *   abm        → Area Business Manager Dashboard
 *   zbm        → Zonal Business Manager Dashboard
 *   specialist → Specialist Dashboard
 *   sales_head → Sales Head Dashboard
 *   admin      → Admin Dashboard
 *
 * @version 1.0.0
 */

// ─── ADD / REMOVE USERS HERE ─────────────────────────────────────────────────
export const EMAIL_ROLE_MAP = {
  // Current users
  'muthu.balakrishnan@appasamy.com': 'sales_rep',

  // Add more users below as needed:
  // 'john.doe@appasamy.com':        'tbm',
  // 'sarah.jones@appasamy.com':     'abm',
  // 'raj.kumar@appasamy.com':       'zbm',
  // 'priya.nair@appasamy.com':      'specialist',
  // 'srinivasan@appasamy.com':      'sales_head',
  // 'admin@appasamy.com':           'admin',
};

// ─── Role → Dashboard Route ───────────────────────────────────────────────────
export const ROLE_ROUTES = {
  sales_rep:  '/dashboard',
  tbm:        '/dashboard',
  abm:        '/dashboard',
  zbm:        '/dashboard',
  specialist: '/dashboard',
  sales_head: '/dashboard',
  admin:      '/dashboard',
};

// ─── Role Labels (display name) ───────────────────────────────────────────────
export const ROLE_LABELS = {
  sales_rep:  'Sales Representative',
  tbm:        'Territory Business Manager',
  abm:        'Area Business Manager',
  zbm:        'Zonal Business Manager',
  specialist: 'Specialist',
  sales_head: 'Sales Head',
  admin:      'System Administrator',
};

/**
 * Given an email address, returns the role and route.
 * Returns null if the email is not in the map (access denied).
 *
 * @param {string} email
 * @returns {{ role: string, route: string, label: string } | null}
 */
export function getRoleByEmail(email) {
  if (!email) return null;
  const normalised = email.trim().toLowerCase();
  const role = EMAIL_ROLE_MAP[normalised];
  if (!role) return null;
  return {
    role,
    route: ROLE_ROUTES[role] || '/dashboard',
    label: ROLE_LABELS[role] || role,
  };
}
