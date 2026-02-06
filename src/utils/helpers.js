/**
 * Utility Helper Functions
 */

/**
 * Format date to locale string
 * @param {string|Date} date - Date to format
 * @param {string} format - Format type ('date', 'datetime', 'time')
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = 'date') => {
  if (!date) return '-';
  
  const d = new Date(date);
  
  const options = {
    date: { year: 'numeric', month: '2-digit', day: '2-digit' },
    datetime: { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    },
    time: { hour: '2-digit', minute: '2-digit', second: '2-digit' },
  };
  
  return d.toLocaleDateString('en-IN', options[format] || options.date);
};

/**
 * Format date as DD.MM.YYYY (Indian format used in forms)
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDateIndian = (date) => {
  if (!date) return '-';
  
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}.${month}.${year}`;
};

/**
 * Parse tolerance string (e.g., "+/- 0.5" or "±0.5")
 * @param {string} toleranceStr - Tolerance string
 * @returns {Object} { plus: number, minus: number }
 */
export const parseTolerance = (toleranceStr) => {
  if (!toleranceStr) return { plus: 0, minus: 0 };
  
  // Handle different formats
  const patterns = [
    /\+\/-\s*([\d.]+)/,  // +/- 0.5
    /±\s*([\d.]+)/,       // ±0.5
    /\+\s*([\d.]+)\s*\/\s*-\s*([\d.]+)/, // +0.5/-0.3
  ];
  
  for (const pattern of patterns) {
    const match = toleranceStr.match(pattern);
    if (match) {
      if (match[2]) {
        return { plus: parseFloat(match[1]), minus: parseFloat(match[2]) };
      }
      const value = parseFloat(match[1]);
      return { plus: value, minus: value };
    }
  }
  
  return { plus: 0, minus: 0 };
};

/**
 * Parse specification string (e.g., "835mm +/- 0.8")
 * @param {string} specStr - Specification string
 * @returns {Object} { nominal, unit, tolerancePlus, toleranceMinus }
 */
export const parseSpecification = (specStr) => {
  if (!specStr) return null;
  
  // Pattern: "835mm +/- 0.8" or "3V AC +/- 0.15"
  const match = specStr.match(/([\d.]+)\s*(\w+)?\s*(?:AC\s*)?\+\/-\s*([\d.]+)/i);
  
  if (match) {
    const tolerance = parseFloat(match[3]);
    return {
      nominal: parseFloat(match[1]),
      unit: match[2] || '',
      tolerancePlus: tolerance,
      toleranceMinus: tolerance,
    };
  }
  
  return null;
};

/**
 * Check if a value is within tolerance
 * @param {number} value - Measured value
 * @param {number} nominal - Nominal/target value
 * @param {number} tolerancePlus - Upper tolerance
 * @param {number} toleranceMinus - Lower tolerance
 * @returns {boolean} True if within tolerance
 */
export const isWithinTolerance = (value, nominal, tolerancePlus, toleranceMinus) => {
  const minValue = nominal - toleranceMinus;
  const maxValue = nominal + tolerancePlus;
  return value >= minValue && value <= maxValue;
};

/**
 * Calculate pass percentage
 * @param {number} passed - Number of passed items
 * @param {number} total - Total items
 * @returns {string} Percentage string (e.g., "95.5%")
 */
export const calculatePassPercentage = (passed, total) => {
  if (total === 0) return '0%';
  return `${((passed / total) * 100).toFixed(1)}%`;
};

/**
 * Generate sequential number
 * @param {string} prefix - Number prefix
 * @param {number} sequence - Sequence number
 * @param {number} padding - Zero padding length
 * @returns {string} Sequential number (e.g., "IR-2026-0001")
 */
export const generateSequentialNumber = (prefix, sequence, padding = 4) => {
  return `${prefix}-${String(sequence).padStart(padding, '0')}`;
};

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

/**
 * Format number with decimal places
 * @param {number} value - Number to format
 * @param {number} decimals - Decimal places
 * @returns {string} Formatted number
 */
export const formatNumber = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return Number(value).toFixed(decimals);
};

/**
 * Format currency in Indian notation (₹ Cr / L / K)
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString('en-IN')}`;
};

/**
 * Format currency in short form (e.g., ₹1.2 Cr)
 * @param {number} amount - Amount to format
 * @returns {string} Short formatted currency
 */
export const formatShortCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
};

/**
 * Format number in compact notation
 * @param {number} num - Number to format
 * @returns {string} Compact formatted number
 */
export const formatCompact = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  if (num >= 10000000) return `${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(2)} L`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString('en-IN');
};

/**
 * Format growth percentage with arrow indicator
 * @param {number} growth - Growth percentage
 * @returns {string} Formatted growth string (e.g., "▲ 12.5%")
 */
export const formatGrowth = (growth) => {
  if (growth === null || growth === undefined || isNaN(growth)) return '0%';
  const arrow = growth >= 0 ? '▲' : '▼';
  return `${arrow} ${Math.abs(growth).toFixed(1)}%`;
};

/**
 * Get status color based on status string
 * @param {string} status - Status string
 * @returns {Object} { bg, text, border } colors
 */
export const getStatusColors = (status) => {
  const statusColors = {
    pass: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10B981', border: '#10B981' },
    passed: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10B981', border: '#10B981' },
    accepted: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10B981', border: '#10B981' },
    fail: { bg: 'rgba(239, 68, 68, 0.1)', text: '#EF4444', border: '#EF4444' },
    failed: { bg: 'rgba(239, 68, 68, 0.1)', text: '#EF4444', border: '#EF4444' },
    rejected: { bg: 'rgba(239, 68, 68, 0.1)', text: '#EF4444', border: '#EF4444' },
    pending: { bg: 'rgba(245, 158, 11, 0.1)', text: '#F59E0B', border: '#F59E0B' },
    in_progress: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3B82F6', border: '#3B82F6' },
    default: { bg: 'rgba(107, 114, 128, 0.1)', text: '#6B7280', border: '#6B7280' },
  };
  
  return statusColors[status?.toLowerCase()] || statusColors.default;
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Check if all required fields are filled
 * @param {Object} readings - Readings object
 * @param {Array} checkpoints - Checkpoints array
 * @param {number} sampleSize - Required sample size
 * @returns {Object} { isComplete, missingCount, details }
 */
export const checkReadingsComplete = (readings, checkpoints, sampleSize) => {
  const missingReadings = [];
  
  checkpoints.forEach((checkpoint) => {
    const checkpointReadings = readings[checkpoint.id] || {};
    
    for (let i = 1; i <= sampleSize; i++) {
      const reading = checkpointReadings.readings?.[i];
      if (!reading || (reading.value === null && reading.value !== 0)) {
        missingReadings.push({
          checkpoint: checkpoint.name,
          sample: i,
        });
      }
    }
  });
  
  return {
    isComplete: missingReadings.length === 0,
    missingCount: missingReadings.length,
    details: missingReadings,
  };
};

/**
 * Get initials from a name string
 * @param {string} name - Full name
 * @returns {string} Initials (e.g., "Rajesh Kumar" → "RK")
 */
export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(part => part.length > 0)
    .map(part => part[0].toUpperCase())
    .slice(0, 2)
    .join('');
};

/**
 * Calculate growth percentage between last year and current year
 * @param {number} ly - Last year value
 * @param {number} cy - Current year value
 * @returns {number} Growth percentage
 */
export const calcGrowth = (ly, cy) => {
  if (!ly || ly === 0) return cy > 0 ? 100 : 0;
  return ((cy - ly) / ly) * 100;
};

/**
 * Named Utils export — used by components that import { Utils }
 */
export const Utils = {
  formatDate,
  formatDateIndian,
  parseTolerance,
  parseSpecification,
  isWithinTolerance,
  calculatePassPercentage,
  generateSequentialNumber,
  deepClone,
  debounce,
  formatNumber,
  formatCurrency,
  formatShortCurrency,
  formatCompact,
  formatGrowth,
  calcGrowth,
  getInitials,
  getStatusColors,
  truncateText,
  checkReadingsComplete,
};

export default Utils;
