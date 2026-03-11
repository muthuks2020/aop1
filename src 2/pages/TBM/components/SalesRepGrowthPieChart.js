/**
 * SalesRepGrowthPieChart Component
 * 
 * Reusable pie chart that shows the cumulative CY Revenue contribution 
 * and growth % of each Sales Rep under a TBM.
 * Reuses the Sales Rep OverviewStats pie chart design pattern.
 * 
 * Used in: TBM Dashboard → Approvals Tab (replaces abm-approval-stats)
 * 
 * PROPS:
 *   salesRepSubmissions - Array of sales rep product submissions with monthlyTargets
 *   approvalStats       - { total, pending, approved, rejected }
 * 
 * API INTEGRATION NOTES:
 * - Currently computes data from salesRepSubmissions prop
 * - Replace with API call when backend is ready:
 *   GET /api/v1/tbm/sales-rep-growth-summary
 *   Response: { salesReps: [{ id, name, territory, cyRev, lyRev, cyQty, lyQty, growthPct, contributionPct }] }
 * 
 * @author Appasamy Associates - Product Commitment PWA
 * @version 1.0.0
 */

import React, { useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts';
import { Utils } from '../../../utils/helpers';
import '../../../styles/tbm/salesRepGrowthPie.css';

// Color palette for sales rep slices
const REP_COLORS = [
  '#1B4D7A', '#00A19B', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#3B82F6', '#10B981',
  '#6366F1', '#E11D48', '#0EA5E9', '#84CC16', '#D946EF'
];

// Months for iterating
const MONTHS = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];

// ==================== CUSTOM TOOLTIP ====================
const RepPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const repData = data.payload;
    return (
      <div className="srg-pie-tooltip">
        <div className="srg-pie-tooltip-dot" style={{ background: repData.fill }}></div>
        <div className="srg-pie-tooltip-content">
          <span className="srg-pie-tooltip-name">{data.name}</span>
          <span className="srg-pie-tooltip-territory">{repData.territory}</span>
          <span className="srg-pie-tooltip-value">₹{Utils.formatCompact(data.value)}</span>
          <span className="srg-pie-tooltip-pct">{(repData.percent * 100).toFixed(1)}% share</span>
          <span className={`srg-pie-tooltip-growth ${repData.growth >= 0 ? 'positive' : 'negative'}`}>
            {repData.growth >= 0 ? '↑' : '↓'} {Math.abs(repData.growth).toFixed(1)}% growth
          </span>
        </div>
      </div>
    );
  }
  return null;
};

// ==================== CUSTOM LABEL ON PIE SLICES ====================
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null; // Don't label slices < 5%
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {(percent * 100).toFixed(0)}%
    </text>
  );
};

// ==================== MAIN COMPONENT ====================
function SalesRepGrowthPieChart({ salesRepSubmissions = [], approvalStats = {} }) {
  const [viewMode, setViewMode] = useState('revenue'); // 'revenue' | 'quantity'

  // ==================== AGGREGATE DATA BY SALES REP ====================
  // TODO: Replace with GET /api/v1/tbm/sales-rep-growth-summary
  const salesRepSummary = useMemo(() => {
    const repMap = {};

    salesRepSubmissions.forEach(sub => {
      const repId = sub.salesRepId;
      if (!repMap[repId]) {
        repMap[repId] = {
          id: repId,
          name: sub.salesRepName || `Rep ${repId}`,
          territory: sub.territory || 'Unknown',
          lyRev: 0, cyRev: 0,
          lyQty: 0, cyQty: 0,
          productCount: 0,
          status: sub.status
        };
      }

      repMap[repId].productCount += 1;

      if (sub.monthlyTargets) {
        MONTHS.forEach(m => {
          const md = sub.monthlyTargets[m];
          if (md) {
            repMap[repId].lyRev += md.lyRev || 0;
            repMap[repId].cyRev += md.cyRev || 0;
            repMap[repId].lyQty += md.lyQty || 0;
            repMap[repId].cyQty += md.cyQty || 0;
          }
        });
      }
    });

    // Compute growth & contribution
    const reps = Object.values(repMap);
    const totalCyRev = reps.reduce((sum, r) => sum + r.cyRev, 0);
    const totalCyQty = reps.reduce((sum, r) => sum + r.cyQty, 0);

    return reps.map(rep => ({
      ...rep,
      revGrowth: Utils.calcGrowth(rep.lyRev, rep.cyRev),
      qtyGrowth: Utils.calcGrowth(rep.lyQty, rep.cyQty),
      revContribution: totalCyRev > 0 ? (rep.cyRev / totalCyRev) * 100 : 0,
      qtyContribution: totalCyQty > 0 ? (rep.cyQty / totalCyQty) * 100 : 0,
    })).sort((a, b) => b.cyRev - a.cyRev);
  }, [salesRepSubmissions]);

  // Prepare pie chart data
  const chartData = useMemo(() => {
    const isRev = viewMode === 'revenue';
    return salesRepSummary.map((rep, idx) => ({
      name: rep.name,
      value: isRev ? rep.cyRev : rep.cyQty,
      territory: rep.territory,
      growth: isRev ? rep.revGrowth : rep.qtyGrowth,
      contribution: isRev ? rep.revContribution : rep.qtyContribution,
      fill: REP_COLORS[idx % REP_COLORS.length],
      percent: isRev
        ? (salesRepSummary.reduce((s, r) => s + r.cyRev, 0) > 0
          ? rep.cyRev / salesRepSummary.reduce((s, r) => s + r.cyRev, 0)
          : 0)
        : (salesRepSummary.reduce((s, r) => s + r.cyQty, 0) > 0
          ? rep.cyQty / salesRepSummary.reduce((s, r) => s + r.cyQty, 0)
          : 0),
      productCount: rep.productCount,
      lyValue: isRev ? rep.lyRev : rep.lyQty,
      cyValue: isRev ? rep.cyRev : rep.cyQty,
    })).filter(d => d.value > 0);
  }, [salesRepSummary, viewMode]);

  const totalValue = useMemo(() => {
    return chartData.reduce((sum, d) => sum + d.value, 0);
  }, [chartData]);

  // Overall team growth
  const overallGrowth = useMemo(() => {
    const totalLy = salesRepSummary.reduce((s, r) => s + (viewMode === 'revenue' ? r.lyRev : r.lyQty), 0);
    const totalCy = salesRepSummary.reduce((s, r) => s + (viewMode === 'revenue' ? r.cyRev : r.cyQty), 0);
    return Utils.calcGrowth(totalLy, totalCy);
  }, [salesRepSummary, viewMode]);

  const hasData = chartData.length > 0 && totalValue > 0;

  return (
    <div className="srg-container">
      <div className="srg-pie-card">
        {/* ---- Card Header ---- */}
        <div className="srg-pie-card-header">
          <div className="srg-pie-card-title-row">
            <div className="srg-pie-card-icon">
              <i className="fas fa-users"></i>
            </div>
            <div>
              <h3 className="srg-pie-card-title">Sales Rep Growth Overview</h3>
              <span className="srg-pie-card-subtitle">
                Cumulative contribution & growth of each Sales Rep
              </span>
            </div>
          </div>
          <div className="srg-pie-card-stats">
            <div className="srg-pie-stat">
              <span className="srg-pie-stat-value">{salesRepSummary.length}</span>
              <span className="srg-pie-stat-label">Reps</span>
            </div>
            <div className="srg-pie-stat">
              <span className="srg-pie-stat-value pending">{approvalStats.pending || 0}</span>
              <span className="srg-pie-stat-label">Pending</span>
            </div>
            <div className="srg-pie-stat">
              <span className="srg-pie-stat-value approved">{approvalStats.approved || 0}</span>
              <span className="srg-pie-stat-label">Approved</span>
            </div>
            <div className="srg-pie-stat">
              <span className={`srg-pie-stat-value ${overallGrowth >= 0 ? 'positive' : 'negative'}`}>
                {overallGrowth >= 0 ? '+' : ''}{overallGrowth.toFixed(1)}%
              </span>
              <span className="srg-pie-stat-label">Team Growth</span>
            </div>
          </div>
        </div>

        {/* ---- Side-by-side body: Pie Left | Breakdown Right ---- */}
        {hasData ? (
          <div className="srg-pie-body">
            {/* LEFT — Pie Chart */}
            <div className="srg-pie-body-left">
              <div className="srg-pie-chart-wrap">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                      labelLine={false}
                      label={renderCustomLabel}
                      animationBegin={0}
                      animationDuration={800}
                      animationEasing="ease-out"
                    >
                      {chartData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} stroke="#fff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip content={<RepPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="srg-pie-center-label">
                  <span className="srg-pie-center-count">{salesRepSummary.length}</span>
                  <span className="srg-pie-center-text">REPS</span>
                </div>
              </div>
            </div>

            {/* RIGHT — Dropdown + Breakdown List */}
            <div className="srg-pie-body-right">
              {/* View mode selector */}
              <div className="srg-pie-dropdown-row">
                <select
                  className="srg-pie-dropdown"
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value)}
                >
                  <option value="revenue">By Revenue (₹)</option>
                  <option value="quantity">By Quantity</option>
                </select>
              </div>

              {/* Breakdown list */}
              <div className="srg-pie-breakdown">
                <div className="srg-pie-breakdown-header">
                  <span>SALES REP</span>
                  <span>{viewMode === 'revenue' ? 'CY REV' : 'CY QTY'}</span>
                  <span>GROWTH</span>
                  <span>SHARE</span>
                </div>
                <div className="srg-pie-breakdown-body">
                  {chartData.map((rep, idx) => (
                    <div key={idx} className="srg-pie-breakdown-row">
                      <div className="srg-pie-breakdown-name">
                        <span className="srg-pie-breakdown-dot" style={{ background: rep.fill }}></span>
                        <div className="srg-pie-breakdown-rep-info">
                          <span className="srg-pie-breakdown-label">{rep.name}</span>
                          <span className="srg-pie-breakdown-territory">{rep.territory}</span>
                        </div>
                      </div>
                      <span className="srg-pie-breakdown-val">
                        {viewMode === 'revenue' ? `₹${Utils.formatCompact(rep.value)}` : Utils.formatNumber(rep.value)}
                      </span>
                      <span className={`srg-pie-breakdown-growth ${rep.growth >= 0 ? 'positive' : 'negative'}`}>
                        <i className={`fas fa-arrow-${rep.growth >= 0 ? 'up' : 'down'}`}></i>
                        {Math.abs(rep.growth).toFixed(1)}%
                      </span>
                      <span className="srg-pie-breakdown-pct">{rep.contribution.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="srg-pie-empty">
            <i className="fas fa-inbox"></i>
            <p>No sales rep submissions yet</p>
            <span>Sales reps need to submit their targets for review</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default SalesRepGrowthPieChart;
