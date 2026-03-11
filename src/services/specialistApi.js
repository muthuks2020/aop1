import { apiRequest, API_URL } from './apiClient';
import { normalizeProduct, normalizeCategory, normalizeArray } from './normalizers';

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

  async getCategories() {
    const raw = await apiRequest('/categories');
    return normalizeArray(raw, normalizeCategory);
  },

  async getProducts() {
    const raw = await apiRequest('/specialist/products');
    return normalizeArray(raw, normalizeProduct);
  },

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
