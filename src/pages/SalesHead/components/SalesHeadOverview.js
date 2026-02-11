/**
 * SalesHeadOverview Component
 * Executive-level dashboard with graphical analytics
 * 
 * Colors: Appasamy Brand Navy (#0C2340) + Teal (#0097A7)
 * Pure CSS + SVG charts (no external chart library)
 * 
 * @author Appasamy Associates - Product Commitment PWA
 * @version 1.1.0 — Brand-aligned colors
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Utils } from '../../../utils/helpers';
import { SalesHeadApiService } from '../../../services/salesHeadApi';
import '../../../styles/saleshead/shOverview.css';

const MONTHS = ['apr','may','jun','jul','aug','sep','oct','nov','dec','jan','feb','mar'];
const MONTH_LABELS = ['APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC','JAN','FEB','MAR'];

// Appasamy-aligned professional palette
const PIE_COLORS = ['#0C2340', '#0097A7', '#4F46E5', '#D97706', '#2E7D32', '#7C3AED'];
const REGION_COLORS = { 'zbm1': '#0C2340', 'zbm2': '#0097A7', 'zbm3': '#4F46E5', 'zbm4': '#D97706' };

function PieChart({ data, size = 200, innerRadius = 0.55, showLabels = true }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return <div className="sh-ov-pie-empty">No data</div>;

  const radius = size / 2;
  const center = radius;
  const outerR = radius - 8;
  const innerR = outerR * innerRadius;
  let cumAngle = -Math.PI / 2;

  const slices = data.map((d, i) => {
    const angle = (d.value / total) * 2 * Math.PI;
    const startAngle = cumAngle;
    const endAngle = cumAngle + angle;
    cumAngle = endAngle;

    const x1 = center + outerR * Math.cos(startAngle);
    const y1 = center + outerR * Math.sin(startAngle);
    const x2 = center + outerR * Math.cos(endAngle);
    const y2 = center + outerR * Math.sin(endAngle);
    const ix1 = center + innerR * Math.cos(endAngle);
    const iy1 = center + innerR * Math.sin(endAngle);
    const ix2 = center + innerR * Math.cos(startAngle);
    const iy2 = center + innerR * Math.sin(startAngle);
    const largeArc = angle > Math.PI ? 1 : 0;

    const path = [
      `M ${x1} ${y1}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${ix1} ${iy1}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2}`,
      'Z'
    ].join(' ');

    return { ...d, path, pct: ((d.value / total) * 100).toFixed(1), color: d.color || PIE_COLORS[i % PIE_COLORS.length] };
  });

  return (
    <div className="sh-ov-pie-wrapper">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((slice, i) => (
          <path key={i} d={slice.path} fill={slice.color} stroke="#fff" strokeWidth="2" className="sh-ov-pie-slice">
            <title>{slice.label}: ₹{Utils.formatCompact(slice.value)} ({slice.pct}%)</title>
          </path>
        ))}
        <text x={center} y={center - 8} textAnchor="middle" className="sh-ov-pie-center-value">₹{Utils.formatCompact(total)}</text>
        <text x={center} y={center + 12} textAnchor="middle" className="sh-ov-pie-center-label">Total</text>
      </svg>
      {showLabels && (
        <div className="sh-ov-pie-legend">
          {slices.map((s, i) => (
            <div key={i} className="sh-ov-pie-legend-item">
              <span className="sh-ov-pie-legend-dot" style={{ background: s.color }}></span>
              <span className="sh-ov-pie-legend-label">{s.label}</span>
              <span className="sh-ov-pie-legend-pct">{s.pct}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MonthlyTrendChart({ data }) {
  const maxVal = Math.max(...data.map(d => Math.max(d.lyRev, d.cyRev)), 1);
  return (
    <div className="sh-ov-trend-chart">
      <div className="sh-ov-trend-bars">
        {data.map((d, i) => (
          <div key={i} className="sh-ov-trend-month-col">
            <div className="sh-ov-trend-bar-group">
              <div className="sh-ov-trend-bar ly" style={{ height: `${(d.lyRev / maxVal) * 100}%` }} title={`LY: ₹${Utils.formatCompact(d.lyRev)}`}></div>
              <div className="sh-ov-trend-bar cy" style={{ height: `${(d.cyRev / maxVal) * 100}%` }} title={`CY: ₹${Utils.formatCompact(d.cyRev)}`}></div>
            </div>
            <span className="sh-ov-trend-label">{MONTH_LABELS[i]}</span>
          </div>
        ))}
      </div>
      <div className="sh-ov-trend-legend">
        <span className="sh-ov-trend-legend-item"><span className="sh-ov-trend-dot ly"></span> LY Revenue</span>
        <span className="sh-ov-trend-legend-item"><span className="sh-ov-trend-dot cy"></span> CY Target</span>
      </div>
    </div>
  );
}

function SalesHeadOverview({ zbmSubmissions = [], categories = [], approvalStats = {} }) {
  const [animateIn, setAnimateIn] = useState(false);
  const [regionalData, setRegionalData] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => setAnimateIn(true), 100);
    loadChartData();
    return () => clearTimeout(timer);
  }, []);

  const loadChartData = async () => {
    try {
      const [regional, trend] = await Promise.all([
        SalesHeadApiService.getRegionalPerformance(),
        SalesHeadApiService.getMonthlyTrend()
      ]);
      setRegionalData(regional);
      setMonthlyTrend(trend);
    } catch (err) { console.error('Failed to load chart data:', err); }
  };

  const overallTotals = useMemo(() => {
    let lyQty = 0, cyQty = 0, lyRev = 0, cyRev = 0;
    zbmSubmissions.forEach(p => {
      if (p.monthlyTargets) {
        Object.values(p.monthlyTargets).forEach(m => {
          lyQty += m.lyQty || 0; cyQty += m.cyQty || 0;
          lyRev += m.lyRev || 0; cyRev += m.cyRev || 0;
        });
      }
    });
    return { lyQty, cyQty, lyRev, cyRev, qtyGrowth: Utils.calcGrowth(lyQty, cyQty), revGrowth: Utils.calcGrowth(lyRev, cyRev) };
  }, [zbmSubmissions]);

  const regionPieData = useMemo(() => {
    return regionalData.map((r, i) => ({
      label: r.territory, value: r.cyRev,
      color: REGION_COLORS[r.id] || PIE_COLORS[i % PIE_COLORS.length]
    }));
  }, [regionalData]);

  const categoryPieData = useMemo(() => {
    const catColors = { equipment: '#0C2340', iol: '#0097A7', ovd: '#4F46E5', pharma: '#2E7D32', mis: '#D97706', others: '#64748B' };
    return categories.map(cat => {
      let cyRev = 0;
      zbmSubmissions.filter(p => p.categoryId === cat.id).forEach(p => {
        if (p.monthlyTargets) Object.values(p.monthlyTargets).forEach(m => { cyRev += m.cyRev || 0; });
      });
      return { label: cat.name, value: cyRev, color: catColors[cat.id] || '#64748B' };
    }).filter(d => d.value > 0);
  }, [zbmSubmissions, categories]);

  const categoryPerformance = useMemo(() => {
    return categories.map(cat => {
      const catProducts = zbmSubmissions.filter(p => p.categoryId === cat.id);
      let lyQty = 0, cyQty = 0, lyRev = 0, cyRev = 0;
      catProducts.forEach(p => {
        if (p.monthlyTargets) {
          Object.values(p.monthlyTargets).forEach(m => {
            lyQty += m.lyQty || 0; cyQty += m.cyQty || 0;
            lyRev += m.lyRev || 0; cyRev += m.cyRev || 0;
          });
        }
      });
      const growth = Utils.calcGrowth(lyRev, cyRev);
      const contribution = overallTotals.cyRev > 0 ? Math.round((cyRev / overallTotals.cyRev) * 100) : 0;
      return { ...cat, lyQty, cyQty, lyRev, cyRev, growth, contribution };
    });
  }, [zbmSubmissions, categories, overallTotals]);

  const zbmPerformance = useMemo(() => {
    const zbmMap = {};
    zbmSubmissions.forEach(s => {
      if (!zbmMap[s.zbmId]) zbmMap[s.zbmId] = { id: s.zbmId, name: s.zbmName, territory: s.territory, submitted: 0, approved: 0, totalCyRev: 0, totalLyRev: 0 };
      const z = zbmMap[s.zbmId];
      if (s.status === 'submitted') z.submitted++;
      if (s.status === 'approved') z.approved++;
      if (s.monthlyTargets) Object.values(s.monthlyTargets).forEach(m => { z.totalCyRev += m.cyRev || 0; z.totalLyRev += m.lyRev || 0; });
    });
    return Object.values(zbmMap);
  }, [zbmSubmissions]);

  const approvedPct = approvalStats.total > 0 ? Math.round((approvalStats.approved / approvalStats.total) * 100) : 0;

  return (
    <div className={`sh-overview ${animateIn ? 'sh-ov-animate-in' : ''}`}>
      {/* KPIs */}
      <div className="sh-ov-kpi-grid">
        <div className="sh-ov-kpi-card sh-ov-kpi-revenue">
          <div className="sh-ov-kpi-icon"><i className="fas fa-rupee-sign"></i></div>
          <div className="sh-ov-kpi-info">
            <span className="sh-ov-kpi-label">National CY Revenue Target</span>
            <span className="sh-ov-kpi-value">₹{Utils.formatCompact(overallTotals.cyRev)}</span>
            <span className={`sh-ov-kpi-growth ${overallTotals.revGrowth >= 0 ? 'positive' : 'negative'}`}>
              {overallTotals.revGrowth >= 0 ? '↑' : '↓'} {Utils.formatGrowth(overallTotals.revGrowth)} vs LY
            </span>
          </div>
        </div>
        <div className="sh-ov-kpi-card sh-ov-kpi-qty">
          <div className="sh-ov-kpi-icon"><i className="fas fa-boxes-stacked"></i></div>
          <div className="sh-ov-kpi-info">
            <span className="sh-ov-kpi-label">National CY Qty Target</span>
            <span className="sh-ov-kpi-value">{Utils.formatNumber(overallTotals.cyQty)}</span>
            <span className={`sh-ov-kpi-growth ${overallTotals.qtyGrowth >= 0 ? 'positive' : 'negative'}`}>
              {overallTotals.qtyGrowth >= 0 ? '↑' : '↓'} {Utils.formatGrowth(overallTotals.qtyGrowth)} vs LY
            </span>
          </div>
        </div>
        <div className="sh-ov-kpi-card sh-ov-kpi-zones">
          <div className="sh-ov-kpi-icon"><i className="fas fa-globe-asia"></i></div>
          <div className="sh-ov-kpi-info">
            <span className="sh-ov-kpi-label">Zones Under Management</span>
            <span className="sh-ov-kpi-value">{zbmPerformance.length}</span>
            <span className="sh-ov-kpi-sub">{regionalData.reduce((s, r) => s + r.abmCount, 0)} ABMs · {regionalData.reduce((s, r) => s + r.tbmCount, 0)} TBMs · {regionalData.reduce((s, r) => s + r.repCount, 0)} Reps</span>
          </div>
        </div>
        <div className="sh-ov-kpi-card sh-ov-kpi-approval">
          <div className="sh-ov-kpi-icon"><i className="fas fa-clipboard-check"></i></div>
          <div className="sh-ov-kpi-info">
            <span className="sh-ov-kpi-label">Approval Progress</span>
            <span className="sh-ov-kpi-value">{approvedPct}%</span>
            <div className="sh-ov-kpi-progress"><div className="sh-ov-kpi-progress-bar" style={{ width: `${approvedPct}%` }}></div></div>
            <span className="sh-ov-kpi-sub">{approvalStats.approved || 0} of {approvalStats.total || 0} approved</span>
          </div>
        </div>
      </div>

      {/* PIE CHARTS */}
      <div className="sh-ov-charts-row">
        <div className="sh-ov-chart-card">
          <div className="sh-ov-chart-header"><h3><i className="fas fa-chart-pie"></i> Revenue by Region</h3></div>
          <PieChart data={regionPieData} size={220} />
        </div>
        <div className="sh-ov-chart-card">
          <div className="sh-ov-chart-header"><h3><i className="fas fa-chart-pie"></i> Revenue by Category</h3></div>
          <PieChart data={categoryPieData} size={220} />
        </div>
      </div>

      {/* MONTHLY TREND */}
      <div className="sh-ov-section">
        <h3 className="sh-ov-section-title"><i className="fas fa-chart-bar"></i> Monthly Revenue Trend — LY vs CY</h3>
        <div className="sh-ov-trend-card">
          {monthlyTrend.length > 0 ? <MonthlyTrendChart data={monthlyTrend} /> : <div className="sh-ov-loading-mini"><div className="loading-spinner"></div></div>}
        </div>
      </div>

      {/* ZBM PERFORMANCE */}
      <div className="sh-ov-section">
        <h3 className="sh-ov-section-title"><i className="fas fa-user-tie"></i> Zone Performance</h3>
        <div className="sh-ov-zbm-grid">
          {zbmPerformance.map(zbm => {
            const g = Utils.calcGrowth(zbm.totalLyRev, zbm.totalCyRev);
            return (
              <div key={zbm.id} className="sh-ov-zbm-card">
                <div className="sh-ov-zbm-header">
                  <div className="sh-ov-zbm-avatar">{zbm.name.split(' ').map(n => n[0]).join('').substring(0, 2)}</div>
                  <div>
                    <span className="sh-ov-zbm-name">{zbm.name}</span>
                    <span className="sh-ov-zbm-territory"><i className="fas fa-map-marker-alt"></i> {zbm.territory}</span>
                  </div>
                  <span className={`sh-ov-zbm-status ${zbm.submitted > 0 ? 'pending' : 'done'}`}>
                    {zbm.submitted > 0 ? `${zbm.submitted} pending` : 'All approved'}
                  </span>
                </div>
                <div className="sh-ov-zbm-metrics">
                  <div className="sh-ov-zbm-metric"><span className="sh-ov-zbm-metric-label">CY Revenue</span><span className="sh-ov-zbm-metric-value">₹{Utils.formatCompact(zbm.totalCyRev)}</span></div>
                  <div className="sh-ov-zbm-metric"><span className="sh-ov-zbm-metric-label">Growth</span><span className={`sh-ov-zbm-metric-value ${g >= 0 ? 'positive' : 'negative'}`}>{g >= 0 ? '↑' : '↓'}{Utils.formatGrowth(g)}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CATEGORY PERFORMANCE */}
      <div className="sh-ov-section">
        <h3 className="sh-ov-section-title"><i className="fas fa-th-large"></i> Category Performance</h3>
        <div className="sh-ov-category-grid">
          {categoryPerformance.map(cat => (
            <div key={cat.id} className="sh-ov-cat-card">
              <div className="sh-ov-cat-header">
                <div className="sh-ov-cat-icon"><i className={`fas ${cat.icon}`}></i></div>
                <span className="sh-ov-cat-name">{cat.name}</span>
                <span className="sh-ov-cat-contribution">{cat.contribution}%</span>
              </div>
              <div className="sh-ov-cat-metrics">
                <div className="sh-ov-cat-row"><span>CY Revenue</span><span className="sh-ov-cat-bold">₹{Utils.formatCompact(cat.cyRev)}</span></div>
                <div className="sh-ov-cat-row"><span>CY Qty</span><span className="sh-ov-cat-bold">{Utils.formatNumber(cat.cyQty)}</span></div>
                <div className="sh-ov-cat-row"><span>Growth</span><span className={cat.growth >= 0 ? 'positive' : 'negative'}>{cat.growth >= 0 ? '↑' : '↓'}{Utils.formatGrowth(cat.growth)}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SalesHeadOverview;
