/**
 * TargetEntryGrid Component
 * Enhanced Excel-like grid for Monthly Target Entry
 * Features: Quarterly totals in header row, Monthly totals summary row,
 *           Edit/Freeze based on approval status
 * 
 * @author Appasamy Associates - Product Commitment PWA
 * @version 2.2.0 - Added Monthly Totals Summary Row
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Utils } from '../../utils/helpers';

// Constants for better maintainability
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
  const [activeCell, setActiveCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(new Set(['equipment', 'iol', 'ovd']));
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  
  // Refs
  const inputRef = useRef(null);
  const searchInputRef = useRef(null);
  const gridRef = useRef(null);

  // Focus input when active cell changes
  useEffect(() => {
    if (activeCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [activeCell]);

  // ==================== MEMOIZED CALCULATIONS ====================

  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    
    const search = searchTerm.toLowerCase().trim();
    return products.filter(p => 
      p.name?.toLowerCase().includes(search) ||
      p.code?.toLowerCase().includes(search) ||
      p.subcategory?.toLowerCase().includes(search)
    );
  }, [products, searchTerm]);

  // Get categories that have matching products
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    
    const categoryIdsWithProducts = new Set(filteredProducts.map(p => p.categoryId));
    return categories.filter(cat => categoryIdsWithProducts.has(cat.id));
  }, [categories, filteredProducts, searchTerm]);

  // Auto-expand categories when searching
  useEffect(() => {
    if (searchTerm.trim()) {
      const categoryIdsWithProducts = new Set(filteredProducts.map(p => p.categoryId));
      setExpandedCategories(categoryIdsWithProducts);
    }
  }, [searchTerm, filteredProducts]);

  // Calculate overall quarterly totals for the header
  const overallQuarterlyTotals = useMemo(() => {
    const totals = {};
    QUARTERS.forEach(q => {
      let cyTotal = 0;
      let lyTotal = 0;
      products.forEach(p => {
        q.months.forEach(month => {
          const monthData = p.monthlyTargets?.[month] || {};
          cyTotal += monthData.cyQty || 0;
          lyTotal += monthData.lyQty || 0;
        });
      });
      totals[q.id] = { cy: cyTotal, ly: lyTotal, growth: Utils.calcGrowth(lyTotal, cyTotal) };
    });
    return totals;
  }, [products]);

  // =====================================================================
  // NEW: Calculate overall monthly totals - sum of ALL products per month
  // This powers the monthly totals summary row below the quarter header
  // Auto-updates when any product target is edited
  // =====================================================================
  const overallMonthlyTotals = useMemo(() => {
    const totals = {};
    MONTHS.forEach(month => {
      let cyTotal = 0;
      products.forEach(p => {
        const monthData = p.monthlyTargets?.[month] || {};
        cyTotal += monthData.cyQty || 0;
      });
      totals[month] = cyTotal;
    });
    // Grand total = sum of all 12 months
    totals.grandTotal = MONTHS.reduce((sum, month) => sum + totals[month], 0);
    return totals;
  }, [products]);

  // ==================== HELPER FUNCTIONS ====================

  const getProductsByCategory = useCallback((categoryId) => {
    return filteredProducts.filter(p => p.categoryId === categoryId);
  }, [filteredProducts]);

  const getSubcategories = useCallback((categoryId) => {
    const categoryProducts = getProductsByCategory(categoryId);
    const subcats = [...new Set(categoryProducts.map(p => p.subcategory))];
    return subcats.filter(Boolean);
  }, [getProductsByCategory]);

  const getProductsBySubcategory = useCallback((categoryId, subcategory) => {
    return filteredProducts.filter(p => p.categoryId === categoryId && p.subcategory === subcategory);
  }, [filteredProducts]);

  const getCategoryStatusCounts = useCallback((categoryId) => {
    const categoryProducts = products.filter(p => p.categoryId === categoryId);
    const counts = {
      total: categoryProducts.length,
      draft: categoryProducts.filter(p => p.status === 'draft').length,
      submitted: categoryProducts.filter(p => p.status === 'submitted').length,
      approved: categoryProducts.filter(p => p.status === 'approved').length,
      rejected: categoryProducts.filter(p => p.status === 'rejected').length
    };
    counts.pending = counts.draft + counts.rejected;
    return counts;
  }, [products]);

  const getSubcategoryStatusCounts = useCallback((categoryId, subcategory) => {
    const subcatProducts = products.filter(p => p.categoryId === categoryId && p.subcategory === subcategory);
    const counts = {
      total: subcatProducts.length,
      draft: subcatProducts.filter(p => p.status === 'draft').length,
      submitted: subcatProducts.filter(p => p.status === 'submitted').length,
      approved: subcatProducts.filter(p => p.status === 'approved').length,
      rejected: subcatProducts.filter(p => p.status === 'rejected').length
    };
    counts.pending = counts.draft + counts.rejected;
    return counts;
  }, [products]);

  // ==================== CALCULATION FUNCTIONS ====================

  const calculateCategoryTotal = useCallback((categoryId, month, year) => {
    const categoryProducts = products.filter(p => p.categoryId === categoryId);
    return categoryProducts.reduce((sum, p) => {
      const monthData = p.monthlyTargets?.[month] || {};
      return sum + (year === 'CY' ? (monthData.cyQty || 0) : (monthData.lyQty || 0));
    }, 0);
  }, [products]);

  const calculateSubcategoryTotal = useCallback((categoryId, subcategory, month, year) => {
    const subcatProducts = products.filter(p => p.categoryId === categoryId && p.subcategory === subcategory);
    return subcatProducts.reduce((sum, p) => {
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
    const ly = calculateYearlyTotal(productId, 'LY');
    const cy = calculateYearlyTotal(productId, 'CY');
    return Utils.calcGrowth(ly, cy);
  }, [calculateYearlyTotal]);

  // ==================== STATUS HELPERS ====================

  const getStatusClass = (status) => STATUS_CONFIG[status]?.class || 'status-draft';
  
  const isEditable = (status) => status === 'draft' || status === 'rejected';

  const getStatusTooltip = (status) => {
    switch (status) {
      case 'submitted': return 'Pending TBM approval - values are locked';
      case 'approved': return 'Approved by TBM - values are frozen';
      case 'rejected': return 'Rejected by TBM - click to edit and resubmit';
      default: return 'Click to edit target value';
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

  const handleCellClick = (productId, month, year, currentValue, status) => {
    if (year === 'LY') return;
    if (status === 'submitted' || status === 'approved') return;
    setActiveCell({ productId, month, year });
    setEditValue(currentValue?.toString() || '');
  };

  const handleInputChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setEditValue(value);
  };

  const handleInputBlur = useCallback(() => {
    if (activeCell && onUpdateTarget) {
      const value = parseInt(editValue) || 0;
      onUpdateTarget(activeCell.productId, activeCell.month, value);
      setActiveCell(null);
      setEditValue('');
    }
  }, [activeCell, editValue, onUpdateTarget]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleInputBlur();
      if (activeCell) {
        const currentMonthIndex = MONTHS.indexOf(activeCell.month);
        if (currentMonthIndex < MONTHS.length - 1) {
          const nextMonth = MONTHS[currentMonthIndex + 1];
          const product = products.find(p => p.id === activeCell.productId);
          if (product && isEditable(product.status)) {
            const nextValue = product.monthlyTargets?.[nextMonth]?.cyQty || 0;
            setTimeout(() => {
              setActiveCell({ ...activeCell, month: nextMonth });
              setEditValue(nextValue.toString());
            }, 50);
          }
        }
      }
    } else if (e.key === 'Escape') {
      setActiveCell(null);
      setEditValue('');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleInputBlur();
    }
  };

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

  const renderCell = (productId, month, year, value, status) => {
    const isActive = activeCell?.productId === productId && 
                     activeCell?.month === month && 
                     activeCell?.year === year;
    const canEdit = year === 'CY' && isEditable(status);
    const isLocked = year === 'CY' && !isEditable(status);
    
    if (isActive && canEdit) {
      return (
        <input
          ref={inputRef}
          type="text"
          className="cell-input"
          value={editValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          aria-label={`Edit ${month} value`}
        />
      );
    }

    return (
      <div 
        className={`cell-value ${canEdit ? 'editable' : ''} ${year === 'LY' ? 'ly-value' : ''} ${isLocked ? 'locked' : ''}`}
        onClick={() => canEdit && handleCellClick(productId, month, year, value, status)}
        title={getStatusTooltip(status)}
        role={canEdit ? 'button' : 'text'}
        tabIndex={canEdit ? 0 : -1}
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
              {MONTHS.map(month => {
                const totalValue = calculateCategoryTotal(category.id, month, 'CY');
                const canEdit = isEditable(status);
                return (
                  <div key={month} className={`month-cell ${canEdit ? 'editable-revenue' : 'locked-cell'}`}>
                    {canEdit ? (
                      <input
                        type="text"
                        className="revenue-input"
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
        {/* Category Header Row */}
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
            <div key={month} className="month-cell category-total">{Utils.formatNumber(calculateCategoryTotal(category.id, month, 'CY'))}</div>
          ))}
          <div className="total-cell category-total">{Utils.formatNumber(MONTHS.reduce((sum, m) => sum + calculateCategoryTotal(category.id, m, 'CY'), 0))}</div>
          <div className="growth-cell">
            {(() => {
              const lyTotal = MONTHS.reduce((sum, m) => sum + calculateCategoryTotal(category.id, m, 'LY'), 0);
              const cyTotal = MONTHS.reduce((sum, m) => sum + calculateCategoryTotal(category.id, m, 'CY'), 0);
              const growth = Utils.calcGrowth(lyTotal, cyTotal);
              return <span className={`growth-value ${growth >= 0 ? 'positive' : 'negative'}`}>{Utils.formatGrowth(growth)}</span>;
            })()}
          </div>
        </div>

        {/* Subcategories and Products */}
        {isExpanded && subcategories.map(subcategory => {
          const subcatStatusCounts = getSubcategoryStatusCounts(category.id, subcategory);
          const subcatProducts = getProductsBySubcategory(category.id, subcategory);
          
          if (subcatProducts.length === 0) return null;
          
          return (
            <div key={subcategory} className="subcategory-section">
              {/* Subcategory Header */}
              <div className="subcategory-header-row">
                <div className="subcategory-name-cell">
                  <i className="fas fa-folder-open"></i>
                  <span>{highlightMatch(subcategory, searchTerm)}</span>
                  {renderStatusBadges(subcatStatusCounts)}
                </div>
                {MONTHS.map(month => (
                  <div key={month} className="month-cell subcategory-total">{Utils.formatNumber(calculateSubcategoryTotal(category.id, subcategory, month, 'CY'))}</div>
                ))}
                <div className="total-cell subcategory-total">{Utils.formatNumber(MONTHS.reduce((sum, m) => sum + calculateSubcategoryTotal(category.id, subcategory, m, 'CY'), 0))}</div>
                <div className="growth-cell">
                  {(() => {
                    const lyTotal = MONTHS.reduce((sum, m) => sum + calculateSubcategoryTotal(category.id, subcategory, m, 'LY'), 0);
                    const cyTotal = MONTHS.reduce((sum, m) => sum + calculateSubcategoryTotal(category.id, subcategory, m, 'CY'), 0);
                    const growth = Utils.calcGrowth(lyTotal, cyTotal);
                    return <span className={`growth-value small ${growth >= 0 ? 'positive' : 'negative'}`}>{Utils.formatGrowth(growth)}</span>;
                  })()}
                </div>
              </div>

              {/* Products in Subcategory */}
              {subcatProducts.map(product => (
                <div key={product.id} className={`product-rows ${getStatusClass(product.status)}`}>
                  {/* CY Row - Editable based on status */}
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
                    {MONTHS.map(month => {
                      const monthData = product.monthlyTargets?.[month] || {};
                      return (
                        <div key={month} className={`month-cell ${getStatusClass(product.status)}`}>
                          {renderCell(product.id, month, 'CY', monthData.cyQty, product.status)}
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
      {/* Header with actions */}
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
          <button 
            className="action-btn save" 
            onClick={handleSaveAll}
            disabled={isLoading}
          >
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

      {/* Search Bar */}
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
        {searchTerm && (
          <div className="search-results-info">
            <span className="results-count">
              <i className="fas fa-filter"></i>
              {filteredProducts.length} of {products.length} products
            </span>
            {filteredProducts.length === 0 && (
              <span className="no-results-hint">Try a different search term</span>
            )}
          </div>
        )}
      </div>

      {/* Excel Grid */}
      <div className="grid-wrapper">
        <div className="excel-grid">
          {/* Header Row */}
          <div className="grid-header-row">
            <div className="header-cell product-header">
              <span>PRODUCT / CATEGORY</span>
              <span className="year-indicator">Year</span>
            </div>
            {MONTH_LABELS.map((month, index) => (
              <div key={month} className={`header-cell month-header ${index < 3 ? 'q1' : index < 6 ? 'q2' : index < 9 ? 'q3' : 'q4'}`}>{month}</div>
            ))}
            <div className="header-cell total-header">TOTAL</div>
            <div className="header-cell growth-header">GROWTH %</div>
          </div>

          {/* Quarter Row with Totals - Simple & User Friendly */}
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

          {/* ============================================================= */}
          {/* NEW: Monthly Totals Summary Row                                */}
          {/* Shows grand total of ALL products for each individual month    */}
          {/* Auto-updates when any product CY value is edited               */}
          {/* ============================================================= */}
          <div className="monthly-totals-row">
            <div className="monthly-totals-label-cell">
              <i className="fas fa-calculator"></i>
              <span>Total</span>
            </div>
            {MONTHS.map((month, index) => (
              <div 
                key={month} 
                className={`monthly-totals-cell ${index < 3 ? 'q1' : index < 6 ? 'q2' : index < 9 ? 'q3' : 'q4'}`}
              >
                {Utils.formatNumber(overallMonthlyTotals[month] || 0)}
              </div>
            ))}
            <div className="monthly-totals-cell grand-total">
              {Utils.formatNumber(overallMonthlyTotals.grandTotal || 0)}
            </div>
            <div className="monthly-totals-cell growth-spacer"></div>
          </div>

          {/* Category content */}
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
      </div>

      {/* Footer with legend and help */}
      <div className="grid-footer">
        <div className="footer-info">
          <i className="fas fa-info-circle"></i>
          <span>Click on any <strong>CY</strong> cell to edit (Draft/Rejected only). Press <kbd>Enter</kbd> to move next, <kbd>Esc</kbd> to cancel.</span>
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
