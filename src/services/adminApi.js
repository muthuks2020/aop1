/**
 * Admin API Service — v5 Live Backend
 *
 * ALL mock data REMOVED. Live API calls via shared apiRequest().
 * Field renames: name→productName, code→productCode, subcategory→productFamily,
 *   listPrice→unitCost, hierarchy id→employeeCode, name→fullName
 *
 * @version 5.0.0
 */

import { apiRequest } from './apiClient';

export const AdminApiService = {

  // ==================== PRODUCT MANAGEMENT ====================

  async getProducts() {
    return apiRequest('/admin/products');
  },

  async getCategories() {
    return apiRequest('/admin/categories');
  },

  async createProduct(productData) {
    return apiRequest('/admin/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  async updateProduct(productId, updates) {
    return apiRequest(`/admin/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async toggleProductStatus(productId) {
    return apiRequest(`/admin/products/${productId}/toggle-status`, {
      method: 'PATCH',
    });
  },

  async deleteProduct(productId) {
    return apiRequest(`/admin/products/${productId}`, {
      method: 'DELETE',
    });
  },

  // ==================== HIERARCHY MANAGEMENT ====================

  async getHierarchy() {
    return apiRequest('/admin/hierarchy');
  },

  async getUsers(filters = {}) {
    const params = new URLSearchParams();
    if (filters.role) params.set('role', filters.role);
    if (filters.isActive !== undefined) params.set('isActive', filters.isActive);
    const query = params.toString();
    return apiRequest(`/admin/users${query ? '?' + query : ''}`);
  },

  async createUser(userData) {
    return apiRequest('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async updateUser(userId, updates) {
    return apiRequest(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async toggleUserStatus(userId) {
    return apiRequest(`/admin/users/${userId}/toggle-status`, {
      method: 'PATCH',
    });
  },

  async reassignPosition(fromCode, toCode) {
    return apiRequest('/admin/reassign-position', {
      method: 'POST',
      body: JSON.stringify({ fromCode, toCode }),
    });
  },

  // ==================== VACANT POSITIONS ====================

  async getVacantPositions() {
    return apiRequest('/admin/vacant-positions');
  },

  async fillVacantPosition(positionId, userData) {
    return apiRequest(`/admin/vacant-positions/${positionId}/fill`, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // ==================== FISCAL YEAR ====================

  async getFiscalYears() {
    return apiRequest('/admin/fiscal-years');
  },

  async setActiveFiscalYear(fyCode) {
    return apiRequest(`/admin/fiscal-years/${fyCode}/activate`, {
      method: 'POST',
    });
  },

  // ==================== DASHBOARD ====================

  async getDashboardStats() {
    return apiRequest('/admin/dashboard-stats');
  },
};

export default AdminApiService;
