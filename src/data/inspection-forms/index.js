/**
 * Inspection Forms Registry
 * Central registry for all component inspection form configurations
 * 
 * To add a new component:
 * 1. Create a JSON file in this directory (e.g., NEW-PART-001.json)
 * 2. Import it below
 * 3. Add it to the inspectionFormRegistry object
 */

// Existing forms
import RUBA001 from './RUBA-001.json';
import RCNA001 from './RCNA-001.json';
import EETD034 from './EETD-034.json';

// New forms - Batch 2 (Feb 2026)
import AACS173 from './AACS-173.json';
import EEWA029 from './EEWA-029.json';
import RCNA011 from './RCNA-011.json';
import RCNA0351 from './RCNA-035.1.json';
import RCNA104 from './RCNA-104.json';
import RSFA061 from './RSFA-061.json';

/**
 * Registry mapping part codes to their inspection form configurations
 * Key: Part Code (must match partCode in JSON)
 * Value: Imported JSON configuration
 */
export const inspectionFormRegistry = {
  // Mechanical - Base Plates
  'RUBA-001': RUBA001,

  // Mechanical - Channel Frames & Packaging
  'RCNA-001': RCNA001,
  'RCNA-011': RCNA011,

  // Mechanical - Bearings
  'RCNA-034': RCNA0351,      // Note: CSV file was RCNA-035_1 but part code is RCNA-035.1

  // Mechanical - Locks & Fasteners
  'RCNA-035.1': RCNA0351,

  // Mechanical - Labels & Stickers
  'RCNA-104': RCNA104,

  // Mechanical - Fasteners (Washers)
  'RSFA-061': RSFA061,

  // Electrical - Transformers
  'EETD-034': EETD034,

  // Electrical - Wire & Cables
  'EEWA-029': EEWA029,

  // Electronics - Connectors
  'AACS-173': AACS173,
};

/**
 * Get inspection form by part code
 * @param {string} partCode - The component part code
 * @returns {Object|null} The inspection form configuration or null
 */
export const getInspectionForm = (partCode) => {
  return inspectionFormRegistry[partCode] || null;
};

/**
 * Get all available part codes
 * @returns {string[]} Array of registered part codes
 */
export const getAvailablePartCodes = () => {
  return Object.keys(inspectionFormRegistry);
};

/**
 * Get form summary for listing/selection
 * @returns {Array} Array of {partCode, partName, checkType, checkpointCount}
 */
export const getFormSummaries = () => {
  return Object.entries(inspectionFormRegistry).map(([code, form]) => ({
    partCode: form.partCode,
    partName: form.partName,
    checkType: form.checkType,
    checkpointCount: form.checkpoints.length,
    samplingPlanNo: form.samplingPlanNo,
    category: form.metadata?.category || 'Unknown',
  }));
};

export default inspectionFormRegistry;
