/**
 * Sales Rep Overview Dashboard
 * Pie chart visualizations showing product & category contribution breakdowns
 * - Full Year pie chart (by Category + by Product)
 * - Quarterly pie charts (Q1–Q4) with same breakdowns
 * 
 * Uses Recharts for professional, PWA-friendly charts.
 * 
 * @author Appasamy Associates - Product Commitment PWA
 * @version 4.0.0 - Pie Chart redesign
 * 
 * API INTEGRATION NOTES:
 * - All data currently computed from props (products, categories)
 * - Replace with API calls when backend is ready:
 *   GET /api/v1/salesrep/dashboard-summary
 *   GET /api/v1/salesrep/contribution-breakdown?scope=yearly
 *   GET /api/v1/salesrep/contribution-breakdown?scope=quarterly&quarter=Q1
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts';
import { Utils } from '../../utils/helpers';
import '../../styles/overviewDashboard.css';

// Fiscal year months in order
const MONTHS = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];
const QUARTER_CONFIG = {
  Q1: { months: ['apr', 'may', 'jun'], label: 'Q1', fullLabel: 'Apr — Jun', color: '#4285F4', bg: 'rgba(66,133,244,0.08)' },
  Q2: { months: ['jul', 'aug', 'sep'], label: 'Q2', fullLabel: 'Jul — Sep', color: '#34A853', bg: 'rgba(52,168,83,0.08)' },
  Q3: { months: ['oct', 'nov', 'dec'], label: 'Q3', fullLabel: 'Oct — Dec', color: '#FBBC04', bg: 'rgba(251,188,4,0.08)' },
  Q4: { months: ['jan', 'feb', 'mar'], label: 'Q4', fullLabel: 'Jan — Mar', color: '#EA4335', bg: 'rgba(234,67,53,0.08)' }
};

// Professional color palette for pie slices
const CATEGORY_COLORS = ['#1B4D7A', '#00A19B', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];
const PRODUCT_COLORS = [
  '#1B4D7A', '#00A19B', '#3B82F6', '#10B981', '#F59E0B',
  '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316',
  '#6366F1', '#14B8A6', '#E11D48', '#7C3AED', '#0EA5E9',
  '#84CC16', '#D946EF', '#FB923C', '#22D3EE', '#A3E635'
];

// ==================== CUSTOM TOOLTIP ====================
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="ov-pie-tooltip">
        <div className="ov-pie-tooltip-dot" style={{ background: data.payload.fill }}></div>
        <div className="ov-pie-tooltip-content">
          <span className="ov-pie-tooltip-name">{data.name}</span>
          <span className="ov-pie-tooltip-value">₹{Utils.formatCompact(data.value)}</span>
          <span className="ov-pie-tooltip-pct">{(data.payload.percent * 100).toFixed(1)}%</span>
        </div>
      </div>
    );
  }
  return null;
};

// ==================== CUSTOM LEGEND (scrollable for many items) ====================
const CustomLegend = ({ payload, maxItems = 8 }) => {
  const [showAll, setShowAll] = useState(false);
  const items = showAll ? payload : payload.slice(0, maxItems);
  const hasMore = payload.length > maxItems;

  return (
    <div className="ov-pie-legend">
      {items.map((entry, idx) => (
        <div key={idx} className="ov-pie-legend-item">
          <span className="ov-pie-legend-dot" style={{ background: entry.color }}></span>
          <span className="ov-pie-legend-text">{entry.value}</span>
        </div>
      ))}
      {hasMore && (
        <button className="ov-pie-legend-toggle" onClick={() => setShowAll(!showAll)}>
          {showAll ? 'Show less' : `+${payload.length - maxItems} more`}
        </button>
      )}
    </div>
  );
};

// ==================== CUSTOM ACTIVE SHAPE LABEL ====================
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.04) return null; // Don't label slices < 4%
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

// ==================== PIE CHART CARD COMPONENT ====================
// Side-by-side layout: Pie chart (left) | Dropdown + Breakdown list (right)
const PieChartCard = ({ title, subtitle, categoryData, productData, totalValue, icon, accentColor, delay, isCompact }) => {
  const [viewMode, setViewMode] = useState('product'); // 'category' | 'product'
  const data = viewMode === 'category' ? categoryData : productData;
  const colors = viewMode === 'category' ? CATEGORY_COLORS : PRODUCT_COLORS;

  // Add fill color and percent to data
  const chartData = data.map((item, idx) => ({
    ...item,
    fill: colors[idx % colors.length],
    percent: totalValue > 0 ? item.value / totalValue : 0
  }));

  // Dynamic pie sizing based on compact mode (quarterly cards vs full year)
  const pieHeight = isCompact ? 260 : 360;
  const innerR = isCompact ? 50 : 75;
  const outerR = isCompact ? 100 : 145;

  return (
    <div className={`ov-pie-card ${isCompact ? 'ov-pie-card--compact' : ''}`} style={{ '--delay': delay, '--accent': accentColor || '#1B4D7A' }}>
      {/* ---- Card Header ---- */}
      <div className="ov-pie-card-header">
        <div className="ov-pie-card-title-row">
          <div className="ov-pie-card-icon">
            <i className={`fas ${icon || 'fa-chart-pie'}`}></i>
          </div>
          <div>
            <h3 className="ov-pie-card-title">{title}</h3>
            {subtitle && <span className="ov-pie-card-subtitle">{subtitle}</span>}
          </div>
        </div>
        <div className="ov-pie-card-total">
          <span className="ov-pie-card-total-label">Total Value</span>
          <span className="ov-pie-card-total-value">₹{Utils.formatCompact(totalValue)}</span>
        </div>
      </div>

      {/* ---- Side-by-side body: Pie Left | List Right ---- */}
      {totalValue > 0 ? (
        <div className="ov-pie-body">
          {/* LEFT — Pie Chart */}
          <div className="ov-pie-body-left">
            <div className="ov-pie-chart-wrap">
              <ResponsiveContainer width="100%" height={pieHeight}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={innerR}
                    outerRadius={outerR}
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
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Center label */}
              <div className="ov-pie-center-label">
                <span className="ov-pie-center-count">{data.length}</span>
                <span className="ov-pie-center-text">{viewMode === 'category' ? 'CATEGORIES' : 'PRODUCTS'}</span>
              </div>
            </div>
          </div>

          {/* RIGHT — Dropdown + Breakdown List */}
          <div className="ov-pie-body-right">
            {/* Dropdown selector */}
            <div className="ov-pie-dropdown-row">
              <select
                className="ov-pie-dropdown"
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
              >
                <option value="product">
                  By Product
                </option>
                <option value="category">
                  By Category
                </option>
              </select>
            </div>

            {/* Breakdown list */}
            <div className="ov-pie-breakdown">
              <div className="ov-pie-breakdown-header">
                <span>NAME</span>
                <span>VALUE (₹)</span>
                <span>SHARE</span>
              </div>
              <div className="ov-pie-breakdown-body">
                {chartData.map((item, idx) => (
                  <div key={idx} className="ov-pie-breakdown-row">
                    <div className="ov-pie-breakdown-name">
                      <span className="ov-pie-breakdown-dot" style={{ background: item.fill }}></span>
                      <span className="ov-pie-breakdown-label">{item.name}</span>
                    </div>
                    <span className="ov-pie-breakdown-val">₹{Utils.formatCompact(item.value)}</span>
                    <span className="ov-pie-breakdown-pct">{(item.percent * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="ov-pie-empty">
          <i className="fas fa-inbox"></i>
          <p>No target data entered yet</p>
          <span>Add targets in the Target Entry Grid</span>
        </div>
      )}
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
function OverviewStats({ products, categories }) {
  const [animateIn, setAnimateIn] = useState(false);
  const [activeQuarter, setActiveQuarter] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setAnimateIn(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // ==================== COMPUTED DATA ====================

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

  const achievementRate = overallTotals.lyQty > 0
    ? Math.round((overallTotals.cyQty / overallTotals.lyQty) * 100)
    : 0;

  // ==================== YEARLY PIE DATA ====================
  // Category breakdown for full year
  const yearlyCategoryData = useMemo(() => {
    return categories.map(cat => {
      const catProducts = products.filter(p => p.categoryId === cat.id);
      let cyRev = 0;
      catProducts.forEach(p => {
        if (p.monthlyTargets) {
          Object.values(p.monthlyTargets).forEach(m => {
            cyRev += m.cyRev || 0;
          });
        }
      });
      return { name: cat.name, value: cyRev, id: cat.id };
    }).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
  }, [categories, products]);

  // Product breakdown for full year
  const yearlyProductData = useMemo(() => {
    return products.map(p => {
      let cyRev = 0;
      if (p.monthlyTargets) {
        Object.values(p.monthlyTargets).forEach(m => {
          cyRev += m.cyRev || 0;
        });
      }
      return { name: p.name, value: cyRev, id: p.id, categoryId: p.categoryId };
    }).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
  }, [products]);

  const yearlyTotalValue = useMemo(() => {
    return yearlyProductData.reduce((sum, d) => sum + d.value, 0);
  }, [yearlyProductData]);

  // ==================== QUARTERLY PIE DATA ====================
  const quarterlyPieData = useMemo(() => {
    return Object.entries(QUARTER_CONFIG).map(([qId, qConfig]) => {
      // Category breakdown for this quarter
      const categoryData = categories.map(cat => {
        const catProducts = products.filter(p => p.categoryId === cat.id);
        let cyRev = 0;
        catProducts.forEach(p => {
          if (p.monthlyTargets) {
            qConfig.months.forEach(m => {
              cyRev += p.monthlyTargets[m]?.cyRev || 0;
            });
          }
        });
        return { name: cat.name, value: cyRev, id: cat.id };
      }).filter(d => d.value > 0).sort((a, b) => b.value - a.value);

      // Product breakdown for this quarter
      const productData = products.map(p => {
        let cyRev = 0;
        if (p.monthlyTargets) {
          qConfig.months.forEach(m => {
            cyRev += p.monthlyTargets[m]?.cyRev || 0;
          });
        }
        return { name: p.name, value: cyRev, id: p.id, categoryId: p.categoryId };
      }).filter(d => d.value > 0).sort((a, b) => b.value - a.value);

      const totalValue = productData.reduce((sum, d) => sum + d.value, 0);

      return { id: qId, ...qConfig, categoryData, productData, totalValue };
    });
  }, [categories, products]);

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

        <div className="ov-hero-card ov-hero-revenue" style={{ '--delay': '0.1s' }}>
          <div className="ov-hero-icon-wrap rev">
            <div className="ov-hero-icon"><i className="fas fa-rupee-sign"></i></div>
          </div>
          <div className="ov-hero-data">
            <span className="ov-hero-value">{Utils.formatShortCurrency(overallTotals.cyRev)}</span>
            <span className="ov-hero-label">FY Revenue Target</span>
          </div>
          <div className={`ov-hero-badge ${overallTotals.revGrowth >= 0 ? 'positive' : 'negative'}`}>
            <i className={`fas fa-arrow-${overallTotals.revGrowth >= 0 ? 'up' : 'down'}`}></i>
            {Math.abs(overallTotals.revGrowth).toFixed(1)}%
          </div>
        </div>

        <div className="ov-hero-card ov-hero-achievement" style={{ '--delay': '0.15s' }}>
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

        <div className="ov-hero-card ov-hero-products" style={{ '--delay': '0.2s' }}>
          <div className="ov-hero-icon-wrap prod">
            <div className="ov-hero-icon"><i className="fas fa-boxes-stacked"></i></div>
          </div>
          <div className="ov-hero-data">
            <span className="ov-hero-value">{products.length}</span>
            <span className="ov-hero-label">Products Tracked</span>
          </div>
          <div className="ov-hero-sub-info">
            <span>{categories.length} categories</span>
          </div>
        </div>
      </div>

      {/* ==================== FULL YEAR PIE CHART ==================== */}
      <div className="ov-section-header" style={{ '--delay': '0.25s' }}>
        <div className="ov-section-title-wrap">
          <i className="fas fa-calendar-alt"></i>
          <h2>Full Year Contribution Breakdown</h2>
        </div>
        <span className="ov-section-badge">FY 2025-26</span>
      </div>

      <div className="ov-pie-full-year" style={{ '--delay': '0.3s' }}>
        <PieChartCard
          title="FY Revenue Breakdown"
          subtitle="How each category & product contributes to the yearly target"
          categoryData={yearlyCategoryData}
          productData={yearlyProductData}
          totalValue={yearlyTotalValue}
          icon="fa-chart-pie"
          accentColor="#1B4D7A"
          delay="0.3s"
        />
      </div>

      {/* ==================== QUARTERLY PIE CHARTS ==================== */}
      <div className="ov-section-header" style={{ '--delay': '0.4s' }}>
        <div className="ov-section-title-wrap">
          <i className="fas fa-calendar-week"></i>
          <h2>Quarterly Contribution Breakdown</h2>
        </div>
        <div className="ov-quarter-pills">
          <button
            className={`ov-qpill ${activeQuarter === null ? 'active' : ''}`}
            onClick={() => setActiveQuarter(null)}
          >All Quarters</button>
          {Object.entries(QUARTER_CONFIG).map(([qId, q]) => (
            <button
              key={qId}
              className={`ov-qpill ${activeQuarter === qId ? 'active' : ''}`}
              onClick={() => setActiveQuarter(activeQuarter === qId ? null : qId)}
              style={{ '--pill-color': q.color }}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ov-pie-quarters-grid">
        {quarterlyPieData
          .filter(q => activeQuarter === null || q.id === activeQuarter)
          .map(q => (
            <PieChartCard
              key={q.id}
              title={`${q.label} Revenue`}
              subtitle={q.fullLabel}
              categoryData={q.categoryData}
              productData={q.productData}
              totalValue={q.totalValue}
              icon="fa-chart-pie"
              accentColor={q.color}
              delay={`${0.45 + Object.keys(QUARTER_CONFIG).indexOf(q.id) * 0.1}s`}
              isCompact
            />
          ))}
      </div>

    </div>
  );
}

export default OverviewStats;
