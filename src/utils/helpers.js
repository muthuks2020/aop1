/**
 * Utility functions for Product Commitment PWA
 */

export const Utils = {
  /**
   * Format number with comma separators
   */
  formatNumber: (num) => {
    if (num === null || num === undefined) return '-';
    return num.toLocaleString('en-IN');
  },

  /**
   * Format currency in Indian Rupees
   */
  formatCurrency: (amount) => {
    if (amount === null || amount === undefined) return '-';
    return '₹' + amount.toLocaleString('en-IN');
  },

  /**
   * Format large currency values (Lakhs/Crores)
   */
  formatShortCurrency: (amount) => {
    if (amount === null || amount === undefined) return '-';
    if (amount >= 10000000) {
      return '₹' + (amount / 10000000).toFixed(2) + ' Cr';
    } else if (amount >= 100000) {
      return '₹' + (amount / 100000).toFixed(2) + ' L';
    } else if (amount >= 1000) {
      return '₹' + (amount / 1000).toFixed(1) + ' K';
    }
    return '₹' + amount.toLocaleString('en-IN');
  },

  /**
   * Format large numbers compactly (K, L, Cr) - without currency symbol
   * Used for compact display of revenue/quantities in grids
   */
  formatCompact: (num) => {
    if (num === null || num === undefined || num === 0) return '0';
    if (num >= 10000000) {
      return (num / 10000000).toFixed(1) + 'Cr';
    } else if (num >= 100000) {
      return (num / 100000).toFixed(1) + 'L';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString('en-IN');
  },

  /**
   * Calculate growth percentage
   */
  calcGrowth: (ly, cy) => {
    if (!ly || ly === 0) return cy > 0 ? 100 : 0;
    return ((cy - ly) / ly) * 100;
  },

  /**
   * Format growth percentage
   */
  formatGrowth: (growth) => {
    if (growth === null || growth === undefined || isNaN(growth)) return '-';
    const sign = growth >= 0 ? '+' : '';
    return sign + growth.toFixed(1) + '%';
  },

  /**
   * Get initials from name
   */
  getInitials: (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  },

  /**
   * Calculate yearly totals from monthly targets
   */
  calculateYearlyTotals: (monthlyTargets) => {
    if (!monthlyTargets) return { lyQty: 0, cyQty: 0, lyRev: 0, cyRev: 0 };
    
    return Object.values(monthlyTargets).reduce((acc, month) => {
      acc.lyQty += month.lyQty || 0;
      acc.cyQty += month.cyQty || 0;
      acc.lyRev += month.lyRev || 0;
      acc.cyRev += month.cyRev || 0;
      return acc;
    }, { lyQty: 0, cyQty: 0, lyRev: 0, cyRev: 0 });
  },

  /**
   * Format date to locale string
   */
  formatDate: (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  },

  /**
   * Format date with time
   */
  formatDateTime: (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  /**
   * Debounce function
   */
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Get status color class
   */
  getStatusColor: (status) => {
    const colors = {
      draft: 'status-draft',
      submitted: 'status-submitted',
      approved: 'status-approved',
      rejected: 'status-rejected'
    };
    return colors[status] || 'status-draft';
  },

  /**
   * Get quarter from month
   */
  getQuarter: (month) => {
    const quarters = {
      apr: 'Q1', may: 'Q1', jun: 'Q1',
      jul: 'Q2', aug: 'Q2', sep: 'Q2',
      oct: 'Q3', nov: 'Q3', dec: 'Q3',
      jan: 'Q4', feb: 'Q4', mar: 'Q4'
    };
    return quarters[month.toLowerCase()] || 'Q1';
  }
};

export default Utils;
