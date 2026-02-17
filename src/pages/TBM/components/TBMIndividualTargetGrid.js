/**
 * TBMIndividualTargetGrid Component
 * Excel-like grid for TBM's OWN Personal Target Entry
 * 
 * This is separate from the Territory Target grid.
 * TBM enters their personal sales commitment here.
 * These targets are submitted to ABM for approval so ABM can track TBM individually.
 *
 * @author Appasamy Associates - Product Commitment PWA
 * @version 1.0.0
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Utils } from '../../../utils/helpers';
import '../../../styles/tbm/tbmIndividualTarget.css';

// Constants
const MONTHS = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];
const MONTH_LABELS = ['APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR'];

const QUARTERS = [
  { id: 'Q1', label: 'Q1', fullLabel: 'Q1 (Apr-Jun)', months: ['apr', 'may', 'jun'], color: 'q1' },
  { id: 'Q2', label: 'Q2', fullLabel: 'Q2 (Jul-Sep)', months: ['jul', 'aug', 'sep'], color: 'q2' },
  { id: 'Q3', label: 'Q3', fullLabel: 'Q3 (Oct-Dec)', months: ['oct', 'nov', 'dec'], color: 'q3' },
  { id: 'Q4', label: 'Q4', fullLabel: 'Q4 (Jan-Mar)', months: ['jan', 'feb', 'mar'], color: 'q4' }
];

const REVENUE_ONLY_CATEGORIES = ['mis', 'others'];

const STATUS_CONFIG = {
  draft: { icon: 'fa-edit', label: 'Draft', class: 'status-draft' },
  submitted: { icon: 'fa-clock', label: 'Pending ABM', class: 'status-submitted' },
  approved: { icon: 'fa-check-circle', label: 'Approved', class: 'status-approved' },
  rejected: { icon: 'fa-times-circle', label: 'Needs Revision', class: 'status-rejected' }
};

function TBMIndividualTargetGrid({
  categories = [],
  products = [],
  onUpdateTarget,
  onSaveAll,
  onSubmitAll,
  fiscalYear = '2026-27',
  targetStats = {}
}) {
  // State management
  const [activeCell, setActiveCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(new Set(['equipment', 'iol', 'ovd']));
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [viewMode, setViewMode] = useState('qty'); // 'qty' or 'rev'

  // Refs
  const inputRef = useRef(null);
  const gridRef = useRef(null);

  // Focus input when active cell changes
  useEffect(() => {
    if (activeCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [activeCell]);

  // ==================== COMPUTED DATA ====================

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    const term = searchTerm.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.code.toLowerCase().includes(term) ||
      (p.subcategory && p.subcategory.toLowerCase().includes(term))
    );
  }, [products, searchTerm]);

  // ==================== CALCULATION HELPERS ====================

  const calculateCategoryTotal = useCallback((categoryId, month, year, field) => {
    return products
      .filter(p => p.categoryId === categoryId)
      .reduce((sum, p) => {
        const monthData = p.monthlyTargets?.[month] || {};
        if (field === 'qty') {
          return sum + (year === 'CY' ? (monthData.cyQty || 0) : (monthData.lyQty || 0));
        }
        return sum + (year === 'CY' ? (monthData.cyRev || 0) : (monthData.lyRev || 0));
      }, 0);
  }, [products]);

  const calculateQuarterTotal = useCallback((productId, quarterId, year, field) => {
    const product = products.find(p => p.id === productId);
    if (!product) return 0;
    const quarter = QUARTERS.find(q => q.id === quarterId);
    if (!quarter) return 0;
    return quarter.months.reduce((sum, month) => {
      const monthData = product.monthlyTargets?.[month] || {};
      if (field === 'qty') {
        return sum + (year === 'CY' ? (monthData.cyQty || 0) : (monthData.lyQty || 0));
      }
      return sum + (year === 'CY' ? (monthData.cyRev || 0) : (monthData.lyRev || 0));
    }, 0);
  }, [products]);

  const calculateYearlyTotal = useCallback((productId, year, field) => {
    const product = products.find(p => p.id === productId);
    if (!product) return 0;
    return MONTHS.reduce((sum, month) => {
      const monthData = product.monthlyTargets?.[month] || {};
      if (field === 'qty') {
        return sum + (year === 'CY' ? (monthData.cyQty || 0) : (monthData.lyQty || 0));
      }
      return sum + (year === 'CY' ? (monthData.cyRev || 0) : (monthData.lyRev || 0));
    }, 0);
  }, [products]);

  const calculateGrowth = useCallback((productId, field) => {
    const ly = calculateYearlyTotal(productId, 'LY', field);
    const cy = calculateYearlyTotal(productId, 'CY', field);
    return Utils.calcGrowth(ly, cy);
  }, [calculateYearlyTotal]);

  // ==================== STATUS HELPERS ====================

  const getStatusClass = (status) => STATUS_CONFIG[status]?.class || 'status-draft';
  const isEditable = (status) => status === 'draft' || status === 'rejected';

  const getStatusTooltip = (status) => {
    switch (status) {
      case 'submitted': return 'Pending ABM approval — values are locked';
      case 'approved': return 'Approved by ABM — values are frozen';
      case 'rejected': return 'Rejected by ABM — click to edit and resubmit';
      default: return 'Click to edit your personal target value';
    }
  };

  // ==================== EVENT HANDLERS ====================

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(categoryId) ? next.delete(categoryId) : next.add(categoryId);
      return next;
    });
  };

  const handleCellClick = (productId, month, field, currentValue, status) => {
    if (!isEditable(status)) return;
    setActiveCell({ productId, month, field });
    setEditValue(currentValue?.toString() || '');
  };

  const handleCellChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setEditValue(value);
  };

  const handleCellBlur = () => {
    if (activeCell) {
      const numericValue = parseInt(editValue) || 0;
      const valueKey = activeCell.field === 'qty' ? 'cyQty' : 'cyRev';
      onUpdateTarget(activeCell.productId, activeCell.month, { [valueKey]: numericValue });
    }
    setActiveCell(null);
    setEditValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCellBlur();
    } else if (e.key === 'Escape') {
      setActiveCell(null);
      setEditValue('');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleCellBlur();
    }
  };

  const handleSaveAll = async () => {
    setIsLoading(true);
    try {
      await onSaveAll();
      setLastSaved(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAll = async () => {
    setIsLoading(true);
    try {
      await onSubmitAll();
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpandAll = () => {
    if (expandedCategories.size === categories.length) {
      setExpandedCategories(new Set());
    } else {
      setExpandedCategories(new Set(categories.map(c => c.id)));
    }
  };

  // ==================== RENDER HELPERS ====================

  const getQuarterColor = (monthIndex) => {
    if (monthIndex < 3) return 'q1';
    if (monthIndex < 6) return 'q2';
    if (monthIndex < 9) return 'q3';
    return 'q4';
  };

  const highlightMatch = (text, term) => {
    if (!term.trim()) return text;
    const idx = text.toLowerCase().indexOf(term.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.substring(0, idx)}
        <mark className="ind-search-highlight">{text.substring(idx, idx + term.length)}</mark>
        {text.substring(idx + term.length)}
      </>
    );
  };

  const renderProductRow = (product) => {
    const isRevenueOnly = REVENUE_ONLY_CATEGORIES.includes(product.categoryId);
    const statusConfig = STATUS_CONFIG[product.status] || STATUS_CONFIG.draft;
    const canEdit = isEditable(product.status);
    const currentField = viewMode;

    return (
      <div key={product.id} className={`ind-product-rows ${getStatusClass(product.status)}`}>
        {/* CY Row */}
        <div className="ind-product-row cy-row">
          <div className="ind-product-name-cell">
            <div className="ind-product-info">
              <span className="ind-product-name" title={product.name}>
                {highlightMatch(product.name, searchTerm)}
              </span>
              <span className="ind-product-code">{product.code}</span>
            </div>
            <div className={`ind-status-indicator ${product.status}`} title={getStatusTooltip(product.status)}>
              <i className={`fas ${statusConfig.icon}`}></i>
            </div>
          </div>

          {/* Monthly CY Values */}
          {MONTHS.map((month, idx) => {
            const monthData = product.monthlyTargets?.[month] || {};
            const value = currentField === 'qty' ? monthData.cyQty : monthData.cyRev;
            const isActive = activeCell?.productId === product.id &&
                            activeCell?.month === month &&
                            activeCell?.field === currentField;

            return (
              <div
                key={month}
                className={`ind-month-cell cy-value ${getQuarterColor(idx)} ${canEdit ? 'editable' : 'locked'} ${isActive ? 'active' : ''}`}
                onClick={() => handleCellClick(product.id, month, currentField, value, product.status)}
                title={getStatusTooltip(product.status)}
              >
                {isActive ? (
                  <input
                    ref={inputRef}
                    type="text"
                    className="ind-cell-input"
                    value={editValue}
                    onChange={handleCellChange}
                    onBlur={handleCellBlur}
                    onKeyDown={handleKeyDown}
                  />
                ) : (
                  <span className="ind-cell-value">
                    {currentField === 'qty'
                      ? Utils.formatNumber(value || 0)
                      : `₹${Utils.formatCompact(value || 0)}`
                    }
                  </span>
                )}
              </div>
            );
          })}

          {/* Quarterly Totals */}
          {QUARTERS.map(quarter => {
            const qTotal = calculateQuarterTotal(product.id, quarter.id, 'CY', currentField);
            return (
              <div key={quarter.id} className={`ind-quarter-cell ${quarter.color}`}>
                {currentField === 'qty'
                  ? Utils.formatNumber(qTotal)
                  : `₹${Utils.formatCompact(qTotal)}`
                }
              </div>
            );
          })}

          {/* Yearly Total */}
          <div className="ind-total-cell cy-total">
            {currentField === 'qty'
              ? Utils.formatNumber(calculateYearlyTotal(product.id, 'CY', currentField))
              : `₹${Utils.formatCompact(calculateYearlyTotal(product.id, 'CY', currentField))}`
            }
          </div>

          {/* Growth */}
          <div className="ind-growth-cell">
            {(() => {
              const growth = calculateGrowth(product.id, currentField);
              return (
                <span className={`ind-growth-badge ${growth >= 0 ? 'positive' : 'negative'}`}>
                  <i className={`fas fa-arrow-${growth >= 0 ? 'up' : 'down'}`}></i>
                  {Utils.formatGrowth(growth)}
                </span>
              );
            })()}
          </div>
        </div>

        {/* LY Row */}
        <div className="ind-product-row ly-row">
          <div className="ind-product-name-cell ly-label">
            <span>LY ({currentField === 'qty' ? 'Qty' : 'Rev'})</span>
          </div>
          {MONTHS.map((month, idx) => {
            const monthData = product.monthlyTargets?.[month] || {};
            const value = currentField === 'qty' ? monthData.lyQty : monthData.lyRev;
            return (
              <div key={month} className={`ind-month-cell ly-value ${getQuarterColor(idx)}`}>
                <span className="ind-cell-value">
                  {currentField === 'qty'
                    ? Utils.formatNumber(value || 0)
                    : `₹${Utils.formatCompact(value || 0)}`
                  }
                </span>
              </div>
            );
          })}

          {QUARTERS.map(quarter => {
            const qTotal = calculateQuarterTotal(product.id, quarter.id, 'LY', currentField);
            return (
              <div key={quarter.id} className={`ind-quarter-cell ${quarter.color} ly`}>
                {currentField === 'qty'
                  ? Utils.formatNumber(qTotal)
                  : `₹${Utils.formatCompact(qTotal)}`
                }
              </div>
            );
          })}

          <div className="ind-total-cell ly-total">
            {currentField === 'qty'
              ? Utils.formatNumber(calculateYearlyTotal(product.id, 'LY', currentField))
              : `₹${Utils.formatCompact(calculateYearlyTotal(product.id, 'LY', currentField))}`
            }
          </div>
          <div className="ind-growth-cell"></div>
        </div>

        {/* AOP Row — Read Only (Annual Operating Plan) */}
        <div className="ind-product-row aop-row">
          <div className="ind-product-name-cell aop-label">
            <span>AOP ({currentField === 'qty' ? 'Qty' : 'Rev'})</span>
          </div>
          {MONTHS.map((month, idx) => {
            const monthData = product.monthlyTargets?.[month] || {};
            const value = currentField === 'qty' ? (monthData.aopQty || 0) : (monthData.aopRev || 0);
            return (
              <div key={month} className={`ind-month-cell aop-value ${getQuarterColor(idx)}`}>
                <span className="ind-cell-value">
                  {currentField === 'qty'
                    ? Utils.formatNumber(value)
                    : `₹${Utils.formatCompact(value)}`
                  }
                </span>
              </div>
            );
          })}
          {QUARTERS.map(quarter => {
            const qTotal = quarter.months.reduce((sum, m) => {
              const mt = product.monthlyTargets?.[m] || {};
              return sum + (currentField === 'qty' ? (mt.aopQty || 0) : (mt.aopRev || 0));
            }, 0);
            return (
              <div key={quarter.id} className={`ind-quarter-cell ${quarter.color} aop`}>
                {currentField === 'qty' ? Utils.formatNumber(qTotal) : `₹${Utils.formatCompact(qTotal)}`}
              </div>
            );
          })}
          <div className="ind-total-cell aop-total">
            {(() => {
              const total = MONTHS.reduce((s, m) => {
                const mt = product.monthlyTargets?.[m] || {};
                return s + (currentField === 'qty' ? (mt.aopQty || 0) : (mt.aopRev || 0));
              }, 0);
              return currentField === 'qty' ? Utils.formatNumber(total) : `₹${Utils.formatCompact(total)}`;
            })()}
          </div>
          <div className="ind-growth-cell">
            {(() => {
              const aopT = MONTHS.reduce((s, m) => s + (product.monthlyTargets?.[m]?.[currentField === 'qty' ? 'aopQty' : 'aopRev'] || 0), 0);
              const lyT = MONTHS.reduce((s, m) => s + (product.monthlyTargets?.[m]?.[currentField === 'qty' ? 'lyQty' : 'lyRev'] || 0), 0);
              if (lyT === 0 && aopT === 0) return '';
              const g = Utils.calcGrowth(lyT, aopT);
              return (
                <span className={`growth-badge ${g >= 0 ? 'positive' : 'negative'}`} style={{ opacity: 0.7 }}>
                  {Utils.formatGrowth(g)}
                </span>
              );
            })()}
          </div>
        </div>
      </div>
    );
  };

  // ==================== MAIN RENDER ====================

  const draftCount = targetStats.draft || 0;
  const submittedCount = targetStats.submitted || 0;
  const approvedCount = targetStats.approved || 0;
  const rejectedCount = targetStats.rejected || 0;

  return (
    <div className="ind-targets-container" ref={gridRef}>
      {/* Header */}
      <div className="ind-targets-header">
        <div className="ind-targets-header-title">
          <i className="fas fa-user-tie"></i>
          <h2>My Individual Target</h2>
          <span className="ind-fy-badge">FY {fiscalYear}</span>
        </div>

        {/* Info Banner */}
        <div className="ind-info-banner">
          <i className="fas fa-info-circle"></i>
          <span>
            This is your <strong>personal target</strong> as a TBM. Your individual commitment is tracked separately by ABM. 
            Territory-level targets are entered in the "Territory Target" tab.
          </span>
        </div>

        <div className="ind-targets-header-stats">
          <span className="ind-header-stat-pill draft">
            <i className="fas fa-edit"></i> {draftCount} Draft
          </span>
          <span className="ind-header-stat-pill pending">
            <i className="fas fa-clock"></i> {submittedCount} Pending
          </span>
          <span className="ind-header-stat-pill approved">
            <i className="fas fa-check-circle"></i> {approvedCount} Approved
          </span>
          {rejectedCount > 0 && (
            <span className="ind-header-stat-pill rejected">
              <i className="fas fa-undo"></i> {rejectedCount} Revision
            </span>
          )}
        </div>

        <div className="ind-targets-actions">
          {lastSaved && (
            <span className="ind-last-saved-indicator">
              <i className="fas fa-check-circle"></i>
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <button
            className="ind-target-action-btn save"
            onClick={handleSaveAll}
            disabled={isLoading}
          >
            {isLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
            Save Draft
          </button>
          <button
            className="ind-target-action-btn submit"
            onClick={handleSubmitAll}
            disabled={isLoading || draftCount + rejectedCount === 0}
            title={draftCount + rejectedCount === 0 ? 'No drafts to submit' : `Submit ${draftCount + rejectedCount} targets for ABM approval`}
          >
            {isLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
            Submit to ABM
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="ind-filters">
        <div className="ind-filter-group">
          <label>View Mode</label>
          <select
            className="ind-filter-select"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
          >
            <option value="qty">Quantity</option>
            <option value="rev">Revenue</option>
          </select>
        </div>

        <div className="ind-search-input-wrapper">
          <i className="fas fa-search"></i>
          <input
            type="text"
            className="ind-search-input"
            placeholder="Search products or codes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button
          className="ind-target-action-btn save"
          onClick={toggleExpandAll}
          style={{ marginLeft: 'auto' }}
        >
          <i className={`fas fa-${expandedCategories.size === categories.length ? 'compress-alt' : 'expand-alt'}`}></i>
          {expandedCategories.size === categories.length ? 'Collapse All' : 'Expand All'}
        </button>
      </div>

      {/* Grid */}
      <div className="ind-grid-wrapper">
        <div className="ind-excel-grid">
          {/* Header Row */}
          <div className="ind-grid-header-row">
            <div className="ind-header-cell product-header">
              <span>Product / My Target</span>
              <span className="ind-view-mode-indicator">{viewMode === 'qty' ? 'QTY' : 'REV'}</span>
            </div>

            {/* Month Headers */}
            {MONTH_LABELS.map((label, idx) => (
              <div key={label} className={`ind-header-cell month-header ${getQuarterColor(idx)}`}>
                {label}
                <span className="ind-year-indicator">{idx < 9 ? '25' : '26'}</span>
              </div>
            ))}

            {/* Quarter Headers */}
            {QUARTERS.map(q => (
              <div key={q.id} className={`ind-header-cell quarter-header ${q.color}`}>
                {q.label}
              </div>
            ))}

            <div className="ind-header-cell total-header">FY Total</div>
            <div className="ind-header-cell growth-header">YoY %</div>
          </div>

          {/* Category Sections */}
          {categories.map(category => {
            const catProducts = filteredProducts.filter(p => p.categoryId === category.id);
            if (catProducts.length === 0 && searchTerm) return null;
            const isExpanded = expandedCategories.has(category.id);

            return (
              <div key={category.id} className="ind-category-section">
                {/* Category Header */}
                <div
                  className={`ind-category-header-row ${isExpanded ? 'expanded' : ''}`}
                  onClick={() => toggleCategory(category.id)}
                >
                  <div className="ind-category-name-cell">
                    <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'} ind-expand-icon`}></i>
                    <i className={`fas ${category.icon} ind-category-icon`}></i>
                    <span className="ind-category-name">{category.name}</span>
                    <span className="ind-product-count">{catProducts.length}</span>
                  </div>

                  {/* Category Monthly Totals */}
                  {MONTHS.map((month, idx) => {
                    const total = calculateCategoryTotal(category.id, month, 'CY', viewMode);
                    return (
                      <div key={month} className={`ind-month-cell category-total ${getQuarterColor(idx)}`}>
                        {viewMode === 'qty'
                          ? Utils.formatNumber(total)
                          : `₹${Utils.formatCompact(total)}`
                        }
                      </div>
                    );
                  })}

                  {/* Category Quarterly Totals */}
                  {QUARTERS.map(quarter => {
                    const qTotal = quarter.months.reduce((sum, month) =>
                      sum + calculateCategoryTotal(category.id, month, 'CY', viewMode), 0
                    );
                    return (
                      <div key={quarter.id} className={`ind-quarter-cell ${quarter.color} category-total`}>
                        {viewMode === 'qty'
                          ? Utils.formatNumber(qTotal)
                          : `₹${Utils.formatCompact(qTotal)}`
                        }
                      </div>
                    );
                  })}

                  <div className="ind-total-cell category-total">
                    {(() => {
                      const total = MONTHS.reduce((sum, month) =>
                        sum + calculateCategoryTotal(category.id, month, 'CY', viewMode), 0
                      );
                      return viewMode === 'qty'
                        ? Utils.formatNumber(total)
                        : `₹${Utils.formatCompact(total)}`;
                    })()}
                  </div>
                  <div className="ind-growth-cell"></div>
                </div>

                {/* Products */}
                {isExpanded && (
                  <div className="ind-products-container">
                    {catProducts.map(renderProductRow)}
                  </div>
                )}
              </div>
            );
          })}

          {/* Empty State */}
          {filteredProducts.length === 0 && (
            <div className="ind-empty-state">
              <div className="ind-empty-state-icon">
                <i className="fas fa-search"></i>
              </div>
              <h3>No Products Found</h3>
              <p>Try adjusting your search criteria or clear the search to see all products.</p>
            </div>
          )}
        </div>
      </div>

      {/* Instructions Footer */}
      <div className="ind-grid-footer">
        <span><i className="fas fa-mouse-pointer"></i> Click on teal-bordered cells to edit your targets</span>
        <span><i className="fas fa-lock"></i> Submitted/Approved targets are locked</span>
        <span><i className="fas fa-undo"></i> Rejected targets can be edited and resubmitted</span>
        <span><i className="fas fa-arrow-up" style={{ color: '#10B981' }}></i> Targets go to ABM for approval</span>
      </div>
    </div>
  );
}

export default TBMIndividualTargetGrid;
