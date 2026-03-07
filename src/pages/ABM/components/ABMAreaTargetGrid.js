/**
 * ABMAreaTargetGrid Component (TBM's "Area Target" Tab)
 *
 * FULL STANDALONE replica of the Sales Rep TargetEntryGrid for TBM's "Area Target" tab.
 * Reuses existing 'tgt-' CSS classes from tbmTerritoryTargetGrid.css — same grid layout,
 * only labels/branding differ (Area instead of Territory, Submit to ABM).
 *
 * REPLACES the old simple wrapper that just imported TargetEntryGrid.
 * Now fully standalone with its own state — API-ready for later integration.
 *
 * FLOW: TBM enters area targets → Save Draft → Submit to ABM → ABM approves
 *
 * FILE PATH: src/pages/TBM/components/ABMAreaTargetGrid.js
 * CSS PATH:  src/styles/tbm/tbmTerritoryTargetGrid.css (reuses tgt-* classes)
 *
 * USED BY: TBM Dashboard → "Area Target" tab
 *   {activeTab==='targets' && <ABMAreaTargetGrid ... />}
 *
 * @author Appasamy Associates - Product Commitment PWA
 * PART 3 — Item 12: Month-wise entry replaced with value-wise yearly entry.
 *   ABM profiles do not require monthly targets; yearly totals + value shown.
 * @version 3.0.0 — Part 3 Item 12
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Utils } from '../../../utils/helpers';
import '../../../styles/tbm/tbmTerritoryTargetGrid.css';

// ==================== CONSTANTS ====================
const MONTHS = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];
const MONTH_LABELS = ['APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR'];

const QUARTERS = [
  { id: 'Q1', label: 'Q1', fullLabel: 'Q1 (Apr-Jun)', months: ['apr', 'may', 'jun'], color: 'q1' },
  { id: 'Q2', label: 'Q2', fullLabel: 'Q2 (Jul-Sep)', months: ['jul', 'aug', 'sep'], color: 'q2' },
  { id: 'Q3', label: 'Q3', fullLabel: 'Q3 (Oct-Dec)', months: ['oct', 'nov', 'dec'], color: 'q3' },
  { id: 'Q4', label: 'Q4', fullLabel: 'Q4 (Jan-Mar)', months: ['jan', 'feb', 'mar'], color: 'q4' }
];

const REVENUE_ONLY_CATEGORIES = ['mis', 'others'];

// ==================== COMPONENT ====================

function ABMAreaTargetGrid({
  categories = [],
  products = [],
  onUpdateTarget,
  onSaveAll,
  onSubmitAll,
  fiscalYear = '2026-27',
  overallYearlyTargetValue = null,
  areaName = 'South Chennai Area'
}) {
  // ==================== STATE ====================
  const [activeCell, setActiveCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(new Set(['equipment', 'iol', 'ovd']));
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  // PART 3 — Item 12: yearly entry mode
  const [yearlyEditId, setYearlyEditId] = useState(null);
  const [yearlyEditValue, setYearlyEditValue] = useState('');
  const canEdit = true;

  // ==================== REFS ====================
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

  // ==================== FILTERED DATA ====================

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    const term = searchTerm.toLowerCase();
    return products.filter(p =>
      p.name?.toLowerCase().includes(term) ||
      p.code?.toLowerCase().includes(term) ||
      p.subcategory?.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  // ==================== CALCULATIONS ====================

  const calculateYearlyTotal = useCallback((productId, type = 'CY') => {
    const product = products.find(p => p.id === productId);
    if (!product) return 0;
    return MONTHS.reduce((sum, month) => {
      const md = product.monthlyTargets?.[month] || {};
      return sum + (type === 'CY' ? (md.cyQty || 0) : (md.lyQty || 0));
    }, 0);
  }, [products]);

  const calculateGrowth = useCallback((productId) => {
    const cy = calculateYearlyTotal(productId, 'CY');
    const ly = calculateYearlyTotal(productId, 'LY');
    return Utils.calcGrowth(ly, cy);
  }, [calculateYearlyTotal]);

  const calculateCategoryTotal = useCallback((categoryId, type = 'CY') => {
    return products
      .filter(p => p.categoryId === categoryId)
      .reduce((sum, p) => sum + MONTHS.reduce((ms, m) => {
        const md = p.monthlyTargets?.[m] || {};
        return ms + (type === 'CY' ? (md.cyQty || 0) : (md.lyQty || 0));
      }, 0), 0);
  }, [products]);

  const calculateCategoryMonthTotal = useCallback((categoryId, month, type = 'CY') => {
    return products
      .filter(p => p.categoryId === categoryId)
      .reduce((sum, p) => {
        const md = p.monthlyTargets?.[month] || {};
        return sum + (type === 'CY' ? (md.cyQty || 0) : (md.lyQty || 0));
      }, 0);
  }, [products]);

  // Overall target summary bar data
  const overallTargetSummary = useMemo(() => {
    let totalCyRev = 0, totalLyRev = 0, totalCyQty = 0;
    products.forEach(product => {
      MONTHS.forEach(month => {
        const md = product.monthlyTargets?.[month] || {};
        totalCyRev += md.cyRev || 0;
        totalLyRev += md.lyRev || 0;
        totalCyQty += md.cyQty || 0;
      });
    });
    const revGrowth = totalLyRev > 0 ? ((totalCyRev - totalLyRev) / totalLyRev * 100) : 0;
    const completionPercent = overallYearlyTargetValue
      ? Math.min(Math.round((totalCyRev / overallYearlyTargetValue) * 100), 100)
      : 0;
    return { totalCyRev, totalLyRev, totalCyQty, revGrowth, completionPercent };
  }, [products, overallYearlyTargetValue]);

  // Monthly totals for footer
  const monthlyTotals = useMemo(() => {
    const totals = {};
    MONTHS.forEach(month => {
      totals[month] = products.reduce((sum, p) => sum + (p.monthlyTargets?.[month]?.cyQty || 0), 0);
    });
    totals.yearly = Object.values(totals).reduce((a, b) => a + b, 0);
    return totals;
  }, [products]);

  // ==================== EVENT HANDLERS ====================

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(categoryId) ? next.delete(categoryId) : next.add(categoryId);
      return next;
    });
  };

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

  // PART 3 — Item 12: Yearly qty handlers
  const handleYearlyQtyChange = useCallback((productId, yearlyQty) => {
    const qty = parseInt(String(yearlyQty).replace(/[^0-9]/g, ''), 10) || 0;
    const perMonth = Math.floor(qty / 12);
    const remainder = qty - (perMonth * 12);
    MONTHS.forEach((m, i) => {
      if (onUpdateTarget) onUpdateTarget(productId, m, i === 11 ? perMonth + remainder : perMonth);
    });
    setYearlyEditId(null);
  }, [onUpdateTarget]);

  const handleYearlyQtyClick = useCallback((productId, currentQty) => {
    setYearlyEditId(productId);
    setYearlyEditValue(String(currentQty || 0));
  }, []);

  const handleYearlyQtyBlur = useCallback((productId) => {
    handleYearlyQtyChange(productId, yearlyEditValue);
  }, [handleYearlyQtyChange, yearlyEditValue]);

  const handleYearlyQtyKeyDown = useCallback((e, productId) => {
    if (e.key === 'Enter') handleYearlyQtyChange(productId, yearlyEditValue);
    if (e.key === 'Escape') setYearlyEditId(null);
  }, [handleYearlyQtyChange, yearlyEditValue]);

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
      regex.test(part) ? <mark key={i} className="tgt-search-highlight">{part}</mark> : part
    );
  };

  const getCategoryIcon = (catId) => {
    const icons = {
      equipment: 'fa-microscope', iol: 'fa-eye', ovd: 'fa-tint',
      pharma: 'fa-pills', sutures: 'fa-band-aid', mis: 'fa-file-invoice-dollar',
      others: 'fa-ellipsis-h'
    };
    return icons[catId] || 'fa-box';
  };

  // ==================== REVENUE ONLY CATEGORY RENDERER ====================

  const renderRevenueOnlyCategory = (category) => {
    const isExpanded = expandedCategories.has(category.id);
    const catProducts = filteredProducts.filter(p => p.categoryId === category.id);
    const firstProduct = catProducts[0];

    if (catProducts.length === 0 && searchTerm) return null;

    return (
      <div key={category.id} className="tgt-category-section tgt-revenue-only-section">
        <div className="tgt-category-header-row" onClick={() => toggleCategory(category.id)}>
          <div className="tgt-category-name-cell">
            <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'} tgt-chevron-icon`}></i>
            <div className={`tgt-category-icon ${category.id}`}>
              <i className={`fas ${getCategoryIcon(category.id)}`}></i>
            </div>
            <div className="tgt-category-info">
              <span className="tgt-category-label">{category.name}</span>
              <span className="tgt-category-badge revenue-only">Revenue Only</span>
            </div>
          </div>
          {MONTHS.map(month => (
            <div key={month} className="tgt-month-cell tgt-category-total-cell">&mdash;</div>
          ))}
          <div className="tgt-total-cell tgt-category-total-cell">&mdash;</div>
          <div className="tgt-growth-cell">&mdash;</div>
        </div>

        {isExpanded && firstProduct && (
          <div className="tgt-products-container">
            <div className="tgt-product-rows">
              {/* CY Revenue Row */}
              <div className="tgt-product-row tgt-cy-row">
                <div className="tgt-product-name-cell">
                  <span className="tgt-year-label tgt-cy">CY Revenue</span>
                </div>
                {MONTHS.map(month => {
                  const monthData = firstProduct.monthlyTargets?.[month] || {};
                  const isActive = activeCell?.productId === firstProduct.id && activeCell?.month === month;
                  return (
                    <div
                      key={month}
                      className={`tgt-month-cell tgt-editable ${isActive ? 'tgt-active-cell' : ''}`}
                      onClick={() => handleCellClick(firstProduct.id, month, monthData.cyRev)}
                    >
                      {isActive ? (
                        <input
                          ref={inputRef}
                          type="text"
                          className="tgt-cell-input"
                          value={editValue}
                          onChange={handleCellChange}
                          onBlur={handleCellBlur}
                          onKeyDown={handleCellKeyDown}
                        />
                      ) : (
                        <span className="tgt-cell-value">
                          {Utils.formatCompact ? `₹${Utils.formatCompact(monthData.cyRev || 0)}` : (monthData.cyRev || 0)}
                        </span>
                      )}
                    </div>
                  );
                })}
                <div className="tgt-total-cell">
                  ₹{Utils.formatCompact ? Utils.formatCompact(MONTHS.reduce((s, m) => s + (firstProduct.monthlyTargets?.[m]?.cyRev || 0), 0)) : 0}
                </div>
                <div className="tgt-growth-cell">&mdash;</div>
              </div>

              {/* LY Revenue Row */}
              <div className="tgt-product-row tgt-ly-row">
                <div className="tgt-product-name-cell">
                  <span className="tgt-year-label tgt-ly">LY Revenue</span>
                </div>
                {MONTHS.map(month => {
                  const monthData = firstProduct.monthlyTargets?.[month] || {};
                  return (
                    <div key={month} className="tgt-month-cell tgt-readonly-cell">
                      <span className="tgt-cell-value tgt-ly-value">
                        {Utils.formatCompact ? `₹${Utils.formatCompact(monthData.lyRev || 0)}` : (monthData.lyRev || 0)}
                      </span>
                    </div>
                  );
                })}
                <div className="tgt-total-cell tgt-ly-total">
                  ₹{Utils.formatCompact ? Utils.formatCompact(MONTHS.reduce((s, m) => s + (firstProduct.monthlyTargets?.[m]?.lyRev || 0), 0)) : 0}
                </div>
                <div className="tgt-growth-cell"></div>
              </div>

              {/* AOP Revenue Row — Read Only */}
              <div className="tgt-product-row tgt-aop-row">
                <div className="tgt-product-name-cell">
                  <span className="tgt-year-label tgt-aop">AOP Rev</span>
                </div>
                {MONTHS.map(month => {
                  const monthData = firstProduct.monthlyTargets?.[month] || {};
                  return (
                    <div key={month} className="tgt-month-cell tgt-readonly-cell">
                      <span className="tgt-cell-value tgt-aop-value">
                        {Utils.formatCompact ? `₹${Utils.formatCompact(monthData.aopRev || 0)}` : (monthData.aopRev || 0)}
                      </span>
                    </div>
                  );
                })}
                <div className="tgt-total-cell tgt-aop-total">
                  ₹{Utils.formatCompact ? Utils.formatCompact(MONTHS.reduce((s, m) => s + (firstProduct.monthlyTargets?.[m]?.aopRev || 0), 0)) : 0}
                </div>
                <div className="tgt-growth-cell">&mdash;</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ==================== CATEGORY RENDERER ====================

  function renderCategory(category) {
    const isExpanded = expandedCategories.has(category.id);
    const catProducts = filteredProducts.filter(p => p.categoryId === category.id);
    const categoryCYTotal = calculateCategoryTotal(category.id, 'CY');
    const categoryLYTotal = calculateCategoryTotal(category.id, 'LY');
    const categoryGrowth = Utils.calcGrowth(categoryLYTotal, categoryCYTotal);

    if (catProducts.length === 0 && searchTerm) return null;

    return (
      <div key={category.id} className="tgt-category-section">
        {/* Category Header */}
        <div className="tgt-category-header-row" onClick={() => toggleCategory(category.id)}>
          <div className="tgt-category-name-cell">
            <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'} tgt-chevron-icon`}></i>
            <div className={`tgt-category-icon ${category.id}`}>
              <i className={`fas ${getCategoryIcon(category.id)}`}></i>
            </div>
            <div className="tgt-category-info">
              <span className="tgt-category-label">{category.name}</span>
              <span className="tgt-category-count">{catProducts.length} products</span>
            </div>
          </div>

          {/* Category Month Totals */}
          {MONTHS.map(month => (
            <div key={month} className="tgt-month-cell tgt-category-total-cell">
              {Utils.formatNumber(calculateCategoryMonthTotal(category.id, month, 'CY'))}
            </div>
          ))}
          <div className="tgt-total-cell tgt-category-total-cell">
            {Utils.formatNumber(categoryCYTotal)}
          </div>
          <div className="tgt-growth-cell">
            <span className={`tgt-growth-value ${categoryGrowth >= 0 ? 'tgt-positive' : 'tgt-negative'}`}>
              {Utils.formatGrowth(categoryGrowth)}
            </span>
          </div>
        </div>

        {/* Expanded Product Rows */}
        {isExpanded && (
          <div className="tgt-products-container">
            {catProducts.map(product => (
              <div key={product.id} className="tgt-product-rows">
                {/* CY Row — Editable */}
                <div className="tgt-product-row tgt-cy-row">
                  <div className="tgt-product-name-cell">
                    <div className="tgt-product-info">
                      <span className="tgt-product-name">{highlightMatch(product.name, searchTerm)}</span>
                      <span className="tgt-product-code">{highlightMatch(product.code || '', searchTerm)}</span>
                    </div>
                    <span className="tgt-year-label tgt-cy">CY</span>
                  </div>

                  {MONTHS.map(month => {
                    const monthData = product.monthlyTargets?.[month] || {};
                    const isActive = activeCell?.productId === product.id && activeCell?.month === month;

                    return (
                      <div
                        key={month}
                        className={`tgt-month-cell tgt-editable ${isActive ? 'tgt-active-cell' : ''}`}
                        onClick={() => handleCellClick(product.id, month, monthData.cyQty)}
                      >
                        {isActive ? (
                          <input
                            ref={inputRef}
                            type="text"
                            className="tgt-cell-input"
                            value={editValue}
                            onChange={handleCellChange}
                            onBlur={handleCellBlur}
                            onKeyDown={handleCellKeyDown}
                          />
                        ) : (
                          <span className="tgt-cell-value">
                            {Utils.formatNumber(monthData.cyQty || 0)}
                          </span>
                        )}
                      </div>
                    );
                  })}

                  <div className="tgt-total-cell">
                    {Utils.formatNumber(calculateYearlyTotal(product.id, 'CY'))}
                  </div>
                  <div className="tgt-growth-cell">
                    {(() => {
                      const growth = calculateGrowth(product.id);
                      return (
                        <span className={`tgt-growth-value ${growth >= 0 ? 'tgt-positive' : 'tgt-negative'}`}>
                          {Utils.formatGrowth(growth)}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {/* LY Row — Read Only */}
                <div className="tgt-product-row tgt-ly-row">
                  <div className="tgt-product-name-cell">
                    <span className="tgt-year-label tgt-ly">LY</span>
                  </div>
                  {MONTHS.map(month => {
                    const monthData = product.monthlyTargets?.[month] || {};
                    return (
                      <div key={month} className="tgt-month-cell tgt-readonly-cell">
                        <span className="tgt-cell-value tgt-ly-value">
                          {Utils.formatNumber(monthData.lyQty || 0)}
                        </span>
                      </div>
                    );
                  })}
                  <div className="tgt-total-cell tgt-ly-total">
                    {Utils.formatNumber(calculateYearlyTotal(product.id, 'LY'))}
                  </div>
                  <div className="tgt-growth-cell"></div>
                </div>

                {/* AOP Row — Read Only (Annual Operating Plan) */}
                <div className="tgt-product-row tgt-aop-row">
                  <div className="tgt-product-name-cell">
                    <span className="tgt-year-label tgt-aop">AOP</span>
                  </div>
                  {MONTHS.map(month => {
                    const monthData = product.monthlyTargets?.[month] || {};
                    return (
                      <div key={month} className="tgt-month-cell tgt-readonly-cell">
                        <span className="tgt-cell-value tgt-aop-value">
                          {Utils.formatNumber(monthData.aopQty || 0)}
                        </span>
                      </div>
                    );
                  })}
                  <div className="tgt-total-cell tgt-aop-total">
                    {Utils.formatNumber(
                      MONTHS.reduce((s, m) => s + (product.monthlyTargets?.[m]?.aopQty || 0), 0)
                    )}
                  </div>
                  <div className="tgt-growth-cell">
                    {(() => {
                      const aopT = MONTHS.reduce((s, m) => s + (product.monthlyTargets?.[m]?.aopQty || 0), 0);
                      const lyT = MONTHS.reduce((s, m) => s + (product.monthlyTargets?.[m]?.lyQty || 0), 0);
                      if (lyT === 0 && aopT === 0) return '';
                      const g = Utils.calcGrowth(lyT, aopT);
                      return <span className={`tgt-growth-value ${g >= 0 ? 'tgt-positive' : 'tgt-negative'}`}>{Utils.formatGrowth(g)}</span>;
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ==================== MAIN RENDER ====================

  return (
    <div className="tgt-territory-container" ref={gridRef}>

      {/* ===== AREA HEADER ===== */}
      <div className="tgt-grid-header">
        <div className="tgt-grid-title">
          <div className="tgt-title-left">
            <div className="tgt-territory-icon">
              <i className="fas fa-map-marked-alt"></i>
            </div>
            <div>
              <h2><i className="fas fa-table"></i> Area Target Entry</h2>
              <span className="tgt-territory-name">{areaName}</span>
            </div>
          </div>
          <span className="tgt-fiscal-year">FY {fiscalYear}</span>
        </div>

        {/* Area Info Banner */}
        <div className="tgt-info-banner">
          <i className="fas fa-info-circle"></i>
          <span>
            Enter your <strong>area-level</strong> monthly targets below.
            These represent the combined target for your area.
            Once submitted, targets go to <strong>ABM</strong> for approval.
          </span>
        </div>

        <div className="tgt-grid-actions">
          {lastSaved && (
            <span className="tgt-last-saved">
              <i className="fas fa-check-circle"></i> Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <button className="tgt-action-btn tgt-save" onClick={handleSaveAll} disabled={isLoading}>
            {isLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
            Save Draft
          </button>
          <button
            className="tgt-action-btn tgt-submit"
            onClick={handleSubmitAll}
            disabled={isLoading}
          >
            {isLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
            Submit to ABM
          </button>
        </div>
      </div>

      {/* ===== OVERALL AREA TARGET SUMMARY BAR ===== */}
      <div className="tgt-overall-target-bar">
        <div className="tgt-otb-main-section">
          {/* Yearly Target Card */}
          <div className="tgt-otb-card tgt-otb-yearly-target">
            <div className="tgt-otb-card-icon">
              <i className="fas fa-flag-checkered"></i>
            </div>
            <div className="tgt-otb-card-content">
              <span className="tgt-otb-card-label">Area Target (FY {fiscalYear})</span>
              <span className="tgt-otb-card-value">
                {overallYearlyTargetValue
                  ? `₹${Utils.formatShortCurrency ? Utils.formatShortCurrency(overallYearlyTargetValue) : Utils.formatCompact(overallYearlyTargetValue)}`
                  : 'Not Set'
                }
              </span>
            </div>
          </div>

          {/* Committed Value */}
          <div className="tgt-otb-card tgt-otb-committed">
            <div className="tgt-otb-card-icon tgt-committed-icon">
              <i className="fas fa-hand-holding-usd"></i>
            </div>
            <div className="tgt-otb-card-content">
              <span className="tgt-otb-card-label">Committed Value</span>
              <span className="tgt-otb-card-value">
                ₹{Utils.formatShortCurrency
                  ? Utils.formatShortCurrency(overallTargetSummary.totalCyRev)
                  : Utils.formatCompact
                    ? Utils.formatCompact(overallTargetSummary.totalCyRev)
                    : overallTargetSummary.totalCyRev.toLocaleString()
                }
              </span>
            </div>
          </div>

          {/* Total Units */}
          <div className="tgt-otb-card tgt-otb-qty">
            <div className="tgt-otb-card-icon tgt-qty-icon">
              <i className="fas fa-boxes"></i>
            </div>
            <div className="tgt-otb-card-content">
              <span className="tgt-otb-card-label">Total Units</span>
              <span className="tgt-otb-card-value">{Utils.formatNumber(overallTargetSummary.totalCyQty)}</span>
            </div>
          </div>

          {/* Revenue Growth */}
          <div className="tgt-otb-card tgt-otb-growth">
            <div className="tgt-otb-card-icon tgt-growth-icon">
              <i className="fas fa-chart-line"></i>
            </div>
            <div className="tgt-otb-card-content">
              <span className="tgt-otb-card-label">Revenue Growth</span>
              <span className={`tgt-otb-card-value ${overallTargetSummary.revGrowth >= 0 ? 'positive' : 'negative'}`}>
                {overallTargetSummary.revGrowth >= 0 ? '↑' : '↓'}{Utils.formatGrowth(overallTargetSummary.revGrowth)}
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar — only if yearly target value is set */}
        {overallYearlyTargetValue && (
          <div className="tgt-otb-progress-section">
            <div className="tgt-otb-progress-header">
              <span>Area Completion</span>
              <span className="tgt-otb-progress-percent">{overallTargetSummary.completionPercent}%</span>
            </div>
            <div className="tgt-otb-progress-bar">
              <div className="tgt-otb-progress-fill" style={{ width: `${overallTargetSummary.completionPercent}%` }}></div>
            </div>
          </div>
        )}
      </div>

      {/* ===== SEARCH BAR ===== */}
      <div className="tgt-grid-search-bar">
        <div className="tgt-search-input-wrapper">
          <i className="fas fa-search tgt-search-icon"></i>
          <input
            ref={searchInputRef}
            type="text"
            className="tgt-grid-search-input"
            placeholder="Search products, codes, or categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="tgt-search-clear-btn" onClick={() => setSearchTerm('')}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
        <span className="tgt-product-count">{filteredProducts.length} products</span>
      </div>

      {/* ===== PART 3 — Item 12: VALUE-WISE YEARLY GRID ===== */}
      {/* ABM profile: no monthly entry required — enter yearly qty, value shown automatically */}
      <div className="tgt-value-grid">
        <div className="tgt-value-totals-bar">
          <span className="tgt-value-totals-label"><i className="fas fa-calculator"></i> Area Totals</span>
          <div className="tgt-value-totals-pills">
            <span className="tgt-vt-pill tgt-vt-cy-qty">
              <i className="fas fa-boxes"></i> CY Qty: <strong>{Utils.formatNumber(yearlyTotals.totalCYQty)}</strong>
            </span>
            <span className="tgt-vt-pill tgt-vt-ly-qty">LY Qty: {Utils.formatNumber(yearlyTotals.totalLYQty)}</span>
            <span className="tgt-vt-pill tgt-vt-cy-rev">
              <i className="fas fa-rupee-sign"></i> CY Value: <strong>₹{Utils.formatShortCurrency ? Utils.formatShortCurrency(yearlyTotals.totalCYRev) : Utils.formatCompact(yearlyTotals.totalCYRev)}</strong>
            </span>
            <span className={`tgt-vt-pill tgt-vt-growth ${Utils.calcGrowth(yearlyTotals.totalLYQty, yearlyTotals.totalCYQty) >= 0 ? 'tgt-positive' : 'tgt-negative'}`}>
              YoY: {Utils.formatGrowth(Utils.calcGrowth(yearlyTotals.totalLYQty, yearlyTotals.totalCYQty))}
            </span>
          </div>
        </div>

        <table className="tgt-yearly-table">
          <thead>
            <tr className="tgt-yearly-thead">
              <th className="tgt-yth-product">Product / Area Target</th>
              <th className="tgt-yth-ly-qty">LY Qty</th>
              <th className="tgt-yth-ly-rev">LY Rev (₹)</th>
              <th className="tgt-yth-cy-qty">CY Qty <span className="tgt-yth-editable-hint">✎ editable</span></th>
              <th className="tgt-yth-cy-rev">CY Rev (₹)</th>
              <th className="tgt-yth-growth">YoY</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(category => {
              const catProducts = filteredProducts.filter(p => p.categoryId === category.id);
              if (catProducts.length === 0) return null;
              const catCYQty = catProducts.reduce((s, p) => s + calculateYearlyTotal(p.id, 'CY'), 0);
              const catLYQty = catProducts.reduce((s, p) => s + calculateYearlyTotal(p.id, 'LY'), 0);
              const catCYRev = catProducts.reduce((s, p) =>
                s + MONTHS.reduce((ms, m) => ms + (p.monthlyTargets?.[m]?.cyRev || 0), 0), 0);
              const catLYRev = catProducts.reduce((s, p) =>
                s + MONTHS.reduce((ms, m) => ms + (p.monthlyTargets?.[m]?.lyRev || 0), 0), 0);
              const catGrowth = Utils.calcGrowth(catLYQty, catCYQty);
              return (
                <React.Fragment key={category.id}>
                  <tr className="tgt-yearly-cat-row" onClick={() => toggleCategory(category.id)}>
                    <td className="tgt-ytd-cat-name" colSpan={6}>
                      <i className={`fas fa-chevron-${expandedCategories.has(category.id) ? 'down' : 'right'} tgt-chevron-icon`}></i>
                      <span className="tgt-category-label">{category.name}</span>
                      <span className="tgt-cat-inline-stats">
                        <span>CY: {Utils.formatNumber(catCYQty)}</span>
                        <span>LY: {Utils.formatNumber(catLYQty)}</span>
                        <span className={catGrowth >= 0 ? 'tgt-positive' : 'tgt-negative'}>{Utils.formatGrowth(catGrowth)}</span>
                      </span>
                    </td>
                  </tr>
                  {expandedCategories.has(category.id) && catProducts.map(product => {
                    const cyQty  = calculateYearlyTotal(product.id, 'CY');
                    const lyQty  = calculateYearlyTotal(product.id, 'LY');
                    const cyRev  = MONTHS.reduce((s, m) => s + (product.monthlyTargets?.[m]?.cyRev || 0), 0);
                    const lyRev  = MONTHS.reduce((s, m) => s + (product.monthlyTargets?.[m]?.lyRev || 0), 0);
                    const growth = Utils.calcGrowth(lyQty, cyQty);
                    const isEditing = yearlyEditId === product.id;
                    return (
                      <tr key={product.id} className="tgt-yearly-product-row">
                        <td className="tgt-ytd-product-name">
                          <span className="tgt-product-name">{product.name}</span>
                          <span className="tgt-product-code">{product.code || ''}</span>
                        </td>
                        <td className="tgt-ytd-ly-qty">{Utils.formatNumber(lyQty)}</td>
                        <td className="tgt-ytd-ly-rev">₹{Utils.formatShortCurrency ? Utils.formatShortCurrency(lyRev) : Utils.formatCompact(lyRev)}</td>
                        <td
                          className={`tgt-ytd-cy-qty tgt-ytd-editable ${isEditing ? 'tgt-ytd-active' : ''}`}
                          onClick={() => handleYearlyQtyClick(product.id, cyQty)}
                        >
                          {isEditing ? (
                            <input
                              autoFocus
                              type="text"
                              className="tgt-yearly-input"
                              value={yearlyEditValue}
                              onChange={e => setYearlyEditValue(e.target.value)}
                              onBlur={() => handleYearlyQtyBlur(product.id)}
                              onKeyDown={e => handleYearlyQtyKeyDown(e, product.id)}
                            />
                          ) : (
                            <span className={cyQty > 0 ? 'tgt-ytd-has-value' : 'tgt-ytd-empty'}>
                              {cyQty > 0 ? Utils.formatNumber(cyQty) : '—'}
                            </span>
                          )}
                        </td>
                        <td className="tgt-ytd-cy-rev">₹{Utils.formatShortCurrency ? Utils.formatShortCurrency(cyRev) : Utils.formatCompact(cyRev)}</td>
                        <td className="tgt-ytd-growth">
                          <span className={`tgt-growth-value ${growth >= 0 ? 'tgt-positive' : 'tgt-negative'}`}>
                            {Utils.formatGrowth(growth)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ABMAreaTargetGrid;
