import React from 'react';
import { Utils } from '../../utils/helpers';

function Footer({ 
  lyTotal, 
  cyTotal, 
  growth, 
  pendingCount, 
  onSaveAllDrafts, 
  onSubmitAllPending 
}) {
  return (
    <footer className="footer">
      <div className="footer-summary">
        <div className="footer-stat">
          <span className="footer-label">LY Total</span>
          <span className="footer-value">{Utils.formatNumber(lyTotal)}</span>
        </div>
        <div className="footer-stat">
          <span className="footer-label">CY Total</span>
          <span className="footer-value">{Utils.formatNumber(cyTotal)}</span>
        </div>
        <div className="footer-stat">
          <span className="footer-label">Growth</span>
          <span className={`footer-value growth ${growth < 0 ? 'negative' : ''}`}>
            {Utils.formatGrowth(growth)}
          </span>
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
