/**
 * api.js — Sales Rep API Service (v5 Live Backend)
 *
 * ALL mock data and USE_MOCK branches REMOVED.
 * All requests go through apiRequest() with auto auth + 401 refresh.
 *
 * Field mapping applied:
 *   product.name → product.productName (backend returns new shape)
 *   product.code → product.productCode
 *   product.subcategory → product.productFamily
 *   Revenue = qty × product.unitCost (from product_master)
 *
 * @version 5.0.0
 */

import { apiRequest, API_URL } from './apiClient';

export const API_CONFIG = {
  baseUrl: API_URL,
  endpoints: {
    getCategories: '/categories',
    getProducts: '/products',
    saveProduct: '/products/:id/save',
    submitProduct: '/products/:id/submit',
    submitMultiple: '/products/submit-multiple',
    saveAll: '/products/save-all',
    getDashboardSummary: '/salesrep/dashboard-summary',
    getQuarterlySummary: '/salesrep/quarterly-summary',
    getCategoryPerformance: '/salesrep/category-performance',
    getAopTargets: '/aop-targets',
    getFiscalYears: '/fiscal-years',
  },
};

export const ApiService = {

  // ==================== CATEGORIES ====================

  async getCategories() {
    return apiRequest('/categories');
  },

  // ==================== PRODUCTS ====================

  async getProducts() {
    return apiRequest('/products');
  },

  async getProductsByCategory(categoryId) {
    return apiRequest(`/products?category=${categoryId}`);
  },

  // ==================== TARGET ENTRY ====================

  async updateMonthlyTarget(productId, month, data) {
    return apiRequest(`/products/${productId}/targets/${month}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async saveProduct(productId, monthlyTargets) {
    return apiRequest(`/products/${productId}/save`, {
      method: 'PUT',
      body: JSON.stringify({ monthlyTargets }),
    });
  },

  async saveAllDrafts(products) {
    return apiRequest('/products/save-all', {
      method: 'POST',
      body: JSON.stringify({ products }),
    });
  },

  // ==================== SUBMIT ====================

  async submitProduct(productId) {
    return apiRequest(`/products/${productId}/submit`, {
      method: 'POST',
    });
  },

  async submitMultipleProducts(productIds) {
    return apiRequest('/products/submit-multiple', {
      method: 'POST',
      body: JSON.stringify({ productIds }),
    });
  },

  // ==================== APPROVALS (kept for backward compat) ====================

  async approveProduct(productId, comments = '') {
    return apiRequest(`/products/${productId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ comments }),
    });
  },

  async rejectProduct(productId, reason = '') {
    return apiRequest(`/products/${productId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // ==================== DASHBOARD / ANALYTICS ====================

  async getAOPTargets(userId, fiscalYear) {
    return apiRequest(`/aop-targets?userId=${userId}&fy=${fiscalYear}`);
  },

  async getSalesRepDashboardSummary() {
    return apiRequest('/salesrep/dashboard-summary');
  },

  async getSalesRepQuarterlySummary(fiscalYear) {
    return apiRequest(`/salesrep/quarterly-summary?fy=${fiscalYear}`);
  },

  async getCategoryPerformance() {
    return apiRequest('/salesrep/category-performance');
  },

  async getFiscalYears() {
    return apiRequest('/fiscal-years');
  },
};

export default ApiService;
