/**
 * API Module Index
 * Central export for all API services
 */

// Configuration
export { USE_MOCK_API, API_CONFIG, ENDPOINTS, getHeaders } from './config';

// Services
export * from './inspectionService';

// Mock Data (for testing/development)
export * from './mockData';

// Default export
export { default as inspectionService } from './inspectionService';
