import React from 'react';
import { Utils } from '../../utils/helpers';

function StatsRow({ totalProducts, lyQty, cyQty, qtyGrowth, lyRev, cyRev, revGrowth }) {
  return (
    <div className="stats-row">
      <div className="stat-card glass">
        <div className="stat-icon"><i className="fas fa-boxes-stacked"></i></div>
        <div className="stat-content">
          <span className="stat-label">Total Products</span>
          <span className="stat-value">{totalProducts}</span>
        </div>
      </div>
      <div className="stat-card glass">
        <div className="stat-icon blue"><i className="fas fa-history"></i></div>
        <div className="stat-content">
          <span className="stat-label">LY Qty</span>
          <span className="stat-value">{Utils.formatNumber(lyQty)}</span>
        </div>
      </div>
      <div className="stat-card glass">
        <div className="stat-icon green"><i className="fas fa-bullseye"></i></div>
        <div className="stat-content">
          <span className="stat-label">CY Qty Target</span>
          <span className="stat-value">{Utils.formatNumber(cyQty)}</span>
          <span className={`stat-growth ${qtyGrowth < 0 ? 'negative' : ''}`}>{Utils.formatGrowth(qtyGrowth)}</span>
        </div>
      </div>
      <div className="stat-card glass">
        <div className="stat-icon purple"><i className="fas fa-rupee-sign"></i></div>
        <div className="stat-content">
          <span className="stat-label">CY Revenue Target</span>
          <span className="stat-value">{Utils.formatCurrency(cyRev)}</span>
          <span className={`stat-growth ${revGrowth < 0 ? 'negative' : ''}`}>{Utils.formatGrowth(revGrowth)}</span>
        </div>
      </div>
    </div>
  );
}

export default StatsRow;
