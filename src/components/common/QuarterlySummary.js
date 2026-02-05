/**
 * QuarterlySummary Component
 * Quarterly Summary - Unit Wise Dashboard for Sales Reps
 * Month-wise split under each quarter with quarter subtotals
 * 
 * @author Appasamy Associates - Product Commitment PWA
 * @version 1.1.0 - Month-wise breakdown
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ProductPricingService } from '../../services/productPricing';
import '../../styles/quarterlySummary.css';

// Constants
const QUARTERS = [
  { id: 'Q1', label: 'Q1', fullLabel: 'Apr – Jun', months: ['apr', 'may', 'jun'], monthLabels: ['APR', 'MAY', 'JUN'], color: '#3B82F6', bg: '#EFF6FF' },
  { id: 'Q2', label: 'Q2', fullLabel: 'Jul – Sep', months: ['jul', 'aug', 'sep'], monthLabels: ['JUL', 'AUG', 'SEP'], color: '#22C55E', bg: '#F0FDF4' },
  { id: 'Q3', label: 'Q3', fullLabel: 'Oct – Dec', months: ['oct', 'nov', 'dec'], monthLabels: ['OCT', 'NOV', 'DEC'], color: '#F59E0B', bg: '#FFFBEB' },
  { id: 'Q4', label: 'Q4', fullLabel: 'Jan – Mar', months: ['jan', 'feb', 'mar'], monthLabels: ['JAN', 'FEB', 'MAR'], color: '#EF4444', bg: '#FEF2F2' }
];

const MONTH_LABEL_MAP = {
  apr: 'APR', may: 'MAY', jun: 'JUN',
  jul: 'JUL', aug: 'AUG', sep: 'SEP',
  oct: 'OCT', nov: 'NOV', dec: 'DEC',
  jan: 'JAN', feb: 'FEB', mar: 'MAR'
};

const CATEGORY_CONFIG = {
  equipment: { icon: 'fa-microscope', gradient: 'linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)', lightBg: '#EFF6FF', accent: '#3B82F6' },
  iol: { icon: 'fa-eye', gradient: 'linear-gradient(135deg, #065F46 0%, #059669 100%)', lightBg: '#ECFDF5', accent: '#10B981' },
  ovd: { icon: 'fa-tint', gradient: 'linear-gradient(135deg, #7C2D12 0%, #EA580C 100%)', lightBg: '#FFF7ED', accent: '#F97316' },
  mis: { icon: 'fa-tools', gradient: 'linear-gradient(135deg, #581C87 0%, #9333EA 100%)', lightBg: '#FAF5FF', accent: '#A855F7' },
  others: { icon: 'fa-ellipsis-h', gradient: 'linear-gradient(135deg, #374151 0%, #6B7280 100%)', lightBg: '#F9FAFB', accent: '#6B7280' }
};

const formatCurrency = (amount) => {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString('en-IN')}`;
};

const formatNumber = (num) => num.toLocaleString('en-IN');

function QuarterlySummary({ products = [], categories = [], fiscalYear = '2026-27' }) {
  const [pricingMap, setPricingMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState(new Set(['equipment', 'iol', 'ovd']));
  const [selectedQuarter, setSelectedQuarter] = useState(null);
  const [viewMode, setViewMode] = useState('qty');

  useEffect(() => {
    const loadPricing = async () => {
      try {
        const map = await ProductPricingService.getPricingMap();
        setPricingMap(map);
      } catch (error) {
        console.error('Failed to load pricing:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPricing();
  }, []);

  // Calculate quarterly + monthly data for each product
  const quarterlySummaryData = useMemo(() => {
    if (!products.length) return {};
    const data = {};

    categories.forEach(cat => {
      const catProducts = products.filter(p => p.categoryId === cat.id);
      const isRevenueOnly = cat.isRevenueOnly;

      const productSummaries = catProducts.map(product => {
        const pricing = pricingMap[product.id] || { unitCost: 0, isRevenueOnly: false };
        const quarterData = {};
        const monthData = {};
        let fyTotalQty = 0, fyTotalValue = 0, lyFyTotalQty = 0, lyFyTotalValue = 0;

        QUARTERS.forEach(quarter => {
          let qtyTotal = 0, lyQtyTotal = 0, valueTotal = 0, lyValueTotal = 0;

          quarter.months.forEach(month => {
            const mt = product.monthlyTargets?.[month] || {};
            const cyQty = mt.cyQty || 0;
            const lyQty = mt.lyQty || 0;
            const cyRev = mt.cyRev || 0;
            const lyRev = mt.lyRev || 0;

            qtyTotal += cyQty;
            lyQtyTotal += lyQty;

            let monthValue, lyMonthValue;
            if (isRevenueOnly || pricing.isRevenueOnly) {
              monthValue = cyRev;
              lyMonthValue = lyRev;
            } else {
              monthValue = cyQty * pricing.unitCost;
              lyMonthValue = lyQty * pricing.unitCost;
            }
            valueTotal += monthValue;
            lyValueTotal += lyMonthValue;

            monthData[month] = { cyQty, lyQty, cyValue: monthValue, lyValue: lyMonthValue };
          });

          fyTotalQty += qtyTotal;
          fyTotalValue += valueTotal;
          lyFyTotalQty += lyQtyTotal;
          lyFyTotalValue += lyValueTotal;

          quarterData[quarter.id] = {
            cyQty: qtyTotal, lyQty: lyQtyTotal,
            cyValue: valueTotal, lyValue: lyValueTotal,
            growth: lyValueTotal > 0 ? ((valueTotal - lyValueTotal) / lyValueTotal) * 100 : 0
          };
        });

        return {
          id: product.id, name: product.name, code: product.code,
          subcategory: product.subcategory, status: product.status,
          unitCost: pricing.unitCost,
          isRevenueOnly: isRevenueOnly || pricing.isRevenueOnly,
          months: monthData, quarters: quarterData,
          fyTotal: { qty: fyTotalQty, value: fyTotalValue },
          lyFyTotal: { qty: lyFyTotalQty, value: lyFyTotalValue },
          fyGrowth: lyFyTotalValue > 0 ? ((fyTotalValue - lyFyTotalValue) / lyFyTotalValue) * 100 : 0
        };
      });

      // Category totals
      const categoryTotals = { months: {}, quarters: {}, fyTotal: { qty: 0, value: 0 }, lyFyTotal: { qty: 0, value: 0 } };
      QUARTERS.forEach(q => {
        categoryTotals.quarters[q.id] = { cyQty: 0, lyQty: 0, cyValue: 0, lyValue: 0 };
        q.months.forEach(m => { categoryTotals.months[m] = { cyQty: 0, lyQty: 0, cyValue: 0, lyValue: 0 }; });
      });

      productSummaries.forEach(ps => {
        Object.entries(ps.months).forEach(([m, md]) => {
          categoryTotals.months[m].cyQty += md.cyQty;
          categoryTotals.months[m].lyQty += md.lyQty;
          categoryTotals.months[m].cyValue += md.cyValue;
          categoryTotals.months[m].lyValue += md.lyValue;
        });
        QUARTERS.forEach(q => {
          categoryTotals.quarters[q.id].cyQty += ps.quarters[q.id].cyQty;
          categoryTotals.quarters[q.id].lyQty += ps.quarters[q.id].lyQty;
          categoryTotals.quarters[q.id].cyValue += ps.quarters[q.id].cyValue;
          categoryTotals.quarters[q.id].lyValue += ps.quarters[q.id].lyValue;
        });
        categoryTotals.fyTotal.qty += ps.fyTotal.qty;
        categoryTotals.fyTotal.value += ps.fyTotal.value;
        categoryTotals.lyFyTotal.qty += ps.lyFyTotal.qty;
        categoryTotals.lyFyTotal.value += ps.lyFyTotal.value;
      });

      categoryTotals.fyGrowth = categoryTotals.lyFyTotal.value > 0
        ? ((categoryTotals.fyTotal.value - categoryTotals.lyFyTotal.value) / categoryTotals.lyFyTotal.value) * 100 : 0;

      data[cat.id] = { category: cat, products: productSummaries, totals: categoryTotals };
    });
    return data;
  }, [products, categories, pricingMap]);

  // Grand totals
  const grandTotals = useMemo(() => {
    const totals = { months: {}, quarters: {}, fyTotal: { qty: 0, value: 0 }, lyFyTotal: { qty: 0, value: 0 } };
    QUARTERS.forEach(q => {
      totals.quarters[q.id] = { cyQty: 0, lyQty: 0, cyValue: 0, lyValue: 0 };
      q.months.forEach(m => { totals.months[m] = { cyQty: 0, lyQty: 0, cyValue: 0, lyValue: 0 }; });
    });
    Object.values(quarterlySummaryData).forEach(catData => {
      Object.entries(catData.totals.months).forEach(([m, md]) => {
        totals.months[m].cyQty += md.cyQty;
        totals.months[m].lyQty += md.lyQty;
        totals.months[m].cyValue += md.cyValue;
        totals.months[m].lyValue += md.lyValue;
      });
      QUARTERS.forEach(q => {
        totals.quarters[q.id].cyQty += catData.totals.quarters[q.id]?.cyQty || 0;
        totals.quarters[q.id].lyQty += catData.totals.quarters[q.id]?.lyQty || 0;
        totals.quarters[q.id].cyValue += catData.totals.quarters[q.id]?.cyValue || 0;
        totals.quarters[q.id].lyValue += catData.totals.quarters[q.id]?.lyValue || 0;
      });
      totals.fyTotal.qty += catData.totals.fyTotal.qty;
      totals.fyTotal.value += catData.totals.fyTotal.value;
      totals.lyFyTotal.qty += catData.totals.lyFyTotal.qty;
      totals.lyFyTotal.value += catData.totals.lyFyTotal.value;
    });
    totals.fyGrowth = totals.lyFyTotal.value > 0
      ? ((totals.fyTotal.value - totals.lyFyTotal.value) / totals.lyFyTotal.value) * 100 : 0;
    return totals;
  }, [quarterlySummaryData]);

  const toggleCategory = (catId) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId); else next.add(catId);
      return next;
    });
  };

  const getGrowthClass = (growth) => {
    if (growth > 10) return 'growth-high';
    if (growth > 0) return 'growth-positive';
    if (growth === 0) return 'growth-neutral';
    return 'growth-negative';
  };

  const getStatusDot = (status) => {
    const colors = { draft: '#94A3B8', submitted: '#F59E0B', approved: '#10B981', rejected: '#EF4444' };
    const labels = { draft: 'Draft', submitted: 'Submitted', approved: 'Approved', rejected: 'Rejected' };
    return <span className="qs-status-dot" style={{ background: colors[status] || '#94A3B8' }} title={labels[status] || 'Draft'}></span>;
  };

  const getCellVal = (data, isRevOnly) => {
    if (!data) return 0;
    if (viewMode === 'qty' && !isRevOnly) return data.cyQty || 0;
    return data.cyValue || 0;
  };
  const getLyCellVal = (data, isRevOnly) => {
    if (!data) return 0;
    if (viewMode === 'qty' && !isRevOnly) return data.lyQty || 0;
    return data.lyValue || 0;
  };
  const fmtVal = (val, isRevOnly) => {
    if (viewMode === 'qty' && !isRevOnly) return formatNumber(val);
    return formatCurrency(val);
  };

  if (isLoading) {
    return (
      <div className="qs-loading">
        <div className="qs-loading-spinner"></div>
        <p>Loading quarterly summary...</p>
      </div>
    );
  }

  const displayQuarters = selectedQuarter ? QUARTERS.filter(q => q.id === selectedQuarter) : QUARTERS;

  return (
    <div className="qs-container">
      {/* ==================== HEADER ==================== */}
      <div className="qs-header">
        <div className="qs-header-left">
          <h2 className="qs-title">
            <i className="fas fa-chart-bar"></i>
            Quarterly Summary — Unit Wise
          </h2>
          <span className="qs-fiscal-badge">FY {fiscalYear}</span>
        </div>
        <div className="qs-header-controls">
          <div className="qs-view-toggle">
            <button className={`qs-toggle-btn ${viewMode === 'value' ? 'active' : ''}`} onClick={() => setViewMode('value')}>
              <i className="fas fa-rupee-sign"></i> Value
            </button>
            <button className={`qs-toggle-btn ${viewMode === 'qty' ? 'active' : ''}`} onClick={() => setViewMode('qty')}>
              <i className="fas fa-cubes"></i> Quantity
            </button>
          </div>
          <div className="qs-quarter-filter">
            <button className={`qs-qfilter-btn ${selectedQuarter === null ? 'active' : ''}`} onClick={() => setSelectedQuarter(null)}>All</button>
            {QUARTERS.map(q => (
              <button key={q.id} className={`qs-qfilter-btn ${selectedQuarter === q.id ? 'active' : ''}`}
                style={{ '--q-color': q.color }} onClick={() => setSelectedQuarter(selectedQuarter === q.id ? null : q.id)}>
                {q.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ==================== GRAND TOTAL CARDS ==================== */}
      <div className="qs-grand-totals">
        <div className="qs-grand-card qs-grand-fy">
          <div className="qs-grand-card-header">
            <span className="qs-grand-label">FY {fiscalYear} Target</span>
            <span className={`qs-growth-badge ${getGrowthClass(grandTotals.fyGrowth)}`}>
              <i className={`fas fa-arrow-${grandTotals.fyGrowth >= 0 ? 'up' : 'down'}`}></i>
              {Math.abs(grandTotals.fyGrowth).toFixed(1)}%
            </span>
          </div>
          <div className="qs-grand-value">{formatCurrency(grandTotals.fyTotal.value)}</div>
          <div className="qs-grand-sub">Total Units: {formatNumber(grandTotals.fyTotal.qty)}</div>
        </div>
        {QUARTERS.map(q => (
          <div key={q.id} className="qs-grand-card qs-grand-quarter" style={{ '--q-color': q.color }}>
            <div className="qs-grand-card-header">
              <span className="qs-grand-label">{q.label} ({q.fullLabel})</span>
            </div>
            <div className="qs-grand-value">{formatCurrency(grandTotals.quarters[q.id]?.cyValue || 0)}</div>
            <div className="qs-grand-months-mini">
              {q.months.map(m => (
                <div key={m} className="qs-mini-month">
                  <span className="qs-mini-month-label">{MONTH_LABEL_MAP[m]}</span>
                  <span className="qs-mini-month-val">{formatCurrency(grandTotals.months[m]?.cyValue || 0)}</span>
                </div>
              ))}
            </div>
            <div className="qs-grand-sub">
              Units: {formatNumber(grandTotals.quarters[q.id]?.cyQty || 0)}
              <span className="qs-ly-compare">LY: {formatCurrency(grandTotals.quarters[q.id]?.lyValue || 0)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ==================== CATEGORY SECTIONS ==================== */}
      {Object.entries(quarterlySummaryData).map(([catId, catData]) => {
        const config = CATEGORY_CONFIG[catId] || CATEGORY_CONFIG.others;
        const isExpanded = expandedCategories.has(catId);
        const cat = catData.category;
        const isRevOnly = cat.isRevenueOnly;

        return (
          <div key={catId} className="qs-category-section">
            <div className="qs-category-header" style={{ background: config.gradient }} onClick={() => toggleCategory(catId)}>
              <div className="qs-cat-header-left">
                <i className={`fas ${config.icon} qs-cat-icon`}></i>
                <div>
                  <h3 className="qs-cat-name">{cat.name}</h3>
                  <span className="qs-cat-count">{catData.products.length} products</span>
                </div>
              </div>
              <div className="qs-cat-header-right">
                <div className="qs-cat-total">
                  <span className="qs-cat-total-label">FY Total</span>
                  <span className="qs-cat-total-value">{formatCurrency(catData.totals.fyTotal.value)}</span>
                </div>
                {!isRevOnly && (
                  <div className="qs-cat-total">
                    <span className="qs-cat-total-label">Total Units</span>
                    <span className="qs-cat-total-value">{formatNumber(catData.totals.fyTotal.qty)}</span>
                  </div>
                )}
                <span className={`qs-growth-badge light ${getGrowthClass(catData.totals.fyGrowth)}`}>
                  <i className={`fas fa-arrow-${catData.totals.fyGrowth >= 0 ? 'up' : 'down'}`}></i>
                  {Math.abs(catData.totals.fyGrowth).toFixed(1)}%
                </span>
                <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} qs-expand-icon`}></i>
              </div>
            </div>

            {isExpanded && (
              <div className="qs-category-body" style={{ '--cat-accent': config.accent, '--cat-bg': config.lightBg }}>
                <div className="qs-table-wrapper">
                  <table className="qs-table">
                    <thead>
                      {/* Row 1: Quarter group headers spanning 3 months + 1 subtotal */}
                      <tr className="qs-table-quarter-row">
                        <th className="qs-th-product" rowSpan="2">Product</th>
                        {!isRevOnly && <th className="qs-th-unit-cost" rowSpan="2">Unit Cost</th>}
                        {displayQuarters.map(q => (
                          <th key={q.id} className="qs-th-quarter-group" colSpan={4} style={{ '--q-color': q.color, '--q-bg': q.bg }}>
                            <div className="qs-th-quarter-inner">
                              <span className="qs-th-q-label">{q.label}</span>
                              <span className="qs-th-q-months">{q.fullLabel}</span>
                            </div>
                          </th>
                        ))}
                        <th className="qs-th-fy-total" rowSpan="2">FY Total</th>
                        <th className="qs-th-growth" rowSpan="2">Growth</th>
                      </tr>

                      {/* Row 2: Individual month headers + Qn Total */}
                      <tr className="qs-table-month-row">
                        {displayQuarters.map(q => (
                          <React.Fragment key={q.id}>
                            {q.months.map(m => (
                              <th key={m} className="qs-th-month" style={{ '--q-color': q.color, '--q-bg': q.bg }}>
                                {MONTH_LABEL_MAP[m]}
                              </th>
                            ))}
                            <th className="qs-th-q-subtotal" style={{ '--q-color': q.color, '--q-bg': q.bg }}>
                              {q.label}
                            </th>
                          </React.Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {catData.products.map(product => (
                        <tr key={product.id} className="qs-product-row">
                          <td className="qs-td-product">
                            <div className="qs-product-info">
                              {getStatusDot(product.status)}
                              <div>
                                <span className="qs-product-name">{product.name}</span>
                                <span className="qs-product-code">{product.code}</span>
                              </div>
                            </div>
                          </td>
                          {!isRevOnly && (
                            <td className="qs-td-unit-cost">
                              <span className="qs-unit-cost-val">₹{formatNumber(product.unitCost)}</span>
                            </td>
                          )}
                          {displayQuarters.map(q => (
                            <React.Fragment key={q.id}>
                              {q.months.map(m => {
                                const md = product.months[m];
                                return (
                                  <td key={m} className="qs-td-month" style={{ '--q-bg': q.bg }}>
                                    <div className="qs-month-cell">
                                      <span className="qs-month-cy">{fmtVal(getCellVal(md, isRevOnly), isRevOnly)}</span>
                                      <span className="qs-month-ly">{fmtVal(getLyCellVal(md, isRevOnly), isRevOnly)}</span>
                                    </div>
                                  </td>
                                );
                              })}
                              <td className="qs-td-q-subtotal" style={{ '--q-color': q.color, '--q-bg': q.bg }}>
                                <div className="qs-q-subtotal-cell">
                                  <span className="qs-qsub-cy">{fmtVal(getCellVal(product.quarters[q.id], isRevOnly), isRevOnly)}</span>
                                  <span className="qs-qsub-ly">{fmtVal(getLyCellVal(product.quarters[q.id], isRevOnly), isRevOnly)}</span>
                                </div>
                              </td>
                            </React.Fragment>
                          ))}
                          <td className="qs-td-fy-total">
                            <div className="qs-fy-cell">
                              <span className="qs-fy-cy">
                                {viewMode === 'qty' && !isRevOnly ? formatNumber(product.fyTotal.qty) : formatCurrency(product.fyTotal.value)}
                              </span>
                              <span className="qs-fy-ly">
                                {viewMode === 'qty' && !isRevOnly ? formatNumber(product.lyFyTotal.qty) : formatCurrency(product.lyFyTotal.value)}
                              </span>
                            </div>
                          </td>
                          <td className="qs-td-growth">
                            <span className={`qs-growth-pill ${getGrowthClass(product.fyGrowth)}`}>
                              <i className={`fas fa-arrow-${product.fyGrowth >= 0 ? 'up' : 'down'}`}></i>
                              {Math.abs(product.fyGrowth).toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}

                      {/* Category Total Row */}
                      <tr className="qs-total-row">
                        <td className="qs-td-product">
                          <span className="qs-total-label"><i className="fas fa-sigma"></i> {cat.name} Total</span>
                        </td>
                        {!isRevOnly && <td className="qs-td-unit-cost"></td>}
                        {displayQuarters.map(q => (
                          <React.Fragment key={q.id}>
                            {q.months.map(m => {
                              const md = catData.totals.months[m];
                              return (
                                <td key={m} className="qs-td-month qs-td-total-month" style={{ '--q-bg': q.bg }}>
                                  <div className="qs-month-cell">
                                    <span className="qs-month-cy qs-val-total">{fmtVal(getCellVal(md, isRevOnly), isRevOnly)}</span>
                                    <span className="qs-month-ly">{fmtVal(getLyCellVal(md, isRevOnly), isRevOnly)}</span>
                                  </div>
                                </td>
                              );
                            })}
                            <td className="qs-td-q-subtotal qs-td-total-q" style={{ '--q-color': q.color, '--q-bg': q.bg }}>
                              <div className="qs-q-subtotal-cell">
                                <span className="qs-qsub-cy qs-val-total">{fmtVal(getCellVal(catData.totals.quarters[q.id], isRevOnly), isRevOnly)}</span>
                                <span className="qs-qsub-ly">{fmtVal(getLyCellVal(catData.totals.quarters[q.id], isRevOnly), isRevOnly)}</span>
                              </div>
                            </td>
                          </React.Fragment>
                        ))}
                        <td className="qs-td-fy-total qs-td-total-fy">
                          <div className="qs-fy-cell">
                            <span className="qs-fy-cy qs-val-total">
                              {viewMode === 'qty' && !isRevOnly ? formatNumber(catData.totals.fyTotal.qty) : formatCurrency(catData.totals.fyTotal.value)}
                            </span>
                            <span className="qs-fy-ly">
                              {viewMode === 'qty' && !isRevOnly ? formatNumber(catData.totals.lyFyTotal.qty) : formatCurrency(catData.totals.lyFyTotal.value)}
                            </span>
                          </div>
                        </td>
                        <td className="qs-td-growth">
                          <span className={`qs-growth-pill ${getGrowthClass(catData.totals.fyGrowth)}`}>
                            <i className={`fas fa-arrow-${catData.totals.fyGrowth >= 0 ? 'up' : 'down'}`}></i>
                            {Math.abs(catData.totals.fyGrowth).toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* ==================== GRAND TOTAL FOOTER ==================== */}
      <div className="qs-grand-footer">
        <div className="qs-grand-footer-inner">
          <div className="qs-grand-footer-label">
            <i className="fas fa-calculator"></i>
            Grand Total — All Categories
          </div>
          <div className="qs-grand-footer-values">
            {displayQuarters.map(q => (
              <div key={q.id} className="qs-grand-footer-q" style={{ '--q-color': q.color }}>
                <span className="qs-gf-q-label">{q.label} ({q.fullLabel})</span>
                <div className="qs-gf-months-row">
                  {q.months.map(m => (
                    <div key={m} className="qs-gf-month-item">
                      <span className="qs-gf-month-name">{MONTH_LABEL_MAP[m]}</span>
                      <span className="qs-gf-month-val">{formatCurrency(grandTotals.months[m]?.cyValue || 0)}</span>
                      <span className="qs-gf-month-units">{formatNumber(grandTotals.months[m]?.cyQty || 0)}</span>
                    </div>
                  ))}
                </div>
                <div className="qs-gf-q-total-row">
                  <span className="qs-gf-q-value">{formatCurrency(grandTotals.quarters[q.id]?.cyValue || 0)}</span>
                  <span className="qs-gf-q-units">{formatNumber(grandTotals.quarters[q.id]?.cyQty || 0)} units</span>
                </div>
              </div>
            ))}
            <div className="qs-grand-footer-fy">
              <span className="qs-gf-q-label">FY Total</span>
              <span className="qs-gf-fy-value">{formatCurrency(grandTotals.fyTotal.value)}</span>
              <span className="qs-gf-q-units">{formatNumber(grandTotals.fyTotal.qty)} units</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuarterlySummary;
