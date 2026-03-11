import { apiRequest, API_URL } from './apiClient';
import { normalizeProduct, normalizeCategory, normalizeArray } from './normalizers';

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

  async getCategories() {
    const raw = await apiRequest('/categories');
    return normalizeArray(raw, normalizeCategory);
  },

  async getProducts() {
    const raw = await apiRequest('/products');
    return normalizeArray(raw, normalizeProduct);
  },

  async getProductsByCategory(categoryId) {
    const raw = await apiRequest(`/products?category=${categoryId}`);
    return normalizeArray(raw, normalizeProduct);
  },

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

  async getAOPTargets(userId, fiscalYear) {
    return apiRequest(`/aop-targets?userId=${userId}&fy=${fiscalYear}`);
  },

  async getSalesRepDashboardSummary() {
    return apiRequest('/salesrep/dashboard-summary');
  },

  async getDashboardSummary() {
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
