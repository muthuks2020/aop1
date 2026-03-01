/**
 * TBM API Service — v5 Live Backend
 *
 * ALL mock data REMOVED. Live API calls via shared apiRequest().
 * Field renames applied per migration guide.
 *
 * @version 5.0.0
 */

import { apiRequest, API_URL } from './apiClient';

export const TBM_API_CONFIG = {
  baseUrl: API_URL,
  endpoints: {
    getSalesRepSubmissions: '/tbm/sales-rep-submissions',
    approveSalesRepTarget: '/tbm/approve-sales-rep/:id',
    rejectSalesRepTarget: '/tbm/reject-sales-rep/:id',
    bulkApproveSalesRep: '/tbm/bulk-approve-sales-rep',
    bulkRejectSalesRep: '/tbm/bulk-reject-sales-rep',
    getTBMTargets: '/tbm/territory-targets',
    saveTBMTargets: '/tbm/territory-targets/save',
    submitTBMTargets: '/tbm/territory-targets/submit',
    getTBMIndividualTargets: '/tbm/individual-targets',
    saveTBMIndividualTargets: '/tbm/individual-targets/save',
    submitTBMIndividualTargets: '/tbm/individual-targets/submit',
    getTBMDashboardStats: '/tbm/dashboard-stats',
    getCategories: '/categories',
    getProducts: '/products',
  },
};

export const TBMApiService = {

  // ==================== CATEGORIES & PRODUCTS ====================

  async getCategories() {
    return apiRequest('/categories');
  },

  async getProducts() {
    return apiRequest('/products');
  },

  // ==================== SALES REP SUBMISSIONS ====================

  async getSalesRepSubmissions(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.categoryId) params.set('categoryId', filters.categoryId);
    if (filters.salesRepId) params.set('employeeCode', filters.salesRepId || filters.employeeCode);
    const query = params.toString();
    return apiRequest(`/tbm/sales-rep-submissions${query ? '?' + query : ''}`);
  },

  // ==================== APPROVALS ====================

  async approveSalesRepTarget(submissionId, corrections = null) {
    return apiRequest(`/tbm/approve-sales-rep/${submissionId}`, {
      method: 'PUT',
      body: JSON.stringify({ corrections }),
    });
  },

  async rejectSalesRepTarget(submissionId, reason = '') {
    return apiRequest(`/tbm/reject-sales-rep/${submissionId}`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  },

  async bulkApproveSalesRep(submissionIds) {
    return apiRequest('/tbm/bulk-approve-sales-rep', {
      method: 'POST',
      body: JSON.stringify({ submissionIds }),
    });
  },

  async bulkRejectSalesRep(submissionIds, reason = '') {
    return apiRequest('/tbm/bulk-reject-sales-rep', {
      method: 'POST',
      body: JSON.stringify({ submissionIds, reason }),
    });
  },

  // ==================== TBM TERRITORY TARGETS ====================

  async getTBMTargets() {
    return apiRequest('/tbm/territory-targets');
  },

  async saveTBMTarget(productId, monthlyTargets) {
    return apiRequest(`/tbm/territory-targets/${productId}/save`, {
      method: 'PUT',
      body: JSON.stringify({ monthlyTargets }),
    });
  },

  async saveTBMTargets(targets) {
    return apiRequest('/tbm/territory-targets/save', {
      method: 'POST',
      body: JSON.stringify({ targets }),
    });
  },

  async submitTBMTargets(productIds) {
    return apiRequest('/tbm/territory-targets/submit', {
      method: 'POST',
      body: JSON.stringify({ productIds }),
    });
  },

  // ==================== TBM INDIVIDUAL TARGETS ====================

  async getTBMIndividualTargets() {
    return apiRequest('/tbm/individual-targets');
  },

  async saveTBMIndividualTarget(productId, monthlyTargets) {
    return apiRequest(`/tbm/individual-targets/${productId}/save`, {
      method: 'PUT',
      body: JSON.stringify({ monthlyTargets }),
    });
  },

  async submitTBMIndividualTargets(productIds) {
    return apiRequest('/tbm/individual-targets/submit', {
      method: 'POST',
      body: JSON.stringify({ productIds }),
    });
  },

  // ==================== TEAM YEARLY TARGETS ====================

  async getTeamMembers() {
    return apiRequest('/tbm/team-members');
  },

  async getTeamYearlyTargets() {
    return apiRequest('/tbm/team-yearly-targets');
  },

  async saveTeamYearlyTargets(targets) {
    return apiRequest('/tbm/team-yearly-targets/save', {
      method: 'POST',
      body: JSON.stringify({ targets }),
    });
  },

  // ==================== DASHBOARD STATS ====================

  async getDashboardStats() {
    return apiRequest('/tbm/dashboard-stats');
  },

  async getUniqueReps() {
    return apiRequest('/tbm/unique-reps');
  },
};

export default TBMApiService;
