/**
 * ABM API Service — with TBM → Sales Rep drill-down data
 * ABM manages TBMs. Each TBM has Sales Reps under them.
 * ABM sets targets for TBMs, and has READ-ONLY visibility of TBM→SalesRep targets.
 * 
 * @version 2.0.0
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
 * TBM → Sales Rep hierarchy data
 * Each TBM has multiple Sales Reps. ABM can drill down to see this.
 */
const MockTBMHierarchy = [
  {
    id: 'tbm_001', name: 'Rajesh Kumar', territory: 'North Zone',
    salesReps: [
      { id: 'sr_001', name: 'Vasanthakumar C', territory: 'Central Delhi', yearlyTarget: 1200000, lyAchieved: 1050000,
        products: [
          { productName: 'Monofocal IOL Standard', categoryId: 'iol', monthlyTargets: genTargets(50, 18000) },
          { productName: 'Viscoelastic Gel Pro', categoryId: 'ovd', monthlyTargets: genTargets(80, 12000) },
          { productName: 'Antibiotic Eye Drops', categoryId: 'pharma', monthlyTargets: genTargets(120, 3000) },
        ]
      },
      { id: 'sr_002', name: 'Arun Prasad', territory: 'South Delhi', yearlyTarget: 1500000, lyAchieved: 1320000,
        products: [
          { productName: 'Monofocal IOL Standard', categoryId: 'iol', monthlyTargets: genTargets(65, 20000) },
          { productName: 'Multifocal IOL Premium', categoryId: 'iol', monthlyTargets: genTargets(25, 75000) },
          { productName: 'Viscoelastic Gel Pro', categoryId: 'ovd', monthlyTargets: genTargets(100, 15000) },
        ]
      },
      { id: 'sr_003', name: 'Meena Kumari', territory: 'East Delhi', yearlyTarget: 900000, lyAchieved: 870000,
        products: [
          { productName: 'Antibiotic Eye Drops', categoryId: 'pharma', monthlyTargets: genTargets(200, 5000) },
          { productName: 'Anti-inflammatory Drops', categoryId: 'pharma', monthlyTargets: genTargets(150, 4000) },
        ]
      }
    ]
  },
  {
    id: 'tbm_002', name: 'Suresh Menon', territory: 'South Zone',
    salesReps: [
      { id: 'sr_004', name: 'Priya Nair', territory: 'Chennai Central', yearlyTarget: 1800000, lyAchieved: 1650000,
        products: [
          { productName: 'Phaco Machine A1', categoryId: 'equipment', monthlyTargets: genTargets(3, 120000) },
          { productName: 'Monofocal IOL Standard', categoryId: 'iol', monthlyTargets: genTargets(90, 25000) },
          { productName: 'Toric IOL Astig-Correct', categoryId: 'iol', monthlyTargets: genTargets(30, 90000) },
        ]
      },
      { id: 'sr_005', name: 'Karthik Rajan', territory: 'Chennai South', yearlyTarget: 1100000, lyAchieved: 980000,
        products: [
          { productName: 'Multifocal IOL Premium', categoryId: 'iol', monthlyTargets: genTargets(20, 60000) },
          { productName: 'Cohesive OVD Premium', categoryId: 'ovd', monthlyTargets: genTargets(60, 10000) },
        ]
      }
    ]
  },
  {
    id: 'tbm_003', name: 'Vikram Patel', territory: 'West Zone',
    salesReps: [
      { id: 'sr_006', name: 'Amit Joshi', territory: 'Mumbai West', yearlyTarget: 2000000, lyAchieved: 1780000,
        products: [
          { productName: 'Phaco Machine A1', categoryId: 'equipment', monthlyTargets: genTargets(4, 150000) },
          { productName: 'Slit Lamp SL-200', categoryId: 'equipment', monthlyTargets: genTargets(5, 90000) },
          { productName: 'Monofocal IOL Standard', categoryId: 'iol', monthlyTargets: genTargets(100, 30000) },
        ]
      },
      { id: 'sr_007', name: 'Neha Desai', territory: 'Mumbai East', yearlyTarget: 800000, lyAchieved: 720000,
        products: [
          { productName: 'Viscoelastic Gel Pro', categoryId: 'ovd', monthlyTargets: genTargets(120, 18000) },
          { productName: 'Antibiotic Eye Drops', categoryId: 'pharma', monthlyTargets: genTargets(180, 4500) },
        ]
      }
    ]
  }
];

/** TBM territory-level submissions to ABM */
const MockTBMSubmissions = [
  { id: 'ts1', tbmId: 'tbm_001', tbmName: 'Rajesh Kumar', territory: 'North Zone', productId: 'iol_001', productName: 'Monofocal IOL Standard', categoryId: 'iol', status: 'submitted', submittedDate: '2025-03-15', monthlyTargets: genTargets(250, 75000) },
  { id: 'ts2', tbmId: 'tbm_001', tbmName: 'Rajesh Kumar', territory: 'North Zone', productId: 'ovd_001', productName: 'Viscoelastic Gel Pro', categoryId: 'ovd', status: 'submitted', submittedDate: '2025-03-15', monthlyTargets: genTargets(300, 45000) },
  { id: 'ts3', tbmId: 'tbm_001', tbmName: 'Rajesh Kumar', territory: 'North Zone', productId: 'pharma_001', productName: 'Antibiotic Eye Drops', categoryId: 'pharma', status: 'approved', submittedDate: '2025-03-10', monthlyTargets: genTargets(500, 12000) },
  { id: 'ts4', tbmId: 'tbm_002', tbmName: 'Suresh Menon', territory: 'South Zone', productId: 'eq_001', productName: 'Phaco Machine A1', categoryId: 'equipment', status: 'submitted', submittedDate: '2025-03-14', monthlyTargets: genTargets(10, 400000) },
  { id: 'ts5', tbmId: 'tbm_002', tbmName: 'Suresh Menon', territory: 'South Zone', productId: 'iol_001', productName: 'Monofocal IOL Standard', categoryId: 'iol', status: 'submitted', submittedDate: '2025-03-14', monthlyTargets: genTargets(320, 85000) },
  { id: 'ts6', tbmId: 'tbm_002', tbmName: 'Suresh Menon', territory: 'South Zone', productId: 'iol_002', productName: 'Multifocal IOL Premium', categoryId: 'iol', status: 'approved', submittedDate: '2025-03-12', monthlyTargets: genTargets(100, 280000) },
  { id: 'ts7', tbmId: 'tbm_003', tbmName: 'Vikram Patel', territory: 'West Zone', productId: 'eq_001', productName: 'Phaco Machine A1', categoryId: 'equipment', status: 'submitted', submittedDate: '2025-03-16', monthlyTargets: genTargets(6, 300000) },
  { id: 'ts8', tbmId: 'tbm_003', tbmName: 'Vikram Patel', territory: 'West Zone', productId: 'iol_001', productName: 'Monofocal IOL Standard', categoryId: 'iol', status: 'approved', submittedDate: '2025-03-11', monthlyTargets: genTargets(200, 65000) },
];

/** ABM area-level targets */
const MockABMTargets = [
  { id: 'at1', productId: 'eq_001', productName: 'Phaco Machine A1', categoryId: 'equipment', unit: 'Units', status: 'draft', monthlyTargets: genTargets(30, 1200000) },
  { id: 'at2', productId: 'eq_002', productName: 'Slit Lamp SL-200', categoryId: 'equipment', unit: 'Units', status: 'draft', monthlyTargets: genTargets(15, 450000) },
  { id: 'at3', productId: 'iol_001', productName: 'Monofocal IOL Standard', categoryId: 'iol', unit: 'Units', status: 'draft', monthlyTargets: genTargets(800, 200000) },
  { id: 'at4', productId: 'iol_002', productName: 'Multifocal IOL Premium', categoryId: 'iol', unit: 'Units', status: 'draft', monthlyTargets: genTargets(300, 750000) },
  { id: 'at5', productId: 'iol_003', productName: 'Toric IOL Astig-Correct', categoryId: 'iol', unit: 'Units', status: 'draft', monthlyTargets: genTargets(120, 480000) },
  { id: 'at6', productId: 'ovd_001', productName: 'Viscoelastic Gel Pro', categoryId: 'ovd', unit: 'Units', status: 'draft', monthlyTargets: genTargets(1000, 150000) },
  { id: 'at7', productId: 'pharma_001', productName: 'Antibiotic Eye Drops', categoryId: 'pharma', unit: 'Units', status: 'draft', monthlyTargets: genTargets(1500, 35000) },
  { id: 'at8', productId: 'mis_001', productName: 'Service Contracts', categoryId: 'mis', unit: '₹', status: 'draft', monthlyTargets: genTargets(0, 500000) },
  { id: 'at9', productId: 'others_001', productName: 'Accessories & Consumables', categoryId: 'others', unit: '₹', status: 'draft', monthlyTargets: genTargets(0, 200000) },
];

// ==================== ABM API SERVICE ====================

export const ABMApiService = {

  async getCategories() {
    if (USE_MOCK) { await delay(300); return [...MockCategories]; }
    return apiRequest('/categories');
  },

  async getTBMSubmissions() {
    if (USE_MOCK) { await delay(500); return MockTBMSubmissions.map(s => ({ ...s })); }
    return apiRequest('/abm/tbm-submissions');
  },

  async approveTBMTarget(submissionId, corrections = null) {
    if (USE_MOCK) {
      await delay(400);
      const idx = MockTBMSubmissions.findIndex(s => s.id === submissionId);
      if (idx !== -1) {
        MockTBMSubmissions[idx].status = 'approved';
        if (corrections) Object.entries(corrections).forEach(([m, v]) => { if (MockTBMSubmissions[idx].monthlyTargets[m]) Object.assign(MockTBMSubmissions[idx].monthlyTargets[m], v); });
      }
      return { success: true };
    }
    return apiRequest(`/abm/approve-tbm/${submissionId}`, { method: 'PUT', body: JSON.stringify({ corrections }) });
  },

  async bulkApproveTBM(submissionIds) {
    if (USE_MOCK) {
      await delay(600);
      submissionIds.forEach(id => { const idx = MockTBMSubmissions.findIndex(s => s.id === id); if (idx !== -1) MockTBMSubmissions[idx].status = 'approved'; });
      return { success: true, approvedCount: submissionIds.length };
    }
    return apiRequest('/abm/bulk-approve-tbm', { method: 'POST', body: JSON.stringify({ submissionIds }) });
  },

  async getABMTargets() {
    if (USE_MOCK) { await delay(400); return MockABMTargets.map(t => ({ ...t })); }
    return apiRequest('/abm/area-targets');
  },

  async saveABMTargets(targets) {
    if (USE_MOCK) { await delay(400); return { success: true }; }
    return apiRequest('/abm/area-targets/save', { method: 'PUT', body: JSON.stringify({ targets }) });
  },

  async submitABMTargets(targetIds) {
    if (USE_MOCK) {
      await delay(500);
      targetIds.forEach(id => { const idx = MockABMTargets.findIndex(t => t.id === id); if (idx !== -1) { MockABMTargets[idx].status = 'submitted'; } });
      return { success: true };
    }
    return apiRequest('/abm/area-targets/submit', { method: 'POST', body: JSON.stringify({ targetIds }) });
  },

  /**
   * ★ NEW — Get TBM hierarchy with Sales Reps and their targets
   * ABM has READ-ONLY visibility into TBM → Sales Rep target breakdown
   * 
   * GET /abm/tbm-hierarchy
   * Response: [{ id, name, territory, salesReps: [{ id, name, territory, yearlyTarget, lyAchieved, products: [...] }] }]
   */
  async getTBMHierarchy() {
    if (USE_MOCK) { await delay(600); return JSON.parse(JSON.stringify(MockTBMHierarchy)); }
    return apiRequest('/abm/tbm-hierarchy');
  },

  async getABMDashboardStats() {
    if (USE_MOCK) {
      await delay(300);
      return {
        tbmSubmissions: { total: MockTBMSubmissions.length, pending: MockTBMSubmissions.filter(s => s.status === 'submitted').length, approved: MockTBMSubmissions.filter(s => s.status === 'approved').length },
        tbmCount: MockTBMHierarchy.length,
        totalSalesReps: MockTBMHierarchy.reduce((sum, tbm) => sum + tbm.salesReps.length, 0),
      };
    }
    return apiRequest('/abm/dashboard-stats');
  },

  async getUniqueTBMs() {
    if (USE_MOCK) {
      await delay(200);
      return MockTBMHierarchy.map(t => ({ id: t.id, name: t.name, territory: t.territory }));
    }
    const subs = await this.getTBMSubmissions();
    const m = {};
    subs.forEach(s => { if (!m[s.tbmId]) m[s.tbmId] = { id: s.tbmId, name: s.tbmName, territory: s.territory }; });
    return Object.values(m);
  }
};

export default ABMApiService;
