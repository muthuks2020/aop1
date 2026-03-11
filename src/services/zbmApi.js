import { apiRequest } from './apiClient';
import { normalizeCategory, normalizeSubmission, normalizeArray } from './normalizers';

export const ZBMApiService = {

  async getCategories() {
    const raw = await apiRequest('/categories');
    return normalizeArray(raw, normalizeCategory);
  },

  async getABMSubmissions(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.categoryId) params.set('categoryId', filters.categoryId);
    if (filters.abmId) params.set('abmId', filters.abmId);
    const query = params.toString();
    const raw = await apiRequest(`/zbm/abm-submissions${query ? '?' + query : ''}`);
    return normalizeArray(raw, normalizeSubmission);
  },

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

  async getABMHierarchy() {
    return apiRequest('/zbm/abm-hierarchy');
  },

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

  async getDashboardStats() {
    return apiRequest('/zbm/dashboard-stats');
  },

  async getUniqueABMs() {
    return apiRequest('/zbm/unique-abms');
  },
};

export default ZBMApiService;
