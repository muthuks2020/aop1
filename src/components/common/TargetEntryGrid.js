/**
 * TargetEntryGrid Component
 * Enhanced Excel-like grid for Monthly Target Entry
 * Features: Overall Target Bar (VALUE-based), Quarterly totals in header row, 
 *           Monthly totals summary row, Edit/Freeze based on approval status
 * 
 * @author Appasamy Associates - Product Commitment PWA
 * @version 2.5.0 - VALUE-based Overall Target Summary Bar
 * 
 * v2.5.0 CHANGES:
 * - All 3 OTB cards now show VALUE (₹) not units
 * - Card 1: Target Value (FY) — fixed target from TBM
 * - Card 2: Current Year Value — live running total with growth badge
 * - Card 3: Last Year Value — reference
 * - LY → "Last Year", CY → "Current Year" in labels
 * - Progress bar tracks value achievement
 * - Quarter chips show revenue only
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Utils } from '../../utils/helpers';

// Constants for better maintainability
const MONTHS = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];
const MONTH_LABELS = ['APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR'];
const MONTH_LABEL_MAP = {
  apr: 'APR', may: 'MAY', jun: 'JUN',
  jul: 'JUL', aug: 'AUG', sep: 'SEP',
  oct: 'OCT', nov: 'NOV', dec: 'DEC',
  jan: 'JAN', feb: 'FEB', mar: 'MAR'
};

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
  fiscalYear = '2025-26',
  overallYearlyTargetValue = null  // Fixed yearly target in VALUE (₹) assigned by TBM
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

  // Calculate overall monthly totals
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
    totals.grandTotal = Object.values(totals).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
    return totals;
  }, [products]);

  // =====================================================================
  // Overall Target Calculations — VALUE-BASED (v2.5.0)
  // Computes running total of CY Revenue and LY Revenue across all products
  // Achievement is measured against the fixed yearly VALUE target from TBM
  // =====================================================================
  const overallTargetSummary = useMemo(() => {
    let totalCyQty = 0;
    let totalLyQty = 0;
    let totalCyRev = 0;
    let totalLyRev = 0;

    products.forEach(p => {
      if (p.monthlyTargets) {
        Object.values(p.monthlyTargets).forEach(m => {
          totalCyQty += m.cyQty || 0;
          totalLyQty += m.lyQty || 0;
          totalCyRev += m.cyRev || 0;
          totalLyRev += m.lyRev || 0;
        });
      }
    });

    const qtyGrowth = Utils.calcGrowth(totalLyQty, totalCyQty);
    const revGrowth = Utils.calcGrowth(totalLyRev, totalCyRev);

    // Achievement percentage against fixed yearly VALUE target
    const yearlyTargetValue = overallYearlyTargetValue || 0;
    const achievementPercent = yearlyTargetValue > 0 
      ? Math.min(Math.round((totalCyRev / yearlyTargetValue) * 100), 100) 
      : 0;
    const overflowPercent = yearlyTargetValue > 0 && totalCyRev > yearlyTargetValue
      ? Math.round(((totalCyRev - yearlyTargetValue) / yearlyTargetValue) * 100)
      : 0;

    // Quarterly breakdown for the target bar (with month-level detail)
    const quarterlyBreakdown = QUARTERS.map(q => {
      let qCyQty = 0;
      let qCyRev = 0;
      const monthlyDetail = q.months.map(month => {
        let mCyQty = 0;
        let mCyRev = 0;
        products.forEach(p => {
          const monthData = p.monthlyTargets?.[month] || {};
          mCyQty += monthData.cyQty || 0;
          mCyRev += monthData.cyRev || 0;
        });
        qCyQty += mCyQty;
        qCyRev += mCyRev;
        return { month, cyQty: mCyQty, cyRev: mCyRev };
      });
      return { ...q, cyQty: qCyQty, cyRev: qCyRev, monthlyDetail };
    });

    return {
      totalCyQty,
      totalLyQty,
      totalCyRev,
      totalLyRev,
      qtyGrowth,
      revGrowth,
      yearlyTargetValue,
      achievementPercent,
      overflowPercent,
      quarterlyBreakdown
    };
  }, [products, overallYearlyTargetValue]);

  // ==================== HELPER FUNCTIONS ====================

  const getSubcategories = useCallback((categoryId) => {
    const catProducts = filteredProducts.filter(p => p.categoryId === categoryId);
    const subcats = [...new Set(catProducts.map(p => p.subcategory).filter(Boolean))];
    return subcats;
  }, [filteredProducts]);



  const calculateCategoryTotal = useCallback((categoryId, month, year) => {
    const catProducts = products.filter(p => p.categoryId === categoryId);
    return catProducts.reduce((sum, p) => {
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

  const handleCellClick = (productId, month, currentValue, status) => {
    if (!isEditable(status)) return;
    setActiveCell({ productId, month });
    setEditValue(currentValue?.toString() || '');
  };

  const handleCellChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setEditValue(value);
  };

  const handleCellBlur = () => {
    if (activeCell) {
      const numValue = parseInt(editValue) || 0;
      if (onUpdateTarget) {
        onUpdateTarget(activeCell.productId, activeCell.month, numValue);
      }
      setActiveCell(null);
      setEditValue('');
    }
  };

  const handleCellKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCellBlur();
    } else if (e.key === 'Escape') {
      setActiveCell(null);
      setEditValue('');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleCellBlur();
      if (activeCell) {
        const monthIdx = MONTHS.indexOf(activeCell.month);
        if (monthIdx < MONTHS.length - 1) {
          const product = products.find(p => p.id === activeCell.productId);
          if (product && isEditable(product.status)) {
            const nextMonth = MONTHS[monthIdx + 1];
            const nextValue = product.monthlyTargets?.[nextMonth]?.cyQty || 0;
            setActiveCell({ productId: activeCell.productId, month: nextMonth });
            setEditValue(nextValue.toString());
          }
        }
      }
    }
  };

  const handleSaveAll = async () => {
    setIsLoading(true);
    try {
      if (onSaveAll) await onSaveAll();
      setLastSaved(new Date());
    } catch (error) {
      console.error('Save failed:', error);
    }
    setIsLoading(false);
  };

  const handleSubmitAll = async () => {
    setIsLoading(true);
    try {
      if (onSubmitAll) await onSubmitAll();
    } catch (error) {
      console.error('Submit failed:', error);
    }
    setIsLoading(false);
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

  // ==================== RENDER HELPERS ====================

  const highlightMatch = (text, search) => {
    if (!search || !search.trim()) return text;
    const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? <mark key={i} className="search-highlight">{part}</mark> : part
    );
  };


  // Get overall status counts
  const statusCounts = useMemo(() => {
    const counts = { draft: 0, submitted: 0, approved: 0, rejected: 0 };
    products.forEach(p => { if (counts[p.status] !== undefined) counts[p.status]++; });
    return counts;
  }, [products]);

  const draftCount = statusCounts.draft + statusCounts.rejected;

  // ==================== REVENUE ONLY CATEGORY RENDERER ====================

  const renderRevenueOnlyCategory = (category) => {
    const isExpanded = expandedCategories.has(category.id);
    const catProducts = filteredProducts.filter(p => p.categoryId === category.id);
   
    const firstProduct = catProducts[0];
    const status = firstProduct?.status || 'draft';

    if (catProducts.length === 0 && searchTerm) return null;

    return (
      <div key={category.id} className="category-section revenue-only-section">
        <div className="category-header-row" onClick={() => toggleCategory(category.id)}>
          <div className="category-name-cell">
            <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'} chevron-icon`}></i>
            <div className={`category-icon-badge ${category.id}`}>
              <i className={`fas ${category.icon || 'fa-box'}`}></i>
            </div>
            <span className="category-name">{category.name}</span>
            <span className="revenue-only-badge">Revenue Only</span>
          
          </div>
          {MONTHS.map(month => (
            <div key={month} className="month-cell">
              {Utils.formatNumber(calculateCategoryTotal(category.id, month, 'CY'))}
            </div>
          ))}
          <div className="total-cell">
            {Utils.formatNumber(MONTHS.reduce((sum, m) => sum + calculateCategoryTotal(category.id, m, 'CY'), 0))}
          </div>
          <div className="growth-cell">
            {(() => {
              const ly = MONTHS.reduce((sum, m) => sum + calculateCategoryTotal(category.id, m, 'LY'), 0);
              const cy = MONTHS.reduce((sum, m) => sum + calculateCategoryTotal(category.id, m, 'CY'), 0);
              const growth = Utils.calcGrowth(ly, cy);
              return <span className={`growth-value ${growth >= 0 ? 'positive' : 'negative'}`}>{Utils.formatGrowth(growth)}</span>;
            })()}
          </div>
        </div>

        {isExpanded && (
          <div className="revenue-input-section">
            <div className="revenue-row cy-row">
              <div className="product-name-cell">
                <span className="year-label">CY Target</span>
                <span className={`product-status-badge ${status}`}>
                  <i className={`fas ${STATUS_CONFIG[status]?.icon}`}></i>
                  {STATUS_CONFIG[status]?.label}
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
              <div className="product-name-cell"><span className="year-label ly">Last Year Actual</span></div>
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
    

    if (subcategories.length === 0 && searchTerm) return null;

    return (
      <div key={category.id} className="category-section">
        <div className="category-header-row" onClick={() => toggleCategory(category.id)}>
          <div className="category-name-cell">
            <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'} chevron-icon`}></i>
            <div className={`category-icon-badge ${category.id}`}>
              <i className={`fas ${category.icon || 'fa-box'}`}></i>
            </div>
            <span className="category-name">{category.name}</span>
            
           
          </div>
          {MONTHS.map(month => (
            <div key={month} className="month-cell">
              {Utils.formatNumber(calculateCategoryTotal(category.id, month, 'CY'))}
            </div>
          ))}
          <div className="total-cell">
            {Utils.formatNumber(MONTHS.reduce((sum, m) => sum + calculateCategoryTotal(category.id, m, 'CY'), 0))}
          </div>
          <div className="growth-cell">
            {(() => {
              const ly = MONTHS.reduce((sum, m) => sum + calculateCategoryTotal(category.id, m, 'LY'), 0);
              const cy = MONTHS.reduce((sum, m) => sum + calculateCategoryTotal(category.id, m, 'CY'), 0);
              const growth = Utils.calcGrowth(ly, cy);
              return <span className={`growth-value ${growth >= 0 ? 'positive' : 'negative'}`}>{Utils.formatGrowth(growth)}</span>;
            })()}
          </div>
        </div>

        {isExpanded && subcategories.map(subcategory => {
          const subcatProducts = filteredProducts.filter(
            p => p.categoryId === category.id && p.subcategory === subcategory
          );

          return (
            <div key={subcategory} className="subcategory-section">
              <div className="subcategory-header-row">
                <div className="subcategory-name-cell">
                  <span className="subcategory-name">{highlightMatch(subcategory, searchTerm)}</span>
                  
                </div>
               
               
              </div>

              {subcatProducts.map(product => (
                <div key={product.id} className={`product-rows ${getStatusClass(product.status)}`}>
                  <div className="product-row cy-row">
                    <div className="product-name-cell">
                      <span className="product-name" title={product.name}>
                        {highlightMatch(product.name, searchTerm)}
                      </span>
                      <span className="product-code">{product.code}</span>
                      <span className="year-label">CY</span>
                      <span className={`product-status-badge ${product.status}`} title={getStatusTooltip(product.status)}>
                        <i className={`fas ${STATUS_CONFIG[product.status]?.icon}`}></i>
                        {STATUS_CONFIG[product.status]?.label}
                      </span>
                    </div>
                    {MONTHS.map(month => {
                      const monthData = product.monthlyTargets?.[month] || {};
                      const isActive = activeCell?.productId === product.id && activeCell?.month === month;
                      const canEdit = isEditable(product.status);
                      
                      return (
                        <div 
                          key={month} 
                          className={`month-cell ${canEdit ? 'editable' : 'locked-cell'} ${isActive ? 'active-cell' : ''}`}
                          onClick={() => handleCellClick(product.id, month, monthData.cyQty, product.status)}
                          title={getStatusTooltip(product.status)}
                        >
                          {isActive ? (
                            <input
                              ref={inputRef}
                              type="text"
                              className="cell-input"
                              value={editValue}
                              onChange={handleCellChange}
                              onBlur={handleCellBlur}
                              onKeyDown={handleCellKeyDown}
                            />
                          ) : (
                            <span className={`cell-value ${!canEdit ? 'locked' : ''}`}>
                              {Utils.formatNumber(monthData.cyQty || 0)}
                              {!canEdit && <i className="fas fa-lock lock-icon-small"></i>}
                            </span>
                          )}
                        </div>
                      );
                    })}
                    <div className="total-cell">
                      {Utils.formatNumber(calculateYearlyTotal(product.id, 'CY'))}
                    </div>
                    <div className="growth-cell">
                      {(() => {
                        const growth = calculateGrowth(product.id);
                        return <span className={`growth-value ${growth >= 0 ? 'positive' : 'negative'}`}>{Utils.formatGrowth(growth)}</span>;
                      })()}
                    </div>
                  </div>

                  <div className="product-row ly-row">
                    <div className="product-name-cell">
                      <span className="year-label ly">LY</span>
                    </div>
                    {MONTHS.map(month => {
                      const monthData = product.monthlyTargets?.[month] || {};
                      return (
                        <div key={month} className="month-cell ly-value">
                          {Utils.formatNumber(monthData.lyQty || 0)}
                        </div>
                      );
                    })}
                    <div className="total-cell ly-value">
                      {Utils.formatNumber(calculateYearlyTotal(product.id, 'LY'))}
                    </div>
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

  return (
    <div className="target-entry-container" ref={gridRef}>
      {/* Grid Header */}
      <div className="grid-header">
        <div className="grid-title">
          <h2><i className="fas fa-table"></i> Monthly Target Entry</h2>
          <span className="fiscal-year">FY {fiscalYear}</span>
          <div className="header-stats">
            <span className="header-stat draft"><i className="fas fa-edit"></i> {statusCounts.draft} Draft</span>
            <span className="header-stat submitted"><i className="fas fa-clock"></i> {statusCounts.submitted} Pending</span>
            <span className="header-stat approved"><i className="fas fa-check-circle"></i> {statusCounts.approved} Approved</span>
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

      {/* ============================================================= */}
      {/* Overall Target Summary Bar — VALUE-BASED (v2.5.0)              */}
      {/* Card 1: Target Value (FY) — Fixed from TBM                    */}
      {/* Card 2: Current Year Value — Live running total                */}
      {/* Card 3: Last Year Value — Reference                            */}
      {/* ============================================================= */}
      <div className="overall-target-bar">
        <div className="otb-main-section">

          {/* Card 1: Target Value (FY) — Fixed target assigned by TBM */}
          <div className="otb-card otb-yearly-target">
            <div className="otb-card-icon">
              <i className="fas fa-flag-checkered"></i>
            </div>
            <div className="otb-card-content">
              <span className="otb-card-label">Target Value (FY {fiscalYear})</span>
              <span className="otb-card-value">
                {overallTargetSummary.yearlyTargetValue 
                  ? Utils.formatShortCurrency(overallTargetSummary.yearlyTargetValue) 
                  : <span className="otb-not-set">Not Set</span>
                }
              </span>
              <span className="otb-card-sub">Fixed Yearly Target from TBM</span>
            </div>
          </div>

          {/* Divider with arrow */}
          <div className="otb-divider">
            <div className="otb-divider-line"></div>
            <i className="fas fa-arrow-right otb-divider-arrow"></i>
            <div className="otb-divider-line"></div>
          </div>

          {/* Card 2: Current Year Value — Live running total */}
          <div className="otb-card otb-current-value">
            <div className="otb-card-icon current">
              <i className="fas fa-chart-line"></i>
            </div>
            <div className="otb-card-content">
              <span className="otb-card-label">Current Year Value</span>
              <span className="otb-card-value live">
                {Utils.formatShortCurrency(overallTargetSummary.totalCyRev)}
                <span className={`otb-growth-badge ${overallTargetSummary.revGrowth >= 0 ? 'positive' : 'negative'}`}>
                  <i className={`fas fa-arrow-${overallTargetSummary.revGrowth >= 0 ? 'up' : 'down'}`}></i>
                  {Math.abs(overallTargetSummary.revGrowth).toFixed(1)}%
                </span>
              </span>
              <span className="otb-card-sub">
                vs Last Year • Live Running Total
              </span>
            </div>
          </div>

          {/* Divider with arrow */}
          <div className="otb-divider">
            <div className="otb-divider-line"></div>
            <i className="fas fa-arrow-right otb-divider-arrow"></i>
            <div className="otb-divider-line"></div>
          </div>

          {/* Card 3: Last Year Value — Reference */}
          <div className="otb-card otb-ly-value">
            <div className="otb-card-icon ly">
              <i className="fas fa-history"></i>
            </div>
            <div className="otb-card-content">
              <span className="otb-card-label">Last Year Value</span>
              <span className="otb-card-value ly-value">
                {Utils.formatShortCurrency(overallTargetSummary.totalLyRev)}
              </span>
              <span className="otb-card-sub">
                FY {(() => {
                  const parts = fiscalYear.split('-');
                  return `${parseInt(parts[0]) - 1}-${parseInt(parts[1]) - 1}`;
                })()} Reference
              </span>
            </div>
          </div>
        </div>

        {/* Quarter-wise contribution chips — revenue only */}
        <div className="otb-quarter-breakdown">
          {overallTargetSummary.quarterlyBreakdown.map(q => (
            <div key={q.id} className={`otb-quarter-chip ${q.color}`}>
              <span className="otb-qchip-label">{q.label}</span>
              <span className="otb-qchip-value">{Utils.formatShortCurrency(q.cyRev)}</span>
            </div>
          ))}
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

          {/* Quarter Row with Totals */}
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
    </div>
  );
}

export default TargetEntryGrid;
