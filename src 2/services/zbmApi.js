/**
 * ZBM API Service — v5 Live Backend
 *
 * ★ FIELD NORMALIZATION via shared normalizers.js
 *
 * @version 5.1.0
 */

import { apiRequest } from './apiClient';
import { normalizeCategory, normalizeSubmission, normalizeArray } from './normalizers';

export const ZBMApiService = {

  // ==================== CATEGORIES ====================

  async getCategories() {
    const raw = await apiRequest('/categories');
    return normalizeArray(raw, normalizeCategory);
  },

  // ==================== ABM SUBMISSIONS ====================

  async getABMSubmissions(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.categoryId) params.set('categoryId', filters.categoryId);
    if (filters.abmId) params.set('abmId', filters.abmId);
    const query = params.toString();
    const raw = await apiRequest(`/zbm/abm-submissions${query ? '?' + query : ''}`);
    return normalizeArray(raw, normalizeSubmission);
  },

  // ==================== APPROVALS ====================

  async approveABMTarget(submissionId, corrections = null) {
    return apiRequest(`/zbm/approve-abm/${submissionId}`, {
      method: 'PUT',
      body: JSON.stringify({ corrections }),
    });
  },

  async rejectABMTarget(submissionId, reason = '') {
    return apiRequest(`/zbm/reject-abm/${submissionId}`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  },

  async bulkApproveABM(submissionIds) {
    return apiRequest('/zbm/bulk-approve-abm', {
      method: 'POST',
      body: JSON.stringify({ submissionIds }),
    });
  },

  // ==================== HIERARCHY DRILL-DOWN ====================

  async getABMHierarchy() {
    return apiRequest('/zbm/abm-hierarchy');
  },

  // ==================== TEAM YEARLY TARGETS ====================

  async getTeamMembers() {
    return apiRequest('/zbm/team-members');
  },

  async getTeamYearlyTargets() {
    return apiRequest('/zbm/team-yearly-targets');
  },

  async saveTeamYearlyTargets(targets) {
    return apiRequest('/zbm/team-yearly-targets/save', {
      method: 'POST',
      body: JSON.stringify({ targets }),
    });
  },

  // ==================== DASHBOARD ====================

  async getDashboardStats() {
    return apiRequest('/zbm/dashboard-stats');
  },

  async getUniqueABMs() {
    return apiRequest('/zbm/unique-abms');
  },
};

export default ZBMApiService;
