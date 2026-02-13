/**
 * ZBM API Service — Zonal Business Manager
 * 
 * ZBM manages ABMs. Each ABM has TBMs under them, and each TBM has Sales Reps.
 * ZBM reviews/approves ABM area-level submissions.
 * ZBM has READ-ONLY drill-down visibility: ABM → TBM → Sales Rep → Product Targets
 * 
 * HIERARCHY: Sales Rep → TBM → ABM → ZBM → Sales Head
 * 
 * BACKEND INTEGRATION:
 * - Set USE_MOCK = false and update BASE_URL when backend is ready
 * - All mock data arrays will be replaced by real API calls
 * - Endpoint shapes documented in JSDoc comments
 * 
 * @author Appasamy Associates - Product Commitment PWA
 * @version 1.0.0
 */

const USE_MOCK = process.env.REACT_APP_USE_MOCK !== 'false';
const BASE_URL = process.env.REACT_APP_API_URL || 'https://api.appasamy.com/v1';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getAuthHeaders = () => {
  const token = localStorage.getItem('appasamy_token');
  return { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) };
};

const apiRequest = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, { headers: getAuthHeaders(), ...options });
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
};

// ==================== MOCK DATA ====================

const MockCategories = [
  { id: 'equipment', name: 'Equipment', icon: 'fa-microscope', color: 'equipment', isRevenueOnly: false },
  { id: 'iol', name: 'IOL', icon: 'fa-eye', color: 'iol', isRevenueOnly: false },
  { id: 'ovd', name: 'OVD', icon: 'fa-tint', color: 'ovd', isRevenueOnly: false },
  { id: 'pharma', name: 'Pharma', icon: 'fa-pills', color: 'pharma', isRevenueOnly: false },
  { id: 'mis', name: 'MIS', icon: 'fa-chart-line', color: 'mis', isRevenueOnly: true },
  { id: 'others', name: 'Others', icon: 'fa-boxes', color: 'others', isRevenueOnly: true }
];

const genTargets = (baseQty, baseRev) => {
  const months = ['apr','may','jun','jul','aug','sep','oct','nov','dec','jan','feb','mar'];
  const t = {};
  months.forEach(m => {
    const v = 0.7 + Math.random() * 0.6;
    const lyQ = Math.round(baseQty * v), lyR = Math.round(baseRev * v);
    t[m] = { lyQty: lyQ, cyQty: Math.round(lyQ * (1 + Math.random()*0.3-0.05)), lyRev: lyR, cyRev: Math.round(lyR * (1 + Math.random()*0.3-0.05)) };
  });
  return t;
};

/**
 * ABM Submissions — Area-level targets submitted by ABMs to ZBM for approval
 * Each submission represents one product's area-level monthly targets from an ABM
 */
const MockABMSubmissions = [
  // ABM 1: Priya Sharma - Delhi NCR Area
  { id: 'zs1', abmId: 'abm1', abmName: 'Priya Sharma', territory: 'Delhi NCR', productId: 'eq_001', productName: 'Slit Lamp SL-700', categoryId: 'equipment', unit: 'Units', status: 'submitted', submittedAt: '2025-02-08', monthlyTargets: genTargets(20, 5700000) },
  { id: 'zs2', abmId: 'abm1', abmName: 'Priya Sharma', territory: 'Delhi NCR', productId: 'iol_001', productName: 'Monofocal Lens MF-100', categoryId: 'iol', unit: 'Units', status: 'submitted', submittedAt: '2025-02-08', monthlyTargets: genTargets(800, 400000) },
  { id: 'zs3', abmId: 'abm1', abmName: 'Priya Sharma', territory: 'Delhi NCR', productId: 'ovd_001', productName: 'Viscoelastic Gel Pro', categoryId: 'ovd', unit: 'Units', status: 'approved', submittedAt: '2025-02-06', monthlyTargets: genTargets(600, 90000) },
  { id: 'zs4', abmId: 'abm1', abmName: 'Priya Sharma', territory: 'Delhi NCR', productId: 'pharma_001', productName: 'Antibiotic Eye Drops', categoryId: 'pharma', unit: 'Units', status: 'submitted', submittedAt: '2025-02-08', monthlyTargets: genTargets(1200, 28000) },

  // ABM 2: Suresh Menon - Rajasthan Area
  { id: 'zs5', abmId: 'abm2', abmName: 'Suresh Menon', territory: 'Rajasthan', productId: 'eq_002', productName: 'Auto Refractometer AR-800', categoryId: 'equipment', unit: 'Units', status: 'submitted', submittedAt: '2025-02-07', monthlyTargets: genTargets(15, 6300000) },
  { id: 'zs6', abmId: 'abm2', abmName: 'Suresh Menon', territory: 'Rajasthan', productId: 'iol_002', productName: 'Toric Premium Lens TP-200', categoryId: 'iol', unit: 'Units', status: 'approved', submittedAt: '2025-02-05', monthlyTargets: genTargets(500, 750000) },
  { id: 'zs7', abmId: 'abm2', abmName: 'Suresh Menon', territory: 'Rajasthan', productId: 'pharma_002', productName: 'Lubricant Eye Drops', categoryId: 'pharma', unit: 'Units', status: 'submitted', submittedAt: '2025-02-07', monthlyTargets: genTargets(900, 22000) },

  // ABM 3: Kavitha Reddy - Punjab & Haryana Area
  { id: 'zs8', abmId: 'abm3', abmName: 'Kavitha Reddy', territory: 'Punjab & Haryana', productId: 'eq_003', productName: 'Non-Contact Tonometer NCT-200', categoryId: 'equipment', unit: 'Units', status: 'approved', submittedAt: '2025-02-04', monthlyTargets: genTargets(12, 6300000) },
  { id: 'zs9', abmId: 'abm3', abmName: 'Kavitha Reddy', territory: 'Punjab & Haryana', productId: 'iol_001', productName: 'Monofocal Lens MF-100', categoryId: 'iol', unit: 'Units', status: 'submitted', submittedAt: '2025-02-09', monthlyTargets: genTargets(650, 325000) },
  { id: 'zs10', abmId: 'abm3', abmName: 'Kavitha Reddy', territory: 'Punjab & Haryana', productId: 'ovd_001', productName: 'Viscoelastic Gel Pro', categoryId: 'ovd', unit: 'Units', status: 'submitted', submittedAt: '2025-02-09', monthlyTargets: genTargets(450, 67500) },
  { id: 'zs11', abmId: 'abm3', abmName: 'Kavitha Reddy', territory: 'Punjab & Haryana', productId: 'mis_001', productName: 'Service Contracts', categoryId: 'mis', unit: '₹', status: 'approved', submittedAt: '2025-02-03', monthlyTargets: genTargets(0, 400000) },
];

/**
 * ABM → TBM → Sales Rep Hierarchy for ZBM Drill-Down
 * ZBM can see the full hierarchy under their zone
 */
const MockABMHierarchy = [
  {
    id: 'abm1', name: 'Priya Sharma', territory: 'Delhi NCR', designation: 'ABM',
    tbms: [
      {
        id: 'tbm1', name: 'Rajesh Kumar', territory: 'North Delhi', designation: 'TBM',
        salesReps: [
          {
            id: 'sr1', name: 'Vasanthakumar C', territory: 'Central Delhi', designation: 'Sales Rep',
            yearlyTarget: 24500, lyAchieved: 22180,
            products: [
              { productId: 'eq_001', productName: 'Slit Lamp SL-700', categoryId: 'equipment', monthlyTargets: genTargets(5, 1425000) },
              { productId: 'iol_001', productName: 'Monofocal Lens MF-100', categoryId: 'iol', monthlyTargets: genTargets(200, 100000) },
            ]
          },
          {
            id: 'sr2', name: 'Deepak Verma', territory: 'West Delhi', designation: 'Sales Rep',
            yearlyTarget: 21000, lyAchieved: 19500,
            products: [
              { productId: 'eq_002', productName: 'Auto Refractometer AR-800', categoryId: 'equipment', monthlyTargets: genTargets(4, 1680000) },
              { productId: 'pharma_001', productName: 'Antibiotic Eye Drops', categoryId: 'pharma', monthlyTargets: genTargets(300, 7000) },
            ]
          }
        ]
      },
      {
        id: 'tbm2', name: 'Anita Singh', territory: 'South Delhi', designation: 'TBM',
        salesReps: [
          {
            id: 'sr3', name: 'Manoj Tiwari', territory: 'South Delhi Central', designation: 'Sales Rep',
            yearlyTarget: 18000, lyAchieved: 17200,
            products: [
              { productId: 'iol_002', productName: 'Toric Premium Lens TP-200', categoryId: 'iol', monthlyTargets: genTargets(150, 225000) },
              { productId: 'ovd_001', productName: 'Viscoelastic Gel Pro', categoryId: 'ovd', monthlyTargets: genTargets(200, 30000) },
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'abm2', name: 'Suresh Menon', territory: 'Rajasthan', designation: 'ABM',
    tbms: [
      {
        id: 'tbm3', name: 'Vikram Shekhawat', territory: 'Jaipur', designation: 'TBM',
        salesReps: [
          {
            id: 'sr4', name: 'Ramesh Meena', territory: 'Jaipur City', designation: 'Sales Rep',
            yearlyTarget: 16000, lyAchieved: 14800,
            products: [
              { productId: 'eq_003', productName: 'Non-Contact Tonometer NCT-200', categoryId: 'equipment', monthlyTargets: genTargets(3, 1575000) },
              { productId: 'iol_001', productName: 'Monofocal Lens MF-100', categoryId: 'iol', monthlyTargets: genTargets(180, 90000) },
            ]
          },
          {
            id: 'sr5', name: 'Sanjay Kumawat', territory: 'Jaipur Rural', designation: 'Sales Rep',
            yearlyTarget: 14000, lyAchieved: 13200,
            products: [
              { productId: 'pharma_002', productName: 'Lubricant Eye Drops', categoryId: 'pharma', monthlyTargets: genTargets(350, 8050) },
            ]
          }
        ]
      },
      {
        id: 'tbm4', name: 'Neha Joshi', territory: 'Udaipur', designation: 'TBM',
        salesReps: [
          {
            id: 'sr6', name: 'Dinesh Prajapati', territory: 'Udaipur City', designation: 'Sales Rep',
            yearlyTarget: 12000, lyAchieved: 11500,
            products: [
              { productId: 'eq_001', productName: 'Slit Lamp SL-700', categoryId: 'equipment', monthlyTargets: genTargets(3, 855000) },
              { productId: 'ovd_001', productName: 'Viscoelastic Gel Pro', categoryId: 'ovd', monthlyTargets: genTargets(150, 22500) },
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'abm3', name: 'Kavitha Reddy', territory: 'Punjab & Haryana', designation: 'ABM',
    tbms: [
      {
        id: 'tbm5', name: 'Gurpreet Singh', territory: 'Chandigarh', designation: 'TBM',
        salesReps: [
          {
            id: 'sr7', name: 'Hardeep Kaur', territory: 'Chandigarh City', designation: 'Sales Rep',
            yearlyTarget: 15000, lyAchieved: 14200,
            products: [
              { productId: 'iol_002', productName: 'Toric Premium Lens TP-200', categoryId: 'iol', monthlyTargets: genTargets(120, 180000) },
              { productId: 'pharma_001', productName: 'Antibiotic Eye Drops', categoryId: 'pharma', monthlyTargets: genTargets(400, 9200) },
            ]
          },
          {
            id: 'sr8', name: 'Manpreet Gill', territory: 'Mohali', designation: 'Sales Rep',
            yearlyTarget: 13500, lyAchieved: 12800,
            products: [
              { productId: 'eq_002', productName: 'Auto Refractometer AR-800', categoryId: 'equipment', monthlyTargets: genTargets(3, 1260000) },
            ]
          }
        ]
      }
    ]
  }
];

// ==================== ZBM API SERVICE ====================

export const ZBMApiService = {

  /**
   * GET /zbm/categories
   * Returns list of product categories
   */
  async getCategories() {
    if (USE_MOCK) { await delay(300); return [...MockCategories]; }
    return apiRequest('/categories');
  },

  /**
   * GET /zbm/abm-submissions
   * Returns ABM area-level target submissions for ZBM review
   * Response: [{ id, abmId, abmName, territory, productId, productName, categoryId, unit, status, submittedAt, monthlyTargets }]
   */
  async getABMSubmissions() {
    if (USE_MOCK) { await delay(500); return MockABMSubmissions.map(s => ({ ...s })); }
    return apiRequest('/zbm/abm-submissions');
  },

  /**
   * PUT /zbm/approve-abm/:submissionId
   * Approve an ABM's area-level target submission
   * Body: { corrections?: { [month]: { cyQty?, cyRev? } } }
   */
  async approveABMTarget(submissionId, corrections = null) {
    if (USE_MOCK) {
      await delay(400);
      const idx = MockABMSubmissions.findIndex(s => s.id === submissionId);
      if (idx !== -1) {
        MockABMSubmissions[idx].status = 'approved';
        if (corrections) {
          Object.entries(corrections).forEach(([m, v]) => {
            if (MockABMSubmissions[idx].monthlyTargets[m]) {
              Object.assign(MockABMSubmissions[idx].monthlyTargets[m], v);
            }
          });
        }
      }
      return { success: true };
    }
    return apiRequest(`/zbm/approve-abm/${submissionId}`, { method: 'PUT', body: JSON.stringify({ corrections }) });
  },

  /**
   * POST /zbm/bulk-approve-abm
   * Bulk approve multiple ABM submissions
   * Body: { submissionIds: string[] }
   */
  async bulkApproveABM(submissionIds) {
    if (USE_MOCK) {
      await delay(600);
      submissionIds.forEach(id => {
        const idx = MockABMSubmissions.findIndex(s => s.id === id);
        if (idx !== -1) MockABMSubmissions[idx].status = 'approved';
      });
      return { success: true, approvedCount: submissionIds.length };
    }
    return apiRequest('/zbm/bulk-approve-abm', { method: 'POST', body: JSON.stringify({ submissionIds }) });
  },

  /**
   * GET /zbm/abm-hierarchy
   * Returns ABM → TBM → Sales Rep hierarchy with target data
   * ZBM has READ-ONLY visibility into the full chain
   * Response: [{ id, name, territory, tbms: [{ id, name, territory, salesReps: [...] }] }]
   */
  async getABMHierarchy() {
    if (USE_MOCK) { await delay(600); return JSON.parse(JSON.stringify(MockABMHierarchy)); }
    return apiRequest('/zbm/abm-hierarchy');
  },

  /**
   * GET /zbm/dashboard-stats
   * Returns dashboard summary statistics
   */
  async getZBMDashboardStats() {
    if (USE_MOCK) {
      await delay(300);
      return {
        abmSubmissions: {
          total: MockABMSubmissions.length,
          pending: MockABMSubmissions.filter(s => s.status === 'submitted').length,
          approved: MockABMSubmissions.filter(s => s.status === 'approved').length
        },
        abmCount: MockABMHierarchy.length,
        totalTBMs: MockABMHierarchy.reduce((sum, abm) => sum + abm.tbms.length, 0),
        totalSalesReps: MockABMHierarchy.reduce((sum, abm) => sum + abm.tbms.reduce((s, tbm) => s + tbm.salesReps.length, 0), 0),
      };
    }
    return apiRequest('/zbm/dashboard-stats');
  },

  /**
   * GET /zbm/unique-abms
   * Returns list of unique ABMs under this ZBM
   */
  async getUniqueABMs() {
    if (USE_MOCK) {
      await delay(200);
      return MockABMHierarchy.map(a => ({ id: a.id, name: a.name, territory: a.territory }));
    }
    const subs = await this.getABMSubmissions();
    const m = {};
    subs.forEach(s => { if (!m[s.abmId]) m[s.abmId] = { id: s.abmId, name: s.abmName, territory: s.territory }; });
    return Object.values(m);
  }
};

export default ZBMApiService;
