/**
 * TBMTargetEntryGrid Component
 * Mirrors Sales Rep TargetEntryGrid — same CSS classes, same layout.
 * TBM enters territory-level monthly targets → submits to ABM for approval.
 *
 * @author Appasamy Associates - Product Commitment PWA
 * @version 3.0.0 — Rewritten to match Sales Rep grid (fixes broken layout)
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Utils } from '../../../utils/helpers';

const MONTHS = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];
const MONTH_LABELS = ['APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR'];

function TBMTargetEntryGrid({
  categories = [],
  products = [],
  onUpdateTarget,
  onSaveAll,
  onSubmitAll,
  fiscalYear = '2026-27',
  targetStats = {},
  territoryName = '',
}) {
  const [activeCell, setActiveCell]                 = useState(null);
  const [editValue, setEditValue]                   = useState('');
  const [expandedCategories, setExpandedCategories] = useState(new Set(['equipment', 'iol', 'ovd']));
  const [expandedSubcategories, setExpandedSubcategories] = useState(new Set());
  const [searchTerm, setSearchTerm]                 = useState('');
  const [isLoading, setIsLoading]                   = useState(false);
  const [lastSaved, setLastSaved]                   = useState(null);
  const [showOnlyEntered, setShowOnlyEntered]       = useState(false);

  const inputRef       = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (activeCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [activeCell]);

  // ==================== HELPERS ====================

  const isEditable = useCallback((product) => {
    const status = product.status || 'draft';
    return status === 'draft' || status === 'rejected';
  }, []);

  const hasAnyCYValue = useCallback((product) => {
    if (!product.monthlyTargets) return false;
    return MONTHS.some(m => {
      const d = product.monthlyTargets[m];
      return d && (d.cyQty > 0 || d.cyRev > 0);
    });
  }, []);

  const getStatusInfo = useCallback((status) => {
    switch (status) {
      case 'approved':
        return { icon: 'fa-lock',         label: 'Approved by ABM — Locked',      color: '#059669', bg: '#D1FAE5' };
      case 'submitted':
        return { icon: 'fa-clock',        label: 'Submitted — Pending ABM Review', color: '#D97706', bg: '#FEF3C7' };
      case 'rejected':
        return { icon: 'fa-undo',         label: 'Rejected — Click to edit',       color: '#DC2626', bg: '#FEE2E2' };
      default:
        return { icon: 'fa-edit',         label: 'Draft — Click to edit',          color: '#00A19B', bg: '#E6FAF9' };
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
    if (showOnlyEntered) result = result.filter(p => hasAnyCYValue(p));
    // dedupe
    const seen = new Set();
    result = result.filter(p => {
      const key = `${p.categoryId}__${p.subcategory}__${p.name.trim().toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
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

  const calculateYearlyTotal = useCallback((productId, year) => {
    const product = products.find(p => p.id === productId);
    if (!product) return 0;
    return MONTHS.reduce((sum, m) => {
      const d = product.monthlyTargets?.[m] || {};
      return sum + (year === 'CY' ? (d.cyQty || 0) : (d.lyQty || 0));
    }, 0);
  }, [products]);

  const calculateCategoryTotal = useCallback((categoryId, month, year) => {
    return products
      .filter(p => p.categoryId === categoryId)
      .reduce((sum, p) => {
        const d = p.monthlyTargets?.[month] || {};
        return sum + (year === 'CY' ? (d.cyQty || 0) : (d.lyQty || 0));
      }, 0);
  }, [products]);

  const calculateGrowth = useCallback((productId) => {
    const ly = calculateYearlyTotal(productId, 'LY');
    const cy = calculateYearlyTotal(productId, 'CY');
    return Utils.calcGrowth(ly, cy);
  }, [calculateYearlyTotal]);

  // ==================== SUMMARY BAR ====================

  const overallSummary = useMemo(() => {
    let totalCYQty = 0, totalLYQty = 0, totalCYRev = 0;
    let draftCount = 0, submittedCount = 0, approvedCount = 0, rejectedCount = 0;
    products.forEach(p => {
      if (p.status === 'approved')        approvedCount++;
      else if (p.status === 'submitted')  submittedCount++;
      else if (p.status === 'rejected')   rejectedCount++;
      else                                draftCount++;
      if (p.monthlyTargets) {
        MONTHS.forEach(m => {
          const d = p.monthlyTargets[m] || {};
          totalCYQty += d.cyQty || 0;
          totalLYQty += d.lyQty || 0;
          totalCYRev += d.cyRev || 0;
        });
      }
    });
    return {
      totalCYQty, totalLYQty, totalCYRev,
      draftCount, submittedCount, approvedCount, rejectedCount,
      qtyGrowth: Utils.calcGrowth(totalLYQty, totalCYQty),
    };
  }, [products]);

  // ==================== EVENT HANDLERS ====================

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(categoryId) ? next.delete(categoryId) : next.add(categoryId);
      return next;
    });
  };

  const toggleSubcategory = (key) => {
    setExpandedSubcategories(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleCellClick = (product, month, currentValue) => {
    if (!isEditable(product)) return;
    setActiveCell({ productId: product.id, month });
    setEditValue(currentValue?.toString() || '');
  };

  const handleCellChange = (e) => {
    setEditValue(e.target.value.replace(/[^0-9]/g, ''));
  };

  const handleCellBlur = () => {
    if (activeCell) {
      const numValue = parseInt(editValue) || 0;
      if (onUpdateTarget) onUpdateTarget(activeCell.productId, activeCell.month, numValue);
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
    } catch (err) { console.error('Save failed:', err); }
    setIsLoading(false);
  };

  const handleSubmitAll = async () => {
    setIsLoading(true);
    try {
      if (onSubmitAll) await onSubmitAll();
    } catch (err) { console.error('Submit failed:', err); }
    setIsLoading(false);
  };

  const clearSearch = () => {
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  // ==================== RENDER: PRODUCT ROWS ====================

  const renderProductRows = (product) => {
    const canEdit    = isEditable(product);
    const statusInfo = getStatusInfo(product.status);

    return (
      <div
        key={product.id}
        className={`product-rows ${product.status ? `status-${product.status}` : 'status-draft'}`}
      >
        {/* CY Row */}
        <div className="product-row cy-row">
          <div className="product-name-cell">
            <span className="product-name" title={product.name}>{product.name}</span>
            <span className="year-label">CY</span>
            <span
              className="product-status-indicator"
              title={statusInfo.label}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '2px 8px', borderRadius: '12px', fontSize: '0.625rem',
                fontWeight: 700, background: statusInfo.bg, color: statusInfo.color,
                marginLeft: '6px', whiteSpace: 'nowrap',
              }}
            >
              <i className={`fas ${statusInfo.icon}`} style={{ fontSize: '0.5625rem' }}></i>
              {product.status === 'approved' ? 'Locked' : product.status === 'submitted' ? 'Pending' : product.status === 'rejected' ? 'Revision' : 'Draft'}
            </span>
          </div>

          {MONTHS.map((month, idx) => {
            const monthData  = product.monthlyTargets?.[month] || {};
            const isActive   = activeCell?.productId === product.id && activeCell?.month === month;
            const qClass     = idx < 3 ? 'q1' : idx < 6 ? 'q2' : idx < 9 ? 'q3' : 'q4';

            return (
              <div
                key={month}
                className={`month-cell ${canEdit ? 'editable' : 'locked'} ${isActive ? 'active' : ''} ${qClass}`}
                onClick={() => handleCellClick(product, month, monthData.cyQty || 0)}
                title={statusInfo.label}
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
                  <span className="cell-value">{Utils.formatNumber(monthData.cyQty || 0)}</span>
                )}
              </div>
            );
          })}

          <div className="total-cell cy-total">
            {Utils.formatNumber(calculateYearlyTotal(product.id, 'CY'))}
          </div>
          <div className="growth-cell">
            {(() => {
              const g = calculateGrowth(product.id);
              return (
                <span style={{
                  fontSize: '0.75rem', fontWeight: 700,
                  color: g >= 0 ? '#059669' : '#DC2626',
                  fontFamily: 'monospace',
                }}>
                  <i className={`fas fa-arrow-${g >= 0 ? 'up' : 'down'}`} style={{ marginRight: 3 }}></i>
                  {Math.abs(g).toFixed(1)}%
                </span>
              );
            })()}
          </div>
        </div>

        {/* LY Row */}
        <div className="product-row ly-row">
          <div className="product-name-cell ly-label">
            <span>LY Qty</span>
          </div>
          {MONTHS.map((month, idx) => {
            const monthData = product.monthlyTargets?.[month] || {};
            const qClass    = idx < 3 ? 'q1' : idx < 6 ? 'q2' : idx < 9 ? 'q3' : 'q4';
            return (
              <div key={month} className={`month-cell ly-value ${qClass}`}>
                <span className="cell-value">{Utils.formatNumber(monthData.lyQty || 0)}</span>
              </div>
            );
          })}
          <div className="total-cell ly-total">
            {Utils.formatNumber(calculateYearlyTotal(product.id, 'LY'))}
          </div>
          <div className="growth-cell"></div>
        </div>
      </div>
    );
  };

  // ==================== RENDER: CATEGORY ====================

  const renderCategory = (category) => {
    const isExpanded    = expandedCategories.has(category.id);
    const subcategories = getSubcategories(category.id);
    const catProducts   = filteredProducts.filter(p => p.categoryId === category.id);
    if (catProducts.length === 0) return null;

    return (
      <div key={category.id} className="category-section">
        {/* Category header row */}
        <div className="category-header-row" onClick={() => toggleCategory(category.id)}>
          <div className="category-name-cell">
            <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'} chevron-icon`}></i>
            <div className={`category-icon-badge ${category.id}`}>
              <i className={`fas ${category.icon || 'fa-box'}`}></i>
            </div>
            <span className="category-name-text">{category.name}</span>
            <span className="category-product-count">{catProducts.length}</span>
          </div>
          {MONTHS.map((month, idx) => {
            const qClass = idx < 3 ? 'q1' : idx < 6 ? 'q2' : idx < 9 ? 'q3' : 'q4';
            return (
              <div key={month} className={`month-cell category-total ${qClass}`}>
                {Utils.formatNumber(calculateCategoryTotal(category.id, month, 'CY'))}
              </div>
            );
          })}
          <div className="total-cell category-total">
            {Utils.formatNumber(
              MONTHS.reduce((s, m) => s + calculateCategoryTotal(category.id, m, 'CY'), 0)
            )}
          </div>
          <div className="growth-cell"></div>
        </div>

        {/* Subcategories / Products */}
        {isExpanded && (
          subcategories.length > 0 ? subcategories.map(sub => {
            const subKey      = `${category.id}__${sub}`;
            const subExpanded = expandedSubcategories.has(subKey);
            const subProducts = catProducts.filter(p => p.subcategory === sub);
            return (
              <div key={subKey} className="subcategory-section">
                <div className="subcategory-header-row" onClick={() => toggleSubcategory(subKey)}>
                  <div className="subcategory-name-cell">
                    <i className={`fas fa-chevron-${subExpanded ? 'down' : 'right'} chevron-icon small`}></i>
                    <span>{sub}</span>
                    <span className="category-product-count">{subProducts.length}</span>
                  </div>
                  {MONTHS.map((month, idx) => {
                    const qClass = idx < 3 ? 'q1' : idx < 6 ? 'q2' : idx < 9 ? 'q3' : 'q4';
                    const total  = subProducts.reduce((s, p) => s + (p.monthlyTargets?.[month]?.cyQty || 0), 0);
                    return (
                      <div key={month} className={`month-cell subcategory-total ${qClass}`}>
                        {Utils.formatNumber(total)}
                      </div>
                    );
                  })}
                  <div className="total-cell subcategory-total">
                    {Utils.formatNumber(
                      subProducts.reduce((s, p) =>
                        s + MONTHS.reduce((ms, m) => ms + (p.monthlyTargets?.[m]?.cyQty || 0), 0), 0
                      )
                    )}
                  </div>
                  <div className="growth-cell"></div>
                </div>
                {subExpanded && subProducts.map(renderProductRows)}
              </div>
            );
          }) : catProducts.map(renderProductRows)
        )}
      </div>
    );
  };

  // ==================== MAIN RENDER ====================

  const { totalCYQty, totalLYQty, draftCount, submittedCount, approvedCount, rejectedCount, qtyGrowth } = overallSummary;
  const submittableCount = draftCount + rejectedCount;

  return (
    <div className="target-entry-container">

      {/* ── Header ── */}
      <div className="grid-header" style={{ background: 'linear-gradient(135deg, #0F4C75 0%, #1B4D7A 50%, #0D9488 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.25rem', color: '#fff',
            }}>
              <i className="fas fa-map-marker-alt"></i>
            </div>
            <div>
              <div style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
                Territory Target Entry
              </div>
              {territoryName && (
                <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                  <i className="fas fa-map-pin" style={{ marginRight: 5 }}></i>{territoryName}
                </div>
              )}
            </div>
            <span style={{
              background: 'rgba(255,255,255,0.15)', padding: '0.375rem 0.875rem',
              borderRadius: 20, fontSize: '0.8125rem', fontWeight: 700, color: '#fff',
            }}>FY {fiscalYear}</span>
          </div>

          {/* Stats pills */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Draft',     count: draftCount,     color: '#60A5FA' },
              { label: 'Pending',   count: submittedCount, color: '#FBBF24' },
              { label: 'Approved',  count: approvedCount,  color: '#34D399' },
              ...(rejectedCount > 0 ? [{ label: 'Revision', count: rejectedCount, color: '#F87171' }] : []),
            ].map(s => (
              <span key={s.label} style={{
                background: 'rgba(255,255,255,0.12)', border: `1px solid ${s.color}40`,
                borderRadius: 20, padding: '0.25rem 0.75rem',
                fontSize: '0.75rem', fontWeight: 600, color: s.color,
              }}>
                {s.count} {s.label}
              </span>
            ))}
          </div>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
          {[
            { label: 'TERRITORY TARGET (FY ' + fiscalYear + ')', value: 'Not Set', sub: null },
            { label: 'COMMITTED VALUE', value: `₹${Utils.formatCompact ? Utils.formatCompact(overallSummary.totalCYRev || 0) : 0}`, sub: null },
            { label: 'TOTAL QTY (CY VS LY)', value: `${Utils.formatNumber(totalCYQty)} vs ${Utils.formatNumber(totalLYQty)}`, sub: null },
            { label: 'YOY GROWTH', value: `${qtyGrowth >= 0 ? '+' : ''}${(qtyGrowth || 0).toFixed(1)}%`, sub: null, color: qtyGrowth >= 0 ? '#34D399' : '#F87171' },
          ].map((card, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.1)', borderRadius: 10,
              padding: '0.75rem 1rem', backdropFilter: 'blur(4px)',
            }}>
              <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                {card.label}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: card.color || '#fff' }}>
                {card.value}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.625rem', marginTop: '0.875rem' }}>
          {lastSaved && (
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
              <i className="fas fa-check-circle" style={{ marginRight: 4, color: '#34D399' }}></i>
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={handleSaveAll}
            disabled={isLoading}
            style={{
              padding: '0.5rem 1.125rem', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'rgba(255,255,255,0.15)', color: '#fff',
              fontSize: '0.8125rem', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '0.375rem',
            }}
          >
            {isLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
            Save Draft
          </button>
          <button
            onClick={handleSubmitAll}
            disabled={isLoading || submittableCount === 0}
            title={submittableCount === 0 ? 'No drafts to submit' : `Submit ${submittableCount} targets to ABM`}
            style={{
              padding: '0.5rem 1.125rem', borderRadius: 8, border: 'none', cursor: submittableCount === 0 ? 'not-allowed' : 'pointer',
              background: submittableCount === 0 ? 'rgba(255,255,255,0.08)' : '#00A19B',
              color: submittableCount === 0 ? 'rgba(255,255,255,0.4)' : '#fff',
              fontSize: '0.8125rem', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '0.375rem',
            }}
          >
            {isLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
            Submit to ABM
          </button>
        </div>
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="grid-search-bar" style={{
        display: 'flex', flexWrap: 'wrap', gap: '8px',
        padding: '0.625rem 1rem', borderBottom: '1px solid #E5E7EB',
        background: '#FAFAFA', alignItems: 'center',
      }}>
        <div className="search-input-wrapper" style={{ flex: '1 1 180px', minWidth: 0 }}>
          <i className="fas fa-search search-icon"></i>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button className="clear-search" onClick={clearSearch}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

        <label style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
          fontSize: '0.75rem', color: showOnlyEntered ? '#00A19B' : '#6B7280', fontWeight: 500,
          padding: '0.3rem 0.6rem', borderRadius: '20px',
          background: showOnlyEntered ? '#E6FAF9' : '#F3F4F6',
          border: `1px solid ${showOnlyEntered ? '#00A19B' : '#E5E7EB'}`,
          userSelect: 'none',
        }}>
          <input type="checkbox" checked={showOnlyEntered}
            onChange={e => setShowOnlyEntered(e.target.checked)}
            style={{ accentColor: '#00A19B', width: 13, height: 13 }} />
          Entered only
        </label>

        <div className="grid-legend" style={{
          display: 'flex', gap: '10px', alignItems: 'center',
          fontSize: '0.625rem', color: '#9CA3AF', marginLeft: 'auto',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, border: '2px solid #00A19B', background: 'rgba(0,161,155,0.06)', display: 'inline-block' }}></span>
            Editable
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: '#D1FAE5', border: '1px solid #059669', display: 'inline-block' }}></span>
            Approved
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: '#FEF3C7', border: '1px solid #D97706', display: 'inline-block' }}></span>
            Pending
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: '#FEE2E2', border: '1px solid #DC2626', display: 'inline-block' }}></span>
            Revision
          </span>
        </div>
      </div>

      {/* ── Excel Grid ── */}
      <div className="excel-grid">
        <div className="grid-header-row">
          <div className="header-cell product-header">Product / Territory Target</div>
          {MONTH_LABELS.map((label, idx) => (
            <div key={label} className={`header-cell month-header ${idx < 3 ? 'q1' : idx < 6 ? 'q2' : idx < 9 ? 'q3' : 'q4'}`}>
              {label}
            </div>
          ))}
          <div className="header-cell total-header">TOTAL</div>
          <div className="header-cell growth-header">YoY %</div>
        </div>

        {categories.map(renderCategory)}

        {filteredProducts.length === 0 && searchTerm && (
          <div className="no-results">
            <i className="fas fa-search" style={{ fontSize: '1.5rem', opacity: 0.3 }}></i>
            <p>No products matching "{searchTerm}"</p>
            <button className="clear-search-btn" onClick={clearSearch}>Clear Search</button>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="grid-footer-info" style={{
        padding: '0.75rem 1.5rem', background: '#F9FAFB',
        borderTop: '1px solid #E5E7EB',
        display: 'flex', gap: '2rem', fontSize: '0.6875rem',
        color: '#6B7280', flexWrap: 'wrap',
      }}>
        <span><i className="fas fa-mouse-pointer" style={{ marginRight: 6, color: '#00A19B' }}></i> Click teal-bordered cells to edit</span>
        <span><i className="fas fa-lock" style={{ marginRight: 6, color: '#059669' }}></i> Green = Approved by ABM (locked)</span>
        <span><i className="fas fa-clock" style={{ marginRight: 6, color: '#D97706' }}></i> Yellow = Pending ABM review (locked)</span>
        <span><i className="fas fa-undo" style={{ marginRight: 6, color: '#DC2626' }}></i> Red = Rejected — edit and resubmit</span>
        <span><i className="fas fa-keyboard" style={{ marginRight: 6 }}></i> Tab to move, Enter to confirm</span>
      </div>
    </div>
  );
}

export default TBMTargetEntryGrid;
