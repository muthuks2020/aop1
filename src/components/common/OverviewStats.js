/**
 * Sales Rep Overview Dashboard
 * Meaningful KPIs for sales performance tracking
 * Removes generic product status cards — focuses on targets, revenue, growth
 * 
 * @author Appasamy Associates - Product Commitment PWA
 * @version 3.0.0 - Sales-focused redesign
 * 
 * API INTEGRATION NOTES:
 * - All data currently computed from props (products, categories)
 * - Replace with API calls when backend is ready:
 *   GET /api/v1/salesrep/dashboard-summary
 *   GET /api/v1/salesrep/monthly-trends
 *   GET /api/v1/salesrep/category-performance
 *   GET /api/v1/salesrep/top-products
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Utils } from '../../utils/helpers';
import '../../styles/overviewDashboard.css';

// Fiscal year months in order
const MONTHS = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];
const MONTH_LABELS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
const QUARTER_MONTHS = {
  Q1: ['apr', 'may', 'jun'],
  Q2: ['jul', 'aug', 'sep'],
  Q3: ['oct', 'nov', 'dec'],
  Q4: ['jan', 'feb', 'mar']
};

function OverviewStats({ products, categories }) {
  const [animateIn, setAnimateIn] = useState(false);
  const [activeQuarter, setActiveQuarter] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setAnimateIn(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // ==================== COMPUTED DATA ====================
  // TODO: Replace these computations with API responses when backend is ready.
  // Expected API endpoint: GET /api/v1/salesrep/dashboard-summary
  
  const overallTotals = useMemo(() => {
    let lyQty = 0, cyQty = 0, lyRev = 0, cyRev = 0;
    products.forEach(p => {
      if (p.monthlyTargets) {
        Object.values(p.monthlyTargets).forEach(m => {
          lyQty += m.lyQty || 0;
          cyQty += m.cyQty || 0;
          lyRev += m.lyRev || 0;
          cyRev += m.cyRev || 0;
        });
      }
    });
    return {
      lyQty, cyQty, lyRev, cyRev,
      qtyGrowth: Utils.calcGrowth(lyQty, cyQty),
      revGrowth: Utils.calcGrowth(lyRev, cyRev)
    };
  }, [products]);

  // Monthly trend data
  // TODO: API endpoint: GET /api/v1/salesrep/monthly-trends?fy=2025-26
  const monthlyTrend = useMemo(() => {
    return MONTHS.map((month, idx) => {
      let lyQty = 0, cyQty = 0, lyRev = 0, cyRev = 0;
      products.forEach(p => {
        if (p.monthlyTargets?.[month]) {
          lyQty += p.monthlyTargets[month].lyQty || 0;
          cyQty += p.monthlyTargets[month].cyQty || 0;
          lyRev += p.monthlyTargets[month].lyRev || 0;
          cyRev += p.monthlyTargets[month].cyRev || 0;
        }
      });
      return { month, label: MONTH_LABELS[idx], lyQty, cyQty, lyRev, cyRev, growth: Utils.calcGrowth(lyQty, cyQty) };
    });
  }, [products]);

  // Quarterly aggregates
  // TODO: API endpoint: GET /api/v1/salesrep/quarterly-summary?fy=2025-26
  const quarterlyData = useMemo(() => {
    const quarters = [
      { id: 'Q1', label: 'Q1', fullLabel: 'Apr — Jun', color: '#4285F4' },
      { id: 'Q2', label: 'Q2', fullLabel: 'Jul — Sep', color: '#34A853' },
      { id: 'Q3', label: 'Q3', fullLabel: 'Oct — Dec', color: '#FBBC04' },
      { id: 'Q4', label: 'Q4', fullLabel: 'Jan — Mar', color: '#EA4335' }
    ];
    return quarters.map(q => {
      let lyQty = 0, cyQty = 0, lyRev = 0, cyRev = 0;
      products.forEach(p => {
        if (p.monthlyTargets) {
          QUARTER_MONTHS[q.id].forEach(m => {
            lyQty += p.monthlyTargets[m]?.lyQty || 0;
            cyQty += p.monthlyTargets[m]?.cyQty || 0;
            lyRev += p.monthlyTargets[m]?.lyRev || 0;
            cyRev += p.monthlyTargets[m]?.cyRev || 0;
          });
        }
      });
      return { ...q, lyQty, cyQty, lyRev, cyRev, growth: Utils.calcGrowth(lyQty, cyQty) };
    });
  }, [products]);

  // Category performance
  // TODO: API endpoint: GET /api/v1/salesrep/category-performance?fy=2025-26
  const categoryPerformance = useMemo(() => {
    return categories.map(cat => {
      const catProducts = products.filter(p => p.categoryId === cat.id);
      let lyQty = 0, cyQty = 0, lyRev = 0, cyRev = 0;
      catProducts.forEach(p => {
        if (p.monthlyTargets) {
          Object.values(p.monthlyTargets).forEach(m => {
            lyQty += m.lyQty || 0;
            cyQty += m.cyQty || 0;
            lyRev += m.lyRev || 0;
            cyRev += m.cyRev || 0;
          });
        }
      });
      const growth = Utils.calcGrowth(lyQty, cyQty);
      // Contribution percentage of this category to total CY target
      const contribution = overallTotals.cyQty > 0 ? (cyQty / overallTotals.cyQty) * 100 : 0;
      return { ...cat, lyQty, cyQty, lyRev, cyRev, growth, contribution, productCount: catProducts.length };
    }).sort((a, b) => b.cyQty - a.cyQty); // Sort by highest target
  }, [categories, products, overallTotals]);

  // Top movers - products with highest CY targets
  // TODO: API endpoint: GET /api/v1/salesrep/top-products?fy=2025-26&limit=5
  const topProducts = useMemo(() => {
    return products
      .map(p => {
        const totals = Utils.calculateYearlyTotals(p.monthlyTargets);
        return { ...p, ...totals, growth: Utils.calcGrowth(totals.lyQty, totals.cyQty) };
      })
      .sort((a, b) => b.cyQty - a.cyQty)
      .slice(0, 5);
  }, [products]);

  // Find the max monthly CY value for chart scaling
  const maxMonthlyQty = useMemo(() => {
    return Math.max(...monthlyTrend.map(m => Math.max(m.cyQty, m.lyQty)), 1);
  }, [monthlyTrend]);

  // Achievement rate (how much CY target vs LY actual)
  const achievementRate = overallTotals.lyQty > 0
    ? Math.round((overallTotals.cyQty / overallTotals.lyQty) * 100)
    : 0;

  return (
    <div className={`ov-dashboard ${animateIn ? 'ov-animate-in' : ''}`}>

      {/* ==================== HERO KPI STRIP ==================== */}
      <div className="ov-hero-strip">
        <div className="ov-hero-card ov-hero-target" style={{ '--delay': '0.05s' }}>
          <div className="ov-hero-icon-wrap">
            <div className="ov-hero-icon"><i className="fas fa-crosshairs"></i></div>
          </div>
          <div className="ov-hero-data">
            <span className="ov-hero-value">{Utils.formatNumber(overallTotals.cyQty)}</span>
            <span className="ov-hero-label">FY Target (Qty)</span>
          </div>
          <div className={`ov-hero-badge ${overallTotals.qtyGrowth >= 0 ? 'positive' : 'negative'}`}>
            <i className={`fas fa-arrow-${overallTotals.qtyGrowth >= 0 ? 'up' : 'down'}`}></i>
            {Math.abs(overallTotals.qtyGrowth).toFixed(1)}%
          </div>
        </div>

        <div className="ov-hero-card ov-hero-ly" style={{ '--delay': '0.1s' }}>
          <div className="ov-hero-icon-wrap ly">
            <div className="ov-hero-icon"><i className="fas fa-history"></i></div>
          </div>
          <div className="ov-hero-data">
            <span className="ov-hero-value">{Utils.formatNumber(overallTotals.lyQty)}</span>
            <span className="ov-hero-label">Last Year (Qty)</span>
          </div>
          <div className="ov-hero-badge neutral">Baseline</div>
        </div>

        <div className="ov-hero-card ov-hero-revenue" style={{ '--delay': '0.15s' }}>
          <div className="ov-hero-icon-wrap rev">
            <div className="ov-hero-icon"><i className="fas fa-rupee-sign"></i></div>
          </div>
          <div className="ov-hero-data">
            <span className="ov-hero-value">{Utils.formatShortCurrency(overallTotals.cyRev)}</span>
            <span className="ov-hero-label">Revenue Target</span>
          </div>
          <div className={`ov-hero-badge ${overallTotals.revGrowth >= 0 ? 'positive' : 'negative'}`}>
            <i className={`fas fa-arrow-${overallTotals.revGrowth >= 0 ? 'up' : 'down'}`}></i>
            {Math.abs(overallTotals.revGrowth).toFixed(1)}%
          </div>
        </div>

        <div className="ov-hero-card ov-hero-achievement" style={{ '--delay': '0.2s' }}>
          <div className="ov-hero-icon-wrap ach">
            <div className="ov-hero-icon"><i className="fas fa-trophy"></i></div>
          </div>
          <div className="ov-hero-data">
            <span className="ov-hero-value">{achievementRate}%</span>
            <span className="ov-hero-label">vs Last Year</span>
          </div>
          <div className="ov-hero-ring">
            <svg viewBox="0 0 36 36">
              <path className="ov-ring-bg" d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="ov-ring-fill" strokeDasharray={`${Math.min(achievementRate, 150)}, 150`}
                d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
          </div>
        </div>
      </div>

      {/* ==================== MONTHLY TREND + QUARTERLY ==================== */}
      <div className="ov-twin-section">

        {/* Monthly Trend Chart */}
        <div className="ov-panel ov-trend-panel" style={{ '--delay': '0.25s' }}>
          <div className="ov-panel-header">
            <h3><i className="fas fa-chart-area"></i> Monthly Target Trend</h3>
            <div className="ov-legend">
              <span className="ov-legend-dot cy"></span> CY Target
              <span className="ov-legend-dot ly"></span> LY Actual
            </div>
          </div>
          <div className="ov-chart-area">
            {monthlyTrend.map((m, idx) => (
              <div key={m.month} className="ov-chart-col" style={{ '--col-delay': `${idx * 0.04}s` }}>
                <div className="ov-bar-group">
                  <div className="ov-bar ly-bar"
                    style={{ height: `${(m.lyQty / maxMonthlyQty) * 100}%` }}
                    title={`LY: ${Utils.formatNumber(m.lyQty)}`}>
                  </div>
                  <div className="ov-bar cy-bar"
                    style={{ height: `${(m.cyQty / maxMonthlyQty) * 100}%` }}
                    title={`CY: ${Utils.formatNumber(m.cyQty)}`}>
                    <span className="ov-bar-tooltip">{Utils.formatCompact(m.cyQty)}</span>
                  </div>
                </div>
                <span className="ov-chart-label">{m.label}</span>
                <span className={`ov-chart-growth ${m.growth >= 0 ? 'up' : 'down'}`}>
                  {m.growth >= 0 ? '+' : ''}{m.growth.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quarterly Performance Cards */}
        <div className="ov-panel ov-quarter-panel" style={{ '--delay': '0.3s' }}>
          <div className="ov-panel-header">
            <h3><i className="fas fa-calendar-alt"></i> Quarterly Targets</h3>
          </div>
          <div className="ov-quarter-grid">
            {quarterlyData.map(q => (
              <div
                key={q.id}
                className={`ov-qcard ${activeQuarter === q.id ? 'active' : ''}`}
                style={{ '--q-color': q.color }}
                onClick={() => setActiveQuarter(activeQuarter === q.id ? null : q.id)}
              >
                <div className="ov-qcard-top">
                  <span className="ov-qcard-label">{q.label}</span>
                  <span className="ov-qcard-period">{q.fullLabel}</span>
                </div>
                <div className="ov-qcard-value">{Utils.formatNumber(q.cyQty)}</div>
                <div className="ov-qcard-compare">
                  <span className="ov-qcard-ly">LY: {Utils.formatNumber(q.lyQty)}</span>
                  <span className={`ov-qcard-growth ${q.growth >= 0 ? 'positive' : 'negative'}`}>
                    <i className={`fas fa-caret-${q.growth >= 0 ? 'up' : 'down'}`}></i>
                    {Math.abs(q.growth).toFixed(1)}%
                  </span>
                </div>
                {/* Mini progress bar */}
                <div className="ov-qcard-progress">
                  <div className="ov-qcard-progress-fill"
                    style={{ width: `${Math.min((q.cyQty / (overallTotals.cyQty || 1)) * 100 * 4, 100)}%` }}>
                  </div>
                </div>
                <span className="ov-qcard-share">
                  {overallTotals.cyQty > 0 ? ((q.cyQty / overallTotals.cyQty) * 100).toFixed(0) : 0}% of FY
                </span>

                {/* Expanded monthly detail */}
                {activeQuarter === q.id && (
                  <div className="ov-qcard-detail">
                    {QUARTER_MONTHS[q.id].map(m => {
                      const md = monthlyTrend.find(mt => mt.month === m);
                      return md ? (
                        <div key={m} className="ov-qcard-month-row">
                          <span className="ov-qm-label">{md.label}</span>
                          <span className="ov-qm-val">{Utils.formatNumber(md.cyQty)}</span>
                          <span className={`ov-qm-growth ${md.growth >= 0 ? 'up' : 'down'}`}>
                            {md.growth >= 0 ? '+' : ''}{md.growth.toFixed(0)}%
                          </span>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ==================== CATEGORY PERFORMANCE + TOP PRODUCTS ==================== */}
      <div className="ov-twin-section">

        {/* Category Breakdown */}
        <div className="ov-panel ov-category-panel" style={{ '--delay': '0.35s' }}>
          <div className="ov-panel-header">
            <h3><i className="fas fa-layer-group"></i> Category Performance</h3>
          </div>
          <div className="ov-category-list">
            {categoryPerformance.map((cat, idx) => (
              <div key={cat.id} className="ov-cat-row" style={{ '--row-delay': `${idx * 0.05}s` }}>
                <div className="ov-cat-info">
                  <div className={`ov-cat-icon ${cat.color || ''}`}>
                    <i className={`fas ${cat.icon || 'fa-box'}`}></i>
                  </div>
                  <div className="ov-cat-text">
                    <span className="ov-cat-name">{cat.name}</span>
                    <span className="ov-cat-count">{cat.productCount} products</span>
                  </div>
                </div>
                <div className="ov-cat-metrics">
                  <div className="ov-cat-metric">
                    <span className="ov-cm-label">CY Target</span>
                    <span className="ov-cm-value accent">{Utils.formatNumber(cat.cyQty)}</span>
                  </div>
                  <div className="ov-cat-metric">
                    <span className="ov-cm-label">LY Actual</span>
                    <span className="ov-cm-value">{Utils.formatNumber(cat.lyQty)}</span>
                  </div>
                  <div className="ov-cat-metric">
                    <span className="ov-cm-label">Growth</span>
                    <span className={`ov-cm-value ${cat.growth >= 0 ? 'positive' : 'negative'}`}>
                      {Utils.formatGrowth(cat.growth)}
                    </span>
                  </div>
                </div>
                {/* Contribution bar */}
                <div className="ov-cat-bar-wrap">
                  <div className="ov-cat-bar" style={{ width: `${cat.contribution}%` }}>
                    <span className="ov-cat-bar-label">{cat.contribution.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="ov-panel ov-top-panel" style={{ '--delay': '0.4s' }}>
          <div className="ov-panel-header">
            <h3><i className="fas fa-fire"></i> Top 5 Products</h3>
            <span className="ov-panel-subtitle">By CY target volume</span>
          </div>
          <div className="ov-top-list">
            {topProducts.map((p, idx) => {
              const barWidth = overallTotals.cyQty > 0 ? (p.cyQty / topProducts[0]?.cyQty) * 100 : 0;
              return (
                <div key={p.id} className="ov-top-row" style={{ '--row-delay': `${idx * 0.06}s` }}>
                  <div className="ov-top-rank">
                    <span className={`ov-rank-num rank-${idx + 1}`}>{idx + 1}</span>
                  </div>
                  <div className="ov-top-info">
                    <span className="ov-top-name">{p.name}</span>
                    <div className="ov-top-bar-wrap">
                      <div className="ov-top-bar" style={{ width: `${barWidth}%` }}></div>
                    </div>
                  </div>
                  <div className="ov-top-numbers">
                    <span className="ov-top-qty">{Utils.formatNumber(p.cyQty)}</span>
                    <span className={`ov-top-growth ${p.growth >= 0 ? 'positive' : 'negative'}`}>
                      <i className={`fas fa-arrow-${p.growth >= 0 ? 'up' : 'down'}`}></i>
                      {Math.abs(p.growth).toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {topProducts.length === 0 && (
            <div className="ov-empty-state">
              <i className="fas fa-inbox"></i>
              <p>No product targets entered yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ==================== REVENUE SNAPSHOT FOOTER ==================== */}
      <div className="ov-revenue-footer" style={{ '--delay': '0.45s' }}>
        <div className="ov-rev-block">
          <div className="ov-rev-icon"><i className="fas fa-wallet"></i></div>
          <div className="ov-rev-data">
            <span className="ov-rev-label">LY Revenue</span>
            <span className="ov-rev-value">{Utils.formatShortCurrency(overallTotals.lyRev)}</span>
          </div>
        </div>
        <div className="ov-rev-arrow">
          <i className="fas fa-arrow-right"></i>
        </div>
        <div className="ov-rev-block highlight">
          <div className="ov-rev-icon"><i className="fas fa-chart-line"></i></div>
          <div className="ov-rev-data">
            <span className="ov-rev-label">CY Revenue Target</span>
            <span className="ov-rev-value">{Utils.formatShortCurrency(overallTotals.cyRev)}</span>
          </div>
        </div>
        <div className="ov-rev-growth-pill">
          <span className={overallTotals.revGrowth >= 0 ? 'positive' : 'negative'}>
            <i className={`fas fa-trending-${overallTotals.revGrowth >= 0 ? 'up' : 'down'}`}></i>
            {Utils.formatGrowth(overallTotals.revGrowth)} Revenue Growth
          </span>
        </div>
      </div>

    </div>
  );
}

export default OverviewStats;
