import React from 'react';
import { Utils } from '../../utils/helpers';

function ProductPanel({ 
  isOpen, 
  product, 
  categories, 
  onClose, 
  onUpdateQty, 
  onSaveDraft, 
  onSubmit 
}) {
  if (!product) return null;

  const canEdit = product.status !== 'approved';
  const growth = Utils.calcGrowth(product.lyQty, product.cyQty);
  const isNew = product.lyQty === 0;
  const category = categories.find(c => c.id === product.categoryId);

  return (
    <div className={`slide-panel ${isOpen ? 'open' : ''}`}>
      <div className="panel-overlay" onClick={onClose}></div>
      <div className="panel-content">
        <div className="panel-header">
          <div className="panel-title">
            <h2>{product.name}</h2>
            <span className="panel-code">{product.code}</span>
          </div>
          <button className="panel-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="panel-body">
          <div className="panel-section">
            <h4 className="panel-section-title">Product Information</h4>
            <div className="panel-field">
              <label>Category</label>
              <div className="panel-value">{category?.name || '-'}</div>
            </div>
            <div className="panel-field">
              <label>Subcategory</label>
              <div className="panel-value">{product.subcategory || '-'}</div>
            </div>
            <div className="panel-field">
              <label>Product Code</label>
              <div className="panel-value">{product.code}</div>
            </div>
          </div>

          <div className="panel-section">
            <h4 className="panel-section-title">Commitment Details</h4>
            <div className="panel-field">
              <label>Last Year Quantity</label>
              <div className="panel-value">
                {isNew ? 'New Product' : Utils.formatNumber(product.lyQty)}
              </div>
            </div>
            <div className="panel-field">
              <label>Current Year Quantity</label>
              {canEdit ? (
                <input 
                  type="number"
                  className="panel-input"
                  value={product.cyQty}
                  min="0"
                  onChange={(e) => onUpdateQty(product.id, e.target.value)}
                />
              ) : (
                <div className="panel-value">{Utils.formatNumber(product.cyQty)}</div>
              )}
            </div>
            <div className="panel-field">
              <label>Growth</label>
              <div className={`panel-value growth ${growth >= 0 ? 'positive' : 'negative'}`}>
                {isNew ? 'New Product' : Utils.formatGrowth(growth)}
              </div>
            </div>
            <div className="panel-field">
              <label>Variance</label>
              <div className="panel-value">
                {(product.cyQty - product.lyQty >= 0 ? '+' : '') + Utils.formatNumber(product.cyQty - product.lyQty)} units
              </div>
            </div>
          </div>

          <div className="panel-section">
            <h4 className="panel-section-title">Status Information</h4>
            <div className="panel-field">
              <label>Current Status</label>
              <div className={`product-status ${product.status}`}>
                <i className={`fas ${Utils.getStatusIcon(product.status)}`}></i>
                <span>{Utils.getStatusLabel(product.status)}</span>
              </div>
            </div>
            
            {product.approvedDate && (
              <div className="panel-field">
                <label>Approved Date</label>
                <div className="panel-value">{Utils.formatDate(product.approvedDate)}</div>
              </div>
            )}
            
            {product.submittedDate && (
              <div className="panel-field">
                <label>Submitted Date</label>
                <div className="panel-value">{Utils.formatDate(product.submittedDate)}</div>
              </div>
            )}
            
            {product.rejectedDate && (
              <>
                <div className="panel-field">
                  <label>Rejected Date</label>
                  <div className="panel-value">{Utils.formatDate(product.rejectedDate)}</div>
                </div>
                <div className="panel-field">
                  <label>Rejection Reason</label>
                  <div className="panel-value rejection-reason">{product.rejectionReason}</div>
                </div>
              </>
            )}
          </div>

          <div className="panel-actions">
            {canEdit ? (
              <>
                <button 
                  className="btn btn-secondary"
                  onClick={() => onSaveDraft(product.id)}
                >
                  <i className="fas fa-save"></i> Save Draft
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    onSubmit(product.id);
                    onClose();
                  }}
                >
                  <i className="fas fa-paper-plane"></i> Submit
                </button>
              </>
            ) : (
              <button className="btn btn-secondary" onClick={onClose}>
                <i className="fas fa-times"></i> Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductPanel;
