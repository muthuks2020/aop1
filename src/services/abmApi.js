import { apiRequest } from './apiClient';
import {
  normalizeCategory, normalizeSubmission, normalizeGeoTarget,
  normalizeArray
} from './normalizers';

export const ABMApiService = {

  async getCategories() {
    const raw = await apiRequest('/categories');
    return normalizeArray(raw, normalizeCategory);
  },

  async getTBMSubmissions(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.categoryId) params.set('categoryId', filters.categoryId);
    if (filters.tbmId) params.set('tbmId', filters.tbmId);
    const query = params.toString();
    const raw = await apiRequest(`/abm/tbm-submissions${query ? '?' + query : ''}`);
    return normalizeArray(raw, normalizeSubmission);
  },

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

  async getABMTargets() {
    const raw = await apiRequest('/abm/area-targets');
    return normalizeArray(raw, normalizeGeoTarget);
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

  async getTBMHierarchy() {
    return apiRequest('/abm/tbm-hierarchy');
  },

  async getDashboardStats() {
    return apiRequest('/abm/dashboard-stats');
  },

  async getUniqueTBMs() {
    return apiRequest('/abm/unique-tbms');
  },
};

export default ABMApiService;
