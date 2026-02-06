/**
 * Component Master API Service
 * Handles all API calls for Component Master CRUD operations
 * 
 * CONFIGURATION:
 * All API settings are managed in /src/config/apiConfig.js
 * - Change USE_MOCK_DATA to false when backend is ready
 * - Update API_BASE_URL in apiConfig.js for your backend server
 */

import { 
  USE_MOCK_DATA, 
  COMPONENT_MASTER_ENDPOINTS as ENDPOINTS,
  getAuthHeaders,
  getMultipartHeaders,
  buildQueryString,
} from '../../../../config/apiConfig';

// For backwards compatibility - expose config
export { USE_MOCK_DATA };
export const API_BASE_URL = ENDPOINTS.components.replace('/components', '');

// ============================================
// MOCK DATA
// ============================================
const mockProductGroups = {
  mechanical: ['Housings', 'Frames', 'Casings', 'Brackets', 'Enclosures'],
  electrical: ['Cables', 'Connectors', 'Switches', 'Transformers', 'Motors'],
  plastic: ['Covers', 'Panels', 'Lenses', 'Buttons', 'Gaskets'],
  electronics: ['PCB Assembly', 'Display Modules', 'Sensors', 'Controllers', 'Power Units'],
  optical: ['Lenses', 'Mirrors', 'Filters', 'Prisms', 'Light Guides'],
};

const mockSamplingPlans = [
  { id: 'SP-001', name: 'Critical Components - Level I', aqlLevel: 'Level I' },
  { id: 'SP-002', name: 'Electrical Assembly - Level II', aqlLevel: 'Level II' },
  { id: 'SP-003', name: 'Visual Inspection - Standard', aqlLevel: 'Level III' },
  { id: 'SP-004', name: 'High-Precision Parts', aqlLevel: 'Special S-3' },
  { id: 'SP-005', name: 'General Inspection', aqlLevel: 'Level I' },
];

const mockQCPlans = [
  { id: 'RD.7.3-01', name: 'B-SCAN Probe QC Plan' },
  { id: 'RD.7.3-02', name: 'Display Module QC Plan' },
  { id: 'RD.7.3-03', name: 'Cable Assembly QC Plan' },
  { id: 'RD.7.3-04', name: 'Enclosure QC Plan' },
  { id: 'RD.7.3-05', name: 'Power Supply QC Plan' },
  { id: 'RD.7.3-06', name: 'PCB Assembly QC Plan' },
  { id: 'RD.7.3-07', name: 'Optical Components QC Plan' },
];

const mockComponents = [
  {
    "id": "COMP-AACS-173",
    "productCategory": "electronics",
    "productGroup": "Connectors",
    "partCode": "AACS-173",
    "partName": "3PIN GILLARD MALE& FEMALE",
    "qcPlanNo": "RD-7.3-07-D1-01",
    "inspectionType": "sampling",
    "samplingPlan": "Table-1",
    "drawingNo": "",
    "drawingAttachment": null,
    "testCertRequired": true,
    "specRequired": true,
    "fqirRequired": false,
    "prProcessCode": "direct_purchase",
    "checkingParameters": {
      "type": "visual",
      "parameters": [
        {
          "id": 1,
          "checkingPoint": "As per part number",
          "unit": "PIN",
          "specification": "3PIN GILLARD MALE& FEMALE",
          "instrumentName": "Visual",
          "toleranceMin": "",
          "toleranceMax": ""
        },
        {
          "id": 2,
          "checkingPoint": "Damage Checking",
          "unit": "",
          "specification": "No damages",
          "instrumentName": "Visual",
          "toleranceMin": "",
          "toleranceMax": ""
        }
      ]
    },
    "status": "active",
    "createdAt": "2026-02-02T09:46:36Z",
    "updatedAt": "2026-02-02T09:46:36Z"
  },
  {
    "id": "COMP-EETD-034",
    "productCategory": "electrical",
    "productGroup": "Transformers",
    "partCode": "EETD-034",
    "partName": "29V/3A TRANSFORMER",
    "qcPlanNo": "RD-7.3-07-D1-01",
    "inspectionType": "sampling",
    "samplingPlan": "Table-3",
    "drawingNo": "",
    "drawingAttachment": null,
    "testCertRequired": true,
    "specRequired": true,
    "fqirRequired": false,
    "prProcessCode": "direct_purchase",
    "checkingParameters": {
      "type": "electrical",
      "parameters": [
        {
          "id": 1,
          "checkingPoint": "Output Voltage",
          "unit": "V",
          "specification": "3V AC +/- 0.15",
          "instrumentName": "Multimeter",
          "toleranceMin": "",
          "toleranceMax": ""
        },
        {
          "id": 2,
          "checkingPoint": "Output Voltage",
          "unit": "V",
          "specification": "4V AC +/- 0.2",
          "instrumentName": "Multimeter",
          "toleranceMin": "",
          "toleranceMax": ""
        },
        {
          "id": 3,
          "checkingPoint": "Output Voltage",
          "unit": "V",
          "specification": "14V AC +/- 0.7",
          "instrumentName": "Multimeter",
          "toleranceMin": "",
          "toleranceMax": ""
        },
        {
          "id": 4,
          "checkingPoint": "Output Voltage",
          "unit": "V",
          "specification": "29V AC +/- 1.5",
          "instrumentName": "Multimeter",
          "toleranceMin": "",
          "toleranceMax": ""
        },
        {
          "id": 5,
          "checkingPoint": "Damage Checking",
          "unit": "",
          "specification": "No damages",
          "instrumentName": "Visual",
          "toleranceMin": "",
          "toleranceMax": ""
        }
      ]
    },
    "status": "active",
    "createdAt": "2026-02-02T09:46:36Z",
    "updatedAt": "2026-02-02T09:46:36Z"
  },
  {
    "id": "COMP-EEWA-029",
    "productCategory": "electrical",
    "productGroup": "Wiring & Cables",
    "partCode": "EEWA-029",
    "partName": "2 CORE WIRE COIL-23/60 T.F.R",
    "qcPlanNo": "RD-7.3-07-D1-01",
    "inspectionType": "sampling",
    "samplingPlan": "Table-2",
    "drawingNo": "",
    "drawingAttachment": null,
    "testCertRequired": true,
    "specRequired": true,
    "fqirRequired": false,
    "prProcessCode": "direct_purchase",
    "checkingParameters": {
      "type": "visual",
      "parameters": [
        {
          "id": 1,
          "checkingPoint": "As per specefication",
          "unit": "CORE",
          "specification": "2 CORE WIRE COIL-23/60 T.F.R",
          "instrumentName": "Visual",
          "toleranceMin": "",
          "toleranceMax": ""
        },
        {
          "id": 2,
          "checkingPoint": "Damage Checking",
          "unit": "",
          "specification": "No damages",
          "instrumentName": "Visual",
          "toleranceMin": "",
          "toleranceMax": ""
        }
      ]
    },
    "status": "active",
    "createdAt": "2026-02-02T09:46:36Z",
    "updatedAt": "2026-02-02T09:46:36Z"
  },
  {
    "id": "COMP-RCNA-001",
    "productCategory": "mechanical",
    "productGroup": "Frames & Chassis",
    "partCode": "RCNA-001",
    "partName": "CHANNEL FRAME - REGULAR",
    "qcPlanNo": "RD-7.3-07-D1-01",
    "inspectionType": "sampling",
    "samplingPlan": "Table-2",
    "drawingNo": "",
    "drawingAttachment": null,
    "testCertRequired": false,
    "specRequired": true,
    "fqirRequired": false,
    "prProcessCode": "direct_purchase",
    "checkingParameters": {
      "type": "dimensional_visual",
      "parameters": [
        {
          "id": 1,
          "checkingPoint": "Length",
          "unit": "mm",
          "specification": "570mm +/-0.8",
          "instrumentName": "Scale",
          "toleranceMin": "569.2",
          "toleranceMax": "570.8"
        },
        {
          "id": 2,
          "checkingPoint": "Breath",
          "unit": "mm",
          "specification": "138mm +/-0.5",
          "instrumentName": "Vernier",
          "toleranceMin": "137.5",
          "toleranceMax": "138.5"
        },
        {
          "id": 3,
          "checkingPoint": "Height",
          "unit": "mm",
          "specification": "520mm +/-0.8",
          "instrumentName": "Scale",
          "toleranceMin": "519.2",
          "toleranceMax": "520.8"
        },
        {
          "id": 4,
          "checkingPoint": "PCD",
          "unit": "mm",
          "specification": "207mm +/-0.5",
          "instrumentName": "Scale",
          "toleranceMin": "206.5",
          "toleranceMax": "207.5"
        },
        {
          "id": 5,
          "checkingPoint": "PCD",
          "unit": "mm",
          "specification": "143mm +/-0.5",
          "instrumentName": "Vernier",
          "toleranceMin": "142.5",
          "toleranceMax": "143.5"
        },
        {
          "id": 6,
          "checkingPoint": "PCD",
          "unit": "mm",
          "specification": "102mm +/-0.3",
          "instrumentName": "Vernier",
          "toleranceMin": "101.7",
          "toleranceMax": "102.3"
        },
        {
          "id": 7,
          "checkingPoint": "PCD",
          "unit": "mm",
          "specification": "72mm +/-0.3",
          "instrumentName": "Vernier",
          "toleranceMin": "71.7",
          "toleranceMax": "72.3"
        },
        {
          "id": 8,
          "checkingPoint": "PCD",
          "unit": "mm",
          "specification": "70mm +/-0.3",
          "instrumentName": "Vernier",
          "toleranceMin": "69.7",
          "toleranceMax": "70.3"
        },
        {
          "id": 9,
          "checkingPoint": "PCD",
          "unit": "mm",
          "specification": "60mm +/-0.3",
          "instrumentName": "Vernier",
          "toleranceMin": "59.7",
          "toleranceMax": "60.3"
        },
        {
          "id": 10,
          "checkingPoint": "PCD",
          "unit": "mm",
          "specification": "55mm +/-0.3",
          "instrumentName": "Vernier",
          "toleranceMin": "54.7",
          "toleranceMax": "55.3"
        },
        {
          "id": 11,
          "checkingPoint": "Inner diameter",
          "unit": "mm",
          "specification": "13mm +/-0.2",
          "instrumentName": "Vernier",
          "toleranceMin": "12.8",
          "toleranceMax": "13.2"
        },
        {
          "id": 12,
          "checkingPoint": "Inner diameter",
          "unit": "mm",
          "specification": "8mm +/-0.2",
          "instrumentName": "Vernier",
          "toleranceMin": "7.8",
          "toleranceMax": "8.2"
        },
        {
          "id": 13,
          "checkingPoint": "Inner diameter",
          "unit": "mm",
          "specification": "4mm +/-0.1",
          "instrumentName": "Vernier",
          "toleranceMin": "3.9",
          "toleranceMax": "4.1"
        },
        {
          "id": 14,
          "checkingPoint": "Inner diameter",
          "unit": "mm",
          "specification": "11mm +/-0.2",
          "instrumentName": "Vernier",
          "toleranceMin": "10.8",
          "toleranceMax": "11.2"
        },
        {
          "id": 15,
          "checkingPoint": "Inner diameter",
          "unit": "mm",
          "specification": "8mm +/-0.2",
          "instrumentName": "Vernier",
          "toleranceMin": "7.8",
          "toleranceMax": "8.2"
        },
        {
          "id": 16,
          "checkingPoint": "Thickness",
          "unit": "mm",
          "specification": "19mm +/-0.2",
          "instrumentName": "Vernier",
          "toleranceMin": "18.8",
          "toleranceMax": "19.2"
        },
        {
          "id": 17,
          "checkingPoint": "Thickness",
          "unit": "mm",
          "specification": "5mm +/-0.1",
          "instrumentName": "Vernier",
          "toleranceMin": "4.9",
          "toleranceMax": "5.1"
        },
        {
          "id": 18,
          "checkingPoint": "Thickness",
          "unit": "mm",
          "specification": "1.5mm +/-0.1",
          "instrumentName": "Vernier",
          "toleranceMin": "1.4",
          "toleranceMax": "1.6"
        },
        {
          "id": 19,
          "checkingPoint": "Damage Checking",
          "unit": "",
          "specification": "No damages",
          "instrumentName": "Visual",
          "toleranceMin": "",
          "toleranceMax": ""
        }
      ]
    },
    "status": "active",
    "createdAt": "2026-02-02T09:46:36Z",
    "updatedAt": "2026-02-02T09:46:36Z"
  },
  {
    "id": "COMP-RCNA-011",
    "productCategory": "mechanical",
    "productGroup": "Packaging",
    "partCode": "RCNA-011",
    "partName": "CHANNEL CORRUGATED BOX-R",
    "qcPlanNo": "RD-7.3-07-D1-01",
    "inspectionType": "sampling",
    "samplingPlan": "Table-1",
    "drawingNo": "",
    "drawingAttachment": null,
    "testCertRequired": false,
    "specRequired": true,
    "fqirRequired": false,
    "prProcessCode": "direct_purchase",
    "checkingParameters": {
      "type": "dimensional_visual",
      "parameters": [
        {
          "id": 1,
          "checkingPoint": "Length",
          "unit": "CM",
          "specification": "67.5 CM",
          "instrumentName": "Scale",
          "toleranceMin": "",
          "toleranceMax": ""
        },
        {
          "id": 2,
          "checkingPoint": "Breath",
          "unit": "CM",
          "specification": "67.5 CM",
          "instrumentName": "Scale",
          "toleranceMin": "",
          "toleranceMax": ""
        },
        {
          "id": 3,
          "checkingPoint": "Height",
          "unit": "CM",
          "specification": "22 CM",
          "instrumentName": "Scale",
          "toleranceMin": "",
          "toleranceMax": ""
        },
        {
          "id": 4,
          "checkingPoint": "Ply",
          "unit": "ply",
          "specification": "7ply",
          "instrumentName": "Visual",
          "toleranceMin": "",
          "toleranceMax": ""
        },
        {
          "id": 5,
          "checkingPoint": "Damage Checking",
          "unit": "",
          "specification": "No damages",
          "instrumentName": "Visual",
          "toleranceMin": "",
          "toleranceMax": ""
        }
      ]
    },
    "status": "active",
    "createdAt": "2026-02-02T09:46:36Z",
    "updatedAt": "2026-02-02T09:46:36Z"
  },
  {
    "id": "COMP-RCNA-034",
    "productCategory": "mechanical",
    "productGroup": "Bearings",
    "partCode": "RCNA-034",
    "partName": "BEARING-6008",
    "qcPlanNo": "RD-7.3-07-D1-01",
    "inspectionType": "sampling",
    "samplingPlan": "Table-2",
    "drawingNo": "",
    "drawingAttachment": null,
    "testCertRequired": false,
    "specRequired": true,
    "fqirRequired": false,
    "prProcessCode": "direct_purchase",
    "checkingParameters": {
      "type": "visual",
      "parameters": [
        {
          "id": 1,
          "checkingPoint": "As per part number",
          "unit": "ZZ",
          "specification": "6008ZZ",
          "instrumentName": "Visual",
          "toleranceMin": "",
          "toleranceMax": ""
        },
        {
          "id": 2,
          "checkingPoint": "Damage Checking",
          "unit": "",
          "specification": "No damages",
          "instrumentName": "Visual",
          "toleranceMin": "",
          "toleranceMax": ""
        }
      ]
    },
    "status": "active",
    "createdAt": "2026-02-02T09:46:36Z",
    "updatedAt": "2026-02-02T09:46:36Z"
  },
  {
    "id": "COMP-RCNA-035.1",
    "productCategory": "mechanical",
    "productGroup": "Locks & Fasteners",
    "partCode": "RCNA-035.1",
    "partName": "90 DEGREE LOCK & NUT",
    "qcPlanNo": "RD-7.3-07-D1-01",
    "inspectionType": "sampling",
    "samplingPlan": "Table-2",
    "drawingNo": "",
    "drawingAttachment": null,
    "testCertRequired": false,
    "specRequired": true,
    "fqirRequired": false,
    "prProcessCode": "direct_purchase",
    "checkingParameters": {
      "type": "dimensional_visual",
      "parameters": [
        {
          "id": 1,
          "checkingPoint": "Length",
          "unit": "mm",
          "specification": "106.3mm +/- 0.3",
          "instrumentName": "Vernier",
          "toleranceMin": "106.0",
          "toleranceMax": "106.6"
        },
        {
          "id": 2,
          "checkingPoint": "Breath",
          "unit": "mm",
          "specification": "48mm +/- 0.3",
          "instrumentName": "Vernier",
          "toleranceMin": "47.7",
          "toleranceMax": "48.3"
        },
        {
          "id": 3,
          "checkingPoint": "Outer diameter 1",
          "unit": "mm",
          "specification": "55mm +/- 0.3",
          "instrumentName": "Vernier",
          "toleranceMin": "54.7",
          "toleranceMax": "55.3"
        },
        {
          "id": 4,
          "checkingPoint": "Inner diameter 1",
          "unit": "mm",
          "specification": "38mm +/- 0.3",
          "instrumentName": "Vernier",
          "toleranceMin": "37.7",
          "toleranceMax": "38.3"
        },
        {
          "id": 5,
          "checkingPoint": "Outer diameter 2",
          "unit": "mm",
          "specification": "20mm +/- 0.2",
          "instrumentName": "Vernier",
          "toleranceMin": "19.8",
          "toleranceMax": "20.2"
        },
        {
          "id": 6,
          "checkingPoint": "Inner diameter 2",
          "unit": "mm",
          "specification": "8mm +/- 0.2",
          "instrumentName": "Vernier",
          "toleranceMin": "7.8",
          "toleranceMax": "8.2"
        },
        {
          "id": 7,
          "checkingPoint": "Height",
          "unit": "mm",
          "specification": "11mm +/- 0.2",
          "instrumentName": "Vernier",
          "toleranceMin": "10.8",
          "toleranceMax": "11.2"
        },
        {
          "id": 8,
          "checkingPoint": "Thickness",
          "unit": "mm",
          "specification": "8.5mm +/- 0.2",
          "instrumentName": "Vernier",
          "toleranceMin": "8.3",
          "toleranceMax": "8.7"
        },
        {
          "id": 9,
          "checkingPoint": "Damage Checking",
          "unit": "",
          "specification": "No damages",
          "instrumentName": "Visual",
          "toleranceMin": "",
          "toleranceMax": ""
        }
      ]
    },
    "status": "active",
    "createdAt": "2026-02-02T09:46:36Z",
    "updatedAt": "2026-02-02T09:46:36Z"
  },
  {
    "id": "COMP-RCNA-104",
    "productCategory": "mechanical",
    "productGroup": "Labels & Stickers",
    "partCode": "RCNA-104",
    "partName": "EC REP STICKER",
    "qcPlanNo": "RD-7.3-07-D1-01",
    "inspectionType": "sampling",
    "samplingPlan": "Table-1",
    "drawingNo": "",
    "drawingAttachment": null,
    "testCertRequired": false,
    "specRequired": true,
    "fqirRequired": false,
    "prProcessCode": "ec_rep_sticker",
    "checkingParameters": {
      "type": "visual",
      "parameters": [
        {
          "id": 1,
          "checkingPoint": "Art work checking",
          "unit": "",
          "specification": "As per sample",
          "instrumentName": "Visual",
          "toleranceMin": "",
          "toleranceMax": ""
        },
        {
          "id": 2,
          "checkingPoint": "Damage Checking",
          "unit": "",
          "specification": "No damages",
          "instrumentName": "Visual",
          "toleranceMin": "",
          "toleranceMax": ""
        }
      ]
    },
    "status": "active",
    "createdAt": "2026-02-02T09:46:36Z",
    "updatedAt": "2026-02-02T09:46:36Z"
  },
  {
    "id": "COMP-RSFA-061",
    "productCategory": "hardware",
    "productGroup": "Fasteners",
    "partCode": "RSFA-061",
    "partName": "3M.M HD WASHER",
    "qcPlanNo": "RD-7.3-07-D1-01",
    "inspectionType": "sampling",
    "samplingPlan": "Table-1",
    "drawingNo": "",
    "drawingAttachment": null,
    "testCertRequired": false,
    "specRequired": true,
    "fqirRequired": false,
    "prProcessCode": "direct_purchase",
    "checkingParameters": {
      "type": "dimensional_visual",
      "parameters": [
        {
          "id": 1,
          "checkingPoint": "Inner diameter",
          "unit": "mm",
          "specification": "10mm +/- 0.2",
          "instrumentName": "Vernier",
          "toleranceMin": "9.8",
          "toleranceMax": "10.2"
        },
        {
          "id": 2,
          "checkingPoint": "Outer diameter",
          "unit": "mm",
          "specification": "16mm +/- 0.2",
          "instrumentName": "Vernier",
          "toleranceMin": "15.8",
          "toleranceMax": "16.2"
        },
        {
          "id": 3,
          "checkingPoint": "Thickness",
          "unit": "mm",
          "specification": "3mm +/- 0.1",
          "instrumentName": "Vernier",
          "toleranceMin": "2.9",
          "toleranceMax": "3.1"
        },
        {
          "id": 4,
          "checkingPoint": "Damage Checking",
          "unit": "",
          "specification": "No damages",
          "instrumentName": "Visual",
          "toleranceMin": "",
          "toleranceMax": ""
        }
      ]
    },
    "status": "active",
    "createdAt": "2026-02-02T09:46:36Z",
    "updatedAt": "2026-02-02T09:46:36Z"
  },
  {
    "id": "COMP-RUBA-001",
    "productCategory": "mechanical",
    "productGroup": "Plates & Panels",
    "partCode": "RUBA-001",
    "partName": "M.S BASE PLATE",
    "qcPlanNo": "RD-7.3-07-D1-01",
    "inspectionType": "sampling",
    "samplingPlan": "Table-2",
    "drawingNo": "",
    "drawingAttachment": null,
    "testCertRequired": false,
    "specRequired": true,
    "fqirRequired": false,
    "prProcessCode": "direct_purchase",
    "checkingParameters": {
      "type": "dimensional_visual",
      "parameters": [
        {
          "id": 1,
          "checkingPoint": "Length",
          "unit": "mm",
          "specification": "835mm +/- 0.8",
          "instrumentName": "Scale",
          "toleranceMin": "834.2",
          "toleranceMax": "835.8"
        },
        {
          "id": 2,
          "checkingPoint": "Breath",
          "unit": "mm",
          "specification": "782mm +/- 0.8",
          "instrumentName": "Scale",
          "toleranceMin": "781.2",
          "toleranceMax": "782.8"
        },
        {
          "id": 3,
          "checkingPoint": "Length 2",
          "unit": "mm",
          "specification": "475mm +/-0.8",
          "instrumentName": "Scale",
          "toleranceMin": "474.2",
          "toleranceMax": "475.8"
        },
        {
          "id": 4,
          "checkingPoint": "Breath 2",
          "unit": "mm",
          "specification": "485mm +/-0.8",
          "instrumentName": "Scale",
          "toleranceMin": "484.2",
          "toleranceMax": "485.8"
        },
        {
          "id": 5,
          "checkingPoint": "Inner diameter",
          "unit": "mm",
          "specification": "10mm +/-0.2",
          "instrumentName": "Vernier",
          "toleranceMin": "9.8",
          "toleranceMax": "10.2"
        },
        {
          "id": 6,
          "checkingPoint": "Inner diameter",
          "unit": "mm",
          "specification": "8mm +/-0.2",
          "instrumentName": "Vernier",
          "toleranceMin": "7.8",
          "toleranceMax": "8.2"
        },
        {
          "id": 7,
          "checkingPoint": "Thickness",
          "unit": "mm",
          "specification": "12mm +/-0.2",
          "instrumentName": "Vernier",
          "toleranceMin": "11.8",
          "toleranceMax": "12.2"
        },
        {
          "id": 8,
          "checkingPoint": "Thickness",
          "unit": "mm",
          "specification": "8mm +/- 0.2",
          "instrumentName": "Vernier",
          "toleranceMin": "7.8",
          "toleranceMax": "8.2"
        },
        {
          "id": 9,
          "checkingPoint": "Damage Checking",
          "unit": "",
          "specification": "No damages",
          "instrumentName": "Visual",
          "toleranceMin": "",
          "toleranceMax": ""
        }
      ]
    },
    "status": "active",
    "createdAt": "2026-02-02T09:46:36Z",
    "updatedAt": "2026-02-02T09:46:36Z"
  },
  {
    id: 'COMP-003',
    productCategory: 'mechanical',
    productGroup: 'Casings',
    partCode: 'BSC-CS-003',
    partName: 'B-SCAN Main Housing',
    qcPlanNo: 'RD.7.3-04',
    inspectionType: 'sampling',
    samplingPlan: 'SP-001',
    drawingNo: 'DWG-CS-003-R3',
    drawingAttachment: null,
    testCertRequired: false,
    specRequired: true,
    fqirRequired: false,
    prProcessCode: 'internal_job_work',
    checkingParameters: {
      type: 'functional',
      parameters: [
        { id: 1, checkingPoint: 'Length', unit: 'mm', specification: '250mm', instrumentName: 'Vernier Caliper', toleranceMin: '249.5', toleranceMax: '250.5' },
        { id: 2, checkingPoint: 'Width', unit: 'mm', specification: '180mm', instrumentName: 'Vernier Caliper', toleranceMin: '179.5', toleranceMax: '180.5' },
        { id: 3, checkingPoint: 'Weight', unit: 'g', specification: '450g', instrumentName: 'Digital Scale', toleranceMin: '440', toleranceMax: '460' },
      ],
    },
    status: 'active',
    createdAt: '2026-01-05T08:15:00Z',
    updatedAt: '2026-01-30T16:30:00Z',
  },
  {
    id: 'COMP-004',
    productCategory: 'optical',
    productGroup: 'Lenses',
    partCode: 'BSC-OL-004',
    partName: 'Ultrasound Coupling Lens',
    qcPlanNo: 'RD.7.3-07',
    inspectionType: '100%',
    samplingPlan: null,
    drawingNo: 'DWG-OL-004-R1',
    drawingAttachment: null,
    testCertRequired: true,
    specRequired: true,
    fqirRequired: true,
    prProcessCode: 'direct_purchase',
    checkingParameters: {
      type: 'visual',
      parameters: [
        { id: 1, checkingPoint: 'Clarity', unit: 'units', specification: 'Clear, no cloudiness', instrumentName: '', toleranceMin: '', toleranceMax: '' },
        { id: 2, checkingPoint: 'Surface', unit: 'units', specification: 'No scratches', instrumentName: '', toleranceMin: '', toleranceMax: '' },
      ],
    },
    status: 'draft',
    createdAt: '2026-01-28T13:00:00Z',
    updatedAt: '2026-01-28T13:00:00Z',
  },
];

// Local storage for mock data operations
let componentsData = [...mockComponents];

// ============================================
// HELPER FUNCTIONS
// ============================================
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const generateId = () => {
  const num = componentsData.length + 1;
  return `COMP-${String(num).padStart(3, '0')}`;
};

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Get all product categories
 * @returns {Promise<Array>} List of categories
 */
export const getProductCategories = async () => {
  if (USE_MOCK_DATA) {
    await delay(300);
    return [
      { id: 'mechanical', name: 'Mechanical', icon: '⚙️' },
      { id: 'electrical', name: 'Electrical', icon: '⚡' },
      { id: 'plastic', name: 'Plastic', icon: '🧪' },
      { id: 'electronics', name: 'Electronics', icon: '🔌' },
      { id: 'optical', name: 'Optical', icon: '🔍' },
    ];
  }
  
  const response = await fetch(ENDPOINTS.categories, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch categories');
  return response.json();
};

/**
 * Get product groups by category
 * @param {string} category - Category ID
 * @returns {Promise<Array>} List of product groups
 */
export const getProductGroups = async (category) => {
  if (USE_MOCK_DATA) {
    await delay(200);
    return mockProductGroups[category] || [];
  }
  
  const response = await fetch(`${ENDPOINTS.productGroups}?category=${category}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch product groups');
  return response.json();
};

/**
 * Get all sampling plans
 * @returns {Promise<Array>} List of sampling plans
 */
export const getSamplingPlans = async () => {
  if (USE_MOCK_DATA) {
    await delay(300);
    return mockSamplingPlans;
  }
  
  const response = await fetch(ENDPOINTS.samplingPlans, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch sampling plans');
  return response.json();
};

/**
 * Get all QC plans
 * @returns {Promise<Array>} List of QC plans
 */
export const getQCPlans = async () => {
  if (USE_MOCK_DATA) {
    await delay(300);
    return mockQCPlans;
  }
  
  const response = await fetch(ENDPOINTS.qcPlans, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch QC plans');
  return response.json();
};

/**
 * Get all components with optional filters
 * @param {Object} filters - Filter options (category, status, search)
 * @returns {Promise<Object>} Components list with pagination
 */
export const getComponents = async (filters = {}) => {
  if (USE_MOCK_DATA) {
    await delay(400);
    let filtered = [...componentsData];
    
    if (filters.category) {
      filtered = filtered.filter(c => c.productCategory === filters.category);
    }
    if (filters.status) {
      filtered = filtered.filter(c => c.status === filters.status);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(c => 
        c.partName.toLowerCase().includes(search) ||
        c.partCode.toLowerCase().includes(search)
      );
    }
    
    return {
      data: filtered,
      total: filtered.length,
      page: 1,
      pageSize: 10,
    };
  }
  
  const queryString = buildQueryString(filters);
  const response = await fetch(`${ENDPOINTS.components}${queryString}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch components');
  return response.json();
};

/**
 * Get single component by ID
 * @param {string} id - Component ID
 * @returns {Promise<Object>} Component details
 */
export const getComponentById = async (id) => {
  if (USE_MOCK_DATA) {
    await delay(300);
    const component = componentsData.find(c => c.id === id);
    if (!component) throw new Error('Component not found');
    return component;
  }
  
  const response = await fetch(ENDPOINTS.componentById(id), {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch component');
  return response.json();
};

/**
 * Create new component
 * @param {Object} data - Component data
 * @returns {Promise<Object>} Created component
 */
export const createComponent = async (data) => {
  if (USE_MOCK_DATA) {
    await delay(500);
    const newComponent = {
      ...data,
      id: generateId(),
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    componentsData.push(newComponent);
    return newComponent;
  }
  
  const response = await fetch(ENDPOINTS.components, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create component');
  return response.json();
};

/**
 * Update existing component
 * @param {string} id - Component ID
 * @param {Object} data - Updated component data
 * @returns {Promise<Object>} Updated component
 */
export const updateComponent = async (id, data) => {
  if (USE_MOCK_DATA) {
    await delay(500);
    const index = componentsData.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Component not found');
    
    componentsData[index] = {
      ...componentsData[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return componentsData[index];
  }
  
  const response = await fetch(ENDPOINTS.componentById(id), {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update component');
  return response.json();
};

/**
 * Delete component
 * @param {string} id - Component ID
 * @returns {Promise<Object>} Success response
 */
export const deleteComponent = async (id) => {
  if (USE_MOCK_DATA) {
    await delay(400);
    const index = componentsData.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Component not found');
    componentsData.splice(index, 1);
    return { success: true };
  }
  
  const response = await fetch(ENDPOINTS.componentById(id), {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to delete component');
  return response.json();
};

/**
 * Upload file attachment
 * @param {File} file - File to upload
 * @param {string} componentId - Component ID (optional for new components)
 * @param {string} fieldName - Field name (drawingAttachment, testCertFile, etc.)
 * @returns {Promise<Object>} Upload result with file URL
 */
export const uploadAttachment = async (file, componentId, fieldName) => {
  if (USE_MOCK_DATA) {
    await delay(800);
    return {
      success: true,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      url: URL.createObjectURL(file),
    };
  }
  
  const formData = new FormData();
  formData.append('file', file);
  if (componentId) formData.append('componentId', componentId);
  formData.append('fieldName', fieldName);
  
  const response = await fetch(ENDPOINTS.upload, {
    method: 'POST',
    headers: getMultipartHeaders(),
    body: formData,
  });
  if (!response.ok) throw new Error('Failed to upload file');
  return response.json();
};

/**
 * Validate part code uniqueness
 * @param {string} partCode - Part code to validate
 * @param {string} excludeId - Component ID to exclude (for updates)
 * @returns {Promise<Object>} Validation result { isUnique: boolean }
 */
export const validatePartCode = async (partCode, excludeId = null) => {
  if (USE_MOCK_DATA) {
    await delay(200);
    const exists = componentsData.some(
      c => c.partCode.toLowerCase() === partCode.toLowerCase() && c.id !== excludeId
    );
    return { isUnique: !exists };
  }
  
  const queryString = buildQueryString({ code: partCode, exclude: excludeId });
  const response = await fetch(`${ENDPOINTS.validatePartCode}${queryString}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to validate part code');
  return response.json();
};

/**
 * Fetch components with pagination and filters
 * Used by the list page
 */
export const fetchComponents = async (params = {}) => {
  const { page = 1, limit = 12, search, category, status } = params;
  
  if (USE_MOCK_DATA) {
    await delay(400);
    
    let filtered = [...componentsData];
    
    // Apply category filter
    if (category) {
      filtered = filtered.filter(c => c.productCategory === category);
    }
    
    // Apply status filter
    if (status) {
      filtered = filtered.filter(c => c.status === status);
    }
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(c => 
        c.partName?.toLowerCase().includes(searchLower) ||
        c.partCode?.toLowerCase().includes(searchLower) ||
        c.vendor?.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort by updatedAt descending (newest first)
    filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    // Calculate pagination
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const items = filtered.slice(startIndex, endIndex);
    
    // Enrich with additional display data
    const enrichedItems = items.map(item => ({
      ...item,
      vendor: item.vendor || getMockVendor(item.productCategory),
      checkpoints: item.checkpoints || item.checkingParameters?.parameters?.length || Math.floor(Math.random() * 15) + 5,
      specifications: item.specifications || getMockSpecs(item.productCategory),
      lastInspected: item.lastInspected || (item.status === 'active' ? getMockInspectionDate() : null),
    }));
    
    return {
      items: enrichedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }
  
  // Real API call
  const queryString = buildQueryString({ page, limit, search, category, status });
  const response = await fetch(`${ENDPOINTS.components}${queryString}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch components');
  return response.json();
};

/**
 * Duplicate a component
 * @param {string} id - Component ID to duplicate
 * @returns {Promise<Object>} Duplicated component
 */
export const duplicateComponent = async (id) => {
  if (USE_MOCK_DATA) {
    await delay(500);
    
    const original = componentsData.find(c => c.id === id);
    if (!original) throw new Error('Component not found');
    
    // Create a duplicate with new ID and modified name/code
    const duplicate = {
      ...original,
      id: generateId(),
      partCode: `${original.partCode}-COPY`,
      partName: `${original.partName} (Copy)`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastInspected: null,
    };
    
    componentsData.push(duplicate);
    return duplicate;
  }
  
  const response = await fetch(ENDPOINTS.duplicateComponent(id), {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to duplicate component');
  return response.json();
};

/**
 * Export components to Excel/CSV
 * @param {Object} params - Export filters (category, search)
 * @returns {Promise<Object>} Success response
 */
export const exportComponents = async (params = {}) => {
  if (USE_MOCK_DATA) {
    await delay(800);
    
    // Create mock export data
    let dataToExport = [...componentsData];
    
    if (params.category) {
      dataToExport = dataToExport.filter(c => c.productCategory === params.category);
    }
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      dataToExport = dataToExport.filter(c => 
        c.partName?.toLowerCase().includes(searchLower) ||
        c.partCode?.toLowerCase().includes(searchLower)
      );
    }
    
    // Create CSV content
    const headers = ['Part Code', 'Part Name', 'Category', 'QC Plan', 'Inspection Type', 'Status'];
    const rows = dataToExport.map(c => [
      c.partCode,
      c.partName,
      c.productCategory,
      c.qcPlanNo || '',
      c.inspectionType || '',
      c.status || 'active',
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `components_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    return { success: true, count: dataToExport.length };
  }
  
  // Real API call - expect file download
  const queryString = buildQueryString(params);
  const response = await fetch(`${ENDPOINTS.export}${queryString}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to export components');
  
  const blob = await response.blob();
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `components_export_${new Date().toISOString().split('T')[0]}.xlsx`;
  link.click();
  
  return { success: true };
};

/**
 * Import components from Excel/CSV
 * @param {File} file - Excel/CSV file to import
 * @returns {Promise<Object>} Import result with count
 */
export const importComponents = async (file) => {
  if (USE_MOCK_DATA) {
    await delay(1500);
    
    // Simulate import - in real scenario, parse the file
    console.log('Import file:', file.name, file.size);
    
    // Add some mock imported components
    const importedCount = Math.floor(Math.random() * 5) + 1;
    for (let i = 0; i < importedCount; i++) {
      const newComp = {
        id: generateId(),
        partCode: `IMP-${Date.now()}-${i}`,
        partName: `Imported Component ${i + 1}`,
        productCategory: 'mechanical',
        productGroup: 'Housings',
        qcPlanNo: 'RD.7.3-01',
        inspectionType: 'sampling',
        samplingPlan: 'SP-001',
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      componentsData.push(newComp);
    }
    
    return { success: true, imported: importedCount };
  }
  
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(ENDPOINTS.import, {
    method: 'POST',
    headers: getMultipartHeaders(),
    body: formData,
  });
  if (!response.ok) throw new Error('Failed to import components');
  return response.json();
};

// ============================================
// MOCK DATA HELPERS
// ============================================

const mockVendors = {
  mechanical: ['Precision Components Ltd', 'MechParts India', 'Plastics Pro Ltd'],
  electrical: ['ElectroCables India', 'PowerTech Systems', 'WireTech Solutions'],
  electronics: ['TechDisplay Corp', 'CircuitMaster Inc', 'SensorTech India'],
  optical: ['OptiLens Manufacturing', 'ClearView Optics', 'LightPath Systems'],
  plastic: ['Plastics Pro Ltd', 'PolyMold Industries', 'FormTech Plastics'],
  critical_assembly: ['Precision Components Ltd', 'AssemblyTech Systems'],
};

const getMockVendor = (category) => {
  const vendors = mockVendors[category] || mockVendors.mechanical;
  return vendors[Math.floor(Math.random() * vendors.length)];
};

const getMockSpecs = (category) => {
  const specs = {
    mechanical: { Material: 'ABS Plastic', Color: 'Medical White' },
    electrical: { Material: 'Copper with PVC Sheath', Length: '2.5m' },
    electronics: { Type: 'LCD 7-inch', Resolution: '1024×768' },
    optical: { Material: 'Optical Glass', Coating: 'Anti-reflective' },
    plastic: { Material: 'Medical Grade PP', Color: 'Translucent' },
    critical_assembly: { Material: 'Piezoelectric Crystal', Dimension: '25mm x 15mm x 8mm' },
  };
  return specs[category] || specs.mechanical;
};

const getMockInspectionDate = () => {
  const daysAgo = Math.floor(Math.random() * 7) + 1;
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

// ============================================
// EXPORT CONFIGURATION
// ============================================

export const API_CONFIG = {
  USE_MOCK_DATA,
  API_BASE_URL,
};
