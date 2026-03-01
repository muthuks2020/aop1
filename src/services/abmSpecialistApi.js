/**
 * ABM Specialist API Service — v5 Live Backend
 *
 * Specialist submissions flow: Specialist → ABM → ZBM → Sales Head
 * ALL mock data REMOVED.
 *
 * @version 5.0.0
 */

import { apiRequest } from './apiClient';

const ABMSpecialistApiService = {

  // ==================== SPECIALIST SUBMISSIONS ====================

  async getSpecialistSubmissions(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.categoryId) params.set('categoryId', filters.categoryId);
    if (filters.specialistId) params.set('specialistId', filters.specialistId);
    const query = params.toString();
    return apiRequest(`/abm/specialist-submissions${query ? '?' + query : ''}`);
  },

  // ==================== APPROVALS ====================

  async approveSpecialistTarget(submissionId, corrections = null) {
    return apiRequest(`/abm/approve-specialist/${submissionId}`, {
      method: 'PUT',
      body: JSON.stringify({ corrections }),
    });
  },

  async rejectSpecialistTarget(submissionId, reason = '') {
    return apiRequest(`/abm/reject-specialist/${submissionId}`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  },

  async bulkApproveSpecialist(submissionIds) {
    return apiRequest('/abm/bulk-approve-specialist', {
      method: 'POST',
      body: JSON.stringify({ submissionIds }),
    });
  },

  // ==================== SPECIALIST YEARLY TARGETS ====================

  async getSpecialists() {
    return apiRequest('/abm/specialists');
  },

  async getSpecialistYearlyTargets() {
    return apiRequest('/abm/specialist-yearly-targets');
  },

  async saveSpecialistYearlyTargets(targets) {
    return apiRequest('/abm/specialist-yearly-targets/save', {
      method: 'POST',
      body: JSON.stringify({ targets }),
    });
  },

  // ==================== DASHBOARD ====================

  async getSpecialistDashboardStats() {
    return apiRequest('/abm/specialist-dashboard-stats');
  },

  async getUniqueSpecialists() {
    return apiRequest('/abm/unique-specialists');
  },
};

export default ABMSpecialistApiService;
