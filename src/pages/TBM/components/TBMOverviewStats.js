/**
 * TBM Overview Dashboard
 * Territory-level KPIs for TBM performance tracking
 * Mirrors Sales Rep OverviewStats design but with TBM-specific metrics
 * 
 * @author Appasamy Associates - Product Commitment PWA
 * @version 1.1.0 - Removed Monthly Territory Trend chart
 * 
 * API INTEGRATION NOTES:
 * - All data currently computed from props (tbmTargets, categories, salesRepSubmissions)
 * - Replace with API calls when backend is ready:
 *   GET /api/v1/tbm/dashboard-summary
 *   GET /api/v1/tbm/category-performance
 *   GET /api/v1/tbm/top-products
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Utils } from '../../../utils/helpers';
import '../../../styles/tbm/tbmOverview.css';

// Fiscal year months in order
const MONTHS = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];

function TBMOverviewStats({ tbmTargets = [], categories = [], salesRepSubmissions = [], approvalStats = {} }) {
  const [animateIn, setAnimateIn] = useState(false);

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

      {/* ==================== MONTHLY TREND REMOVED ==================== */}
      {/* Monthly Territory Trend bar chart + Quarterly Chips removed per requirement */}

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
