/**
 * Specialist API Service — v5 Live Backend
 *
 * ALL mock data REMOVED. Live API calls via shared apiRequest().
 *
 * @version 5.0.0
 */

import { apiRequest, API_URL } from './apiClient';

export const SPECIALIST_API_CONFIG = {
  baseUrl: API_URL,
  endpoints: {
    getProducts: '/specialist/products',
    saveProduct: '/specialist/products/:id/save',
    submitProduct: '/specialist/products/:id/submit',
    submitMultiple: '/specialist/products/submit-multiple',
    saveAll: '/specialist/products/save-all',
    getDashboardSummary: '/specialist/dashboard-summary',
    getQuarterlySummary: '/specialist/quarterly-summary',
    getCategoryPerformance: '/specialist/category-performance',
    getCategories: '/categories',
    getFiscalYears: '/fiscal-years',
  },
};

export const SpecialistApiService = {

  // ==================== CATEGORIES ====================

  async getCategories() {
    return apiRequest('/categories');
  },

  // ==================== PRODUCTS ====================

  async getProducts() {
    return apiRequest('/specialist/products');
  },

  // ==================== TARGET ENTRY ====================

  async saveProduct(productId, monthlyTargets) {
    return apiRequest(`/specialist/products/${productId}/save`, {
      method: 'PUT',
      body: JSON.stringify({ monthlyTargets }),
    });
  },

  async saveAllDrafts(products) {
    return apiRequest('/specialist/products/save-all', {
      method: 'POST',
      body: JSON.stringify({ products }),
    });
  },

  // ==================== SUBMIT ====================

  async submitProduct(productId) {
    return apiRequest(`/specialist/products/${productId}/submit`, {
      method: 'POST',
    });
  },

  async submitMultipleProducts(productIds) {
    return apiRequest('/specialist/products/submit-multiple', {
      method: 'POST',
      body: JSON.stringify({ productIds }),
    });
  },

  // ==================== DASHBOARD ====================

  async getDashboardSummary() {
    return apiRequest('/specialist/dashboard-summary');
  },

  async getQuarterlySummary(fiscalYear) {
    return apiRequest(`/specialist/quarterly-summary?fy=${fiscalYear}`);
  },

  async getCategoryPerformance() {
    return apiRequest('/specialist/category-performance');
  },
};

export default SpecialistApiService;
