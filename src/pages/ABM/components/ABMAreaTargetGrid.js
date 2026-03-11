/**
 * ABMAreaTargetGrid Component
 *
 * Month-wise area target entry grid for the ABM role.
 * Mirrors TBMTerritoryTargetGrid structure but uses abm-tgt-* CSS classes
 * (abmAreaTargetGrid.css) for the blue/navy ABM colour scheme.
 *
 * Layout per product:
 *   [Product name | CY] [APR][MAY]...[MAR] [TOTAL] [YoY%]
 *   [            | LY] [apr][may]...[mar] [total]  [    ]
 *
 * Revenue-only categories (mis, others): single row, enter Rs value directly.
 *
 * FLOW: ABM enters area targets -> Save Draft -> Submit to ZBM
 *
 * @version 4.0.0 - full rewrite, abm-tgt-* CSS, subcategory + subgroup grouping
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Utils } from '../../../utils/helpers';
import '../../../styles/abm/abmAreaTargetGrid.css';

const MONTHS = ['apr','may','jun','jul','aug','sep','oct','nov','dec','jan','feb','mar'];
const MONTH_LABELS = ['APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC','JAN','FEB','MAR'];

const QUARTERS = [
  { id:'Q1', label:'Q1', months:['apr','may','jun'], color:'abm-tgt-q1' },
  { id:'Q2', label:'Q2', months:['jul','aug','sep'], color:'abm-tgt-q2' },
  { id:'Q3', label:'Q3', months:['oct','nov','dec'], color:'abm-tgt-q3' },
  { id:'Q4', label:'Q4', months:['jan','feb','mar'], color:'abm-tgt-q4' },
];

const REVENUE_ONLY_CATEGORIES = ['mis', 'others'];

const CAT_ICONS = {
  equipment: 'fa-microscope', iol: 'fa-eye', ovd: 'fa-tint',
  pharma: 'fa-pills', sutures: 'fa-band-aid',
  mis: 'fa-file-invoice-dollar', others: 'fa-ellipsis-h',
};

function ABMAreaTargetGrid({
  categories = [],
  products = [],
  onUpdateTarget,
  onSaveAll,
  onSubmitAll,
  fiscalYear = '2026-27',
  overallYearlyTargetValue = null,
  areaName = 'Area',
}) {
  const [activeCell, setActiveCell]               = useState(null);
  const [editValue, setEditValue]                 = useState('');
  const [expandedCats, setExpandedCats]           = useState(new Set(['equipment','iol','ovd']));
  const [expandedSubcats, setExpandedSubcats]     = useState(new Set());
  const [expandedSubgroups, setExpandedSubgroups] = useState(new Set());
  const [searchTerm, setSearchTerm]               = useState('');
  const [isLoading, setIsLoading]                 = useState(false);
  const [lastSaved, setLastSaved]                 = useState(null);

  const inputRef     = useRef(null);
  const searchRef    = useRef(null);

  useEffect(() => {
    if (activeCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [activeCell]);

  /* ── Filtered products ─────────────────────────────────────── */
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    const t = searchTerm.toLowerCase();
    return products.filter(p =>
      p.name?.toLowerCase().includes(t) ||
      p.code?.toLowerCase().includes(t) ||
      p.subcategory?.toLowerCase().includes(t) ||
      p.subgroup?.toLowerCase().includes(t)
    );
  }, [products, searchTerm]);

  /* ── Grouping helpers ──────────────────────────────────────── */
  const getSubcategories = useCallback((catId) => {
    const s = new Set();
    filteredProducts.filter(p => p.categoryId === catId).forEach(p => s.add(p.subcategory || '__none__'));
    return Array.from(s).sort();
  }, [filteredProducts]);

  const getSubgroups = useCallback((catId, subcat) => {
    const s = new Set();
    filteredProducts
      .filter(p => p.categoryId === catId && (p.subcategory || '__none__') === subcat)
      .forEach(p => s.add(p.subgroup || '__none__'));
    return Array.from(s).sort();
  }, [filteredProducts]);

  /* ── Calculations ──────────────────────────────────────────── */
  const yearlyTotal = useCallback((productId, year) => {
    const p = products.find(x => x.id === productId);
    if (!p) return 0;
    return MONTHS.reduce((s, m) => {
      const md = p.monthlyTargets?.[m] || {};
      return s + (year === 'CY' ? (md.cyQty || 0) : (md.lyQty || 0));
    }, 0);
  }, [products]);

  const productGrowth = useCallback((id) =>
    Utils.calcGrowth(yearlyTotal(id, 'LY'), yearlyTotal(id, 'CY')), [yearlyTotal]);

  const catTotal = useCallback((catId, year) =>
    products.filter(p => p.categoryId === catId).reduce((s, p) => s + yearlyTotal(p.id, year), 0),
  [products, yearlyTotal]);

  const catMonthTotal = useCallback((catId, month, year) =>
    products.filter(p => p.categoryId === catId).reduce((s, p) => {
      const md = p.monthlyTargets?.[month] || {};
      return s + (year === 'CY' ? (md.cyQty || 0) : (md.lyQty || 0));
    }, 0),
  [products]);

  const summary = useMemo(() => {
    let totalCYQty = 0, totalLYQty = 0, totalCYRev = 0;
    products.forEach(p => MONTHS.forEach(m => {
      const md = p.monthlyTargets?.[m] || {};
      totalCYQty += md.cyQty || 0;
      totalLYQty += md.lyQty || 0;
      totalCYRev += md.cyRev || 0;
    }));
    const quarterlyBreakdown = QUARTERS.map(q => {
      const cyQty = products.reduce((s, p) => s + q.months.reduce((ms, m) => ms + (p.monthlyTargets?.[m]?.cyQty || 0), 0), 0);
      const cyRev = products.reduce((s, p) => s + q.months.reduce((ms, m) => ms + (p.monthlyTargets?.[m]?.cyRev || 0), 0), 0);
      return { ...q, cyQty, cyRev };
    });
    const achievement = overallYearlyTargetValue ? (totalCYRev / overallYearlyTargetValue) * 100 : 0;
    return { totalCYQty, totalLYQty, totalCYRev, achievement, quarterlyBreakdown, growth: Utils.calcGrowth(totalLYQty, totalCYQty) };
  }, [products, overallYearlyTargetValue]);

  /* ── Toggles ───────────────────────────────────────────────── */
  const toggleCat = (id) => setExpandedCats(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSubcat = (k) => setExpandedSubcats(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const toggleSubgroup = (k) => setExpandedSubgroups(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; });

  /* ── Cell handlers ─────────────────────────────────────────── */
  const handleCellClick = (productId, month, cur) => {
    setActiveCell({ productId, month });
    setEditValue(cur?.toString() || '');
  };
  const handleCellChange = (e) => setEditValue(e.target.value.replace(/[^0-9]/g, ''));
  const handleCellBlur = () => {
    if (activeCell) {
      onUpdateTarget?.(activeCell.productId, activeCell.month, parseInt(editValue) || 0);
      setActiveCell(null);
      setEditValue('');
    }
  };
  const handleCellKeyDown = (e) => {
    if (e.key === 'Enter') { handleCellBlur(); }
    else if (e.key === 'Escape') { setActiveCell(null); setEditValue(''); }
    else if (e.key === 'Tab') {
      e.preventDefault();
      handleCellBlur();
      if (activeCell) {
        const idx = MONTHS.indexOf(activeCell.month);
        if (idx < MONTHS.length - 1) {
          const p = products.find(x => x.id === activeCell.productId);
          if (p) {
            const nm = MONTHS[idx + 1];
            setActiveCell({ productId: activeCell.productId, month: nm });
            setEditValue((p.monthlyTargets?.[nm]?.cyQty || 0).toString());
          }
        }
      }
    }
  };

  /* ── Save / Submit ─────────────────────────────────────────── */
  const handleSave = async () => {
    setIsLoading(true);
    try { if (onSaveAll) await onSaveAll(); setLastSaved(new Date()); }
    catch (e) { console.error('Save failed', e); }
    setIsLoading(false);
  };
  const handleSubmit = async () => {
    setIsLoading(true);
    try { if (onSubmitAll) await onSubmitAll(); }
    catch (e) { console.error('Submit failed', e); }
    setIsLoading(false);
  };

  /* ── Highlight ─────────────────────────────────────────────── */
  const highlight = (text, term) => {
    if (!term?.trim() || !text) return text;
    const re = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi');
    return text.split(re).map((p, i) => re.test(p) ? <mark key={i}>{p}</mark> : p);
  };

  const catIcon = (id) => CAT_ICONS[id] || 'fa-box';

  /* ══════════════════════════════════════════════════════════════
     Product row: CY (editable) + LY (read-only)
     ══════════════════════════════════════════════════════════════ */
  const renderProductRow = (product) => {
    const cyTotal = yearlyTotal(product.id, 'CY');
    const lyTotal = yearlyTotal(product.id, 'LY');
    const g = productGrowth(product.id);
    return (
      <div key={product.id}>
        {/* CY Row */}
        <div className="abm-tgt-grid-row">
          <div className="abm-tgt-product-cell">
            <span title={product.name}>{highlight(product.name, searchTerm)}</span>
            {product.code && (
              <span style={{ display:'block', fontSize:'0.7rem', color:'#9CA3AF' }}>{product.code}</span>
            )}
          </div>
          <div className="abm-tgt-type-cell abm-tgt-cy-label">CY</div>
          {MONTHS.map(m => {
            const md = product.monthlyTargets?.[m] || {};
            const isActive = activeCell?.productId === product.id && activeCell?.month === m;
            return (
              <div
                key={m}
                className={`abm-tgt-month-cell abm-tgt-editable${isActive ? ' abm-tgt-active-cell' : ''}`}
                onClick={() => handleCellClick(product.id, m, md.cyQty)}
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
                  <span className="abm-tgt-cell-value">{Utils.formatNumber(md.cyQty || 0)}</span>
                )}
              </div>
            );
          })}
          <div className="abm-tgt-total-cell abm-tgt-cy-total">{Utils.formatNumber(cyTotal)}</div>
          <div className="abm-tgt-growth-cell">
            <span className={`abm-tgt-growth-badge ${g >= 0 ? 'positive' : 'negative'}`}>
              {Utils.formatGrowth(g)}
            </span>
          </div>
        </div>

        {/* LY Row */}
        <div className="abm-tgt-grid-row abm-tgt-ly-row">
          <div className="abm-tgt-product-cell" style={{ visibility:'hidden' }}></div>
          <div className="abm-tgt-type-cell abm-tgt-ly-label">LY</div>
          {MONTHS.map(m => {
            const md = product.monthlyTargets?.[m] || {};
            return (
              <div key={m} className="abm-tgt-month-cell abm-tgt-ly">
                {Utils.formatNumber(md.lyQty || 0)}
              </div>
            );
          })}
          <div className="abm-tgt-total-cell abm-tgt-ly">{Utils.formatNumber(lyTotal)}</div>
          <div className="abm-tgt-growth-cell"></div>
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════
     Revenue-only category
     ══════════════════════════════════════════════════════════════ */
  const renderRevenueOnlyCategory = (category) => {
    const isExp = expandedCats.has(category.id);
    const catProducts = filteredProducts.filter(p => p.categoryId === category.id);
    const firstProduct = catProducts[0];
    if (catProducts.length === 0 && searchTerm) return null;

    return (
      <div key={category.id} className="abm-tgt-category-section">
        <div className="abm-tgt-category-header" onClick={() => toggleCat(category.id)}>
          <div className="abm-tgt-category-name">
            <i className={`fas fa-chevron-${isExp ? 'down' : 'right'} abm-tgt-chevron`}></i>
            <i className={`fas ${catIcon(category.id)} abm-tgt-cat-icon`}></i>
            {category.name}
            <span className="abm-tgt-revenue-badge">Revenue Only</span>
          </div>
          <div className="abm-tgt-category-summary">
            <span className="abm-tgt-cat-total">revenue entries</span>
          </div>
        </div>

        {isExp && firstProduct && (
          <div className="abm-tgt-revenue-grid">
            {/* Header */}
            <div className="abm-tgt-revenue-row abm-tgt-row-header">
              <div className="abm-tgt-header" style={{ paddingLeft:'1.5rem', textAlign:'left' }}>CY Revenue (Rs)</div>
              {MONTH_LABELS.map((label, idx) => (
                <div key={label} className={`abm-tgt-header ${QUARTERS[Math.floor(idx/3)].color}`}>{label}</div>
              ))}
              <div className="abm-tgt-header">TOTAL</div>
              <div className="abm-tgt-header">YoY</div>
            </div>

            {/* CY Revenue */}
            <div className="abm-tgt-revenue-row">
              <div className="abm-tgt-product-cell">{highlight(firstProduct.name, searchTerm)}</div>
              {MONTHS.map(m => {
                const md = firstProduct.monthlyTargets?.[m] || {};
                const isActive = activeCell?.productId === firstProduct.id && activeCell?.month === m;
                return (
                  <div
                    key={m}
                    className={`abm-tgt-month-cell abm-tgt-editable${isActive ? ' abm-tgt-active-cell' : ''}`}
                    onClick={() => handleCellClick(firstProduct.id, m, md.cyRev)}
                  >
                    {isActive ? (
                      <input ref={inputRef} type="text" className="abm-tgt-cell-input"
                        value={editValue} onChange={handleCellChange}
                        onBlur={handleCellBlur} onKeyDown={handleCellKeyDown}
                      />
                    ) : (
                      <span className="abm-tgt-cell-value">{Utils.formatCompact(md.cyRev || 0)}</span>
                    )}
                  </div>
                );
              })}
              <div className="abm-tgt-total-cell abm-tgt-cy-total">
                Rs{Utils.formatCompact(MONTHS.reduce((s, m) => s + (firstProduct.monthlyTargets?.[m]?.cyRev || 0), 0))}
              </div>
              <div className="abm-tgt-growth-cell">-</div>
            </div>

            {/* LY Revenue */}
            <div className="abm-tgt-revenue-row abm-tgt-ly-row">
              <div className="abm-tgt-product-cell" style={{ fontSize:'0.75rem', color:'#9CA3AF' }}>LY Revenue</div>
              {MONTHS.map(m => {
                const md = firstProduct.monthlyTargets?.[m] || {};
                return <div key={m} className="abm-tgt-month-cell abm-tgt-ly">{Utils.formatCompact(md.lyRev || 0)}</div>;
              })}
              <div className="abm-tgt-total-cell abm-tgt-ly">
                Rs{Utils.formatCompact(MONTHS.reduce((s, m) => s + (firstProduct.monthlyTargets?.[m]?.lyRev || 0), 0))}
              </div>
              <div className="abm-tgt-growth-cell"></div>
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════
     Standard category: subcategory > subgroup > products
     ══════════════════════════════════════════════════════════════ */
  const renderCategory = (category) => {
    const isExp = expandedCats.has(category.id);
    const catProducts = filteredProducts.filter(p => p.categoryId === category.id);
    const cyCatTotal = catTotal(category.id, 'CY');
    const lyCatTotal = catTotal(category.id, 'LY');
    const catGrowth  = Utils.calcGrowth(lyCatTotal, cyCatTotal);
    const subcats    = getSubcategories(category.id);

    if (catProducts.length === 0 && searchTerm) return null;

    return (
      <div key={category.id} className="abm-tgt-category-section">
        {/* Category header */}
        <div className="abm-tgt-category-header" onClick={() => toggleCat(category.id)}>
          <div className="abm-tgt-category-name">
            <i className={`fas fa-chevron-${isExp ? 'down' : 'right'} abm-tgt-chevron`}></i>
            <i className={`fas ${catIcon(category.id)} abm-tgt-cat-icon`}></i>
            {category.name}
            <span className="abm-tgt-product-count">({catProducts.length} products)</span>
          </div>
          <div className="abm-tgt-category-summary">
            <span className="abm-tgt-cat-total">CY {Utils.formatNumber(cyCatTotal)} | LY {Utils.formatNumber(lyCatTotal)}</span>
            <span className={`abm-tgt-cat-growth ${catGrowth >= 0 ? 'positive' : 'negative'}`}>
              {Utils.formatGrowth(catGrowth)}
            </span>
          </div>
        </div>

        {isExp && (
          <div className="abm-tgt-grid-table">
            {/* Column headers */}
            <div className="abm-tgt-grid-row abm-tgt-grid-header-row">
              <div className="abm-tgt-header" style={{ paddingLeft:'1.5rem', textAlign:'left' }}>Product / Area Target</div>
              <div className="abm-tgt-header"></div>
              {MONTH_LABELS.map((label, idx) => (
                <div key={label} className={`abm-tgt-header ${QUARTERS[Math.floor(idx/3)].color}`}>{label}</div>
              ))}
              <div className="abm-tgt-header">TOTAL</div>
              <div className="abm-tgt-header">YoY</div>
            </div>

            {/* Category totals row */}
            <div className="abm-tgt-grid-row" style={{ background:'#EFF6FF', borderBottom:'2px solid #BFDBFE' }}>
              <div className="abm-tgt-product-cell" style={{ fontWeight:700, color:'#1E40AF' }}>
                <i className="fas fa-calculator" style={{ marginRight:4, opacity:0.6 }}></i>Area Totals
              </div>
              <div className="abm-tgt-type-cell"></div>
              {MONTHS.map(m => (
                <div key={m} className="abm-tgt-month-cell" style={{ fontWeight:700, color:'#1E40AF' }}>
                  {Utils.formatNumber(catMonthTotal(category.id, m, 'CY'))}
                </div>
              ))}
              <div className="abm-tgt-total-cell" style={{ color:'#1E40AF' }}>{Utils.formatNumber(cyCatTotal)}</div>
              <div className="abm-tgt-growth-cell">
                <span className={`abm-tgt-growth-badge ${catGrowth >= 0 ? 'positive' : 'negative'}`}>
                  {Utils.formatGrowth(catGrowth)}
                </span>
              </div>
            </div>

            {/* Subcategory > subgroup > product rows */}
            {subcats.map(subcatKey => {
              const subcatLabel = subcatKey === '__none__' ? null : subcatKey;
              const subgroups = getSubgroups(category.id, subcatKey);
              const subcatExpandKey = `${category.id}__${subcatKey}`;
              const isSubcatExp = !expandedSubcats.has(subcatExpandKey);

              return (
                <div key={subcatKey}>
                  {subcatLabel && (
                    <div
                      className="abm-tgt-grid-row"
                      style={{ background:'#F1F5F9', cursor:'pointer', borderBottom:'1px solid #E2E8F0' }}
                      onClick={() => toggleSubcat(subcatExpandKey)}
                    >
                      <div className="abm-tgt-product-cell" style={{ fontWeight:600, color:'#475569', fontSize:'0.8rem', paddingLeft:'2rem' }}>
                        <i className={`fas fa-chevron-${isSubcatExp ? 'down' : 'right'}`} style={{ marginRight:6, fontSize:'0.625rem' }}></i>
                        {highlight(subcatLabel, searchTerm)}
                      </div>
                      <div className="abm-tgt-type-cell"></div>
                      {MONTHS.map(m => <div key={m} className="abm-tgt-month-cell"></div>)}
                      <div className="abm-tgt-total-cell"></div>
                      <div className="abm-tgt-growth-cell"></div>
                    </div>
                  )}

                  {(subcatLabel ? isSubcatExp : true) && subgroups.map(subgroupKey => {
                    const subgroupLabel = subgroupKey === '__none__' ? null : subgroupKey;
                    const subgroupExpandKey = `${category.id}__${subcatKey}__${subgroupKey}`;
                    const isSubgroupExp = !expandedSubgroups.has(subgroupExpandKey);
                    const groupProducts = filteredProducts.filter(p =>
                      p.categoryId === category.id &&
                      (p.subcategory || '__none__') === subcatKey &&
                      (p.subgroup || '__none__') === subgroupKey
                    );

                    return (
                      <div key={subgroupKey}>
                        {subgroupLabel && (
                          <div
                            className="abm-tgt-grid-row"
                            style={{ background:'#F8FAFC', cursor:'pointer', borderBottom:'1px solid #E2E8F0' }}
                            onClick={() => toggleSubgroup(subgroupExpandKey)}
                          >
                            <div className="abm-tgt-product-cell" style={{ fontWeight:500, color:'#64748B', fontSize:'0.775rem', paddingLeft:'3rem' }}>
                              <i className={`fas fa-chevron-${isSubgroupExp ? 'down' : 'right'}`} style={{ marginRight:6, fontSize:'0.6rem' }}></i>
                              {highlight(subgroupLabel, searchTerm)}
                            </div>
                            <div className="abm-tgt-type-cell"></div>
                            {MONTHS.map(m => <div key={m} className="abm-tgt-month-cell"></div>)}
                            <div className="abm-tgt-total-cell"></div>
                            <div className="abm-tgt-growth-cell"></div>
                          </div>
                        )}
                        {(subgroupLabel ? isSubgroupExp : true) && groupProducts.map(renderProductRow)}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════
     Main render
     ══════════════════════════════════════════════════════════════ */
  return (
    <div className="abm-tgt-container">

      {/* HEADER */}
      <div className="abm-tgt-grid-header">
        <div className="abm-tgt-grid-title">
          <div className="abm-tgt-title-left">
            <div className="abm-tgt-area-icon"><i className="fas fa-map-marked-alt"></i></div>
            <div>
              <h2><i className="fas fa-table"></i> Area Target Entry</h2>
              <span className="abm-tgt-area-name">{areaName}</span>
            </div>
          </div>
          <span className="abm-tgt-fiscal-year">FY {fiscalYear}</span>
        </div>

        <div className="abm-tgt-info-banner">
          <i className="fas fa-info-circle"></i>
          <span>
            Enter your <strong>area-level</strong> monthly targets below.
            These represent the combined commitment for your entire area.
            Once submitted, targets go to <strong>ZBM</strong> for approval.
          </span>
        </div>

        <div className="abm-tgt-grid-actions">
          {lastSaved && (
            <span className="abm-tgt-last-saved">
              <i className="fas fa-check-circle"></i> Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <button className="abm-tgt-action-btn abm-tgt-save" onClick={handleSave} disabled={isLoading}>
            {isLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
            {' '}Save Draft
          </button>
          <button className="abm-tgt-action-btn abm-tgt-submit" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
            {' '}Submit to ZBM
          </button>
        </div>
      </div>

      {/* SUMMARY BAR */}
      <div className="abm-tgt-overall-bar">
        <div className="abm-tgt-otb-main">
          <div className="abm-tgt-otb-card">
            <div className="abm-tgt-otb-icon"><i className="fas fa-flag-checkered"></i></div>
            <div className="abm-tgt-otb-content">
              <span className="abm-tgt-otb-label">Area Target (FY {fiscalYear})</span>
              <span className="abm-tgt-otb-value">
                {overallYearlyTargetValue ? Utils.formatShortCurrency(overallYearlyTargetValue) : 'Not Set'}
              </span>
            </div>
          </div>
          <div className="abm-tgt-otb-card">
            <div className="abm-tgt-otb-icon abm-tgt-qty-icon"><i className="fas fa-cubes"></i></div>
            <div className="abm-tgt-otb-content">
              <span className="abm-tgt-otb-label">Total Qty (CY vs LY)</span>
              <span className="abm-tgt-otb-value">
                {Utils.formatNumber(summary.totalCYQty)}
                <span style={{ fontSize:'0.75rem', color:'#9CA3AF', fontWeight:500, marginLeft:6 }}>
                  vs {Utils.formatNumber(summary.totalLYQty)}
                </span>
              </span>
            </div>
          </div>
          <div className="abm-tgt-otb-card">
            <div className="abm-tgt-otb-icon abm-tgt-committed-icon"><i className="fas fa-hand-holding-usd"></i></div>
            <div className="abm-tgt-otb-content">
              <span className="abm-tgt-otb-label">Committed Revenue</span>
              <span className="abm-tgt-otb-value">{Utils.formatShortCurrency(summary.totalCYRev)}</span>
            </div>
          </div>
          <div className="abm-tgt-otb-card">
            <div className="abm-tgt-otb-icon abm-tgt-growth-icon"><i className="fas fa-chart-line"></i></div>
            <div className="abm-tgt-otb-content">
              <span className="abm-tgt-otb-label">YoY Growth</span>
              <span className={`abm-tgt-otb-value ${summary.growth >= 0 ? 'positive' : 'negative'}`}>
                {summary.growth >= 0 ? 'up' : 'dn'} {Utils.formatGrowth(summary.growth)}
              </span>
            </div>
          </div>
        </div>

        {overallYearlyTargetValue > 0 && (
          <div style={{ marginTop:'0.75rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.8125rem', color:'#4B5563', marginBottom:4 }}>
              <span>Area Completion</span>
              <span style={{ fontWeight:700 }}>{Math.round(summary.achievement)}%</span>
            </div>
            <div style={{ height:8, background:'#E5E7EB', borderRadius:4, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${Math.min(summary.achievement,100)}%`, background:'linear-gradient(90deg,#3B82F6,#2563EB)', borderRadius:4 }}></div>
            </div>
          </div>
        )}

        <div style={{ display:'flex', gap:'0.5rem', marginTop:'0.75rem', flexWrap:'wrap' }}>
          {summary.quarterlyBreakdown.map(q => (
            <div key={q.id} style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'0.5rem 0.875rem', background:'#fff', border:'1px solid #E5E7EB', borderRadius:8, minWidth:80 }}>
              <span style={{ fontSize:'0.75rem', fontWeight:700, color:'#6B7280' }}>{q.label}</span>
              <span style={{ fontSize:'1rem', fontWeight:800, color:'#1E40AF' }}>{Utils.formatNumber(q.cyQty)}</span>
              <span style={{ fontSize:'0.6875rem', color:'#9CA3AF' }}>{Utils.formatShortCurrency(q.cyRev)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SEARCH */}
      <div className="abm-tgt-search-bar">
        <div className="abm-tgt-search-input-wrapper">
          <i className="fas fa-search"></i>
          <input
            ref={searchRef}
            type="text"
            className="abm-tgt-search-input"
            placeholder="Search products, codes, categories..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') { setSearchTerm(''); searchRef.current?.blur(); } }}
          />
          {searchTerm && (
            <button className="abm-tgt-search-clear" onClick={() => { setSearchTerm(''); searchRef.current?.focus(); }}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
        <span className="abm-tgt-product-counter">{filteredProducts.length} products</span>
      </div>

      {/* CATEGORIES */}
      <div className="abm-tgt-categories">
        {categories.length === 0 && (
          <div style={{ padding:'3rem', textAlign:'center', color:'#9CA3AF' }}>
            <i className="fas fa-box-open" style={{ fontSize:'2rem', marginBottom:8, display:'block' }}></i>
            No products loaded yet.
          </div>
        )}
        {categories.map(cat =>
          REVENUE_ONLY_CATEGORIES.includes(cat.id)
            ? renderRevenueOnlyCategory(cat)
            : renderCategory(cat)
        )}
      </div>

    </div>
  );
}

export default ABMAreaTargetGrid;
