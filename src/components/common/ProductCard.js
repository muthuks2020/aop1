import React from 'react';
import { Utils } from '../../utils/helpers';

function ProductCard({ product, onOpenProduct, onSubmitProduct }) {
  const growth = Utils.calcGrowth(product.lyQty, product.cyQty);
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
          <span className="data-label">Growth</span>
          <span className={`data-value growth ${growth >= 0 ? 'positive' : 'negative'}`}>
            {isNew ? 'NEW' : Utils.formatGrowth(growth)}
          </span>
        </div>
        <div className="data-cell">
          <span className="data-label">Variance</span>
          <span className="data-value">
            {isNew 
              ? '+' + Utils.formatNumber(product.cyQty) 
              : (product.cyQty - product.lyQty >= 0 ? '+' : '') + Utils.formatNumber(product.cyQty - product.lyQty)
            }
          </span>
        </div>
        <div className="data-cell">
          <span className="data-label">Target %</span>
          <span className="data-value">
            {isNew ? '-' : ((product.cyQty / product.lyQty) * 100).toFixed(0) + '%'}
          </span>
        </div>
      </div>
      
      <div className="product-actions">
        <button 
          className="product-btn edit"
          onClick={() => onOpenProduct(product.id)}
          disabled={!canEdit && product.status !== 'approved'}
        >
          <i className={`fas fa-${canEdit ? 'edit' : 'eye'}`}></i>
          <span>{canEdit ? 'Edit' : 'View'}</span>
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
            <i className="fas fa-info-circle"></i>
            <span>Details</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default ProductCard;
