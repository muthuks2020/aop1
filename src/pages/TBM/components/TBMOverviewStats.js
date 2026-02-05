/**
 * TBM Overview Dashboard
 * Territory-level KPIs for TBM performance tracking
 * Mirrors Sales Rep OverviewStats design but with TBM-specific metrics
 * 
 * @author Appasamy Associates - Product Commitment PWA
 * @version 1.0.0
 * 
 * API INTEGRATION NOTES:
 * - All data currently computed from props (tbmTargets, categories, salesRepSubmissions)
 * - Replace with API calls when backend is ready:
 *   GET /api/v1/tbm/dashboard-summary
 *   GET /api/v1/tbm/monthly-trends
 *   GET /api/v1/tbm/category-performance
 *   GET /api/v1/tbm/top-products
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Utils } from '../../../utils/helpers';
import '../../../styles/tbm/tbmOverview.css';

// Fiscal year months in order
const MONTHS = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];
const MONTH_LABELS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
const QUARTER_MONTHS = {
  Q1: ['apr', 'may', 'jun'],
  Q2: ['jul', 'aug', 'sep'],
  Q3: ['oct', 'nov', 'dec'],
  Q4: ['jan', 'feb', 'mar']
};

function TBMOverviewStats({ tbmTargets = [], categories = [], salesRepSubmissions = [], approvalStats = {} }) {
  const [animateIn, setAnimateIn] = useState(false);
  const [activeQuarter, setActiveQuarter] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setAnimateIn(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // ==================== COMPUTED DATA ====================
  // TODO: Replace with GET /api/v1/tbm/dashboard-summary

  const overallTotals = useMemo(() => {
    let lyQty = 0, cyQty = 0, lyRev = 0, cyRev = 0;
    tbmTargets.forEach(p => {
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
  }, [tbmTargets]);

  // Monthly trend data
  // TODO: GET /api/v1/tbm/monthly-trends?fy=2026-27
  const monthlyTrend = useMemo(() => {
    return MONTHS.map((month, idx) => {
      let lyQty = 0, cyQty = 0, lyRev = 0, cyRev = 0;
      tbmTargets.forEach(p => {
        if (p.monthlyTargets?.[month]) {
          lyQty += p.monthlyTargets[month].lyQty || 0;
          cyQty += p.monthlyTargets[month].cyQty || 0;
          lyRev += p.monthlyTargets[month].lyRev || 0;
          cyRev += p.monthlyTargets[month].cyRev || 0;
        }
      });
      return { month, label: MONTH_LABELS[idx], lyQty, cyQty, lyRev, cyRev, growth: Utils.calcGrowth(lyQty, cyQty) };
    });
  }, [tbmTargets]);

  // Quarterly aggregates
  // TODO: GET /api/v1/tbm/quarterly-summary?fy=2026-27
  const quarterlyData = useMemo(() => {
    const quarters = [
      { id: 'Q1', label: 'Q1', fullLabel: 'Apr — Jun', color: '#4285F4' },
      { id: 'Q2', label: 'Q2', fullLabel: 'Jul — Sep', color: '#34A853' },
      { id: 'Q3', label: 'Q3', fullLabel: 'Oct — Dec', color: '#FBBC04' },
      { id: 'Q4', label: 'Q4', fullLabel: 'Jan — Mar', color: '#EA4335' }
    ];
    return quarters.map(q => {
      let lyQty = 0, cyQty = 0, lyRev = 0, cyRev = 0;
      tbmTargets.forEach(p => {
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
  }, [tbmTargets]);

  // Category performance
  // TODO: GET /api/v1/tbm/category-performance?fy=2026-27
  const categoryPerformance = useMemo(() => {
    return categories.map(cat => {
      const catProducts = tbmTargets.filter(p => p.categoryId === cat.id);
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
      const contribution = overallTotals.cyQty > 0 ? (cyQty / overallTotals.cyQty) * 100 : 0;
      return { ...cat, lyQty, cyQty, lyRev, cyRev, growth, contribution, productCount: catProducts.length };
    }).sort((a, b) => b.cyQty - a.cyQty);
  }, [categories, tbmTargets, overallTotals]);

  // Top territory products
  // TODO: GET /api/v1/tbm/top-products?fy=2026-27&limit=5
  const topProducts = useMemo(() => {
    return tbmTargets
      .map(p => {
        let lyQty = 0, cyQty = 0, lyRev = 0, cyRev = 0;
        if (p.monthlyTargets) {
          Object.values(p.monthlyTargets).forEach(m => {
            lyQty += m.lyQty || 0;
            cyQty += m.cyQty || 0;
            lyRev += m.lyRev || 0;
            cyRev += m.cyRev || 0;
          });
        }
        return { ...p, lyQty, cyQty, lyRev, cyRev, growth: Utils.calcGrowth(lyQty, cyQty) };
      })
      .sort((a, b) => b.cyQty - a.cyQty)
      .slice(0, 5);
  }, [tbmTargets]);

  const maxMonthlyQty = useMemo(() => {
    return Math.max(...monthlyTrend.map(m => Math.max(m.cyQty, m.lyQty)), 1);
  }, [monthlyTrend]);

  const achievementRate = overallTotals.lyQty > 0
    ? Math.round((overallTotals.cyQty / overallTotals.lyQty) * 100)
    : 0;

  return (
    <div className={`tbm-ov-dashboard ${animateIn ? 'tbm-ov-animate-in' : ''}`}>

      {/* ==================== HERO KPI STRIP ==================== */}
      <div className="tbm-ov-hero-strip">
        <div className="tbm-ov-hero-card tbm-ov-hero-target" style={{ '--delay': '0.05s' }}>
          <div className="tbm-ov-hero-icon-wrap">
            <div className="tbm-ov-hero-icon"><i className="fas fa-crosshairs"></i></div>
          </div>
          <div className="tbm-ov-hero-data">
            <span className="tbm-ov-hero-value">{Utils.formatNumber(overallTotals.cyQty)}</span>
            <span className="tbm-ov-hero-label">Territory Target (Qty)</span>
          </div>
          <div className={`tbm-ov-hero-badge ${overallTotals.qtyGrowth >= 0 ? 'positive' : 'negative'}`}>
            <i className={`fas fa-arrow-${overallTotals.qtyGrowth >= 0 ? 'up' : 'down'}`}></i>
            {Utils.formatGrowth(overallTotals.qtyGrowth)}
          </div>
        </div>

        <div className="tbm-ov-hero-card tbm-ov-hero-ly" style={{ '--delay': '0.1s' }}>
          <div className="tbm-ov-hero-icon-wrap">
            <div className="tbm-ov-hero-icon"><i className="fas fa-history"></i></div>
          </div>
          <div className="tbm-ov-hero-data">
            <span className="tbm-ov-hero-value">{Utils.formatNumber(overallTotals.lyQty)}</span>
            <span className="tbm-ov-hero-label">Last Year Actual (Qty)</span>
          </div>
        </div>

        <div className="tbm-ov-hero-card tbm-ov-hero-revenue" style={{ '--delay': '0.15s' }}>
          <div className="tbm-ov-hero-icon-wrap">
            <div className="tbm-ov-hero-icon"><i className="fas fa-rupee-sign"></i></div>
          </div>
          <div className="tbm-ov-hero-data">
            <span className="tbm-ov-hero-value">{Utils.formatShortCurrency ? Utils.formatShortCurrency(overallTotals.cyRev) : `₹${Utils.formatCompact(overallTotals.cyRev)}`}</span>
            <span className="tbm-ov-hero-label">Revenue Target</span>
          </div>
          <div className={`tbm-ov-hero-badge ${overallTotals.revGrowth >= 0 ? 'positive' : 'negative'}`}>
            <i className={`fas fa-arrow-${overallTotals.revGrowth >= 0 ? 'up' : 'down'}`}></i>
            {Utils.formatGrowth(overallTotals.revGrowth)}
          </div>
        </div>

        <div className="tbm-ov-hero-card tbm-ov-hero-achievement" style={{ '--delay': '0.2s' }}>
          <div className="tbm-ov-hero-icon-wrap">
            <div className="tbm-ov-hero-icon"><i className="fas fa-chart-line"></i></div>
          </div>
          <div className="tbm-ov-hero-data">
            <span className="tbm-ov-hero-value">{achievementRate}%</span>
            <span className="tbm-ov-hero-label">YoY Growth Rate</span>
          </div>
          <div className="tbm-ov-hero-ring">
            <svg viewBox="0 0 36 36" className="tbm-ov-ring-svg">
              <path
                d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="#E5E7EB" strokeWidth="3"
              />
              <path
                d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={achievementRate >= 100 ? '#10B981' : '#F59E0B'}
                strokeWidth="3"
                strokeDasharray={`${Math.min(achievementRate, 100)}, 100`}
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* ==================== TEAM STATS BAR ==================== */}
      <div className="tbm-ov-team-bar" style={{ '--delay': '0.22s' }}>
        <div className="tbm-ov-team-title">
          <i className="fas fa-users"></i>
          <span>Sales Rep Submissions</span>
        </div>
        <div className="tbm-ov-team-stats">
          <div className="tbm-ov-team-stat">
            <span className="tbm-ov-ts-count pending">{approvalStats.pending || 0}</span>
            <span className="tbm-ov-ts-label">Pending</span>
          </div>
          <div className="tbm-ov-team-stat">
            <span className="tbm-ov-ts-count approved">{approvalStats.approved || 0}</span>
            <span className="tbm-ov-ts-label">Approved</span>
          </div>
          <div className="tbm-ov-team-stat">
            <span className="tbm-ov-ts-count rejected">{approvalStats.rejected || 0}</span>
            <span className="tbm-ov-ts-label">Rejected</span>
          </div>
          <div className="tbm-ov-team-stat">
            <span className="tbm-ov-ts-count total">{approvalStats.total || 0}</span>
            <span className="tbm-ov-ts-label">Total</span>
          </div>
        </div>
        <div className="tbm-ov-team-progress">
          <div className="tbm-ov-tp-bar">
            <div 
              className="tbm-ov-tp-fill approved" 
              style={{ width: `${approvalStats.total ? (approvalStats.approved / approvalStats.total) * 100 : 0}%` }}
            ></div>
            <div 
              className="tbm-ov-tp-fill rejected" 
              style={{ width: `${approvalStats.total ? (approvalStats.rejected / approvalStats.total) * 100 : 0}%` }}
            ></div>
          </div>
          <span className="tbm-ov-tp-text">
            {approvalStats.total ? Math.round((approvalStats.approved / approvalStats.total) * 100) : 0}% reviewed
          </span>
        </div>
      </div>

      {/* ==================== MONTHLY TREND + QUARTERLY CHIPS ==================== */}
      <div className="tbm-ov-panel tbm-ov-chart-panel" style={{ '--delay': '0.25s' }}>
        <div className="tbm-ov-panel-header">
          <h3><i className="fas fa-chart-bar"></i> Monthly Territory Trend</h3>
          <div className="tbm-ov-chart-legend">
            <span className="tbm-ov-legend-item cy"><span className="tbm-ov-legend-dot"></span>CY Target</span>
            <span className="tbm-ov-legend-item ly"><span className="tbm-ov-legend-dot"></span>LY Actual</span>
          </div>
        </div>
        <div className="tbm-ov-chart-area">
          {monthlyTrend.map((m, idx) => {
            const cyHeight = maxMonthlyQty > 0 ? (m.cyQty / maxMonthlyQty) * 100 : 0;
            const lyHeight = maxMonthlyQty > 0 ? (m.lyQty / maxMonthlyQty) * 100 : 0;
            return (
              <div key={m.month} className="tbm-ov-bar-group" style={{ '--bar-delay': `${idx * 0.04}s` }}>
                <div className="tbm-ov-bar-container">
                  <div className="tbm-ov-bar ly" style={{ height: `${lyHeight}%` }}>
                    <span className="tbm-ov-bar-tooltip">{Utils.formatNumber(m.lyQty)}</span>
                  </div>
                  <div className="tbm-ov-bar cy" style={{ height: `${cyHeight}%` }}>
                    <span className="tbm-ov-bar-tooltip">{Utils.formatNumber(m.cyQty)}</span>
                  </div>
                </div>
                <span className="tbm-ov-bar-label">{m.label}</span>
              </div>
            );
          })}
        </div>

        {/* Quarter Chips */}
        <div className="tbm-ov-quarter-strip">
          {quarterlyData.map((q, idx) => {
            const isActive = activeQuarter === q.id;
            return (
              <div
                key={q.id}
                className={`tbm-ov-qchip ${isActive ? 'active' : ''}`}
                style={{ '--chip-color': q.color }}
                onClick={() => setActiveQuarter(isActive ? null : q.id)}
              >
                <div className="tbm-ov-qchip-header">
                  <span className="tbm-ov-qchip-label" style={{ color: q.color }}>{q.label}</span>
                  <span className="tbm-ov-qchip-sub">{q.fullLabel}</span>
                </div>
                <div className="tbm-ov-qchip-values">
                  <span className="tbm-ov-qchip-val">{Utils.formatNumber(q.cyQty)}</span>
                  <span className={`tbm-ov-qchip-growth ${q.growth >= 0 ? 'up' : 'down'}`}>
                    {q.growth >= 0 ? '+' : ''}{q.growth.toFixed(0)}%
                  </span>
                </div>
                {isActive && (
                  <div className="tbm-ov-qcard-months">
                    {QUARTER_MONTHS[q.id].map(m => {
                      const md = monthlyTrend.find(mt => mt.month === m);
                      return md ? (
                        <div key={m} className="tbm-ov-qcard-month-row">
                          <span className="tbm-ov-qm-label">{md.label}</span>
                          <span className="tbm-ov-qm-val">{Utils.formatNumber(md.cyQty)}</span>
                          <span className={`tbm-ov-qm-growth ${md.growth >= 0 ? 'up' : 'down'}`}>
                            {md.growth >= 0 ? '+' : ''}{md.growth.toFixed(0)}%
                          </span>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================== CATEGORY + TOP PRODUCTS ==================== */}
      <div className="tbm-ov-twin-section">
        {/* Category Breakdown */}
        <div className="tbm-ov-panel tbm-ov-category-panel" style={{ '--delay': '0.35s' }}>
          <div className="tbm-ov-panel-header">
            <h3><i className="fas fa-layer-group"></i> Category Performance</h3>
          </div>
          <div className="tbm-ov-category-list">
            {categoryPerformance.map((cat, idx) => (
              <div key={cat.id} className="tbm-ov-cat-row" style={{ '--row-delay': `${idx * 0.05}s` }}>
                <div className="tbm-ov-cat-info">
                  <div className={`tbm-ov-cat-icon ${cat.color || ''}`}>
                    <i className={`fas ${cat.icon || 'fa-box'}`}></i>
                  </div>
                  <div className="tbm-ov-cat-text">
                    <span className="tbm-ov-cat-name">{cat.name}</span>
                    <span className="tbm-ov-cat-count">{cat.productCount} targets</span>
                  </div>
                </div>
                <div className="tbm-ov-cat-metrics">
                  <div className="tbm-ov-cat-metric">
                    <span className="tbm-ov-cm-label">CY Target</span>
                    <span className="tbm-ov-cm-value accent">{Utils.formatNumber(cat.cyQty)}</span>
                  </div>
                  <div className="tbm-ov-cat-metric">
                    <span className="tbm-ov-cm-label">LY Actual</span>
                    <span className="tbm-ov-cm-value">{Utils.formatNumber(cat.lyQty)}</span>
                  </div>
                  <div className="tbm-ov-cat-metric">
                    <span className="tbm-ov-cm-label">Growth</span>
                    <span className={`tbm-ov-cm-value ${cat.growth >= 0 ? 'positive' : 'negative'}`}>
                      {cat.growth >= 0 ? '+' : ''}{cat.growth.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="tbm-ov-cat-bar-wrap">
                  <div className="tbm-ov-cat-bar">
                    <div className="tbm-ov-cat-bar-fill" style={{ width: `${Math.min(cat.contribution, 100)}%` }}></div>
                  </div>
                  <span className="tbm-ov-cat-bar-pct">{cat.contribution.toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Territory Products */}
        <div className="tbm-ov-panel tbm-ov-top-panel" style={{ '--delay': '0.4s' }}>
          <div className="tbm-ov-panel-header">
            <h3><i className="fas fa-trophy"></i> Top Territory Targets</h3>
          </div>
          <div className="tbm-ov-top-list">
            {topProducts.map((p, idx) => {
              const cat = categories.find(c => c.id === p.categoryId);
              return (
                <div key={p.id} className="tbm-ov-top-item" style={{ '--item-delay': `${idx * 0.06}s` }}>
                  <div className="tbm-ov-top-rank">#{idx + 1}</div>
                  <div className="tbm-ov-top-info">
                    <span className="tbm-ov-top-name">{p.name}</span>
                    <span className="tbm-ov-top-cat">{cat?.name || p.categoryId} • {p.code}</span>
                  </div>
                  <div className="tbm-ov-top-values">
                    <span className="tbm-ov-top-qty">{Utils.formatNumber(p.cyQty)}</span>
                    <span className={`tbm-ov-top-growth ${p.growth >= 0 ? 'positive' : 'negative'}`}>
                      <i className={`fas fa-arrow-${p.growth >= 0 ? 'up' : 'down'}`}></i>
                      {Math.abs(p.growth).toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
            {topProducts.length === 0 && (
              <div className="tbm-ov-empty-state">
                <i className="fas fa-inbox"></i>
                <p>No territory targets entered yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==================== REVENUE SNAPSHOT FOOTER ==================== */}
      <div className="tbm-ov-revenue-footer" style={{ '--delay': '0.45s' }}>
        <div className="tbm-ov-rev-block">
          <div className="tbm-ov-rev-icon"><i className="fas fa-wallet"></i></div>
          <div className="tbm-ov-rev-data">
            <span className="tbm-ov-rev-label">LY Revenue</span>
            <span className="tbm-ov-rev-value">{Utils.formatShortCurrency ? Utils.formatShortCurrency(overallTotals.lyRev) : `₹${Utils.formatCompact(overallTotals.lyRev)}`}</span>
          </div>
        </div>
        <div className="tbm-ov-rev-arrow">
          <i className="fas fa-arrow-right"></i>
        </div>
        <div className="tbm-ov-rev-block highlight">
          <div className="tbm-ov-rev-icon"><i className="fas fa-chart-line"></i></div>
          <div className="tbm-ov-rev-data">
            <span className="tbm-ov-rev-label">CY Revenue Target</span>
            <span className="tbm-ov-rev-value">{Utils.formatShortCurrency ? Utils.formatShortCurrency(overallTotals.cyRev) : `₹${Utils.formatCompact(overallTotals.cyRev)}`}</span>
          </div>
        </div>
        <div className="tbm-ov-rev-growth-pill">
          <span className={overallTotals.revGrowth >= 0 ? 'positive' : 'negative'}>
            <i className={`fas fa-trending-${overallTotals.revGrowth >= 0 ? 'up' : 'down'}`}></i>
            {Utils.formatGrowth(overallTotals.revGrowth)} Revenue Growth
          </span>
        </div>
      </div>

    </div>
  );
}

export default TBMOverviewStats;
