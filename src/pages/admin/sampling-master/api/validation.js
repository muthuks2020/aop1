/**
 * Validation Utilities for Sampling Master
 * =========================================
 * Comprehensive validation for Sampling Plan and Quality Plan forms
 */

// ============================================
// VALIDATION RULES
// ============================================

const VALIDATION_RULES = {
  // Sampling Plan validation rules
  samplePlanNo: {
    required: true,
    minLength: 2,
    maxLength: 20,
    pattern: /^[A-Za-z0-9\-_]+$/,
    patternMessage: 'Only letters, numbers, hyphens, and underscores allowed',
  },
  samplePlanType: {
    required: true,
    validValues: ['SP0', 'SP1', 'SP2', 'SP3'],
  },
  iterations: {
    required: true,
    min: 1,
    max: 3,
  },
  lotMin: {
    required: true,
    min: 1,
    max: 999999,
  },
  lotMax: {
    required: true,
    min: 1,
    max: 999999,
  },
  
  // Quality Plan validation rules
  qcPlanNo: {
    required: true,
    minLength: 2,
    maxLength: 30,
    pattern: /^[A-Za-z0-9\-_.]+$/,
    patternMessage: 'Only letters, numbers, hyphens, underscores, and dots allowed',
  },
  productId: {
    required: true,
  },
  documentRevNo: {
    required: true,
    minLength: 1,
    maxLength: 20,
  },
  revisionDate: {
    required: true,
  },
  departmentId: {
    required: true,
  },
};

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validate a single field
 * @param {string} fieldName - Name of the field
 * @param {any} value - Value to validate
 * @param {Object} formData - Complete form data for cross-field validation
 * @returns {string|null} - Error message or null if valid
 */
export const validateField = (fieldName, value, formData = {}) => {
  const rules = VALIDATION_RULES[fieldName];
  if (!rules) return null;
  
  // Required check
  if (rules.required && (value === undefined || value === null || value === '')) {
    return `This field is required`;
  }
  
  // If not required and empty, skip other validations
  if (!rules.required && (value === undefined || value === null || value === '')) {
    return null;
  }
  
  // String validations
  if (typeof value === 'string') {
    if (rules.minLength && value.length < rules.minLength) {
      return `Minimum ${rules.minLength} characters required`;
    }
    if (rules.maxLength && value.length > rules.maxLength) {
      return `Maximum ${rules.maxLength} characters allowed`;
    }
    if (rules.pattern && !rules.pattern.test(value)) {
      return rules.patternMessage || 'Invalid format';
    }
  }
  
  // Number validations
  if (typeof value === 'number' || rules.min !== undefined || rules.max !== undefined) {
    const numValue = Number(value);
    if (isNaN(numValue)) {
      return 'Must be a valid number';
    }
    if (rules.min !== undefined && numValue < rules.min) {
      return `Minimum value is ${rules.min}`;
    }
    if (rules.max !== undefined && numValue > rules.max) {
      return `Maximum value is ${rules.max}`;
    }
  }
  
  // Valid values check
  if (rules.validValues && !rules.validValues.includes(value)) {
    return 'Please select a valid option';
  }
  
  // Cross-field validations
  if (fieldName === 'lotMax' && formData.lotMin) {
    if (Number(value) < Number(formData.lotMin)) {
      return 'Max must be greater than or equal to Min';
    }
  }
  
  return null;
};

/**
 * Validate entire sampling plan form
 * @param {Object} formData - Form data to validate
 * @returns {Object} - Object with field names as keys and error messages as values
 */
export const validateSamplingPlanForm = (formData) => {
  const errors = {};
  
  // Validate basic fields
  const basicFields = ['samplePlanNo', 'samplePlanType', 'iterations'];
  basicFields.forEach(field => {
    const error = validateField(field, formData[field], formData);
    if (error) errors[field] = error;
  });
  
  // Validate lot ranges
  if (formData.lotRanges && formData.lotRanges.length > 0) {
    const lotRangeErrors = [];
    let hasErrors = false;
    
    formData.lotRanges.forEach((range, index) => {
      const rangeErrors = {};
      
      // Validate lot min
      if (!range.lotMin || range.lotMin < 1) {
        rangeErrors.lotMin = 'Lot Min is required';
        hasErrors = true;
      }
      
      // Validate lot max
      if (!range.lotMax || range.lotMax < 1) {
        rangeErrors.lotMax = 'Lot Max is required';
        hasErrors = true;
      } else if (range.lotMin && Number(range.lotMax) < Number(range.lotMin)) {
        rangeErrors.lotMax = 'Max must be >= Min';
        hasErrors = true;
      }
      
      // Validate sample quantities
      if (range.iteration1 !== undefined && (range.iteration1 < 1 || range.iteration1 > range.lotMax)) {
        rangeErrors.iteration1 = 'Invalid sample quantity';
        hasErrors = true;
      }
      
      // Validate pass requirements
      if (range.passRequired1 !== undefined && range.iteration1 !== undefined) {
        if (range.passRequired1 > range.iteration1) {
          rangeErrors.passRequired1 = 'Cannot exceed sample qty';
          hasErrors = true;
        }
      }
      
      lotRangeErrors.push(rangeErrors);
    });
    
    if (hasErrors) {
      errors.lotRanges = lotRangeErrors;
    }
  } else {
    errors.lotRanges = 'At least one lot range is required';
  }
  
  return errors;
};

/**
 * Validate entire quality plan form
 * @param {Object} formData - Form data to validate
 * @returns {Object} - Object with field names as keys and error messages as values
 */
export const validateQualityPlanForm = (formData) => {
  const errors = {};
  
  const fields = ['qcPlanNo', 'productId', 'documentRevNo', 'revisionDate', 'departmentId'];
  fields.forEach(field => {
    const error = validateField(field, formData[field], formData);
    if (error) errors[field] = error;
  });
  
  return errors;
};

/**
 * Check if form has errors
 * @param {Object} errors - Errors object
 * @returns {boolean} - True if has errors
 */
export const hasErrors = (errors) => {
  if (!errors) return false;
  return Object.keys(errors).some(key => {
    const value = errors[key];
    if (Array.isArray(value)) {
      return value.some(item => Object.keys(item).length > 0);
    }
    return value !== null && value !== undefined && value !== '';
  });
};

/**
 * Get initial form state for sampling plan
 */
export const getInitialSamplingPlanState = () => ({
  samplePlanNo: '',
  samplePlanType: 'SP1',
  iterations: 1,
  lotRanges: [
    {
      id: Date.now(),
      lotMin: 2,
      lotMax: 50,
      iteration1: 8,
      iteration2: 16,
      iteration3: 50,
      passRequired1: 7,
      passRequired2: 15,
      passRequired3: 48,
    },
  ],
});

/**
 * Get initial form state for quality plan
 */
export const getInitialQualityPlanState = () => ({
  qcPlanNo: '',
  productId: '',
  documentRevNo: '',
  revisionDate: new Date().toISOString().split('T')[0],
  departmentId: '',
  description: '',
});

/**
 * Get initial error state
 */
export const getInitialErrorState = () => ({});

/**
 * Debounce utility
 */
export const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

export default {
  validateField,
  validateSamplingPlanForm,
  validateQualityPlanForm,
  hasErrors,
  getInitialSamplingPlanState,
  getInitialQualityPlanState,
  getInitialErrorState,
  debounce,
};
