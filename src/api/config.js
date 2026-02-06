/**
 * API Configuration
 * Toggle between mock and real API endpoints
 */

// Set to true to use mock data, false for real API
export const USE_MOCK_API = true;

// API Base URLs
export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  odooUrl: import.meta.env.VITE_ODOO_API_URL || 'http://localhost:8069/api',
  timeout: 30000,
};

// API Endpoints
export const ENDPOINTS = {
  // Inspection endpoints
  inspection: {
    queue: '/inspection/queue',
    byId: (id) => `/inspection/${id}`,
    start: (id) => `/inspection/${id}/start`,
    submit: (id) => `/inspection/${id}/submit`,
    saveDraft: (id) => `/inspection/${id}/draft`,
    getForm: (partCode) => `/inspection/forms/${partCode}`,
    readings: (inspectionId) => `/inspection/${inspectionId}/readings`,
  },
  
  // GRN endpoints
  grn: {
    list: '/grn',
    byId: (id) => `/grn/${id}`,
    pending: '/grn/pending-qc',
  },
  
  // Component endpoints
  components: {
    list: '/components',
    byPartCode: (code) => `/components/${code}`,
  },
  
  // QC Plan endpoints
  qcPlans: {
    list: '/qc-plans',
    byId: (id) => `/qc-plans/${id}`,
  },
  
  // IR (Inspection Report) endpoints
  inspectionReports: {
    generate: (inspectionId) => `/inspection-reports/${inspectionId}/generate`,
    byId: (id) => `/inspection-reports/${id}`,
    list: '/inspection-reports',
  },
};

// HTTP Headers
export const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  // Add auth token if available
  ...(localStorage.getItem('authToken') && {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
  }),
});

export default {
  USE_MOCK_API,
  API_CONFIG,
  ENDPOINTS,
  getHeaders,
};
