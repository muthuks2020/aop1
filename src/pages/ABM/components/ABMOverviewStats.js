/**
 * ABM Overview Dashboard
 * Area-level KPIs for ABM performance tracking
 * Mirrors TBM OverviewStats design but with ABM-specific metrics
 * 
 * @author Appasamy Associates - Product Commitment PWA
 * @version 1.0.0
 * 
 * API INTEGRATION NOTES:
 * - All data currently computed from props
 * - Replace with API calls when backend is ready:
 *   GET /api/v1/abm/dashboard-summary
 *   GET /api/v1/abm/category-performance
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Utils } from '../../../utils/helpers';
import '../../../styles/abm/abmOverview.css';

const MONTHS = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];

function ABMOverviewStats({ abmTargets = [], categories = [], tbmSubmissions = [], approvalStats = {} }) {
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimateIn(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // ==================== COMPUTED DATA ====================

  const overallTotals = useMemo(() => {
    let lyQty = 0, cyQty = 0, aopQty = 0, lyRev = 0, cyRev = 0, aopRev = 0;
    abmTargets.forEach(p => {
      if (p.monthlyTargets) {
        Object.values(p.monthlyTargets).forEach(m => {
          lyQty += m.lyQty || 0;
          cyQty += m.cyQty || 0;
          aopQty += m.aopQty || 0;
          lyRev += m.lyRev || 0;
          cyRev += m.cyRev || 0;
          aopRev += m.aopRev || 0;
        });
      }
    });
    return {
      lyQty, cyQty, aopQty, lyRev, cyRev, aopRev,
      qtyGrowth: Utils.calcGrowth(lyQty, cyQty),
      revGrowth: Utils.calcGrowth(lyRev, cyRev),
      aopAchievementQty: aopQty > 0 ? ((cyQty / aopQty) * 100).toFixed(1) : 0,
      aopAchievementRev: aopRev > 0 ? ((cyRev / aopRev) * 100).toFixed(1) : 0
    };
  }, [abmTargets]);

  // Category performance
  const categoryPerformance = useMemo(() => {
    return categories.map(cat => {
      const catProducts = abmTargets.filter(p => p.categoryId === cat.id);
      let lyQty = 0, cyQty = 0, aopQty = 0, lyRev = 0, cyRev = 0, aopRev = 0;
      catProducts.forEach(p => {
        if (p.monthlyTargets) {
          Object.values(p.monthlyTargets).forEach(m => {
            lyQty += m.lyQty || 0;
            cyQty += m.cyQty || 0;
            aopQty += m.aopQty || 0;
            lyRev += m.lyRev || 0;
            cyRev += m.cyRev || 0;
            aopRev += m.aopRev || 0;
          });
        }
      });
      const growth = Utils.calcGrowth(lyQty, cyQty);
      const contribution = overallTotals.cyQty > 0 ? ((cyQty / overallTotals.cyQty) * 100).toFixed(1) : 0;
      return {
        ...cat,
        lyQty, cyQty, aopQty, lyRev, cyRev, aopRev,
        growth,
        contribution,
        aopAchievement: aopQty > 0 ? ((cyQty / aopQty) * 100).toFixed(1) : 0,
        productCount: catProducts.length
      };
    }).filter(c => c.productCount > 0);
  }, [abmTargets, categories, overallTotals]);

  // Top products by CY revenue
  const topProducts = useMemo(() => {
    return [...abmTargets]
      .map(p => {
        let totalCyRev = 0, totalLyRev = 0;
        if (p.monthlyTargets) {
          Object.values(p.monthlyTargets).forEach(m => {
            totalCyRev += m.cyRev || 0;
            totalLyRev += m.lyRev || 0;
          });
        }
        return { ...p, totalCyRev, totalLyRev, growth: Utils.calcGrowth(totalLyRev, totalCyRev) };
      })
      .sort((a, b) => b.totalCyRev - a.totalCyRev)
      .slice(0, 5);
  }, [abmTargets]);

  // TBM-level summary
  const tbmSummary = useMemo(() => {
    const tbmMap = {};
    tbmSubmissions.forEach(sub => {
      if (!tbmMap[sub.tbmId]) {
        tbmMap[sub.tbmId] = {
          id: sub.tbmId,
          name: sub.tbmName,
          territory: sub.territory,
          totalCyQty: 0,
          totalLyQty: 0,
          totalAopQty: 0,
          totalCyRev: 0,
          totalLyRev: 0,
          totalAopRev: 0,
          submitted: 0,
          approved: 0,
          total: 0
        };
      }
      const tbm = tbmMap[sub.tbmId];
      tbm.total++;
      if (sub.status === 'submitted') tbm.submitted++;
      if (sub.status === 'approved') tbm.approved++;
      if (sub.monthlyTargets) {
        Object.values(sub.monthlyTargets).forEach(m => {
          tbm.totalCyQty += m.cyQty || 0;
          tbm.totalLyQty += m.lyQty || 0;
          tbm.totalAopQty += m.aopQty || 0;
          tbm.totalCyRev += m.cyRev || 0;
          tbm.totalLyRev += m.lyRev || 0;
          tbm.totalAopRev += m.aopRev || 0;
        });
      }
    });
    return Object.values(tbmMap);
  }, [tbmSubmissions]);

  return (
    <div className={`abm-overview ${animateIn ? 'abm-ov-animate-in' : ''}`}>
      
      {/* ===== KPI CARDS ===== */}
      <div className="abm-ov-kpi-grid">
        <div className="abm-ov-kpi-card abm-ov-kpi-revenue">
          <div className="abm-ov-kpi-icon"><i className="fas fa-rupee-sign"></i></div>
          <div className="abm-ov-kpi-content">
            <span className="abm-ov-kpi-label">Area Target (CY Revenue)</span>
            <span className="abm-ov-kpi-value">₹{Utils.formatShortCurrency ? Utils.formatShortCurrency(overallTotals.cyRev) : Utils.formatCompact(overallTotals.cyRev)}</span>
            <span className={`abm-ov-kpi-growth ${overallTotals.revGrowth >= 0 ? 'positive' : 'negative'}`}>
              <i className={`fas fa-arrow-${overallTotals.revGrowth >= 0 ? 'up' : 'down'}`}></i>
              {Utils.formatGrowth(overallTotals.revGrowth)} vs LY
            </span>
          </div>
        </div>

        <div className="abm-ov-kpi-card abm-ov-kpi-qty">
          <div className="abm-ov-kpi-icon"><i className="fas fa-boxes"></i></div>
          <div className="abm-ov-kpi-content">
            <span className="abm-ov-kpi-label">Area Target (CY Qty)</span>
            <span className="abm-ov-kpi-value">{Utils.formatNumber(overallTotals.cyQty)}</span>
            <span className={`abm-ov-kpi-growth ${overallTotals.qtyGrowth >= 0 ? 'positive' : 'negative'}`}>
              <i className={`fas fa-arrow-${overallTotals.qtyGrowth >= 0 ? 'up' : 'down'}`}></i>
              {Utils.formatGrowth(overallTotals.qtyGrowth)} vs LY
            </span>
          </div>
        </div>

        <div className="abm-ov-kpi-card abm-ov-kpi-tbms">
          <div className="abm-ov-kpi-icon"><i className="fas fa-user-tie"></i></div>
          <div className="abm-ov-kpi-content">
            <span className="abm-ov-kpi-label">TBMs Under Area</span>
            <span className="abm-ov-kpi-value">{tbmSummary.length}</span>
            <span className="abm-ov-kpi-sub">
              {approvalStats.approved || 0} approved / {approvalStats.pending || 0} pending
            </span>
          </div>
        </div>

        <div className="abm-ov-kpi-card abm-ov-kpi-approval">
          <div className="abm-ov-kpi-icon"><i className="fas fa-clipboard-check"></i></div>
          <div className="abm-ov-kpi-content">
            <span className="abm-ov-kpi-label">Approval Progress</span>
            <span className="abm-ov-kpi-value">
              {approvalStats.total > 0 ? Math.round((approvalStats.approved / approvalStats.total) * 100) : 0}%
            </span>
            <div className="abm-ov-kpi-progress-bar">
              <div 
                className="abm-ov-kpi-progress-fill" 
                style={{ width: `${approvalStats.total > 0 ? (approvalStats.approved / approvalStats.total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="abm-ov-kpi-card abm-ov-kpi-aop">
          <div className="abm-ov-kpi-icon" style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: '#fff' }}>
            <i className="fas fa-bullseye"></i>
          </div>
          <div className="abm-ov-kpi-content">
            <span className="abm-ov-kpi-label">AOP Achievement (Qty)</span>
            <span className="abm-ov-kpi-value" style={{ color: '#4338CA' }}>{overallTotals.aopAchievementQty}%</span>
            <span className="abm-ov-kpi-sub">
              CY {Utils.formatNumber(overallTotals.cyQty)} / AOP {Utils.formatNumber(overallTotals.aopQty)}
            </span>
          </div>
        </div>
      </div>

      {/* ===== TBM PERFORMANCE SUMMARY ===== */}
      <div className="abm-ov-section">
        <h3 className="abm-ov-section-title">
          <i className="fas fa-user-tie"></i> TBM Performance Summary
        </h3>
        <div className="abm-ov-tbm-grid">
          {tbmSummary.map(tbm => {
            const revGrowth = Utils.calcGrowth(tbm.totalLyRev, tbm.totalCyRev);
            return (
              <div key={tbm.id} className="abm-ov-tbm-card">
                <div className="abm-ov-tbm-header">
                  <div className="abm-ov-tbm-avatar">
                    {tbm.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  <div className="abm-ov-tbm-info">
                    <span className="abm-ov-tbm-name">{tbm.name}</span>
                    <span className="abm-ov-tbm-territory">{tbm.territory}</span>
                  </div>
                  <span className={`abm-ov-tbm-status ${tbm.submitted > 0 ? 'pending' : 'done'}`}>
                    {tbm.submitted > 0 ? `${tbm.submitted} pending` : 'All approved'}
                  </span>
                </div>
                <div className="abm-ov-tbm-metrics">
                  <div className="abm-ov-tbm-metric">
                    <span className="abm-ov-tbm-metric-label">CY Revenue</span>
                    <span className="abm-ov-tbm-metric-value">₹{Utils.formatCompact(tbm.totalCyRev)}</span>
                  </div>
                  <div className="abm-ov-tbm-metric">
                    <span className="abm-ov-tbm-metric-label">CY Qty</span>
                    <span className="abm-ov-tbm-metric-value">{Utils.formatNumber(tbm.totalCyQty)}</span>
                  </div>
                  <div className="abm-ov-tbm-metric">
                    <span className="abm-ov-tbm-metric-label">Growth</span>
                    <span className={`abm-ov-tbm-metric-value ${revGrowth >= 0 ? 'positive' : 'negative'}`}>
                      {revGrowth >= 0 ? '↑' : '↓'}{Utils.formatGrowth(revGrowth)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== CATEGORY PERFORMANCE ===== */}
      <div className="abm-ov-section">
        <h3 className="abm-ov-section-title">
          <i className="fas fa-th-large"></i> Category Performance
        </h3>
        <div className="abm-ov-category-grid">
          {categoryPerformance.map(cat => (
            <div key={cat.id} className="abm-ov-cat-card">
              <div className="abm-ov-cat-header">
                <div className="abm-ov-cat-icon">
                  <i className={`fas ${cat.icon}`}></i>
                </div>
                <span className="abm-ov-cat-name">{cat.name}</span>
                <span className="abm-ov-cat-contribution">{cat.contribution}%</span>
              </div>
              <div className="abm-ov-cat-metrics">
                <div className="abm-ov-cat-row">
                  <span>LY Qty</span>
                  <span>{Utils.formatNumber(cat.lyQty)}</span>
                </div>
                <div className="abm-ov-cat-row">
                  <span>CY Qty</span>
                  <span className="abm-ov-cat-bold">{Utils.formatNumber(cat.cyQty)}</span>
                </div>
                <div className="abm-ov-cat-row" style={{ borderLeft: '3px solid #6366F1', paddingLeft: '0.5rem' }}>
                  <span style={{ color: '#6366F1', fontWeight: 600 }}>AOP Qty</span>
                  <span style={{ color: '#4338CA', fontWeight: 600 }}>{Utils.formatNumber(cat.aopQty)}</span>
                </div>
                <div className="abm-ov-cat-row">
                  <span>Growth</span>
                  <span className={cat.growth >= 0 ? 'positive' : 'negative'}>
                    {cat.growth >= 0 ? '↑' : '↓'}{Utils.formatGrowth(cat.growth)}
                  </span>
                </div>
                <div className="abm-ov-cat-row" style={{ borderLeft: '3px solid #6366F1', paddingLeft: '0.5rem' }}>
                  <span style={{ color: '#6366F1', fontSize: '0.75rem' }}>AOP Achievement</span>
                  <span style={{ color: '#4338CA', fontWeight: 700 }}>{cat.aopAchievement}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== TOP PRODUCTS ===== */}
      
    </div>
  );
}

export default ABMOverviewStats;
