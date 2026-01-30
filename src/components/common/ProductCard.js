import React from 'react';
import { Utils } from '../../utils/helpers';

function ProductCard({ product, onOpenProduct, onSubmitProduct }) {
  const qtyGrowth = Utils.calcGrowth(product.lyQty, product.cyQty);
  const revGrowth = Utils.calcGrowth(product.lyRev, product.cyRev);
  const canSubmit = product.status === 'draft' || product.status === 'rejected';
  const canEdit = product.status !== 'approved';
  const isNew = product.lyQty === 0;

  return (
    <div className={`product-card ${product.status}`}>
      <div className="product-header">
        <div className="product-info">
          <div className="product-name">
            {product.name}
            {isNew && <span className="new-badge">NEW</span>}
          </div>
          <div className="product-code">{product.code}</div>
        </div>
        <div className={`product-status ${product.status}`}>
          <i className={`fas ${Utils.getStatusIcon(product.status)}`}></i>
          <span>{Utils.getStatusLabel(product.status)}</span>
        </div>
      </div>
      
      <div className="product-data">
        <div className="data-row">
          <div className="data-cell">
            <span className="data-label">LY Qty</span>
            <span className="data-value">
              {isNew ? '-' : Utils.formatNumber(product.lyQty)}
            </span>
          </div>
          <div className="data-cell highlight">
            <span className="data-label">CY Qty</span>
            <span className="data-value editable">
              {Utils.formatNumber(product.cyQty)}
            </span>
          </div>
          <div className="data-cell">
            <span className="data-label">Qty Growth</span>
            <span className={`data-value growth ${qtyGrowth >= 0 ? 'positive' : 'negative'}`}>
              {isNew ? 'NEW' : Utils.formatGrowth(qtyGrowth)}
            </span>
          </div>
        </div>
        <div className="data-row">
          <div className="data-cell">
            <span className="data-label">LY Rev</span>
            <span className="data-value">
              {isNew ? '-' : Utils.formatShortCurrency(product.lyRev)}
            </span>
          </div>
          <div className="data-cell highlight">
            <span className="data-label">CY Rev</span>
            <span className="data-value editable">
              {Utils.formatShortCurrency(product.cyRev)}
            </span>
          </div>
          <div className="data-cell">
            <span className="data-label">Rev Growth</span>
            <span className={`data-value growth ${revGrowth >= 0 ? 'positive' : 'negative'}`}>
              {isNew ? 'NEW' : Utils.formatGrowth(revGrowth)}
            </span>
          </div>
        </div>
      </div>
      
      <div className="product-actions">
        <button 
          className="product-btn edit"
          onClick={() => onOpenProduct(product.id)}
        >
          <i className={`fas fa-${canEdit ? 'edit' : 'eye'}`}></i>
          <span>{canEdit ? 'Edit Targets' : 'View'}</span>
        </button>
        
        {canSubmit ? (
          <button 
            className="product-btn submit"
            onClick={() => onSubmitProduct(product.id)}
          >
            <i className="fas fa-paper-plane"></i>
            <span>Submit</span>
          </button>
        ) : (
          <button 
            className="product-btn view"
            onClick={() => onOpenProduct(product.id)}
          >
            <i className="fas fa-chart-line"></i>
            <span>Details</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default ProductCard;
