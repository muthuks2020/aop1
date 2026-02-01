import React from 'react';
import { Utils } from '../../utils/helpers';

function OverviewStats({ products, categories }) {
  const calculateOverallTotals = () => {
    let lyQty = 0, cyQty = 0;
    products.forEach(p => {
      if (p.monthlyTargets) {
        Object.values(p.monthlyTargets).forEach(m => {
          lyQty += m.lyQty || 0;
          cyQty += m.cyQty || 0;
        });
      }
    });
    return { lyQty, cyQty, growth: Utils.calcGrowth(lyQty, cyQty) };
  };

  const getStatusCounts = () => {
    const counts = {
      total: products.length,
      draft: products.filter(p => p.status === 'draft').length,
      submitted: products.filter(p => p.status === 'submitted').length,
      approved: products.filter(p => p.status === 'approved').length,
      rejected: products.filter(p => p.status === 'rejected').length
    };
    counts.pending = counts.draft + counts.rejected;
    counts.completionPercent = counts.total > 0 ? Math.round(((counts.approved + counts.submitted) / counts.total) * 100) : 0;
    return counts;
  };

  const getCategoryTotals = () => {
    return categories.map(cat => {
      const catProducts = products.filter(p => p.categoryId === cat.id);
      let lyQty = 0, cyQty = 0;
      catProducts.forEach(p => {
        if (p.monthlyTargets) {
          Object.values(p.monthlyTargets).forEach(m => {
            lyQty += m.lyQty || 0;
            cyQty += m.cyQty || 0;
          });
        }
      });
      return {
        ...cat,
        lyQty, cyQty,
        growth: Utils.calcGrowth(lyQty, cyQty),
        productCount: catProducts.length,
        approved: catProducts.filter(p => p.status === 'approved').length,
        submitted: catProducts.filter(p => p.status === 'submitted').length,
        pending: catProducts.filter(p => p.status === 'draft' || p.status === 'rejected').length
      };
    });
  };

  const getQuarterlyTotals = () => {
    const quarters = [
      { id: 'Q1', label: 'Q1 (Apr-Jun)', months: ['apr', 'may', 'jun'] },
      { id: 'Q2', label: 'Q2 (Jul-Sep)', months: ['jul', 'aug', 'sep'] },
      { id: 'Q3', label: 'Q3 (Oct-Dec)', months: ['oct', 'nov', 'dec'] },
      { id: 'Q4', label: 'Q4 (Jan-Mar)', months: ['jan', 'feb', 'mar'] }
    ];
    return quarters.map(q => {
      let lyQty = 0, cyQty = 0;
      products.forEach(p => {
        if (p.monthlyTargets) {
          q.months.forEach(m => {
            lyQty += p.monthlyTargets[m]?.lyQty || 0;
            cyQty += p.monthlyTargets[m]?.cyQty || 0;
          });
        }
      });
      return { ...q, lyQty, cyQty, growth: Utils.calcGrowth(lyQty, cyQty) };
    });
  };

  const totals = calculateOverallTotals();
  const statusCounts = getStatusCounts();
  const categoryTotals = getCategoryTotals();
  const quarterlyTotals = getQuarterlyTotals();

  return (
    <div className="overview-stats">
      {/* Summary Cards */}
      <div className="overview-section">
        <h3 className="section-title"><i className="fas fa-chart-bar"></i> Overall Summary</h3>
        <div className="summary-cards">
          <div className="summary-card total">
            <div className="card-icon"><i className="fas fa-boxes-stacked"></i></div>
            <div className="card-content">
              <span className="card-value">{statusCounts.total}</span>
              <span className="card-label">Total Products</span>
            </div>
          </div>
          <div className="summary-card approved">
            <div className="card-icon"><i className="fas fa-check-circle"></i></div>
            <div className="card-content">
              <span className="card-value">{statusCounts.approved}</span>
              <span className="card-label">Approved</span>
            </div>
          </div>
          <div className="summary-card submitted">
            <div className="card-icon"><i className="fas fa-clock"></i></div>
            <div className="card-content">
              <span className="card-value">{statusCounts.submitted}</span>
              <span className="card-label">Pending Approval</span>
            </div>
          </div>
          <div className="summary-card pending">
            <div className="card-icon"><i className="fas fa-edit"></i></div>
            <div className="card-content">
              <span className="card-value">{statusCounts.pending}</span>
              <span className="card-label">Draft/Rejected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quarterly Breakdown */}
      <div className="overview-section">
        <h3 className="section-title"><i className="fas fa-calendar-alt"></i> Quarterly Breakdown</h3>
        <div className="quarterly-cards">
          {quarterlyTotals.map(q => (
            <div key={q.id} className={`quarterly-card ${q.id.toLowerCase()}`}>
              <div className="quarter-header">
                <span className="quarter-label">{q.label}</span>
                <span className={`quarter-growth ${q.growth >= 0 ? 'positive' : 'negative'}`}>{Utils.formatGrowth(q.growth)}</span>
              </div>
              <div className="quarter-values">
                <div className="quarter-value"><span className="label">LY</span><span className="value">{Utils.formatNumber(q.lyQty)}</span></div>
                <div className="quarter-value highlight"><span className="label">CY</span><span className="value">{Utils.formatNumber(q.cyQty)}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="overview-section">
        <h3 className="section-title"><i className="fas fa-layer-group"></i> Category Performance</h3>
        <div className="category-cards">
          {categoryTotals.map(cat => (
            <div key={cat.id} className={`category-card ${cat.color}`}>
              <div className="cat-header">
                <div className="cat-icon"><i className={`fas ${cat.icon}`}></i></div>
                <span className="cat-name">{cat.name}</span>
                <span className={`cat-growth ${cat.growth >= 0 ? 'positive' : 'negative'}`}>{Utils.formatGrowth(cat.growth)}</span>
              </div>
              <div className="cat-metrics">
                <div className="cat-metric"><span className="metric-label">LY Qty</span><span className="metric-value">{Utils.formatNumber(cat.lyQty)}</span></div>
                <div className="cat-metric highlight"><span className="metric-label">CY Target</span><span className="metric-value">{Utils.formatNumber(cat.cyQty)}</span></div>
              </div>
              <div className="cat-status-bar">
                <div className="cat-status-segment approved" style={{ width: `${(cat.approved / cat.productCount) * 100}%` }} title={`${cat.approved} Approved`}></div>
                <div className="cat-status-segment submitted" style={{ width: `${(cat.submitted / cat.productCount) * 100}%` }} title={`${cat.submitted} Submitted`}></div>
                <div className="cat-status-segment pending" style={{ width: `${(cat.pending / cat.productCount) * 100}%` }} title={`${cat.pending} Pending`}></div>
              </div>
              <div className="cat-status-labels">
                <span className="status-label approved"><i className="fas fa-check"></i> {cat.approved}</span>
                <span className="status-label submitted"><i className="fas fa-clock"></i> {cat.submitted}</span>
                <span className="status-label pending"><i className="fas fa-edit"></i> {cat.pending}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default OverviewStats;
