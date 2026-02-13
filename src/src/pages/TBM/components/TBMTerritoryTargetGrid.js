/**
 * TBMTerritoryTargetGrid Component
 * 
 * REPLICATED from Sales Rep TargetEntryGrid with TERRITORY FLAVOUR.
 * This is the TBM's territory-level target entry screen.
 * 
 * KEY DIFFERENCES FROM SALES REP GRID:
 * - Territory branding (teal/navy gradient, territory icon, territory labels)
 * - Submits to ABM (not TBM) for approval
 * - Overall Territory Target Bar with territory-level stats
 * - Territory info banner explaining the flow
 * - Uses 'tgt-' CSS prefix to avoid conflicts with Sales Rep grid
 * - Exclusive to TBM role
 * 
 * FLOW: TBM enters territory targets → Save Draft → Submit to ABM → ABM approves
 * 
 * @author Appasamy Associates - Product Commitment PWA
 * @version 1.0.0 - Replicated from Sales Rep TargetEntryGrid
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Utils } from '../../../utils/helpers';
import '../../../styles/tbm/tbmTerritoryTargetGrid.css';

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

function TBMTerritoryTargetGrid({
  categories = [],
  products = [],
  onUpdateTarget,
  onSaveAll,
  onSubmitAll,
  fiscalYear = '2026-27',
  overallYearlyTargetValue = null,
  territoryName = 'South Chennai Territory'
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
      p.name?.toLowerCase().includes(term) ||
      p.code?.toLowerCase().includes(term) ||
      p.categoryId?.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  // ==================== CALCULATIONS ====================

  const calculateQuarterTotal = useCallback((productId, quarterId, year) => {
    const product = products.find(p => p.id === productId);
    if (!product) return 0;
    const quarter = QUARTERS.find(q => q.id === quarterId);
    if (!quarter) return 0;
    return quarter.months.reduce((sum, month) => {
      const monthData = product.monthlyTargets?.[month] || {};
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

  const calculateCategoryTotal = useCallback((categoryId, year) => {
    return products
      .filter(p => p.categoryId === categoryId)
      .reduce((sum, p) => sum + calculateYearlyTotal(p.id, year), 0);
  }, [products, calculateYearlyTotal]);

  const calculateCategoryMonthTotal = useCallback((categoryId, month, year) => {
    return products
      .filter(p => p.categoryId === categoryId)
      .reduce((sum, p) => {
        const monthData = p.monthlyTargets?.[month] || {};
        return sum + (year === 'CY' ? (monthData.cyQty || 0) : (monthData.lyQty || 0));
      }, 0);
  }, [products]);

  // ==================== OVERALL TERRITORY TARGET SUMMARY ====================

  const overallTargetSummary = useMemo(() => {
    const totalCYQty = products.reduce((sum, p) => sum + calculateYearlyTotal(p.id, 'CY'), 0);
    const totalLYQty = products.reduce((sum, p) => sum + calculateYearlyTotal(p.id, 'LY'), 0);

    // Revenue totals
    const totalCYRev = products.reduce((sum, p) => {
      return sum + MONTHS.reduce((ms, month) => {
        return ms + (p.monthlyTargets?.[month]?.cyRev || 0);
      }, 0);
    }, 0);

    const yearlyTargetValue = overallYearlyTargetValue || null;
    const achievement = yearlyTargetValue ? (totalCYRev / yearlyTargetValue) * 100 : 0;

    // Quarterly breakdown
    const quarterlyBreakdown = QUARTERS.map(q => {
      const cyQty = products.reduce((sum, p) =>
        sum + q.months.reduce((ms, m) => ms + (p.monthlyTargets?.[m]?.cyQty || 0), 0), 0);
      const cyRev = products.reduce((sum, p) =>
        sum + q.months.reduce((ms, m) => ms + (p.monthlyTargets?.[m]?.cyRev || 0), 0), 0);
      const monthlyDetail = q.months.map(m => ({
        month: m,
        cyQty: products.reduce((sum, p) => sum + (p.monthlyTargets?.[m]?.cyQty || 0), 0),
        cyRev: products.reduce((sum, p) => sum + (p.monthlyTargets?.[m]?.cyRev || 0), 0)
      }));
      return { ...q, cyQty, cyRev, monthlyDetail };
    });

    return {
      totalCYQty, totalLYQty, totalCYRev,
      yearlyTargetValue, achievement, quarterlyBreakdown,
      growth: Utils.calcGrowth(totalLYQty, totalCYQty)
    };
  }, [products, calculateYearlyTotal, overallYearlyTargetValue]);

  // ==================== MONTHLY COLUMN TOTALS ====================

  const monthlyColumnTotals = useMemo(() => {
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

          {/* Category month totals — revenue only */}
          {MONTHS.map(month => (
            <div key={month} className="tgt-month-cell tgt-category-total-cell">
              —
            </div>
          ))}
          <div className="tgt-total-cell tgt-category-total-cell">—</div>
          <div className="tgt-growth-cell">—</div>
        </div>

        {isExpanded && firstProduct && (
          <div className="tgt-products-container">
            <div className="tgt-product-rows">
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
                <div className="tgt-growth-cell">—</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ==================== MAIN RENDER ====================

  return (
    <div className="tgt-territory-container" ref={gridRef}>

      {/* ===== TERRITORY HEADER ===== */}
      <div className="tgt-grid-header">
        <div className="tgt-grid-title">
          <div className="tgt-title-left">
            <div className="tgt-territory-icon">
              <i className="fas fa-map-marked-alt"></i>
            </div>
            <div>
              <h2><i className="fas fa-table"></i> Territory Target Entry</h2>
              <span className="tgt-territory-name">{territoryName}</span>
            </div>
          </div>
          <span className="tgt-fiscal-year">FY {fiscalYear}</span>
        </div>

        {/* Territory Info Banner */}
        <div className="tgt-info-banner">
          <i className="fas fa-info-circle"></i>
          <span>
            Enter your <strong>territory-level</strong> monthly targets below. 
            These represent the combined target for your entire territory. 
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

      {/* ===== OVERALL TERRITORY TARGET SUMMARY BAR ===== */}
      <div className="tgt-overall-target-bar">
        <div className="tgt-otb-main-section">
          {/* Yearly Target Card */}
          <div className="tgt-otb-card tgt-otb-yearly-target">
            <div className="tgt-otb-card-icon">
              <i className="fas fa-flag-checkered"></i>
            </div>
            <div className="tgt-otb-card-content">
              <span className="tgt-otb-card-label">Territory Target (FY {fiscalYear})</span>
              <span className="tgt-otb-card-value">
                {overallTargetSummary.yearlyTargetValue
                  ? `₹${Utils.formatShortCurrency ? Utils.formatShortCurrency(overallTargetSummary.yearlyTargetValue) : Utils.formatCompact(overallTargetSummary.yearlyTargetValue)}`
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
                ₹{Utils.formatShortCurrency ? Utils.formatShortCurrency(overallTargetSummary.totalCYRev) : Utils.formatCompact(overallTargetSummary.totalCYRev)}
              </span>
            </div>
          </div>

          {/* Total Qty */}
          <div className="tgt-otb-card tgt-otb-qty">
            <div className="tgt-otb-card-icon tgt-qty-icon">
              <i className="fas fa-cubes"></i>
            </div>
            <div className="tgt-otb-card-content">
              <span className="tgt-otb-card-label">Total Qty (CY vs LY)</span>
              <span className="tgt-otb-card-value">
                {Utils.formatNumber(overallTargetSummary.totalCYQty)}
                <span className="tgt-vs-ly"> vs {Utils.formatNumber(overallTargetSummary.totalLYQty)}</span>
              </span>
            </div>
          </div>

          {/* Growth */}
          <div className="tgt-otb-card tgt-otb-growth">
            <div className={`tgt-otb-card-icon ${overallTargetSummary.growth >= 0 ? 'tgt-growth-positive' : 'tgt-growth-negative'}`}>
              <i className={`fas fa-arrow-${overallTargetSummary.growth >= 0 ? 'up' : 'down'}`}></i>
            </div>
            <div className="tgt-otb-card-content">
              <span className="tgt-otb-card-label">YoY Growth</span>
              <span className={`tgt-otb-card-value ${overallTargetSummary.growth >= 0 ? 'tgt-positive' : 'tgt-negative'}`}>
                {Utils.formatGrowth(overallTargetSummary.growth)}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar (if target value is set) */}
        {overallTargetSummary.yearlyTargetValue && (
          <div className="tgt-otb-progress-wrapper">
            <div className="tgt-otb-progress-bar">
              <div
                className="tgt-otb-progress-fill"
                style={{ width: `${Math.min(overallTargetSummary.achievement, 100)}%` }}
              ></div>
            </div>
            <div className="tgt-otb-progress-stats">
              <span>{Math.round(overallTargetSummary.achievement)}% of FY Target</span>
            </div>
          </div>
        )}

        {/* Quarter Contribution Chips */}
        <div className="tgt-otb-quarter-breakdown">
          {overallTargetSummary.quarterlyBreakdown.map(q => (
            <div key={q.id} className={`tgt-otb-quarter-chip ${q.color}`}>
              <span className="tgt-otb-qchip-label">{q.label}</span>
              <span className="tgt-otb-qchip-value">{Utils.formatNumber(q.cyQty)}</span>
              <span className="tgt-otb-qchip-rev">
                ₹{Utils.formatShortCurrency ? Utils.formatShortCurrency(q.cyRev) : Utils.formatCompact(q.cyRev)}
              </span>
            </div>
          ))}
        </div>

        {/* Month-wise breakdown */}
        <div className="tgt-otb-month-breakdown">
          {overallTargetSummary.quarterlyBreakdown.map(q => (
            <div key={q.id} className={`tgt-otb-month-group ${q.color}`}>
              {q.monthlyDetail.map(m => (
                <div key={m.month} className="tgt-otb-month-item">
                  <span className="tgt-otb-month-label">{MONTH_LABEL_MAP[m.month]}</span>
                  <span className="tgt-otb-month-qty">{Utils.formatNumber(m.cyQty)}</span>
                  <span className="tgt-otb-month-rev">
                    ₹{Utils.formatShortCurrency ? Utils.formatShortCurrency(m.cyRev) : Utils.formatCompact(m.cyRev)}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
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
            onKeyDown={handleSearchKeyDown}
          />
          {searchTerm && (
            <button className="tgt-search-clear-btn" onClick={clearSearch}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
        <span className="tgt-product-count">{filteredProducts.length} products</span>
      </div>

      {/* ===== MONTHLY COLUMN TOTALS ROW ===== */}
      <div className="tgt-monthly-totals-row">
        <div className="tgt-monthly-totals-label-cell">
          <i className="fas fa-calculator"></i> Territory Totals
        </div>
        {MONTHS.map((month, idx) => (
          <div key={month} className={`tgt-monthly-totals-cell ${idx < 3 ? 'q1' : idx < 6 ? 'q2' : idx < 9 ? 'q3' : 'q4'}`}>
            {Utils.formatNumber(monthlyColumnTotals[month])}
          </div>
        ))}
        <div className="tgt-monthly-totals-cell tgt-grand-total">
          {Utils.formatNumber(monthlyColumnTotals.yearly)}
        </div>
        <div className="tgt-monthly-totals-cell tgt-growth-spacer"></div>
      </div>

      {/* ===== EXCEL GRID ===== */}
      <div className="tgt-excel-grid">
        {/* Header Row */}
        <div className="tgt-grid-header-row">
          <div className="tgt-header-cell tgt-product-header">Product / Territory Target</div>
          {MONTH_LABELS.map((label, idx) => (
            <div key={label} className={`tgt-header-cell tgt-month-header ${idx < 3 ? 'q1' : idx < 6 ? 'q2' : idx < 9 ? 'q3' : 'q4'}`}>
              {label}
            </div>
          ))}
          <div className="tgt-header-cell tgt-total-header">TOTAL</div>
          <div className="tgt-header-cell tgt-growth-header">YoY</div>
        </div>

        {/* Categories */}
        {categories.map(category =>
          category.isRevenueOnly
            ? renderRevenueOnlyCategory(category)
            : renderCategory(category)
        )}
      </div>
    </div>
  );

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
                {/* CY Row - Editable */}
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
                      return <span className={`tgt-growth-value ${growth >= 0 ? 'tgt-positive' : 'tgt-negative'}`}>{Utils.formatGrowth(growth)}</span>;
                    })()}
                  </div>
                </div>

                {/* LY Row - Read Only */}
                <div className="tgt-product-row tgt-ly-row">
                  <div className="tgt-product-name-cell">
                    <span className="tgt-year-label tgt-ly">LY</span>
                  </div>
                  {MONTHS.map(month => {
                    const monthData = product.monthlyTargets?.[month] || {};
                    return (
                      <div key={month} className="tgt-month-cell tgt-ly-value">
                        {Utils.formatNumber(monthData.lyQty || 0)}
                      </div>
                    );
                  })}
                  <div className="tgt-total-cell tgt-ly-value">
                    {Utils.formatNumber(calculateYearlyTotal(product.id, 'LY'))}
                  </div>
                  <div className="tgt-growth-cell"></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
}

export default TBMTerritoryTargetGrid;
