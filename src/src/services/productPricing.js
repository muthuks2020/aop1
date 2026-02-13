/**
 * Product Pricing Service
 * Mock pricing data for unit cost calculations
 * 
 * BACKEND INTEGRATION:
 * - Set USE_MOCK = false and update BASE_URL when backend is ready
 * - Replace MockProductPricing with API call to GET /api/v1/product-pricing
 * - The API should return the same structure: { productId, productCode, unitCost, currency }
 * 
 * @author Appasamy Associates - Product Commitment PWA
 * @version 1.0.0
 */

// ==================== CONFIGURATION ====================
const USE_MOCK = true;
const BASE_URL = process.env.REACT_APP_API_URL || 'https://api.appasamy.com/v1';

// Simulate network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ==================== MOCK PRODUCT PRICING DATA ====================
// Unit costs in INR (₹)
// When integrating with real API, this entire array will be replaced by API response

const MockProductPricing = [
  // ==================== EQUIPMENT - Diagnostic ====================
  { productId: 1, productCode: 'EQ-DG-001', name: 'Slit Lamp SL-700', categoryId: 'equipment', subcategory: 'Diagnostic', unitCost: 285000, currency: 'INR' },
  { productId: 2, productCode: 'EQ-DG-002', name: 'Auto Refractometer AR-800', categoryId: 'equipment', subcategory: 'Diagnostic', unitCost: 420000, currency: 'INR' },
  { productId: 3, productCode: 'EQ-DG-003', name: 'Non-Contact Tonometer NCT-200', categoryId: 'equipment', subcategory: 'Diagnostic', unitCost: 525000, currency: 'INR' },
  { productId: 4, productCode: 'EQ-DG-004', name: 'Fundus Camera FC-500', categoryId: 'equipment', subcategory: 'Diagnostic', unitCost: 875000, currency: 'INR' },

  // ==================== EQUIPMENT - Surgical ====================
  { productId: 5, productCode: 'EQ-SG-001', name: 'Phaco Machine Centurion', categoryId: 'equipment', subcategory: 'Surgical', unitCost: 4500000, currency: 'INR' },
  { productId: 6, productCode: 'EQ-SG-002', name: 'Operating Microscope OM-900', categoryId: 'equipment', subcategory: 'Surgical', unitCost: 2800000, currency: 'INR' },
  { productId: 7, productCode: 'EQ-SG-003', name: 'Vitrectomy System VS-400', categoryId: 'equipment', subcategory: 'Surgical', unitCost: 6200000, currency: 'INR' },

  // ==================== IOL - Monofocal ====================
  { productId: 8, productCode: 'IOL-MF-001', name: 'Aurolens Standard', categoryId: 'iol', subcategory: 'Monofocal', unitCost: 350, currency: 'INR' },
  { productId: 9, productCode: 'IOL-MF-002', name: 'Aurolens Premium', categoryId: 'iol', subcategory: 'Monofocal', unitCost: 750, currency: 'INR' },
  { productId: 10, productCode: 'IOL-MF-003', name: 'Aurolens Aspheric', categoryId: 'iol', subcategory: 'Monofocal', unitCost: 1100, currency: 'INR' },

  // ==================== IOL - Multifocal ====================
  { productId: 11, productCode: 'IOL-MT-001', name: 'Aurovue Trifocal', categoryId: 'iol', subcategory: 'Multifocal', unitCost: 5500, currency: 'INR' },
  { productId: 12, productCode: 'IOL-MT-002', name: 'Aurovue EDOF', categoryId: 'iol', subcategory: 'Multifocal', unitCost: 4800, currency: 'INR' },

  // ==================== IOL - Toric ====================
  { productId: 13, productCode: 'IOL-TC-001', name: 'Aurotoric Standard', categoryId: 'iol', subcategory: 'Toric', unitCost: 2400, currency: 'INR' },
  { productId: 14, productCode: 'IOL-TC-002', name: 'Aurotoric Premium', categoryId: 'iol', subcategory: 'Toric', unitCost: 4200, currency: 'INR' },

  // ==================== OVD ====================
  { productId: 15, productCode: 'OVD-CO-001', name: 'Aurovisc 2.0%', categoryId: 'ovd', subcategory: 'Cohesive', unitCost: 280, currency: 'INR' },
  { productId: 16, productCode: 'OVD-CO-002', name: 'Aurovisc 2.3%', categoryId: 'ovd', subcategory: 'Cohesive', unitCost: 320, currency: 'INR' },
  { productId: 17, productCode: 'OVD-DS-001', name: 'Aurogel Dispersive', categoryId: 'ovd', subcategory: 'Dispersive', unitCost: 450, currency: 'INR' },
  { productId: 18, productCode: 'OVD-CB-001', name: 'Aurovisc Duo Pack', categoryId: 'ovd', subcategory: 'Combination', unitCost: 620, currency: 'INR' },

  // ==================== MIS (Revenue Only - no unit cost, uses revenue directly) ====================
  { productId: 19, productCode: 'MIS-001', name: 'MIS Revenue', categoryId: 'mis', subcategory: null, unitCost: 0, currency: 'INR', isRevenueOnly: true },

  // ==================== Others (Revenue Only) ====================
  { productId: 20, productCode: 'OTH-001', name: 'Others Revenue', categoryId: 'others', subcategory: null, unitCost: 0, currency: 'INR', isRevenueOnly: true }
];

// ==================== PRICING SERVICE ====================

export const ProductPricingService = {
  /**
   * Get all product pricing data
   * @returns {Promise<Array>} Array of product pricing objects
   */
  async getAllPricing() {
    if (USE_MOCK) {
      await delay(200);
      return [...MockProductPricing];
    }
    const response = await fetch(`${BASE_URL}/product-pricing`, {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.json();
  },

  /**
   * Get pricing for a specific product by ID
   * @param {number} productId 
   * @returns {Promise<Object|null>}
   */
  async getPricingByProductId(productId) {
    if (USE_MOCK) {
      await delay(100);
      return MockProductPricing.find(p => p.productId === productId) || null;
    }
    const response = await fetch(`${BASE_URL}/product-pricing/${productId}`);
    return response.json();
  },

  /**
   * Get pricing for products in a specific category
   * @param {string} categoryId 
   * @returns {Promise<Array>}
   */
  async getPricingByCategory(categoryId) {
    if (USE_MOCK) {
      await delay(150);
      return MockProductPricing.filter(p => p.categoryId === categoryId);
    }
    const response = await fetch(`${BASE_URL}/product-pricing?category=${categoryId}`);
    return response.json();
  },

  /**
   * Get a pricing lookup map { productId: unitCost }
   * Useful for quick lookups during calculations
   * @returns {Promise<Object>}
   */
  async getPricingMap() {
    const pricing = await this.getAllPricing();
    const map = {};
    pricing.forEach(p => {
      map[p.productId] = {
        unitCost: p.unitCost,
        currency: p.currency,
        isRevenueOnly: p.isRevenueOnly || false
      };
    });
    return map;
  }
};

export default ProductPricingService;
