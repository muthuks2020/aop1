import React from 'react';
import { Utils } from '../../utils/helpers';

function ProductCard({ product, onOpen, onSubmit }) {
  const calculateTotals = () => {
    if (!product.monthlyTargets) return { lyQty: 0, cyQty: 0 };
    return Object.values(product.monthlyTargets).reduce((acc, m) => {
      acc.lyQty += m.lyQty || 0;
      acc.cyQty += m.cyQty || 0;
      return acc;
    }, { lyQty: 0, cyQty: 0 });
  };

  const totals = calculateTotals();
  const growth = Utils.calcGrowth(totals.lyQty, totals.cyQty);

  const statusConfig = {
    draft: { icon: 'fa-edit', label: 'Draft', class: 'draft' },
    submitted: { icon: 'fa-clock', label: 'Pending', class: 'submitted' },
    approved: { icon: 'fa-check-circle', label: 'Approved', class: 'approved' },
    rejected: { icon: 'fa-times-circle', label: 'Rejected', class: 'rejected' }
  };

  const status = statusConfig[product.status] || statusConfig.draft;

  return (
    <div className={`product-card ${status.class}`} onClick={() => onOpen(product.id)}>
      <div className="card-header">
        <div className="product-info">
          <span className="product-name">{product.name}</span>
          <span className="product-code">{product.code}</span>
        </div>
        <span className={`status-badge ${status.class}`}>
          <i className={`fas ${status.icon}`}></i>
          {status.label}
        </span>
      </div>
      
      <div className="card-body">
        <div className="qty-row">
          <div className="qty-item">
            <span className="qty-label">LY Qty</span>
            <span className="qty-value">{Utils.formatNumber(totals.lyQty)}</span>
          </div>
          <div className="qty-item highlight">
            <span className="qty-label">CY Target</span>
            <span className="qty-value">{Utils.formatNumber(totals.cyQty)}</span>
          </div>
          <div className={`growth-badge ${growth >= 0 ? 'positive' : 'negative'}`}>
            {Utils.formatGrowth(growth)}
          </div>
        </div>
      </div>
      
      <div className="card-footer">
        {product.status === 'draft' && (
          <button className="card-action" onClick={(e) => { e.stopPropagation(); onSubmit(product.id); }}>
            <i className="fas fa-paper-plane"></i> Submit
          </button>
        )}
        {product.status === 'submitted' && (
          <span className="pending-text"><i className="fas fa-hourglass-half"></i> Awaiting Approval</span>
        )}
        {product.status === 'approved' && (
          <span className="approved-text"><i className="fas fa-check"></i> Target Locked</span>
        )}
        {product.status === 'rejected' && (
          <button className="card-action danger" onClick={(e) => { e.stopPropagation(); onOpen(product.id); }}>
            <i className="fas fa-redo"></i> Revise
          </button>
        )}
      </div>
    </div>
  );
}

export default ProductCard;
