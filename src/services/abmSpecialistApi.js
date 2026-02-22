

const USE_MOCK = process.env.REACT_APP_USE_MOCK !== 'false';
const BASE_URL = process.env.REACT_APP_API_URL || 'https://api.appasamy.com/v1';

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
  const response = await fetch(url, { headers: getAuthHeaders(), ...options });
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
};

// ==================== MOCK DATA ====================

const genTargets = (baseQty, baseRev) => {
  const months = ['apr','may','jun','jul','aug','sep','oct','nov','dec','jan','feb','mar'];
  const t = {};
  months.forEach(m => {
    const v = 0.7 + Math.random() * 0.6;
    const lyQ = Math.round(baseQty * v), lyR = Math.round(baseRev * v);
    t[m] = {
      lyQty: lyQ,
      cyQty: Math.round(lyQ * (1 + Math.random() * 0.3 - 0.05)),
      lyRev: lyR,
      cyRev: Math.round(lyR * (1 + Math.random() * 0.3 - 0.05))
    };
  });
  return t;
};

/**
 * Mock specialist submissions for ABM approval
 * Similar structure to TBM submissions
 */
let MockSpecialistSubmissions = [
  // Specialist 1 products
  { id: 'sps_1', specialistId: 'SP-001', specialistName: 'Dr. Ananya Rao', area: 'Delhi NCR', productId: 'eq_dg_001', productName: 'Slit Lamp SL-700', categoryId: 'equipment', status: 'submitted', monthlyTargets: genTargets(3, 285000) },
  { id: 'sps_2', specialistId: 'SP-001', specialistName: 'Dr. Ananya Rao', area: 'Delhi NCR', productId: 'iol_001', productName: 'Multifocal IOL Premium', categoryId: 'iol', status: 'submitted', monthlyTargets: genTargets(20, 18000) },
  { id: 'sps_3', specialistId: 'SP-001', specialistName: 'Dr. Ananya Rao', area: 'Delhi NCR', productId: 'pharma_001', productName: 'Antibiotic Eye Drops', categoryId: 'pharma', status: 'approved', monthlyTargets: genTargets(150, 250) },
  // Specialist 2 products
  { id: 'sps_4', specialistId: 'SP-002', specialistName: 'Vikram Patel', area: 'Delhi NCR', productId: 'eq_sg_001', productName: 'Phaco Machine PM-3000', categoryId: 'equipment', status: 'submitted', monthlyTargets: genTargets(1, 1250000) },
  { id: 'sps_5', specialistId: 'SP-002', specialistName: 'Vikram Patel', area: 'Delhi NCR', productId: 'ovd_001', productName: 'Viscoelastic Gel Pro', categoryId: 'ovd', status: 'submitted', monthlyTargets: genTargets(40, 1500) },
  { id: 'sps_6', specialistId: 'SP-002', specialistName: 'Vikram Patel', area: 'Delhi NCR', productId: 'mis_001', productName: 'Service Contracts', categoryId: 'mis', status: 'approved', monthlyTargets: genTargets(0, 300000) },
];

/**
 * Mock specialist list under this ABM
 */
const MockSpecialists = [
  { id: 'SP-001', employeeCode: 'SP-001', name: 'Dr. Ananya Rao', area: 'Delhi NCR', designation: 'IOL Specialist', lyTargetValue: 25000000, lyAchievedValue: 23500000, cyTargetValue: 30000000, status: 'published' },
  { id: 'SP-002', employeeCode: 'SP-002', name: 'Vikram Patel', area: 'Delhi NCR', designation: 'Equipment Specialist', lyTargetValue: 20000000, lyAchievedValue: 19200000, cyTargetValue: 0, status: 'not_set' },
];

/**
 * Mock specialist yearly targets
 */
let MockSpecialistYearlyTargets = [
  { id: 'spyt_1', assigneeCode: 'SP-001', assigneeName: 'Dr. Ananya Rao', assigneeArea: 'Delhi NCR', lyTargetValue: 25000000, lyAchievedValue: 23500000, cyTargetValue: 30000000, status: 'published' },
  { id: 'spyt_2', assigneeCode: 'SP-002', assigneeName: 'Vikram Patel', assigneeArea: 'Delhi NCR', lyTargetValue: 20000000, lyAchievedValue: 19200000, cyTargetValue: 0, status: 'not_set' },
];

// ==================== ABM SPECIALIST API METHODS ====================

const ABMSpecialistApiService = {

  /**
   * GET /abm/specialist-submissions
   * Returns all specialist target submissions for ABM review
   * @returns {Promise<Array>} Specialist submissions with monthly targets
   */
  async getSpecialistSubmissions() {
    if (USE_MOCK) {
      await delay(500);
      return MockSpecialistSubmissions.map(s => ({ ...s }));
    }
    return apiRequest('/abm/specialist-submissions');
  },

  /**
   * PUT /abm/approve-specialist/:id
   * Approve a specialist submission with optional corrections
   * @param {string} submissionId - Submission ID
   * @param {Object|null} corrections - Monthly corrections { month: { cyQty: N } }
   * @returns {Promise<Object>} { success: true }
   */
  async approveSpecialistTarget(submissionId, corrections = null) {
    if (USE_MOCK) {
      await delay(400);
      const idx = MockSpecialistSubmissions.findIndex(s => s.id === submissionId);
      if (idx !== -1) {
        MockSpecialistSubmissions[idx].status = 'approved';
        if (corrections) {
          Object.entries(corrections).forEach(([m, v]) => {
            if (MockSpecialistSubmissions[idx].monthlyTargets[m]) {
              Object.assign(MockSpecialistSubmissions[idx].monthlyTargets[m], v);
            }
          });
        }
      }
      return { success: true };
    }
    return apiRequest(`/abm/approve-specialist/${submissionId}`, {
      method: 'PUT',
      body: JSON.stringify({ corrections })
    });
  },

  /**
   * POST /abm/bulk-approve-specialist
   * Bulk approve multiple specialist submissions
   * @param {Array<string>} submissionIds - IDs to approve
   * @returns {Promise<Object>} { success: true, approvedCount: N }
   */
  async bulkApproveSpecialist(submissionIds) {
    if (USE_MOCK) {
      await delay(600);
      submissionIds.forEach(id => {
        const idx = MockSpecialistSubmissions.findIndex(s => s.id === id);
        if (idx !== -1) MockSpecialistSubmissions[idx].status = 'approved';
      });
      return { success: true, approvedCount: submissionIds.length };
    }
    return apiRequest('/abm/bulk-approve-specialist', {
      method: 'POST',
      body: JSON.stringify({ submissionIds })
    });
  },

  /**
   * GET /abm/specialists
   * Returns list of specialists under this ABM
   * @returns {Promise<Array>} Specialist list
   */
  async getSpecialists() {
    if (USE_MOCK) {
      await delay(300);
      return MockSpecialists.map(s => ({ ...s }));
    }
    return apiRequest('/abm/specialists');
  },

  /**
   * GET /abm/specialist-yearly-targets?fy=FY26_27
   * Returns yearly target assignments for specialists
   * @param {string} fiscalYear - Fiscal year code
   * @returns {Promise<Array>} Yearly target data
   */
  async getSpecialistYearlyTargets(fiscalYear) {
    if (USE_MOCK) {
      await delay(400);
      return MockSpecialistYearlyTargets.map(t => ({ ...t }));
    }
    return apiRequest(`/abm/specialist-yearly-targets?fy=${fiscalYear}`);
  },

  /**
   * POST /abm/specialist-yearly-targets/save
   * Save specialist yearly targets as draft
   * @param {Array} targets - Yearly target data
   * @returns {Promise<Object>} { success: true }
   */
  async saveSpecialistYearlyTargets(targets) {
    if (USE_MOCK) {
      await delay(400);
      MockSpecialistYearlyTargets = targets.map(t => ({ ...t, status: t.status === 'not_set' ? 'draft' : t.status }));
      return { success: true };
    }
    return apiRequest('/abm/specialist-yearly-targets/save', {
      method: 'POST',
      body: JSON.stringify({ targets })
    });
  },

  /**
   * POST /abm/specialist-yearly-targets/publish
   * Publish yearly targets to specialists
   * @param {Array} targets - Yearly target data
   * @returns {Promise<Object>} { success: true }
   */
  async publishSpecialistYearlyTargets(targets) {
    if (USE_MOCK) {
      await delay(500);
      MockSpecialistYearlyTargets = targets.map(t => ({ ...t, status: 'published' }));
      return { success: true };
    }
    return apiRequest('/abm/specialist-yearly-targets/publish', {
      method: 'POST',
      body: JSON.stringify({ targets })
    });
  },

  /**
   * GET /abm/specialist-dashboard-stats
   * Returns specialist-related dashboard stats
   * @returns {Promise<Object>} Stats
   */
  async getSpecialistDashboardStats() {
    if (USE_MOCK) {
      await delay(300);
      return {
        specialistCount: MockSpecialists.length,
        submissions: {
          total: MockSpecialistSubmissions.length,
          pending: MockSpecialistSubmissions.filter(s => s.status === 'submitted').length,
          approved: MockSpecialistSubmissions.filter(s => s.status === 'approved').length,
        },
        yearlyTargets: {
          total: MockSpecialistYearlyTargets.length,
          published: MockSpecialistYearlyTargets.filter(t => t.status === 'published').length,
          notSet: MockSpecialistYearlyTargets.filter(t => t.status === 'not_set').length,
        }
      };
    }
    return apiRequest('/abm/specialist-dashboard-stats');
  }
};

export default ABMSpecialistApiService;
