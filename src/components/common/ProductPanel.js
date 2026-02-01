import React from 'react';
import { Utils } from '../../utils/helpers';

const MONTHS = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];
const MONTH_LABELS = ['APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR'];

function ProductPanel({ isOpen, product, categories, onClose, onUpdateMonthlyTarget, onSaveDraft, onSubmit }) {
  if (!isOpen || !product) return null;

  const category = categories.find(c => c.id === product.categoryId);
  const isEditable = product.status === 'draft' || product.status === 'rejected';

  const calculateTotals = () => {
    if (!product.monthlyTargets) return { lyQty: 0, cyQty: 0, lyRev: 0, cyRev: 0 };
    return MONTHS.reduce((acc, m) => {
      const data = product.monthlyTargets[m] || {};
      acc.lyQty += data.lyQty || 0;
      acc.cyQty += data.cyQty || 0;
      acc.lyRev += data.lyRev || 0;
      acc.cyRev += data.cyRev || 0;
      return acc;
    }, { lyQty: 0, cyQty: 0, lyRev: 0, cyRev: 0 });
  };

  const totals = calculateTotals();

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="product-panel" onClick={e => e.stopPropagation()}>
        <div className="panel-header">
          <div className="panel-title">
            <div className={`panel-icon ${category?.color}`}><i className={`fas ${category?.icon}`}></i></div>
            <div>
              <h2>{product.name}</h2>
              <span className="panel-code">{product.code} • {product.subcategory || category?.name}</span>
            </div>
          </div>
          <button className="panel-close" onClick={onClose}><i className="fas fa-times"></i></button>
        </div>

        <div className="panel-status">
          <span className={`status-tag ${product.status}`}>
            {product.status === 'draft' && <><i className="fas fa-edit"></i> Draft - Editable</>}
            {product.status === 'submitted' && <><i className="fas fa-clock"></i> Pending Approval</>}
            {product.status === 'approved' && <><i className="fas fa-check-circle"></i> Approved</>}
            {product.status === 'rejected' && <><i className="fas fa-times-circle"></i> Rejected - Please Revise</>}
          </span>
        </div>

        <div className="panel-body">
          <div className="panel-summary">
            <div className="summary-item"><span className="label">LY Qty Total</span><span className="value">{Utils.formatNumber(totals.lyQty)}</span></div>
            <div className="summary-item highlight"><span className="label">CY Qty Target</span><span className="value">{Utils.formatNumber(totals.cyQty)}</span></div>
            <div className="summary-item"><span className="label">Growth</span><span className={`value growth ${Utils.calcGrowth(totals.lyQty, totals.cyQty) >= 0 ? 'positive' : 'negative'}`}>{Utils.formatGrowth(Utils.calcGrowth(totals.lyQty, totals.cyQty))}</span></div>
          </div>

          <div className="monthly-targets">
            <h3><i className="fas fa-calendar"></i> Monthly Targets</h3>
            <div className="monthly-grid">
              <div className="grid-header"><span>Month</span><span>LY Qty</span><span>CY Target</span><span>Growth</span></div>
              {MONTHS.map((month, idx) => {
                const data = product.monthlyTargets?.[month] || {};
                const monthGrowth = Utils.calcGrowth(data.lyQty, data.cyQty);
                return (
                  <div key={month} className="grid-row">
                    <span className="month-label">{MONTH_LABELS[idx]}</span>
                    <span className="ly-value">{data.lyQty || '-'}</span>
                    {isEditable ? (
                      <input type="number" className="cy-input" value={data.cyQty || ''} onChange={e => onUpdateMonthlyTarget(product.id, month, { cyQty: parseInt(e.target.value) || 0 })} />
                    ) : (
                      <span className="cy-value">{data.cyQty || '-'}</span>
                    )}
                    <span className={`growth-value ${monthGrowth >= 0 ? 'positive' : 'negative'}`}>{Utils.formatGrowth(monthGrowth)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="panel-footer">
          {isEditable && (
            <>
              <button className="btn btn-secondary" onClick={() => onSaveDraft(product.id)}><i className="fas fa-save"></i> Save Draft</button>
              <button className="btn btn-primary" onClick={() => onSubmit(product.id)}><i className="fas fa-paper-plane"></i> Submit for Approval</button>
            </>
          )}
          {product.status === 'submitted' && <button className="btn btn-success" onClick={() => onSubmit(product.id)}><i className="fas fa-check"></i> Approve</button>}
        </div>
      </div>
    </div>
  );
}

export default ProductPanel;
