import React from 'react';
import { Utils } from '../../utils/helpers';

function StatsRow({ totalProducts, lyUnits, cyUnits, overallGrowth }) {
  return (
    <div className="stats-row">
      <div className="stat-card glass">
        <div className="stat-icon">
          <i className="fas fa-boxes-stacked"></i>
        </div>
        <div className="stat-content">
          <span className="stat-label">Total Products</span>
          <span className="stat-value">{totalProducts}</span>
        </div>
      </div>
      
      <div className="stat-card glass">
        <div className="stat-icon blue">
          <i className="fas fa-history"></i>
        </div>
        <div className="stat-content">
          <span className="stat-label">LY Units</span>
          <span className="stat-value">{Utils.formatNumber(lyUnits)}</span>
        </div>
      </div>
      
      <div className="stat-card glass">
        <div className="stat-icon green">
          <i className="fas fa-bullseye"></i>
        </div>
        <div className="stat-content">
          <span className="stat-label">CY Commitment</span>
          <span className="stat-value">{Utils.formatNumber(cyUnits)}</span>
        </div>
      </div>
      
      <div className="stat-card glass">
        <div className="stat-icon orange">
          <i className="fas fa-chart-line"></i>
        </div>
        <div className="stat-content">
          <span className="stat-label">Overall Growth</span>
          <span className={`stat-value growth ${overallGrowth < 0 ? 'negative' : ''}`}>
            {Utils.formatGrowth(overallGrowth)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default StatsRow;
