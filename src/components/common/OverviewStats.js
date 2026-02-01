import React from 'react';
import { Utils } from '../../utils/helpers';

function OverviewStats({ products, categories }) {
  // Calculate overall totals
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

  // Calculate status counts
  const getStatusCounts = () => {
    const counts = {
      total: products.length,
      draft: products.filter(p => p.status === 'draft').length,
      submitted: products.filter(p => p.status === 'submitted').length,
      approved: products.filter(p => p.status === 'approved').length,
      rejected: products.filter(p => p.status === 'rejected').length
    };
    counts.pending = counts.draft + counts.rejected;
    counts.completionPercent = counts.total > 0 
      ? Math.round(((counts.approved + counts.submitted) / counts.total) * 100) 
      : 0;
    return counts;
  };

  // Calculate category-wise totals
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
      const statusCounts = {
        approved: catProducts.filter(p => p.status === 'approved').length,
        submitted: catProducts.filter(p => p.status === 'submitted').length,
        pending: catProducts.filter(p => p.status === 'draft' || p.status === 'rejected').length
      };
      return {
        ...cat,
        lyQty,
        cyQty,
        growth: Utils.calcGrowth(lyQty, cyQty),
        productCount: catProducts.length,
        ...statusCounts
      };
    });
  };

  // Calculate quarterly totals
  const getQuarterlyTotals = () => {
    const quarters = [
      { id: 'Q1', months: ['apr', 'may', 'jun'], label: 'Q1 (Apr-Jun)' },
      { id: 'Q2', months: ['jul', 'aug', 'sep'], label: 'Q2 (Jul-Sep)' },
      { id: 'Q3', months: ['oct', 'nov', 'dec'], label: 'Q3 (Oct-Dec)' },
      { id: 'Q4', months: ['jan', 'feb', 'mar'], label: 'Q4 (Jan-Mar)' }
    ];

    return quarters.map(q => {
      let lyQty = 0, cyQty = 0;
      products.forEach(p => {
        if (p.monthlyTargets) {
          q.months.forEach(month => {
            if (p.monthlyTargets[month]) {
              lyQty += p.monthlyTargets[month].lyQty || 0;
              cyQty += p.monthlyTargets[month].cyQty || 0;
            }
          });
        }
      });
      return {
        ...q,
        lyQty,
        cyQty,
        growth: Utils.calcGrowth(lyQty, cyQty)
      };
    });
  };

  const totals = calculateOverallTotals();
  const statusCounts = getStatusCounts();
  const categoryTotals = getCategoryTotals();
  const quarterlyTotals = getQuarterlyTotals();

  return (
    <div className="overview-stats">
      {/* Summary Cards Row */}
      <div className="stats-cards-row">
        <div className="stat-card total">
          <div className="stat-icon">
            <i className="fas fa-boxes-stacked"></i>
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Products</span>
            <span className="stat-value">{statusCounts.total}</span>
          </div>
        </div>

        <div className="stat-card ly">
          <div className="stat-icon blue">
            <i className="fas fa-history"></i>
          </div>
          <div className="stat-content">
            <span className="stat-label">LY Total Qty</span>
            <span className="stat-value">{Utils.formatNumber(totals.lyQty)}</span>
          </div>
        </div>

        <div className="stat-card cy">
          <div className="stat-icon green">
            <i className="fas fa-bullseye"></i>
          </div>
          <div className="stat-content">
            <span className="stat-label">CY Target Qty</span>
            <span className="stat-value">{Utils.formatNumber(totals.cyQty)}</span>
            <span className={`stat-growth ${totals.growth >= 0 ? 'positive' : 'negative'}`}>
              <i className={`fas fa-arrow-${totals.growth >= 0 ? 'up' : 'down'}`}></i>
              {Utils.formatGrowth(totals.growth)}
            </span>
          </div>
        </div>

        <div className="stat-card completion">
          <div className="stat-icon purple">
            <i className="fas fa-chart-pie"></i>
          </div>
          <div className="stat-content">
            <span className="stat-label">Completion</span>
            <span className="stat-value">{statusCounts.completionPercent}%</span>
            <div className="mini-progress">
              <div className="mini-progress-fill" style={{ width: `${statusCounts.completionPercent}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Overview */}
      <div className="status-overview-row">
        <div className="status-overview-card">
          <h4><i className="fas fa-tasks"></i> Approval Status</h4>
          <div className="status-items">
            <div className="status-item approved">
              <div className="status-icon"><i className="fas fa-check-circle"></i></div>
              <div className="status-info">
                <span className="status-count">{statusCounts.approved}</span>
                <span className="status-label">Approved</span>
              </div>
              <div className="status-bar">
                <div className="status-bar-fill" style={{ width: `${(statusCounts.approved / statusCounts.total) * 100}%` }}></div>
              </div>
            </div>
            <div className="status-item submitted">
              <div className="status-icon"><i className="fas fa-clock"></i></div>
              <div className="status-info">
                <span className="status-count">{statusCounts.submitted}</span>
                <span className="status-label">Pending Approval</span>
              </div>
              <div className="status-bar">
                <div className="status-bar-fill" style={{ width: `${(statusCounts.submitted / statusCounts.total) * 100}%` }}></div>
              </div>
            </div>
            <div className="status-item pending">
              <div className="status-icon"><i className="fas fa-edit"></i></div>
              <div className="status-info">
                <span className="status-count">{statusCounts.pending}</span>
                <span className="status-label">Yet to Submit</span>
              </div>
              <div className="status-bar">
                <div className="status-bar-fill" style={{ width: `${(statusCounts.pending / statusCounts.total) * 100}%` }}></div>
              </div>
            </div>
            {statusCounts.rejected > 0 && (
              <div className="status-item rejected">
                <div className="status-icon"><i className="fas fa-times-circle"></i></div>
                <div className="status-info">
                  <span className="status-count">{statusCounts.rejected}</span>
                  <span className="status-label">Rejected</span>
                </div>
                <div className="status-bar">
                  <div className="status-bar-fill" style={{ width: `${(statusCounts.rejected / statusCounts.total) * 100}%` }}></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quarterly Summary */}
        <div className="quarterly-summary-card">
          <h4><i className="fas fa-calendar-alt"></i> Quarterly Summary</h4>
          <div className="quarter-items">
            {quarterlyTotals.map(q => (
              <div key={q.id} className={`quarter-item ${q.id.toLowerCase()}`}>
                <div className="quarter-header">
                  <span className="quarter-name">{q.id}</span>
                  <span className={`quarter-growth ${q.growth >= 0 ? 'positive' : 'negative'}`}>
                    {Utils.formatGrowth(q.growth)}
                  </span>
                </div>
                <div className="quarter-data">
                  <div className="quarter-metric">
                    <span className="metric-label">LY</span>
                    <span className="metric-value">{Utils.formatNumber(q.lyQty)}</span>
                  </div>
                  <div className="quarter-arrow">
                    <i className={`fas fa-arrow-right ${q.growth >= 0 ? 'positive' : 'negative'}`}></i>
                  </div>
                  <div className="quarter-metric">
                    <span className="metric-label">CY</span>
                    <span className="metric-value highlight">{Utils.formatNumber(q.cyQty)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category-wise Summary */}
      <div className="category-summary-row">
        <h4><i className="fas fa-layer-group"></i> Category-wise Summary</h4>
        <div className="category-cards">
          {categoryTotals.map(cat => (
            <div key={cat.id} className={`category-summary-card ${cat.color}`}>
              <div className="cat-header">
                <div className={`cat-icon ${cat.color}`}>
                  <i className={`fas ${cat.icon}`}></i>
                </div>
                <div className="cat-title">
                  <span className="cat-name">{cat.name}</span>
                  <span className="cat-count">{cat.productCount} products</span>
                </div>
                <span className={`cat-growth ${cat.growth >= 0 ? 'positive' : 'negative'}`}>
                  {Utils.formatGrowth(cat.growth)}
                </span>
              </div>
              <div className="cat-metrics">
                <div className="cat-metric">
                  <span className="metric-label">LY Qty</span>
                  <span className="metric-value">{Utils.formatNumber(cat.lyQty)}</span>
                </div>
                <div className="cat-metric highlight">
                  <span className="metric-label">CY Target</span>
                  <span className="metric-value">{Utils.formatNumber(cat.cyQty)}</span>
                </div>
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
