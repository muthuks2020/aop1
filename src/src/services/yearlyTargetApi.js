/**
 * Team Yearly Targets API Service
 * 
 * ADD these methods to the existing TBMApiService in tbmApi.js
 * Also works standalone for ABM/ZBM by passing different base URLs.
 * 
 * PRODUCTION API ENDPOINTS (add to TBM_API_CONFIG.endpoints):
 *   getYearlyTargets:      GET    /api/{role}/yearly-targets?fy={fiscalYear}
 *   saveYearlyTargets:     POST   /api/{role}/yearly-targets/save
 *   publishYearlyTargets:  POST   /api/{role}/yearly-targets/publish
 * 
 * REQUEST/RESPONSE SHAPES:
 * 
 * GET /api/tbm/yearly-targets?fy=2026-27
 * Response: {
 *   success: true,
 *   members: [
 *     {
 *       id: 1,
 *       name: "Vasanthakumar C",
 *       territory: "Central Delhi",
 *       designation: "Sales Rep",
 *       lyTarget: 25000,        // Last year total qty target
 *       lyAchieved: 22500,      // Last year total qty achieved
 *       lyTargetValue: 8500000, // Last year total ₹ target
 *       lyAchievedValue: 7800000,
 *       cyTarget: 28000,        // Current year qty target (set by TBM)
 *       cyTargetValue: 9500000, // Current year ₹ target (set by TBM)
 *       status: "draft",        // "not_set" | "draft" | "published"
 *       lastUpdated: "2026-01-15T10:30:00Z",
 *       categoryBreakdown: [
 *         {
 *           id: "equipment",
 *           name: "Equipment",
 *           lyTarget: 1200,
 *           lyAchieved: 1100,
 *           lyTargetValue: 4000000,
 *           lyAchievedValue: 3700000,
 *           cyTarget: 1400,
 *           cyTargetValue: 4500000
 *         },
 *         // ... more categories
 *       ]
 *     },
 *     // ... more members
 *   ]
 * }
 * 
 * POST /api/tbm/yearly-targets/save
 * Request: {
 *   fiscalYear: "2026-27",
 *   members: [ { id, cyTarget, cyTargetValue, categoryBreakdown: [...] } ]
 * }
 * Response: { success: true, savedCount: 3 }
 * 
 * POST /api/tbm/yearly-targets/publish
 * Request: {
 *   fiscalYear: "2026-27",
 *   memberIds: [1, 2, 3]
 * }
 * Response: { success: true, publishedCount: 3 }
 * 
 * @author Appasamy Associates - Product Commitment PWA
 * @version 1.0.0
 */

const USE_MOCK = true; // Toggle to false when backend is ready
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ==================== MOCK DATA ====================

const MOCK_TEAM_MEMBERS = [
  {
    id: 1,
    name: 'Vasanthakumar C',
    territory: 'Central Delhi',
    designation: 'Sales Rep',
    lyTarget: 24500,
    lyAchieved: 22180,
    lyTargetValue: 8750000,
    lyAchievedValue: 7920000,
    cyTarget: 0,
    cyTargetValue: 0,
    status: 'not_set',
    lastUpdated: null,
    categoryBreakdown: [
      { id: 'equipment', name: 'Equipment', lyTarget: 1800, lyAchieved: 1650, lyTargetValue: 4200000, lyAchievedValue: 3850000, cyTarget: 0, cyTargetValue: 0 },
      { id: 'iol', name: 'IOL', lyTarget: 12000, lyAchieved: 11200, lyTargetValue: 2800000, lyAchievedValue: 2600000, cyTarget: 0, cyTargetValue: 0 },
      { id: 'ovd', name: 'OVD', lyTarget: 7500, lyAchieved: 6800, lyTargetValue: 1200000, lyAchievedValue: 1050000, cyTarget: 0, cyTargetValue: 0 },
      { id: 'mis', name: 'MIS', lyTarget: 2200, lyAchieved: 1780, lyTargetValue: 400000, lyAchievedValue: 320000, cyTarget: 0, cyTargetValue: 0 },
      { id: 'others', name: 'Others', lyTarget: 1000, lyAchieved: 750, lyTargetValue: 150000, lyAchievedValue: 100000, cyTarget: 0, cyTargetValue: 0 },
    ],
  },
  {
    id: 6,
    name: 'Arun Sharma',
    territory: 'South Delhi',
    designation: 'Sales Rep',
    lyTarget: 28000,
    lyAchieved: 30100,
    lyTargetValue: 10200000,
    lyAchievedValue: 11050000,
    cyTarget: 0,
    cyTargetValue: 0,
    status: 'not_set',
    lastUpdated: null,
    categoryBreakdown: [
      { id: 'equipment', name: 'Equipment', lyTarget: 2200, lyAchieved: 2500, lyTargetValue: 5100000, lyAchievedValue: 5800000, cyTarget: 0, cyTargetValue: 0 },
      { id: 'iol', name: 'IOL', lyTarget: 14000, lyAchieved: 15200, lyTargetValue: 3200000, lyAchievedValue: 3500000, cyTarget: 0, cyTargetValue: 0 },
      { id: 'ovd', name: 'OVD', lyTarget: 8500, lyAchieved: 9000, lyTargetValue: 1400000, lyAchievedValue: 1300000, cyTarget: 0, cyTargetValue: 0 },
      { id: 'mis', name: 'MIS', lyTarget: 2500, lyAchieved: 2600, lyTargetValue: 350000, lyAchievedValue: 300000, cyTarget: 0, cyTargetValue: 0 },
      { id: 'others', name: 'Others', lyTarget: 800, lyAchieved: 800, lyTargetValue: 150000, lyAchievedValue: 150000, cyTarget: 0, cyTargetValue: 0 },
    ],
  },
  {
    id: 11,
    name: 'Meera Krishnan',
    territory: 'East Delhi',
    designation: 'Sales Rep',
    lyTarget: 18500,
    lyAchieved: 15200,
    lyTargetValue: 6200000,
    lyAchievedValue: 5100000,
    cyTarget: 0,
    cyTargetValue: 0,
    status: 'not_set',
    lastUpdated: null,
    categoryBreakdown: [
      { id: 'equipment', name: 'Equipment', lyTarget: 1200, lyAchieved: 950, lyTargetValue: 2800000, lyAchievedValue: 2200000, cyTarget: 0, cyTargetValue: 0 },
      { id: 'iol', name: 'IOL', lyTarget: 9500, lyAchieved: 7800, lyTargetValue: 2200000, lyAchievedValue: 1800000, cyTarget: 0, cyTargetValue: 0 },
      { id: 'ovd', name: 'OVD', lyTarget: 5500, lyAchieved: 4600, lyTargetValue: 850000, lyAchievedValue: 750000, cyTarget: 0, cyTargetValue: 0 },
      { id: 'mis', name: 'MIS', lyTarget: 1800, lyAchieved: 1400, lyTargetValue: 250000, lyAchievedValue: 200000, cyTarget: 0, cyTargetValue: 0 },
      { id: 'others', name: 'Others', lyTarget: 500, lyAchieved: 450, lyTargetValue: 100000, lyAchievedValue: 150000, cyTarget: 0, cyTargetValue: 0 },
    ],
  },
  {
    id: 16,
    name: 'Rajiv Nair',
    territory: 'West Delhi',
    designation: 'Sales Rep',
    lyTarget: 21000,
    lyAchieved: 20500,
    lyTargetValue: 7500000,
    lyAchievedValue: 7200000,
    cyTarget: 0,
    cyTargetValue: 0,
    status: 'not_set',
    lastUpdated: null,
    categoryBreakdown: [
      { id: 'equipment', name: 'Equipment', lyTarget: 1500, lyAchieved: 1450, lyTargetValue: 3500000, lyAchievedValue: 3350000, cyTarget: 0, cyTargetValue: 0 },
      { id: 'iol', name: 'IOL', lyTarget: 11000, lyAchieved: 10800, lyTargetValue: 2500000, lyAchievedValue: 2450000, cyTarget: 0, cyTargetValue: 0 },
      { id: 'ovd', name: 'OVD', lyTarget: 6000, lyAchieved: 5800, lyTargetValue: 950000, lyAchievedValue: 900000, cyTarget: 0, cyTargetValue: 0 },
      { id: 'mis', name: 'MIS', lyTarget: 2000, lyAchieved: 1950, lyTargetValue: 400000, lyAchievedValue: 380000, cyTarget: 0, cyTargetValue: 0 },
      { id: 'others', name: 'Others', lyTarget: 500, lyAchieved: 500, lyTargetValue: 150000, lyAchievedValue: 120000, cyTarget: 0, cyTargetValue: 0 },
    ],
  },
  {
    id: 21,
    name: 'Sunita Devi',
    territory: 'North Delhi',
    designation: 'Sales Rep',
    lyTarget: 16000,
    lyAchieved: 17200,
    lyTargetValue: 5500000,
    lyAchievedValue: 5900000,
    cyTarget: 0,
    cyTargetValue: 0,
    status: 'not_set',
    lastUpdated: null,
    categoryBreakdown: [
      { id: 'equipment', name: 'Equipment', lyTarget: 1000, lyAchieved: 1150, lyTargetValue: 2300000, lyAchievedValue: 2650000, cyTarget: 0, cyTargetValue: 0 },
      { id: 'iol', name: 'IOL', lyTarget: 8500, lyAchieved: 9200, lyTargetValue: 2000000, lyAchievedValue: 2150000, cyTarget: 0, cyTargetValue: 0 },
      { id: 'ovd', name: 'OVD', lyTarget: 4500, lyAchieved: 4800, lyTargetValue: 750000, lyAchievedValue: 700000, cyTarget: 0, cyTargetValue: 0 },
      { id: 'mis', name: 'MIS', lyTarget: 1500, lyAchieved: 1550, lyTargetValue: 300000, lyAchievedValue: 280000, cyTarget: 0, cyTargetValue: 0 },
      { id: 'others', name: 'Others', lyTarget: 500, lyAchieved: 500, lyTargetValue: 150000, lyAchievedValue: 120000, cyTarget: 0, cyTargetValue: 0 },
    ],
  },
];

// In-memory store for mock persistence during session
let yearlyTargetsStore = {};

// ==================== API METHODS ====================

/**
 * Yearly Target API methods.
 * Merge these into TBMApiService (or use standalone for ABM/ZBM).
 * 
 * Example integration:
 *   import { yearlyTargetMethods } from './yearlyTargetApi';
 *   export const TBMApiService = { ...existingMethods, ...yearlyTargetMethods };
 */
export const yearlyTargetMethods = {

  /**
   * Get yearly targets for all team members under this manager
   * 
   * @param {string} fiscalYear - e.g. "2026-27"
   * @returns {Promise<{ members: Array }>}
   * 
   * PRODUCTION:
   *   GET /api/tbm/yearly-targets?fy=2026-27
   *   Headers: Authorization: Bearer {token}
   */
  async getYearlyTargets(fiscalYear) {
    if (USE_MOCK) {
      await delay(500);
      // Return stored data if exists, otherwise fresh mock data
      const storeKey = `yearly_${fiscalYear}`;
      if (!yearlyTargetsStore[storeKey]) {
        yearlyTargetsStore[storeKey] = JSON.parse(JSON.stringify(MOCK_TEAM_MEMBERS));
      }
      return { members: yearlyTargetsStore[storeKey] };
    }

    // PRODUCTION CODE:
    // const response = await apiRequest(
    //   `${TBM_API_CONFIG.endpoints.getYearlyTargets}?fy=${fiscalYear}`
    // );
    // return response;
  },

  /**
   * Save yearly targets as draft (not yet published to team members)
   * 
   * @param {string} fiscalYear - e.g. "2026-27"
   * @param {Array} members - Array of member objects with updated targets
   * @returns {Promise<{ success: boolean, savedCount: number }>}
   * 
   * PRODUCTION:
   *   POST /api/tbm/yearly-targets/save
   *   Body: { fiscalYear, members: [{ id, cyTarget, cyTargetValue, categoryBreakdown }] }
   */
  async saveYearlyTargets(fiscalYear, members) {
    if (USE_MOCK) {
      await delay(400);
      const storeKey = `yearly_${fiscalYear}`;
      yearlyTargetsStore[storeKey] = JSON.parse(JSON.stringify(members));
      return { success: true, savedCount: members.length };
    }

    // PRODUCTION CODE:
    // const payload = {
    //   fiscalYear,
    //   members: members.map(m => ({
    //     id: m.id,
    //     cyTarget: m.cyTarget,
    //     cyTargetValue: m.cyTargetValue,
    //     categoryBreakdown: m.categoryBreakdown?.map(c => ({
    //       id: c.id,
    //       cyTarget: c.cyTarget,
    //       cyTargetValue: c.cyTargetValue,
    //     })),
    //   })),
    // };
    // return apiRequest(TBM_API_CONFIG.endpoints.saveYearlyTargets, {
    //   method: 'POST',
    //   body: JSON.stringify(payload),
    // });
  },

  /**
   * Publish yearly targets to selected team members
   * Once published, members will see these as their assigned yearly targets.
   * 
   * @param {string} fiscalYear - e.g. "2026-27"
   * @param {Array<number>} memberIds - IDs of members to publish to
   * @returns {Promise<{ success: boolean, publishedCount: number }>}
   * 
   * PRODUCTION:
   *   POST /api/tbm/yearly-targets/publish
   *   Body: { fiscalYear, memberIds: [1, 2, 3] }
   */
  async publishYearlyTargets(fiscalYear, memberIds) {
    if (USE_MOCK) {
      await delay(600);
      const storeKey = `yearly_${fiscalYear}`;
      if (yearlyTargetsStore[storeKey]) {
        yearlyTargetsStore[storeKey] = yearlyTargetsStore[storeKey].map(m => {
          if (memberIds.includes(m.id)) {
            return { ...m, status: 'published', lastUpdated: new Date().toISOString() };
          }
          return m;
        });
      }
      return { success: true, publishedCount: memberIds.length };
    }

    // PRODUCTION CODE:
    // return apiRequest(TBM_API_CONFIG.endpoints.publishYearlyTargets, {
    //   method: 'POST',
    //   body: JSON.stringify({ fiscalYear, memberIds }),
    // });
  },
};

export default yearlyTargetMethods;
