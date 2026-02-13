/**
 * TBM API Service - Team Targets Addition
 * 
 * ADD these methods to the existing TBMApiService object in tbmApi.js
 * Also add the new endpoints to TBM_API_CONFIG.endpoints
 * 
 * NEW ENDPOINTS TO ADD TO TBM_API_CONFIG:
 *   getTeamTargetsForRep: '/tbm/team-targets/:repId',
 *   saveTeamTargetsForRep: '/tbm/team-targets/:repId/save',
 *   assignTeamTargetsToRep: '/tbm/team-targets/:repId/assign',
 *   getTeamTargetsSummary: '/tbm/team-targets/summary',
 * 
 * @version 4.0.0 - Team Targets support
 */

// ============================================================
// PASTE THIS INTO YOUR EXISTING tbmApi.js FILE
// Add the endpoints above to TBM_API_CONFIG.endpoints
// Add these methods to the TBMApiService object
// ============================================================

// Helper to generate mock team targets for a sales rep
const generateTeamTargetsForRep = (repId) => {
  const generateMonthlyTargets = (baseQty, baseRev, variance = 0.2) => {
    const months = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];
    const targets = {};
    months.forEach((month, index) => {
      const seasonalFactor = 1 + Math.sin((index / 12) * Math.PI * 2) * 0.15;
      const randomVariance = 1 + (Math.random() - 0.5) * variance;
      const lyQty = Math.round(baseQty * seasonalFactor * randomVariance);
      const cyQty = 0; // TBM will enter these
      const lyRev = Math.round(baseRev * seasonalFactor * randomVariance);
      const cyRev = 0;
      targets[month] = { lyQty, cyQty, lyRev, cyRev };
    });
    return targets;
  };

  return [
    { id: `team-${repId}-1`, categoryId: 'equipment', subcategory: 'Diagnostic', name: 'Slit Lamp SL-700', code: 'EQ-DG-001', monthlyTargets: generateMonthlyTargets(8, 80000) },
    { id: `team-${repId}-2`, categoryId: 'equipment', subcategory: 'Diagnostic', name: 'Auto Refractometer AR-800', code: 'EQ-DG-002', monthlyTargets: generateMonthlyTargets(5, 120000) },
    { id: `team-${repId}-3`, categoryId: 'equipment', subcategory: 'Surgical', name: 'Phaco Machine PM-3000', code: 'EQ-SG-001', monthlyTargets: generateMonthlyTargets(3, 500000) },
    { id: `team-${repId}-4`, categoryId: 'iol', subcategory: 'Monofocal', name: 'AuroLens Standard', code: 'IOL-MF-001', monthlyTargets: generateMonthlyTargets(100, 200000) },
    { id: `team-${repId}-5`, categoryId: 'iol', subcategory: 'Monofocal', name: 'AuroLens Premium', code: 'IOL-MF-002', monthlyTargets: generateMonthlyTargets(60, 350000) },
    { id: `team-${repId}-6`, categoryId: 'iol', subcategory: 'Multifocal', name: 'AuroMulti Trifocal', code: 'IOL-MT-001', monthlyTargets: generateMonthlyTargets(40, 250000) },
    { id: `team-${repId}-7`, categoryId: 'ovd', subcategory: 'Cohesive', name: 'Aurovisc 2.0%', code: 'OVD-CO-001', monthlyTargets: generateMonthlyTargets(200, 50000) },
    { id: `team-${repId}-8`, categoryId: 'ovd', subcategory: 'Dispersive', name: 'Aurogel Dispersive', code: 'OVD-DS-001', monthlyTargets: generateMonthlyTargets(120, 55000) },
  ];
};

// Mock storage for team targets
const teamTargetsStore = {};

// ============================================================
// ADD THESE METHODS TO THE TBMApiService OBJECT:
// ============================================================

const teamTargetMethods = {

  /**
   * Get team targets for a specific sales rep (entered by TBM)
   * @param {number|string} repId - Sales rep ID
   */
  async getTeamTargetsForRep(repId) {
    // if (USE_MOCK) {
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    await delay(400);
    if (!teamTargetsStore[repId]) {
      teamTargetsStore[repId] = generateTeamTargetsForRep(repId);
    }
    return [...teamTargetsStore[repId]];
    // }
    // return apiRequest(TBM_API_CONFIG.endpoints.getTeamTargetsForRep.replace(':repId', repId));
  },

  /**
   * Save team targets for a specific sales rep (draft)
   * @param {number|string} repId - Sales rep ID
   * @param {Array} targets - Array of target objects
   */
  async saveTeamTargetsForRep(repId, targets) {
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    await delay(400);
    teamTargetsStore[repId] = [...targets];
    return { success: true, repId, savedCount: targets.length };
  },

  /**
   * Assign team targets to a sales rep (makes them visible as the rep's assigned targets)
   * @param {number|string} repId - Sales rep ID
   * @param {Array} targets - Array of target objects
   */
  async assignTeamTargetsToRep(repId, targets) {
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    await delay(500);
    teamTargetsStore[repId] = targets.map(t => ({ ...t, assigned: true, assignedDate: new Date().toISOString() }));
    return { success: true, repId, assignedCount: targets.length };
  },

  /**
   * Get summary of team targets for all sales reps
   */
  async getTeamTargetsSummary() {
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    await delay(300);
    
    // Generate mock summary from any stored data + default reps
    const mockReps = [
      { id: 1, name: 'Amit Patel', territory: 'Mumbai North' },
      { id: 2, name: 'Priya Singh', territory: 'Mumbai South' },
      { id: 3, name: 'Rahul Sharma', territory: 'Pune' }
    ];

    return mockReps.map(rep => {
      const targets = teamTargetsStore[rep.id];
      const totalQty = targets 
        ? targets.reduce((sum, t) => {
            if (!t.monthlyTargets) return sum;
            return sum + Object.values(t.monthlyTargets).reduce((s, m) => s + (m.cyQty || 0), 0);
          }, 0)
        : 0;
      return {
        id: rep.id,
        name: rep.name,
        territory: rep.territory,
        productCount: targets ? targets.length : 0,
        totalQty,
        assigned: targets ? targets.some(t => t.assigned) : false
      };
    });
  }
};

// ============================================================
// EXPORT — In your actual tbmApi.js, merge these methods into
// the existing TBMApiService object.
// Example:
//   export const TBMApiService = {
//     ...existingMethods,
//     ...teamTargetMethods
//   };
// ============================================================

export default teamTargetMethods;
