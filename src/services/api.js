/**
 * API Service Layer
 * Handles all API calls with mock data support
 * Updated: Monthly Target Entry with Quarter/Yearly aggregation
 */

const BASE_URL = '/api/v1';
const USE_MOCK = true;

// Helper to generate monthly data for a product
const generateMonthlyData = (lyYearlyQty, cyYearlyQty, lyYearlyRev, cyYearlyRev) => {
  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  const monthlyData = {};
  
  // Distribute yearly quantities across months with some variation
  const distributions = [0.07, 0.08, 0.09, 0.08, 0.09, 0.08, 0.09, 0.08, 0.09, 0.08, 0.09, 0.08];
  
  months.forEach((month, index) => {
    const lyQty = Math.round(lyYearlyQty * distributions[index]);
    const cyQty = Math.round(cyYearlyQty * distributions[index]);
    const lyRev = Math.round(lyYearlyRev * distributions[index]);
    const cyRev = Math.round(cyYearlyRev * distributions[index]);
    
    monthlyData[month] = {
      lyQty,
      cyQty,
      lyRev,
      cyRev
    };
  });
  
  return monthlyData;
};

// Mock Data
const MockData = {
  categories: [
    { 
      id: 'equipment', 
      name: 'Equipment', 
      icon: 'fa-microscope', 
      color: 'equipment',
      subcategories: ['Diagnostic & Laser', 'Surgical Products', 'OPD', 'Tables, Stand & Accessories', 'Vision Testing Equipment', 'Accessories', 'New Product-EQ']
    },
    { 
      id: 'iol', 
      name: 'IOL', 
      icon: 'fa-eye', 
      color: 'iol',
      subcategories: ['Hydrophilic', 'Hydrophobic', 'PMMA', 'New Product-IOL']
    },
    { 
      id: 'ovd', 
      name: 'OVD', 
      icon: 'fa-tint', 
      color: 'ovd',
      subcategories: ['Viscoelastic', 'Dispersive', 'Cohesive']
    },
    { 
      id: 'mis', 
      name: 'MIS', 
      icon: 'fa-syringe', 
      color: 'mis',
      subcategories: ['Surgical Instruments', 'Consumables']
    },
    { 
      id: 'others', 
      name: 'Others Products', 
      icon: 'fa-boxes-stacked', 
      color: 'others',
      subcategories: ['Accessories', 'New Products']
    }
  ],
  products: [
    // EQUIPMENT - Diagnostic & Laser
    { 
      id: 1, 
      categoryId: 'equipment', 
      subcategory: 'Diagnostic & Laser', 
      name: 'Slit Lamp SL-700', 
      code: 'EQ-DL-001', 
      unitPrice: 125000,
      lyQty: 96, cyQty: 120, 
      lyRev: 12000000, cyRev: 15000000,
      monthlyTargets: generateMonthlyData(96, 120, 12000000, 15000000),
      status: 'approved', 
      approvedDate: '2025-01-15' 
    },
    { 
      id: 2, 
      categoryId: 'equipment', 
      subcategory: 'Diagnostic & Laser', 
      name: 'Auto Refractometer AR-600', 
      code: 'EQ-DL-002', 
      unitPrice: 85000,
      lyQty: 144, cyQty: 168, 
      lyRev: 12240000, cyRev: 14280000,
      monthlyTargets: generateMonthlyData(144, 168, 12240000, 14280000),
      status: 'submitted', 
      submittedDate: '2025-01-18' 
    },
    { 
      id: 3, 
      categoryId: 'equipment', 
      subcategory: 'Diagnostic & Laser', 
      name: 'Fundus Camera FC-500', 
      code: 'EQ-DL-003', 
      unitPrice: 450000,
      lyQty: 24, cyQty: 36, 
      lyRev: 10800000, cyRev: 16200000,
      monthlyTargets: generateMonthlyData(24, 36, 10800000, 16200000),
      status: 'draft' 
    },
    { 
      id: 4, 
      categoryId: 'equipment', 
      subcategory: 'Diagnostic & Laser', 
      name: 'Green Laser GL-200', 
      code: 'EQ-DL-004', 
      unitPrice: 350000,
      lyQty: 36, cyQty: 48, 
      lyRev: 12600000, cyRev: 16800000,
      monthlyTargets: generateMonthlyData(36, 48, 12600000, 16800000),
      status: 'draft' 
    },
    
    // EQUIPMENT - Surgical Products
    { 
      id: 5, 
      categoryId: 'equipment', 
      subcategory: 'Surgical Products', 
      name: 'Phaco Machine PM-3000', 
      code: 'EQ-SP-001', 
      unitPrice: 1500000,
      lyQty: 24, cyQty: 36, 
      lyRev: 36000000, cyRev: 54000000,
      monthlyTargets: generateMonthlyData(24, 36, 36000000, 54000000),
      status: 'approved', 
      approvedDate: '2025-01-10' 
    },
    { 
      id: 6, 
      categoryId: 'equipment', 
      subcategory: 'Surgical Products', 
      name: 'Operating Microscope OM-900', 
      code: 'EQ-SP-002', 
      unitPrice: 800000,
      lyQty: 36, cyQty: 48, 
      lyRev: 28800000, cyRev: 38400000,
      monthlyTargets: generateMonthlyData(36, 48, 28800000, 38400000),
      status: 'submitted', 
      submittedDate: '2025-01-20' 
    },
    { 
      id: 7, 
      categoryId: 'equipment', 
      subcategory: 'Surgical Products', 
      name: 'Vitrectomy System VS-400', 
      code: 'EQ-SP-003', 
      unitPrice: 1200000,
      lyQty: 12, cyQty: 18, 
      lyRev: 14400000, cyRev: 21600000,
      monthlyTargets: generateMonthlyData(12, 18, 14400000, 21600000),
      status: 'draft' 
    },
    
    // EQUIPMENT - OPD
    { 
      id: 8, 
      categoryId: 'equipment', 
      subcategory: 'OPD', 
      name: 'Tonometer TM-100', 
      code: 'EQ-OP-001', 
      unitPrice: 45000,
      lyQty: 180, cyQty: 216, 
      lyRev: 8100000, cyRev: 9720000,
      monthlyTargets: generateMonthlyData(180, 216, 8100000, 9720000),
      status: 'approved', 
      approvedDate: '2025-01-12' 
    },
    { 
      id: 9, 
      categoryId: 'equipment', 
      subcategory: 'OPD', 
      name: 'Lensometer LM-50', 
      code: 'EQ-OP-002', 
      unitPrice: 35000,
      lyQty: 240, cyQty: 288, 
      lyRev: 8400000, cyRev: 10080000,
      monthlyTargets: generateMonthlyData(240, 288, 8400000, 10080000),
      status: 'draft' 
    },
    { 
      id: 10, 
      categoryId: 'equipment', 
      subcategory: 'OPD', 
      name: 'Keratometer KM-75', 
      code: 'EQ-OP-003', 
      unitPrice: 55000,
      lyQty: 120, cyQty: 144, 
      lyRev: 6600000, cyRev: 7920000,
      monthlyTargets: generateMonthlyData(120, 144, 6600000, 7920000),
      status: 'submitted', 
      submittedDate: '2025-01-22' 
    },
    
    // EQUIPMENT - Tables, Stand & Accessories
    { 
      id: 11, 
      categoryId: 'equipment', 
      subcategory: 'Tables, Stand & Accessories', 
      name: 'Instrument Table SS', 
      code: 'EQ-TA-001', 
      unitPrice: 25000,
      lyQty: 240, cyQty: 300, 
      lyRev: 6000000, cyRev: 7500000,
      monthlyTargets: generateMonthlyData(240, 300, 6000000, 7500000),
      status: 'approved', 
      approvedDate: '2025-01-14' 
    },
    { 
      id: 12, 
      categoryId: 'equipment', 
      subcategory: 'Tables, Stand & Accessories', 
      name: 'Mayo Stand Trolley', 
      code: 'EQ-TA-002', 
      unitPrice: 18000,
      lyQty: 180, cyQty: 216, 
      lyRev: 3240000, cyRev: 3888000,
      monthlyTargets: generateMonthlyData(180, 216, 3240000, 3888000),
      status: 'draft' 
    },
    
    // IOL - Hydrophilic
    { 
      id: 18, 
      categoryId: 'iol', 
      subcategory: 'Hydrophilic', 
      name: 'APPACRYL Monofocal', 
      code: 'IOL-HY-001', 
      unitPrice: 1500,
      lyQty: 12000, cyQty: 14400, 
      lyRev: 18000000, cyRev: 21600000,
      monthlyTargets: generateMonthlyData(12000, 14400, 18000000, 21600000),
      status: 'approved', 
      approvedDate: '2025-01-08' 
    },
    { 
      id: 19, 
      categoryId: 'iol', 
      subcategory: 'Hydrophilic', 
      name: 'APPACRYL Toric', 
      code: 'IOL-HY-002', 
      unitPrice: 4500,
      lyQty: 4800, cyQty: 6000, 
      lyRev: 21600000, cyRev: 27000000,
      monthlyTargets: generateMonthlyData(4800, 6000, 21600000, 27000000),
      status: 'submitted', 
      submittedDate: '2025-01-17' 
    },
    { 
      id: 20, 
      categoryId: 'iol', 
      subcategory: 'Hydrophilic', 
      name: 'APPACRYL Multifocal', 
      code: 'IOL-HY-003', 
      unitPrice: 8500,
      lyQty: 2400, cyQty: 3000, 
      lyRev: 20400000, cyRev: 25500000,
      monthlyTargets: generateMonthlyData(2400, 3000, 20400000, 25500000),
      status: 'draft' 
    },
    
    // IOL - Hydrophobic
    { 
      id: 21, 
      categoryId: 'iol', 
      subcategory: 'Hydrophobic', 
      name: 'APPAFLEX Standard', 
      code: 'IOL-HO-001', 
      unitPrice: 2500,
      lyQty: 6000, cyQty: 7200, 
      lyRev: 15000000, cyRev: 18000000,
      monthlyTargets: generateMonthlyData(6000, 7200, 15000000, 18000000),
      status: 'approved', 
      approvedDate: '2025-01-09' 
    },
    { 
      id: 22, 
      categoryId: 'iol', 
      subcategory: 'Hydrophobic', 
      name: 'APPAFLEX Premium', 
      code: 'IOL-HO-002', 
      unitPrice: 6500,
      lyQty: 3600, cyQty: 4320, 
      lyRev: 23400000, cyRev: 28080000,
      monthlyTargets: generateMonthlyData(3600, 4320, 23400000, 28080000),
      status: 'draft' 
    },
    { 
      id: 23, 
      categoryId: 'iol', 
      subcategory: 'Hydrophobic', 
      name: 'APPAFLEX EDOF', 
      code: 'IOL-HO-003', 
      unitPrice: 12000,
      lyQty: 1200, cyQty: 1800, 
      lyRev: 14400000, cyRev: 21600000,
      monthlyTargets: generateMonthlyData(1200, 1800, 14400000, 21600000),
      status: 'submitted', 
      submittedDate: '2025-01-21' 
    },
    
    // IOL - PMMA
    { 
      id: 24, 
      categoryId: 'iol', 
      subcategory: 'PMMA', 
      name: 'APPARIGID Standard', 
      code: 'IOL-PM-001', 
      unitPrice: 800,
      lyQty: 18000, cyQty: 15000, 
      lyRev: 14400000, cyRev: 12000000,
      monthlyTargets: generateMonthlyData(18000, 15000, 14400000, 12000000),
      status: 'approved', 
      approvedDate: '2025-01-16' 
    },
    
    // OVD
    { 
      id: 31, 
      categoryId: 'ovd', 
      subcategory: 'Viscoelastic', 
      name: 'APPAVISCO 1.4% HA', 
      code: 'OVD-VE-001', 
      unitPrice: 450,
      lyQty: 24000, cyQty: 28800, 
      lyRev: 10800000, cyRev: 12960000,
      monthlyTargets: generateMonthlyData(24000, 28800, 10800000, 12960000),
      status: 'approved', 
      approvedDate: '2025-01-07' 
    },
    { 
      id: 32, 
      categoryId: 'ovd', 
      subcategory: 'Dispersive', 
      name: 'APPADISPER Chondroitin', 
      code: 'OVD-DP-001', 
      unitPrice: 550,
      lyQty: 5400, cyQty: 6360, 
      lyRev: 2970000, cyRev: 3498000,
      monthlyTargets: generateMonthlyData(5400, 6360, 2970000, 3498000),
      status: 'draft' 
    },
    { 
      id: 33, 
      categoryId: 'ovd', 
      subcategory: 'Cohesive', 
      name: 'APPACOHES Sodium HA', 
      code: 'OVD-CH-001', 
      unitPrice: 480,
      lyQty: 4560, cyQty: 5400, 
      lyRev: 2188800, cyRev: 2592000,
      monthlyTargets: generateMonthlyData(4560, 5400, 2188800, 2592000),
      status: 'approved', 
      approvedDate: '2025-01-13' 
    },
    
    // MIS
    { 
      id: 34, 
      categoryId: 'mis', 
      subcategory: 'Surgical Instruments', 
      name: 'Forceps Set Micro', 
      code: 'MIS-SI-001', 
      unitPrice: 2500,
      lyQty: 1800, cyQty: 2160, 
      lyRev: 4500000, cyRev: 5400000,
      monthlyTargets: generateMonthlyData(1800, 2160, 4500000, 5400000),
      status: 'approved', 
      approvedDate: '2025-01-11' 
    },
    { 
      id: 35, 
      categoryId: 'mis', 
      subcategory: 'Surgical Instruments', 
      name: 'Scissors Curved', 
      code: 'MIS-SI-002', 
      unitPrice: 1800,
      lyQty: 2400, cyQty: 2880, 
      lyRev: 4320000, cyRev: 5184000,
      monthlyTargets: generateMonthlyData(2400, 2880, 4320000, 5184000),
      status: 'submitted', 
      submittedDate: '2025-01-20' 
    },
    { 
      id: 36, 
      categoryId: 'mis', 
      subcategory: 'Surgical Instruments', 
      name: 'Speculum Wire', 
      code: 'MIS-SI-003', 
      unitPrice: 1200,
      lyQty: 2160, cyQty: 2520, 
      lyRev: 2592000, cyRev: 3024000,
      monthlyTargets: generateMonthlyData(2160, 2520, 2592000, 3024000),
      status: 'draft' 
    },
    { 
      id: 37, 
      categoryId: 'mis', 
      subcategory: 'Consumables', 
      name: 'Surgical Blades 15°', 
      code: 'MIS-CO-001', 
      unitPrice: 150,
      lyQty: 30000, cyQty: 34800, 
      lyRev: 4500000, cyRev: 5220000,
      monthlyTargets: generateMonthlyData(30000, 34800, 4500000, 5220000),
      status: 'approved', 
      approvedDate: '2025-01-14' 
    },
    { 
      id: 38, 
      categoryId: 'mis', 
      subcategory: 'Consumables', 
      name: 'Sutures Nylon 10-0', 
      code: 'MIS-CO-002', 
      unitPrice: 350,
      lyQty: 21600, cyQty: 25200, 
      lyRev: 7560000, cyRev: 8820000,
      monthlyTargets: generateMonthlyData(21600, 25200, 7560000, 8820000),
      status: 'draft' 
    },
    { 
      id: 39, 
      categoryId: 'mis', 
      subcategory: 'Consumables', 
      name: 'Cannulas Irrigation', 
      code: 'MIS-CO-003', 
      unitPrice: 250,
      lyQty: 18000, cyQty: 21000, 
      lyRev: 4500000, cyRev: 5250000,
      monthlyTargets: generateMonthlyData(18000, 21000, 4500000, 5250000),
      status: 'submitted', 
      submittedDate: '2025-01-23' 
    },
    
    // OTHERS
    { 
      id: 40, 
      categoryId: 'others', 
      subcategory: 'Accessories', 
      name: 'Eye Shield Plastic', 
      code: 'OTH-AC-001', 
      unitPrice: 50,
      lyQty: 36000, cyQty: 42000, 
      lyRev: 1800000, cyRev: 2100000,
      monthlyTargets: generateMonthlyData(36000, 42000, 1800000, 2100000),
      status: 'approved', 
      approvedDate: '2025-01-10' 
    },
    { 
      id: 41, 
      categoryId: 'others', 
      subcategory: 'Accessories', 
      name: 'Tape Patches Sterile', 
      code: 'OTH-AC-002', 
      unitPrice: 80,
      lyQty: 24000, cyQty: 28800, 
      lyRev: 1920000, cyRev: 2304000,
      monthlyTargets: generateMonthlyData(24000, 28800, 1920000, 2304000),
      status: 'draft' 
    },
    { 
      id: 42, 
      categoryId: 'others', 
      subcategory: 'New Products', 
      name: 'Smart Eye Drops Dispenser', 
      code: 'OTH-NP-001', 
      unitPrice: 2500,
      lyQty: 0, cyQty: 1200, 
      lyRev: 0, cyRev: 3000000,
      monthlyTargets: generateMonthlyData(0, 1200, 0, 3000000),
      status: 'draft' 
    }
  ]
};

export const ApiService = {
  async getCategories() {
    if (USE_MOCK) return MockData.categories;
    const response = await fetch(`${BASE_URL}/categories`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
  },

  async getProducts(categoryId = null) {
    if (USE_MOCK) {
      return categoryId 
        ? MockData.products.filter(p => p.categoryId === categoryId)
        : MockData.products;
    }
    const url = categoryId 
      ? `${BASE_URL}/products?category=${categoryId}`
      : `${BASE_URL}/products`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch products');
    return response.json();
  },

  async saveProductDraft(productId, data) {
    if (USE_MOCK) {
      console.log('Saving draft:', productId, data);
      return { success: true };
    }
    const response = await fetch(`${BASE_URL}/products/${productId}/draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to save draft');
    return response.json();
  },

  async saveMonthlyTarget(productId, month, data) {
    if (USE_MOCK) {
      console.log('Saving monthly target:', productId, month, data);
      await new Promise(resolve => setTimeout(resolve, 300));
      return { success: true };
    }
    const response = await fetch(`${BASE_URL}/products/${productId}/monthly/${month}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to save monthly target');
    return response.json();
  },

  async submitProduct(productId) {
    if (USE_MOCK) {
      console.log('Submitting product:', productId);
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true, status: 'submitted' };
    }
    const response = await fetch(`${BASE_URL}/products/${productId}/submit`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to submit product');
    return response.json();
  },

  async submitMultipleProducts(productIds) {
    if (USE_MOCK) {
      console.log('Submitting products:', productIds);
      await new Promise(resolve => setTimeout(resolve, 800));
      return { success: true, count: productIds.length };
    }
    const response = await fetch(`${BASE_URL}/products/submit-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productIds })
    });
    if (!response.ok) throw new Error('Failed to submit products');
    return response.json();
  },

  async saveAllDrafts(products) {
    if (USE_MOCK) {
      console.log('Saving all drafts:', products.length);
      await new Promise(resolve => setTimeout(resolve, 600));
      return { success: true };
    }
    const response = await fetch(`${BASE_URL}/products/save-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products })
    });
    if (!response.ok) throw new Error('Failed to save drafts');
    return response.json();
  },

  async approveProduct(productId, comments = '') {
    if (USE_MOCK) {
      console.log('Approving product:', productId, comments);
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true, status: 'approved' };
    }
    const response = await fetch(`${BASE_URL}/products/${productId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comments })
    });
    if (!response.ok) throw new Error('Failed to approve product');
    return response.json();
  },

  async rejectProduct(productId, reason) {
    if (USE_MOCK) {
      console.log('Rejecting product:', productId, reason);
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true, status: 'rejected' };
    }
    const response = await fetch(`${BASE_URL}/products/${productId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    if (!response.ok) throw new Error('Failed to reject product');
    return response.json();
  }
};

export default ApiService;
