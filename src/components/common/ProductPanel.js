import React, { useState, useEffect } from 'react';
import { Utils } from '../../utils/helpers';

function ProductPanel({ 
  isOpen, 
  product, 
  categories, 
  onClose, 
  onUpdateMonthlyTarget,
  onSaveDraft, 
  onSubmit 
}) {
  const [activeTab, setActiveTab] = useState('monthly');
  const [editingMonth, setEditingMonth] = useState(null);
  const [tempValues, setTempValues] = useState({ cyQty: 0, cyRev: 0 });

  useEffect(() => {
    if (product) {
      setActiveTab('monthly');
      setEditingMonth(null);
    }
  }, [product]);

  if (!product) return null;

  const canEdit = product.status === 'draft' || product.status === 'rejected';
  const isNew = product.lyQty === 0;
  const category = categories.find(c => c.id === product.categoryId);
  
  const months = Utils.getFiscalMonths();
  const quarters = Utils.getQuarters();
  const quarterlyData = Utils.calculateQuarterlyTotals(product.monthlyTargets || {});
  const yearlyData = Utils.calculateYearlyTotals(product.monthlyTargets || {});

  const handleStartEdit = (month) => {
    if (!canEdit) return;
    setEditingMonth(month);
    const monthData = product.monthlyTargets?.[month] || {};
    setTempValues({
      cyQty: monthData.cyQty || 0,
      cyRev: monthData.cyRev || 0
    });
  };

  const handleSaveMonth = () => {
    if (editingMonth && onUpdateMonthlyTarget) {
      onUpdateMonthlyTarget(product.id, editingMonth, tempValues);
    }
    setEditingMonth(null);
  };

  const handleCancelEdit = () => {
    setEditingMonth(null);
    setTempValues({ cyQty: 0, cyRev: 0 });
  };

  const renderMonthlyTab = () => (
    <div className="monthly-targets-section">
      <div className="section-header">
        <h4><i className="fas fa-calendar-alt"></i> Monthly Target Entry</h4>
        {canEdit && (
          <span className="edit-hint">
            <i className="fas fa-info-circle"></i> Click on any month to edit targets
          </span>
        )}
      </div>
      
      <div className="monthly-grid">
        {months.map(month => {
          const monthData = product.monthlyTargets?.[month] || {};
          const isEditing = editingMonth === month;
          const qtyGrowth = Utils.calcGrowth(monthData.lyQty || 0, monthData.cyQty || 0);
          const revGrowth = Utils.calcGrowth(monthData.lyRev || 0, monthData.cyRev || 0);
          
          return (
            <div 
              key={month} 
              className={`month-card ${isEditing ? 'editing' : ''} ${canEdit ? 'editable' : ''}`}
              onClick={() => !isEditing && handleStartEdit(month)}
            >
              <div className="month-header">
                <span className="month-name">{month}</span>
                {canEdit && !isEditing && (
                  <i className="fas fa-pencil-alt edit-icon"></i>
                )}
              </div>
              
              {isEditing ? (
                <div className="month-edit-form" onClick={e => e.stopPropagation()}>
                  <div className="edit-field">
                    <label>CY Qty</label>
                    <input
                      type="number"
                      value={tempValues.cyQty}
                      onChange={e => setTempValues(prev => ({ ...prev, cyQty: parseInt(e.target.value) || 0 }))}
                      autoFocus
                    />
                  </div>
                  <div className="edit-field">
                    <label>CY Rev (₹)</label>
                    <input
                      type="number"
                      value={tempValues.cyRev}
                      onChange={e => setTempValues(prev => ({ ...prev, cyRev: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="edit-actions">
                    <button className="btn-save" onClick={handleSaveMonth}>
                      <i className="fas fa-check"></i>
                    </button>
                    <button className="btn-cancel" onClick={handleCancelEdit}>
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="month-data">
                  <div className="data-row">
                    <div className="data-item">
                      <span className="data-label">LY Qty</span>
                      <span className="data-value">{Utils.formatNumber(monthData.lyQty || 0)}</span>
                    </div>
                    <div className="data-item highlight">
                      <span className="data-label">CY Qty</span>
                      <span className="data-value">{Utils.formatNumber(monthData.cyQty || 0)}</span>
                    </div>
                    <div className="data-item">
                      <span className="data-label">Growth</span>
                      <span className={`data-value growth ${qtyGrowth >= 0 ? 'positive' : 'negative'}`}>
                        {Utils.formatGrowth(qtyGrowth)}
                      </span>
                    </div>
                  </div>
                  <div className="data-row">
                    <div className="data-item">
                      <span className="data-label">LY Rev</span>
                      <span className="data-value">{Utils.formatShortCurrency(monthData.lyRev || 0)}</span>
                    </div>
                    <div className="data-item highlight">
                      <span className="data-label">CY Rev</span>
                      <span className="data-value">{Utils.formatShortCurrency(monthData.cyRev || 0)}</span>
                    </div>
                    <div className="data-item">
                      <span className="data-label">Growth</span>
                      <span className={`data-value growth ${revGrowth >= 0 ? 'positive' : 'negative'}`}>
                        {Utils.formatGrowth(revGrowth)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderQuarterlyTab = () => (
    <div className="quarterly-section">
      <div className="section-header">
        <h4><i className="fas fa-chart-bar"></i> Quarterly Summary</h4>
        <span className="calculated-badge">
          <i className="fas fa-calculator"></i> Auto-calculated from monthly targets
        </span>
      </div>
      
      <div className="quarterly-grid">
        {quarters.map(quarter => {
          const data = quarterlyData[quarter.id] || {};
          
          return (
            <div key={quarter.id} className="quarter-card">
              <div className="quarter-header">
                <span className="quarter-name">{quarter.name}</span>
                <span className="quarter-months">{quarter.months.join(', ')}</span>
              </div>
              
              <div className="quarter-data">
                <div className="quarter-row">
                  <div className="quarter-metric">
                    <span className="metric-label">Quantity</span>
                    <div className="metric-values">
                      <div className="metric-item">
                        <span className="item-label">LY</span>
                        <span className="item-value">{Utils.formatNumber(data.lyQty || 0)}</span>
                      </div>
                      <div className="metric-item highlight">
                        <span className="item-label">CY</span>
                        <span className="item-value">{Utils.formatNumber(data.cyQty || 0)}</span>
                      </div>
                      <div className="metric-item">
                        <span className="item-label">Growth</span>
                        <span className={`item-value growth ${(data.qtyGrowth || 0) >= 0 ? 'positive' : 'negative'}`}>
                          {Utils.formatGrowth(data.qtyGrowth || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="quarter-row">
                  <div className="quarter-metric">
                    <span className="metric-label">Revenue</span>
                    <div className="metric-values">
                      <div className="metric-item">
                        <span className="item-label">LY</span>
                        <span className="item-value">{Utils.formatCurrency(data.lyRev || 0)}</span>
                      </div>
                      <div className="metric-item highlight">
                        <span className="item-label">CY</span>
                        <span className="item-value">{Utils.formatCurrency(data.cyRev || 0)}</span>
                      </div>
                      <div className="metric-item">
                        <span className="item-label">Growth</span>
                        <span className={`item-value growth ${(data.revGrowth || 0) >= 0 ? 'positive' : 'negative'}`}>
                          {Utils.formatGrowth(data.revGrowth || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderYearlyTab = () => (
    <div className="yearly-section">
      <div className="section-header">
        <h4><i className="fas fa-chart-line"></i> Yearly Summary (FY 2025-26)</h4>
        <span className="calculated-badge">
          <i className="fas fa-calculator"></i> Auto-calculated from monthly targets
        </span>
      </div>
      
      <div className="yearly-summary">
        <div className="yearly-card quantity">
          <div className="yearly-card-header">
            <i className="fas fa-boxes"></i>
            <span>Total Quantity</span>
          </div>
          <div className="yearly-card-body">
            <div className="yearly-metric">
              <span className="yearly-label">Last Year</span>
              <span className="yearly-value">{Utils.formatNumber(yearlyData.lyQty || 0)}</span>
            </div>
            <div className="yearly-metric highlight">
              <span className="yearly-label">Current Year Target</span>
              <span className="yearly-value large">{Utils.formatNumber(yearlyData.cyQty || 0)}</span>
            </div>
            <div className="yearly-growth">
              <span className="growth-label">YoY Growth</span>
              <span className={`growth-value ${(yearlyData.qtyGrowth || 0) >= 0 ? 'positive' : 'negative'}`}>
                <i className={`fas fa-arrow-${(yearlyData.qtyGrowth || 0) >= 0 ? 'up' : 'down'}`}></i>
                {Utils.formatGrowth(yearlyData.qtyGrowth || 0)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="yearly-card revenue">
          <div className="yearly-card-header">
            <i className="fas fa-rupee-sign"></i>
            <span>Total Revenue</span>
          </div>
          <div className="yearly-card-body">
            <div className="yearly-metric">
              <span className="yearly-label">Last Year</span>
              <span className="yearly-value">{Utils.formatCurrency(yearlyData.lyRev || 0)}</span>
            </div>
            <div className="yearly-metric highlight">
              <span className="yearly-label">Current Year Target</span>
              <span className="yearly-value large">{Utils.formatCurrency(yearlyData.cyRev || 0)}</span>
            </div>
            <div className="yearly-growth">
              <span className="growth-label">YoY Growth</span>
              <span className={`growth-value ${(yearlyData.revGrowth || 0) >= 0 ? 'positive' : 'negative'}`}>
                <i className={`fas fa-arrow-${(yearlyData.revGrowth || 0) >= 0 ? 'up' : 'down'}`}></i>
                {Utils.formatGrowth(yearlyData.revGrowth || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="yearly-breakdown">
        <h5>Quarter-wise Breakdown</h5>
        <table className="breakdown-table">
          <thead>
            <tr>
              <th>Quarter</th>
              <th>LY Qty</th>
              <th>CY Qty</th>
              <th>Qty Growth</th>
              <th>LY Rev</th>
              <th>CY Rev</th>
              <th>Rev Growth</th>
            </tr>
          </thead>
          <tbody>
            {quarters.map(quarter => {
              const data = quarterlyData[quarter.id] || {};
              return (
                <tr key={quarter.id}>
                  <td className="quarter-cell">{quarter.id}</td>
                  <td>{Utils.formatNumber(data.lyQty || 0)}</td>
                  <td className="highlight">{Utils.formatNumber(data.cyQty || 0)}</td>
                  <td className={`growth ${(data.qtyGrowth || 0) >= 0 ? 'positive' : 'negative'}`}>
                    {Utils.formatGrowth(data.qtyGrowth || 0)}
                  </td>
                  <td>{Utils.formatShortCurrency(data.lyRev || 0)}</td>
                  <td className="highlight">{Utils.formatShortCurrency(data.cyRev || 0)}</td>
                  <td className={`growth ${(data.revGrowth || 0) >= 0 ? 'positive' : 'negative'}`}>
                    {Utils.formatGrowth(data.revGrowth || 0)}
                  </td>
                </tr>
              );
            })}
            <tr className="total-row">
              <td className="quarter-cell"><strong>Total</strong></td>
              <td><strong>{Utils.formatNumber(yearlyData.lyQty || 0)}</strong></td>
              <td className="highlight"><strong>{Utils.formatNumber(yearlyData.cyQty || 0)}</strong></td>
              <td className={`growth ${(yearlyData.qtyGrowth || 0) >= 0 ? 'positive' : 'negative'}`}>
                <strong>{Utils.formatGrowth(yearlyData.qtyGrowth || 0)}</strong>
              </td>
              <td><strong>{Utils.formatShortCurrency(yearlyData.lyRev || 0)}</strong></td>
              <td className="highlight"><strong>{Utils.formatShortCurrency(yearlyData.cyRev || 0)}</strong></td>
              <td className={`growth ${(yearlyData.revGrowth || 0) >= 0 ? 'positive' : 'negative'}`}>
                <strong>{Utils.formatGrowth(yearlyData.revGrowth || 0)}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className={`slide-panel ${isOpen ? 'open' : ''}`}>
      <div className="panel-overlay" onClick={onClose}></div>
      <div className="panel-content large">
        <div className="panel-header">
          <div className="panel-title">
            <h2>
              {product.name}
              {isNew && <span className="new-badge">NEW</span>}
            </h2>
            <span className="panel-code">{product.code}</span>
          </div>
          <button className="panel-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="panel-info-bar">
          <div className="info-item">
            <i className="fas fa-folder"></i>
            <span>{category?.name || '-'}</span>
          </div>
          <div className="info-item">
            <i className="fas fa-tag"></i>
            <span>{product.subcategory || '-'}</span>
          </div>
          <div className="info-item">
            <i className="fas fa-rupee-sign"></i>
            <span>Unit Price: {Utils.formatCurrency(product.unitPrice || 0)}</span>
          </div>
          <div className={`status-badge ${product.status}`}>
            <i className={`fas ${Utils.getStatusIcon(product.status)}`}></i>
            <span>{Utils.getStatusLabel(product.status)}</span>
          </div>
        </div>
        
        <div className="panel-tabs">
          <button 
            className={`tab-btn ${activeTab === 'monthly' ? 'active' : ''}`}
            onClick={() => setActiveTab('monthly')}
          >
            <i className="fas fa-calendar-alt"></i>
            Monthly Targets
          </button>
          <button 
            className={`tab-btn ${activeTab === 'quarterly' ? 'active' : ''}`}
            onClick={() => setActiveTab('quarterly')}
          >
            <i className="fas fa-chart-bar"></i>
            Quarterly
          </button>
          <button 
            className={`tab-btn ${activeTab === 'yearly' ? 'active' : ''}`}
            onClick={() => setActiveTab('yearly')}
          >
            <i className="fas fa-chart-line"></i>
            Yearly
          </button>
        </div>
        
        <div className="panel-body">
          {activeTab === 'monthly' && renderMonthlyTab()}
          {activeTab === 'quarterly' && renderQuarterlyTab()}
          {activeTab === 'yearly' && renderYearlyTab()}
        </div>

        <div className="panel-footer">
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
                }}
              >
                <i className="fas fa-paper-plane"></i> Submit for Approval
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
  );
}

export default ProductPanel;
