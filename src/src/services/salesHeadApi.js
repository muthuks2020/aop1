/**
 * Sales Head API Service — Product Commitment PWA
 * 
 * Sales Head is the TOP of the hierarchy:
 * Sales Rep → TBM → ABM → ZBM → Sales Head
 * 
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  BACKEND INTEGRATION GUIDE                                      ║
 * ║                                                                  ║
 * ║  1. Set REACT_APP_USE_MOCK=false in your .env file              ║
 * ║  2. Set REACT_APP_API_URL=https://your-api-server.com/api/v1   ║
 * ║  3. Implement all endpoints listed in SALESHEAD_API_CONFIG      ║
 * ║  4. Match the response shapes documented in JSDoc of each method║
 * ║  5. Auth token is auto-sent via getAuthHeaders()                ║
 * ║                                                                  ║
 * ║  Every method has:                                               ║
 * ║  - JSDoc with HTTP method + endpoint path                       ║
 * ║  - @param docs for request body/query params                    ║
 * ║  - @returns with exact response shape your backend must return  ║
 * ╚══════════════════════════════════════════════════════════════════╝
 * 
 * @author Appasamy Associates - Product Commitment PWA
 * @version 2.0.0 — Full API-ready with analytics + LY achieved
 */

// ==================== CONFIGURATION ====================

const USE_MOCK = process.env.REACT_APP_USE_MOCK !== 'false';
const BASE_URL = process.env.REACT_APP_API_URL || 'https://api.appasamy.com/v1';

/**
 * API Endpoint Configuration
 * When backend is ready, implement each of these endpoints.
 * All endpoints require Bearer token in Authorization header.
 */
export const SALESHEAD_API_CONFIG = {
  useMock: USE_MOCK,
  baseUrl: BASE_URL,
  endpoints: {
    // ---- Core Data ----
    getCategories:          'GET    /saleshead/categories',
    getZBMSubmissions:      'GET    /saleshead/zbm-submissions',
    getZBMHierarchy:        'GET    /saleshead/zbm-hierarchy',

    // ---- Approvals ----
    approveZBMTarget:       'PUT    /saleshead/approve-zbm/:submissionId',
    bulkApproveZBM:         'POST   /saleshead/bulk-approve-zbm',

    // ---- Dashboard Stats ----
    getDashboardStats:      'GET    /saleshead/dashboard-stats',
    getUniqueZBMs:          'GET    /saleshead/unique-zbms',

    // ---- Overview Charts ----
    getRegionalPerformance: 'GET    /saleshead/regional-performance',
    getMonthlyTrend:        'GET    /saleshead/monthly-trend',

    // ---- Analytics (NEW) ----
    getAnalyticsDistribution: 'GET  /saleshead/analytics/distribution?level={zone|territory|member}&zoneId=&territoryId=&metric={revenue|qty}&categories=',
    getAnalyticsComparison:   'GET  /saleshead/analytics/comparison?entityA=&entityB=&level=&metric=&categories=',
    getAchievementData:       'GET  /saleshead/analytics/achievement?level={zone|territory|member}&zoneId=&territoryId=',
  },
  timeout: 30000,
  retryAttempts: 3
};

// ==================== UTILITY FUNCTIONS ====================

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getAuthHeaders = () => {
  const token = localStorage.getItem('appasamy_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

/**
 * Generic API request with error handling
 * @param {string} endpoint - API path (e.g., '/saleshead/zbm-submissions')
 * @param {Object} options - fetch options (method, body, etc.)
 * @returns {Promise<Object>} parsed JSON response
 * @throws {Error} on HTTP errors with status code
 */
const apiRequest = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      headers: getAuthHeaders(),
      ...options
    });
    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(`API Error ${response.status}: ${response.statusText}${errorBody ? ' - ' + errorBody : ''}`);
    }
    return response.json();
  } catch (err) {
    if (err.message.startsWith('API Error')) throw err;
    throw new Error(`Network Error: ${err.message}`);
  }
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
    // lyAchQty / lyAchRev = actual achieved (88-97% of LY target)
    const achFactor = 0.88 + Math.random() * 0.09;
    t[m] = {
      lyQty: lyQ,
      cyQty: Math.round(lyQ * (1 + Math.random() * 0.3 - 0.05)),
      lyRev: lyR,
      cyRev: Math.round(lyR * (1 + Math.random() * 0.3 - 0.05)),
      lyAchQty: Math.round(lyQ * achFactor),
      lyAchRev: Math.round(lyR * achFactor)
    };
  });
  return t;
};

/**
 * ZBM Submissions — Zone-level targets submitted by ZBMs to Sales Head for approval
 *
 * RESPONSE SHAPE (each item):
 * {
 *   id: string,                    // Unique submission ID
 *   zbmId: string,                 // ZBM user ID
 *   zbmName: string,               // ZBM display name
 *   territory: string,             // Zone territory name
 *   productId: string,             // Product ID
 *   productName: string,           // Product display name
 *   categoryId: string,            // Category ID (equipment, iol, ovd, pharma, mis, others)
 *   unit: string,                  // 'Units' or '₹'
 *   status: 'submitted'|'approved',// Approval status
 *   submittedAt: string,           // ISO date string
 *   monthlyTargets: {              // 12-month target data (apr-mar)
 *     [month]: {
 *       lyQty: number,             // Last Year quantity target
 *       cyQty: number,             // Current Year quantity target
 *       lyRev: number,             // Last Year revenue target (₹)
 *       cyRev: number,             // Current Year revenue target (₹)
 *       lyAchQty: number,          // ★ Last Year ACTUAL achieved quantity
 *       lyAchRev: number           // ★ Last Year ACTUAL achieved revenue (₹)
 *     }
 *   }
 * }
 */
const MockZBMSubmissions = [
  // ZBM 1: Amit Singh - Northern Region
  { id: 'sh1', zbmId: 'zbm1', zbmName: 'Amit Singh', territory: 'Northern Region', productId: 'eq_001', productName: 'Slit Lamp SL-700', categoryId: 'equipment', unit: 'Units', status: 'submitted', submittedAt: '2025-02-10', monthlyTargets: genTargets(60, 17100000) },
  { id: 'sh2', zbmId: 'zbm1', zbmName: 'Amit Singh', territory: 'Northern Region', productId: 'iol_001', productName: 'Monofocal Lens MF-100', categoryId: 'iol', unit: 'Units', status: 'submitted', submittedAt: '2025-02-10', monthlyTargets: genTargets(2400, 1200000) },
  { id: 'sh3', zbmId: 'zbm1', zbmName: 'Amit Singh', territory: 'Northern Region', productId: 'ovd_001', productName: 'Viscoelastic Gel Pro', categoryId: 'ovd', unit: 'Units', status: 'approved', submittedAt: '2025-02-08', monthlyTargets: genTargets(1800, 270000) },
  { id: 'sh4', zbmId: 'zbm1', zbmName: 'Amit Singh', territory: 'Northern Region', productId: 'pharma_001', productName: 'Antibiotic Eye Drops', categoryId: 'pharma', unit: 'Units', status: 'submitted', submittedAt: '2025-02-10', monthlyTargets: genTargets(3600, 84000) },
  { id: 'sh5', zbmId: 'zbm1', zbmName: 'Amit Singh', territory: 'Northern Region', productId: 'mis_001', productName: 'Service Contracts', categoryId: 'mis', unit: '₹', status: 'approved', submittedAt: '2025-02-07', monthlyTargets: genTargets(0, 1200000) },

  // ZBM 2: Meera Krishnan - Southern Region
  { id: 'sh6', zbmId: 'zbm2', zbmName: 'Meera Krishnan', territory: 'Southern Region', productId: 'eq_002', productName: 'Auto Refractometer AR-800', categoryId: 'equipment', unit: 'Units', status: 'submitted', submittedAt: '2025-02-09', monthlyTargets: genTargets(45, 18900000) },
  { id: 'sh7', zbmId: 'zbm2', zbmName: 'Meera Krishnan', territory: 'Southern Region', productId: 'iol_002', productName: 'Toric Premium Lens TP-200', categoryId: 'iol', unit: 'Units', status: 'approved', submittedAt: '2025-02-06', monthlyTargets: genTargets(1500, 2250000) },
  { id: 'sh8', zbmId: 'zbm2', zbmName: 'Meera Krishnan', territory: 'Southern Region', productId: 'pharma_002', productName: 'Lubricant Eye Drops', categoryId: 'pharma', unit: 'Units', status: 'submitted', submittedAt: '2025-02-09', monthlyTargets: genTargets(2700, 66000) },
  { id: 'sh9', zbmId: 'zbm2', zbmName: 'Meera Krishnan', territory: 'Southern Region', productId: 'ovd_001', productName: 'Viscoelastic Gel Pro', categoryId: 'ovd', unit: 'Units', status: 'submitted', submittedAt: '2025-02-09', monthlyTargets: genTargets(1400, 210000) },
  { id: 'sh10', zbmId: 'zbm2', zbmName: 'Meera Krishnan', territory: 'Southern Region', productId: 'eq_003', productName: 'Non-Contact Tonometer NCT-200', categoryId: 'equipment', unit: 'Units', status: 'approved', submittedAt: '2025-02-05', monthlyTargets: genTargets(35, 18375000) },

  // ZBM 3: Rajiv Patel - Western Region
  { id: 'sh11', zbmId: 'zbm3', zbmName: 'Rajiv Patel', territory: 'Western Region', productId: 'eq_001', productName: 'Slit Lamp SL-700', categoryId: 'equipment', unit: 'Units', status: 'submitted', submittedAt: '2025-02-11', monthlyTargets: genTargets(50, 14250000) },
  { id: 'sh12', zbmId: 'zbm3', zbmName: 'Rajiv Patel', territory: 'Western Region', productId: 'iol_001', productName: 'Monofocal Lens MF-100', categoryId: 'iol', unit: 'Units', status: 'submitted', submittedAt: '2025-02-11', monthlyTargets: genTargets(2000, 1000000) },
  { id: 'sh13', zbmId: 'zbm3', zbmName: 'Rajiv Patel', territory: 'Western Region', productId: 'pharma_001', productName: 'Antibiotic Eye Drops', categoryId: 'pharma', unit: 'Units', status: 'approved', submittedAt: '2025-02-04', monthlyTargets: genTargets(3000, 70000) },
  { id: 'sh14', zbmId: 'zbm3', zbmName: 'Rajiv Patel', territory: 'Western Region', productId: 'mis_001', productName: 'Service Contracts', categoryId: 'mis', unit: '₹', status: 'submitted', submittedAt: '2025-02-11', monthlyTargets: genTargets(0, 900000) },

  // ZBM 4: Anita Deshmukh - Eastern Region
  { id: 'sh15', zbmId: 'zbm4', zbmName: 'Anita Deshmukh', territory: 'Eastern Region', productId: 'eq_002', productName: 'Auto Refractometer AR-800', categoryId: 'equipment', unit: 'Units', status: 'submitted', submittedAt: '2025-02-10', monthlyTargets: genTargets(30, 12600000) },
  { id: 'sh16', zbmId: 'zbm4', zbmName: 'Anita Deshmukh', territory: 'Eastern Region', productId: 'iol_001', productName: 'Monofocal Lens MF-100', categoryId: 'iol', unit: 'Units', status: 'submitted', submittedAt: '2025-02-10', monthlyTargets: genTargets(1800, 900000) },
  { id: 'sh17', zbmId: 'zbm4', zbmName: 'Anita Deshmukh', territory: 'Eastern Region', productId: 'ovd_001', productName: 'Viscoelastic Gel Pro', categoryId: 'ovd', unit: 'Units', status: 'approved', submittedAt: '2025-02-06', monthlyTargets: genTargets(1200, 180000) },
  { id: 'sh18', zbmId: 'zbm4', zbmName: 'Anita Deshmukh', territory: 'Eastern Region', productId: 'pharma_002', productName: 'Lubricant Eye Drops', categoryId: 'pharma', unit: 'Units', status: 'submitted', submittedAt: '2025-02-10', monthlyTargets: genTargets(2200, 54000) },
];

/**
 * Full Hierarchy: ZBM → ABM → TBM → Sales Rep for drill-down
 *
 * RESPONSE SHAPE:
 * [
 *   {
 *     id, name, territory, designation: 'ZBM',
 *     abms: [
 *       {
 *         id, name, territory, designation: 'ABM',
 *         tbms: [
 *           {
 *             id, name, territory, designation: 'TBM',
 *             salesReps: [
 *               {
 *                 id, name, territory, designation: 'Sales Rep',
 *                 yearlyTarget: number,   // CY yearly revenue target
 *                 lyAchieved: number,      // ★ LY actual achieved revenue
 *                 products: [
 *                   {
 *                     productId, productName, categoryId,
 *                     monthlyTargets: {
 *                       [month]: {
 *                         lyQty, cyQty, lyRev, cyRev,
 *                         lyAchQty, lyAchRev     // ★ actual achieved per month
 *                       }
 *                     }
 *                   }
 *                 ]
 *               }
 *             ]
 *           }
 *         ]
 *       }
 *     ]
 *   }
 * ]
 */
const MockZBMHierarchy = [
  {
    id: 'zbm1', name: 'Amit Singh', territory: 'Northern Region', designation: 'ZBM',
    abms: [
      {
        id: 'abm1', name: 'Priya Sharma', territory: 'Delhi NCR', designation: 'ABM',
        tbms: [
          {
            id: 'tbm1', name: 'Rajesh Kumar', territory: 'North Delhi', designation: 'TBM',
            salesReps: [
              { id: 'sr1', name: 'Vasanthakumar C', territory: 'Central Delhi', designation: 'Sales Rep', yearlyTarget: 24500, lyAchieved: 22180, products: [
                { productId: 'eq_001', productName: 'Slit Lamp SL-700', categoryId: 'equipment', monthlyTargets: genTargets(5, 1425000) },
                { productId: 'iol_001', productName: 'Monofocal Lens MF-100', categoryId: 'iol', monthlyTargets: genTargets(200, 100000) },
              ]},
              { id: 'sr2', name: 'Deepak Verma', territory: 'West Delhi', designation: 'Sales Rep', yearlyTarget: 21000, lyAchieved: 19500, products: [
                { productId: 'eq_002', productName: 'Auto Refractometer AR-800', categoryId: 'equipment', monthlyTargets: genTargets(4, 1680000) },
              ]},
            ]
          },
          {
            id: 'tbm2', name: 'Anita Gupta', territory: 'South Delhi', designation: 'TBM',
            salesReps: [
              { id: 'sr3', name: 'Pradeep Jain', territory: 'Greater Kailash', designation: 'Sales Rep', yearlyTarget: 18000, lyAchieved: 17600, products: [
                { productId: 'iol_001', productName: 'Monofocal Lens MF-100', categoryId: 'iol', monthlyTargets: genTargets(350, 175000) },
                { productId: 'pharma_001', productName: 'Antibiotic Eye Drops', categoryId: 'pharma', monthlyTargets: genTargets(500, 11500) },
              ]},
            ]
          }
        ]
      },
      {
        id: 'abm2', name: 'Suresh Menon', territory: 'Rajasthan', designation: 'ABM',
        tbms: [
          {
            id: 'tbm3', name: 'Vikram Rathore', territory: 'Jaipur', designation: 'TBM',
            salesReps: [
              { id: 'sr4', name: 'Anil Meena', territory: 'Jaipur City', designation: 'Sales Rep', yearlyTarget: 20000, lyAchieved: 18500, products: [
                { productId: 'eq_001', productName: 'Slit Lamp SL-700', categoryId: 'equipment', monthlyTargets: genTargets(6, 1710000) },
                { productId: 'ovd_001', productName: 'Viscoelastic Gel Pro', categoryId: 'ovd', monthlyTargets: genTargets(200, 30000) },
              ]},
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
              { id: 'sr7', name: 'Hardeep Kaur', territory: 'Chandigarh City', designation: 'Sales Rep', yearlyTarget: 15000, lyAchieved: 14200, products: [
                { productId: 'iol_002', productName: 'Toric Premium Lens TP-200', categoryId: 'iol', monthlyTargets: genTargets(120, 180000) },
              ]},
              { id: 'sr8', name: 'Manpreet Gill', territory: 'Mohali', designation: 'Sales Rep', yearlyTarget: 13500, lyAchieved: 12800, products: [
                { productId: 'eq_002', productName: 'Auto Refractometer AR-800', categoryId: 'equipment', monthlyTargets: genTargets(3, 1260000) },
              ]},
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'zbm2', name: 'Meera Krishnan', territory: 'Southern Region', designation: 'ZBM',
    abms: [
      {
        id: 'abm4', name: 'Ramesh Iyer', territory: 'Tamil Nadu', designation: 'ABM',
        tbms: [
          {
            id: 'tbm6', name: 'Karthik Subramanian', territory: 'Chennai', designation: 'TBM',
            salesReps: [
              { id: 'sr9', name: 'Lakshmi Narayanan', territory: 'Central Chennai', designation: 'Sales Rep', yearlyTarget: 22000, lyAchieved: 21500, products: [
                { productId: 'eq_001', productName: 'Slit Lamp SL-700', categoryId: 'equipment', monthlyTargets: genTargets(7, 1995000) },
                { productId: 'iol_002', productName: 'Toric Premium Lens TP-200', categoryId: 'iol', monthlyTargets: genTargets(180, 270000) },
              ]},
              { id: 'sr10', name: 'Selvam Kumar', territory: 'South Chennai', designation: 'Sales Rep', yearlyTarget: 19000, lyAchieved: 18200, products: [
                { productId: 'pharma_002', productName: 'Lubricant Eye Drops', categoryId: 'pharma', monthlyTargets: genTargets(600, 14600) },
              ]},
            ]
          }
        ]
      },
      {
        id: 'abm5', name: 'Nithya Prakash', territory: 'Karnataka', designation: 'ABM',
        tbms: [
          {
            id: 'tbm7', name: 'Ashwin Hegde', territory: 'Bangalore', designation: 'TBM',
            salesReps: [
              { id: 'sr11', name: 'Rohan Shetty', territory: 'Bangalore North', designation: 'Sales Rep', yearlyTarget: 25000, lyAchieved: 23800, products: [
                { productId: 'eq_003', productName: 'Non-Contact Tonometer NCT-200', categoryId: 'equipment', monthlyTargets: genTargets(5, 2625000) },
                { productId: 'iol_001', productName: 'Monofocal Lens MF-100', categoryId: 'iol', monthlyTargets: genTargets(300, 150000) },
              ]},
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'zbm3', name: 'Rajiv Patel', territory: 'Western Region', designation: 'ZBM',
    abms: [
      {
        id: 'abm6', name: 'Dhruv Mehta', territory: 'Gujarat', designation: 'ABM',
        tbms: [
          {
            id: 'tbm8', name: 'Jayesh Shah', territory: 'Ahmedabad', designation: 'TBM',
            salesReps: [
              { id: 'sr12', name: 'Pankaj Desai', territory: 'Ahmedabad City', designation: 'Sales Rep', yearlyTarget: 20000, lyAchieved: 19000, products: [
                { productId: 'eq_001', productName: 'Slit Lamp SL-700', categoryId: 'equipment', monthlyTargets: genTargets(5, 1425000) },
                { productId: 'ovd_001', productName: 'Viscoelastic Gel Pro', categoryId: 'ovd', monthlyTargets: genTargets(250, 37500) },
              ]},
            ]
          }
        ]
      },
      {
        id: 'abm7', name: 'Sneha Kulkarni', territory: 'Maharashtra', designation: 'ABM',
        tbms: [
          {
            id: 'tbm9', name: 'Aarav Joshi', territory: 'Pune', designation: 'TBM',
            salesReps: [
              { id: 'sr13', name: 'Vikrant Patil', territory: 'Pune City', designation: 'Sales Rep', yearlyTarget: 23000, lyAchieved: 22000, products: [
                { productId: 'iol_001', productName: 'Monofocal Lens MF-100', categoryId: 'iol', monthlyTargets: genTargets(350, 175000) },
                { productId: 'pharma_001', productName: 'Antibiotic Eye Drops', categoryId: 'pharma', monthlyTargets: genTargets(550, 12650) },
              ]},
              { id: 'sr14', name: 'Neha Deshpande', territory: 'Pune Suburbs', designation: 'Sales Rep', yearlyTarget: 17000, lyAchieved: 16500, products: [
                { productId: 'eq_002', productName: 'Auto Refractometer AR-800', categoryId: 'equipment', monthlyTargets: genTargets(3, 1260000) },
              ]},
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'zbm4', name: 'Anita Deshmukh', territory: 'Eastern Region', designation: 'ZBM',
    abms: [
      {
        id: 'abm8', name: 'Sourav Banerjee', territory: 'West Bengal', designation: 'ABM',
        tbms: [
          {
            id: 'tbm10', name: 'Debojyoti Sen', territory: 'Kolkata', designation: 'TBM',
            salesReps: [
              { id: 'sr15', name: 'Arnab Ghosh', territory: 'Kolkata North', designation: 'Sales Rep', yearlyTarget: 18000, lyAchieved: 17200, products: [
                { productId: 'eq_002', productName: 'Auto Refractometer AR-800', categoryId: 'equipment', monthlyTargets: genTargets(4, 1680000) },
                { productId: 'iol_001', productName: 'Monofocal Lens MF-100', categoryId: 'iol', monthlyTargets: genTargets(250, 125000) },
              ]},
              { id: 'sr16', name: 'Priya Mukherjee', territory: 'Kolkata South', designation: 'Sales Rep', yearlyTarget: 16000, lyAchieved: 15500, products: [
                { productId: 'ovd_001', productName: 'Viscoelastic Gel Pro', categoryId: 'ovd', monthlyTargets: genTargets(200, 30000) },
                { productId: 'pharma_002', productName: 'Lubricant Eye Drops', categoryId: 'pharma', monthlyTargets: genTargets(400, 9800) },
              ]},
            ]
          }
        ]
      },
      {
        id: 'abm9', name: 'Ajay Pradhan', territory: 'Odisha', designation: 'ABM',
        tbms: [
          {
            id: 'tbm11', name: 'Satyajit Nayak', territory: 'Bhubaneswar', designation: 'TBM',
            salesReps: [
              { id: 'sr17', name: 'Biswajit Sahoo', territory: 'Bhubaneswar City', designation: 'Sales Rep', yearlyTarget: 14000, lyAchieved: 13500, products: [
                { productId: 'iol_002', productName: 'Toric Premium Lens TP-200', categoryId: 'iol', monthlyTargets: genTargets(100, 150000) },
              ]},
            ]
          }
        ]
      }
    ]
  }
];


// ==================== SALES HEAD API SERVICE ====================

export const SalesHeadApiService = {

  // ========================
  //  CORE DATA
  // ========================

  /**
   * GET /saleshead/categories
   * @returns {Promise<Array<{id:string, name:string, icon:string, color:string, isRevenueOnly:boolean}>>}
   */
  async getCategories() {
    if (USE_MOCK) { await delay(300); return [...MockCategories]; }
    return apiRequest('/saleshead/categories');
  },

  /**
   * GET /saleshead/zbm-submissions
   * Returns all ZBM zone-level target submissions for Sales Head review.
   *
   * ★ IMPORTANT: monthlyTargets must include lyAchQty + lyAchRev for analytics.
   *
   * @returns {Promise<Array>} Array of submission objects (see MockZBMSubmissions shape above)
   */
  async getZBMSubmissions() {
    if (USE_MOCK) { await delay(500); return MockZBMSubmissions.map(s => ({ ...s })); }
    return apiRequest('/saleshead/zbm-submissions');
  },

  /**
   * GET /saleshead/zbm-hierarchy
   * Returns full organizational hierarchy: ZBM → ABM → TBM → Sales Rep → Products
   *
   * ★ IMPORTANT: Each Sales Rep must have:
   *   - yearlyTarget: number (CY yearly revenue target)
   *   - lyAchieved: number (LY actual achieved total revenue)
   *   - products[].monthlyTargets[month].lyAchQty (actual achieved qty per month)
   *   - products[].monthlyTargets[month].lyAchRev (actual achieved rev per month)
   *
   * @returns {Promise<Array>} Array of ZBM objects with nested hierarchy (see MockZBMHierarchy shape above)
   */
  async getZBMHierarchy() {
    if (USE_MOCK) { await delay(600); return JSON.parse(JSON.stringify(MockZBMHierarchy)); }
    return apiRequest('/saleshead/zbm-hierarchy');
  },

  // ========================
  //  APPROVALS
  // ========================

  /**
   * PUT /saleshead/approve-zbm/:submissionId
   * Approve a ZBM's zone-level target with optional corrections.
   *
   * @param {string} submissionId - The submission ID to approve
   * @param {Object|null} corrections - Optional monthly corrections
   *   { [month]: { cyQty?: number, cyRev?: number } }
   *   Example: { apr: { cyQty: 65, cyRev: 18500000 }, may: { cyRev: 17000000 } }
   *
   * @returns {Promise<{success:boolean}>}
   */
  async approveZBMTarget(submissionId, corrections = null) {
    if (USE_MOCK) {
      await delay(400);
      const idx = MockZBMSubmissions.findIndex(s => s.id === submissionId);
      if (idx !== -1) {
        MockZBMSubmissions[idx].status = 'approved';
        if (corrections) {
          Object.entries(corrections).forEach(([m, v]) => {
            if (MockZBMSubmissions[idx].monthlyTargets[m]) {
              Object.assign(MockZBMSubmissions[idx].monthlyTargets[m], v);
            }
          });
        }
      }
      return { success: true };
    }
    return apiRequest(`/saleshead/approve-zbm/${submissionId}`, {
      method: 'PUT',
      body: JSON.stringify({ corrections })
    });
  },

  /**
   * POST /saleshead/bulk-approve-zbm
   * Bulk approve multiple ZBM submissions at once.
   *
   * @param {string[]} submissionIds - Array of submission IDs
   * @returns {Promise<{success:boolean, approvedCount:number}>}
   */
  async bulkApproveZBM(submissionIds) {
    if (USE_MOCK) {
      await delay(600);
      submissionIds.forEach(id => {
        const idx = MockZBMSubmissions.findIndex(s => s.id === id);
        if (idx !== -1) MockZBMSubmissions[idx].status = 'approved';
      });
      return { success: true, approvedCount: submissionIds.length };
    }
    return apiRequest('/saleshead/bulk-approve-zbm', {
      method: 'POST',
      body: JSON.stringify({ submissionIds })
    });
  },

  // ========================
  //  DASHBOARD STATS
  // ========================

  /**
   * GET /saleshead/dashboard-stats
   * @returns {Promise<{
   *   zbmSubmissions: { total:number, pending:number, approved:number },
   *   zbmCount: number,
   *   totalABMs: number,
   *   totalTBMs: number,
   *   totalSalesReps: number
   * }>}
   */
  async getDashboardStats() {
    if (USE_MOCK) {
      await delay(300);
      const totalABMs = MockZBMHierarchy.reduce((s, z) => s + z.abms.length, 0);
      const totalTBMs = MockZBMHierarchy.reduce((s, z) => s + z.abms.reduce((ss, a) => ss + a.tbms.length, 0), 0);
      const totalReps = MockZBMHierarchy.reduce((s, z) => s + z.abms.reduce((ss, a) => ss + a.tbms.reduce((sss, t) => sss + t.salesReps.length, 0), 0), 0);
      return {
        zbmSubmissions: {
          total: MockZBMSubmissions.length,
          pending: MockZBMSubmissions.filter(s => s.status === 'submitted').length,
          approved: MockZBMSubmissions.filter(s => s.status === 'approved').length
        },
        zbmCount: MockZBMHierarchy.length,
        totalABMs,
        totalTBMs,
        totalSalesReps: totalReps,
      };
    }
    return apiRequest('/saleshead/dashboard-stats');
  },

  /**
   * GET /saleshead/unique-zbms
   * @returns {Promise<Array<{id:string, name:string, territory:string}>>}
   */
  async getUniqueZBMs() {
    if (USE_MOCK) {
      await delay(200);
      return MockZBMHierarchy.map(z => ({ id: z.id, name: z.name, territory: z.territory }));
    }
    return apiRequest('/saleshead/unique-zbms');
  },

  // ========================
  //  OVERVIEW CHARTS
  // ========================

  /**
   * GET /saleshead/regional-performance
   * Returns aggregated regional data for overview pie charts.
   *
   * @returns {Promise<Array<{
   *   id:string, name:string, territory:string,
   *   lyRev:number, cyRev:number, lyAchRev:number,
   *   abmCount:number, tbmCount:number, repCount:number
   * }>>}
   */
  async getRegionalPerformance() {
    if (USE_MOCK) {
      await delay(400);
      return MockZBMHierarchy.map(zbm => {
        let lyRev = 0, cyRev = 0, lyAchRev = 0;
        const zbmSubs = MockZBMSubmissions.filter(s => s.zbmId === zbm.id);
        zbmSubs.forEach(s => {
          if (s.monthlyTargets) {
            Object.values(s.monthlyTargets).forEach(m => {
              lyRev += m.lyRev || 0;
              cyRev += m.cyRev || 0;
              lyAchRev += m.lyAchRev || 0;
            });
          }
        });
        return {
          id: zbm.id,
          name: zbm.name,
          territory: zbm.territory,
          lyRev,
          cyRev,
          lyAchRev,
          abmCount: zbm.abms.length,
          tbmCount: zbm.abms.reduce((s, a) => s + a.tbms.length, 0),
          repCount: zbm.abms.reduce((s, a) => s + a.tbms.reduce((ss, t) => ss + t.salesReps.length, 0), 0),
        };
      });
    }
    return apiRequest('/saleshead/regional-performance');
  },

  /**
   * GET /saleshead/monthly-trend
   * Returns month-by-month LY vs CY revenue data plus LY achieved.
   *
   * @returns {Promise<Array<{month:string, lyRev:number, cyRev:number, lyAchRev:number}>>}
   */
  async getMonthlyTrend() {
    if (USE_MOCK) {
      await delay(300);
      const months = ['apr','may','jun','jul','aug','sep','oct','nov','dec','jan','feb','mar'];
      return months.map(m => {
        let lyRev = 0, cyRev = 0, lyAchRev = 0;
        MockZBMSubmissions.forEach(s => {
          if (s.monthlyTargets?.[m]) {
            lyRev += s.monthlyTargets[m].lyRev || 0;
            cyRev += s.monthlyTargets[m].cyRev || 0;
            lyAchRev += s.monthlyTargets[m].lyAchRev || 0;
          }
        });
        return { month: m, lyRev, cyRev, lyAchRev };
      });
    }
    return apiRequest('/saleshead/monthly-trend');
  },

  // ========================
  //  ANALYTICS (NEW)
  // ========================

  /**
   * GET /saleshead/analytics/distribution
   * Returns pre-aggregated distribution data for analytics charts.
   *
   * ★ OPTIONAL OPTIMIZATION: If your backend can return pre-aggregated data,
   *   implement this endpoint. Otherwise the frontend calculates it from
   *   getZBMSubmissions() + getZBMHierarchy() data — which already works.
   *
   * Query params:
   *   - level: 'zone' | 'territory' | 'member'
   *   - zoneId: optional filter (zbmId)
   *   - territoryId: optional filter (abmId)
   *   - metric: 'revenue' | 'qty'
   *   - categories: comma-separated category IDs
   *
   * @returns {Promise<Array<{
   *   id:string, name:string, subtitle:string,
   *   lyTarget:number, lyAchieved:number, cyTarget:number,
   *   growth:number, achievedPct:number,
   *   segments: Array<{catId:string, catName:string, lyTarget:number, lyAchieved:number, cyTarget:number}>
   * }>>}
   */
  async getAnalyticsDistribution(params = {}) {
    if (USE_MOCK) {
      // Frontend calculates from existing data — no separate mock needed
      return null;
    }
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/saleshead/analytics/distribution?${query}`);
  },

  /**
   * GET /saleshead/analytics/comparison
   * Returns comparison data for two entities side-by-side.
   *
   * ★ OPTIONAL OPTIMIZATION: Same as distribution — frontend can calculate
   *   from core data. Implement only if you want server-side aggregation.
   *
   * Query params:
   *   - entityA: ID of first entity
   *   - entityB: ID of second entity
   *   - level: 'zone' | 'territory' | 'member'
   *   - metric: 'revenue' | 'qty'
   *   - categories: comma-separated category IDs
   *
   * @returns {Promise<{
   *   entityA: { id, name, lyTarget, lyAchieved, cyTarget, growth, achievedPct, segments, monthlyData },
   *   entityB: { id, name, lyTarget, lyAchieved, cyTarget, growth, achievedPct, segments, monthlyData }
   * }>}
   */
  async getAnalyticsComparison(params = {}) {
    if (USE_MOCK) {
      // Frontend calculates from existing data — no separate mock needed
      return null;
    }
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/saleshead/analytics/comparison?${query}`);
  },

  /**
   * GET /saleshead/analytics/achievement
   * Returns LY achievement data aggregated at the requested level.
   *
   * ★ This is the KEY endpoint for LY Achieved data.
   *   If not implemented, frontend falls back to calculating from
   *   monthlyTargets.lyAchQty / lyAchRev fields in the hierarchy data.
   *
   * Query params:
   *   - level: 'zone' | 'territory' | 'member'
   *   - zoneId: optional filter
   *   - territoryId: optional filter
   *
   * @returns {Promise<Array<{
   *   id: string,
   *   name: string,
   *   lyTarget: number,
   *   lyAchieved: number,
   *   achievedPct: number,
   *   cyTarget: number,
   *   growth: number,
   *   categoryBreakdown: Array<{
   *     catId: string,
   *     lyTarget: number,
   *     lyAchieved: number,
   *     cyTarget: number
   *   }>
   * }>>}
   */
  async getAchievementData(params = {}) {
    if (USE_MOCK) {
      // Frontend calculates from existing data — no separate mock needed
      return null;
    }
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/saleshead/analytics/achievement?${query}`);
  }
};

export default SalesHeadApiService;
