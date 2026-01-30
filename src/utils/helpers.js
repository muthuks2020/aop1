/**
 * Utility Functions
 */

export const Utils = {
  calcGrowth(ly, cy) {
    if (ly === 0) return cy > 0 ? 100 : 0;
    return ((cy - ly) / ly * 100);
  },

  formatGrowth(value) {
    const formatted = value.toFixed(1);
    return (value >= 0 ? '+' : '') + formatted + '%';
  },

  formatNumber(n) {
    return n.toLocaleString('en-IN');
  },

  getStatusIcon(status) {
    const icons = { 
      draft: 'fa-edit', 
      submitted: 'fa-clock', 
      approved: 'fa-check-circle', 
      rejected: 'fa-times-circle' 
    };
    return icons[status] || 'fa-circle';
  },

  getStatusLabel(status) {
    const labels = { 
      draft: 'Draft', 
      submitted: 'Pending', 
      approved: 'Approved', 
      rejected: 'Rejected' 
    };
    return labels[status] || status;
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  },

  getInitials(name) {
    if (!name) return '';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
};

export default Utils;
