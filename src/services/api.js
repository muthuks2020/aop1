/**
 * API Service for Product Commitment PWA
 * Contains mock data and API methods
 */

// Configuration
const USE_MOCK = true;
const BASE_URL = 'https://your-api-server.com/api/v1';

// Simulate network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Categories Data
const MockCategories = [
  { id: 'equipment', name: 'Equipment', icon: 'fa-microscope', color: 'equipment', isRevenueOnly: false },
  { id: 'iol', name: 'IOL', icon: 'fa-eye', color: 'iol', isRevenueOnly: false },
  { id: 'ovd', name: 'OVD', icon: 'fa-tint', color: 'ovd', isRevenueOnly: false },
  { id: 'mis', name: 'MIS', icon: 'fa-tools', color: 'mis', isRevenueOnly: true },
  { id: 'others', name: 'Others', icon: 'fa-ellipsis-h', color: 'others', isRevenueOnly: true }
];

// Generate monthly targets with realistic data
const generateMonthlyTargets = (baseQty, baseRev, variance = 0.2) => {
  const months = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];
  const targets = {};
  
  months.forEach((month, index) => {
    const seasonalFactor = 1 + Math.sin((index / 12) * Math.PI * 2) * 0.15;
    const randomVariance = 1 + (Math.random() - 0.5) * variance;
    
    const lyQty = Math.round(baseQty * seasonalFactor * randomVariance);
    const cyQty = Math.round(lyQty * (1 + Math.random() * 0.3));
    const lyRev = Math.round(baseRev * seasonalFactor * randomVariance);
    const cyRev = Math.round(lyRev * (1 + Math.random() * 0.3));
    
    targets[month] = { lyQty, cyQty, lyRev, cyRev };
  });
  
  return targets;
};

// Mock Products Data
const MockProducts = [
  // Equipment - Diagnostic
  { id: 1, categoryId: 'equipment', subcategory: 'Diagnostic', name: 'Slit Lamp SL-700', code: 'EQ-DG-001', status: 'draft', monthlyTargets: generateMonthlyTargets(8, 80000) },
  { id: 2, categoryId: 'equipment', subcategory: 'Diagnostic', name: 'Auto Refractometer AR-800', code: 'EQ-DG-002', status: 'submitted', monthlyTargets: generateMonthlyTargets(6, 120000) },
  { id: 3, categoryId: 'equipment', subcategory: 'Diagnostic', name: 'Non-Contact Tonometer NCT-200', code: 'EQ-DG-003', status: 'approved', monthlyTargets: generateMonthlyTargets(5, 150000) },
  { id: 4, categoryId: 'equipment', subcategory: 'Diagnostic', name: 'Fundus Camera FC-500', code: 'EQ-DG-004', status: 'draft', monthlyTargets: generateMonthlyTargets(3, 250000) },
  
  // Equipment - Surgical
  { id: 5, categoryId: 'equipment', subcategory: 'Surgical', name: 'Phaco Machine Centurion', code: 'EQ-SG-001', status: 'draft', monthlyTargets: generateMonthlyTargets(2, 1500000) },
  { id: 6, categoryId: 'equipment', subcategory: 'Surgical', name: 'Operating Microscope OM-900', code: 'EQ-SG-002', status: 'submitted', monthlyTargets: generateMonthlyTargets(3, 800000) },
  { id: 7, categoryId: 'equipment', subcategory: 'Surgical', name: 'Vitrectomy System VS-400', code: 'EQ-SG-003', status: 'approved', monthlyTargets: generateMonthlyTargets(1, 2000000) },
  
  // IOL - Monofocal
  { id: 8, categoryId: 'iol', subcategory: 'Monofocal', name: 'Aurolens Standard', code: 'IOL-MF-001', status: 'draft', monthlyTargets: generateMonthlyTargets(150, 45000) },
  { id: 9, categoryId: 'iol', subcategory: 'Monofocal', name: 'Aurolens Premium', code: 'IOL-MF-002', status: 'approved', monthlyTargets: generateMonthlyTargets(100, 75000) },
  { id: 10, categoryId: 'iol', subcategory: 'Monofocal', name: 'Aurolens Aspheric', code: 'IOL-MF-003', status: 'submitted', monthlyTargets: generateMonthlyTargets(80, 90000) },
  
  // IOL - Multifocal
  { id: 11, categoryId: 'iol', subcategory: 'Multifocal', name: 'Aurovue Trifocal', code: 'IOL-MT-001', status: 'draft', monthlyTargets: generateMonthlyTargets(40, 200000) },
  { id: 12, categoryId: 'iol', subcategory: 'Multifocal', name: 'Aurovue EDOF', code: 'IOL-MT-002', status: 'rejected', monthlyTargets: generateMonthlyTargets(30, 180000) },
  
  // IOL - Toric
  { id: 13, categoryId: 'iol', subcategory: 'Toric', name: 'Aurotoric Standard', code: 'IOL-TC-001', status: 'approved', monthlyTargets: generateMonthlyTargets(50, 120000) },
  { id: 14, categoryId: 'iol', subcategory: 'Toric', name: 'Aurotoric Premium', code: 'IOL-TC-002', status: 'draft', monthlyTargets: generateMonthlyTargets(35, 150000) },
  
  // OVD
  { id: 15, categoryId: 'ovd', subcategory: 'Cohesive', name: 'Aurovisc 2.0%', code: 'OVD-CO-001', status: 'draft', monthlyTargets: generateMonthlyTargets(200, 50000) },
  { id: 16, categoryId: 'ovd', subcategory: 'Cohesive', name: 'Aurovisc 2.3%', code: 'OVD-CO-002', status: 'submitted', monthlyTargets: generateMonthlyTargets(150, 60000) },
  { id: 17, categoryId: 'ovd', subcategory: 'Dispersive', name: 'Aurogel Dispersive', code: 'OVD-DS-001', status: 'approved', monthlyTargets: generateMonthlyTargets(120, 55000) },
  { id: 18, categoryId: 'ovd', subcategory: 'Combination', name: 'Aurovisc Duo Pack', code: 'OVD-CB-001', status: 'draft', monthlyTargets: generateMonthlyTargets(80, 85000) },
  
  // MIS (Revenue Only)
  { id: 19, categoryId: 'mis', subcategory: null, name: 'MIS Revenue', code: 'MIS-001', status: 'draft', isRevenueOnly: true, monthlyTargets: generateMonthlyTargets(0, 500000) },
  
  // Others (Revenue Only)
  { id: 20, categoryId: 'others', subcategory: null, name: 'Others Revenue', code: 'OTH-001', status: 'draft', isRevenueOnly: true, monthlyTargets: generateMonthlyTargets(0, 200000) }
];

// API Service Methods
export const ApiService = {
  async getCategories() {
    if (USE_MOCK) {
      await delay(300);
      return [...MockCategories];
    }
    const response = await fetch(`${BASE_URL}/categories`);
    return response.json();
  },

  async getProducts() {
    if (USE_MOCK) {
      await delay(400);
      return MockProducts.map(p => ({ ...p }));
    }
    const response = await fetch(`${BASE_URL}/products`);
    return response.json();
  },

  async getProductsByCategory(categoryId) {
    if (USE_MOCK) {
      await delay(300);
      return MockProducts.filter(p => p.categoryId === categoryId).map(p => ({ ...p }));
    }
    const response = await fetch(`${BASE_URL}/products?category=${categoryId}`);
    return response.json();
  },

  async updateMonthlyTarget(productId, month, data) {
    if (USE_MOCK) {
      await delay(200);
      const product = MockProducts.find(p => p.id === productId);
      if (product && product.monthlyTargets) {
        product.monthlyTargets[month] = { ...product.monthlyTargets[month], ...data };
      }
      return { success: true, productId, month, data };
    }
    const response = await fetch(`${BASE_URL}/products/${productId}/targets/${month}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async saveAllDrafts(products) {
    if (USE_MOCK) {
      await delay(500);
      return { success: true, savedCount: products.filter(p => p.status === 'draft').length };
    }
    const response = await fetch(`${BASE_URL}/products/drafts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products })
    });
    return response.json();
  },

  async submitProduct(productId) {
    if (USE_MOCK) {
      await delay(300);
      const product = MockProducts.find(p => p.id === productId);
      if (product) {
        product.status = 'submitted';
        product.submittedDate = new Date().toISOString();
      }
      return { success: true, productId, status: 'submitted' };
    }
    const response = await fetch(`${BASE_URL}/products/${productId}/submit`, { method: 'POST' });
    return response.json();
  },

  async submitMultipleProducts(productIds) {
    if (USE_MOCK) {
      await delay(500);
      productIds.forEach(id => {
        const product = MockProducts.find(p => p.id === id);
        if (product) {
          product.status = 'submitted';
          product.submittedDate = new Date().toISOString();
        }
      });
      return { success: true, submittedCount: productIds.length };
    }
    const response = await fetch(`${BASE_URL}/products/submit-multiple`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productIds })
    });
    return response.json();
  },

  async approveProduct(productId, comments = '') {
    if (USE_MOCK) {
      await delay(300);
      const product = MockProducts.find(p => p.id === productId);
      if (product) {
        product.status = 'approved';
        product.approvedDate = new Date().toISOString();
      }
      return { success: true, productId, status: 'approved' };
    }
    const response = await fetch(`${BASE_URL}/products/${productId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comments })
    });
    return response.json();
  },

  async rejectProduct(productId, reason = '') {
    if (USE_MOCK) {
      await delay(300);
      const product = MockProducts.find(p => p.id === productId);
      if (product) {
        product.status = 'rejected';
        product.rejectedDate = new Date().toISOString();
        product.rejectionReason = reason;
      }
      return { success: true, productId, status: 'rejected' };
    }
    const response = await fetch(`${BASE_URL}/products/${productId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    return response.json();
  }
};

export default ApiService;
