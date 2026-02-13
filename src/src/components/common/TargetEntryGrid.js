/**
 * TargetEntryGrid Component
 * Enhanced Excel-like grid for Monthly Target Entry
 * 
 * UPDATED FLOW (v3.0.0):
 * - All product-status-badge elements REMOVED
 * - All cells are always editable (no status-based locking)
 * - Sales Rep enters targets → submits to TBM
 * - TBM approves or corrects and approves (no reject cycle)
 * - No draft/submitted/approved/rejected badges shown
 * 
 * @author Appasamy Associates - Product Commitment PWA
 * @version 3.0.0 - Simplified flow, no status badges
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

function TargetEntryGrid({ 
  categories = [], 
  products = [], 
  onUpdateTarget,
  onSaveAll,
  onSubmitAll,
  userRole = 'salesrep',
  fiscalYear = '2025-26',
  overallYearlyTargetValue = null
}) {
  const [activeCell, setActiveCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(new Set(['equipment', 'iol', 'ovd']));
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  
  const inputRef = useRef(null);
  const searchInputRef = useRef(null);
  const gridRef = useRef(null);

  useEffect(() => {
    if (activeCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [activeCell]);

  // ==================== FILTERED DATA ====================

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    const term = searchTerm.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.code.toLowerCase().includes(term) ||
      (p.subcategory && p.subcategory.toLowerCase().includes(term))
    );
  }, [products, searchTerm]);

  const getSubcategories = useCallback((categoryId) => {
    const subs = [...new Set(filteredProducts.filter(p => p.categoryId === categoryId && p.subcategory).map(p => p.subcategory))];
    return subs;
  }, [filteredProducts]);

  // ==================== CALCULATIONS ====================

  const overallTargetSummary = useMemo(() => {
    let totalCyQty = 0, totalLyQty = 0, totalCyRev = 0, totalLyRev = 0;
    products.forEach(product => {
      if (product.monthlyTargets) {
        Object.values(product.monthlyTargets).forEach(m => {
          totalCyQty += m.cyQty || 0;
          totalLyQty += m.lyQty || 0;
          totalCyRev += m.cyRev || 0;
          totalLyRev += m.lyRev || 0;
        });
      }
    });
    const qtyGrowth = Utils.calcGrowth(totalLyQty, totalCyQty);
    const revGrowth = Utils.calcGrowth(totalLyRev, totalCyRev);

    const yearlyTargetValue = overallYearlyTargetValue || 0;
    const achievement = yearlyTargetValue > 0 
      ? Math.min(Math.round((totalCyRev / yearlyTargetValue) * 100), 100) 
      : 0;

    // Quarterly breakdown with month-level detail for auto-totaling display
    const quarterlyBreakdown = QUARTERS.map(q => {
      let qCyQty = 0, qCyRev = 0;
      const monthlyDetail = q.months.map(month => {
        let mCyQty = 0, mCyRev = 0;
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
      yearlyTargetValue,
      totalCyQty, totalLyQty, totalCyRev, totalLyRev,
      qtyGrowth, revGrowth, achievement, quarterlyBreakdown
    };
  }, [products, overallYearlyTargetValue]);

  const calculateCategoryTotal = useCallback((categoryId, month, year) => {
    return products.filter(p => p.categoryId === categoryId).reduce((sum, p) => {
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

  // ==================== EVENT HANDLERS ====================

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(categoryId) ? next.delete(categoryId) : next.add(categoryId);
      return next;
    });
  };

  // All cells are now always editable - no status check
  const handleCellClick = (productId, month, currentValue) => {
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
          if (product) {
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

  // ==================== REVENUE ONLY CATEGORY RENDERER ====================

  const renderRevenueOnlyCategory = (category) => {
    const isExpanded = expandedCategories.has(category.id);
    const catProducts = filteredProducts.filter(p => p.categoryId === category.id);
    const firstProduct = catProducts[0];

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
                {/* STATUS BADGE REMOVED */}
              </div>
              {MONTHS.map(month => {
                const totalValue = calculateCategoryTotal(category.id, month, 'CY');
                return (
                  <div key={month} className="month-cell editable-revenue">
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
                <div key={product.id} className="product-rows">
                  <div className="product-row cy-row">
                    <div className="product-name-cell">
                      <span className="product-name" title={product.name}>
                        {highlightMatch(product.name, searchTerm)}
                      </span>
                      <span className="product-code">{product.code}</span>
                      <span className="year-label">CY</span>
                      {/* STATUS BADGE REMOVED - no more product-status-badge */}
                    </div>
                    {MONTHS.map(month => {
                      const monthData = product.monthlyTargets?.[month] || {};
                      const isActive = activeCell?.productId === product.id && activeCell?.month === month;
                      
                      return (
                        <div 
                          key={month} 
                          className={`month-cell editable ${isActive ? 'active-cell' : ''}`}
                          onClick={() => handleCellClick(product.id, month, monthData.cyQty)}
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
                            <span className="cell-value">
                              {Utils.formatNumber(monthData.cyQty || 0)}
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
      {/* Grid Header - status counts REMOVED */}
      <div className="grid-header">
        <div className="grid-title">
          <h2><i className="fas fa-table"></i> Monthly Target Entry</h2>
          <span className="fiscal-year">FY {fiscalYear}</span>
        </div>
        <div className="grid-actions">
          {lastSaved && (
            <span className="last-saved">
              <i className="fas fa-check-circle"></i> Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <button className="action-btn save" onClick={handleSaveAll} disabled={isLoading}>
            {isLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
            Save
          </button>
          <button 
            className="action-btn submit" 
            onClick={handleSubmitAll}
            disabled={isLoading}
          >
            {isLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
            Submit to TBM
          </button>
        </div>
      </div>

      {/* Overall Target Summary Bar */}
      <div className="overall-target-bar">
        <div className="otb-main-section">
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

          <div className="otb-divider">
            <div className="otb-divider-line"></div>
            <i className="fas fa-arrow-right otb-divider-arrow"></i>
            <div className="otb-divider-line"></div>
          </div>

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
                  {Utils.formatGrowth(overallTargetSummary.revGrowth)}
                </span>
              </span>
              <span className="otb-card-sub">Live Running Total</span>
            </div>
          </div>

          <div className="otb-divider">
            <div className="otb-divider-line"></div>
            <i className="fas fa-arrow-right otb-divider-arrow"></i>
            <div className="otb-divider-line"></div>
          </div>

          <div className="otb-card otb-last-year">
            <div className="otb-card-icon ly">
              <i className="fas fa-history"></i>
            </div>
            <div className="otb-card-content">
              <span className="otb-card-label">Last Year Value</span>
              <span className="otb-card-value">{Utils.formatShortCurrency(overallTargetSummary.totalLyRev)}</span>
              <span className="otb-card-sub">Reference</span>
            </div>
          </div>
        </div>

        {overallYearlyTargetValue && (
          <div className="otb-progress-section">
            <div className="otb-progress-bar-wrapper">
              <div className="otb-progress-fill" style={{ width: `${overallTargetSummary.achievement}%` }}></div>
            </div>
            <div className="otb-progress-stats">
              <span>{Math.round(overallTargetSummary.achievement)}% of FY Target</span>
            </div>
          </div>
        )}

        {/* Quarter-wise contribution chips — qty + revenue */}
        <div className="otb-quarter-breakdown">
          {overallTargetSummary.quarterlyBreakdown.map(q => (
            <div key={q.id} className={`otb-quarter-chip ${q.color}`}>
              <span className="otb-qchip-label">{q.label}</span>
              <span className="otb-qchip-value">{Utils.formatNumber(q.cyQty)}</span>
              <span className="otb-qchip-rev">{Utils.formatShortCurrency(q.cyRev)}</span>
            </div>
          ))}
        </div>

        {/* Month-wise breakdown row — auto-totals from cell values */}
        <div className="otb-month-breakdown">
          {overallTargetSummary.quarterlyBreakdown.map(q => (
            <div key={q.id} className={`otb-month-group ${q.color}`}>
              {q.monthlyDetail.map(m => (
                <div key={m.month} className="otb-month-item">
                  <span className="otb-month-label">{MONTH_LABEL_MAP[m.month]}</span>
                  <span className="otb-month-qty">{Utils.formatNumber(m.cyQty)}</span>
                  <span className="otb-month-rev">{Utils.formatShortCurrency(m.cyRev)}</span>
                </div>
              ))}
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
            placeholder="Search products, codes, or categories..."
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
        <span className="product-count">{filteredProducts.length} products</span>
      </div>

      {/* Grid */}
      <div className="excel-grid">
        {/* Header Row */}
        <div className="grid-header-row">
          <div className="header-cell product-header">Product / CY Target</div>
          {MONTH_LABELS.map((label, idx) => (
            <div key={label} className={`header-cell month-header ${idx < 3 ? 'q1' : idx < 6 ? 'q2' : idx < 9 ? 'q3' : 'q4'}`}>
              {label}
            </div>
          ))}
          <div className="header-cell total-header">TOTAL</div>
          <div className="header-cell growth-header">YoY</div>
        </div>

        {/* Categories */}
        {categories.map(category =>
          category.isRevenueOnly
            ? renderRevenueOnlyCategory(category)
            : renderProductCategory(category)
        )}

        {filteredProducts.length === 0 && searchTerm && (
          <div className="no-results">
            <i className="fas fa-search" style={{fontSize: '1.5rem', opacity: 0.3}}></i>
            <p>No products matching "{searchTerm}"</p>
            <button className="clear-search-btn" onClick={clearSearch}>Clear Search</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TargetEntryGrid;
