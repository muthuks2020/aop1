/**
 * TBM API Service for Product Commitment PWA
 * Territory Business Manager specific API methods
 * 
 * @author Appasamy Associates - Product Commitment PWA
 * @version 3.0.0 - Added TBM Individual Target CRUD
 * 
 * BACKEND INTEGRATION:
 * - Set USE_MOCK = false and update BASE_URL when backend is ready
 * - All endpoints follow RESTful conventions
 * - Authentication token should be passed in headers
 */

// ==================== CONFIGURATION ====================
// Toggle this to switch between mock and real API
import teamTargetMethods from './tbmApi_teamTargets_addition';

const USE_MOCK = process.env.REACT_APP_USE_MOCK !== 'false';
const BASE_URL = process.env.REACT_APP_API_URL || 'https://api.appasamy.com/v1';

// API Configuration for easy backend integration
export const TBM_API_CONFIG = {
  useMock: USE_MOCK,
  baseUrl: BASE_URL,
  endpoints: {
    // Sales Rep Submissions for TBM approval
    getSalesRepSubmissions: '/tbm/sales-rep-submissions',
    approveSalesRepTarget: '/tbm/approve-sales-rep/:id',
    rejectSalesRepTarget: '/tbm/reject-sales-rep/:id',
    bulkApproveSalesRep: '/tbm/bulk-approve-sales-rep',
    bulkRejectSalesRep: '/tbm/bulk-reject-sales-rep',
    
    // TBM's own territory targets
    getTBMTargets: '/tbm/territory-targets',
    saveTBMTargets: '/tbm/territory-targets/save',
    submitTBMTargets: '/tbm/territory-targets/submit',

    // ★ NEW — TBM individual (personal) targets
    getTBMIndividualTargets: '/tbm/individual-targets',
    saveTBMIndividualTargets: '/tbm/individual-targets/save',
    submitTBMIndividualTargets: '/tbm/individual-targets/submit',
    
    // Dashboard stats
    getTBMDashboardStats: '/tbm/dashboard-stats',
    
    // Categories and Products
    getCategories: '/categories',
    getProducts: '/products'
  },
  timeout: 30000,
  retryAttempts: 3
};

// ==================== UTILITY FUNCTIONS ====================

// Simulate network delay for mock data
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Generate auth headers (for backend integration)
const getAuthHeaders = () => {
  const token = localStorage.getItem('appasamy_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// API request wrapper with retry logic
const apiRequest = async (url, options = {}) => {
  const fullUrl = `${BASE_URL}${url}`;
  const config = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers
    }
  };
  
  let lastError;
  for (let attempt = 0; attempt < TBM_API_CONFIG.retryAttempts; attempt++) {
    try {
      const response = await fetch(fullUrl, config);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      lastError = error;
      if (attempt < TBM_API_CONFIG.retryAttempts - 1) {
        await delay(1000 * (attempt + 1)); // Exponential backoff
      }
    }
  }
  throw lastError;
};

// ==================== MOCK DATA ====================

// Mock Categories
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

// Mock Sales Rep Submissions (pending approval from TBM)
const MockSalesRepSubmissions = [
  // Sales Rep 1 - Vasanthakumar C
  { 
    id: 101, 
    salesRepId: 1,
    salesRepName: 'Vasanthakumar C',
    territory: 'Central Delhi',
    categoryId: 'equipment', 
    subcategory: 'Diagnostic', 
    name: 'Slit Lamp SL-700', 
    code: 'EQ-DG-001', 
    status: 'submitted',
    submittedDate: '2025-01-28T10:30:00Z',
    monthlyTargets: generateMonthlyTargets(8, 80000)
  },
  { 
    id: 102, 
    salesRepId: 1,
    salesRepName: 'Vasanthakumar C',
    territory: 'Central Delhi',
    categoryId: 'equipment', 
    subcategory: 'Diagnostic', 
    name: 'Auto Refractometer AR-500', 
    code: 'EQ-DG-002', 
    status: 'submitted',
    submittedDate: '2025-01-28T10:35:00Z',
    monthlyTargets: generateMonthlyTargets(6, 95000)
  },
  { 
    id: 103, 
    salesRepId: 1,
    salesRepName: 'Vasanthakumar C',
    territory: 'Central Delhi',
    categoryId: 'iol', 
    subcategory: 'Hydrophilic', 
    name: 'AppaFlex Q Standard', 
    code: 'IOL-HY-001', 
    status: 'submitted',
    submittedDate: '2025-01-28T11:00:00Z',
    monthlyTargets: generateMonthlyTargets(120, 36000)
  },
  { 
    id: 104, 
    salesRepId: 1,
    salesRepName: 'Vasanthakumar C',
    territory: 'Central Delhi',
    categoryId: 'ovd', 
    subcategory: 'Cohesive', 
    name: 'AppaGel 2.0', 
    code: 'OVD-CO-001', 
    status: 'submitted',
    submittedDate: '2025-01-28T11:15:00Z',
    monthlyTargets: generateMonthlyTargets(150, 22500)
  },
  
  // Sales Rep 2 - Arun Sharma
  { 
    id: 201, 
    salesRepId: 6,
    salesRepName: 'Arun Sharma',
    territory: 'South Delhi',
    categoryId: 'equipment', 
    subcategory: 'Surgical', 
    name: 'Phaco Machine PM-3000', 
    code: 'EQ-SG-001', 
    status: 'submitted',
    submittedDate: '2025-01-27T14:00:00Z',
    monthlyTargets: generateMonthlyTargets(3, 250000)
  },
  { 
    id: 202, 
    salesRepId: 6,
    salesRepName: 'Arun Sharma',
    territory: 'South Delhi',
    categoryId: 'iol', 
    subcategory: 'Hydrophobic', 
    name: 'AppaFlex Yellow Toric', 
    code: 'IOL-HB-003', 
    status: 'submitted',
    submittedDate: '2025-01-27T14:30:00Z',
    monthlyTargets: generateMonthlyTargets(80, 64000)
  },
  { 
    id: 203, 
    salesRepId: 6,
    salesRepName: 'Arun Sharma',
    territory: 'South Delhi',
    categoryId: 'mis', 
    subcategory: 'Instruments', 
    name: 'Surgical Kit Premium', 
    code: 'MIS-IN-001', 
    status: 'submitted',
    submittedDate: '2025-01-27T15:00:00Z',
    monthlyTargets: generateMonthlyTargets(0, 45000)
  },
  
  // Sales Rep 3 - Priya Menon
  { 
    id: 301, 
    salesRepId: 7,
    salesRepName: 'Priya Menon',
    territory: 'East Delhi',
    categoryId: 'equipment', 
    subcategory: 'Diagnostic', 
    name: 'Tonometer AT-900', 
    code: 'EQ-DG-003', 
    status: 'submitted',
    submittedDate: '2025-01-26T09:00:00Z',
    monthlyTargets: generateMonthlyTargets(10, 55000)
  },
  { 
    id: 302, 
    salesRepId: 7,
    salesRepName: 'Priya Menon',
    territory: 'East Delhi',
    categoryId: 'iol', 
    subcategory: 'Multifocal', 
    name: 'AppaFlex Multifocal Pro', 
    code: 'IOL-MF-001', 
    status: 'submitted',
    submittedDate: '2025-01-26T09:30:00Z',
    monthlyTargets: generateMonthlyTargets(40, 120000)
  },
  { 
    id: 303, 
    salesRepId: 7,
    salesRepName: 'Priya Menon',
    territory: 'East Delhi',
    categoryId: 'ovd', 
    subcategory: 'Dispersive', 
    name: 'AppaGel Dispersive Plus', 
    code: 'OVD-DS-002', 
    status: 'submitted',
    submittedDate: '2025-01-26T10:00:00Z',
    monthlyTargets: generateMonthlyTargets(100, 20000)
  },
  
  // Already approved/rejected submissions
  { 
    id: 401, 
    salesRepId: 1,
    salesRepName: 'Vasanthakumar C',
    territory: 'Central Delhi',
    categoryId: 'equipment', 
    subcategory: 'Laser', 
    name: 'YAG Laser System', 
    code: 'EQ-LS-001', 
    status: 'approved',
    submittedDate: '2025-01-20T10:00:00Z',
    approvedDate: '2025-01-22T15:00:00Z',
    approvedBy: 'Rajesh Kumar',
    monthlyTargets: generateMonthlyTargets(2, 350000)
  },
  { 
    id: 402, 
    salesRepId: 6,
    salesRepName: 'Arun Sharma',
    territory: 'South Delhi',
    categoryId: 'iol', 
    subcategory: 'EDOF', 
    name: 'AppaFlex EDOF Premium', 
    code: 'IOL-ED-001', 
    status: 'rejected',
    submittedDate: '2025-01-18T11:00:00Z',
    rejectedDate: '2025-01-20T09:00:00Z',
    rejectedBy: 'Rajesh Kumar',
    rejectionReason: 'Target quantities need revision based on Q3 market analysis',
    monthlyTargets: generateMonthlyTargets(25, 175000)
  }
];

// Mock TBM Territory Targets (TBM's own targets to be approved by ABM)
const MockTBMTargets = [
  // Equipment
  { 
    id: 1001, 
    categoryId: 'equipment', 
    subcategory: 'Diagnostic', 
    name: 'Territory - Slit Lamp Total', 
    code: 'TBM-EQ-DG-001', 
    status: 'draft',
    monthlyTargets: generateMonthlyTargets(25, 250000)
  },
  { 
    id: 1002, 
    categoryId: 'equipment', 
    subcategory: 'Diagnostic', 
    name: 'Territory - Auto Refractometer Total', 
    code: 'TBM-EQ-DG-002', 
    status: 'draft',
    monthlyTargets: generateMonthlyTargets(18, 285000)
  },
  { 
    id: 1003, 
    categoryId: 'equipment', 
    subcategory: 'Surgical', 
    name: 'Territory - Phaco Systems Total', 
    code: 'TBM-EQ-SG-001', 
    status: 'submitted',
    submittedDate: '2025-01-25T14:00:00Z',
    monthlyTargets: generateMonthlyTargets(10, 750000)
  },
  { 
    id: 1004, 
    categoryId: 'equipment', 
    subcategory: 'Laser', 
    name: 'Territory - YAG Laser Total', 
    code: 'TBM-EQ-LS-001', 
    status: 'approved',
    approvedDate: '2025-01-22T10:00:00Z',
    approvedBy: 'Priya Sharma (ABM)',
    monthlyTargets: generateMonthlyTargets(6, 1050000)
  },
  
  // IOL
  { 
    id: 1005, 
    categoryId: 'iol', 
    subcategory: 'Hydrophilic', 
    name: 'Territory - Hydrophilic IOL Total', 
    code: 'TBM-IOL-HY-001', 
    status: 'draft',
    monthlyTargets: generateMonthlyTargets(400, 120000)
  },
  { 
    id: 1006, 
    categoryId: 'iol', 
    subcategory: 'Hydrophobic', 
    name: 'Territory - Hydrophobic IOL Total', 
    code: 'TBM-IOL-HB-001', 
    status: 'draft',
    monthlyTargets: generateMonthlyTargets(250, 200000)
  },
  { 
    id: 1007, 
    categoryId: 'iol', 
    subcategory: 'Multifocal', 
    name: 'Territory - Multifocal IOL Total', 
    code: 'TBM-IOL-MF-001', 
    status: 'submitted',
    submittedDate: '2025-01-26T11:00:00Z',
    monthlyTargets: generateMonthlyTargets(120, 360000)
  },
  { 
    id: 1008, 
    categoryId: 'iol', 
    subcategory: 'Toric', 
    name: 'Territory - Toric IOL Total', 
    code: 'TBM-IOL-TR-001', 
    status: 'rejected',
    rejectedDate: '2025-01-24T09:00:00Z',
    rejectedBy: 'Priya Sharma (ABM)',
    rejectionReason: 'Please increase Q2 targets based on new hospital partnerships',
    monthlyTargets: generateMonthlyTargets(80, 128000)
  },
  
  // OVD
  { 
    id: 1009, 
    categoryId: 'ovd', 
    subcategory: 'Cohesive', 
    name: 'Territory - Cohesive OVD Total', 
    code: 'TBM-OVD-CO-001', 
    status: 'draft',
    monthlyTargets: generateMonthlyTargets(500, 75000)
  },
  { 
    id: 1010, 
    categoryId: 'ovd', 
    subcategory: 'Dispersive', 
    name: 'Territory - Dispersive OVD Total', 
    code: 'TBM-OVD-DS-001', 
    status: 'approved',
    approvedDate: '2025-01-21T16:00:00Z',
    approvedBy: 'Priya Sharma (ABM)',
    monthlyTargets: generateMonthlyTargets(350, 70000)
  },
  
  // MIS (Revenue Only)
  { 
    id: 1011, 
    categoryId: 'mis', 
    subcategory: 'Instruments', 
    name: 'Territory - Surgical Instruments Total', 
    code: 'TBM-MIS-IN-001', 
    status: 'draft',
    monthlyTargets: generateMonthlyTargets(0, 180000)
  },
  { 
    id: 1012, 
    categoryId: 'mis', 
    subcategory: 'Consumables', 
    name: 'Territory - Consumables Total', 
    code: 'TBM-MIS-CN-001', 
    status: 'draft',
    monthlyTargets: generateMonthlyTargets(0, 95000)
  },
  
  // Others (Revenue Only)
  { 
    id: 1013, 
    categoryId: 'others', 
    subcategory: 'Services', 
    name: 'Territory - AMC Services Total', 
    code: 'TBM-OTH-SV-001', 
    status: 'submitted',
    submittedDate: '2025-01-27T10:00:00Z',
    monthlyTargets: generateMonthlyTargets(0, 120000)
  },
  { 
    id: 1014, 
    categoryId: 'others', 
    subcategory: 'Accessories', 
    name: 'Territory - Accessories Total', 
    code: 'TBM-OTH-AC-001', 
    status: 'approved',
    approvedDate: '2025-01-23T14:00:00Z',
    approvedBy: 'Priya Sharma (ABM)',
    monthlyTargets: generateMonthlyTargets(0, 55000)
  }
];

// ★ NEW — Mock TBM Individual Targets (TBM's own personal targets)
// These represent what the TBM personally commits to sell.
// The ABM uses these to track TBM performance independently of the territory roll-up.
const MockTBMIndividualTargets = [
  // Equipment
  {
    id: 5001,
    categoryId: 'equipment',
    subcategory: 'Diagnostic',
    name: 'My Target - Slit Lamp SL-700',
    code: 'IND-EQ-DG-001',
    status: 'draft',
    monthlyTargets: generateMonthlyTargets(5, 50000)
  },
  {
    id: 5002,
    categoryId: 'equipment',
    subcategory: 'Diagnostic',
    name: 'My Target - Auto Refractometer AR-500',
    code: 'IND-EQ-DG-002',
    status: 'draft',
    monthlyTargets: generateMonthlyTargets(3, 57000)
  },
  {
    id: 5003,
    categoryId: 'equipment',
    subcategory: 'Surgical',
    name: 'My Target - Phaco Machine PM-3000',
    code: 'IND-EQ-SG-001',
    status: 'submitted',
    submittedDate: '2025-01-25T14:00:00Z',
    monthlyTargets: generateMonthlyTargets(2, 150000)
  },
  {
    id: 5004,
    categoryId: 'equipment',
    subcategory: 'Laser',
    name: 'My Target - YAG Laser System',
    code: 'IND-EQ-LS-001',
    status: 'approved',
    approvedDate: '2025-01-22T10:00:00Z',
    approvedBy: 'Priya Sharma (ABM)',
    monthlyTargets: generateMonthlyTargets(1, 210000)
  },

  // IOL
  {
    id: 5005,
    categoryId: 'iol',
    subcategory: 'Hydrophilic',
    name: 'My Target - Hydrophilic IOL',
    code: 'IND-IOL-HY-001',
    status: 'draft',
    monthlyTargets: generateMonthlyTargets(80, 24000)
  },
  {
    id: 5006,
    categoryId: 'iol',
    subcategory: 'Hydrophobic',
    name: 'My Target - Hydrophobic IOL',
    code: 'IND-IOL-HB-001',
    status: 'draft',
    monthlyTargets: generateMonthlyTargets(50, 40000)
  },
  {
    id: 5007,
    categoryId: 'iol',
    subcategory: 'Multifocal',
    name: 'My Target - Multifocal IOL',
    code: 'IND-IOL-MF-001',
    status: 'submitted',
    submittedDate: '2025-01-26T11:00:00Z',
    monthlyTargets: generateMonthlyTargets(25, 72000)
  },
  {
    id: 5008,
    categoryId: 'iol',
    subcategory: 'Toric',
    name: 'My Target - Toric IOL',
    code: 'IND-IOL-TR-001',
    status: 'rejected',
    rejectedDate: '2025-01-24T09:00:00Z',
    rejectedBy: 'Priya Sharma (ABM)',
    rejectionReason: 'Please align Q3 targets with territory plan',
    monthlyTargets: generateMonthlyTargets(15, 25600)
  },

  // OVD
  {
    id: 5009,
    categoryId: 'ovd',
    subcategory: 'Cohesive',
    name: 'My Target - Cohesive OVD',
    code: 'IND-OVD-CO-001',
    status: 'draft',
    monthlyTargets: generateMonthlyTargets(100, 15000)
  },
  {
    id: 5010,
    categoryId: 'ovd',
    subcategory: 'Dispersive',
    name: 'My Target - Dispersive OVD',
    code: 'IND-OVD-DS-001',
    status: 'approved',
    approvedDate: '2025-01-21T16:00:00Z',
    approvedBy: 'Priya Sharma (ABM)',
    monthlyTargets: generateMonthlyTargets(70, 14000)
  },

  // MIS (Revenue Only)
  {
    id: 5011,
    categoryId: 'mis',
    subcategory: 'Instruments',
    name: 'My Target - Surgical Instruments',
    code: 'IND-MIS-IN-001',
    status: 'draft',
    monthlyTargets: generateMonthlyTargets(0, 36000)
  },
  {
    id: 5012,
    categoryId: 'mis',
    subcategory: 'Consumables',
    name: 'My Target - Consumables',
    code: 'IND-MIS-CN-001',
    status: 'draft',
    monthlyTargets: generateMonthlyTargets(0, 19000)
  },

  // Others (Revenue Only)
  {
    id: 5013,
    categoryId: 'others',
    subcategory: 'Services',
    name: 'My Target - AMC Services',
    code: 'IND-OTH-SV-001',
    status: 'submitted',
    submittedDate: '2025-01-27T10:00:00Z',
    monthlyTargets: generateMonthlyTargets(0, 24000)
  },
  {
    id: 5014,
    categoryId: 'others',
    subcategory: 'Accessories',
    name: 'My Target - Accessories',
    code: 'IND-OTH-AC-001',
    status: 'approved',
    approvedDate: '2025-01-23T14:00:00Z',
    approvedBy: 'Priya Sharma (ABM)',
    monthlyTargets: generateMonthlyTargets(0, 11000)
  }
];

// ==================== TBM API SERVICE ====================

export const TBMApiService = {
  // ========== CATEGORIES ==========
  async getCategories() {
    if (USE_MOCK) {
      await delay(300);
      return [...MockCategories];
    }
    return apiRequest(TBM_API_CONFIG.endpoints.getCategories);
  },

  // ========== SALES REP SUBMISSIONS (For TBM Approval) ==========
  
  /**
   * Get all sales rep submissions pending TBM approval
   * @param {Object} filters - Optional filters { status, salesRepId, categoryId }
   */
  async getSalesRepSubmissions(filters = {}) {
    if (USE_MOCK) {
      await delay(400);
      let submissions = [...MockSalesRepSubmissions];
      
      if (filters.status) {
        submissions = submissions.filter(s => s.status === filters.status);
      }
      if (filters.salesRepId) {
        submissions = submissions.filter(s => s.salesRepId === filters.salesRepId);
      }
      if (filters.categoryId) {
        submissions = submissions.filter(s => s.categoryId === filters.categoryId);
      }
      
      return submissions;
    }
    
    const queryParams = new URLSearchParams(filters).toString();
    const url = queryParams 
      ? `${TBM_API_CONFIG.endpoints.getSalesRepSubmissions}?${queryParams}`
      : TBM_API_CONFIG.endpoints.getSalesRepSubmissions;
    return apiRequest(url);
  },

  /**
   * Approve a sales rep target
   * @param {number} submissionId - Submission ID to approve
   * @param {string} comments - Optional approval comments
   */
  async approveSalesRepTarget(submissionId, comments = '') {
    if (USE_MOCK) {
      await delay(400);
      const submission = MockSalesRepSubmissions.find(s => s.id === submissionId);
      if (submission) {
        submission.status = 'approved';
        submission.approvedDate = new Date().toISOString();
        submission.approvedBy = 'Rajesh Kumar (TBM)';
        submission.approvalComments = comments;
      }
      return { success: true, submissionId };
    }
    
    return apiRequest(TBM_API_CONFIG.endpoints.approveSalesRepTarget.replace(':id', submissionId), {
      method: 'POST',
      body: JSON.stringify({ comments })
    });
  },

  /**
   * Reject a sales rep target
   * @param {number} submissionId - Submission ID to reject
   * @param {string} reason - Rejection reason
   */
  async rejectSalesRepTarget(submissionId, reason) {
    if (USE_MOCK) {
      await delay(400);
      const submission = MockSalesRepSubmissions.find(s => s.id === submissionId);
      if (submission) {
        submission.status = 'rejected';
        submission.rejectedDate = new Date().toISOString();
        submission.rejectedBy = 'Rajesh Kumar (TBM)';
        submission.rejectionReason = reason;
      }
      return { success: true, submissionId, reason };
    }
    
    return apiRequest(TBM_API_CONFIG.endpoints.rejectSalesRepTarget.replace(':id', submissionId), {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  },

  /**
   * Bulk approve multiple sales rep targets
   * @param {number[]} submissionIds - Array of submission IDs
   * @param {string} comments - Optional approval comments
   */
  async bulkApproveSalesRepTargets(submissionIds, comments = '') {
    if (USE_MOCK) {
      await delay(600);
      const approvedDate = new Date().toISOString();
      submissionIds.forEach(id => {
        const submission = MockSalesRepSubmissions.find(s => s.id === id);
        if (submission && submission.status === 'submitted') {
          submission.status = 'approved';
          submission.approvedDate = approvedDate;
          submission.approvedBy = 'Rajesh Kumar (TBM)';
          submission.approvalComments = comments;
        }
      });
      return { 
        success: true, 
        approvedCount: submissionIds.length,
        message: `${submissionIds.length} targets approved successfully`
      };
    }
    
    return apiRequest(TBM_API_CONFIG.endpoints.bulkApproveSalesRep, {
      method: 'POST',
      body: JSON.stringify({ submissionIds, comments })
    });
  },

  // ========== TBM TERRITORY TARGETS ==========
  
  /**
   * Get TBM's territory-level targets
   * @param {Object} filters - Optional filters { status, categoryId }
   */
  async getTBMTargets(filters = {}) {
    if (USE_MOCK) {
      await delay(400);
      let targets = [...MockTBMTargets];
      
      if (filters.status) {
        targets = targets.filter(t => t.status === filters.status);
      }
      if (filters.categoryId) {
        targets = targets.filter(t => t.categoryId === filters.categoryId);
      }
      
      return targets;
    }
    
    const queryParams = new URLSearchParams(filters).toString();
    const url = queryParams 
      ? `${TBM_API_CONFIG.endpoints.getTBMTargets}?${queryParams}`
      : TBM_API_CONFIG.endpoints.getTBMTargets;
    return apiRequest(url);
  },

  /**
   * Save TBM targets as draft
   * @param {Object[]} targets - Array of target objects with updated values
   */
  async saveTBMTargets(targets) {
    if (USE_MOCK) {
      await delay(500);
      targets.forEach(updatedTarget => {
        const target = MockTBMTargets.find(t => t.id === updatedTarget.id);
        if (target) {
          target.monthlyTargets = updatedTarget.monthlyTargets;
          if (target.status === 'rejected') {
            target.status = 'draft';
          }
        }
      });
      return { 
        success: true, 
        savedCount: targets.length,
        message: 'Targets saved as draft'
      };
    }
    
    return apiRequest(TBM_API_CONFIG.endpoints.saveTBMTargets, {
      method: 'POST',
      body: JSON.stringify({ targets })
    });
  },

  /**
   * Submit TBM targets for ABM approval
   * @param {number[]} targetIds - Array of target IDs to submit
   */
  async submitTBMTargets(targetIds) {
    if (USE_MOCK) {
      await delay(500);
      const submittedDate = new Date().toISOString();
      targetIds.forEach(id => {
        const target = MockTBMTargets.find(t => t.id === id);
        if (target && (target.status === 'draft' || target.status === 'rejected')) {
          target.status = 'submitted';
          target.submittedDate = submittedDate;
        }
      });
      return { 
        success: true, 
        submittedCount: targetIds.length,
        message: `${targetIds.length} targets submitted for ABM approval`
      };
    }
    
    return apiRequest(TBM_API_CONFIG.endpoints.submitTBMTargets, {
      method: 'POST',
      body: JSON.stringify({ targetIds })
    });
  },

  /**
   * Update a single TBM target value
   * @param {number} targetId - Target ID to update
   * @param {string} month - Month key (e.g., 'apr', 'may')
   * @param {Object} values - Values to update { cyQty, cyRev }
   */
  async updateTBMTarget(targetId, month, values) {
    if (USE_MOCK) {
      await delay(200);
      const target = MockTBMTargets.find(t => t.id === targetId);
      if (target) {
        if (!target.monthlyTargets[month]) {
          target.monthlyTargets[month] = {};
        }
        target.monthlyTargets[month] = {
          ...target.monthlyTargets[month],
          ...values
        };
        if (target.status === 'rejected') {
          target.status = 'draft';
        }
      }
      return { success: true, targetId, month, values };
    }
    
    return apiRequest(`${TBM_API_CONFIG.endpoints.getTBMTargets}/${targetId}`, {
      method: 'PATCH',
      body: JSON.stringify({ month, values })
    });
  },

  // ========== ★ NEW — TBM INDIVIDUAL (PERSONAL) TARGETS ==========

  /**
   * Get TBM's individual (personal) targets
   * @param {Object} filters - Optional filters { status, categoryId }
   */
  async getTBMIndividualTargets(filters = {}) {
    if (USE_MOCK) {
      await delay(400);
      let targets = [...MockTBMIndividualTargets];

      if (filters.status) {
        targets = targets.filter(t => t.status === filters.status);
      }
      if (filters.categoryId) {
        targets = targets.filter(t => t.categoryId === filters.categoryId);
      }

      return targets;
    }

    const queryParams = new URLSearchParams(filters).toString();
    const url = queryParams
      ? `${TBM_API_CONFIG.endpoints.getTBMIndividualTargets}?${queryParams}`
      : TBM_API_CONFIG.endpoints.getTBMIndividualTargets;
    return apiRequest(url);
  },

  /**
   * Save TBM individual targets as draft
   * @param {Object[]} targets - Array of target objects with updated values
   */
  async saveTBMIndividualTargets(targets) {
    if (USE_MOCK) {
      await delay(500);
      targets.forEach(updatedTarget => {
        const target = MockTBMIndividualTargets.find(t => t.id === updatedTarget.id);
        if (target) {
          target.monthlyTargets = updatedTarget.monthlyTargets;
          if (target.status === 'rejected') {
            target.status = 'draft';
          }
        }
      });
      return {
        success: true,
        savedCount: targets.length,
        message: 'Individual targets saved as draft'
      };
    }

    return apiRequest(TBM_API_CONFIG.endpoints.saveTBMIndividualTargets, {
      method: 'POST',
      body: JSON.stringify({ targets })
    });
  },

  /**
   * Submit TBM individual targets for ABM approval
   * @param {number[]} targetIds - Array of target IDs to submit
   */
  async submitTBMIndividualTargets(targetIds) {
    if (USE_MOCK) {
      await delay(500);
      const submittedDate = new Date().toISOString();
      targetIds.forEach(id => {
        const target = MockTBMIndividualTargets.find(t => t.id === id);
        if (target && (target.status === 'draft' || target.status === 'rejected')) {
          target.status = 'submitted';
          target.submittedDate = submittedDate;
        }
      });
      return {
        success: true,
        submittedCount: targetIds.length,
        message: `${targetIds.length} individual targets submitted for ABM approval`
      };
    }

    return apiRequest(TBM_API_CONFIG.endpoints.submitTBMIndividualTargets, {
      method: 'POST',
      body: JSON.stringify({ targetIds })
    });
  },

  /**
   * Update a single TBM individual target value
   * @param {number} targetId - Target ID to update
   * @param {string} month - Month key (e.g., 'apr', 'may')
   * @param {Object} values - Values to update { cyQty, cyRev }
   */
  async updateTBMIndividualTarget(targetId, month, values) {
    if (USE_MOCK) {
      await delay(200);
      const target = MockTBMIndividualTargets.find(t => t.id === targetId);
      if (target) {
        if (!target.monthlyTargets[month]) {
          target.monthlyTargets[month] = {};
        }
        target.monthlyTargets[month] = {
          ...target.monthlyTargets[month],
          ...values
        };
        if (target.status === 'rejected') {
          target.status = 'draft';
        }
      }
      return { success: true, targetId, month, values };
    }

    return apiRequest(`${TBM_API_CONFIG.endpoints.getTBMIndividualTargets}/${targetId}`, {
      method: 'PATCH',
      body: JSON.stringify({ month, values })
    });
  },

  // ========== DASHBOARD STATISTICS ==========
  
  /**
   * Get TBM dashboard statistics
   */
  async getDashboardStats() {
    if (USE_MOCK) {
      await delay(300);
      
      // Calculate sales rep submission stats
      const salesRepStats = {
        total: MockSalesRepSubmissions.length,
        pending: MockSalesRepSubmissions.filter(s => s.status === 'submitted').length,
        approved: MockSalesRepSubmissions.filter(s => s.status === 'approved').length,
        rejected: MockSalesRepSubmissions.filter(s => s.status === 'rejected').length,
        uniqueSalesReps: [...new Set(MockSalesRepSubmissions.map(s => s.salesRepId))].length
      };
      
      // Calculate TBM territory stats
      const tbmStats = {
        total: MockTBMTargets.length,
        draft: MockTBMTargets.filter(t => t.status === 'draft').length,
        submitted: MockTBMTargets.filter(t => t.status === 'submitted').length,
        approved: MockTBMTargets.filter(t => t.status === 'approved').length,
        rejected: MockTBMTargets.filter(t => t.status === 'rejected').length
      };

      // ★ NEW — Calculate TBM individual stats
      const tbmIndividualStats = {
        total: MockTBMIndividualTargets.length,
        draft: MockTBMIndividualTargets.filter(t => t.status === 'draft').length,
        submitted: MockTBMIndividualTargets.filter(t => t.status === 'submitted').length,
        approved: MockTBMIndividualTargets.filter(t => t.status === 'approved').length,
        rejected: MockTBMIndividualTargets.filter(t => t.status === 'rejected').length
      };
      
      // Calculate totals
      const calculateTotals = (items) => {
        let lyQty = 0, cyQty = 0, lyRev = 0, cyRev = 0;
        items.forEach(item => {
          if (item.monthlyTargets) {
            Object.values(item.monthlyTargets).forEach(m => {
              lyQty += m.lyQty || 0;
              cyQty += m.cyQty || 0;
              lyRev += m.lyRev || 0;
              cyRev += m.cyRev || 0;
            });
          }
        });
        return { lyQty, cyQty, lyRev, cyRev };
      };
      
      return {
        salesRepSubmissions: salesRepStats,
        tbmTargets: tbmStats,
        tbmIndividualTargets: tbmIndividualStats, // ★ NEW
        salesRepTotals: calculateTotals(MockSalesRepSubmissions),
        tbmTotals: calculateTotals(MockTBMTargets),
        tbmIndividualTotals: calculateTotals(MockTBMIndividualTargets) // ★ NEW
      };
    }
    
    return apiRequest(TBM_API_CONFIG.endpoints.getTBMDashboardStats);
  },

  // ========== UTILITY METHODS ==========
  
  /**
   * Get unique sales reps from submissions
   */
  async getUniqueSalesReps() {
    if (USE_MOCK) {
      await delay(200);
      const salesReps = {};
      MockSalesRepSubmissions.forEach(s => {
        if (!salesReps[s.salesRepId]) {
          salesReps[s.salesRepId] = {
            id: s.salesRepId,
            name: s.salesRepName,
            territory: s.territory
          };
        }
      });
      return Object.values(salesReps);
    }
    
    const submissions = await this.getSalesRepSubmissions();
    const salesReps = {};
    submissions.forEach(s => {
      if (!salesReps[s.salesRepId]) {
        salesReps[s.salesRepId] = {
          id: s.salesRepId,
          name: s.salesRepName,
          territory: s.territory
        };
      }
    });
    return Object.values(salesReps);
  }
};

Object.assign(TBMApiService, teamTargetMethods);

export default TBMApiService;
