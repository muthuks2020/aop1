/**
 * TargetEntryGrid Component
 * Enhanced Excel-like grid for Monthly Target Entry
 * 
 * WORKFLOW (v4.1.0):
 * - Sales Rep enters targets → submits to TBM
 * - TBM reviews → either approves as-is OR edits/corrects and approves
 * - NO reject cycle. Once approved, it's LOCKED for Sales Rep.
 * 
 * STATES (Sales Rep perspective):
 *   Draft     → editable (teal borders)
 *   Submitted → locked, pending TBM review (amber)
 *   Approved  → locked, TBM has finalized (green)
 * 
 * FEATURES:
 * - Status-based locking: Approved/Submitted → LOCKED; Draft → EDITABLE
 * - Products with NO CY values entered are visually dimmed for clarity
 * - Growth percentage (YoY %) shown per product row
 * 
 * @author Appasamy Associates - Product Commitment PWA
 * @version 4.1.0 - No reject flow, status locking, visibility clarity, growth %
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
  const [showOnlyEntered, setShowOnlyEntered] = useState(false);
  
  const inputRef = useRef(null);
  const searchInputRef = useRef(null);
  const gridRef = useRef(null);

  useEffect(() => {
    if (activeCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [activeCell]);

  // ==================== HELPER: Check if product has any CY values entered ====================
  const hasAnyCYValue = useCallback((product) => {
    if (!product.monthlyTargets) return false;
    return MONTHS.some(month => {
      const monthData = product.monthlyTargets[month];
      return monthData && (monthData.cyQty > 0 || monthData.cyRev > 0);
    });
  }, []);

  // ==================== HELPER: Check if product is editable (status-based) ====================
  const isEditable = useCallback((product) => {
    // Only Draft is editable by Sales Rep
    // Submitted (pending TBM) and Approved (TBM finalized) → locked
    const status = product.status || 'draft';
    return status === 'draft';
  }, []);

  // ==================== STATUS CONFIG (3 states only: draft, submitted, approved) ====================
  const getStatusInfo = useCallback((status) => {
    switch (status) {
      case 'approved':
        return { icon: 'fa-lock', label: 'Approved by TBM — Locked', color: '#059669', bg: '#D1FAE5' };
      case 'submitted':
        return { icon: 'fa-clock', label: 'Submitted — Pending TBM Review', color: '#D97706', bg: '#FEF3C7' };
      default: // draft
        return { icon: 'fa-edit', label: 'Draft — Click to edit', color: '#00A19B', bg: '#E6FAF9' };
    }
  }, []);

  // ==================== FILTERED DATA ====================
  const filteredProducts = useMemo(() => {
    let result = products;
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.code.toLowerCase().includes(term) ||
        (p.subcategory && p.subcategory.toLowerCase().includes(term))
      );
    }

    if (showOnlyEntered) {
      result = result.filter(p => hasAnyCYValue(p));
    }

    return result;
  }, [products, searchTerm, showOnlyEntered, hasAnyCYValue]);

  const getSubcategories = useCallback((categoryId) => {
    const subs = new Set();
    filteredProducts.filter(p => p.categoryId === categoryId).forEach(p => {
      if (p.subcategory) subs.add(p.subcategory);
    });
    return Array.from(subs);
  }, [filteredProducts]);

  // ==================== CALCULATIONS ====================
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

  // ==================== OVERALL TARGET SUMMARY ====================
  const overallTargetSummary = useMemo(() => {
    let totalCYQty = 0, totalLYQty = 0, totalCYRev = 0, totalLYRev = 0;
    let enteredCount = 0, approvedCount = 0, submittedCount = 0, draftCount = 0;

    products.forEach(p => {
      if (hasAnyCYValue(p)) enteredCount++;
      if (p.status === 'approved') approvedCount++;
      else if (p.status === 'submitted') submittedCount++;
      else draftCount++;

      if (p.monthlyTargets) {
        MONTHS.forEach(month => {
          const md = p.monthlyTargets[month] || {};
          totalCYQty += md.cyQty || 0;
          totalLYQty += md.lyQty || 0;
          totalCYRev += md.cyRev || 0;
          totalLYRev += md.lyRev || 0;
        });
      }
    });

    const totalEnteredValue = totalCYRev;
    const yearlyTargetValue = overallYearlyTargetValue || 0;
    const completionPercent = yearlyTargetValue > 0 ? Math.min(100, Math.round((totalEnteredValue / yearlyTargetValue) * 100)) : 0;

    return {
      totalCYQty, totalLYQty, totalCYRev, totalLYRev,
      enteredCount, approvedCount, submittedCount, draftCount,
      totalProducts: products.length,
      yearlyTargetValue,
      totalEnteredValue,
      completionPercent,
      qtyGrowth: Utils.calcGrowth(totalLYQty, totalCYQty),
      revGrowth: Utils.calcGrowth(totalLYRev, totalCYRev)
    };
  }, [products, overallYearlyTargetValue, hasAnyCYValue]);

  // ==================== EVENT HANDLERS ====================
  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(categoryId) ? next.delete(categoryId) : next.add(categoryId);
      return next;
    });
  };

  const handleCellClick = (product, month, currentValue) => {
    if (!isEditable(product)) return; // Don't allow editing locked products
    setActiveCell({ productId: product.id, month });
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
          if (product && isEditable(product)) {
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

              {subcatProducts.map(product => {
                const canEdit = isEditable(product);
                const productHasValues = hasAnyCYValue(product);
                const statusInfo = getStatusInfo(product.status);

                return (
                  <div 
                    key={product.id} 
                    className={`product-rows ${product.status ? `status-${product.status}` : 'status-draft'} ${!productHasValues ? 'no-values-entered' : ''}`}
                  >
                    {/* CY Row */}
                    <div className="product-row cy-row">
                      <div className="product-name-cell">
                        <span className="product-name" title={product.name}>
                          {highlightMatch(product.name, searchTerm)}
                        </span>
                        <span className="product-code">{product.code}</span>
                        <span className="year-label">CY</span>

                        {/* Status indicator */}
                        <span 
                          className="product-status-indicator"
                          title={statusInfo.label}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.625rem',
                            fontWeight: 700,
                            background: statusInfo.bg,
                            color: statusInfo.color,
                            marginLeft: '6px',
                            whiteSpace: 'nowrap',
                            letterSpacing: '0.02em'
                          }}
                        >
                          <i className={`fas ${statusInfo.icon}`} style={{ fontSize: '0.5625rem' }}></i>
                          {product.status === 'approved' ? 'Locked' : 
                           product.status === 'submitted' ? 'Pending' : 'Draft'}
                        </span>
                      </div>

                      {MONTHS.map(month => {
                        const monthData = product.monthlyTargets?.[month] || {};
                        const isActive = activeCell?.productId === product.id && activeCell?.month === month;
                        
                        return (
                          <div 
                            key={month} 
                            className={`month-cell ${canEdit ? 'editable' : 'locked'} ${isActive ? 'active-cell' : ''}`}
                            onClick={() => handleCellClick(product, month, monthData.cyQty)}
                            title={!canEdit ? `${statusInfo.label} — values are locked` : 'Click to edit'}
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
                              <span className={`cell-value ${canEdit ? 'editable' : ''}`}>
                                {Utils.formatNumber(monthData.cyQty || 0)}
                              </span>
                            )}
                          </div>
                        );
                      })}

                      <div className="total-cell cy-total">
                        {Utils.formatNumber(calculateYearlyTotal(product.id, 'CY'))}
                      </div>

                      {/* Growth % Cell */}
                      <div className="growth-cell">
                        {(() => {
                          const growth = calculateGrowth(product.id);
                          return (
                            <span className={`growth-value small ${growth >= 0 ? 'positive' : 'negative'}`}>
                              {Utils.formatGrowth(growth)}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    {/* LY Row */}
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
                );
              })}
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
          <button className="action-btn submit" onClick={handleSubmitAll} disabled={isLoading}>
            {isLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
            Submit to TBM
          </button>
        </div>
      </div>

      {/* Overall Target Summary Bar */}
      <div className="overall-target-bar">
        <div className="otb-main-section">
          <div className="otb-card otb-yearly-target">
            <div className="otb-card-icon"><i className="fas fa-flag-checkered"></i></div>
            <div className="otb-card-content">
              <span className="otb-card-label">Target Value (FY {fiscalYear})</span>
              <span className="otb-card-value">
                {overallTargetSummary.yearlyTargetValue 
                  ? `₹${Utils.formatCompact(overallTargetSummary.yearlyTargetValue)}`
                  : 'Not Set'}
              </span>
            </div>
          </div>

          <div className="otb-card otb-entered-value">
            <div className="otb-card-icon"><i className="fas fa-rupee-sign"></i></div>
            <div className="otb-card-content">
              <span className="otb-card-label">Total Entered Value</span>
              <span className="otb-card-value">₹{Utils.formatCompact(overallTargetSummary.totalEnteredValue)}</span>
            </div>
          </div>

          {overallTargetSummary.yearlyTargetValue > 0 && (
            <div className="otb-card otb-completion">
              <div className="otb-card-icon"><i className="fas fa-percentage"></i></div>
              <div className="otb-card-content">
                <span className="otb-card-label">Completion</span>
                <span className="otb-card-value">{overallTargetSummary.completionPercent}%</span>
              </div>
              <div className="otb-progress-bar">
                <div className="otb-progress-fill" style={{ width: `${overallTargetSummary.completionPercent}%` }}></div>
              </div>
            </div>
          )}
        </div>

        {/* Status Summary Chips */}
        <div className="otb-status-chips">
          <span className="otb-chip otb-chip-total">
            <i className="fas fa-boxes"></i> {overallTargetSummary.totalProducts} Products
          </span>
          <span className="otb-chip otb-chip-entered">
            <i className="fas fa-pencil-alt"></i> {overallTargetSummary.enteredCount} Entered
          </span>
          <span className="otb-chip otb-chip-approved">
            <i className="fas fa-lock"></i> {overallTargetSummary.approvedCount} Approved (Locked)
          </span>
          <span className="otb-chip otb-chip-submitted">
            <i className="fas fa-clock"></i> {overallTargetSummary.submittedCount} Pending
          </span>
          <span className="otb-chip otb-chip-draft">
            <i className="fas fa-edit"></i> {overallTargetSummary.draftCount} Draft
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="grid-search-bar">
        <div className="search-input-wrapper">
          <i className="fas fa-search search-icon"></i>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="search-input"
          />
          {searchTerm && (
            <button className="clear-search" onClick={clearSearch}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

        {/* Toggle: show only entered products */}
        <label className="filter-toggle" style={{
          display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
          fontSize: '0.8125rem', color: '#4B5563', fontWeight: 500,
          padding: '0.375rem 0.75rem', borderRadius: '8px',
          background: showOnlyEntered ? '#E6FAF9' : '#F3F4F6',
          border: showOnlyEntered ? '1px solid #00A19B' : '1px solid #E5E7EB',
          transition: 'all 0.2s ease'
        }}>
          <input 
            type="checkbox" 
            checked={showOnlyEntered} 
            onChange={(e) => setShowOnlyEntered(e.target.checked)}
            style={{ accentColor: '#00A19B' }}
          />
          <i className={`fas ${showOnlyEntered ? 'fa-eye' : 'fa-eye-slash'}`} style={{ fontSize: '0.75rem', color: showOnlyEntered ? '#00A19B' : '#9CA3AF' }}></i>
          Show only entered products
        </label>

        {/* Legend */}
        <div className="grid-legend" style={{
          display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.6875rem', color: '#6B7280', marginLeft: 'auto'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, border: '2px solid #00A19B', background: 'rgba(0,161,155,0.06)', display: 'inline-block' }}></span>
            Editable
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#D1FAE5', border: '1px solid #059669', display: 'inline-block' }}></span>
            Approved (Locked)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#FEF3C7', border: '1px solid #D97706', display: 'inline-block' }}></span>
            Pending
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(0,0,0,0.04)', border: '1px dashed #CBD5E1', display: 'inline-block' }}></span>
            Not Entered
          </span>
        </div>
      </div>

      {/* Excel Grid */}
      <div className="excel-grid">
        {/* Header Row */}
        <div className="grid-header-row">
          <div className="header-cell product-header">Product</div>
          {MONTH_LABELS.map((label, idx) => (
            <div key={label} className={`header-cell month-header ${idx < 3 ? 'q1' : idx < 6 ? 'q2' : idx < 9 ? 'q3' : 'q4'}`}>
              {label}
            </div>
          ))}
          <div className="header-cell total-header">TOTAL</div>
          <div className="header-cell growth-header">YoY %</div>
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

      {/* Footer Info */}
      <div className="grid-footer-info" style={{
        padding: '0.75rem 1.5rem',
        background: '#F9FAFB',
        borderTop: '1px solid #E5E7EB',
        display: 'flex',
        gap: '2rem',
        fontSize: '0.6875rem',
        color: '#6B7280',
        flexWrap: 'wrap'
      }}>
        <span><i className="fas fa-mouse-pointer" style={{ marginRight: '0.375rem', color: '#00A19B' }}></i> Click on teal-bordered cells to edit</span>
        <span><i className="fas fa-lock" style={{ marginRight: '0.375rem', color: '#059669' }}></i> Green rows = Approved by TBM (locked)</span>
        <span><i className="fas fa-clock" style={{ marginRight: '0.375rem', color: '#D97706' }}></i> Yellow rows = Pending TBM approval (locked)</span>
        <span><i className="fas fa-keyboard" style={{ marginRight: '0.375rem' }}></i> Tab to move between cells, Enter to confirm</span>
      </div>
    </div>
  );
}

export default TargetEntryGrid;
