/**
 * Utility Functions
 * Updated: Using lowercase month keys for consistency
 */

export const Utils = {
  // Growth calculation
  calcGrowth(ly, cy) {
    if (ly === 0) return cy > 0 ? 100 : 0;
    return ((cy - ly) / ly * 100);
  },

  // Format growth percentage
  formatGrowth(value) {
    const formatted = value.toFixed(1);
    return (value >= 0 ? '+' : '') + formatted + '%';
  },

  // Format number with Indian locale
  formatNumber(n) {
    if (n === null || n === undefined) return '-';
    return n.toLocaleString('en-IN');
  },

  // Format currency (INR)
  formatCurrency(n) {
    if (n >= 10000000) {
      return '₹' + (n / 10000000).toFixed(2) + ' Cr';
    } else if (n >= 100000) {
      return '₹' + (n / 100000).toFixed(2) + ' L';
    } else if (n >= 1000) {
      return '₹' + (n / 1000).toFixed(1) + ' K';
    }
    return '₹' + n.toLocaleString('en-IN');
  },

  // Format short currency for display
  formatShortCurrency(n) {
    if (n >= 10000000) {
      return (n / 10000000).toFixed(1) + 'Cr';
    } else if (n >= 100000) {
      return (n / 100000).toFixed(1) + 'L';
    } else if (n >= 1000) {
      return (n / 1000).toFixed(0) + 'K';
    }
    return n.toString();
  },

  // Status icon mapping
  getStatusIcon(status) {
    const icons = { 
      draft: 'fa-edit', 
      submitted: 'fa-clock', 
      approved: 'fa-check-circle', 
      rejected: 'fa-times-circle' 
    };
    return icons[status] || 'fa-circle';
  },

  // Status label mapping
  getStatusLabel(status) {
    const labels = { 
      draft: 'Draft', 
      submitted: 'Pending Approval', 
      approved: 'Approved', 
      rejected: 'Rejected' 
    };
    return labels[status] || status;
  },

  // Format date
  formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  },

  // Get user initials
  getInitials(name) {
    if (!name) return '';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  },

  // Get fiscal year months in order (lowercase)
  getFiscalMonths() {
    return ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];
  },

  // Get quarter configuration
  getQuarters() {
    return [
      { id: 'Q1', name: 'Q1 (Apr-Jun)', months: ['apr', 'may', 'jun'] },
      { id: 'Q2', name: 'Q2 (Jul-Sep)', months: ['jul', 'aug', 'sep'] },
      { id: 'Q3', name: 'Q3 (Oct-Dec)', months: ['oct', 'nov', 'dec'] },
      { id: 'Q4', name: 'Q4 (Jan-Mar)', months: ['jan', 'feb', 'mar'] }
    ];
  },

  // Calculate quarterly totals from monthly data
  calculateQuarterlyTotals(monthlyTargets) {
    const quarters = this.getQuarters();
    const quarterlyData = {};

    quarters.forEach(quarter => {
      let lyQty = 0, cyQty = 0, lyRev = 0, cyRev = 0;
      
      quarter.months.forEach(month => {
        if (monthlyTargets && monthlyTargets[month]) {
          lyQty += monthlyTargets[month].lyQty || 0;
          cyQty += monthlyTargets[month].cyQty || 0;
          lyRev += monthlyTargets[month].lyRev || 0;
          cyRev += monthlyTargets[month].cyRev || 0;
        }
      });

      quarterlyData[quarter.id] = {
        lyQty,
        cyQty,
        lyRev,
        cyRev,
        qtyGrowth: this.calcGrowth(lyQty, cyQty),
        revGrowth: this.calcGrowth(lyRev, cyRev)
      };
    });

    return quarterlyData;
  },

  // Calculate yearly totals from monthly data
  calculateYearlyTotals(monthlyTargets) {
    let lyQty = 0, cyQty = 0, lyRev = 0, cyRev = 0;
    
    this.getFiscalMonths().forEach(month => {
      if (monthlyTargets && monthlyTargets[month]) {
        lyQty += monthlyTargets[month].lyQty || 0;
        cyQty += monthlyTargets[month].cyQty || 0;
        lyRev += monthlyTargets[month].lyRev || 0;
        cyRev += monthlyTargets[month].cyRev || 0;
      }
    });

    return {
      lyQty,
      cyQty,
      lyRev,
      cyRev,
      qtyGrowth: this.calcGrowth(lyQty, cyQty),
      revGrowth: this.calcGrowth(lyRev, cyRev)
    };
  },

  // Get current fiscal quarter
  getCurrentQuarter() {
    const month = new Date().getMonth();
    if (month >= 3 && month <= 5) return 'Q1';
    if (month >= 6 && month <= 8) return 'Q2';
    if (month >= 9 && month <= 11) return 'Q3';
    return 'Q4';
  },

  // Get current fiscal month (lowercase)
  getCurrentFiscalMonth() {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    return months[new Date().getMonth()];
  }
};

export default Utils;
