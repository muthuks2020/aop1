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

  const overallTotals = useMemo(() => {
    let lyQty = 0, cyQty = 0, lyRev = 0, cyRev = 0;
    let lyAchQty = 0, lyAchRev = 0;
    abmSubmissions.forEach(p => {
      if (p.monthlyTargets) {
        Object.values(p.monthlyTargets).forEach(m => {
          lyQty    += m.lyQty    || 0;
          cyQty    += m.cyQty    || 0;
          lyRev    += m.lyRev    || 0;
          cyRev    += m.cyRev    || 0;

          lyAchQty += m.lyAchQty !== undefined ? (m.lyAchQty || 0) : (m.lyQty || 0) * 0.92;
          lyAchRev += m.lyAchRev !== undefined ? (m.lyAchRev || 0) : (m.lyRev || 0) * 0.92;
        });
      }
    });
    return {
      lyQty, cyQty, lyRev, cyRev, lyAchQty, lyAchRev,

      qtyGrowthTgt: Utils.calcGrowth(lyQty, cyQty),
      revGrowthTgt: Utils.calcGrowth(lyRev, cyRev),

      qtyAchPct: lyQty > 0 ? Math.round((lyAchQty / lyQty) * 100) : 0,
      revAchPct: lyRev > 0 ? Math.round((lyAchRev / lyRev) * 100) : 0,
    };
  }, [abmSubmissions]);

  const abmSummary = useMemo(() => {
    const map = {};
    abmSubmissions.forEach(p => {
      const key = p.employeeCode || p.abmCode || p.id;
      if (!map[key]) {
        map[key] = {
          id: key,
          name: p.employeeName || p.abmName || key,
          territory: p.area || p.areaName || '',
          submitted: 0,
          totalLyRev: 0, totalCyRev: 0, totalLyAchRev: 0,
        };
      }
      const e = map[key];
      if (p.status === 'submitted') e.submitted++;
      if (p.monthlyTargets) {
        Object.values(p.monthlyTargets).forEach(m => {
          e.totalLyRev  += m.lyRev  || 0;
          e.totalCyRev  += m.cyRev  || 0;

          e.totalLyAchRev += m.lyAchRev !== undefined ? (m.lyAchRev || 0) : (m.lyRev || 0) * 0.92;
        });
      }
    });
    return Object.values(map);
  }, [abmSubmissions]);

  const categoryPerformance = useMemo(() => {
    const totalCyQty = overallTotals.cyQty || 1;
    const totalCyRev = overallTotals.cyRev || 1;

    return categories.map(cat => {
      const catProducts = abmSubmissions.filter(p => p.categoryId === cat.id);
      let lyQty = 0, cyQty = 0, lyRev = 0, cyRev = 0, lyAchQty = 0;
      catProducts.forEach(p => {
        if (p.monthlyTargets) {
          Object.values(p.monthlyTargets).forEach(m => {
            lyQty    += m.lyQty    || 0;
            cyQty    += m.cyQty    || 0;
            lyRev    += m.lyRev    || 0;
            cyRev    += m.cyRev    || 0;
            lyAchQty += m.lyAchQty !== undefined ? (m.lyAchQty || 0) : (m.lyQty || 0) * 0.92;
          });
        }
      });

      const growthTgt = Utils.calcGrowth(lyQty, cyQty);
      const growthAch = lyQty > 0
        ? Math.round((lyAchQty / lyQty) * 100) : 0;
      const contribQty = Math.round((cyQty / totalCyQty) * 100);
      const contribRev = Math.round((cyRev / totalCyRev) * 100);

      return {
        ...cat,
        lyQty, cyQty, lyRev, cyRev, lyAchQty,
        growthTgt,
        growthAch,
        contribQty,
        contribRev,
      };
    });
  }, [abmSubmissions, categories, overallTotals]);

  return (
    <div className={`zbm-overview ${animateIn ? 'animate-in' : ''}`}>

      {}
      <div className="zbm-ov-kpi-row">

        {}
        <div className="zbm-ov-kpi-card zbm-ov-kpi-revenue">
          <div className="zbm-ov-kpi-icon"><i className="fas fa-rupee-sign"></i></div>
          <div className="zbm-ov-kpi-content">
            <span className="zbm-ov-kpi-label">CY Revenue Target</span>
            <span className="zbm-ov-kpi-value">₹{Utils.formatCompact(overallTotals.cyRev)}</span>
            <span className="zbm-ov-kpi-sub">
              {}
              LY Tgt: ₹{Utils.formatCompact(overallTotals.lyRev)}
            </span>
            {}
            <span className={`zbm-ov-kpi-growth ${overallTotals.revGrowthTgt >= 0 ? 'positive' : 'negative'}`}>
              <i className={`fas fa-arrow-${overallTotals.revGrowthTgt >= 0 ? 'up' : 'down'}`}></i>
              {Utils.formatGrowth(overallTotals.revGrowthTgt)} Tgt Growth
            </span>
            {}
            <span className={`zbm-ov-kpi-growth ${overallTotals.revAchPct >= 100 ? 'positive' : 'negative'}`}
              style={{ marginLeft: '0.5rem' }}>
              <i className="fas fa-check-circle"></i>
              {overallTotals.revAchPct}% LY Ahv
            </span>
          </div>
        </div>

        {}
        <div className="zbm-ov-kpi-card zbm-ov-kpi-qty">
          <div className="zbm-ov-kpi-icon"><i className="fas fa-boxes"></i></div>
          <div className="zbm-ov-kpi-content">
            <span className="zbm-ov-kpi-label">CY Quantity Target</span>
            <span className="zbm-ov-kpi-value">{Utils.formatNumber(overallTotals.cyQty)}</span>
            {}
            <span className="zbm-ov-kpi-sub">LY Tgt: {Utils.formatNumber(overallTotals.lyQty)}</span>
            {}
            <span className={`zbm-ov-kpi-growth ${overallTotals.qtyGrowthTgt >= 0 ? 'positive' : 'negative'}`}>
              <i className={`fas fa-arrow-${overallTotals.qtyGrowthTgt >= 0 ? 'up' : 'down'}`}></i>
              {Utils.formatGrowth(overallTotals.qtyGrowthTgt)} Tgt Growth
            </span>
            {}
            <span className={`zbm-ov-kpi-growth ${overallTotals.qtyAchPct >= 100 ? 'positive' : 'negative'}`}
              style={{ marginLeft: '0.5rem' }}>
              <i className="fas fa-check-circle"></i>
              {overallTotals.qtyAchPct}% LY Ahv
            </span>
          </div>
        </div>

        {}
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

        {}
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

      {}
      <div className="zbm-ov-section">
        <h3 className="zbm-ov-section-title"><i className="fas fa-user-shield"></i> ABM Performance</h3>
        <div className="zbm-ov-abm-grid">
          {abmSummary.map(abm => {
            const g = Utils.calcGrowth(abm.totalLyRev, abm.totalCyRev);

            const abmAchPct = abm.totalLyRev > 0
              ? Math.round((abm.totalLyAchRev / abm.totalLyRev) * 100) : 0;

            const abmContrib = overallTotals.cyRev > 0
              ? ((abm.totalCyRev / overallTotals.cyRev) * 100).toFixed(1) : '0';

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
                    <span className="zbm-ov-abm-metric-label">CY Rev</span>
                    <span className="zbm-ov-abm-metric-value">₹{Utils.formatCompact(abm.totalCyRev)}</span>
                  </div>
                  {}
                  <div className="zbm-ov-abm-metric">
                    <span className="zbm-ov-abm-metric-label">LY Tgt</span>
                    <span className="zbm-ov-abm-metric-value">₹{Utils.formatCompact(abm.totalLyRev)}</span>
                  </div>
                  {}
                  <div className="zbm-ov-abm-metric">
                    <span className="zbm-ov-abm-metric-label">Tgt Growth</span>
                    <span className={`zbm-ov-abm-metric-value ${g >= 0 ? 'positive' : 'negative'}`}>
                      {g >= 0 ? '↑' : '↓'}{Utils.formatGrowth(g)}
                    </span>
                  </div>
                  {}
                  <div className="zbm-ov-abm-metric">
                    <span className="zbm-ov-abm-metric-label">LY Ahv %</span>
                    <span className={`zbm-ov-abm-metric-value ${abmAchPct >= 100 ? 'positive' : 'negative'}`}>
                      {abmAchPct}%
                    </span>
                  </div>
                  {}
                  <div className="zbm-ov-abm-metric">
                    <span className="zbm-ov-abm-metric-label">Contrib %</span>
                    <span className="zbm-ov-abm-metric-value">{abmContrib}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {}
      <div className="zbm-ov-section">
        <h3 className="zbm-ov-section-title"><i className="fas fa-th-large"></i> Category Performance</h3>
        <div className="zbm-ov-category-grid">
          {categoryPerformance.map(cat => (
            <div key={cat.id} className="zbm-ov-cat-card">
              <div className="zbm-ov-cat-header">
                <div className="zbm-ov-cat-icon"><i className={`fas ${cat.icon}`}></i></div>
                <span className="zbm-ov-cat-name">{cat.name}</span>
                {}
                <span className="zbm-ov-cat-contribution" title="Contribution % of CY target">
                  {cat.contribQty}%
                </span>
              </div>
              <div className="zbm-ov-cat-metrics">
                <div className="zbm-ov-cat-row">
                  <span>CY Qty</span>
                  <span className="zbm-ov-cat-bold">{Utils.formatNumber(cat.cyQty)}</span>
                </div>
                {}
                <div className="zbm-ov-cat-row">
                  <span>LY Tgt</span>
                  <span>{Utils.formatNumber(cat.lyQty)}</span>
                </div>
                {}
                <div className="zbm-ov-cat-row">
                  <span>Tgt Growth</span>
                  <span className={cat.growthTgt >= 0 ? 'positive' : 'negative'}>
                    {cat.growthTgt >= 0 ? '↑' : '↓'}{Utils.formatGrowth(cat.growthTgt)}
                  </span>
                </div>
                {}
                <div className="zbm-ov-cat-row">
                  <span>LY Ahv %</span>
                  <span className={cat.growthAch >= 100 ? 'positive' : 'negative'}>
                    {cat.growthAch}%
                  </span>
                </div>
                {}
                <div className="zbm-ov-cat-row">
                  <span>Rev Contrib</span>
                  <span>{cat.contribRev}%</span>
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
