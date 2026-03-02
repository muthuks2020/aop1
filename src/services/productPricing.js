/**
 * Product Pricing Service — v5 Live Backend
 *
 * ★ Migrated from mock data to live API.
 * Unit costs now come from product_master.quota_price__c via the backend.
 *
 * NOTE: In v5, unit costs are also returned on each product/commitment
 * via the formatCommitment() JOIN (product.unitCost). This service is
 * useful for standalone pricing lookups outside the commitment context.
 *
 * @version 5.1.0
 */

import { apiRequest } from './apiClient';

export const ProductPricingService = {

  /**
   * Get all product pricing data
   * GET /product-pricing
   * @returns {Promise<Array>} Array of { productCode, productName, categoryId, subcategory, unitCost, currency }
   */
  async getAllPricing() {
    const raw = await apiRequest('/product-pricing');
    return Array.isArray(raw) ? raw.map(normalizePricing) : [];
  },

  /**
   * Get pricing for a specific product by code
   * GET /product-pricing/:code
   * @param {string} productCode
   * @returns {Promise<Object|null>}
   */
  async getPricingByProductCode(productCode) {
    try {
      const raw = await apiRequest(`/product-pricing/${productCode}`);
      return raw ? normalizePricing(raw) : null;
    } catch {
      return null;
    }
  },

  /**
   * Get pricing for products in a specific category
   * GET /product-pricing?category={categoryId}
   * @param {string} categoryId
   * @returns {Promise<Array>}
   */
  async getPricingByCategory(categoryId) {
    const raw = await apiRequest(`/product-pricing?category=${categoryId}`);
    return Array.isArray(raw) ? raw.map(normalizePricing) : [];
  },

  /**
   * Get a pricing lookup map { productCode: { unitCost, currency, isRevenueOnly } }
   * Useful for quick lookups during revenue calculations.
   * @returns {Promise<Object>}
   */
  async getPricingMap() {
    const pricing = await this.getAllPricing();
    const map = {};
    pricing.forEach((p) => {
      map[p.productCode] = {
        unitCost: p.unitCost,
        currency: p.currency || 'INR',
        isRevenueOnly: p.isRevenueOnly || false,
      };
    });
    return map;
  },
};

/**
 * Normalize pricing response from backend
 * Backend (CommonService.getProductPricing) returns:
 *   { productCode, productName, categoryId, subcategory, unitCost }
 */
function normalizePricing(p) {
  if (!p) return p;
  return {
    ...p,
    productCode:   p.productCode   || p.product_code  || '',
    productName:   p.productName   || p.product_name  || '',
    categoryId:    p.categoryId    || p.category_id   || '',
    subcategory:   p.subcategory   || p.product_family || '',
    unitCost:      parseFloat(p.unitCost || p.unit_cost || 0),
    currency:      p.currency      || 'INR',
    isRevenueOnly: p.isRevenueOnly ?? false,
  };
}

export default ProductPricingService;
