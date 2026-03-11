import { apiRequest } from './apiClient';
import {
  normalizeAdminProduct, normalizeCategory, normalizeUser,
  normalizeArray
} from './normalizers';

export const AdminApiService = {

  async getProducts() {
    const raw = await apiRequest('/admin/products');
    return normalizeArray(raw, normalizeAdminProduct);
  },

  async getCategories() {
    const raw = await apiRequest('/admin/categories');
    return normalizeArray(raw, normalizeCategory);
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

  async getHierarchy() {
    return apiRequest('/admin/hierarchy');
  },

  async getUsers(filters = {}) {
    const params = new URLSearchParams();
    if (filters.role) params.set('role', filters.role);
    if (filters.isActive !== undefined) params.set('isActive', filters.isActive);
    const query = params.toString();
    const raw = await apiRequest(`/admin/users${query ? '?' + query : ''}`);
    return normalizeArray(raw, normalizeUser);
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

  async getVacantPositions() {
    return apiRequest('/admin/vacant-positions');
  },

  async fillVacantPosition(positionId, userData) {
    return apiRequest(`/admin/vacant-positions/${positionId}/fill`, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async getFiscalYears() {
    return apiRequest('/admin/fiscal-years');
  },

  async setActiveFiscalYear(fyCode) {
    return apiRequest(`/admin/fiscal-years/${fyCode}/activate`, {
      method: 'POST',
    });
  },

  async getDashboardStats() {
    return apiRequest('/admin/dashboard-stats');
  },
};

export default AdminApiService;
