/**
 * Sales Head API Service — v5 Live Backend
 *
 * ALL mock data REMOVED. Live API calls via shared apiRequest().
 *
 * @version 5.0.0
 */

import { apiRequest, API_URL } from './apiClient';

export const SALESHEAD_API_CONFIG = {
  baseUrl: API_URL,
  endpoints: {
    getCategories: '/saleshead/categories',
    getZBMSubmissions: '/saleshead/zbm-submissions',
    getZBMHierarchy: '/saleshead/zbm-hierarchy',
    approveZBMTarget: '/saleshead/approve-zbm/:id',
    bulkApproveZBM: '/saleshead/bulk-approve-zbm',
    getDashboardStats: '/saleshead/dashboard-stats',
    getUniqueZBMs: '/saleshead/unique-zbms',
  },
};

export const SalesHeadApiService = {

  // ==================== CATEGORIES ====================

  async getCategories() {
    return apiRequest('/saleshead/categories');
  },

  // ==================== ZBM SUBMISSIONS ====================

  async getZBMSubmissions(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.categoryId) params.set('categoryId', filters.categoryId);
    if (filters.zbmId) params.set('zbmId', filters.zbmId);
    const query = params.toString();
    return apiRequest(`/saleshead/zbm-submissions${query ? '?' + query : ''}`);
  },

  // ==================== APPROVALS ====================

  async approveZBMTarget(submissionId, corrections = null) {
    return apiRequest(`/saleshead/approve-zbm/${submissionId}`, {
      method: 'PUT',
      body: JSON.stringify({ corrections }),
    });
  },

  async rejectZBMTarget(submissionId, reason = '') {
    return apiRequest(`/saleshead/reject-zbm/${submissionId}`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  },

  async bulkApproveZBM(submissionIds) {
    return apiRequest('/saleshead/bulk-approve-zbm', {
      method: 'POST',
      body: JSON.stringify({ submissionIds }),
    });
  },

  // ==================== HIERARCHY DRILL-DOWN ====================

  async getZBMHierarchy() {
    return apiRequest('/saleshead/zbm-hierarchy');
  },

  // ==================== TEAM YEARLY TARGETS ====================

  async getTeamMembers() {
    return apiRequest('/saleshead/team-members');
  },

  async getTeamYearlyTargets() {
    return apiRequest('/saleshead/team-yearly-targets');
  },

  async saveTeamYearlyTargets(targets) {
    return apiRequest('/saleshead/team-yearly-targets/save', {
      method: 'POST',
      body: JSON.stringify({ targets }),
    });
  },

  // ==================== DASHBOARD ====================

  async getDashboardStats() {
    return apiRequest('/saleshead/dashboard-stats');
  },

  async getUniqueZBMs() {
    return apiRequest('/saleshead/unique-zbms');
  },

  // ==================== ANALYTICS (OPTIONAL) ====================

  async getRegionalPerformance() {
    return apiRequest('/saleshead/regional-performance');
  },

  async getMonthlyTrend() {
    return apiRequest('/saleshead/monthly-trend');
  },

  async getAnalyticsDistribution(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/saleshead/analytics/distribution?${query}`);
  },

  async getAnalyticsComparison(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/saleshead/analytics/comparison?${query}`);
  },

  async getAchievementData(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/saleshead/analytics/achievement?${query}`);
  },
};

export default SalesHeadApiService;
