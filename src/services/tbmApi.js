import { apiRequest, API_URL } from './apiClient';
import {
  normalizeProduct, normalizeCategory, normalizeSubmission,
  normalizeArray
} from './normalizers';

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
    getYearlyTargets: '/tbm/yearly-targets',
    saveYearlyTargets: '/tbm/yearly-targets/save',
    publishYearlyTargets: '/tbm/yearly-targets/publish',
  },
};

export const TBMApiService = {

  async getCategories() {
    const raw = await apiRequest('/categories');
    return normalizeArray(raw, normalizeCategory);
  },

  async getProducts() {
    const raw = await apiRequest('/products');
    return normalizeArray(raw, normalizeProduct);
  },

  async getSalesRepSubmissions(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.categoryId) params.set('categoryId', filters.categoryId);
    if (filters.salesRepId) params.set('employeeCode', filters.salesRepId || filters.employeeCode);
    const query = params.toString();
    const raw = await apiRequest(`/tbm/sales-rep-submissions${query ? '?' + query : ''}`);
    return normalizeArray(raw, normalizeSubmission);
  },

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

  async getTBMTargets() {
    const raw = await apiRequest('/tbm/territory-targets');
    return normalizeArray(raw, normalizeProduct);
  },

  async saveTBMTargets(targets) {
    return apiRequest('/tbm/territory-targets/save', {
      method: 'POST',
      body: JSON.stringify({ targets }),
    });
  },

  async submitTBMTargets(targetIds) {
    return apiRequest('/tbm/territory-targets/submit', {
      method: 'POST',
      body: JSON.stringify({ targetIds }),
    });
  },

  async getTBMIndividualTargets() {
    const raw = await apiRequest('/tbm/individual-targets');
    return normalizeArray(raw, normalizeProduct);
  },

  async saveTBMIndividualTargets(targets) {
    return apiRequest('/tbm/individual-targets/save', {
      method: 'POST',
      body: JSON.stringify({ targets }),
    });
  },

  async submitTBMIndividualTargets(targetIds) {
    return apiRequest('/tbm/individual-targets/submit', {
      method: 'POST',
      body: JSON.stringify({ targetIds }),
    });
  },

  async getYearlyTargets(fiscalYear) {
    return apiRequest(`/tbm/yearly-targets?fy=${fiscalYear}`);
  },

  async saveYearlyTargets(fiscalYear, members) {
    return apiRequest('/tbm/yearly-targets/save', {
      method: 'POST',
      body: JSON.stringify({
        fiscalYear,
        members: members.map((m) => ({
          id: m.id,
          cyTarget: m.cyTarget,
          cyTargetValue: m.cyTargetValue,
          categoryBreakdown: m.categoryBreakdown?.map((c) => ({
            id: c.id,
            cyTarget: c.cyTarget,
            cyTargetValue: c.cyTargetValue,
          })),
        })),
      }),
    });
  },

  async publishYearlyTargets(fiscalYear, memberIds) {
    return apiRequest('/tbm/yearly-targets/publish', {
      method: 'POST',
      body: JSON.stringify({ fiscalYear, memberIds }),
    });
  },

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

  async getTBMDashboardStats() {
    return apiRequest('/tbm/dashboard-stats');
  },
};

export default TBMApiService;
