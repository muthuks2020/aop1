/**
 * TargetEntryGrid Component
 * Enhanced Excel-like grid for Monthly Target Entry
 * 
 * UPDATED v2.2.0: All editable CY cells now show input box with teal border by DEFAULT
 * This makes it easy for sales team to see which cells need to be filled in
 * 
 * @author Appasamy Associates - Product Commitment PWA
 * @version 2.2.0
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Utils } from '../../utils/helpers';

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
  submitted: { icon: 'fa-clock', label: 'Pending', class: 'status-submitted' },
  approved: { icon: 'fa-check-circle', label: 'Approved', class: 'status-approved' },
  rejected: { icon: 'fa-times-circle', label: 'Rejected', class: 'status-rejected' }
};

function TargetEntryGrid({ 
  categories = [], 
  products = [], 
  onUpdateTarget,
  onSaveAll,
  onSubmitAll,
  userRole = 'salesrep',
  fiscalYear = '2025-26'
}) {
  // State management
  const [expandedCategories, setExpandedCategories] = useState(new Set(['equipment', 'iol', 'ovd']));
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  
  // Refs
  const searchInputRef = useRef(null);
  const gridRef = useRef(null);

  // ==================== MEMOIZED CALCULATIONS ====================

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    const term = searchTerm.toLowerCase();
    return products.filter(p => 
      p.name?.toLowerCase().includes(term) ||
      p.code?.toLowerCase().includes(term) ||
      p.categoryId?.toLowerCase().includes(term) ||
      p.subcategoryId?.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    const activeCategories = new Set(filteredProducts.map(p => p.categoryId));
    return categories.filter(c => activeCategories.has(c.id));
  }, [categories, filteredProducts, searchTerm]);

  const overallQuarterlyTotals = useMemo(() => {
    const totals = {};
    QUARTERS.forEach(q => {
      totals[q.id] = {
        cy: q.months.reduce((sum, month) => {
          return sum + filteredProducts.reduce((pSum, p) => {
            return pSum + (p.monthlyTargets?.[month]?.cyQty || 0);
          }, 0);
        }, 0),
        ly: q.months.reduce((sum, month) => {
          return sum + filteredProducts.reduce((pSum, p) => {
            return pSum + (p.monthlyTargets?.[month]?.lyQty || 0);
          }, 0);
        }, 0)
      };
    });
    return totals;
  }, [filteredProducts]);

  // ==================== HELPER FUNCTIONS ====================

  const getProductsByCategory = useCallback((categoryId) => {
    return filteredProducts.filter(p => p.categoryId === categoryId);
  }, [filteredProducts]);

  const getSubcategories = useCallback((categoryId) => {
    const catProducts = getProductsByCategory(categoryId);
    const subcatMap = new Map();
    catProducts.forEach(p => {
      if (!subcatMap.has(p.subcategoryId)) {
        subcatMap.set(p.subcategoryId, {
          id: p.subcategoryId,
          name: p.subcategoryName || p.subcategoryId,
          products: []
        });
      }
      subcatMap.get(p.subcategoryId).products.push(p);
    });
    return Array.from(subcatMap.values());
  }, [getProductsByCategory]);

  const getCategoryStatusCounts = useCallback((categoryId) => {
    const catProducts = products.filter(p => p.categoryId === categoryId);
    return {
      approved: catProducts.filter(p => p.status === 'approved').length,
      submitted: catProducts.filter(p => p.status === 'submitted').length,
      pending: catProducts.filter(p => p.status === 'draft').length,
      rejected: catProducts.filter(p => p.status === 'rejected').length
    };
  }, [products]);

  const calculateCategoryTotal = useCallback((categoryId, month, year) => {
    return products
      .filter(p => p.categoryId === categoryId)
      .reduce((sum, p) => {
        const monthData = p.monthlyTargets?.[month] || {};
        return sum + (year === 'CY' ? (monthData.cyQty || 0) : (monthData.lyQty || 0));
      }, 0);
  }, [products]);

  const calculateYearlyTotal = useCallback((productId, year) => {
    const product = products.find(p => p.id === productId);
    if (!product) return 0;
    return MONTHS.reduce((sum, month) => {
      const monthData = product.monthlyTargets?.[month] || {};
      return sum + (year === 'CY' ? (monthData.cyQty || 0) : (monthData.lyQty || 0));
    }, 0);
  }, [products]);

  const calculateGrowth = useCallback((productId) => {
    const lyTotal = calculateYearlyTotal(productId, 'LY');
    const cyTotal = calculateYearlyTotal(productId, 'CY');
    return Utils.calcGrowth(lyTotal, cyTotal);
  }, [calculateYearlyTotal]);

  const getStatusClass = (status) => STATUS_CONFIG[status]?.class || 'status-draft';
  
  const isEditable = (status) => status === 'draft' || status === 'rejected';

  const getStatusTooltip = (status) => {
    switch (status) {
      case 'submitted': return 'Pending TBM approval - values are locked';
      case 'approved': return 'Approved by TBM - values are frozen';
      case 'rejected': return 'Rejected by TBM - edit and resubmit';
      default: return 'Enter target value';
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

  // Direct input change handler - updates value on every change
  const handleInputChange = useCallback((productId, month, e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (onUpdateTarget) {
      onUpdateTarget(productId, month, parseInt(value) || 0);
    }
  }, [onUpdateTarget]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e, productId, monthIndex) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      // Move to next cell on Enter
      if (e.key === 'Enter') {
        e.preventDefault();
        if (monthIndex < MONTHS.length - 1) {
          const nextInput = document.querySelector(
            `input[data-product="${productId}"][data-month="${MONTHS[monthIndex + 1]}"]`
          );
          if (nextInput) nextInput.focus();
        }
      }
    }
  }, []);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Escape') {
      setSearchTerm('');
      searchInputRef.current?.blur();
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  const handleSaveAll = async () => {
    setIsLoading(true);
    try {
      await onSaveAll?.();
      setLastSaved(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAll = async () => {
    setIsLoading(true);
    try {
      await onSubmitAll?.();
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== RENDER HELPERS ====================

  const highlightMatch = (text, search) => {
    if (!search?.trim() || !text) return text;
    const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? <mark key={i} className="search-highlight">{part}</mark> : part
    );
  };

  /**
   * UPDATED: renderCell - NOW ALWAYS shows input box with teal border for editable cells
   * This makes it easy for sales team to see which cells they need to fill
   */
  const renderCell = (productId, month, year, value, status, monthIndex) => {
    const canEdit = year === 'CY' && isEditable(status);
    const isLocked = year === 'CY' && !isEditable(status);
    
    // ✅ ALWAYS show input for editable cells (Draft/Rejected)
    if (canEdit) {
      return (
        <input
          type="text"
          className="cell-input"
          data-product={productId}
          data-month={month}
          value={value || ''}
          placeholder="0"
          onChange={(e) => handleInputChange(productId, month, e)}
          onKeyDown={(e) => handleKeyDown(e, productId, monthIndex)}
          aria-label={`Enter ${month.toUpperCase()} target value`}
        />
      );
    }

    // For non-editable cells (LY values or locked CY values)
    return (
      <div 
        className={`cell-value ${year === 'LY' ? 'ly-value' : ''} ${isLocked ? 'locked' : ''}`}
        title={getStatusTooltip(status)}
      >
        {value || '-'}
        {isLocked && <i className="fas fa-lock lock-icon"></i>}
      </div>
    );
  };

  const renderStatusBadges = (counts) => (
    <div className="status-badges">
      {counts.approved > 0 && (
        <span className="status-badge approved" title={`${counts.approved} Approved`}>
          <i className="fas fa-check"></i> {counts.approved}
        </span>
      )}
      {counts.submitted > 0 && (
        <span className="status-badge submitted" title={`${counts.submitted} Pending Approval`}>
          <i className="fas fa-clock"></i> {counts.submitted}
        </span>
      )}
      {counts.pending > 0 && (
        <span className="status-badge pending" title={`${counts.pending} Pending Entry`}>
          <i className="fas fa-edit"></i> {counts.pending}
        </span>
      )}
    </div>
  );

  // ==================== REVENUE ONLY CATEGORY RENDERER ====================

  const renderRevenueOnlyCategory = (category) => {
    const isExpanded = expandedCategories.has(category.id);
    const statusCounts = getCategoryStatusCounts(category.id);
    const firstProduct = getProductsByCategory(category.id)[0];
    const status = firstProduct?.status || 'draft';
    
    if (!firstProduct) return null;
    
    return (
      <div key={category.id} className={`category-section revenue-only ${getStatusClass(status)}`}>
        <div className="category-header-row" onClick={() => toggleCategory(category.id)}>
          <div className="category-name-cell">
            <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'} chevron-icon`}></i>
            <div className={`category-icon ${category.color}`}>
              <i className={`fas ${category.icon}`}></i>
            </div>
            <span>{highlightMatch(category.name, searchTerm)}</span>
            <span className="revenue-badge">Revenue Only</span>
            {renderStatusBadges(statusCounts)}
          </div>
          {MONTHS.map(month => (
            <div key={month} className="month-cell category-total">
              {Utils.formatNumber(calculateCategoryTotal(category.id, month, 'CY'))}
            </div>
          ))}
          <div className="total-cell category-total">
            {Utils.formatNumber(MONTHS.reduce((sum, m) => sum + calculateCategoryTotal(category.id, m, 'CY'), 0))}
          </div>
          <div className="growth-cell">
            {(() => {
              const lyTotal = MONTHS.reduce((sum, m) => sum + calculateCategoryTotal(category.id, m, 'LY'), 0);
              const cyTotal = MONTHS.reduce((sum, m) => sum + calculateCategoryTotal(category.id, m, 'CY'), 0);
              const growth = Utils.calcGrowth(lyTotal, cyTotal);
              return <span className={`growth-value ${growth >= 0 ? 'positive' : 'negative'}`}>{Utils.formatGrowth(growth)}</span>;
            })()}
          </div>
        </div>
        
        {isExpanded && (
          <div className="revenue-input-section">
            <div className={`revenue-row ${getStatusClass(status)}`}>
              <div className="product-name-cell">
                <span className="year-label">CY Target</span>
                <span className={`product-status-badge ${status}`}>
                  {status === 'approved' && <><i className="fas fa-check-circle"></i> Approved</>}
                  {status === 'submitted' && <><i className="fas fa-clock"></i> Pending</>}
                  {status === 'rejected' && <><i className="fas fa-times-circle"></i> Rejected</>}
                  {status === 'draft' && <><i className="fas fa-edit"></i> Draft</>}
                </span>
              </div>
              {MONTHS.map((month, idx) => {
                const totalValue = calculateCategoryTotal(category.id, month, 'CY');
                const canEdit = isEditable(status);
                return (
                  <div key={month} className={`month-cell ${canEdit ? 'editable-revenue' : 'locked-cell'}`}>
                    {canEdit ? (
                      <input
                        type="text"
                        className="cell-input"
                        value={totalValue || ''}
                        placeholder="0"
                        onChange={(e) => {
                          if (firstProduct) {
                            const value = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
                            onUpdateTarget(firstProduct.id, month, value);
                          }
                        }}
                      />
                    ) : (
                      <span className="locked-value">
                        {Utils.formatNumber(totalValue)}
                        <i className="fas fa-lock lock-icon-small"></i>
                      </span>
                    )}
                  </div>
                );
              })}
              <div className="total-cell">{Utils.formatNumber(MONTHS.reduce((sum, m) => sum + calculateCategoryTotal(category.id, m, 'CY'), 0))}</div>
              <div className="growth-cell">-</div>
            </div>
            <div className="revenue-row ly-row">
              <div className="product-name-cell"><span className="year-label ly">LY Actual</span></div>
              {MONTHS.map(month => (
                <div key={month} className="month-cell ly-value">{Utils.formatNumber(calculateCategoryTotal(category.id, month, 'LY'))}</div>
              ))}
              <div className="total-cell ly-value">{Utils.formatNumber(MONTHS.reduce((sum, m) => sum + calculateCategoryTotal(category.id, m, 'LY'), 0))}</div>
              <div className="growth-cell">-</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ==================== PRODUCT CATEGORY RENDERER ====================

  const renderProductCategory = (category) => {
    const isExpanded = expandedCategories.has(category.id);
    const subcategories = getSubcategories(category.id);
    const statusCounts = getCategoryStatusCounts(category.id);

    if (subcategories.length === 0 && searchTerm) return null;

    return (
      <div key={category.id} className="category-section">
        <div className="category-header-row" onClick={() => toggleCategory(category.id)}>
          <div className="category-name-cell">
            <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'} chevron-icon`}></i>
            <div className={`category-icon ${category.color}`}>
              <i className={`fas ${category.icon}`}></i>
            </div>
            <span>{highlightMatch(category.name, searchTerm)}</span>
            {renderStatusBadges(statusCounts)}
          </div>
          {MONTHS.map(month => (
            <div key={month} className="month-cell category-total">
              {Utils.formatNumber(calculateCategoryTotal(category.id, month, 'CY'))}
            </div>
          ))}
          <div className="total-cell category-total">
            {Utils.formatNumber(MONTHS.reduce((sum, m) => sum + calculateCategoryTotal(category.id, m, 'CY'), 0))}
          </div>
          <div className="growth-cell">
            {(() => {
              const lyTotal = MONTHS.reduce((sum, m) => sum + calculateCategoryTotal(category.id, m, 'LY'), 0);
              const cyTotal = MONTHS.reduce((sum, m) => sum + calculateCategoryTotal(category.id, m, 'CY'), 0);
              const growth = Utils.calcGrowth(lyTotal, cyTotal);
              return <span className={`growth-value ${growth >= 0 ? 'positive' : 'negative'}`}>{Utils.formatGrowth(growth)}</span>;
            })()}
          </div>
        </div>

        {isExpanded && subcategories.map(subcat => {
          const subcatProducts = subcat.products;
          return (
            <div key={subcat.id} className="subcategory-section">
              <div className="subcategory-header-row">
                <div className="subcategory-name-cell">
                  <i className="fas fa-folder-open subcat-icon"></i>
                  <span>{highlightMatch(subcat.name, searchTerm)}</span>
                </div>
                {MONTHS.map(month => {
                  const subcatTotal = subcatProducts.reduce((sum, p) => 
                    sum + (p.monthlyTargets?.[month]?.cyQty || 0), 0
                  );
                  return <div key={month} className="month-cell subcat-total">{Utils.formatNumber(subcatTotal)}</div>;
                })}
                <div className="total-cell subcat-total">
                  {Utils.formatNumber(subcatProducts.reduce((sum, p) => 
                    MONTHS.reduce((mSum, m) => mSum + (p.monthlyTargets?.[m]?.cyQty || 0), sum), 0
                  ))}
                </div>
                <div className="growth-cell">
                  {(() => {
                    const lyTotal = subcatProducts.reduce((sum, p) => 
                      MONTHS.reduce((mSum, m) => mSum + (p.monthlyTargets?.[m]?.lyQty || 0), sum), 0
                    );
                    const cyTotal = subcatProducts.reduce((sum, p) => 
                      MONTHS.reduce((mSum, m) => mSum + (p.monthlyTargets?.[m]?.cyQty || 0), sum), 0
                    );
                    const growth = Utils.calcGrowth(lyTotal, cyTotal);
                    return <span className={`growth-value ${growth >= 0 ? 'positive' : 'negative'}`}>{Utils.formatGrowth(growth)}</span>;
                  })()}
                </div>
              </div>

              {subcatProducts.map(product => (
                <div key={product.id} className={`product-rows ${getStatusClass(product.status)}`}>
                  {/* CY Row - Shows input boxes for editable cells */}
                  <div className="product-row cy-row">
                    <div className="product-name-cell">
                      <span className="product-name">{highlightMatch(product.name, searchTerm)}</span>
                      <span className={`year-badge cy ${product.status}`}>
                        {product.status === 'approved' && <i className="fas fa-check"></i>}
                        {product.status === 'submitted' && <i className="fas fa-clock"></i>}
                        {product.status === 'rejected' && <i className="fas fa-times"></i>}
                        CY
                      </span>
                    </div>
                    {MONTHS.map((month, idx) => {
                      const monthData = product.monthlyTargets?.[month] || {};
                      return (
                        <div key={month} className={`month-cell ${getStatusClass(product.status)}`}>
                          {renderCell(product.id, month, 'CY', monthData.cyQty, product.status, idx)}
                        </div>
                      );
                    })}
                    <div className={`total-cell cy-total ${getStatusClass(product.status)}`}>{Utils.formatNumber(calculateYearlyTotal(product.id, 'CY'))}</div>
                    <div className="growth-cell">
                      <span className={`growth-value ${calculateGrowth(product.id) >= 0 ? 'positive' : 'negative'}`}>{Utils.formatGrowth(calculateGrowth(product.id))}</span>
                    </div>
                  </div>
                  
                  {/* LY Row - Always Read-only */}
                  <div className="product-row ly-row">
                    <div className="product-name-cell">
                      <span className="product-code">{highlightMatch(product.code, searchTerm)}</span>
                      <span className="year-badge ly">LY</span>
                    </div>
                    {MONTHS.map(month => {
                      const monthData = product.monthlyTargets?.[month] || {};
                      return <div key={month} className="month-cell ly-value">{monthData.lyQty || '-'}</div>;
                    })}
                    <div className="total-cell ly-total">{Utils.formatNumber(calculateYearlyTotal(product.id, 'LY'))}</div>
                    <div className="growth-cell"></div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  // ==================== MAIN RENDER ====================

  const draftCount = products.filter(p => p.status === 'draft').length;
  const submittedCount = products.filter(p => p.status === 'submitted').length;
  const approvedCount = products.filter(p => p.status === 'approved').length;

  return (
    <div className="target-entry-container" ref={gridRef}>
      <div className="grid-header">
        <div className="grid-title">
          <h2><i className="fas fa-table"></i> Monthly Target Entry</h2>
          <span className="fiscal-year">FY {fiscalYear}</span>
          <div className="header-stats">
            <span className="header-stat draft"><i className="fas fa-edit"></i> {draftCount} Draft</span>
            <span className="header-stat submitted"><i className="fas fa-clock"></i> {submittedCount} Pending</span>
            <span className="header-stat approved"><i className="fas fa-check-circle"></i> {approvedCount} Approved</span>
          </div>
        </div>
        <div className="grid-actions">
          {lastSaved && (
            <span className="last-saved">
              <i className="fas fa-check-circle"></i> Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <button className="action-btn save" onClick={handleSaveAll} disabled={isLoading}>
            {isLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
            Save Draft
          </button>
          <button 
            className="action-btn submit" 
            onClick={handleSubmitAll}
            disabled={isLoading || draftCount === 0}
            title={draftCount === 0 ? 'No drafts to submit' : `Submit ${draftCount} products for approval`}
          >
            {isLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
            Submit for Approval
          </button>
        </div>
      </div>

      <div className="grid-search-bar">
        <div className="search-input-wrapper">
          <i className="fas fa-search search-icon"></i>
          <input
            ref={searchInputRef}
            type="text"
            className="grid-search-input"
            placeholder="Search products, codes, categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          {searchTerm && (
            <button className="search-clear-btn" onClick={clearSearch}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>

      <div className="grid-content">
        <div className="header-row">
          <div className="header-cell product-header">PRODUCT / CATEGORY <span className="year-indicator">YEAR</span></div>
          {MONTH_LABELS.map((month, index) => (
            <div key={month} className={`header-cell month-header ${index < 3 ? 'q1' : index < 6 ? 'q2' : index < 9 ? 'q3' : 'q4'}`}>{month}</div>
          ))}
          <div className="header-cell total-header">TOTAL</div>
          <div className="header-cell growth-header">GROWTH %</div>
        </div>

        <div className="quarter-row">
          <div className="quarter-cell empty"></div>
          {QUARTERS.map(q => (
            <div key={q.id} className={`quarter-cell ${q.color}`} style={{gridColumn: 'span 3'}}>
              <div className="quarter-content">
                <span className="quarter-label">{q.fullLabel}</span>
                <span className="quarter-divider">|</span>
                <span className="quarter-total-value">{Utils.formatNumber(overallQuarterlyTotals[q.id]?.cy || 0)}</span>
              </div>
            </div>
          ))}
          <div className="quarter-cell empty total-spacer"></div>
          <div className="quarter-cell empty growth-spacer"></div>
        </div>

        {filteredCategories.length === 0 ? (
          <div className="no-results-message">
            <i className="fas fa-search"></i>
            <h3>No products found</h3>
            <p>No products match "{searchTerm}". Try a different search term.</p>
            <button className="clear-search-btn" onClick={clearSearch}>
              <i className="fas fa-times"></i> Clear Search
            </button>
          </div>
        ) : (
          filteredCategories.map(category => 
            REVENUE_ONLY_CATEGORIES.includes(category.id) 
              ? renderRevenueOnlyCategory(category)
              : renderProductCategory(category)
          )
        )}
      </div>

      <div className="grid-footer">
        <div className="footer-info">
          <i className="fas fa-info-circle"></i>
          <span>All cells with <strong>teal border</strong> are editable. Press <kbd>Enter</kbd> to move to next cell, <kbd>Tab</kbd> to navigate.</span>
        </div>
        <div className="footer-legend">
          <span className="legend-item"><span className="legend-color draft"></span> Draft (Editable)</span>
          <span className="legend-item"><span className="legend-color submitted"></span> Submitted (Locked)</span>
          <span className="legend-item"><span className="legend-color approved"></span> Approved (Frozen)</span>
          <span className="legend-item"><span className="legend-color rejected"></span> Rejected (Editable)</span>
        </div>
      </div>
    </div>
  );
}

export default TargetEntryGrid;
