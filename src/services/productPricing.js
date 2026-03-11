import { apiRequest } from './apiClient';

export const ProductPricingService = {

  async getAllPricing() {
    const raw = await apiRequest('/product-pricing');
    return Array.isArray(raw) ? raw.map(normalizePricing) : [];
  },

  async getPricingByProductCode(productCode) {
    try {
      const raw = await apiRequest(`/product-pricing/${productCode}`);
      return raw ? normalizePricing(raw) : null;
    } catch {
      return null;
    }
  },

  async getPricingByCategory(categoryId) {
    const raw = await apiRequest(`/product-pricing?category=${categoryId}`);
    return Array.isArray(raw) ? raw.map(normalizePricing) : [];
  },

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
