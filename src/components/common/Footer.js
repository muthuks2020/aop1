import React from 'react';
import { Utils } from '../../utils/helpers';

function Footer({ 
  lyQty, 
  cyQty, 
  qtyGrowth,
  lyRev,
  cyRev,
  revGrowth,
  pendingCount, 
  onSaveAllDrafts, 
  onSubmitAllPending 
}) {
  return (
    <footer className="footer">
      <div className="footer-summary">
        <div className="footer-stat-group">
          <span className="footer-group-label">Quantity</span>
          <div className="footer-stat">
            <span className="footer-label">LY</span>
            <span className="footer-value">{Utils.formatNumber(lyQty)}</span>
          </div>
          <div className="footer-stat">
            <span className="footer-label">CY</span>
            <span className="footer-value highlight">{Utils.formatNumber(cyQty)}</span>
          </div>
          <div className="footer-stat">
            <span className="footer-label">Growth</span>
            <span className={`footer-value growth ${qtyGrowth < 0 ? 'negative' : ''}`}>
              {Utils.formatGrowth(qtyGrowth)}
            </span>
          </div>
        </div>
        
        <div className="footer-divider"></div>
        
        <div className="footer-stat-group">
          <span className="footer-group-label">Revenue</span>
          <div className="footer-stat">
            <span className="footer-label">LY</span>
            <span className="footer-value">{Utils.formatShortCurrency(lyRev)}</span>
          </div>
          <div className="footer-stat">
            <span className="footer-label">CY</span>
            <span className="footer-value highlight">{Utils.formatShortCurrency(cyRev)}</span>
          </div>
          <div className="footer-stat">
            <span className="footer-label">Growth</span>
            <span className={`footer-value growth ${revGrowth < 0 ? 'negative' : ''}`}>
              {Utils.formatGrowth(revGrowth)}
            </span>
          </div>
        </div>
      </div>
      
      <div className="footer-actions">
        <button className="btn btn-secondary" onClick={onSaveAllDrafts}>
          <i className="fas fa-save"></i>
          <span>Save All Drafts</span>
        </button>
        <button className="btn btn-primary" onClick={onSubmitAllPending}>
          <i className="fas fa-paper-plane"></i>
          <span>Submit All Pending</span>
          {pendingCount > 0 && (
            <span className="btn-badge">{pendingCount}</span>
          )}
        </button>
      </div>
    </footer>
  );
}

export default Footer;
