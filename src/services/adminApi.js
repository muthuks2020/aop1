/**
 * Admin API Service
 * Manages: Products, Hierarchy (Head → ZBM → ABM → TBM → Sales Rep), Vacant Positions
 *
 * API-READY: Set USE_MOCK = false and update BASE_URL when backend is ready.
 * All mock arrays will be replaced by real API calls.
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

// ==================== MOCK DATA: PRODUCTS ====================

let MockProducts = [
  { id: 'prod_001', name: 'Slit Lamp SL-700', code: 'EQ-DG-001', categoryId: 'equipment', subcategory: 'Diagnostic', listPrice: 285000, unit: 'Units', isActive: true, createdAt: '2024-06-01', updatedAt: '2025-01-15' },
  { id: 'prod_002', name: 'Auto Refractometer AR-800', code: 'EQ-DG-002', categoryId: 'equipment', subcategory: 'Diagnostic', listPrice: 420000, unit: 'Units', isActive: true, createdAt: '2024-06-01', updatedAt: '2025-01-15' },
  { id: 'prod_003', name: 'Non-Contact Tonometer NCT-200', code: 'EQ-DG-003', categoryId: 'equipment', subcategory: 'Diagnostic', listPrice: 525000, unit: 'Units', isActive: true, createdAt: '2024-06-01', updatedAt: '2025-01-15' },
  { id: 'prod_004', name: 'Fundus Camera FC-500', code: 'EQ-DG-004', categoryId: 'equipment', subcategory: 'Diagnostic', listPrice: 750000, unit: 'Units', isActive: true, createdAt: '2024-06-01', updatedAt: '2025-01-20' },
  { id: 'prod_005', name: 'Phaco Machine Centurion', code: 'EQ-SG-001', categoryId: 'equipment', subcategory: 'Surgical', listPrice: 1500000, unit: 'Units', isActive: true, createdAt: '2024-06-01', updatedAt: '2025-01-15' },
  { id: 'prod_006', name: 'Operating Microscope OM-900', code: 'EQ-SG-002', categoryId: 'equipment', subcategory: 'Surgical', listPrice: 800000, unit: 'Units', isActive: true, createdAt: '2024-06-01', updatedAt: '2025-01-15' },
  { id: 'prod_007', name: 'Vitrectomy System VS-400', code: 'EQ-SG-003', categoryId: 'equipment', subcategory: 'Surgical', listPrice: 2000000, unit: 'Units', isActive: false, createdAt: '2024-06-01', updatedAt: '2025-02-01' },
  { id: 'prod_008', name: 'Aurolens Standard', code: 'IOL-MF-001', categoryId: 'iol', subcategory: 'Monofocal', listPrice: 500, unit: 'Units', isActive: true, createdAt: '2024-06-01', updatedAt: '2025-01-15' },
  { id: 'prod_009', name: 'Aurolens Premium', code: 'IOL-MF-002', categoryId: 'iol', subcategory: 'Monofocal', listPrice: 750, unit: 'Units', isActive: true, createdAt: '2024-06-01', updatedAt: '2025-01-15' },
  { id: 'prod_010', name: 'Aurolens Aspheric', code: 'IOL-MF-003', categoryId: 'iol', subcategory: 'Monofocal', listPrice: 900, unit: 'Units', isActive: true, createdAt: '2024-06-01', updatedAt: '2025-01-15' },
  { id: 'prod_011', name: 'Aurovue Trifocal', code: 'IOL-MT-001', categoryId: 'iol', subcategory: 'Multifocal', listPrice: 5000, unit: 'Units', isActive: true, createdAt: '2024-06-01', updatedAt: '2025-01-15' },
  { id: 'prod_012', name: 'Aurovue EDOF', code: 'IOL-MT-002', categoryId: 'iol', subcategory: 'Multifocal', listPrice: 6000, unit: 'Units', isActive: false, createdAt: '2024-06-01', updatedAt: '2025-02-01' },
  { id: 'prod_013', name: 'Aurotoric Standard', code: 'IOL-TC-001', categoryId: 'iol', subcategory: 'Toric', listPrice: 2400, unit: 'Units', isActive: true, createdAt: '2024-06-01', updatedAt: '2025-01-15' },
  { id: 'prod_014', name: 'Aurovisc 2.0%', code: 'OVD-CO-001', categoryId: 'ovd', subcategory: 'Cohesive', listPrice: 150, unit: 'Units', isActive: true, createdAt: '2024-06-01', updatedAt: '2025-01-15' },
  { id: 'prod_015', name: 'Aurovisc 2.3%', code: 'OVD-CO-002', categoryId: 'ovd', subcategory: 'Cohesive', listPrice: 175, unit: 'Units', isActive: true, createdAt: '2024-06-01', updatedAt: '2025-01-15' },
  { id: 'prod_016', name: 'Aurogel Dispersive', code: 'OVD-DS-001', categoryId: 'ovd', subcategory: 'Dispersive', listPrice: 200, unit: 'Units', isActive: true, createdAt: '2024-06-01', updatedAt: '2025-01-15' },
  { id: 'prod_017', name: 'Antibiotic Eye Drops', code: 'PH-001', categoryId: 'pharma', subcategory: 'Anti-infective', listPrice: 23, unit: 'Units', isActive: true, createdAt: '2024-06-01', updatedAt: '2025-01-15' },
  { id: 'prod_018', name: 'Anti-inflammatory Drops', code: 'PH-002', categoryId: 'pharma', subcategory: 'Anti-inflammatory', listPrice: 28, unit: 'Units', isActive: true, createdAt: '2024-06-01', updatedAt: '2025-01-15' },
  { id: 'prod_019', name: 'Lubricant Eye Drops', code: 'PH-003', categoryId: 'pharma', subcategory: 'Lubricant', listPrice: 18, unit: 'Units', isActive: true, createdAt: '2024-06-01', updatedAt: '2025-01-15' },
  { id: 'prod_020', name: 'MIS Revenue', code: 'MIS-001', categoryId: 'mis', subcategory: null, listPrice: 0, unit: '₹', isActive: true, createdAt: '2024-06-01', updatedAt: '2025-01-15' },
  { id: 'prod_021', name: 'Others Revenue', code: 'OTH-001', categoryId: 'others', subcategory: null, listPrice: 0, unit: '₹', isActive: true, createdAt: '2024-06-01', updatedAt: '2025-01-15' },
];

const MockCategories = [
  { id: 'equipment', name: 'Equipment', icon: 'fa-microscope', color: '#2563EB' },
  { id: 'iol', name: 'IOL', icon: 'fa-eye', color: '#7C3AED' },
  { id: 'ovd', name: 'OVD', icon: 'fa-tint', color: '#0891B2' },
  { id: 'pharma', name: 'Pharma', icon: 'fa-pills', color: '#059669' },
  { id: 'mis', name: 'MIS', icon: 'fa-chart-line', color: '#D97706' },
  { id: 'others', name: 'Others', icon: 'fa-boxes', color: '#6B7280' },
];

// ==================== MOCK DATA: HIERARCHY ====================

/**
 * Full Organization Hierarchy
 * Sales Head → ZBMs → ABMs → TBMs → Sales Reps (+ Vacant Slots)
 *
 * A "vacant" entry has isVacant: true and a placeholder name like "Vacant - Position 1".
 * When recruitment happens, the admin updates the name and sets isVacant: false.
 * Values CAN be entered against vacant positions (for planning purposes).
 */
let MockHierarchy = [
  {
    id: 'head_001', name: 'Dr. Srinivasan', role: 'sales_head', territory: 'All India', isVacant: false,
    reportees: [
      {
        id: 'zbm_001', name: 'Amit Singh', role: 'zbm', territory: 'Northern Region', isVacant: false,
        reportees: [
          {
            id: 'abm_001', name: 'Priya Sharma', role: 'abm', territory: 'Delhi NCR', isVacant: false,
            reportees: [
              {
                id: 'tbm_001', name: 'Rajesh Kumar', role: 'tbm', territory: 'North Delhi', isVacant: false,
                reportees: [
                  { id: 'sr_001', name: 'Vasanthakumar C', role: 'sales_rep', territory: 'Central Delhi', isVacant: false, reportees: [] },
                  { id: 'sr_002', name: 'Deepak Verma', role: 'sales_rep', territory: 'West Delhi', isVacant: false, reportees: [] },
                  { id: 'sr_003', name: 'Meena Kumari', role: 'sales_rep', territory: 'East Delhi', isVacant: false, reportees: [] },
                  { id: 'sr_v01', name: 'Vacant - Position 1', role: 'sales_rep', territory: 'South Delhi', isVacant: true, reportees: [] },
                  { id: 'sr_v02', name: 'Vacant - Position 2', role: 'sales_rep', territory: 'New Delhi', isVacant: true, reportees: [] },
                ]
              },
              {
                id: 'tbm_002', name: 'Sunita Devi', role: 'tbm', territory: 'South Delhi', isVacant: false,
                reportees: [
                  { id: 'sr_004', name: 'Arun Prasad', role: 'sales_rep', territory: 'Vasant Kunj', isVacant: false, reportees: [] },
                  { id: 'sr_005', name: 'Lakshmi Rao', role: 'sales_rep', territory: 'Saket', isVacant: false, reportees: [] },
                  { id: 'sr_v03', name: 'Vacant - Position 1', role: 'sales_rep', territory: 'Mehrauli', isVacant: true, reportees: [] },
                ]
              }
            ]
          },
          {
            id: 'abm_002', name: 'Vikram Choudhary', role: 'abm', territory: 'UP West', isVacant: false,
            reportees: [
              {
                id: 'tbm_003', name: 'Nisha Gupta', role: 'tbm', territory: 'Noida', isVacant: false,
                reportees: [
                  { id: 'sr_006', name: 'Ravi Shankar', role: 'sales_rep', territory: 'Noida Sector 18', isVacant: false, reportees: [] },
                  { id: 'sr_007', name: 'Pooja Mishra', role: 'sales_rep', territory: 'Greater Noida', isVacant: false, reportees: [] },
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'zbm_002', name: 'Ramesh Patel', role: 'zbm', territory: 'Western Region', isVacant: false,
        reportees: [
          {
            id: 'abm_003', name: 'Kavitha Reddy', role: 'abm', territory: 'Maharashtra', isVacant: false,
            reportees: [
              {
                id: 'tbm_004', name: 'Suresh Menon', role: 'tbm', territory: 'Mumbai North', isVacant: false,
                reportees: [
                  { id: 'sr_008', name: 'Priya Nair', role: 'sales_rep', territory: 'Andheri', isVacant: false, reportees: [] },
                  { id: 'sr_009', name: 'Karthik Rajan', role: 'sales_rep', territory: 'Bandra', isVacant: false, reportees: [] },
                  { id: 'sr_v04', name: 'Vacant - Position 1', role: 'sales_rep', territory: 'Goregaon', isVacant: true, reportees: [] },
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'zbm_003', name: 'Suresh Kumar', role: 'zbm', territory: 'Southern Region', isVacant: false,
        reportees: [
          {
            id: 'abm_004', name: 'Anitha Deshmukh', role: 'abm', territory: 'Tamil Nadu', isVacant: false,
            reportees: [
              {
                id: 'tbm_005', name: 'Gurpreet Singh', role: 'tbm', territory: 'Chennai', isVacant: false,
                reportees: [
                  { id: 'sr_010', name: 'Hardeep Kaur', role: 'sales_rep', territory: 'Chennai Central', isVacant: false, reportees: [] },
                  { id: 'sr_011', name: 'Manpreet Gill', role: 'sales_rep', territory: 'Chennai South', isVacant: false, reportees: [] },
                ]
              },
              {
                id: 'tbm_v01', name: 'Vacant - TBM Position', role: 'tbm', territory: 'Coimbatore', isVacant: true,
                reportees: [
                  { id: 'sr_v05', name: 'Vacant - Position 1', role: 'sales_rep', territory: 'Coimbatore East', isVacant: true, reportees: [] },
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'zbm_v01', name: 'Vacant - ZBM East', role: 'zbm', territory: 'Eastern Region', isVacant: true,
        reportees: []
      }
    ]
  }
];

// ==================== ADMIN API SERVICE ====================

export const AdminApiService = {

  // ==================== PRODUCT MANAGEMENT ====================

  /**
   * GET /admin/products
   * Returns all products (active + inactive)
   */
  async getProducts() {
    if (USE_MOCK) { await delay(400); return MockProducts.map(p => ({ ...p })); }
    return apiRequest('/admin/products');
  },

  /**
   * GET /admin/categories
   * Returns all product categories
   */
  async getCategories() {
    if (USE_MOCK) { await delay(200); return [...MockCategories]; }
    return apiRequest('/admin/categories');
  },

  /**
   * POST /admin/products
   * Create a new product
   * Body: { name, code, categoryId, subcategory, listPrice, unit, isActive }
   */
  async createProduct(productData) {
    if (USE_MOCK) {
      await delay(500);
      const newProduct = {
        id: `prod_${Date.now()}`,
        ...productData,
        isActive: productData.isActive !== undefined ? productData.isActive : true,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      };
      MockProducts.push(newProduct);
      return { ...newProduct };
    }
    return apiRequest('/admin/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  /**
   * PUT /admin/products/:id
   * Update an existing product
   * Body: { name?, code?, categoryId?, subcategory?, listPrice?, unit?, isActive? }
   */
  async updateProduct(productId, updates) {
    if (USE_MOCK) {
      await delay(400);
      const idx = MockProducts.findIndex(p => p.id === productId);
      if (idx === -1) throw new Error('Product not found');
      MockProducts[idx] = { ...MockProducts[idx], ...updates, updatedAt: new Date().toISOString().split('T')[0] };
      return { ...MockProducts[idx] };
    }
    return apiRequest(`/admin/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  /**
   * PATCH /admin/products/:id/toggle-status
   * Toggle active/inactive status
   */
  async toggleProductStatus(productId) {
    if (USE_MOCK) {
      await delay(300);
      const idx = MockProducts.findIndex(p => p.id === productId);
      if (idx === -1) throw new Error('Product not found');
      MockProducts[idx].isActive = !MockProducts[idx].isActive;
      MockProducts[idx].updatedAt = new Date().toISOString().split('T')[0];
      return { ...MockProducts[idx] };
    }
    return apiRequest(`/admin/products/${productId}/toggle-status`, { method: 'PATCH' });
  },

  /**
   * DELETE /admin/products/:id
   * Delete a product (soft delete recommended on backend)
   */
  async deleteProduct(productId) {
    if (USE_MOCK) {
      await delay(400);
      MockProducts = MockProducts.filter(p => p.id !== productId);
      return { success: true };
    }
    return apiRequest(`/admin/products/${productId}`, { method: 'DELETE' });
  },

  // ==================== HIERARCHY MANAGEMENT ====================

  /**
   * GET /admin/hierarchy
   * Returns full organization tree
   */
  async getHierarchy() {
    if (USE_MOCK) {
      await delay(500);
      return JSON.parse(JSON.stringify(MockHierarchy));
    }
    return apiRequest('/admin/hierarchy');
  },

  /**
   * POST /admin/hierarchy/add-member
   * Add a new member (or vacant slot) to a parent node
   * Body: { parentId, name, role, territory, isVacant }
   */
  async addMember(memberData) {
    if (USE_MOCK) {
      await delay(400);
      const newMember = {
        id: `${memberData.role}_${Date.now()}`,
        name: memberData.name,
        role: memberData.role,
        territory: memberData.territory || '',
        isVacant: memberData.isVacant || false,
        reportees: [],
      };
      const addToParent = (nodes, parentId) => {
        for (const node of nodes) {
          if (node.id === parentId) {
            node.reportees.push(newMember);
            return true;
          }
          if (node.reportees && addToParent(node.reportees, parentId)) return true;
        }
        return false;
      };
      if (!addToParent(MockHierarchy, memberData.parentId)) {
        throw new Error('Parent not found');
      }
      return { ...newMember };
    }
    return apiRequest('/admin/hierarchy/add-member', {
      method: 'POST',
      body: JSON.stringify(memberData),
    });
  },

  /**
   * PUT /admin/hierarchy/update-member/:id
   * Update a member's details (name, territory, isVacant)
   * Used when filling a vacant position with an actual recruit
   */
  async updateMember(memberId, updates) {
    if (USE_MOCK) {
      await delay(400);
      const updateInTree = (nodes) => {
        for (const node of nodes) {
          if (node.id === memberId) {
            Object.assign(node, updates);
            return true;
          }
          if (node.reportees && updateInTree(node.reportees)) return true;
        }
        return false;
      };
      if (!updateInTree(MockHierarchy)) throw new Error('Member not found');
      return { success: true };
    }
    return apiRequest(`/admin/hierarchy/update-member/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  /**
   * DELETE /admin/hierarchy/remove-member/:id
   * Remove a member from the hierarchy
   */
  async removeMember(memberId) {
    if (USE_MOCK) {
      await delay(400);
      const removeFromTree = (nodes) => {
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].id === memberId) {
            nodes.splice(i, 1);
            return true;
          }
          if (nodes[i].reportees && removeFromTree(nodes[i].reportees)) return true;
        }
        return false;
      };
      removeFromTree(MockHierarchy);
      return { success: true };
    }
    return apiRequest(`/admin/hierarchy/remove-member/${memberId}`, { method: 'DELETE' });
  },

  /**
   * PUT /admin/hierarchy/reassign/:memberId
   * Move a member to a new parent
   * Body: { newParentId }
   */
  async reassignMember(memberId, newParentId) {
    if (USE_MOCK) {
      await delay(500);
      let removedMember = null;
      const removeFromTree = (nodes) => {
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].id === memberId) {
            removedMember = nodes.splice(i, 1)[0];
            return true;
          }
          if (nodes[i].reportees && removeFromTree(nodes[i].reportees)) return true;
        }
        return false;
      };
      const addToParent = (nodes, parentId) => {
        for (const node of nodes) {
          if (node.id === parentId) {
            node.reportees.push(removedMember);
            return true;
          }
          if (node.reportees && addToParent(node.reportees, parentId)) return true;
        }
        return false;
      };
      removeFromTree(MockHierarchy);
      if (removedMember && !addToParent(MockHierarchy, newParentId)) {
        throw new Error('New parent not found');
      }
      return { success: true };
    }
    return apiRequest(`/admin/hierarchy/reassign/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify({ newParentId }),
    });
  },

  // ==================== VACANT POSITIONS ====================

  /**
   * GET /admin/vacant-positions
   * Returns flat list of all vacant positions across hierarchy
   */
  async getVacantPositions() {
    if (USE_MOCK) {
      await delay(300);
      const vacants = [];
      const traverse = (nodes, parentName = null, path = []) => {
        for (const node of nodes) {
          if (node.isVacant) {
            vacants.push({
              id: node.id,
              name: node.name,
              role: node.role,
              territory: node.territory,
              parentName,
              path: [...path, node.name],
            });
          }
          if (node.reportees) {
            traverse(node.reportees, node.name, [...path, node.name]);
          }
        }
      };
      traverse(MockHierarchy);
      return vacants;
    }
    return apiRequest('/admin/vacant-positions');
  },

  /**
   * PUT /admin/vacant-positions/:id/fill
   * Fill a vacant position with a new recruit
   * Body: { name, territory? }
   */
  async fillVacantPosition(positionId, recruitData) {
    if (USE_MOCK) {
      await delay(400);
      const fillInTree = (nodes) => {
        for (const node of nodes) {
          if (node.id === positionId) {
            node.name = recruitData.name;
            node.isVacant = false;
            if (recruitData.territory) node.territory = recruitData.territory;
            return true;
          }
          if (node.reportees && fillInTree(node.reportees)) return true;
        }
        return false;
      };
      if (!fillInTree(MockHierarchy)) throw new Error('Position not found');
      return { success: true };
    }
    return apiRequest(`/admin/vacant-positions/${positionId}/fill`, {
      method: 'PUT',
      body: JSON.stringify(recruitData),
    });
  },
};

export default AdminApiService;
