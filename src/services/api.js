/**
 * API Service Layer
 * Monthly Target Entry with lowercase month keys
 */

const USE_MOCK = true;

// Helper to generate monthly data with lowercase keys
const generateMonthlyData = (lyYearlyQty, cyYearlyQty) => {
  const months = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];
  const monthlyData = {};
  
  const distributions = [0.07, 0.08, 0.09, 0.08, 0.09, 0.08, 0.09, 0.08, 0.09, 0.08, 0.09, 0.08];
  
  months.forEach((month, index) => {
    const lyQty = Math.round(lyYearlyQty * distributions[index]);
    const cyQty = Math.round(cyYearlyQty * distributions[index]);
    
    monthlyData[month] = {
      lyQty,
      cyQty
    };
  });
  
  return monthlyData;
};

// Mock Data
const MockData = {
  categories: [
    { id: 'equipment', name: 'Equipment', icon: 'fa-microscope', color: 'equipment' },
    { id: 'iol', name: 'IOL', icon: 'fa-eye', color: 'iol' },
    { id: 'ovd', name: 'OVD', icon: 'fa-tint', color: 'ovd' },
    { id: 'mis', name: 'MIS', icon: 'fa-syringe', color: 'mis' },
    { id: 'others', name: 'Others', icon: 'fa-boxes-stacked', color: 'others' }
  ],
  products: [
    // EQUIPMENT - Diagnostic
    { id: 1, categoryId: 'equipment', subcategory: 'Diagnostic', name: 'Slit Lamp SL-700', code: 'EQ-DG-001', lyQty: 96, cyQty: 120, monthlyTargets: generateMonthlyData(96, 120), status: 'approved' },
    { id: 2, categoryId: 'equipment', subcategory: 'Diagnostic', name: 'Auto Refractometer AR-600', code: 'EQ-DG-002', lyQty: 144, cyQty: 168, monthlyTargets: generateMonthlyData(144, 168), status: 'draft' },
    { id: 3, categoryId: 'equipment', subcategory: 'Diagnostic', name: 'Fundus Camera FC-500', code: 'EQ-DG-003', lyQty: 48, cyQty: 60, monthlyTargets: generateMonthlyData(48, 60), status: 'draft' },
    { id: 4, categoryId: 'equipment', subcategory: 'Diagnostic', name: 'Green Laser GL-200', code: 'EQ-DG-004', lyQty: 36, cyQty: 48, monthlyTargets: generateMonthlyData(36, 48), status: 'draft' },
    
    // EQUIPMENT - Surgical
    { id: 5, categoryId: 'equipment', subcategory: 'Surgical', name: 'Phaco Machine PM-3000', code: 'EQ-SG-001', lyQty: 24, cyQty: 30, monthlyTargets: generateMonthlyData(24, 30), status: 'approved' },
    { id: 6, categoryId: 'equipment', subcategory: 'Surgical', name: 'Operating Microscope OM-900', code: 'EQ-SG-002', lyQty: 36, cyQty: 48, monthlyTargets: generateMonthlyData(36, 48), status: 'draft' },
    { id: 7, categoryId: 'equipment', subcategory: 'Surgical', name: 'Vitrectomy System VS-400', code: 'EQ-SG-003', lyQty: 12, cyQty: 18, monthlyTargets: generateMonthlyData(12, 18), status: 'draft' },
    { id: 8, categoryId: 'equipment', subcategory: 'Surgical', name: 'Cryo Unit CU-100', code: 'EQ-SG-004', lyQty: 24, cyQty: 30, monthlyTargets: generateMonthlyData(24, 30), status: 'submitted' },
    
    // EQUIPMENT - OPD
    { id: 9, categoryId: 'equipment', subcategory: 'OPD', name: 'Tonometer TM-100', code: 'EQ-OP-001', lyQty: 180, cyQty: 216, monthlyTargets: generateMonthlyData(180, 216), status: 'approved' },
    { id: 10, categoryId: 'equipment', subcategory: 'OPD', name: 'Lensometer LM-50', code: 'EQ-OP-002', lyQty: 240, cyQty: 288, monthlyTargets: generateMonthlyData(240, 288), status: 'draft' },
    { id: 11, categoryId: 'equipment', subcategory: 'OPD', name: 'Keratometer KM-75', code: 'EQ-OP-003', lyQty: 120, cyQty: 144, monthlyTargets: generateMonthlyData(120, 144), status: 'draft' },
    { id: 12, categoryId: 'equipment', subcategory: 'OPD', name: 'Chart Projector CP-30', code: 'EQ-OP-004', lyQty: 300, cyQty: 360, monthlyTargets: generateMonthlyData(300, 360), status: 'draft' },
    
    // IOL - Hydrophilic
    { id: 13, categoryId: 'iol', subcategory: 'Hydrophilic', name: 'AquaVision HF-100', code: 'IOL-HY-001', lyQty: 2400, cyQty: 3000, monthlyTargets: generateMonthlyData(2400, 3000), status: 'approved' },
    { id: 14, categoryId: 'iol', subcategory: 'Hydrophilic', name: 'ClearSight HF-200', code: 'IOL-HY-002', lyQty: 1800, cyQty: 2160, monthlyTargets: generateMonthlyData(1800, 2160), status: 'draft' },
    { id: 15, categoryId: 'iol', subcategory: 'Hydrophilic', name: 'FlexiLens HF-300', code: 'IOL-HY-003', lyQty: 1200, cyQty: 1500, monthlyTargets: generateMonthlyData(1200, 1500), status: 'draft' },
    { id: 16, categoryId: 'iol', subcategory: 'Hydrophilic', name: 'PrimeLens HF-400', code: 'IOL-HY-004', lyQty: 960, cyQty: 1200, monthlyTargets: generateMonthlyData(960, 1200), status: 'submitted' },
    
    // IOL - Hydrophobic
    { id: 17, categoryId: 'iol', subcategory: 'Hydrophobic', name: 'DuraVision HP-100', code: 'IOL-HP-001', lyQty: 3600, cyQty: 4320, monthlyTargets: generateMonthlyData(3600, 4320), status: 'approved' },
    { id: 18, categoryId: 'iol', subcategory: 'Hydrophobic', name: 'OptiClear HP-200', code: 'IOL-HP-002', lyQty: 2400, cyQty: 3000, monthlyTargets: generateMonthlyData(2400, 3000), status: 'draft' },
    { id: 19, categoryId: 'iol', subcategory: 'Hydrophobic', name: 'UltraFlex HP-300', code: 'IOL-HP-003', lyQty: 1800, cyQty: 2160, monthlyTargets: generateMonthlyData(1800, 2160), status: 'draft' },
    { id: 20, categoryId: 'iol', subcategory: 'Hydrophobic', name: 'EliteLens HP-400', code: 'IOL-HP-004', lyQty: 1200, cyQty: 1500, monthlyTargets: generateMonthlyData(1200, 1500), status: 'draft' },
    
    // IOL - PMMA
    { id: 21, categoryId: 'iol', subcategory: 'PMMA', name: 'RigidClear PM-100', code: 'IOL-PM-001', lyQty: 600, cyQty: 720, monthlyTargets: generateMonthlyData(600, 720), status: 'approved' },
    { id: 22, categoryId: 'iol', subcategory: 'PMMA', name: 'ValueLens PM-200', code: 'IOL-PM-002', lyQty: 480, cyQty: 600, monthlyTargets: generateMonthlyData(480, 600), status: 'draft' },
    { id: 23, categoryId: 'iol', subcategory: 'PMMA', name: 'EcoSight PM-300', code: 'IOL-PM-003', lyQty: 360, cyQty: 420, monthlyTargets: generateMonthlyData(360, 420), status: 'draft' },
    { id: 24, categoryId: 'iol', subcategory: 'PMMA', name: 'BasicVision PM-400', code: 'IOL-PM-004', lyQty: 240, cyQty: 300, monthlyTargets: generateMonthlyData(240, 300), status: 'draft' },
    
    // OVD - Viscoelastic
    { id: 25, categoryId: 'ovd', subcategory: 'Viscoelastic', name: 'ViscoGel VE-100', code: 'OVD-VE-001', lyQty: 4800, cyQty: 5760, monthlyTargets: generateMonthlyData(4800, 5760), status: 'approved' },
    { id: 26, categoryId: 'ovd', subcategory: 'Viscoelastic', name: 'ClearGel VE-200', code: 'OVD-VE-002', lyQty: 3600, cyQty: 4320, monthlyTargets: generateMonthlyData(3600, 4320), status: 'draft' },
    { id: 27, categoryId: 'ovd', subcategory: 'Viscoelastic', name: 'FlexGel VE-300', code: 'OVD-VE-003', lyQty: 2400, cyQty: 3000, monthlyTargets: generateMonthlyData(2400, 3000), status: 'draft' },
    { id: 28, categoryId: 'ovd', subcategory: 'Viscoelastic', name: 'PrimeGel VE-400', code: 'OVD-VE-004', lyQty: 1800, cyQty: 2160, monthlyTargets: generateMonthlyData(1800, 2160), status: 'submitted' },
    
    // OVD - Dispersive
    { id: 29, categoryId: 'ovd', subcategory: 'Dispersive', name: 'DispersoGel DG-100', code: 'OVD-DG-001', lyQty: 2400, cyQty: 2880, monthlyTargets: generateMonthlyData(2400, 2880), status: 'approved' },
    { id: 30, categoryId: 'ovd', subcategory: 'Dispersive', name: 'SpreadGel DG-200', code: 'OVD-DG-002', lyQty: 1800, cyQty: 2160, monthlyTargets: generateMonthlyData(1800, 2160), status: 'draft' },
    { id: 31, categoryId: 'ovd', subcategory: 'Dispersive', name: 'SoftGel DG-300', code: 'OVD-DG-003', lyQty: 1200, cyQty: 1500, monthlyTargets: generateMonthlyData(1200, 1500), status: 'draft' },
    { id: 32, categoryId: 'ovd', subcategory: 'Dispersive', name: 'EaseGel DG-400', code: 'OVD-DG-004', lyQty: 960, cyQty: 1200, monthlyTargets: generateMonthlyData(960, 1200), status: 'draft' },
    
    // OVD - Cohesive
    { id: 33, categoryId: 'ovd', subcategory: 'Cohesive', name: 'CohesoGel CG-100', code: 'OVD-CG-001', lyQty: 3600, cyQty: 4320, monthlyTargets: generateMonthlyData(3600, 4320), status: 'approved' },
    { id: 34, categoryId: 'ovd', subcategory: 'Cohesive', name: 'BondGel CG-200', code: 'OVD-CG-002', lyQty: 2400, cyQty: 3000, monthlyTargets: generateMonthlyData(2400, 3000), status: 'draft' },
    { id: 35, categoryId: 'ovd', subcategory: 'Cohesive', name: 'StickGel CG-300', code: 'OVD-CG-003', lyQty: 1800, cyQty: 2160, monthlyTargets: generateMonthlyData(1800, 2160), status: 'draft' },
    { id: 36, categoryId: 'ovd', subcategory: 'Cohesive', name: 'FirmGel CG-400', code: 'OVD-CG-004', lyQty: 1200, cyQty: 1500, monthlyTargets: generateMonthlyData(1200, 1500), status: 'draft' },
    
    // MIS - Overall Revenue (Single entry for total)
    { id: 37, categoryId: 'mis', subcategory: 'Overall', name: 'MIS Products (Revenue)', code: 'MIS-ALL-001', lyQty: 500000, cyQty: 600000, monthlyTargets: generateMonthlyData(500000, 600000), status: 'draft', isRevenueOnly: true },
    
    // Others - Overall Revenue (Single entry for total)
    { id: 38, categoryId: 'others', subcategory: 'Overall', name: 'Other Products (Revenue)', code: 'OTH-ALL-001', lyQty: 300000, cyQty: 360000, monthlyTargets: generateMonthlyData(300000, 360000), status: 'draft', isRevenueOnly: true }
  ]
};

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const ApiService = {
  // Get all categories
  async getCategories() {
    if (USE_MOCK) {
      await delay(300);
      return [...MockData.categories];
    }
    const response = await fetch('/api/categories');
    return response.json();
  },

  // Get all products
  async getProducts() {
    if (USE_MOCK) {
      await delay(400);
      return MockData.products.map(p => ({ ...p }));
    }
    const response = await fetch('/api/products');
    return response.json();
  },

  // Get products by category
  async getProductsByCategory(categoryId) {
    if (USE_MOCK) {
      await delay(200);
      return MockData.products.filter(p => p.categoryId === categoryId);
    }
    const response = await fetch(`/api/products?category=${categoryId}`);
    return response.json();
  },

  // Save monthly target
  async saveMonthlyTarget(productId, month, data) {
    if (USE_MOCK) {
      await delay(200);
      const product = MockData.products.find(p => p.id === productId);
      if (product) {
        if (!product.monthlyTargets) product.monthlyTargets = {};
        product.monthlyTargets[month] = {
          ...product.monthlyTargets[month],
          ...data
        };
      }
      return { success: true, productId, month };
    }
    const response = await fetch(`/api/products/${productId}/targets/${month}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  // Save all drafts
  async saveAllDrafts(products) {
    if (USE_MOCK) {
      await delay(500);
      return { success: true, savedCount: products.length };
    }
    const response = await fetch('/api/products/drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products })
    });
    return response.json();
  },

  // Submit product for approval
  async submitProduct(productId) {
    if (USE_MOCK) {
      await delay(300);
      const product = MockData.products.find(p => p.id === productId);
      if (product) {
        product.status = 'submitted';
        product.submittedDate = new Date().toISOString();
      }
      return { success: true, productId };
    }
    const response = await fetch(`/api/products/${productId}/submit`, { method: 'POST' });
    return response.json();
  },

  // Submit multiple products
  async submitMultipleProducts(productIds) {
    if (USE_MOCK) {
      await delay(500);
      productIds.forEach(id => {
        const product = MockData.products.find(p => p.id === id);
        if (product) {
          product.status = 'submitted';
          product.submittedDate = new Date().toISOString();
        }
      });
      return { success: true, submittedCount: productIds.length };
    }
    const response = await fetch('/api/products/submit-multiple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productIds })
    });
    return response.json();
  },

  // Approve product (TBM)
  async approveProduct(productId, comments = '') {
    if (USE_MOCK) {
      await delay(300);
      const product = MockData.products.find(p => p.id === productId);
      if (product) {
        product.status = 'approved';
        product.approvedDate = new Date().toISOString();
        product.approvalComments = comments;
      }
      return { success: true, productId };
    }
    const response = await fetch(`/api/products/${productId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comments })
    });
    return response.json();
  },

  // Reject product (TBM)
  async rejectProduct(productId, reason) {
    if (USE_MOCK) {
      await delay(300);
      const product = MockData.products.find(p => p.id === productId);
      if (product) {
        product.status = 'rejected';
        product.rejectedDate = new Date().toISOString();
        product.rejectionReason = reason;
      }
      return { success: true, productId };
    }
    const response = await fetch(`/api/products/${productId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    return response.json();
  }
};

export default ApiService;
