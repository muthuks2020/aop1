/**
 * API Service Layer
 * Handles all API calls with mock data support
 */

const BASE_URL = '/api/v1';
const USE_MOCK = true;

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
    { id: 1, categoryId: 'equipment', subcategory: 'Diagnostic & Laser', name: 'Slit Lamp SL-700', code: 'EQ-DL-001', lyQty: 8, cyQty: 10, status: 'approved', approvedDate: '2025-01-15' },
    { id: 2, categoryId: 'equipment', subcategory: 'Diagnostic & Laser', name: 'Auto Refractometer AR-600', code: 'EQ-DL-002', lyQty: 6, cyQty: 8, status: 'approved', approvedDate: '2025-01-15' },
    { id: 3, categoryId: 'equipment', subcategory: 'Diagnostic & Laser', name: 'Fundus Camera FC-300', code: 'EQ-DL-003', lyQty: 3, cyQty: 4, status: 'submitted', submittedDate: '2025-01-20' },
    { id: 4, categoryId: 'equipment', subcategory: 'Diagnostic & Laser', name: 'YAG Laser System', code: 'EQ-DL-004', lyQty: 2, cyQty: 3, status: 'draft' },
    
    // EQUIPMENT - Surgical Products
    { id: 5, categoryId: 'equipment', subcategory: 'Surgical Products', name: 'Phaco Machine Centurion', code: 'EQ-SP-001', lyQty: 4, cyQty: 6, status: 'approved', approvedDate: '2025-01-10' },
    { id: 6, categoryId: 'equipment', subcategory: 'Surgical Products', name: 'Operating Microscope', code: 'EQ-SP-002', lyQty: 5, cyQty: 6, status: 'submitted', submittedDate: '2025-01-18' },
    { id: 7, categoryId: 'equipment', subcategory: 'Surgical Products', name: 'Vitrectomy System', code: 'EQ-SP-003', lyQty: 2, cyQty: 3, status: 'draft' },
    
    // EQUIPMENT - OPD
    { id: 8, categoryId: 'equipment', subcategory: 'OPD', name: 'Tonometer Applanation', code: 'EQ-OPD-001', lyQty: 12, cyQty: 15, status: 'approved', approvedDate: '2025-01-12' },
    { id: 9, categoryId: 'equipment', subcategory: 'OPD', name: 'Lensometer Digital', code: 'EQ-OPD-002', lyQty: 8, cyQty: 10, status: 'draft' },
    { id: 10, categoryId: 'equipment', subcategory: 'OPD', name: 'Keratometer Manual', code: 'EQ-OPD-003', lyQty: 6, cyQty: 7, status: 'submitted', submittedDate: '2025-01-22' },
    
    // EQUIPMENT - Tables, Stand & Accessories
    { id: 11, categoryId: 'equipment', subcategory: 'Tables, Stand & Accessories', name: 'Instrument Table SS', code: 'EQ-TA-001', lyQty: 20, cyQty: 25, status: 'approved', approvedDate: '2025-01-14' },
    { id: 12, categoryId: 'equipment', subcategory: 'Tables, Stand & Accessories', name: 'Mayo Stand Trolley', code: 'EQ-TA-002', lyQty: 15, cyQty: 18, status: 'draft' },
    
    // EQUIPMENT - Vision Testing Equipment
    { id: 13, categoryId: 'equipment', subcategory: 'Vision Testing Equipment', name: 'Vision Chart Projector', code: 'EQ-VT-001', lyQty: 10, cyQty: 12, status: 'approved', approvedDate: '2025-01-11' },
    { id: 14, categoryId: 'equipment', subcategory: 'Vision Testing Equipment', name: 'Trial Lens Set', code: 'EQ-VT-002', lyQty: 8, cyQty: 10, status: 'submitted', submittedDate: '2025-01-19' },
    
    // EQUIPMENT - Accessories
    { id: 15, categoryId: 'equipment', subcategory: 'Accessories', name: 'Chin Rest Assembly', code: 'EQ-AC-001', lyQty: 25, cyQty: 30, status: 'draft' },
    { id: 16, categoryId: 'equipment', subcategory: 'Accessories', name: 'Headrest Cushion', code: 'EQ-AC-002', lyQty: 40, cyQty: 50, status: 'approved', approvedDate: '2025-01-13' },
    
    // EQUIPMENT - New Products
    { id: 17, categoryId: 'equipment', subcategory: 'New Product-EQ', name: 'OCT Scanner Advanced', code: 'EQ-NP-001', lyQty: 0, cyQty: 3, status: 'draft' },
    
    // IOL - Hydrophilic
    { id: 18, categoryId: 'iol', subcategory: 'Hydrophilic', name: 'APPAFLEX Monofocal', code: 'IOL-HP-001', lyQty: 450, cyQty: 520, status: 'approved', approvedDate: '2025-01-15' },
    { id: 19, categoryId: 'iol', subcategory: 'Hydrophilic', name: 'APPAFLEX Toric', code: 'IOL-HP-002', lyQty: 180, cyQty: 210, status: 'approved', approvedDate: '2025-01-15' },
    { id: 20, categoryId: 'iol', subcategory: 'Hydrophilic', name: 'APPAFLEX Multifocal', code: 'IOL-HP-003', lyQty: 120, cyQty: 145, status: 'submitted', submittedDate: '2025-01-20' },
    { id: 21, categoryId: 'iol', subcategory: 'Hydrophilic', name: 'APPAFLEX Aspheric', code: 'IOL-HP-004', lyQty: 280, cyQty: 320, status: 'draft' },
    
    // IOL - Hydrophobic
    { id: 22, categoryId: 'iol', subcategory: 'Hydrophobic', name: 'APPASSUREFOLD Single', code: 'IOL-HB-001', lyQty: 380, cyQty: 440, status: 'approved', approvedDate: '2025-01-16' },
    { id: 23, categoryId: 'iol', subcategory: 'Hydrophobic', name: 'APPASSUREFOLD Toric', code: 'IOL-HB-002', lyQty: 150, cyQty: 175, status: 'submitted', submittedDate: '2025-01-21' },
    { id: 24, categoryId: 'iol', subcategory: 'Hydrophobic', name: 'APPASSUREFOLD Multifocal', code: 'IOL-HB-003', lyQty: 95, cyQty: 115, status: 'draft' },
    { id: 25, categoryId: 'iol', subcategory: 'Hydrophobic', name: 'APPASSUREFOLD EDOF', code: 'IOL-HB-004', lyQty: 65, cyQty: 80, status: 'rejected', rejectedDate: '2025-01-18', rejectionReason: 'Growth target too conservative. Increase by 10% minimum.' },
    
    // IOL - PMMA
    { id: 26, categoryId: 'iol', subcategory: 'PMMA', name: 'APPAPMMA Standard', code: 'IOL-PM-001', lyQty: 850, cyQty: 920, status: 'approved', approvedDate: '2025-01-14' },
    { id: 27, categoryId: 'iol', subcategory: 'PMMA', name: 'APPAPMMA AC IOL', code: 'IOL-PM-002', lyQty: 120, cyQty: 140, status: 'draft' },
    
    // IOL - New Products
    { id: 28, categoryId: 'iol', subcategory: 'New Product-IOL', name: 'APPAVISION Trifocal', code: 'IOL-NP-001', lyQty: 0, cyQty: 50, status: 'draft' },
    { id: 29, categoryId: 'iol', subcategory: 'New Product-IOL', name: 'APPAVISION Light Adj', code: 'IOL-NP-002', lyQty: 0, cyQty: 25, status: 'draft' },
    
    // OVD
    { id: 30, categoryId: 'ovd', subcategory: 'Viscoelastic', name: 'APPAVISCO Standard', code: 'OVD-VS-001', lyQty: 1200, cyQty: 1400, status: 'approved', approvedDate: '2025-01-12' },
    { id: 31, categoryId: 'ovd', subcategory: 'Viscoelastic', name: 'APPAVISCO Premium', code: 'OVD-VS-002', lyQty: 600, cyQty: 720, status: 'submitted', submittedDate: '2025-01-22' },
    { id: 32, categoryId: 'ovd', subcategory: 'Dispersive', name: 'APPADISPER Chondroitin', code: 'OVD-DP-001', lyQty: 450, cyQty: 530, status: 'draft' },
    { id: 33, categoryId: 'ovd', subcategory: 'Cohesive', name: 'APPACOHES Sodium HA', code: 'OVD-CH-001', lyQty: 380, cyQty: 450, status: 'approved', approvedDate: '2025-01-13' },
    
    // MIS
    { id: 34, categoryId: 'mis', subcategory: 'Surgical Instruments', name: 'Forceps Set Micro', code: 'MIS-SI-001', lyQty: 150, cyQty: 180, status: 'approved', approvedDate: '2025-01-11' },
    { id: 35, categoryId: 'mis', subcategory: 'Surgical Instruments', name: 'Scissors Curved', code: 'MIS-SI-002', lyQty: 200, cyQty: 240, status: 'submitted', submittedDate: '2025-01-20' },
    { id: 36, categoryId: 'mis', subcategory: 'Surgical Instruments', name: 'Speculum Wire', code: 'MIS-SI-003', lyQty: 180, cyQty: 210, status: 'draft' },
    { id: 37, categoryId: 'mis', subcategory: 'Consumables', name: 'Surgical Blades 15°', code: 'MIS-CO-001', lyQty: 2500, cyQty: 2900, status: 'approved', approvedDate: '2025-01-14' },
    { id: 38, categoryId: 'mis', subcategory: 'Consumables', name: 'Sutures Nylon 10-0', code: 'MIS-CO-002', lyQty: 1800, cyQty: 2100, status: 'draft' },
    { id: 39, categoryId: 'mis', subcategory: 'Consumables', name: 'Cannulas Irrigation', code: 'MIS-CO-003', lyQty: 1500, cyQty: 1750, status: 'submitted', submittedDate: '2025-01-23' },
    
    // OTHERS
    { id: 40, categoryId: 'others', subcategory: 'Accessories', name: 'Eye Shield Plastic', code: 'OTH-AC-001', lyQty: 3000, cyQty: 3500, status: 'approved', approvedDate: '2025-01-10' },
    { id: 41, categoryId: 'others', subcategory: 'Accessories', name: 'Tape Patches Sterile', code: 'OTH-AC-002', lyQty: 2000, cyQty: 2400, status: 'draft' },
    { id: 42, categoryId: 'others', subcategory: 'New Products', name: 'Smart Eye Drops Dispenser', code: 'OTH-NP-001', lyQty: 0, cyQty: 100, status: 'draft' }
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
  }
};

export default ApiService;
