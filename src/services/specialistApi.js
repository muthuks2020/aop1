
const USE_MOCK = process.env.REACT_APP_USE_MOCK !== 'false';
const BASE_URL = process.env.REACT_APP_API_URL || 'https://api.appasamy.com/v1';

export const SPECIALIST_API_CONFIG = {
  useMock: USE_MOCK,
  baseUrl: BASE_URL,
  endpoints: {
    // Specialist's own product targets
    getProducts: '/specialist/products',
    saveProduct: '/specialist/products/:id/save',
    submitProduct: '/specialist/products/:id/submit',
    submitMultiple: '/specialist/products/submit-multiple',
    saveAll: '/specialist/products/save-all',

    // Dashboard
    getDashboardSummary: '/specialist/dashboard-summary',
    getQuarterlySummary: '/specialist/quarterly-summary',
    getCategoryPerformance: '/specialist/category-performance',

    // Common
    getCategories: '/categories',
    getProductPricing: '/product-pricing',
    getFiscalYears: '/fiscal-years',
  },
  timeout: 30000,
  retryAttempts: 3
};



const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getAuthHeaders = () => {
  const token = localStorage.getItem('appasamy_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

const apiRequest = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: getAuthHeaders(),
    ...options
  });
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
};

// ==================== MOCK DATA ====================

const MockCategories = [
  { id: 'equipment', name: 'Equipment', icon: 'fa-microscope', color: 'equipment', isRevenueOnly: false },
  { id: 'iol', name: 'IOL', icon: 'fa-eye', color: 'iol', isRevenueOnly: false },
  { id: 'ovd', name: 'OVD', icon: 'fa-tint', color: 'ovd', isRevenueOnly: false },
  { id: 'pharma', name: 'Pharma', icon: 'fa-pills', color: 'pharma', isRevenueOnly: false },
  { id: 'consumables', name: 'Consumables/Accessories', icon: 'fa-box-open', color: 'consumables', isRevenueOnly: false },
  { id: 'mis', name: 'MIS', icon: 'fa-chart-line', color: 'mis', isRevenueOnly: true },
  { id: 'msi', name: 'MSI', icon: 'fa-tools', color: 'msi', isRevenueOnly: false },
  { id: 'others', name: 'Others', icon: 'fa-boxes', color: 'others', isRevenueOnly: true }
];

/**
 * Generate mock monthly targets with realistic variation
 */
const generateMonthlyTargets = (baseQty, baseRev) => {
  const months = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];
  const targets = {};
  months.forEach(m => {
    const variation = 0.7 + Math.random() * 0.6;
    const lyQty = Math.round(baseQty * variation);
    const lyRev = Math.round(baseRev * variation);
    targets[m] = {
      lyQty,
      cyQty: Math.round(lyQty * (1 + Math.random() * 0.3 - 0.05)),
      lyRev,
      cyRev: Math.round(lyRev * (1 + Math.random() * 0.3 - 0.05)),
      aopQty: Math.round(lyQty * 1.2)
    };
  });
  return targets;
};

/**
 * Mock product commitments for Specialist
 * Same structure as Sales Rep products
 */
let MockSpecialistProducts = [
  // Equipment
  { id: 'sp_eq1', productId: 'eq_dg_001', productCode: 'EQ-DG-001', productName: 'Slit Lamp SL-700', categoryId: 'equipment', subcategory: 'Diagnostic', unit: 'Units', unitCost: 285000, status: 'draft', monthlyTargets: generateMonthlyTargets(3, 285000) },
  { id: 'sp_eq2', productId: 'eq_dg_002', productCode: 'EQ-DG-002', productName: 'Auto Refractometer AR-800', categoryId: 'equipment', subcategory: 'Diagnostic', unit: 'Units', unitCost: 420000, status: 'draft', monthlyTargets: generateMonthlyTargets(2, 420000) },
  { id: 'sp_eq3', productId: 'eq_sg_001', productCode: 'EQ-SG-001', productName: 'Phaco Machine PM-3000', categoryId: 'equipment', subcategory: 'Surgical', unit: 'Units', unitCost: 1250000, status: 'draft', monthlyTargets: generateMonthlyTargets(1, 1250000) },
  // IOL
  { id: 'sp_iol1', productId: 'iol_001', productCode: 'IOL-MF-001', productName: 'Multifocal IOL Premium', categoryId: 'iol', unit: 'Units', unitCost: 18000, status: 'draft', monthlyTargets: generateMonthlyTargets(25, 18000) },
  { id: 'sp_iol2', productId: 'iol_002', productCode: 'IOL-MO-001', productName: 'Monofocal IOL Standard', categoryId: 'iol', unit: 'Units', unitCost: 4500, status: 'draft', monthlyTargets: generateMonthlyTargets(40, 4500) },
  // OVD
  { id: 'sp_ovd1', productId: 'ovd_001', productCode: 'OVD-001', productName: 'Viscoelastic Gel Pro', categoryId: 'ovd', unit: 'Units', unitCost: 1500, status: 'draft', monthlyTargets: generateMonthlyTargets(50, 1500) },
  // Pharma
  { id: 'sp_ph1', productId: 'pharma_001', productCode: 'PH-001', productName: 'Antibiotic Eye Drops', categoryId: 'pharma', unit: 'Units', unitCost: 250, status: 'draft', monthlyTargets: generateMonthlyTargets(200, 250) },
  { id: 'sp_ph2', productId: 'pharma_002', productCode: 'PH-002', productName: 'Anti-Inflammatory Drops', categoryId: 'pharma', unit: 'Units', unitCost: 320, status: 'draft', monthlyTargets: generateMonthlyTargets(150, 320) },
  // Consumables
  { id: 'sp_con1', productId: 'con_001', productCode: 'CON-001', productName: 'Surgical Blades Pack', categoryId: 'consumables', unit: 'Units', unitCost: 450, status: 'draft', monthlyTargets: generateMonthlyTargets(80, 450) },
  // MIS (revenue-only)
  { id: 'sp_mis1', productId: 'mis_001', productCode: 'MIS-001', productName: 'Service Contracts', categoryId: 'mis', unit: '₹', unitCost: 0, status: 'draft', monthlyTargets: generateMonthlyTargets(0, 500000) },
  // MSI
  { id: 'sp_msi1', productId: 'msi_001', productCode: 'MSI-001', productName: 'Installation Services', categoryId: 'msi', unit: 'Units', unitCost: 25000, status: 'draft', monthlyTargets: generateMonthlyTargets(3, 25000) },
  // Others (revenue-only)
  { id: 'sp_oth1', productId: 'others_001', productCode: 'OTH-001', productName: 'Accessories & Spares', categoryId: 'others', unit: '₹', unitCost: 0, status: 'draft', monthlyTargets: generateMonthlyTargets(0, 200000) },
];

// ==================== SPECIALIST API SERVICE ====================

export const SpecialistApiService = {

  // ========== CATEGORIES ==========

  /**
   * GET /categories
   * @returns {Promise<Array>} Categories accessible to specialist
   */
  async getCategories() {
    if (USE_MOCK) {
      await delay(300);
      return [...MockCategories];
    }
    return apiRequest(SPECIALIST_API_CONFIG.endpoints.getCategories);
  },

  // ========== PRODUCTS (Specialist's own targets) ==========

  /**
   * GET /specialist/products
   * Returns all product commitments for the logged-in specialist
   * @returns {Promise<Array>} Products with monthly targets
   */
  async getProducts() {
    if (USE_MOCK) {
      await delay(400);
      return MockSpecialistProducts.map(p => ({ ...p }));
    }
    return apiRequest(SPECIALIST_API_CONFIG.endpoints.getProducts);
  },

  /**
   * PUT /specialist/products/:id/save
   * Save draft monthly targets for a single product
   * @param {string} productId - Product commitment ID
   * @param {Object} monthlyTargets - Updated monthly targets JSONB
   * @returns {Promise<Object>} { success: true }
   */
  async saveProduct(productId, monthlyTargets) {
    if (USE_MOCK) {
      await delay(300);
      const idx = MockSpecialistProducts.findIndex(p => p.id === productId);
      if (idx !== -1) {
        MockSpecialistProducts[idx].monthlyTargets = { ...monthlyTargets };
        MockSpecialistProducts[idx].status = 'draft';
      }
      return { success: true };
    }
    return apiRequest(`/specialist/products/${productId}/save`, {
      method: 'PUT',
      body: JSON.stringify({ monthlyTargets })
    });
  },

  /**
   * POST /specialist/products/:id/submit
   * Submit a single product target to ABM for review
   * @param {string} productId - Product commitment ID
   * @returns {Promise<Object>} { success: true }
   */
  async submitProduct(productId) {
    if (USE_MOCK) {
      await delay(400);
      const idx = MockSpecialistProducts.findIndex(p => p.id === productId);
      if (idx !== -1) MockSpecialistProducts[idx].status = 'submitted';
      return { success: true };
    }
    return apiRequest(`/specialist/products/${productId}/submit`, { method: 'POST' });
  },

  /**
   * POST /specialist/products/submit-multiple
   * Batch submit multiple product targets to ABM
   * @param {Array<string>} productIds - Array of product commitment IDs
   * @returns {Promise<Object>} { success: true, submittedCount: N }
   */
  async submitMultipleProducts(productIds) {
    if (USE_MOCK) {
      await delay(500);
      productIds.forEach(id => {
        const idx = MockSpecialistProducts.findIndex(p => p.id === id);
        if (idx !== -1) MockSpecialistProducts[idx].status = 'submitted';
      });
      return { success: true, submittedCount: productIds.length };
    }
    return apiRequest(SPECIALIST_API_CONFIG.endpoints.submitMultiple, {
      method: 'POST',
      body: JSON.stringify({ productIds })
    });
  },

  /**
   * POST /specialist/products/save-all
   * Bulk save all draft products
   * @param {Array} products - All products with current data
   * @returns {Promise<Object>} { success: true, savedCount: N }
   */
  async saveAllDrafts(products) {
    if (USE_MOCK) {
      await delay(400);
      return { success: true, savedCount: products.length };
    }
    return apiRequest(SPECIALIST_API_CONFIG.endpoints.saveAll, {
      method: 'POST',
      body: JSON.stringify({ products })
    });
  },

  // ========== DASHBOARD ==========

  /**
   * GET /specialist/dashboard-summary
   * Aggregated LY/CY/AOP totals from product_commitments
   * @returns {Promise<Object>} { totalLY, totalCY, totalAOP, growth, categoryBreakdown }
   */
  async getDashboardSummary() {
    if (USE_MOCK) {
      await delay(300);
      const months = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];
      let totalLY = 0, totalCY = 0;
      MockSpecialistProducts.forEach(p => {
        months.forEach(m => {
          totalLY += p.monthlyTargets?.[m]?.lyRev || 0;
          totalCY += p.monthlyTargets?.[m]?.cyRev || 0;
        });
      });
      return {
        totalLY, totalCY,
        growth: totalLY > 0 ? ((totalCY - totalLY) / totalLY * 100).toFixed(1) : 0,
        totalProducts: MockSpecialistProducts.length,
        draftCount: MockSpecialistProducts.filter(p => p.status === 'draft').length,
        submittedCount: MockSpecialistProducts.filter(p => p.status === 'submitted').length,
        approvedCount: MockSpecialistProducts.filter(p => p.status === 'approved').length,
      };
    }
    return apiRequest(SPECIALIST_API_CONFIG.endpoints.getDashboardSummary);
  },

  /**
   * GET /specialist/quarterly-summary?fy=FY26_27
   * Pre-computed quarterly breakdowns per category
   * @param {string} fiscalYear - Fiscal year code
   * @returns {Promise<Object>} Quarterly data
   */
  async getQuarterlySummary(fiscalYear) {
    if (USE_MOCK) {
      await delay(300);
      return { fiscalYear, categories: MockCategories };
    }
    return apiRequest(`${SPECIALIST_API_CONFIG.endpoints.getQuarterlySummary}?fy=${fiscalYear}`);
  },

  /**
   * GET /specialist/category-performance
   * Per-category metrics with growth & contribution %
   * @returns {Promise<Array>} Category performance data
   */
  async getCategoryPerformance() {
    if (USE_MOCK) {
      await delay(300);
      return MockCategories.map(cat => ({
        ...cat,
        productCount: MockSpecialistProducts.filter(p => p.categoryId === cat.id).length,
      }));
    }
    return apiRequest(SPECIALIST_API_CONFIG.endpoints.getCategoryPerformance);
  },
};

export default SpecialistApiService;
