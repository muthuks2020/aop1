/**
 * ABMAreaTargetGrid Component
 * 
 * REPLICATED from Sales Rep TargetEntryGrid with AREA FLAVOUR.
 * This is the ABM's area-level target entry screen.
 * Uses the same Excel-like grid pattern as Sales Rep.
 * 
 * KEY DIFFERENCES FROM SALES REP GRID:
 * - Area branding (blue/indigo gradient, area icon, area labels)
 * - Submits to ZBM (not TBM) for approval
 * - Overall Area Target Bar with area-level stats
 * - Area info banner explaining the flow
 * - Uses 'abm-tgt-' CSS prefix to avoid conflicts
 * - Exclusive to ABM role
 * 
 * FLOW: ABM enters area targets → Save Draft → Submit to ZBM → ZBM approves
 * 
 * @author Appasamy Associates - Product Commitment PWA
 * @version 1.0.0
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Utils } from '../../../utils/helpers';
import '../../../styles/abm/abmAreaTargetGrid.css';

// Constants
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

function ABMAreaTargetGrid({
  categories = [],
  products = [],
  onUpdateTarget,
  onSaveAll,
  onSubmitAll,
  fiscalYear = '2026-27',
  overallYearlyTargetValue = null,
  areaName = 'Delhi NCR Area'
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
      p.productName?.toLowerCase().includes(term) ||
      p.categoryId?.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  // ==================== OVERALL TARGET SUMMARY ====================

  const overallTargetSummary = useMemo(() => {
    let totalCyQty = 0, totalLyQty = 0, totalAopQty = 0, totalCyRev = 0, totalLyRev = 0, totalAopRev = 0;
    products.forEach(p => {
      if (p.monthlyTargets) {
        Object.values(p.monthlyTargets).forEach(m => {
          totalCyQty += m.cyQty || 0;
          totalLyQty += m.lyQty || 0;
          totalAopQty += m.aopQty || 0;
          totalCyRev += m.cyRev || 0;
          totalLyRev += m.lyRev || 0;
          totalAopRev += m.aopRev || 0;
        });
      }
    });

    return {
      totalCyQty, totalLyQty, totalAopQty, totalCyRev, totalLyRev, totalAopRev,
      yearlyTargetValue: overallYearlyTargetValue,
      qtyGrowth: Utils.calcGrowth(totalLyQty, totalCyQty),
      revGrowth: Utils.calcGrowth(totalLyRev, totalCyRev),
      aopAchievementQty: totalAopQty > 0 ? ((totalCyQty / totalAopQty) * 100).toFixed(1) : 0,
      aopAchievementRev: totalAopRev > 0 ? ((totalCyRev / totalAopRev) * 100).toFixed(1) : 0,
      completionPercent: overallYearlyTargetValue
        ? Math.min(100, Math.round((totalCyRev / overallYearlyTargetValue) * 100))
        : null
    };
  }, [products, overallYearlyTargetValue]);

  // ==================== CELL HANDLERS ====================

  const handleCellClick = useCallback((productId, month, currentValue) => {
    setActiveCell({ productId, month });
    setEditValue((currentValue || 0).toString());
  }, []);

  const handleCellChange = useCallback((e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setEditValue(val);
  }, []);

  const handleCellBlur = useCallback(() => {
    if (activeCell && onUpdateTarget) {
      const numValue = parseInt(editValue) || 0;
      onUpdateTarget(activeCell.productId, activeCell.month, numValue);
    }
    setActiveCell(null);
    setEditValue('');
  }, [activeCell, editValue, onUpdateTarget]);

  const handleCellKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      if (activeCell && onUpdateTarget) {
        const numValue = parseInt(editValue) || 0;
        onUpdateTarget(activeCell.productId, activeCell.month, numValue);
      }
      // Move to next cell
      if (activeCell) {
        const currentIdx = MONTHS.indexOf(activeCell.month);
        if (currentIdx < MONTHS.length - 1) {
          const nextMonth = MONTHS[currentIdx + 1];
          const product = products.find(p => p.id === activeCell.productId);
          const nextValue = product?.monthlyTargets?.[nextMonth]?.cyQty || 0;
          setActiveCell({ productId: activeCell.productId, month: nextMonth });
          setEditValue(nextValue.toString());
        } else {
          setActiveCell(null);
          setEditValue('');
        }
      }
    } else if (e.key === 'Escape') {
      setActiveCell(null);
      setEditValue('');
    }
  }, [activeCell, editValue, onUpdateTarget, products]);

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

  // ==================== TOGGLE / SEARCH ====================

  const toggleCategory = useCallback((catId) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(catId) ? next.delete(catId) : next.add(catId);
      return next;
    });
  }, []);

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
      <div key={category.id} className="abm-tgt-category-section abm-tgt-revenue-only">
        <div className="abm-tgt-category-header" onClick={() => toggleCategory(category.id)}>
          <div className="abm-tgt-category-name">
            <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'} abm-tgt-chevron`}></i>
            <i className={`fas ${category.icon} abm-tgt-cat-icon`}></i>
            <span>{highlightMatch(category.name, searchTerm)}</span>
            <span className="abm-tgt-revenue-badge">Revenue Only</span>
          </div>
        </div>
        {isExpanded && firstProduct && (
          <div className="abm-tgt-revenue-grid">
            <div className="abm-tgt-revenue-row abm-tgt-row-header">
              <div className="abm-tgt-product-cell">Revenue Item</div>
              {MONTHS.map((month, idx) => (
                <div key={month} className={`abm-tgt-month-cell abm-tgt-header abm-tgt-${QUARTERS[Math.floor(idx / 3)].color}`}>
                  {MONTH_LABEL_MAP[month]}
                </div>
              ))}
              <div className="abm-tgt-total-cell abm-tgt-header">TOTAL</div>
              <div className="abm-tgt-growth-cell abm-tgt-header">GR%</div>
            </div>
            {/* LY Revenue Row */}
            <div className="abm-tgt-revenue-row abm-tgt-ly-row">
              <div className="abm-tgt-product-cell abm-tgt-ly-label">LY Revenue</div>
              {MONTHS.map(month => {
                const monthData = firstProduct.monthlyTargets?.[month] || {};
                return (
                  <div key={month} className="abm-tgt-month-cell abm-tgt-ly">
                    <span className="abm-tgt-cell-value">₹{Utils.formatCompact(monthData.lyRev || 0)}</span>
                  </div>
                );
              })}
              <div className="abm-tgt-total-cell">
                ₹{Utils.formatCompact(MONTHS.reduce((s, m) => s + (firstProduct.monthlyTargets?.[m]?.lyRev || 0), 0))}
              </div>
              <div className="abm-tgt-growth-cell">—</div>
            </div>
            {/* CY Revenue Row (Editable) */}
            <div className="abm-tgt-revenue-row abm-tgt-cy-row">
              <div className="abm-tgt-product-cell abm-tgt-cy-label">CY Target</div>
              {MONTHS.map(month => {
                const monthData = firstProduct.monthlyTargets?.[month] || {};
                const isActive = activeCell?.productId === firstProduct.id && activeCell?.month === month;
                return (
                  <div
                    key={month}
                    className={`abm-tgt-month-cell abm-tgt-editable ${isActive ? 'abm-tgt-active-cell' : ''}`}
                    onClick={() => handleCellClick(firstProduct.id, month, monthData.cyRev)}
                  >
                    {isActive ? (
                      <input
                        ref={inputRef}
                        type="text"
                        className="abm-tgt-cell-input"
                        value={editValue}
                        onChange={handleCellChange}
                        onBlur={handleCellBlur}
                        onKeyDown={handleCellKeyDown}
                      />
                    ) : (
                      <span className="abm-tgt-cell-value">
                        ₹{Utils.formatCompact(monthData.cyRev || 0)}
                      </span>
                    )}
                  </div>
                );
              })}
              <div className="abm-tgt-total-cell">
                ₹{Utils.formatCompact(MONTHS.reduce((s, m) => s + (firstProduct.monthlyTargets?.[m]?.cyRev || 0), 0))}
              </div>
              <div className="abm-tgt-growth-cell">—</div>
            </div>
            {/* AOP Revenue Row — Read Only */}
            <div className="abm-tgt-revenue-row abm-tgt-aop-row">
              <div className="abm-tgt-product-cell abm-tgt-aop-label">AOP Target</div>
              {MONTHS.map(month => {
                const monthData = firstProduct.monthlyTargets?.[month] || {};
                return (
                  <div key={month} className="abm-tgt-month-cell abm-tgt-aop">
                    <span className="abm-tgt-cell-value">
                      ₹{Utils.formatCompact(monthData.aopRev || 0)}
                    </span>
                  </div>
                );
              })}
              <div className="abm-tgt-total-cell abm-tgt-aop">
                ₹{Utils.formatCompact(MONTHS.reduce((s, m) => s + (firstProduct.monthlyTargets?.[m]?.aopRev || 0), 0))}
              </div>
              <div className="abm-tgt-growth-cell">—</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ==================== NORMAL CATEGORY RENDERER ====================

  const renderCategory = (category) => {
    if (REVENUE_ONLY_CATEGORIES.includes(category.id)) {
      return renderRevenueOnlyCategory(category);
    }

    const isExpanded = expandedCategories.has(category.id);
    const catProducts = filteredProducts.filter(p => p.categoryId === category.id);
    if (catProducts.length === 0 && searchTerm) return null;

    // Category totals
    let catLyQty = 0, catCyQty = 0, catAopQty = 0, catLyRev = 0, catCyRev = 0, catAopRev = 0;
    catProducts.forEach(p => {
      if (p.monthlyTargets) {
        Object.values(p.monthlyTargets).forEach(m => {
          catLyQty += m.lyQty || 0;
          catCyQty += m.cyQty || 0;
          catAopQty += m.aopQty || 0;
          catLyRev += m.lyRev || 0;
          catCyRev += m.cyRev || 0;
          catAopRev += m.aopRev || 0;
        });
      }
    });
    const catGrowth = Utils.calcGrowth(catLyQty, catCyQty);

    return (
      <div key={category.id} className="abm-tgt-category-section">
        <div className="abm-tgt-category-header" onClick={() => toggleCategory(category.id)}>
          <div className="abm-tgt-category-name">
            <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'} abm-tgt-chevron`}></i>
            <i className={`fas ${category.icon} abm-tgt-cat-icon`}></i>
            <span>{highlightMatch(category.name, searchTerm)}</span>
            <span className="abm-tgt-product-count">{catProducts.length} products</span>
          </div>
          <div className="abm-tgt-category-summary">
            <span className="abm-tgt-cat-total">CY: {Utils.formatNumber(catCyQty)} units</span>
            <span className={`abm-tgt-cat-growth ${catGrowth >= 0 ? 'positive' : 'negative'}`}>
              {catGrowth >= 0 ? '↑' : '↓'}{Utils.formatGrowth(catGrowth)}
            </span>
          </div>
        </div>

        {isExpanded && (
          <div className="abm-tgt-grid-table">
            {/* Grid Header */}
            <div className="abm-tgt-grid-row abm-tgt-grid-header-row">
              <div className="abm-tgt-product-cell abm-tgt-header">Product</div>
              <div className="abm-tgt-type-cell abm-tgt-header">Type</div>
              {MONTHS.map((month, idx) => (
                <div key={month} className={`abm-tgt-month-cell abm-tgt-header abm-tgt-${QUARTERS[Math.floor(idx / 3)].color}`}>
                  {MONTH_LABEL_MAP[month]}
                </div>
              ))}
              <div className="abm-tgt-total-cell abm-tgt-header">TOTAL</div>
              <div className="abm-tgt-growth-cell abm-tgt-header">GR%</div>
            </div>

            {/* Product Rows */}
            {catProducts.map(product => {
              let lyTotal = 0, cyTotal = 0;
              MONTHS.forEach(m => {
                lyTotal += product.monthlyTargets?.[m]?.lyQty || 0;
                cyTotal += product.monthlyTargets?.[m]?.cyQty || 0;
              });
              const growth = Utils.calcGrowth(lyTotal, cyTotal);

              return (
                <React.Fragment key={product.id}>
                  {/* LY Row */}
                  <div className="abm-tgt-grid-row abm-tgt-ly-row">
                    <div className="abm-tgt-product-cell" rowSpan="2">
                      {highlightMatch(product.productName, searchTerm)}
                    </div>
                    <div className="abm-tgt-type-cell abm-tgt-ly-label">LY</div>
                    {MONTHS.map(month => (
                      <div key={month} className="abm-tgt-month-cell abm-tgt-ly">
                        {Utils.formatNumber(product.monthlyTargets?.[month]?.lyQty || 0)}
                      </div>
                    ))}
                    <div className="abm-tgt-total-cell abm-tgt-ly">{Utils.formatNumber(lyTotal)}</div>
                    <div className="abm-tgt-growth-cell" rowSpan="2">
                      <span className={`abm-tgt-growth-badge ${growth >= 0 ? 'positive' : 'negative'}`}>
                        {growth >= 0 ? '↑' : '↓'}{Utils.formatGrowth(growth)}
                      </span>
                    </div>
                  </div>
                  {/* CY Row (Editable) */}
                  <div className="abm-tgt-grid-row abm-tgt-cy-row">
                    <div className="abm-tgt-product-cell abm-tgt-hidden-mobile"></div>
                    <div className="abm-tgt-type-cell abm-tgt-cy-label">CY</div>
                    {MONTHS.map(month => {
                      const isActive = activeCell?.productId === product.id && activeCell?.month === month;
                      const value = product.monthlyTargets?.[month]?.cyQty || 0;
                      return (
                        <div
                          key={month}
                          className={`abm-tgt-month-cell abm-tgt-editable ${isActive ? 'abm-tgt-active-cell' : ''}`}
                          onClick={() => handleCellClick(product.id, month, value)}
                        >
                          {isActive ? (
                            <input
                              ref={inputRef}
                              type="text"
                              className="abm-tgt-cell-input"
                              value={editValue}
                              onChange={handleCellChange}
                              onBlur={handleCellBlur}
                              onKeyDown={handleCellKeyDown}
                            />
                          ) : (
                            <span className="abm-tgt-cell-value">{Utils.formatNumber(value)}</span>
                          )}
                        </div>
                      );
                    })}
                    <div className="abm-tgt-total-cell abm-tgt-cy-total">{Utils.formatNumber(cyTotal)}</div>
                    <div className="abm-tgt-growth-cell abm-tgt-hidden-mobile"></div>
                  </div>
                  {/* AOP Row — Read Only (Annual Operating Plan) */}
                  <div className="abm-tgt-grid-row abm-tgt-aop-row">
                    <div className="abm-tgt-product-cell abm-tgt-hidden-mobile"></div>
                    <div className="abm-tgt-type-cell abm-tgt-aop-label">AOP</div>
                    {MONTHS.map(month => (
                      <div key={month} className="abm-tgt-month-cell abm-tgt-aop">
                        {Utils.formatNumber(product.monthlyTargets?.[month]?.aopQty || 0)}
                      </div>
                    ))}
                    <div className="abm-tgt-total-cell abm-tgt-aop">
                      {Utils.formatNumber(
                        MONTHS.reduce((s, m) => s + (product.monthlyTargets?.[m]?.aopQty || 0), 0)
                      )}
                    </div>
                    <div className="abm-tgt-growth-cell abm-tgt-hidden-mobile">
                      {(() => {
                        const aopT = MONTHS.reduce((s, m) => s + (product.monthlyTargets?.[m]?.aopQty || 0), 0);
                        const lyT = MONTHS.reduce((s, m) => s + (product.monthlyTargets?.[m]?.lyQty || 0), 0);
                        if (lyT === 0 && aopT === 0) return '—';
                        const g = Utils.calcGrowth(lyT, aopT);
                        return (
                          <span className={`abm-tgt-growth-badge ${g >= 0 ? 'positive' : 'negative'}`}>
                            {g >= 0 ? '↑' : '↓'}{Utils.formatGrowth(g)}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ==================== MAIN RENDER ====================

  return (
    <div className="abm-tgt-container" ref={gridRef}>

      {/* ===== AREA HEADER ===== */}
      <div className="abm-tgt-grid-header">
        <div className="abm-tgt-grid-title">
          <div className="abm-tgt-title-left">
            <div className="abm-tgt-area-icon">
              <i className="fas fa-map"></i>
            </div>
            <div>
              <h2><i className="fas fa-table"></i> Area Target Entry</h2>
              <span className="abm-tgt-area-name">{areaName}</span>
            </div>
          </div>
          <span className="abm-tgt-fiscal-year">FY {fiscalYear}</span>
        </div>

        {/* Area Info Banner */}
        <div className="abm-tgt-info-banner">
          <i className="fas fa-info-circle"></i>
          <span>
            Enter your <strong>area-level</strong> monthly targets below. 
            These represent the combined target for your entire area across all TBMs. 
            Once submitted, targets go to <strong>ZBM</strong> for approval.
          </span>
        </div>

        <div className="abm-tgt-grid-actions">
          {lastSaved && (
            <span className="abm-tgt-last-saved">
              <i className="fas fa-check-circle"></i> Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <button className="abm-tgt-action-btn abm-tgt-save" onClick={handleSaveAll} disabled={isLoading}>
            {isLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
            Save Draft
          </button>
          <button className="abm-tgt-action-btn abm-tgt-submit" onClick={handleSubmitAll} disabled={isLoading}>
            {isLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
            Submit to ZBM
          </button>
        </div>
      </div>

      {/* ===== OVERALL AREA TARGET SUMMARY BAR ===== */}
      <div className="abm-tgt-overall-bar">
        <div className="abm-tgt-otb-main">
          <div className="abm-tgt-otb-card abm-tgt-otb-yearly">
            <div className="abm-tgt-otb-icon"><i className="fas fa-flag-checkered"></i></div>
            <div className="abm-tgt-otb-content">
              <span className="abm-tgt-otb-label">Area Target (FY {fiscalYear})</span>
              <span className="abm-tgt-otb-value">
                {overallTargetSummary.yearlyTargetValue
                  ? `₹${Utils.formatShortCurrency ? Utils.formatShortCurrency(overallTargetSummary.yearlyTargetValue) : Utils.formatCompact(overallTargetSummary.yearlyTargetValue)}`
                  : 'Not Set'}
              </span>
            </div>
          </div>
          <div className="abm-tgt-otb-card abm-tgt-otb-committed">
            <div className="abm-tgt-otb-icon abm-tgt-committed-icon"><i className="fas fa-hand-holding-usd"></i></div>
            <div className="abm-tgt-otb-content">
              <span className="abm-tgt-otb-label">Committed Value</span>
              <span className="abm-tgt-otb-value">
                ₹{Utils.formatShortCurrency ? Utils.formatShortCurrency(overallTargetSummary.totalCyRev) : Utils.formatCompact(overallTargetSummary.totalCyRev)}
              </span>
            </div>
          </div>
          <div className="abm-tgt-otb-card abm-tgt-otb-qty">
            <div className="abm-tgt-otb-icon abm-tgt-qty-icon"><i className="fas fa-boxes"></i></div>
            <div className="abm-tgt-otb-content">
              <span className="abm-tgt-otb-label">Total Units</span>
              <span className="abm-tgt-otb-value">{Utils.formatNumber(overallTargetSummary.totalCyQty)}</span>
            </div>
          </div>
          <div className="abm-tgt-otb-card abm-tgt-otb-growth">
            <div className="abm-tgt-otb-icon abm-tgt-growth-icon"><i className="fas fa-chart-line"></i></div>
            <div className="abm-tgt-otb-content">
              <span className="abm-tgt-otb-label">Revenue Growth</span>
              <span className={`abm-tgt-otb-value ${overallTargetSummary.revGrowth >= 0 ? 'positive' : 'negative'}`}>
                {overallTargetSummary.revGrowth >= 0 ? '↑' : '↓'}{Utils.formatGrowth(overallTargetSummary.revGrowth)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== SEARCH BAR ===== */}
      <div className="abm-tgt-search-bar">
        <div className="abm-tgt-search-input-wrapper">
          <i className="fas fa-search"></i>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="abm-tgt-search-input"
          />
          {searchTerm && (
            <button className="abm-tgt-search-clear" onClick={() => setSearchTerm('')}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
        <span className="abm-tgt-product-counter">
          {filteredProducts.length} of {products.length} products
        </span>
      </div>

      {/* ===== CATEGORY GRIDS ===== */}
      <div className="abm-tgt-categories">
        {categories.map(category => renderCategory(category))}
      </div>
    </div>
  );
}

export default ABMAreaTargetGrid;
