/**
 * ABM API Service — v5 Live Backend
 *
 * ALL mock data REMOVED. Live API calls via shared apiRequest().
 *
 * @version 5.0.0
 */

import { apiRequest } from './apiClient';

export const ABMApiService = {

  // ==================== CATEGORIES ====================

  async getCategories() {
    return apiRequest('/categories');
  },

  // ==================== TBM SUBMISSIONS ====================

  async getTBMSubmissions(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.categoryId) params.set('categoryId', filters.categoryId);
    if (filters.tbmId) params.set('tbmId', filters.tbmId);
    const query = params.toString();
    return apiRequest(`/abm/tbm-submissions${query ? '?' + query : ''}`);
  },

  // ==================== APPROVALS ====================

  async approveTBMTarget(submissionId, corrections = null) {
    return apiRequest(`/abm/approve-tbm/${submissionId}`, {
      method: 'PUT',
      body: JSON.stringify({ corrections }),
    });
  },

  async rejectTBMTarget(submissionId, reason = '') {
    return apiRequest(`/abm/reject-tbm/${submissionId}`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  },

  async bulkApproveTBM(submissionIds) {
    return apiRequest('/abm/bulk-approve-tbm', {
      method: 'POST',
      body: JSON.stringify({ submissionIds }),
    });
  },

  // ==================== ABM AREA TARGETS ====================

  async getABMTargets() {
    return apiRequest('/abm/area-targets');
  },

  async saveABMTarget(productId, monthlyTargets) {
    return apiRequest(`/abm/area-targets/${productId}/save`, {
      method: 'PUT',
      body: JSON.stringify({ monthlyTargets }),
    });
  },

  async saveABMTargets(targets) {
    return apiRequest('/abm/area-targets/save', {
      method: 'POST',
      body: JSON.stringify({ targets }),
    });
  },

  async submitABMTargets(productIds) {
    return apiRequest('/abm/area-targets/submit', {
      method: 'POST',
      body: JSON.stringify({ productIds }),
    });
  },

  // ==================== TEAM YEARLY TARGETS ====================

  async getTeamMembers() {
    return apiRequest('/abm/team-members');
  },

  async getTeamYearlyTargets() {
    return apiRequest('/abm/team-yearly-targets');
  },

  async saveTeamYearlyTargets(targets) {
    return apiRequest('/abm/team-yearly-targets/save', {
      method: 'POST',
      body: JSON.stringify({ targets }),
    });
  },

  // ==================== HIERARCHY DRILL-DOWN ====================

  async getTBMHierarchy() {
    return apiRequest('/abm/tbm-hierarchy');
  },

  // ==================== DASHBOARD ====================

  async getDashboardStats() {
    return apiRequest('/abm/dashboard-stats');
  },

  async getUniqueTBMs() {
    return apiRequest('/abm/unique-tbms');
  },
};

export default ABMApiService;
