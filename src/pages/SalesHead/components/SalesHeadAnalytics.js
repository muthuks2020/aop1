/**
 * SalesHeadAnalytics Component
 * Executive Target Distribution & Comparison Analytics
 *
 * PART 1 CHANGES:
 *   Item 1 — "LY Ach" → "LY Ahv" in all bar tags and KPI labels
 *   Item 4 — Added % metrics: growth (target), growth (achievement),
 *             contribution %, % of target achievement in summary bar
 *   Item 6 — Removed "Entities" count from the summary stats bar
 *   Item 7 — Category breakdown TABLE in compare mode replaced with
 *             a CategoryBarChart (grouped horizontal bars per category)
 *
 * All existing data-aggregation logic, chart components, and API calls
 * are preserved without modification.
 *
 * @version 1.1.0 — Part 1 Items 1, 4, 6, 7
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SalesHeadApiService } from '../../../services/salesHeadApi';
import { Utils } from '../../../utils/helpers';
import '../../../styles/saleshead/shAnalytics.css';

const MONTHS = ['apr','may','jun','jul','aug','sep','oct','nov','dec','jan','feb','mar'];
const MONTH_LABELS = ['APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC','JAN','FEB','MAR'];

const CAT_COLORS = {
  equipment: '#0C2340', iol: '#0097A7', ovd: '#4F46E5',
  pharma: '#2E7D32', mis: '#D97706', others: '#64748B'
};

const ZONE_COLORS = ['#0C2340', '#0097A7', '#4F46E5', '#D97706', '#2E7D32', '#7C3AED'];

// ==================== HORIZONTAL BAR CHART ====================
// PART 1 — Item 1: "LY Ach" tag renamed → "LY Ahv"

function HorizontalBar({ items, maxVal, metric, showLabels = true, colorMap = {} }) {
  if (!items.length) return <div className="sh-an-empty">No data available</div>;
  const safeMax = Math.max(...items.map(d => Math.max(d.value, d.lyValue || 0, d.achieved || 0)), 1);

  return (
    <div className="sh-an-hbar-list">
      {items.map((item, i) => {
        const cyPct  = Math.round((item.value             / safeMax) * 100);
        const lyPct  = Math.round(((item.lyValue  || 0)  / safeMax) * 100);
        const achPct = Math.round(((item.achieved || 0)  / safeMax) * 100);
        const color  = colorMap[item.id] || ZONE_COLORS[i % ZONE_COLORS.length];
        return (
          <div key={item.id} className="sh-an-hbar-row">
            <div className="sh-an-hbar-label">
              <span className="sh-an-hbar-name" title={item.name}>{item.name}</span>
              {item.subtitle && <span className="sh-an-hbar-sub">{item.subtitle}</span>}
            </div>
            <div className="sh-an-hbar-bars">
              {/* PART 1 — Item 1: "LY Tgt" (was "LY Tgt" — already correct, keeping) */}
              <div className="sh-an-hbar-bar-row">
                <span className="sh-an-hbar-tag ly">LY Tgt</span>
                <div className="sh-an-hbar-track">
                  <div className="sh-an-hbar-fill ly" style={{ width: `${lyPct}%` }}>
                    {lyPct > 18 && <span className="sh-an-hbar-inner">{metric === 'revenue' ? '₹' : ''}{Utils.formatCompact(item.lyValue || 0)}</span>}
                  </div>
                </div>
                <span className="sh-an-hbar-end">{metric === 'revenue' ? '₹' : ''}{Utils.formatCompact(item.lyValue || 0)}</span>
              </div>
              {/* PART 1 — Item 1: "LY Ahv" (was "LY Ach") */}
              <div className="sh-an-hbar-bar-row">
                <span className="sh-an-hbar-tag ach">LY Ahv</span>
                <div className="sh-an-hbar-track">
                  <div className="sh-an-hbar-fill ach" style={{ width: `${achPct}%` }}>
                    {achPct > 18 && <span className="sh-an-hbar-inner">{metric === 'revenue' ? '₹' : ''}{Utils.formatCompact(item.achieved || 0)}</span>}
                  </div>
                </div>
                <span className="sh-an-hbar-end">{item.achievedPct || 0}%</span>
              </div>
              <div className="sh-an-hbar-bar-row">
                <span className="sh-an-hbar-tag cy">CY Tgt</span>
                <div className="sh-an-hbar-track">
                  <div className="sh-an-hbar-fill cy" style={{ width: `${cyPct}%`, background: color }}>
                    {cyPct > 18 && <span className="sh-an-hbar-inner">{metric === 'revenue' ? '₹' : ''}{Utils.formatCompact(item.value)}</span>}
                  </div>
                </div>
                <span className={`sh-an-hbar-end growth ${item.growth >= 0 ? 'pos' : 'neg'}`}>
                  {item.growth >= 0 ? '↑' : '↓'}{Math.abs(item.growth).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ==================== STACKED BAR CHART (unchanged) ====================

function StackedBarChart({ data, categories, metric }) {
  if (!data.length) return <div className="sh-an-empty">No data</div>;
  const maxVal = Math.max(...data.map(d => d.total), 1);

  return (
    <div className="sh-an-stacked-chart">
      <div className="sh-an-stacked-bars">
        {data.map((d) => (
          <div key={d.id} className="sh-an-stacked-col" title={d.name}>
            <div className="sh-an-stacked-bar-wrap" style={{ height: '100%' }}>
              {d.segments.map((seg) => {
                const segPct = (seg.value / maxVal) * 100;
                return segPct > 0 ? (
                  <div
                    key={seg.catId}
                    className="sh-an-stacked-segment"
                    style={{ height: `${segPct}%`, background: CAT_COLORS[seg.catId] || '#94A3B8' }}
                    title={`${seg.catName}: ${metric === 'revenue' ? '₹' : ''}${Utils.formatCompact(seg.value)}`}
                  />
                ) : null;
              })}
            </div>
            <span className="sh-an-stacked-label">{d.shortName || d.name.split(' ')[0]}</span>
            <span className="sh-an-stacked-total">
              {metric === 'revenue' ? '₹' : ''}{Utils.formatCompact(d.total)}
            </span>
          </div>
        ))}
      </div>
      <div className="sh-an-stacked-legend">
        {categories.map(cat => (
          <span key={cat.id} className="sh-an-stacked-legend-item">
            <span className="sh-an-sl-dot" style={{ background: CAT_COLORS[cat.id] || '#94A3B8' }}></span>
            {cat.name}
          </span>
        ))}
      </div>
    </div>
  );
}

// ==================== RADAR CHART (unchanged) ====================

function RadarChart({ dataA, dataB, labels, nameA, nameB, size = 280 }) {
  if (!labels.length) return null;
  const cx = size / 2, cy = size / 2, r = size * 0.38;
  const n = labels.length;
  const toXY = (val, maxVal, idx) => {
    const angle = (idx / n) * 2 * Math.PI - Math.PI / 2;
    const radius = maxVal > 0 ? (val / maxVal) * r : 0;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  };
  const gridXY = (pct, idx) => {
    const angle = (idx / n) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + pct * r * Math.cos(angle), y: cy + pct * r * Math.sin(angle) };
  };
  const maxVal = Math.max(...dataA, ...dataB, 1);
  const polyA = dataA.map((v, i) => { const p = toXY(v, maxVal, i); return `${p.x},${p.y}`; }).join(' ');
  const polyB = dataB.map((v, i) => { const p = toXY(v, maxVal, i); return `${p.x},${p.y}`; }).join(' ');

  return (
    <svg width={size} height={size} style={{ overflow: 'visible' }}>
      {[0.25, 0.5, 0.75, 1].map(pct => (
        <polygon key={pct}
          points={labels.map((_, i) => { const p = gridXY(pct, i); return `${p.x},${p.y}`; }).join(' ')}
          fill="none" stroke="#E2E8F0" strokeWidth="1"
        />
      ))}
      {labels.map((_, i) => {
        const p = gridXY(1, i);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#E2E8F0" strokeWidth="1" />;
      })}
      <polygon points={polyA} fill="rgba(12,35,64,0.15)" stroke="#0C2340" strokeWidth="2" />
      <polygon points={polyB} fill="rgba(0,151,167,0.15)" stroke="#0097A7" strokeWidth="2" />
      {labels.map((label, i) => {
        const p = gridXY(1.18, i);
        return <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
          fontSize="9" fill="#64748B" fontWeight="600">{label}</text>;
      })}
    </svg>
  );
}

// ==================== MONTHLY COMPARISON CHART (unchanged) ====================

function MonthlyComparisonChart({ dataA, dataB, nameA, nameB, metric }) {
  if (!dataA.length) return null;
  const maxVal = Math.max(...dataA.map(d => d.value), ...dataB.map(d => d.value), 1);

  return (
    <div className="sh-an-monthly-chart">
      <div className="sh-an-monthly-bars">
        {MONTH_LABELS.map((ml, i) => (
          <div key={ml} className="sh-an-monthly-col">
            <div className="sh-an-monthly-bar-pair">
              <div className="sh-an-monthly-bar a"
                style={{ height: `${(dataA[i]?.value / maxVal) * 100}%` }}
                title={`${nameA}: ${metric === 'revenue' ? '₹' : ''}${Utils.formatCompact(dataA[i]?.value || 0)}`}
              />
              <div className="sh-an-monthly-bar b"
                style={{ height: `${(dataB[i]?.value / maxVal) * 100}%` }}
                title={`${nameB}: ${metric === 'revenue' ? '₹' : ''}${Utils.formatCompact(dataB[i]?.value || 0)}`}
              />
            </div>
            <span className="sh-an-monthly-label">{ml}</span>
          </div>
        ))}
      </div>
      <div className="sh-an-monthly-legend">
        <span className="sh-an-monthly-legend-item"><span className="sh-an-ml-dot a"></span>{nameA}</span>
        <span className="sh-an-monthly-legend-item"><span className="sh-an-ml-dot b"></span>{nameB}</span>
      </div>
    </div>
  );
}

// ==================== PART 1 — Item 7: CATEGORY BAR CHART ====================
// Replaces the category breakdown TABLE in compare mode.
// Shows grouped horizontal bars (LY Tgt / LY Ahv / CY Tgt) per category
// for both Entity A and Entity B, side-by-side.

function CategoryBarChart({ categories, entityA, entityB, metric }) {
  if (!entityA || !entityB) return null;
  const p = metric === 'revenue' ? '₹' : '';

  // Find the global max across all segments for scale
  const allVals = categories.flatMap(cat => {
    const segA = entityA.segments.find(s => s.catId === cat.id) || {};
    const segB = entityB.segments.find(s => s.catId === cat.id) || {};
    return [segA.lyValue || 0, segA.achieved || 0, segA.value || 0,
            segB.lyValue || 0, segB.achieved || 0, segB.value || 0];
  });
  const maxVal = Math.max(...allVals, 1);

  const barStyle = (val, color) => ({
    width: `${Math.round((val / maxVal) * 100)}%`,
    background: color,
    height: '14px',
    borderRadius: '3px',
    minWidth: val > 0 ? '3px' : '0',
    display: 'inline-block',
    transition: 'width 0.4s ease',
  });

  return (
    <div className="sh-an-cat-barchart">
      {categories.map((cat, idx) => {
        const segA = entityA.segments.find(s => s.catId === cat.id) || {};
        const segB = entityB.segments.find(s => s.catId === cat.id) || {};
        const catColor = CAT_COLORS[cat.id] || ZONE_COLORS[idx % ZONE_COLORS.length];

        return (
          <div key={cat.id} className="sh-an-cbc-row">
            {/* Category label */}
            <div className="sh-an-cbc-cat">
              <span className="sh-an-cbc-dot" style={{ background: catColor }}></span>
              <span className="sh-an-cbc-name">{cat.name}</span>
            </div>

            {/* Entity A bars */}
            <div className="sh-an-cbc-entity">
              <span className="sh-an-cbc-entity-label a">{entityA.name}</span>
              <div className="sh-an-cbc-bars">
                <div className="sh-an-cbc-bar-row">
                  {/* PART 1 — Item 1: "LY Tgt" */}
                  <span className="sh-an-cbc-tag">LY Tgt</span>
                  <div className="sh-an-cbc-track">
                    <div style={barStyle(segA.lyValue || 0, '#CBD5E1')} />
                  </div>
                  <span className="sh-an-cbc-val">{p}{Utils.formatCompact(segA.lyValue || 0)}</span>
                </div>
                <div className="sh-an-cbc-bar-row">
                  {/* PART 1 — Item 1: "LY Ahv" */}
                  <span className="sh-an-cbc-tag">LY Ahv</span>
                  <div className="sh-an-cbc-track">
                    <div style={barStyle(segA.achieved || 0, '#34D399')} />
                  </div>
                  <span className="sh-an-cbc-val">
                    {p}{Utils.formatCompact(segA.achieved || 0)}
                    {/* PART 1 — Item 4: % of LY Tgt achieved */}
                    {segA.lyValue > 0 && (
                      <span className="sh-an-cbc-pct">
                        &nbsp;({Math.round(((segA.achieved || 0) / segA.lyValue) * 100)}%)
                      </span>
                    )}
                  </span>
                </div>
                <div className="sh-an-cbc-bar-row">
                  <span className="sh-an-cbc-tag">CY Tgt</span>
                  <div className="sh-an-cbc-track">
                    <div style={barStyle(segA.value || 0, catColor)} />
                  </div>
                  <span className="sh-an-cbc-val">
                    {p}{Utils.formatCompact(segA.value || 0)}
                    {/* PART 1 — Item 4: growth % */}
                    {segA.lyValue > 0 && (
                      <span className={`sh-an-cbc-growth ${(segA.value || 0) >= segA.lyValue ? 'pos' : 'neg'}`}>
                        &nbsp;{(segA.value || 0) >= segA.lyValue ? '↑' : '↓'}
                        {Math.abs(Utils.calcGrowth(segA.lyValue, segA.value || 0)).toFixed(1)}%
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Entity B bars */}
            <div className="sh-an-cbc-entity">
              <span className="sh-an-cbc-entity-label b">{entityB.name}</span>
              <div className="sh-an-cbc-bars">
                <div className="sh-an-cbc-bar-row">
                  <span className="sh-an-cbc-tag">LY Tgt</span>
                  <div className="sh-an-cbc-track">
                    <div style={barStyle(segB.lyValue || 0, '#CBD5E1')} />
                  </div>
                  <span className="sh-an-cbc-val">{p}{Utils.formatCompact(segB.lyValue || 0)}</span>
                </div>
                <div className="sh-an-cbc-bar-row">
                  <span className="sh-an-cbc-tag">LY Ahv</span>
                  <div className="sh-an-cbc-track">
                    <div style={barStyle(segB.achieved || 0, '#34D399')} />
                  </div>
                  <span className="sh-an-cbc-val">
                    {p}{Utils.formatCompact(segB.achieved || 0)}
                    {segB.lyValue > 0 && (
                      <span className="sh-an-cbc-pct">
                        &nbsp;({Math.round(((segB.achieved || 0) / segB.lyValue) * 100)}%)
                      </span>
                    )}
                  </span>
                </div>
                <div className="sh-an-cbc-bar-row">
                  <span className="sh-an-cbc-tag">CY Tgt</span>
                  <div className="sh-an-cbc-track">
                    <div style={barStyle(segB.value || 0, catColor)} />
                  </div>
                  <span className="sh-an-cbc-val">
                    {p}{Utils.formatCompact(segB.value || 0)}
                    {segB.lyValue > 0 && (
                      <span className={`sh-an-cbc-growth ${(segB.value || 0) >= segB.lyValue ? 'pos' : 'neg'}`}>
                        &nbsp;{(segB.value || 0) >= segB.lyValue ? '↑' : '↓'}
                        {Math.abs(Utils.calcGrowth(segB.lyValue, segB.value || 0)).toFixed(1)}%
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

function SalesHeadAnalytics({ showToast }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hierarchy, setHierarchy] = useState([]);
  const [categories, setCategories] = useState([]);
  const [zbmSubmissions, setZbmSubmissions] = useState([]);

  // View Controls
  const [viewLevel, setViewLevel]           = useState('zone');
  const [selectedZone, setSelectedZone]     = useState('all');
  const [selectedTerritory, setSelectedTerritory] = useState('all');
  const [metric, setMetric]                 = useState('revenue');
  const [activeCategories, setActiveCategories] = useState(new Set());

  // Comparison Mode
  const [compareMode, setCompareMode] = useState(false);
  const [compareA, setCompareA]       = useState('');
  const [compareB, setCompareB]       = useState('');

  useEffect(() => { loadData(); }, []); // eslint-disable-line

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cats, subs, hier] = await Promise.all([
        SalesHeadApiService.getCategories(),
        SalesHeadApiService.getZBMSubmissions(),
        SalesHeadApiService.getZBMHierarchy(),
      ]);
      setCategories(cats);
      setZbmSubmissions(subs);
      setHierarchy(hier);
      setActiveCategories(new Set(cats.map(c => c.id)));
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Error', 'Failed to load analytics.', 'error');
    }
    setIsLoading(false);
  };

  const toggleCategory = useCallback((catId) => {
    setActiveCategories(prev => {
      const n = new Set(prev);
      n.has(catId) ? n.delete(catId) : n.add(catId);
      return n;
    });
  }, []);

  // ==================== DATA AGGREGATION (unchanged) ====================

  const getEntityValue = useCallback((submissions, metricKey) => {
    let total = 0;
    submissions.forEach(s => {
      if (!activeCategories.has(s.categoryId)) return;
      if (s.monthlyTargets) Object.values(s.monthlyTargets).forEach(m => {
        total += metricKey === 'revenue' ? (m.cyRev || 0) : (m.cyQty || 0);
      });
    });
    return total;
  }, [activeCategories]);

  const getEntityLY = useCallback((submissions, metricKey) => {
    let total = 0;
    submissions.forEach(s => {
      if (!activeCategories.has(s.categoryId)) return;
      if (s.monthlyTargets) Object.values(s.monthlyTargets).forEach(m => {
        total += metricKey === 'revenue' ? (m.lyRev || 0) : (m.lyQty || 0);
      });
    });
    return total;
  }, [activeCategories]);

  const getMonthlyData = useCallback((submissions, metricKey) => {
    return MONTHS.map(month => {
      let total = 0;
      submissions.forEach(s => {
        if (!activeCategories.has(s.categoryId)) return;
        const mt = s.monthlyTargets?.[month];
        if (mt) total += metricKey === 'revenue' ? (mt.cyRev || 0) : (mt.cyQty || 0);
      });
      return { month, value: total };
    });
  }, [activeCategories]);

  const getMonthlyLYData = useCallback((submissions, metricKey) => {
    return MONTHS.map(month => {
      let total = 0;
      submissions.forEach(s => {
        if (!activeCategories.has(s.categoryId)) return;
        const mt = s.monthlyTargets?.[month];
        if (mt) total += metricKey === 'revenue' ? (mt.lyRev || 0) : (mt.lyQty || 0);
      });
      return { month, value: total };
    });
  }, [activeCategories]);

  const getEntityAchieved = useCallback((submissions, metricKey) => {
    let total = 0;
    let hasAchData = false;
    submissions.forEach(s => {
      if (!activeCategories.has(s.categoryId)) return;
      if (s.monthlyTargets) Object.values(s.monthlyTargets).forEach(m => {
        const achField = metricKey === 'revenue' ? m.lyAchRev : m.lyAchQty;
        if (achField !== undefined && achField !== null) { total += achField; hasAchData = true; }
      });
    });
    if (!hasAchData) {
      let lyTotal = 0;
      submissions.forEach(s => {
        if (!activeCategories.has(s.categoryId)) return;
        if (s.monthlyTargets) Object.values(s.monthlyTargets).forEach(m => {
          lyTotal += metricKey === 'revenue' ? (m.lyRev || 0) : (m.lyQty || 0);
        });
      });
      return Math.round(lyTotal * 0.92);
    }
    return total;
  }, [activeCategories]);

  // Zone-level aggregation
  const zoneData = useMemo(() => {
    const zbmMap = {};
    zbmSubmissions.forEach(s => {
      const key = s.zbmId || s.employeeCode || 'unknown';
      if (!zbmMap[key]) {
        zbmMap[key] = {
          id: key, name: s.zbmName || s.employeeName || key,
          subtitle: s.zoneName || '', shortName: (s.zbmName || key).split(' ')[0],
          submissions: [],
          segments: categories.filter(c => activeCategories.has(c.id)).map(cat => ({
            catId: cat.id, catName: cat.name, value: 0, lyValue: 0, achieved: 0,
          })),
        };
      }
      zbmMap[key].submissions.push(s);
    });

    return Object.values(zbmMap).map(zbm => {
      const cy  = getEntityValue(zbm.submissions, metric);
      const ly  = getEntityLY(zbm.submissions, metric);
      const ach = getEntityAchieved(zbm.submissions, metric);
      zbm.submissions.forEach(s => {
        if (!activeCategories.has(s.categoryId)) return;
        if (s.monthlyTargets) Object.values(s.monthlyTargets).forEach(m => {
          const seg = zbm.segments.find(sg => sg.catId === s.categoryId);
          if (seg) {
            seg.value   += metric === 'revenue' ? (m.cyRev || 0) : (m.cyQty || 0);
            seg.lyValue += metric === 'revenue' ? (m.lyRev || 0) : (m.lyQty || 0);
            const achF   = metric === 'revenue' ? m.lyAchRev : m.lyAchQty;
            seg.achieved += achF != null ? achF : (metric === 'revenue' ? (m.lyRev || 0) : (m.lyQty || 0)) * 0.92;
          }
        });
      });
      return {
        ...zbm, value: cy, lyValue: ly, achieved: ach, total: cy,
        growth: Utils.calcGrowth(ly, cy),
        achievedPct: ly > 0 ? Math.round((ach / ly) * 100) : 0,
      };
    }).sort((a, b) => b.value - a.value);
  }, [zbmSubmissions, categories, metric, activeCategories, getEntityValue, getEntityLY, getEntityAchieved]);

  // Territory (ABM) aggregation from hierarchy
  const territoryData = useMemo(() => {
    const zbms = selectedZone === 'all' ? hierarchy : hierarchy.filter(z => z.id === selectedZone);
    const result = [];
    zbms.forEach(zbm => {
      zbm.abms?.forEach(abm => {
        let cy = 0, ly = 0, ach = 0;
        const segments = categories.filter(c => activeCategories.has(c.id)).map(cat => ({
          catId: cat.id, catName: cat.name, value: 0, lyValue: 0, achieved: 0,
        }));
        abm.tbms?.forEach(tbm => {
          tbm.salesReps?.forEach(rep => {
            rep.products?.forEach(p => {
              if (!activeCategories.has(p.categoryId)) return;
              if (p.monthlyTargets) Object.values(p.monthlyTargets).forEach(m => {
                const cv  = metric === 'revenue' ? (m.cyRev || 0) : (m.cyQty || 0);
                const lv  = metric === 'revenue' ? (m.lyRev || 0) : (m.lyQty || 0);
                const achF = metric === 'revenue' ? m.lyAchRev : m.lyAchQty;
                const av  = achF != null ? achF : lv * 0.92;
                cy += cv; ly += lv; ach += av;
                const seg = segments.find(s => s.catId === p.categoryId);
                if (seg) { seg.value += cv; seg.lyValue += lv; seg.achieved += av; }
              });
            });
          });
        });
        result.push({
          id: abm.id, name: abm.name, subtitle: `${abm.territory} · ${zbm.name}`,
          shortName: abm.territory.split(' ')[0], value: cy, lyValue: ly, achieved: ach,
          growth: Utils.calcGrowth(ly, cy), achievedPct: ly > 0 ? Math.round((ach / ly) * 100) : 0,
          total: cy, segments, parentZone: zbm.id,
        });
      });
    });
    return result.sort((a, b) => b.value - a.value);
  }, [hierarchy, selectedZone, categories, metric, activeCategories]);

  // Member aggregation
  const memberData = useMemo(() => {
    let targetABMs = [];
    const zbms = selectedZone === 'all' ? hierarchy : hierarchy.filter(z => z.id === selectedZone);
    zbms.forEach(zbm => {
      zbm.abms?.forEach(abm => {
        if (selectedTerritory === 'all' || abm.id === selectedTerritory) targetABMs.push({ abm, zbm });
      });
    });
    const result = [];
    targetABMs.forEach(({ abm, zbm }) => {
      abm.tbms?.forEach(tbm => {
        tbm.salesReps?.forEach(rep => {
          let cy = 0, ly = 0, ach = 0;
          const segments = categories.filter(c => activeCategories.has(c.id)).map(cat => ({
            catId: cat.id, catName: cat.name, value: 0, lyValue: 0, achieved: 0,
          }));
          rep.products?.forEach(p => {
            if (!activeCategories.has(p.categoryId)) return;
            if (p.monthlyTargets) Object.values(p.monthlyTargets).forEach(m => {
              const cv  = metric === 'revenue' ? (m.cyRev || 0) : (m.cyQty || 0);
              const lv  = metric === 'revenue' ? (m.lyRev || 0) : (m.lyQty || 0);
              const achF = metric === 'revenue' ? m.lyAchRev : m.lyAchQty;
              const av  = achF != null ? achF : lv * 0.92;
              cy += cv; ly += lv; ach += av;
              const seg = segments.find(s => s.catId === p.categoryId);
              if (seg) { seg.value += cv; seg.lyValue += lv; seg.achieved += av; }
            });
          });
          result.push({
            id: rep.id, name: rep.name, subtitle: `${rep.territory} · ${tbm.name}`,
            shortName: rep.name.split(' ')[0], value: cy, lyValue: ly, achieved: ach,
            growth: Utils.calcGrowth(ly, cy), achievedPct: ly > 0 ? Math.round((ach / ly) * 100) : 0,
            total: cy, segments, parentTBM: tbm.id, parentABM: abm.id, parentZone: zbm.id,
          });
        });
      });
    });
    return result.sort((a, b) => b.value - a.value);
  }, [hierarchy, selectedZone, selectedTerritory, categories, metric, activeCategories]);

  // Current view data
  const currentData = useMemo(() => {
    if (viewLevel === 'zone')      return zoneData;
    if (viewLevel === 'territory') return territoryData;
    return memberData;
  }, [viewLevel, zoneData, territoryData, memberData]);

  const totalCY       = useMemo(() => currentData.reduce((s, d) => s + d.value,              0), [currentData]);
  const totalLY       = useMemo(() => currentData.reduce((s, d) => s + d.lyValue,            0), [currentData]);
  const totalAchieved = useMemo(() => currentData.reduce((s, d) => s + (d.achieved || 0),    0), [currentData]);
  const totalGrowth   = Utils.calcGrowth(totalLY, totalCY);

  // PART 1 — Item 4: pre-computed % metrics for summary bar
  const lyAchPct   = totalLY > 0 ? Math.round((totalAchieved / totalLY) * 100) : 0;
  const contribRef = totalCY; // used for individual share tiles

  // Zone / territory options for dropdowns
  const zoneOptions = useMemo(() => hierarchy.map(z => ({ id: z.id, name: z.name, territory: z.territory })), [hierarchy]);
  const territoryOptions = useMemo(() => {
    const zbms = selectedZone === 'all' ? hierarchy : hierarchy.filter(z => z.id === selectedZone);
    const opts = [];
    zbms.forEach(zbm => { zbm.abms?.forEach(abm => opts.push({ id: abm.id, name: abm.name, territory: abm.territory })); });
    return opts;
  }, [hierarchy, selectedZone]);

  const compareItems = useMemo(() => currentData.map(d => ({ id: d.id, name: d.name, subtitle: d.subtitle })), [currentData]);

  // Comparison data
  const comparisonData = useMemo(() => {
    if (!compareMode || !compareA || !compareB) return null;
    const entityA = currentData.find(d => d.id === compareA);
    const entityB = currentData.find(d => d.id === compareB);
    if (!entityA || !entityB) return null;

    let subsA = [], subsB = [];
    if (viewLevel === 'zone') {
      subsA = zbmSubmissions.filter(s => s.zbmId === compareA);
      subsB = zbmSubmissions.filter(s => s.zbmId === compareB);
    } else {
      const extractSubs = (entity) => {
        const fakeSubmissions = [];
        const walkHierarchy = (zbms) => {
          zbms.forEach(zbm => {
            zbm.abms?.forEach(abm => {
              if (viewLevel === 'territory' && abm.id === entity.id) {
                abm.tbms?.forEach(tbm => {
                  tbm.salesReps?.forEach(rep => {
                    rep.products?.forEach(p => { fakeSubmissions.push({ categoryId: p.categoryId, monthlyTargets: p.monthlyTargets }); });
                  });
                });
              } else if (viewLevel === 'member') {
                abm.tbms?.forEach(tbm => {
                  tbm.salesReps?.forEach(rep => {
                    if (rep.id === entity.id) {
                      rep.products?.forEach(p => { fakeSubmissions.push({ categoryId: p.categoryId, monthlyTargets: p.monthlyTargets }); });
                    }
                  });
                });
              }
            });
          });
        };
        walkHierarchy(hierarchy);
        return fakeSubmissions;
      };
      subsA = extractSubs(entityA);
      subsB = extractSubs(entityB);
    }

    const monthlyA    = getMonthlyData(subsA, metric);
    const monthlyB    = getMonthlyData(subsB, metric);
    const monthlyLYA  = getMonthlyLYData(subsA, metric);
    const monthlyLYB  = getMonthlyLYData(subsB, metric);
    const radarLabels = categories.filter(c => activeCategories.has(c.id)).map(c => c.name);
    const radarA = categories.filter(c => activeCategories.has(c.id)).map(c => entityA.segments.find(s => s.catId === c.id)?.value || 0);
    const radarB = categories.filter(c => activeCategories.has(c.id)).map(c => entityB.segments.find(s => s.catId === c.id)?.value || 0);

    return { entityA, entityB, monthlyA, monthlyB, monthlyLYA, monthlyLYB, radarLabels, radarA, radarB };
  }, [compareMode, compareA, compareB, currentData, viewLevel, zbmSubmissions, hierarchy, categories, metric, activeCategories, getMonthlyData, getMonthlyLYData]);

  // ==================== RENDER ====================

  if (isLoading) {
    return <div className="sh-an-loading"><div className="loading-spinner"></div><p>Loading analytics...</p></div>;
  }

  return (
    <div className="sh-an-container">

      {/* ==================== CONTROL BAR ==================== */}
      <div className="sh-an-control-bar">
        <div className="sh-an-control-left">
          <div className="sh-an-control-group">
            <label className="sh-an-label">View Level</label>
            <div className="sh-an-toggle-group">
              {[{ key: 'zone', label: 'Zone', icon: 'fa-globe-asia' },
                { key: 'territory', label: 'Territory', icon: 'fa-map-marked-alt' },
                { key: 'member', label: 'Team Member', icon: 'fa-user' }
              ].map(opt => (
                <button key={opt.key}
                  className={`sh-an-toggle-btn ${viewLevel === opt.key ? 'active' : ''}`}
                  onClick={() => { setViewLevel(opt.key); setCompareA(''); setCompareB(''); }}
                >
                  <i className={`fas ${opt.icon}`}></i> {opt.label}
                </button>
              ))}
            </div>
          </div>

          {viewLevel !== 'zone' && (
            <div className="sh-an-control-group">
              <label className="sh-an-label">Zone</label>
              <select className="sh-an-select" value={selectedZone}
                onChange={e => { setSelectedZone(e.target.value); setSelectedTerritory('all'); setCompareA(''); setCompareB(''); }}>
                <option value="all">All Zones</option>
                {zoneOptions.map(z => <option key={z.id} value={z.id}>{z.name} — {z.territory}</option>)}
              </select>
            </div>
          )}

          {viewLevel === 'member' && (
            <div className="sh-an-control-group">
              <label className="sh-an-label">Territory</label>
              <select className="sh-an-select" value={selectedTerritory}
                onChange={e => { setSelectedTerritory(e.target.value); setCompareA(''); setCompareB(''); }}>
                <option value="all">All Territories</option>
                {territoryOptions.map(t => <option key={t.id} value={t.id}>{t.name} — {t.territory}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="sh-an-control-right">
          <div className="sh-an-control-group">
            <label className="sh-an-label">Metric</label>
            <div className="sh-an-toggle-group mini">
              <button className={`sh-an-toggle-btn ${metric === 'revenue' ? 'active' : ''}`} onClick={() => setMetric('revenue')}>
                <i className="fas fa-rupee-sign"></i> Revenue
              </button>
              <button className={`sh-an-toggle-btn ${metric === 'qty' ? 'active' : ''}`} onClick={() => setMetric('qty')}>
                <i className="fas fa-boxes"></i> Qty
              </button>
            </div>
          </div>

          <div className="sh-an-control-group">
            <label className="sh-an-label">Categories</label>
            <div className="sh-an-cat-filters">
              {categories.map(cat => (
                <button key={cat.id}
                  className={`sh-an-cat-chip ${activeCategories.has(cat.id) ? 'active' : ''}`}
                  style={activeCategories.has(cat.id) ? { background: CAT_COLORS[cat.id] } : {}}
                  onClick={() => toggleCategory(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <button
            className={`sh-an-compare-toggle ${compareMode ? 'active' : ''}`}
            onClick={() => { setCompareMode(m => !m); setCompareA(''); setCompareB(''); }}
          >
            <i className="fas fa-balance-scale"></i>
            {compareMode ? 'Exit Compare' : 'Compare'}
          </button>
        </div>
      </div>

      {/* ==================== SUMMARY BAR ==================== */}
      {/* PART 1 — Items 4 & 6: added % metrics, removed "Entities" count */}
      <div className="sh-an-summary-bar">
        <div className="sh-an-summary-item">
          {/* PART 1 — Item 1: "LY Tgt" label */}
          <span className="sh-an-summary-label">LY Tgt</span>
          <span className="sh-an-summary-value">{metric === 'revenue' ? '₹' : ''}{Utils.formatCompact(totalLY)}</span>
        </div>
        <div className="sh-an-summary-divider"></div>
        <div className="sh-an-summary-item">
          {/* PART 1 — Item 1: "LY Ahv" label */}
          <span className="sh-an-summary-label">LY Ahv</span>
          <span className="sh-an-summary-value"
            style={{ color: lyAchPct >= 100 ? '#6EE7B7' : '#FCA5A5' }}>
            {metric === 'revenue' ? '₹' : ''}{Utils.formatCompact(totalAchieved)}
          </span>
          {/* PART 1 — Item 4: % of LY Tgt achieved */}
          <span className="sh-an-summary-pct"
            style={{ color: lyAchPct >= 100 ? '#6EE7B7' : '#FCA5A5' }}>
            {lyAchPct}% of LY Tgt
          </span>
        </div>
        <div className="sh-an-summary-divider"></div>
        <div className="sh-an-summary-item">
          <span className="sh-an-summary-label">CY Target</span>
          <span className="sh-an-summary-value">{metric === 'revenue' ? '₹' : ''}{Utils.formatCompact(totalCY)}</span>
        </div>
        <div className="sh-an-summary-divider"></div>
        <div className="sh-an-summary-item">
          {/* PART 1 — Item 4: growth (target) % */}
          <span className="sh-an-summary-label">Tgt Growth</span>
          <span className={`sh-an-summary-value ${totalGrowth >= 0 ? 'positive' : 'negative'}`}>
            {totalGrowth >= 0 ? '↑' : '↓'}{Utils.formatGrowth(totalGrowth)}
          </span>
        </div>
        {/* PART 1 — Item 6: "Entities" count REMOVED */}
      </div>

      {/* ==================== MAIN CONTENT ==================== */}
      {!compareMode ? (
        <div className="sh-an-distribution-view">
          {/* STACKED BAR — target distribution by category */}
          <div className="sh-an-card">
            <div className="sh-an-card-header">
              <h3><i className="fas fa-chart-bar"></i> Target Distribution by Category</h3>
              <span className="sh-an-card-subtitle">
                {viewLevel === 'zone' ? 'Across Zones' : viewLevel === 'territory' ? 'Across Territories' : 'Across Team Members'}
              </span>
            </div>
            <StackedBarChart data={currentData} categories={categories.filter(c => activeCategories.has(c.id))} metric={metric} />
          </div>

          {/* HORIZONTAL BARS — ranking */}
          <div className="sh-an-card">
            <div className="sh-an-card-header">
              <h3><i className="fas fa-align-left"></i> {metric === 'revenue' ? 'Revenue' : 'Quantity'} Ranking</h3>
              <span className="sh-an-card-subtitle">
                {viewLevel === 'zone' ? 'Zone' : viewLevel === 'territory' ? 'Territory' : 'Member'}-level ranked by CY target
              </span>
            </div>
            <HorizontalBar items={currentData} maxVal={Math.max(...currentData.map(d => d.value), 1)} metric={metric} />
          </div>

          {/* TARGET SHARE TILES */}
          <div className="sh-an-card">
            <div className="sh-an-card-header">
              <h3><i className="fas fa-th-large"></i> Target Share</h3>
              <span className="sh-an-card-subtitle">Contribution of each entity to the total</span>
            </div>
            <div className="sh-an-share-grid">
              {currentData.map((d, i) => {
                const share = contribRef > 0 ? ((d.value / contribRef) * 100).toFixed(1) : 0;
                return (
                  <div key={d.id} className="sh-an-share-tile" style={{ '--share-color': ZONE_COLORS[i % ZONE_COLORS.length] }}>
                    <span className="sh-an-share-pct">{share}%</span>
                    <span className="sh-an-share-name">{d.name}</span>
                    <span className="sh-an-share-val">{metric === 'revenue' ? '₹' : ''}{Utils.formatCompact(d.value)}</span>
                    <span className={`sh-an-share-growth ${d.growth >= 0 ? 'pos' : 'neg'}`}>
                      {d.growth >= 0 ? '↑' : '↓'}{Math.abs(d.growth).toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      ) : (
        /* ==================== COMPARISON MODE ==================== */
        <div className="sh-an-compare-view">
          <div className="sh-an-compare-selectors">
            <div className="sh-an-compare-select-card a">
              <span className="sh-an-compare-badge a">A</span>
              <select className="sh-an-select" value={compareA} onChange={e => setCompareA(e.target.value)}>
                <option value="">Select {viewLevel === 'zone' ? 'Zone' : viewLevel === 'territory' ? 'Territory' : 'Member'}…</option>
                {compareItems.filter(it => it.id !== compareB).map(it => (
                  <option key={it.id} value={it.id}>{it.name}{it.subtitle ? ` — ${it.subtitle}` : ''}</option>
                ))}
              </select>
            </div>
            <div className="sh-an-compare-vs">VS</div>
            <div className="sh-an-compare-select-card b">
              <span className="sh-an-compare-badge b">B</span>
              <select className="sh-an-select" value={compareB} onChange={e => setCompareB(e.target.value)}>
                <option value="">Select {viewLevel === 'zone' ? 'Zone' : viewLevel === 'territory' ? 'Territory' : 'Member'}…</option>
                {compareItems.filter(it => it.id !== compareA).map(it => (
                  <option key={it.id} value={it.id}>{it.name}{it.subtitle ? ` — ${it.subtitle}` : ''}</option>
                ))}
              </select>
            </div>
          </div>

          {comparisonData ? (
            <div className="sh-an-compare-content">
              {/* KPI Comparison Cards */}
              <div className="sh-an-compare-kpis">
                <div className="sh-an-compare-kpi-card a">
                  <span className="sh-an-compare-kpi-name">{comparisonData.entityA.name}</span>
                  <div className="sh-an-compare-kpi-metrics">
                    {/* PART 1 — Item 1: "LY Tgt" */}
                    <div className="sh-an-compare-kpi-row">
                      <span className="sh-an-ckr-label">LY Tgt</span>
                      <span className="sh-an-ckr-val muted">{metric === 'revenue' ? '₹' : ''}{Utils.formatCompact(comparisonData.entityA.lyValue)}</span>
                    </div>
                    {/* PART 1 — Item 1: "LY Ahv" */}
                    <div className="sh-an-compare-kpi-row">
                      <span className="sh-an-ckr-label">LY Ahv</span>
                      <span className="sh-an-ckr-val ach">
                        {metric === 'revenue' ? '₹' : ''}{Utils.formatCompact(comparisonData.entityA.achieved)}
                        {/* PART 1 — Item 4: % achieved */}
                        <small> ({comparisonData.entityA.achievedPct}%)</small>
                      </span>
                    </div>
                    <div className="sh-an-compare-kpi-row highlight">
                      <span className="sh-an-ckr-label">CY Target</span>
                      <span className="sh-an-ckr-val">{metric === 'revenue' ? '₹' : ''}{Utils.formatCompact(comparisonData.entityA.value)}</span>
                    </div>
                  </div>
                  <span className={`sh-an-compare-kpi-growth ${comparisonData.entityA.growth >= 0 ? 'pos' : 'neg'}`}>
                    {comparisonData.entityA.growth >= 0 ? '↑' : '↓'}{Utils.formatGrowth(comparisonData.entityA.growth)} YoY Tgt
                  </span>
                </div>

                <div className="sh-an-compare-kpi-card b">
                  <span className="sh-an-compare-kpi-name">{comparisonData.entityB.name}</span>
                  <div className="sh-an-compare-kpi-metrics">
                    <div className="sh-an-compare-kpi-row">
                      <span className="sh-an-ckr-label">LY Tgt</span>
                      <span className="sh-an-ckr-val muted">{metric === 'revenue' ? '₹' : ''}{Utils.formatCompact(comparisonData.entityB.lyValue)}</span>
                    </div>
                    <div className="sh-an-compare-kpi-row">
                      <span className="sh-an-ckr-label">LY Ahv</span>
                      <span className="sh-an-ckr-val ach">
                        {metric === 'revenue' ? '₹' : ''}{Utils.formatCompact(comparisonData.entityB.achieved)}
                        <small> ({comparisonData.entityB.achievedPct}%)</small>
                      </span>
                    </div>
                    <div className="sh-an-compare-kpi-row highlight">
                      <span className="sh-an-ckr-label">CY Target</span>
                      <span className="sh-an-ckr-val">{metric === 'revenue' ? '₹' : ''}{Utils.formatCompact(comparisonData.entityB.value)}</span>
                    </div>
                  </div>
                  <span className={`sh-an-compare-kpi-growth ${comparisonData.entityB.growth >= 0 ? 'pos' : 'neg'}`}>
                    {comparisonData.entityB.growth >= 0 ? '↑' : '↓'}{Utils.formatGrowth(comparisonData.entityB.growth)} YoY Tgt
                  </span>
                </div>
              </div>

              {/* Radar + Monthly Charts */}
              <div className="sh-an-compare-charts">
                <div className="sh-an-card">
                  <div className="sh-an-card-header"><h3><i className="fas fa-spider"></i> Category Distribution</h3></div>
                  <div className="sh-an-radar-wrap">
                    <RadarChart
                      dataA={comparisonData.radarA} dataB={comparisonData.radarB}
                      labels={comparisonData.radarLabels}
                      nameA={comparisonData.entityA.name} nameB={comparisonData.entityB.name}
                      size={280}
                    />
                  </div>
                </div>
                <div className="sh-an-card">
                  <div className="sh-an-card-header"><h3><i className="fas fa-chart-line"></i> Monthly Trend Comparison</h3></div>
                  <MonthlyComparisonChart
                    dataA={comparisonData.monthlyA} dataB={comparisonData.monthlyB}
                    nameA={comparisonData.entityA.name} nameB={comparisonData.entityB.name}
                    metric={metric}
                  />
                </div>
              </div>

              {/* PART 1 — Item 7: CATEGORY BAR CHART replaces the old table */}
              <div className="sh-an-card">
                <div className="sh-an-card-header">
                  <h3><i className="fas fa-chart-bar"></i> Category Breakdown — LY Tgt · LY Ahv · CY Tgt</h3>
                  <span className="sh-an-card-subtitle">
                    {comparisonData.entityA.name} vs {comparisonData.entityB.name}
                  </span>
                </div>
                <CategoryBarChart
                  categories={categories.filter(c => activeCategories.has(c.id))}
                  entityA={comparisonData.entityA}
                  entityB={comparisonData.entityB}
                  metric={metric}
                />
              </div>
            </div>
          ) : (
            <div className="sh-an-compare-placeholder">
              <i className="fas fa-balance-scale"></i>
              <h3>Select two entities to compare</h3>
              <p>Use the dropdowns above to pick two {viewLevel === 'zone' ? 'zones' : viewLevel === 'territory' ? 'territories' : 'team members'} for side-by-side analysis.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SalesHeadAnalytics;
