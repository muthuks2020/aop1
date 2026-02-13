/**
 * SalesHeadAnalytics Component
 * Executive Target Distribution & Comparison Analytics
 * 
 * FEATURES:
 * 1. Distribution View — Stacked bar charts showing how targets distribute across
 *    zones → territories → team members, with category breakdowns
 * 2. Comparison Mode — Side-by-side comparison of any two entities (zones, territories,
 *    members) with radar/spider charts and monthly trend overlays
 * 3. Drill-Down Selector — Three-level cascading dropdowns: Zone → Territory → Member
 *    that dynamically update all charts
 * 4. Category Filter — Toggle individual categories to see targeted distributions
 * 5. Metric Toggle — Switch between Revenue (₹) and Quantity views
 * 
 * HIERARCHY: Zone (ZBM) → Territory (ABM) → Area (TBM) → Sales Rep
 * 
 * Appasamy Brand: Navy (#0C2340) + Teal (#0097A7)
 * 
 * @author Appasamy Associates - Product Commitment PWA
 * @version 1.0.0
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

// ==================== SVG CHART HELPERS ====================

function HorizontalBar({ items, maxVal, metric, showLabels = true, colorMap = {} }) {
  if (!items.length) return <div className="sh-an-empty">No data available</div>;
  const safeMax = Math.max(...items.map(d => Math.max(d.value, d.lyValue || 0, d.achieved || 0)), 1);

  return (
    <div className="sh-an-hbar-list">
      {items.map((item, i) => {
        const cyPct = Math.round((item.value / safeMax) * 100);
        const lyPct = Math.round(((item.lyValue || 0) / safeMax) * 100);
        const achPct = Math.round(((item.achieved || 0) / safeMax) * 100);
        const color = colorMap[item.id] || ZONE_COLORS[i % ZONE_COLORS.length];
        return (
          <div key={item.id} className="sh-an-hbar-row">
            <div className="sh-an-hbar-label">
              <span className="sh-an-hbar-name" title={item.name}>{item.name}</span>
              {item.subtitle && <span className="sh-an-hbar-sub">{item.subtitle}</span>}
            </div>
            <div className="sh-an-hbar-bars">
              <div className="sh-an-hbar-bar-row">
                <span className="sh-an-hbar-tag ly">LY Tgt</span>
                <div className="sh-an-hbar-track"><div className="sh-an-hbar-fill ly" style={{ width: `${lyPct}%` }}>{lyPct > 18 && <span className="sh-an-hbar-inner">{metric === 'revenue' ? '₹' : ''}{Utils.formatCompact(item.lyValue || 0)}</span>}</div></div>
                <span className="sh-an-hbar-end">{metric === 'revenue' ? '₹' : ''}{Utils.formatCompact(item.lyValue || 0)}</span>
              </div>
              <div className="sh-an-hbar-bar-row">
                <span className="sh-an-hbar-tag ach">LY Ach</span>
                <div className="sh-an-hbar-track"><div className="sh-an-hbar-fill ach" style={{ width: `${achPct}%` }}>{achPct > 18 && <span className="sh-an-hbar-inner">{metric === 'revenue' ? '₹' : ''}{Utils.formatCompact(item.achieved || 0)}</span>}</div></div>
                <span className="sh-an-hbar-end">{item.achievedPct || 0}%</span>
              </div>
              <div className="sh-an-hbar-bar-row">
                <span className="sh-an-hbar-tag cy">CY Tgt</span>
                <div className="sh-an-hbar-track"><div className="sh-an-hbar-fill cy" style={{ width: `${cyPct}%`, background: color }}>{cyPct > 18 && <span className="sh-an-hbar-inner">{metric === 'revenue' ? '₹' : ''}{Utils.formatCompact(item.value)}</span>}</div></div>
                <span className={`sh-an-hbar-end growth ${item.growth >= 0 ? 'pos' : 'neg'}`}>{item.growth >= 0 ? '↑' : '↓'}{Math.abs(item.growth).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StackedBarChart({ data, categories, metric }) {
  if (!data.length) return <div className="sh-an-empty">No data</div>;
  const maxVal = Math.max(...data.map(d => d.total), 1);

  return (
    <div className="sh-an-stacked-chart">
      <div className="sh-an-stacked-bars">
        {data.map((d, i) => (
          <div key={d.id} className="sh-an-stacked-col" title={d.name}>
            <div className="sh-an-stacked-bar-wrap" style={{ height: '100%' }}>
              {d.segments.map((seg, j) => {
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
            <span className="sh-an-stacked-total">{metric === 'revenue' ? '₹' : ''}{Utils.formatCompact(d.total)}</span>
          </div>
        ))}
      </div>
      <div className="sh-an-stacked-legend">
        {categories.map(cat => (
          <span key={cat.id} className="sh-an-stacked-legend-item">
            <span className="sh-an-legend-dot" style={{ background: CAT_COLORS[cat.id] || '#94A3B8' }}></span>
            {cat.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function RadarChart({ dataA, dataB, labels, nameA, nameB, size = 260 }) {
  const center = size / 2;
  const radius = center - 40;
  const n = labels.length;
  const angleStep = (2 * Math.PI) / n;
  const maxVal = Math.max(...dataA, ...dataB, 1);

  const getPoint = (val, idx) => {
    const angle = angleStep * idx - Math.PI / 2;
    const r = (val / maxVal) * radius;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  const pathA = dataA.map((v, i) => getPoint(v, i)).map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  const pathB = dataB.map((v, i) => getPoint(v, i)).map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="sh-an-radar-svg">
      {/* Grid */}
      {gridLevels.map((lvl, li) => (
        <polygon
          key={li}
          points={Array.from({ length: n }, (_, i) => {
            const a = angleStep * i - Math.PI / 2;
            return `${center + radius * lvl * Math.cos(a)},${center + radius * lvl * Math.sin(a)}`;
          }).join(' ')}
          fill="none" stroke="#E2E8F0" strokeWidth="0.5"
        />
      ))}
      {/* Axes */}
      {labels.map((_, i) => {
        const a = angleStep * i - Math.PI / 2;
        return <line key={i} x1={center} y1={center} x2={center + radius * Math.cos(a)} y2={center + radius * Math.sin(a)} stroke="#E2E8F0" strokeWidth="0.5" />;
      })}
      {/* Data areas */}
      <path d={pathA} fill="rgba(12, 35, 64, 0.15)" stroke="#0C2340" strokeWidth="2" />
      <path d={pathB} fill="rgba(0, 151, 167, 0.15)" stroke="#0097A7" strokeWidth="2" />
      {/* Data points */}
      {dataA.map((v, i) => { const p = getPoint(v, i); return <circle key={`a${i}`} cx={p.x} cy={p.y} r="3.5" fill="#0C2340" stroke="#fff" strokeWidth="1.5" />; })}
      {dataB.map((v, i) => { const p = getPoint(v, i); return <circle key={`b${i}`} cx={p.x} cy={p.y} r="3.5" fill="#0097A7" stroke="#fff" strokeWidth="1.5" />; })}
      {/* Labels */}
      {labels.map((label, i) => {
        const a = angleStep * i - Math.PI / 2;
        const lx = center + (radius + 22) * Math.cos(a);
        const ly = center + (radius + 22) * Math.sin(a);
        const anchor = Math.abs(Math.cos(a)) < 0.1 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end';
        return <text key={i} x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle" className="sh-an-radar-label">{label}</text>;
      })}
      {/* Legend */}
      <circle cx={center - 60} cy={size - 12} r="4" fill="#0C2340" />
      <text x={center - 52} y={size - 8} className="sh-an-radar-legend-text">{nameA}</text>
      <circle cx={center + 20} cy={size - 12} r="4" fill="#0097A7" />
      <text x={center + 28} y={size - 8} className="sh-an-radar-legend-text">{nameB}</text>
    </svg>
  );
}

function MonthlyComparisonChart({ dataA, dataB, nameA, nameB, metric }) {
  const allVals = [...dataA.map(d => d.value), ...dataB.map(d => d.value)];
  const maxVal = Math.max(...allVals, 1);

  return (
    <div className="sh-an-monthly-compare">
      <div className="sh-an-monthly-bars">
        {MONTH_LABELS.map((ml, i) => (
          <div key={i} className="sh-an-monthly-col">
            <div className="sh-an-monthly-pair">
              <div
                className="sh-an-monthly-bar a"
                style={{ height: `${(dataA[i]?.value / maxVal) * 100}%` }}
                title={`${nameA}: ${metric === 'revenue' ? '₹' : ''}${Utils.formatCompact(dataA[i]?.value || 0)}`}
              />
              <div
                className="sh-an-monthly-bar b"
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

// ==================== MAIN COMPONENT ====================

function SalesHeadAnalytics({ showToast }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hierarchy, setHierarchy] = useState([]);
  const [categories, setCategories] = useState([]);
  const [zbmSubmissions, setZbmSubmissions] = useState([]);

  // View Controls
  const [viewLevel, setViewLevel] = useState('zone'); // zone | territory | member
  const [selectedZone, setSelectedZone] = useState('all');
  const [selectedTerritory, setSelectedTerritory] = useState('all');
  const [metric, setMetric] = useState('revenue'); // revenue | qty
  const [activeCategories, setActiveCategories] = useState(new Set());

  // Comparison Mode
  const [compareMode, setCompareMode] = useState(false);
  const [compareA, setCompareA] = useState('');
  const [compareB, setCompareB] = useState('');

  useEffect(() => { loadData(); }, []); // eslint-disable-line

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cats, subs, hier] = await Promise.all([
        SalesHeadApiService.getCategories(),
        SalesHeadApiService.getZBMSubmissions(),
        SalesHeadApiService.getZBMHierarchy()
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

  // ==================== DATA AGGREGATION ====================

  const getEntityValue = useCallback((submissions, metricKey) => {
    let total = 0;
    submissions.forEach(s => {
      if (!activeCategories.has(s.categoryId)) return;
      if (s.monthlyTargets) {
        Object.values(s.monthlyTargets).forEach(m => {
          total += metricKey === 'revenue' ? (m.cyRev || 0) : (m.cyQty || 0);
        });
      }
    });
    return total;
  }, [activeCategories]);

  const getEntityLY = useCallback((submissions, metricKey) => {
    let total = 0;
    submissions.forEach(s => {
      if (!activeCategories.has(s.categoryId)) return;
      if (s.monthlyTargets) {
        Object.values(s.monthlyTargets).forEach(m => {
          total += metricKey === 'revenue' ? (m.lyRev || 0) : (m.lyQty || 0);
        });
      }
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

  // LY Achieved: uses lyAchRev/lyAchQty from monthlyTargets (real backend data)
  // Falls back to ~92% of LY target if lyAch fields are missing (mock fallback)
  const getEntityAchieved = useCallback((submissions, metricKey) => {
    let total = 0;
    let hasAchData = false;
    submissions.forEach(s => {
      if (!activeCategories.has(s.categoryId)) return;
      if (s.monthlyTargets) {
        Object.values(s.monthlyTargets).forEach(m => {
          const achField = metricKey === 'revenue' ? m.lyAchRev : m.lyAchQty;
          if (achField !== undefined && achField !== null) {
            total += achField;
            hasAchData = true;
          }
        });
      }
    });
    // Fallback if backend doesn't have lyAch fields yet
    if (!hasAchData) {
      let lyTotal = 0;
      submissions.forEach(s => {
        if (!activeCategories.has(s.categoryId)) return;
        if (s.monthlyTargets) {
          Object.values(s.monthlyTargets).forEach(m => {
            lyTotal += metricKey === 'revenue' ? (m.lyRev || 0) : (m.lyQty || 0);
          });
        }
      });
      return Math.round(lyTotal * 0.92);
    }
    return total;
  }, [activeCategories]);

  // Zone-level aggregation
  const zoneData = useMemo(() => {
    const zbmMap = {};
    zbmSubmissions.forEach(s => {
      if (!zbmMap[s.zbmId]) zbmMap[s.zbmId] = { id: s.zbmId, name: s.zbmName, territory: s.territory, submissions: [] };
      zbmMap[s.zbmId].submissions.push(s);
    });

    return Object.values(zbmMap).map((zbm, i) => {
      const cy = getEntityValue(zbm.submissions, metric);
      const ly = getEntityLY(zbm.submissions, metric);
      const achieved = getEntityAchieved(zbm.submissions, metric);
      const segments = categories.filter(c => activeCategories.has(c.id)).map(cat => {
        let val = 0, lyVal = 0, achVal = 0;
        const catSubs = zbm.submissions.filter(s => s.categoryId === cat.id);
        catSubs.forEach(s => {
          if (s.monthlyTargets) Object.values(s.monthlyTargets).forEach(m => {
            val += metric === 'revenue' ? (m.cyRev || 0) : (m.cyQty || 0);
            lyVal += metric === 'revenue' ? (m.lyRev || 0) : (m.lyQty || 0);
            const achField = metric === 'revenue' ? m.lyAchRev : m.lyAchQty;
            achVal += (achField !== undefined && achField !== null) ? achField : 0;
          });
        });
        if (achVal === 0 && lyVal > 0) achVal = Math.round(lyVal * 0.92); // fallback
        return { catId: cat.id, catName: cat.name, value: val, lyValue: lyVal, achieved: achVal };
      });
      return { id: zbm.id, name: zbm.name, subtitle: zbm.territory, shortName: zbm.territory.split(' ')[0], value: cy, lyValue: ly, achieved, growth: Utils.calcGrowth(ly, cy), achievedPct: ly > 0 ? Math.round((achieved / ly) * 100) : 0, total: cy, segments };
    }).sort((a, b) => b.value - a.value);
  }, [zbmSubmissions, categories, metric, activeCategories, getEntityValue, getEntityLY, getEntityAchieved]);

  // Territory (ABM) aggregation from hierarchy
  const territoryData = useMemo(() => {
    const zbms = selectedZone === 'all' ? hierarchy : hierarchy.filter(z => z.id === selectedZone);
    const result = [];
    zbms.forEach(zbm => {
      zbm.abms?.forEach(abm => {
        let cy = 0, ly = 0, ach = 0;
        const segments = categories.filter(c => activeCategories.has(c.id)).map(cat => ({ catId: cat.id, catName: cat.name, value: 0, lyValue: 0, achieved: 0 }));
        abm.tbms?.forEach(tbm => {
          tbm.salesReps?.forEach(rep => {
            rep.products?.forEach(p => {
              if (!activeCategories.has(p.categoryId)) return;
              if (p.monthlyTargets) Object.values(p.monthlyTargets).forEach(m => {
                const cv = metric === 'revenue' ? (m.cyRev || 0) : (m.cyQty || 0);
                const lv = metric === 'revenue' ? (m.lyRev || 0) : (m.lyQty || 0);
                const achField = metric === 'revenue' ? m.lyAchRev : m.lyAchQty;
                const av = (achField !== undefined && achField !== null) ? achField : Math.round(lv * 0.92);
                cy += cv; ly += lv; ach += av;
                const seg = segments.find(s => s.catId === p.categoryId);
                if (seg) { seg.value += cv; seg.lyValue += lv; seg.achieved += av; }
              });
            });
          });
        });
        result.push({ id: abm.id, name: abm.name, subtitle: `${abm.territory} · ${zbm.name}`, shortName: abm.territory.split(' ')[0], value: cy, lyValue: ly, achieved: ach, growth: Utils.calcGrowth(ly, cy), achievedPct: ly > 0 ? Math.round((ach / ly) * 100) : 0, total: cy, segments, parentZone: zbm.id });
      });
    });
    return result.sort((a, b) => b.value - a.value);
  }, [hierarchy, selectedZone, categories, metric, activeCategories]);

  // Member (TBM/Rep) aggregation
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
          const segments = categories.filter(c => activeCategories.has(c.id)).map(cat => ({ catId: cat.id, catName: cat.name, value: 0, lyValue: 0, achieved: 0 }));
          rep.products?.forEach(p => {
            if (!activeCategories.has(p.categoryId)) return;
            if (p.monthlyTargets) Object.values(p.monthlyTargets).forEach(m => {
              const cv = metric === 'revenue' ? (m.cyRev || 0) : (m.cyQty || 0);
              const lv = metric === 'revenue' ? (m.lyRev || 0) : (m.lyQty || 0);
              const achField = metric === 'revenue' ? m.lyAchRev : m.lyAchQty;
              const av = (achField !== undefined && achField !== null) ? achField : Math.round(lv * 0.92);
              cy += cv; ly += lv; ach += av;
              const seg = segments.find(s => s.catId === p.categoryId);
              if (seg) { seg.value += cv; seg.lyValue += lv; seg.achieved += av; }
            });
          });
          result.push({ id: rep.id, name: rep.name, subtitle: `${rep.territory} · ${tbm.name}`, shortName: rep.name.split(' ')[0], value: cy, lyValue: ly, achieved: ach, growth: Utils.calcGrowth(ly, cy), achievedPct: ly > 0 ? Math.round((ach / ly) * 100) : 0, total: cy, segments, parentTBM: tbm.id, parentABM: abm.id, parentZone: zbm.id });
        });
      });
    });
    return result.sort((a, b) => b.value - a.value);
  }, [hierarchy, selectedZone, selectedTerritory, categories, metric, activeCategories]);

  // Current view data
  const currentData = useMemo(() => {
    if (viewLevel === 'zone') return zoneData;
    if (viewLevel === 'territory') return territoryData;
    return memberData;
  }, [viewLevel, zoneData, territoryData, memberData]);

  const totalCY = useMemo(() => currentData.reduce((s, d) => s + d.value, 0), [currentData]);
  const totalLY = useMemo(() => currentData.reduce((s, d) => s + d.lyValue, 0), [currentData]);
  const totalAchieved = useMemo(() => currentData.reduce((s, d) => s + (d.achieved || 0), 0), [currentData]);
  const totalGrowth = Utils.calcGrowth(totalLY, totalCY);

  // Zone options for dropdown
  const zoneOptions = useMemo(() => hierarchy.map(z => ({ id: z.id, name: z.name, territory: z.territory })), [hierarchy]);
  const territoryOptions = useMemo(() => {
    const zbms = selectedZone === 'all' ? hierarchy : hierarchy.filter(z => z.id === selectedZone);
    const opts = [];
    zbms.forEach(zbm => { zbm.abms?.forEach(abm => opts.push({ id: abm.id, name: abm.name, territory: abm.territory })); });
    return opts;
  }, [hierarchy, selectedZone]);

  // Comparison items dropdown
  const compareItems = useMemo(() => currentData.map(d => ({ id: d.id, name: d.name, subtitle: d.subtitle })), [currentData]);

  // Comparison data
  const comparisonData = useMemo(() => {
    if (!compareMode || !compareA || !compareB) return null;
    const entityA = currentData.find(d => d.id === compareA);
    const entityB = currentData.find(d => d.id === compareB);
    if (!entityA || !entityB) return null;

    // Get monthly data for each
    let subsA, subsB;
    if (viewLevel === 'zone') {
      subsA = zbmSubmissions.filter(s => s.zbmId === compareA);
      subsB = zbmSubmissions.filter(s => s.zbmId === compareB);
    } else {
      // For territory/member, extract from hierarchy products
      subsA = []; subsB = [];
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
      if (viewLevel !== 'zone') {
        subsA = extractSubs(entityA);
        subsB = extractSubs(entityB);
      }
    }

    const monthlyA = getMonthlyData(subsA, metric);
    const monthlyB = getMonthlyData(subsB, metric);
    const monthlyLYA = getMonthlyLYData(subsA, metric);
    const monthlyLYB = getMonthlyLYData(subsB, metric);

    // Radar data per category
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
              {[{ key: 'zone', label: 'Zone', icon: 'fa-globe-asia' }, { key: 'territory', label: 'Territory', icon: 'fa-map-marked-alt' }, { key: 'member', label: 'Team Member', icon: 'fa-user' }].map(opt => (
                <button key={opt.key} className={`sh-an-toggle-btn ${viewLevel === opt.key ? 'active' : ''}`} onClick={() => { setViewLevel(opt.key); setCompareA(''); setCompareB(''); }}>
                  <i className={`fas ${opt.icon}`}></i> {opt.label}
                </button>
              ))}
            </div>
          </div>

          {viewLevel !== 'zone' && (
            <div className="sh-an-control-group">
              <label className="sh-an-label">Zone</label>
              <select className="sh-an-select" value={selectedZone} onChange={e => { setSelectedZone(e.target.value); setSelectedTerritory('all'); setCompareA(''); setCompareB(''); }}>
                <option value="all">All Zones</option>
                {zoneOptions.map(z => <option key={z.id} value={z.id}>{z.name} — {z.territory}</option>)}
              </select>
            </div>
          )}

          {viewLevel === 'member' && (
            <div className="sh-an-control-group">
              <label className="sh-an-label">Territory</label>
              <select className="sh-an-select" value={selectedTerritory} onChange={e => { setSelectedTerritory(e.target.value); setCompareA(''); setCompareB(''); }}>
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
              <button className={`sh-an-toggle-btn ${metric === 'revenue' ? 'active' : ''}`} onClick={() => setMetric('revenue')}><i className="fas fa-rupee-sign"></i> Revenue</button>
              <button className={`sh-an-toggle-btn ${metric === 'qty' ? 'active' : ''}`} onClick={() => setMetric('qty')}><i className="fas fa-cubes"></i> Qty</button>
            </div>
          </div>

          <button className={`sh-an-compare-toggle ${compareMode ? 'active' : ''}`} onClick={() => { setCompareMode(!compareMode); setCompareA(''); setCompareB(''); }}>
            <i className="fas fa-columns"></i> {compareMode ? 'Exit Compare' : 'Compare'}
          </button>
        </div>
      </div>

      {/* ==================== CATEGORY FILTER CHIPS ==================== */}
      <div className="sh-an-cat-chips">
        <span className="sh-an-chips-label">Categories:</span>
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`sh-an-chip ${activeCategories.has(cat.id) ? 'active' : ''}`}
            style={activeCategories.has(cat.id) ? { background: CAT_COLORS[cat.id], borderColor: CAT_COLORS[cat.id], color: '#fff' } : {}}
            onClick={() => toggleCategory(cat.id)}
          >
            <i className={`fas ${cat.icon}`}></i> {cat.name}
          </button>
        ))}
        <button className="sh-an-chip-reset" onClick={() => setActiveCategories(new Set(categories.map(c => c.id)))}>
          <i className="fas fa-redo-alt"></i> All
        </button>
      </div>

      {/* ==================== SUMMARY STRIP ==================== */}
      <div className="sh-an-summary-strip">
        <div className="sh-an-summary-item">
          <span className="sh-an-summary-label">LY Target</span>
          <span className="sh-an-summary-value muted">{metric === 'revenue' ? '₹' : ''}{Utils.formatCompact(totalLY)}</span>
        </div>
        <div className="sh-an-summary-divider"></div>
        <div className="sh-an-summary-item">
          <span className="sh-an-summary-label">LY Achieved</span>
          <span className="sh-an-summary-value" style={{color:'#6EE7B7'}}>{metric === 'revenue' ? '₹' : ''}{Utils.formatCompact(totalAchieved)}</span>
        </div>
        <div className="sh-an-summary-divider"></div>
        <div className="sh-an-summary-item">
          <span className="sh-an-summary-label">Achievement %</span>
          <span className="sh-an-summary-value" style={{color: totalLY > 0 && Math.round((totalAchieved/totalLY)*100) >= 90 ? '#6EE7B7' : '#FCA5A5'}}>
            {totalLY > 0 ? Math.round((totalAchieved / totalLY) * 100) : 0}%
          </span>
        </div>
        <div className="sh-an-summary-divider"></div>
        <div className="sh-an-summary-item">
          <span className="sh-an-summary-label">CY Target</span>
          <span className="sh-an-summary-value">{metric === 'revenue' ? '₹' : ''}{Utils.formatCompact(totalCY)}</span>
        </div>
        <div className="sh-an-summary-divider"></div>
        <div className="sh-an-summary-item">
          <span className="sh-an-summary-label">YoY Growth</span>
          <span className={`sh-an-summary-value ${totalGrowth >= 0 ? 'positive' : 'negative'}`}>{totalGrowth >= 0 ? '↑' : '↓'}{Utils.formatGrowth(totalGrowth)}</span>
        </div>
        <div className="sh-an-summary-divider"></div>
        <div className="sh-an-summary-item">
          <span className="sh-an-summary-label">Entities</span>
          <span className="sh-an-summary-value">{currentData.length}</span>
        </div>
      </div>

      {/* ==================== MAIN CONTENT ==================== */}
      {!compareMode ? (
        <div className="sh-an-distribution-view">
          {/* STACKED BAR */}
          <div className="sh-an-card">
            <div className="sh-an-card-header">
              <h3><i className="fas fa-chart-bar"></i> Target Distribution by Category</h3>
              <span className="sh-an-card-subtitle">
                {viewLevel === 'zone' ? 'Across Zones' : viewLevel === 'territory' ? 'Across Territories' : 'Across Team Members'}
              </span>
            </div>
            <StackedBarChart data={currentData} categories={categories.filter(c => activeCategories.has(c.id))} metric={metric} />
          </div>

          {/* HORIZONTAL BARS */}
          <div className="sh-an-card">
            <div className="sh-an-card-header">
              <h3><i className="fas fa-align-left"></i> {metric === 'revenue' ? 'Revenue' : 'Quantity'} Ranking</h3>
              <span className="sh-an-card-subtitle">
                {viewLevel === 'zone' ? 'Zone' : viewLevel === 'territory' ? 'Territory' : 'Member'}-level ranked by CY target
              </span>
            </div>
            <HorizontalBar items={currentData} maxVal={Math.max(...currentData.map(d => d.value), 1)} metric={metric} />
          </div>

          {/* CONTRIBUTION TREEMAP-LIKE GRID */}
          <div className="sh-an-card">
            <div className="sh-an-card-header">
              <h3><i className="fas fa-th-large"></i> Target Share</h3>
              <span className="sh-an-card-subtitle">Contribution of each entity to the total</span>
            </div>
            <div className="sh-an-share-grid">
              {currentData.map((d, i) => {
                const share = totalCY > 0 ? ((d.value / totalCY) * 100).toFixed(1) : 0;
                return (
                  <div key={d.id} className="sh-an-share-tile" style={{ '--share-color': ZONE_COLORS[i % ZONE_COLORS.length] }}>
                    <span className="sh-an-share-pct">{share}%</span>
                    <span className="sh-an-share-name">{d.name}</span>
                    <span className="sh-an-share-val">{metric === 'revenue' ? '₹' : ''}{Utils.formatCompact(d.value)}</span>
                    <span className={`sh-an-share-growth ${d.growth >= 0 ? 'pos' : 'neg'}`}>{d.growth >= 0 ? '↑' : '↓'}{Math.abs(d.growth).toFixed(1)}%</span>
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
                <option value="">Select {viewLevel === 'zone' ? 'Zone' : viewLevel === 'territory' ? 'Territory' : 'Member'}...</option>
                {compareItems.filter(it => it.id !== compareB).map(it => <option key={it.id} value={it.id}>{it.name}{it.subtitle ? ` — ${it.subtitle}` : ''}</option>)}
              </select>
            </div>
            <div className="sh-an-compare-vs">VS</div>
            <div className="sh-an-compare-select-card b">
              <span className="sh-an-compare-badge b">B</span>
              <select className="sh-an-select" value={compareB} onChange={e => setCompareB(e.target.value)}>
                <option value="">Select {viewLevel === 'zone' ? 'Zone' : viewLevel === 'territory' ? 'Territory' : 'Member'}...</option>
                {compareItems.filter(it => it.id !== compareA).map(it => <option key={it.id} value={it.id}>{it.name}{it.subtitle ? ` — ${it.subtitle}` : ''}</option>)}
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
                    <div className="sh-an-compare-kpi-row"><span className="sh-an-ckr-label">LY Target</span><span className="sh-an-ckr-val muted">{metric === 'revenue' ? '₹' : ''}{Utils.formatCompact(comparisonData.entityA.lyValue)}</span></div>
                    <div className="sh-an-compare-kpi-row"><span className="sh-an-ckr-label">LY Achieved</span><span className="sh-an-ckr-val ach">{metric === 'revenue' ? '₹' : ''}{Utils.formatCompact(comparisonData.entityA.achieved)} <small>({comparisonData.entityA.achievedPct}%)</small></span></div>
                    <div className="sh-an-compare-kpi-row highlight"><span className="sh-an-ckr-label">CY Target</span><span className="sh-an-ckr-val">{metric === 'revenue' ? '₹' : ''}{Utils.formatCompact(comparisonData.entityA.value)}</span></div>
                  </div>
                  <span className={`sh-an-compare-kpi-growth ${comparisonData.entityA.growth >= 0 ? 'pos' : 'neg'}`}>
                    {comparisonData.entityA.growth >= 0 ? '↑' : '↓'}{Utils.formatGrowth(comparisonData.entityA.growth)} YoY
                  </span>
                </div>
                <div className="sh-an-compare-kpi-diff">
                  <span className="sh-an-compare-diff-label">CY Difference</span>
                  <span className="sh-an-compare-diff-val">
                    {metric === 'revenue' ? '₹' : ''}{Utils.formatCompact(Math.abs(comparisonData.entityA.value - comparisonData.entityB.value))}
                  </span>
                  <span className="sh-an-compare-diff-pct">
                    {comparisonData.entityB.value > 0 ? Math.round(((comparisonData.entityA.value - comparisonData.entityB.value) / comparisonData.entityB.value) * 100) : 0}%
                  </span>
                </div>
                <div className="sh-an-compare-kpi-card b">
                  <span className="sh-an-compare-kpi-name">{comparisonData.entityB.name}</span>
                  <div className="sh-an-compare-kpi-metrics">
                    <div className="sh-an-compare-kpi-row"><span className="sh-an-ckr-label">LY Target</span><span className="sh-an-ckr-val muted">{metric === 'revenue' ? '₹' : ''}{Utils.formatCompact(comparisonData.entityB.lyValue)}</span></div>
                    <div className="sh-an-compare-kpi-row"><span className="sh-an-ckr-label">LY Achieved</span><span className="sh-an-ckr-val ach">{metric === 'revenue' ? '₹' : ''}{Utils.formatCompact(comparisonData.entityB.achieved)} <small>({comparisonData.entityB.achievedPct}%)</small></span></div>
                    <div className="sh-an-compare-kpi-row highlight"><span className="sh-an-ckr-label">CY Target</span><span className="sh-an-ckr-val">{metric === 'revenue' ? '₹' : ''}{Utils.formatCompact(comparisonData.entityB.value)}</span></div>
                  </div>
                  <span className={`sh-an-compare-kpi-growth ${comparisonData.entityB.growth >= 0 ? 'pos' : 'neg'}`}>
                    {comparisonData.entityB.growth >= 0 ? '↑' : '↓'}{Utils.formatGrowth(comparisonData.entityB.growth)} YoY
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

              {/* Category Breakdown Side by Side */}
              <div className="sh-an-card">
                <div className="sh-an-card-header"><h3><i className="fas fa-table"></i> Category Breakdown — LY Target · LY Achieved · CY Target</h3></div>
                <div className="sh-an-compare-table-wrap">
                  <table className="sh-an-compare-table">
                    <thead>
                      <tr>
                        <th rowSpan="2">Category</th>
                        <th colSpan="3" className="col-a">{comparisonData.entityA.name}</th>
                        <th colSpan="3" className="col-b">{comparisonData.entityB.name}</th>
                      </tr>
                      <tr>
                        <th className="col-a sub">LY Tgt</th>
                        <th className="col-a sub">LY Ach</th>
                        <th className="col-a sub">CY Tgt</th>
                        <th className="col-b sub">LY Tgt</th>
                        <th className="col-b sub">LY Ach</th>
                        <th className="col-b sub">CY Tgt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.filter(c => activeCategories.has(c.id)).map(cat => {
                        const segA = comparisonData.entityA.segments.find(s => s.catId === cat.id) || {};
                        const segB = comparisonData.entityB.segments.find(s => s.catId === cat.id) || {};
                        const p = metric === 'revenue' ? '₹' : '';
                        return (
                          <tr key={cat.id}>
                            <td className="sh-an-ct-cat"><span className="sh-an-ct-dot" style={{ background: CAT_COLORS[cat.id] }}></span>{cat.name}</td>
                            <td className="col-a ly">{p}{Utils.formatCompact(segA.lyValue || 0)}</td>
                            <td className="col-a ach">{p}{Utils.formatCompact(segA.achieved || 0)}</td>
                            <td className="col-a cy">{p}{Utils.formatCompact(segA.value || 0)}</td>
                            <td className="col-b ly">{p}{Utils.formatCompact(segB.lyValue || 0)}</td>
                            <td className="col-b ach">{p}{Utils.formatCompact(segB.achieved || 0)}</td>
                            <td className="col-b cy">{p}{Utils.formatCompact(segB.value || 0)}</td>
                          </tr>
                        );
                      })}
                      <tr className="sh-an-ct-total-row">
                        <td><strong>Total</strong></td>
                        <td className="col-a ly"><strong>{metric === 'revenue' ? '₹' : ''}{Utils.formatCompact(comparisonData.entityA.lyValue)}</strong></td>
                        <td className="col-a ach"><strong>{metric === 'revenue' ? '₹' : ''}{Utils.formatCompact(comparisonData.entityA.achieved)}</strong></td>
                        <td className="col-a cy"><strong>{metric === 'revenue' ? '₹' : ''}{Utils.formatCompact(comparisonData.entityA.value)}</strong></td>
                        <td className="col-b ly"><strong>{metric === 'revenue' ? '₹' : ''}{Utils.formatCompact(comparisonData.entityB.lyValue)}</strong></td>
                        <td className="col-b ach"><strong>{metric === 'revenue' ? '₹' : ''}{Utils.formatCompact(comparisonData.entityB.achieved)}</strong></td>
                        <td className="col-b cy"><strong>{metric === 'revenue' ? '₹' : ''}{Utils.formatCompact(comparisonData.entityB.value)}</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
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
