/**
 * Sampling Master API Service
 * ============================
 * Handles all API calls for Sampling Plan Master and Quality Plan Configuration
 * 
 * Features:
 * - Configurable mock/real API toggle
 * - Comprehensive mock data for development
 * - Ready for production API integration
 * 
 * @author QC Application Team
 * @version 1.0.0
 */

// ============================================
// API CONFIGURATION
// ============================================
export const SAMPLING_API_CONFIG = {
  useMockData: true,  // Set to false when backend API is ready
  logApiCalls: true,  // Enable for debugging
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
};

// API Endpoints
const ENDPOINTS = {
  // Sampling Plan endpoints
  samplingPlans: `${SAMPLING_API_CONFIG.baseUrl}/sampling-plans`,
  samplingPlanById: (id) => `${SAMPLING_API_CONFIG.baseUrl}/sampling-plans/${id}`,
  validateSamplingPlanNo: `${SAMPLING_API_CONFIG.baseUrl}/sampling-plans/validate`,
  
  // Quality Plan endpoints
  qualityPlans: `${SAMPLING_API_CONFIG.baseUrl}/quality-plans`,
  qualityPlanById: (id) => `${SAMPLING_API_CONFIG.baseUrl}/quality-plans/${id}`,
  validateQCPlanNo: `${SAMPLING_API_CONFIG.baseUrl}/quality-plans/validate`,
  
  // Master data endpoints
  departments: `${SAMPLING_API_CONFIG.baseUrl}/departments`,
  products: `${SAMPLING_API_CONFIG.baseUrl}/products`,
};

// ============================================
// MOCK DATA
// ============================================

// AQL Tables (ISO 2859-1 standard)
const AQL_TABLES = {
  SP0: { name: 'Level 0 - Tightened', multiplier: 0.5 },
  SP1: { name: 'Level 1 - Normal', multiplier: 1.0 },
  SP2: { name: 'Level 2 - Reduced', multiplier: 1.5 },
  SP3: { name: 'Level 3 - Special', multiplier: 2.0 },
};

// Standard lot size ranges and sample sizes
const LOT_SIZE_RANGES = [
  { id: 1, min: 2, max: 8, letter: 'A', sampleSizes: { SP0: 2, SP1: 2, SP2: 2, SP3: 3 } },
  { id: 2, min: 9, max: 15, letter: 'B', sampleSizes: { SP0: 3, SP1: 3, SP2: 3, SP3: 5 } },
  { id: 3, min: 16, max: 25, letter: 'C', sampleSizes: { SP0: 5, SP1: 5, SP2: 5, SP3: 8 } },
  { id: 4, min: 26, max: 50, letter: 'D', sampleSizes: { SP0: 8, SP1: 8, SP2: 8, SP3: 13 } },
  { id: 5, min: 51, max: 90, letter: 'E', sampleSizes: { SP0: 13, SP1: 13, SP2: 13, SP3: 20 } },
  { id: 6, min: 91, max: 150, letter: 'F', sampleSizes: { SP0: 20, SP1: 20, SP2: 20, SP3: 32 } },
  { id: 7, min: 151, max: 280, letter: 'G', sampleSizes: { SP0: 32, SP1: 32, SP2: 32, SP3: 50 } },
  { id: 8, min: 281, max: 500, letter: 'H', sampleSizes: { SP0: 50, SP1: 50, SP2: 50, SP3: 80 } },
  { id: 9, min: 501, max: 1200, letter: 'J', sampleSizes: { SP0: 80, SP1: 80, SP2: 80, SP3: 125 } },
  { id: 10, min: 1201, max: 3200, letter: 'K', sampleSizes: { SP0: 125, SP1: 125, SP2: 125, SP3: 200 } },
  { id: 11, min: 3201, max: 10000, letter: 'L', sampleSizes: { SP0: 200, SP1: 200, SP2: 200, SP3: 315 } },
  { id: 12, min: 10001, max: 35000, letter: 'M', sampleSizes: { SP0: 315, SP1: 315, SP2: 315, SP3: 500 } },
];

// Mock sampling plans data
let mockSamplingPlans = [
  {
    id: 'SP-001',
    samplePlanNo: 'SP-001',
    samplePlanType: 'SP1',
    samplePlanTypeName: 'Level 1 - Normal',
    iterations: 1,
    lotRanges: [
      { lotMin: 2, lotMax: 50, iteration1: 8, iteration2: 16, iteration3: 50, passRequired1: 7, passRequired2: 14, passRequired3: 48 },
      { lotMin: 51, lotMax: 150, iteration1: 13, iteration2: 26, iteration3: 150, passRequired1: 12, passRequired2: 24, passRequired3: 145 },
      { lotMin: 151, lotMax: 500, iteration1: 32, iteration2: 64, iteration3: 500, passRequired1: 30, passRequired2: 62, passRequired3: 490 },
    ],
    status: 'active',
    createdAt: '2026-01-15T10:00:00Z',
    createdBy: 'admin',
    updatedAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'SP-002',
    samplePlanNo: 'SP-002',
    samplePlanType: 'SP2',
    samplePlanTypeName: 'Level 2 - Reduced',
    iterations: 2,
    lotRanges: [
      { lotMin: 2, lotMax: 50, iteration1: 5, iteration2: 10, iteration3: 50, passRequired1: 5, passRequired2: 10, passRequired3: 50 },
      { lotMin: 51, lotMax: 150, iteration1: 8, iteration2: 16, iteration3: 150, passRequired1: 8, passRequired2: 16, passRequired3: 150 },
    ],
    status: 'active',
    createdAt: '2026-01-18T14:30:00Z',
    createdBy: 'admin',
    updatedAt: '2026-01-18T14:30:00Z',
  },
];

// Mock departments data
let mockDepartments = [
  {
    id: 'DEPT-001',
    name: 'Quality Control',
    code: 'QC',
    passSourceLocation: 'QC-PASS-STORE',
    passSourceLocationOdooId: 'stock.location_qc_pass_001',
    passDestLocation: 'MAIN-STORE-A',
    passDestLocationOdooId: 'stock.location_main_store_a',
    failSourceLocation: 'QC-FAIL-HOLD',
    failSourceLocationOdooId: 'stock.location_qc_fail_001',
    failDestLocation: 'VENDOR-RETURN',
    failDestLocationOdooId: 'stock.location_vendor_return',
    status: 'active',
  },
  {
    id: 'DEPT-002',
    name: 'Incoming Quality',
    code: 'IQC',
    passSourceLocation: 'IQC-PASS-STORE',
    passSourceLocationOdooId: 'stock.location_iqc_pass_001',
    passDestLocation: 'PRODUCTION-STORE',
    passDestLocationOdooId: 'stock.location_prod_store',
    failSourceLocation: 'IQC-FAIL-HOLD',
    failSourceLocationOdooId: 'stock.location_iqc_fail_001',
    failDestLocation: 'QUARANTINE',
    failDestLocationOdooId: 'stock.location_quarantine',
    status: 'active',
  },
  {
    id: 'DEPT-003',
    name: 'Final Quality Assurance',
    code: 'FQA',
    passSourceLocation: 'FQA-PASS-STORE',
    passSourceLocationOdooId: 'stock.location_fqa_pass_001',
    passDestLocation: 'DISPATCH-STORE',
    passDestLocationOdooId: 'stock.location_dispatch',
    failSourceLocation: 'FQA-FAIL-HOLD',
    failSourceLocationOdooId: 'stock.location_fqa_fail_001',
    failDestLocation: 'REWORK-AREA',
    failDestLocationOdooId: 'stock.location_rework',
    status: 'active',
  },
];

// Mock products data
let mockProducts = [
  { id: 'PRD-001', name: 'B-SCAN Ultrasound Probe', code: 'BSP-001', category: 'Electronics' },
  { id: 'PRD-002', name: 'Transducer Cable Assembly', code: 'TCA-001', category: 'Electrical' },
  { id: 'PRD-003', name: 'Display Panel Module', code: 'DPM-001', category: 'Electronics' },
  { id: 'PRD-004', name: 'Power Supply Unit', code: 'PSU-001', category: 'Electrical' },
  { id: 'PRD-005', name: 'Optical Lens Assembly', code: 'OLA-001', category: 'Optical' },
  { id: 'PRD-006', name: 'Mechanical Housing', code: 'MH-001', category: 'Mechanical' },
  { id: 'PRD-007', name: 'PCB Main Board', code: 'PCB-001', category: 'Electronics' },
  { id: 'PRD-008', name: 'Plastic Cover', code: 'PC-001', category: 'Plastic' },
];

// Mock quality plans data
let mockQualityPlans = [
  {
    id: 'QP-001',
    qcPlanNo: 'RD.7.3-07',
    productId: 'PRD-001',
    productName: 'B-SCAN Ultrasound Probe',
    documentRevNo: 'Rev-03',
    revisionDate: '2026-01-10',
    departmentId: 'DEPT-001',
    departmentName: 'Quality Control',
    description: 'Quality plan for B-SCAN ultrasound probe inspection',
    status: 'active',
    createdAt: '2026-01-10T09:00:00Z',
    createdBy: 'admin',
    updatedAt: '2026-01-20T11:30:00Z',
  },
  {
    id: 'QP-002',
    qcPlanNo: 'RD.7.3-12',
    productId: 'PRD-002',
    productName: 'Transducer Cable Assembly',
    documentRevNo: 'Rev-01',
    revisionDate: '2026-01-15',
    departmentId: 'DEPT-002',
    departmentName: 'Incoming Quality',
    description: 'Quality plan for transducer cable incoming inspection',
    status: 'active',
    createdAt: '2026-01-15T10:00:00Z',
    createdBy: 'admin',
    updatedAt: '2026-01-15T10:00:00Z',
  },
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const generateId = (prefix = 'ID') => {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
};

const logApiCall = (method, endpoint, data = null) => {
  if (SAMPLING_API_CONFIG.logApiCalls) {
    console.log(`[Sampling API] ${method} ${endpoint}`, data || '');
  }
};

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
});

// Calculate sample quantity based on iteration
export const calculateSampleQuantity = (lotSize, planType, iteration) => {
  const range = LOT_SIZE_RANGES.find(r => lotSize >= r.min && lotSize <= r.max);
  if (!range) return 0;
  
  const baseSample = range.sampleSizes[planType] || range.sampleSizes.SP1;
  
  switch (iteration) {
    case 1: return baseSample;
    case 2: return baseSample * 2;
    case 3: return lotSize; // 100% inspection
    default: return baseSample;
  }
};

// Calculate required pass based on iteration
export const calculateRequiredPass = (sampleQty, iteration) => {
  // Typically allow 2-5% defect rate
  const allowedDefectRate = iteration === 3 ? 0.02 : 0.05;
  return Math.ceil(sampleQty * (1 - allowedDefectRate));
};

// ============================================
// SAMPLING PLAN API FUNCTIONS
// ============================================

/**
 * Fetch all sampling plans with optional filters
 */
export const fetchSamplingPlans = async (filters = {}) => {
  logApiCall('GET', ENDPOINTS.samplingPlans, filters);
  
  if (SAMPLING_API_CONFIG.useMockData) {
    await delay(400);
    
    let filtered = [...mockSamplingPlans];
    
    if (filters.status) {
      filtered = filtered.filter(p => p.status === filters.status);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(p => 
        p.samplePlanNo.toLowerCase().includes(search) ||
        p.samplePlanTypeName.toLowerCase().includes(search)
      );
    }
    
    return {
      success: true,
      data: filtered,
      total: filtered.length,
    };
  }
  
  const response = await fetch(ENDPOINTS.samplingPlans, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch sampling plans');
  return response.json();
};

/**
 * Fetch single sampling plan by ID
 */
export const fetchSamplingPlanById = async (id) => {
  logApiCall('GET', ENDPOINTS.samplingPlanById(id));
  
  if (SAMPLING_API_CONFIG.useMockData) {
    await delay(300);
    const plan = mockSamplingPlans.find(p => p.id === id);
    if (!plan) throw new Error('Sampling plan not found');
    return { success: true, data: plan };
  }
  
  const response = await fetch(ENDPOINTS.samplingPlanById(id), {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch sampling plan');
  return response.json();
};

/**
 * Create new sampling plan
 */
export const createSamplingPlan = async (data) => {
  logApiCall('POST', ENDPOINTS.samplingPlans, data);
  
  if (SAMPLING_API_CONFIG.useMockData) {
    await delay(500);
    
    const newPlan = {
      ...data,
      id: generateId('SP'),
      samplePlanTypeName: AQL_TABLES[data.samplePlanType]?.name || 'Unknown',
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: 'admin',
      updatedAt: new Date().toISOString(),
    };
    
    mockSamplingPlans.push(newPlan);
    return { success: true, data: newPlan };
  }
  
  const response = await fetch(ENDPOINTS.samplingPlans, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create sampling plan');
  return response.json();
};

/**
 * Update existing sampling plan
 */
export const updateSamplingPlan = async (id, data) => {
  logApiCall('PUT', ENDPOINTS.samplingPlanById(id), data);
  
  if (SAMPLING_API_CONFIG.useMockData) {
    await delay(500);
    
    const index = mockSamplingPlans.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Sampling plan not found');
    
    mockSamplingPlans[index] = {
      ...mockSamplingPlans[index],
      ...data,
      samplePlanTypeName: AQL_TABLES[data.samplePlanType]?.name || mockSamplingPlans[index].samplePlanTypeName,
      updatedAt: new Date().toISOString(),
    };
    
    return { success: true, data: mockSamplingPlans[index] };
  }
  
  const response = await fetch(ENDPOINTS.samplingPlanById(id), {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update sampling plan');
  return response.json();
};

/**
 * Delete sampling plan
 */
export const deleteSamplingPlan = async (id) => {
  logApiCall('DELETE', ENDPOINTS.samplingPlanById(id));
  
  if (SAMPLING_API_CONFIG.useMockData) {
    await delay(400);
    
    const index = mockSamplingPlans.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Sampling plan not found');
    
    mockSamplingPlans.splice(index, 1);
    return { success: true };
  }
  
  const response = await fetch(ENDPOINTS.samplingPlanById(id), {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to delete sampling plan');
  return response.json();
};

/**
 * Validate sampling plan number uniqueness
 */
export const validateSamplingPlanNo = async (planNo, excludeId = null) => {
  logApiCall('GET', ENDPOINTS.validateSamplingPlanNo, { planNo, excludeId });
  
  if (SAMPLING_API_CONFIG.useMockData) {
    await delay(200);
    const exists = mockSamplingPlans.some(
      p => p.samplePlanNo.toLowerCase() === planNo.toLowerCase() && p.id !== excludeId
    );
    return { isUnique: !exists };
  }
  
  const response = await fetch(`${ENDPOINTS.validateSamplingPlanNo}?planNo=${planNo}&exclude=${excludeId || ''}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to validate plan number');
  return response.json();
};

// ============================================
// QUALITY PLAN API FUNCTIONS
// ============================================

/**
 * Fetch all quality plans with optional filters
 */
export const fetchQualityPlans = async (filters = {}) => {
  logApiCall('GET', ENDPOINTS.qualityPlans, filters);
  
  if (SAMPLING_API_CONFIG.useMockData) {
    await delay(400);
    
    let filtered = [...mockQualityPlans];
    
    if (filters.status) {
      filtered = filtered.filter(p => p.status === filters.status);
    }
    if (filters.departmentId) {
      filtered = filtered.filter(p => p.departmentId === filters.departmentId);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(p => 
        p.qcPlanNo.toLowerCase().includes(search) ||
        p.productName.toLowerCase().includes(search)
      );
    }
    
    return {
      success: true,
      data: filtered,
      total: filtered.length,
    };
  }
  
  const response = await fetch(ENDPOINTS.qualityPlans, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch quality plans');
  return response.json();
};

/**
 * Fetch single quality plan by ID
 */
export const fetchQualityPlanById = async (id) => {
  logApiCall('GET', ENDPOINTS.qualityPlanById(id));
  
  if (SAMPLING_API_CONFIG.useMockData) {
    await delay(300);
    const plan = mockQualityPlans.find(p => p.id === id);
    if (!plan) throw new Error('Quality plan not found');
    return { success: true, data: plan };
  }
  
  const response = await fetch(ENDPOINTS.qualityPlanById(id), {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch quality plan');
  return response.json();
};

/**
 * Create new quality plan
 */
export const createQualityPlan = async (data) => {
  logApiCall('POST', ENDPOINTS.qualityPlans, data);
  
  if (SAMPLING_API_CONFIG.useMockData) {
    await delay(500);
    
    const product = mockProducts.find(p => p.id === data.productId);
    const department = mockDepartments.find(d => d.id === data.departmentId);
    
    const newPlan = {
      ...data,
      id: generateId('QP'),
      productName: product?.name || 'Unknown Product',
      departmentName: department?.name || 'Unknown Department',
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: 'admin',
      updatedAt: new Date().toISOString(),
    };
    
    mockQualityPlans.push(newPlan);
    return { success: true, data: newPlan };
  }
  
  const response = await fetch(ENDPOINTS.qualityPlans, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create quality plan');
  return response.json();
};

/**
 * Update existing quality plan
 */
export const updateQualityPlan = async (id, data) => {
  logApiCall('PUT', ENDPOINTS.qualityPlanById(id), data);
  
  if (SAMPLING_API_CONFIG.useMockData) {
    await delay(500);
    
    const index = mockQualityPlans.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Quality plan not found');
    
    const product = mockProducts.find(p => p.id === data.productId);
    const department = mockDepartments.find(d => d.id === data.departmentId);
    
    mockQualityPlans[index] = {
      ...mockQualityPlans[index],
      ...data,
      productName: product?.name || mockQualityPlans[index].productName,
      departmentName: department?.name || mockQualityPlans[index].departmentName,
      updatedAt: new Date().toISOString(),
    };
    
    return { success: true, data: mockQualityPlans[index] };
  }
  
  const response = await fetch(ENDPOINTS.qualityPlanById(id), {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update quality plan');
  return response.json();
};

/**
 * Delete quality plan
 */
export const deleteQualityPlan = async (id) => {
  logApiCall('DELETE', ENDPOINTS.qualityPlanById(id));
  
  if (SAMPLING_API_CONFIG.useMockData) {
    await delay(400);
    
    const index = mockQualityPlans.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Quality plan not found');
    
    mockQualityPlans.splice(index, 1);
    return { success: true };
  }
  
  const response = await fetch(ENDPOINTS.qualityPlanById(id), {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to delete quality plan');
  return response.json();
};

/**
 * Validate QC plan number uniqueness
 */
export const validateQCPlanNo = async (planNo, excludeId = null) => {
  logApiCall('GET', ENDPOINTS.validateQCPlanNo, { planNo, excludeId });
  
  if (SAMPLING_API_CONFIG.useMockData) {
    await delay(200);
    const exists = mockQualityPlans.some(
      p => p.qcPlanNo.toLowerCase() === planNo.toLowerCase() && p.id !== excludeId
    );
    return { isUnique: !exists };
  }
  
  const response = await fetch(`${ENDPOINTS.validateQCPlanNo}?planNo=${planNo}&exclude=${excludeId || ''}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to validate QC plan number');
  return response.json();
};

// ============================================
// MASTER DATA API FUNCTIONS
// ============================================

/**
 * Fetch all departments
 */
export const fetchDepartments = async () => {
  logApiCall('GET', ENDPOINTS.departments);
  
  if (SAMPLING_API_CONFIG.useMockData) {
    await delay(300);
    return { success: true, data: mockDepartments };
  }
  
  const response = await fetch(ENDPOINTS.departments, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch departments');
  return response.json();
};

/**
 * Fetch all products
 */
export const fetchProducts = async () => {
  logApiCall('GET', ENDPOINTS.products);
  
  if (SAMPLING_API_CONFIG.useMockData) {
    await delay(300);
    return { success: true, data: mockProducts };
  }
  
  const response = await fetch(ENDPOINTS.products, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch products');
  return response.json();
};

/**
 * Get lot size ranges (static data)
 */
export const getLotSizeRanges = () => LOT_SIZE_RANGES;

/**
 * Get AQL tables (static data)
 */
export const getAQLTables = () => AQL_TABLES;

// Export everything
export default {
  SAMPLING_API_CONFIG,
  fetchSamplingPlans,
  fetchSamplingPlanById,
  createSamplingPlan,
  updateSamplingPlan,
  deleteSamplingPlan,
  validateSamplingPlanNo,
  fetchQualityPlans,
  fetchQualityPlanById,
  createQualityPlan,
  updateQualityPlan,
  deleteQualityPlan,
  validateQCPlanNo,
  fetchDepartments,
  fetchProducts,
  getLotSizeRanges,
  getAQLTables,
  calculateSampleQuantity,
  calculateRequiredPass,
};
