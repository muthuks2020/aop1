/**
 * ZBM Overview Dashboard
 * Zone-level KPIs for ZBM performance tracking
 * Mirrors ABM OverviewStats design but with zone-specific metrics
 * 
 * Shows: Zone Revenue, Zone Qty, ABMs Under Zone, Approval Progress,
 *        ABM Performance cards, Category Performance grid
 * 
 * @author Appasamy Associates - Product Commitment PWA
 * @version 1.0.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Utils } from '../../../utils/helpers';
import '../../../styles/zbm/zbmOverview.css';

const MONTHS = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];

function ZBMOverviewStats({ abmSubmissions = [], categories = [], approvalStats = {} }) {
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimateIn(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // ==================== COMPUTED DATA ====================

  const overallTotals = useMemo(() => {
    let lyQty = 0, cyQty = 0, lyRev = 0, cyRev = 0;
    abmSubmissions.forEach(p => {
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
  }, [abmSubmissions]);

  // Category performance
  const categoryPerformance = useMemo(() => {
    return categories.map(cat => {
      const catProducts = abmSubmissions.filter(p => p.categoryId === cat.id);
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
      const contribution = overallTotals.cyQty > 0 ? Math.round((cyQty / overallTotals.cyQty) * 100) : 0;
      return { ...cat, lyQty, cyQty, lyRev, cyRev, growth, contribution };
    }).filter(c => c.cyQty > 0 || c.cyRev > 0);
  }, [abmSubmissions, categories, overallTotals]);

  // ABM summary
  const abmSummary = useMemo(() => {
    const map = {};
    abmSubmissions.forEach(sub => {
      if (!map[sub.abmId]) {
        map[sub.abmId] = { id: sub.abmId, name: sub.abmName, territory: sub.territory, totalLyRev: 0, totalCyRev: 0, totalCyQty: 0, submitted: 0, approved: 0 };
      }
      const abm = map[sub.abmId];
      if (sub.monthlyTargets) {
        Object.values(sub.monthlyTargets).forEach(m => {
          abm.totalLyRev += m.lyRev || 0;
          abm.totalCyRev += m.cyRev || 0;
          abm.totalCyQty += m.cyQty || 0;
        });
      }
      if (sub.status === 'submitted') abm.submitted++;
      if (sub.status === 'approved') abm.approved++;
    });
    return Object.values(map);
  }, [abmSubmissions]);

  return (
    <div className={`zbm-overview ${animateIn ? 'zbm-ov-animate-in' : ''}`}>

      {/* KPI Cards */}
      <div className="zbm-ov-kpi-grid">
        <div className="zbm-ov-kpi-card zbm-ov-kpi-revenue">
          <div className="zbm-ov-kpi-icon"><i className="fas fa-rupee-sign"></i></div>
          <div className="zbm-ov-kpi-content">
            <span className="zbm-ov-kpi-label">Zone Revenue (CY)</span>
            <span className="zbm-ov-kpi-value">
              ₹{Utils.formatShortCurrency ? Utils.formatShortCurrency(overallTotals.cyRev) : Utils.formatCompact(overallTotals.cyRev)}
            </span>
            <span className={`zbm-ov-kpi-growth ${overallTotals.revGrowth >= 0 ? 'positive' : 'negative'}`}>
              <i className={`fas fa-arrow-${overallTotals.revGrowth >= 0 ? 'up' : 'down'}`}></i>
              {Utils.formatGrowth(overallTotals.revGrowth)} vs LY
            </span>
          </div>
        </div>

        <div className="zbm-ov-kpi-card zbm-ov-kpi-qty">
          <div className="zbm-ov-kpi-icon"><i className="fas fa-boxes"></i></div>
          <div className="zbm-ov-kpi-content">
            <span className="zbm-ov-kpi-label">Zone Target (CY Qty)</span>
            <span className="zbm-ov-kpi-value">{Utils.formatNumber(overallTotals.cyQty)}</span>
            <span className={`zbm-ov-kpi-growth ${overallTotals.qtyGrowth >= 0 ? 'positive' : 'negative'}`}>
              <i className={`fas fa-arrow-${overallTotals.qtyGrowth >= 0 ? 'up' : 'down'}`}></i>
              {Utils.formatGrowth(overallTotals.qtyGrowth)} vs LY
            </span>
          </div>
        </div>

        <div className="zbm-ov-kpi-card zbm-ov-kpi-abms">
          <div className="zbm-ov-kpi-icon"><i className="fas fa-user-shield"></i></div>
          <div className="zbm-ov-kpi-content">
            <span className="zbm-ov-kpi-label">ABMs Under Zone</span>
            <span className="zbm-ov-kpi-value">{abmSummary.length}</span>
            <span className="zbm-ov-kpi-sub">
              {approvalStats.approved || 0} approved / {approvalStats.pending || 0} pending
            </span>
          </div>
        </div>

        <div className="zbm-ov-kpi-card zbm-ov-kpi-approval">
          <div className="zbm-ov-kpi-icon"><i className="fas fa-clipboard-check"></i></div>
          <div className="zbm-ov-kpi-content">
            <span className="zbm-ov-kpi-label">Approval Progress</span>
            <span className="zbm-ov-kpi-value">
              {approvalStats.total > 0 ? Math.round((approvalStats.approved / approvalStats.total) * 100) : 0}%
            </span>
            <div className="zbm-ov-kpi-progress-bar">
              <div
                className="zbm-ov-kpi-progress-fill"
                style={{ width: `${approvalStats.total > 0 ? (approvalStats.approved / approvalStats.total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* ABM Performance */}
      <div className="zbm-ov-section">
        <h3 className="zbm-ov-section-title"><i className="fas fa-user-shield"></i> ABM Performance</h3>
        <div className="zbm-ov-abm-grid">
          {abmSummary.map(abm => {
            const g = Utils.calcGrowth(abm.totalLyRev, abm.totalCyRev);
            return (
              <div key={abm.id} className="zbm-ov-abm-card">
                <div className="zbm-ov-abm-header">
                  <div className="zbm-ov-abm-avatar">
                    {abm.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  <div className="zbm-ov-abm-info">
                    <span className="zbm-ov-abm-name">{abm.name}</span>
                    <span className="zbm-ov-abm-territory">{abm.territory}</span>
                  </div>
                  <span className={`zbm-ov-abm-status ${abm.submitted > 0 ? 'pending' : 'done'}`}>
                    {abm.submitted > 0 ? `${abm.submitted} pending` : 'All approved'}
                  </span>
                </div>
                <div className="zbm-ov-abm-metrics">
                  <div className="zbm-ov-abm-metric">
                    <span className="zbm-ov-abm-metric-label">CY Revenue</span>
                    <span className="zbm-ov-abm-metric-value">₹{Utils.formatCompact(abm.totalCyRev)}</span>
                  </div>
                  <div className="zbm-ov-abm-metric">
                    <span className="zbm-ov-abm-metric-label">Growth</span>
                    <span className={`zbm-ov-abm-metric-value ${g >= 0 ? 'positive' : 'negative'}`}>
                      {g >= 0 ? '↑' : '↓'}{Utils.formatGrowth(g)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Performance */}
      <div className="zbm-ov-section">
        <h3 className="zbm-ov-section-title"><i className="fas fa-th-large"></i> Category Performance</h3>
        <div className="zbm-ov-category-grid">
          {categoryPerformance.map(cat => (
            <div key={cat.id} className="zbm-ov-cat-card">
              <div className="zbm-ov-cat-header">
                <div className="zbm-ov-cat-icon"><i className={`fas ${cat.icon}`}></i></div>
                <span className="zbm-ov-cat-name">{cat.name}</span>
                <span className="zbm-ov-cat-contribution">{cat.contribution}%</span>
              </div>
              <div className="zbm-ov-cat-metrics">
                <div className="zbm-ov-cat-row">
                  <span>CY Qty</span>
                  <span className="zbm-ov-cat-bold">{Utils.formatNumber(cat.cyQty)}</span>
                </div>
                <div className="zbm-ov-cat-row">
                  <span>Growth</span>
                  <span className={cat.growth >= 0 ? 'positive' : 'negative'}>
                    {cat.growth >= 0 ? '↑' : '↓'}{Utils.formatGrowth(cat.growth)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ZBMOverviewStats;
