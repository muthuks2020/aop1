/**
 * SalesHeadDrilldown Component
 * Full hierarchy drill-down: ZBM → ABM → TBM → Sales Rep → Product Targets
 * 
 * READ-ONLY — Sales Head can view but NOT edit targets at any level below.
 * Sales Head sets targets only for ZBMs (via Team Yearly Targets tab).
 * 
 * FOUR-LEVEL HIERARCHY:
 * Level 1: ZBM cards (expandable)
 *   Level 2: ABM cards under each ZBM (expandable)
 *     Level 3: TBM cards under each ABM (expandable)
 *       Level 4: Sales Rep cards under each TBM (with product target grid)
 * 
 * @author Appasamy Associates - Product Commitment PWA
 * @version 1.0.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SalesHeadApiService } from '../../../services/salesHeadApi';
import { Utils } from '../../../utils/helpers';
import '../../../styles/saleshead/shDrilldown.css';

const MONTHS = ['apr','may','jun','jul','aug','sep','oct','nov','dec','jan','feb','mar'];
const MONTH_LABELS = ['APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC','JAN','FEB','MAR'];

function SalesHeadDrilldown({ showToast }) {
  const [hierarchy, setHierarchy] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedZBMs, setExpandedZBMs] = useState(new Set());
  const [expandedABMs, setExpandedABMs] = useState(new Set());
  const [expandedTBMs, setExpandedTBMs] = useState(new Set());
  const [expandedReps, setExpandedReps] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadHierarchy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadHierarchy = async () => {
    setIsLoading(true);
    try {
      const data = await SalesHeadApiService.getZBMHierarchy();
      setHierarchy(data);
    } catch (error) {
      console.error('Failed to load hierarchy:', error);
      if (showToast) showToast('Error', 'Failed to load organization data.', 'error');
    }
    setIsLoading(false);
  };

  // Toggle functions
  const toggleZBM = useCallback((id) => {
    setExpandedZBMs(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);
  const toggleABM = useCallback((id) => {
    setExpandedABMs(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);
  const toggleTBM = useCallback((id) => {
    setExpandedTBMs(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);
  const toggleRep = useCallback((id) => {
    setExpandedReps(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  const expandAll = () => {
    const zbmIds = new Set(), abmIds = new Set(), tbmIds = new Set(), repIds = new Set();
    hierarchy.forEach(z => {
      zbmIds.add(z.id);
      z.abms.forEach(a => {
        abmIds.add(a.id);
        a.tbms.forEach(t => {
          tbmIds.add(t.id);
          t.salesReps.forEach(r => repIds.add(r.id));
        });
      });
    });
    setExpandedZBMs(zbmIds);
    setExpandedABMs(abmIds);
    setExpandedTBMs(tbmIds);
    setExpandedReps(repIds);
  };

  const collapseAll = () => {
    setExpandedZBMs(new Set());
    setExpandedABMs(new Set());
    setExpandedTBMs(new Set());
    setExpandedReps(new Set());
  };

  // Search filter
  const filteredHierarchy = useMemo(() => {
    if (!searchTerm) return hierarchy;
    const term = searchTerm.toLowerCase();
    return hierarchy.filter(zbm => {
      if (zbm.name.toLowerCase().includes(term) || zbm.territory.toLowerCase().includes(term)) return true;
      return zbm.abms.some(abm => {
        if (abm.name.toLowerCase().includes(term) || abm.territory.toLowerCase().includes(term)) return true;
        return abm.tbms.some(tbm => {
          if (tbm.name.toLowerCase().includes(term) || tbm.territory.toLowerCase().includes(term)) return true;
          return tbm.salesReps.some(rep =>
            rep.name.toLowerCase().includes(term) || rep.territory.toLowerCase().includes(term) ||
            rep.products?.some(p => p.productName.toLowerCase().includes(term))
          );
        });
      });
    });
  }, [hierarchy, searchTerm]);

  // Totals helpers
  const getZBMTotals = (zbm) => {
    let totalCyRev = 0, totalLyRev = 0, totalCyQty = 0, totalLyQty = 0;
    zbm.abms.forEach(abm => {
      abm.tbms.forEach(tbm => {
        tbm.salesReps.forEach(rep => {
          rep.products?.forEach(p => {
            MONTHS.forEach(m => {
              totalCyRev += p.monthlyTargets?.[m]?.cyRev || 0;
              totalLyRev += p.monthlyTargets?.[m]?.lyRev || 0;
              totalCyQty += p.monthlyTargets?.[m]?.cyQty || 0;
              totalLyQty += p.monthlyTargets?.[m]?.lyQty || 0;
            });
          });
        });
      });
    });
    return { totalCyRev, totalLyRev, totalCyQty, totalLyQty, growth: Utils.calcGrowth(totalLyRev, totalCyRev) };
  };

  const getABMTotals = (abm) => {
    let totalCyRev = 0, totalLyRev = 0;
    abm.tbms.forEach(tbm => {
      tbm.salesReps.forEach(rep => {
        rep.products?.forEach(p => {
          MONTHS.forEach(m => {
            totalCyRev += p.monthlyTargets?.[m]?.cyRev || 0;
            totalLyRev += p.monthlyTargets?.[m]?.lyRev || 0;
          });
        });
      });
    });
    return { totalCyRev, totalLyRev, growth: Utils.calcGrowth(totalLyRev, totalCyRev) };
  };

  const getTBMTotals = (tbm) => {
    let totalCyRev = 0, totalLyRev = 0;
    tbm.salesReps.forEach(rep => {
      rep.products?.forEach(p => {
        MONTHS.forEach(m => {
          totalCyRev += p.monthlyTargets?.[m]?.cyRev || 0;
          totalLyRev += p.monthlyTargets?.[m]?.lyRev || 0;
        });
      });
    });
    return { totalCyRev, totalLyRev, growth: Utils.calcGrowth(totalLyRev, totalCyRev) };
  };

  const getRepTotals = (rep) => {
    let totalCyRev = 0, totalLyRev = 0;
    rep.products?.forEach(p => {
      MONTHS.forEach(m => {
        totalCyRev += p.monthlyTargets?.[m]?.cyRev || 0;
        totalLyRev += p.monthlyTargets?.[m]?.lyRev || 0;
      });
    });
    return { totalCyRev, totalLyRev, growth: Utils.calcGrowth(totalLyRev, totalCyRev) };
  };

  // Organization summary
  const orgSummary = useMemo(() => {
    let totalZBMs = hierarchy.length;
    let totalABMs = hierarchy.reduce((s, z) => s + z.abms.length, 0);
    let totalTBMs = hierarchy.reduce((s, z) => s + z.abms.reduce((ss, a) => ss + a.tbms.length, 0), 0);
    let totalReps = hierarchy.reduce((s, z) => s + z.abms.reduce((ss, a) => ss + a.tbms.reduce((sss, t) => sss + t.salesReps.length, 0), 0), 0);
    return { totalZBMs, totalABMs, totalTBMs, totalReps };
  }, [hierarchy]);

  if (isLoading) {
    return <div className="sh-dd-loading"><div className="loading-spinner"></div><p>Loading organization hierarchy...</p></div>;
  }

  return (
    <div className="sh-dd-container">
      {/* Header */}
      <div className="sh-dd-header">
        <div className="sh-dd-header-left">
          <div className="sh-dd-icon"><i className="fas fa-sitemap"></i></div>
          <div>
            <h2>Organization Drill-Down</h2>
            <span className="sh-dd-subtitle">
              {orgSummary.totalZBMs} ZBMs · {orgSummary.totalABMs} ABMs · {orgSummary.totalTBMs} TBMs · {orgSummary.totalReps} Sales Reps
            </span>
          </div>
        </div>
        <div className="sh-dd-actions">
          <button className="sh-dd-btn" onClick={expandAll}><i className="fas fa-expand-alt"></i> Expand All</button>
          <button className="sh-dd-btn" onClick={collapseAll}><i className="fas fa-compress-alt"></i> Collapse</button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="sh-dd-info">
        <i className="fas fa-eye"></i>
        <span>Read-only view of the full organization: <strong>ZBM → ABM → TBM → Sales Rep</strong>. To set ZBM targets, use the <strong>Team Yearly Targets</strong> tab.</span>
      </div>

      {/* Search */}
      <div className="sh-dd-search">
        <i className="fas fa-search"></i>
        <input type="text" placeholder="Search ZBMs, ABMs, TBMs, Sales Reps, or products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        {searchTerm && <button onClick={() => setSearchTerm('')}><i className="fas fa-times"></i></button>}
      </div>

      {/* ZBM Cards */}
      <div className="sh-dd-list">
        {filteredHierarchy.map(zbm => {
          const isZBMExpanded = expandedZBMs.has(zbm.id);
          const zbmTotals = getZBMTotals(zbm);

          return (
            <div key={zbm.id} className={`sh-dd-zbm-card ${isZBMExpanded ? 'expanded' : ''}`}>
              {/* ZBM Header */}
              <div className="sh-dd-zbm-header" onClick={() => toggleZBM(zbm.id)}>
                <div className="sh-dd-zbm-left">
                  <i className={`fas fa-chevron-${isZBMExpanded ? 'down' : 'right'} sh-dd-chevron`}></i>
                  <div className="sh-dd-zbm-avatar">{zbm.name.split(' ').map(n => n[0]).join('').substring(0, 2)}</div>
                  <div>
                    <span className="sh-dd-zbm-name">{zbm.name}</span>
                    <span className="sh-dd-zbm-territory"><i className="fas fa-globe-asia"></i> {zbm.territory}</span>
                  </div>
                </div>
                <div className="sh-dd-zbm-stats">
                  <div className="sh-dd-mini-stat"><span className="sh-dd-mini-label">ABMs</span><span className="sh-dd-mini-value">{zbm.abms.length}</span></div>
                  <div className="sh-dd-mini-stat"><span className="sh-dd-mini-label">TBMs</span><span className="sh-dd-mini-value">{zbm.abms.reduce((s, a) => s + a.tbms.length, 0)}</span></div>
                  <div className="sh-dd-mini-stat"><span className="sh-dd-mini-label">Reps</span><span className="sh-dd-mini-value">{zbm.abms.reduce((s, a) => s + a.tbms.reduce((ss, t) => ss + t.salesReps.length, 0), 0)}</span></div>
                  <div className="sh-dd-mini-stat"><span className="sh-dd-mini-label">CY Rev</span><span className="sh-dd-mini-value">₹{Utils.formatCompact(zbmTotals.totalCyRev)}</span></div>
                  <div className="sh-dd-mini-stat">
                    <span className="sh-dd-mini-label">Growth</span>
                    <span className={`sh-dd-mini-value ${zbmTotals.growth >= 0 ? 'positive' : 'negative'}`}>
                      {zbmTotals.growth >= 0 ? '↑' : '↓'}{Utils.formatGrowth(zbmTotals.growth)}
                    </span>
                  </div>
                </div>
              </div>

              {/* ABMs under ZBM */}
              {isZBMExpanded && (
                <div className="sh-dd-zbm-body">
                  {zbm.abms.map(abm => {
                    const isABMExpanded = expandedABMs.has(abm.id);
                    const abmTotals = getABMTotals(abm);

                    return (
                      <div key={abm.id} className={`sh-dd-abm-card ${isABMExpanded ? 'expanded' : ''}`}>
                        <div className="sh-dd-abm-header" onClick={() => toggleABM(abm.id)}>
                          <div className="sh-dd-abm-left">
                            <i className={`fas fa-chevron-${isABMExpanded ? 'down' : 'right'} sh-dd-chevron`}></i>
                            <div className="sh-dd-abm-avatar">{abm.name.split(' ').map(n => n[0]).join('').substring(0, 2)}</div>
                            <div>
                              <span className="sh-dd-abm-name">{abm.name}</span>
                              <span className="sh-dd-abm-territory"><i className="fas fa-map-marker-alt"></i> {abm.territory}</span>
                            </div>
                          </div>
                          <div className="sh-dd-abm-stats">
                            <div className="sh-dd-mini-stat"><span className="sh-dd-mini-label">TBMs</span><span className="sh-dd-mini-value">{abm.tbms.length}</span></div>
                            <div className="sh-dd-mini-stat"><span className="sh-dd-mini-label">CY Rev</span><span className="sh-dd-mini-value">₹{Utils.formatCompact(abmTotals.totalCyRev)}</span></div>
                            <div className="sh-dd-mini-stat">
                              <span className="sh-dd-mini-label">Growth</span>
                              <span className={`sh-dd-mini-value ${abmTotals.growth >= 0 ? 'positive' : 'negative'}`}>
                                {abmTotals.growth >= 0 ? '↑' : '↓'}{Utils.formatGrowth(abmTotals.growth)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* TBMs under ABM */}
                        {isABMExpanded && (
                          <div className="sh-dd-abm-body">
                            {abm.tbms.map(tbm => {
                              const isTBMExpanded = expandedTBMs.has(tbm.id);
                              const tbmTotals = getTBMTotals(tbm);

                              return (
                                <div key={tbm.id} className={`sh-dd-tbm-card ${isTBMExpanded ? 'expanded' : ''}`}>
                                  <div className="sh-dd-tbm-header" onClick={() => toggleTBM(tbm.id)}>
                                    <div className="sh-dd-tbm-left">
                                      <i className={`fas fa-chevron-${isTBMExpanded ? 'down' : 'right'} sh-dd-chevron`}></i>
                                      <div className="sh-dd-tbm-avatar">{tbm.name.split(' ').map(n => n[0]).join('').substring(0, 2)}</div>
                                      <div>
                                        <span className="sh-dd-tbm-name">{tbm.name}</span>
                                        <span className="sh-dd-tbm-territory"><i className="fas fa-map-pin"></i> {tbm.territory}</span>
                                      </div>
                                    </div>
                                    <div className="sh-dd-tbm-stats">
                                      <div className="sh-dd-mini-stat"><span className="sh-dd-mini-label">Reps</span><span className="sh-dd-mini-value">{tbm.salesReps.length}</span></div>
                                      <div className="sh-dd-mini-stat"><span className="sh-dd-mini-label">CY Rev</span><span className="sh-dd-mini-value">₹{Utils.formatCompact(tbmTotals.totalCyRev)}</span></div>
                                      <div className="sh-dd-mini-stat">
                                        <span className="sh-dd-mini-label">Growth</span>
                                        <span className={`sh-dd-mini-value ${tbmTotals.growth >= 0 ? 'positive' : 'negative'}`}>
                                          {tbmTotals.growth >= 0 ? '↑' : '↓'}{Utils.formatGrowth(tbmTotals.growth)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Sales Reps under TBM */}
                                  {isTBMExpanded && (
                                    <div className="sh-dd-tbm-body">
                                      {tbm.salesReps.map(rep => {
                                        const isRepExpanded = expandedReps.has(rep.id);
                                        const repTotals = getRepTotals(rep);

                                        return (
                                          <div key={rep.id} className={`sh-dd-rep-card ${isRepExpanded ? 'expanded' : ''}`}>
                                            <div className="sh-dd-rep-header" onClick={() => toggleRep(rep.id)}>
                                              <div className="sh-dd-rep-left">
                                                <i className={`fas fa-chevron-${isRepExpanded ? 'down' : 'right'} sh-dd-chevron`}></i>
                                                <div className="sh-dd-rep-avatar">{rep.name.split(' ').map(n => n[0]).join('').substring(0, 2)}</div>
                                                <div>
                                                  <span className="sh-dd-rep-name">{rep.name}</span>
                                                  <span className="sh-dd-rep-territory"><i className="fas fa-map-marker-alt"></i> {rep.territory}</span>
                                                </div>
                                              </div>
                                              <div className="sh-dd-rep-stats">
                                                <div className="sh-dd-mini-stat"><span className="sh-dd-mini-label">CY Rev</span><span className="sh-dd-mini-value">₹{Utils.formatCompact(repTotals.totalCyRev)}</span></div>
                                                <div className="sh-dd-mini-stat">
                                                  <span className="sh-dd-mini-label">Growth</span>
                                                  <span className={`sh-dd-mini-value ${repTotals.growth >= 0 ? 'positive' : 'negative'}`}>
                                                    {repTotals.growth >= 0 ? '↑' : '↓'}{Utils.formatGrowth(repTotals.growth)}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>

                                            {/* Product Target Grid */}
                                            {isRepExpanded && rep.products && rep.products.length > 0 && (
                                              <div className="sh-dd-products-wrapper">
                                                <table className="sh-dd-product-table">
                                                  <thead>
                                                    <tr>
                                                      <th className="sh-dd-th-product">Product</th>
                                                      <th></th>
                                                      {MONTH_LABELS.map((ml, i) => <th key={i}>{ml}</th>)}
                                                      <th>TOTAL</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody>
                                                    {rep.products.map(product => {
                                                      let lyTotal = 0, cyTotal = 0;
                                                      MONTHS.forEach(m => {
                                                        lyTotal += product.monthlyTargets?.[m]?.lyRev || 0;
                                                        cyTotal += product.monthlyTargets?.[m]?.cyRev || 0;
                                                      });
                                                      return (
                                                        <React.Fragment key={product.productId}>
                                                          <tr className="sh-dd-ly-row">
                                                            <td className="sh-dd-td-product" rowSpan={2}>{product.productName}</td>
                                                            <td className="sh-dd-td-type ly">LY</td>
                                                            {MONTHS.map(m => (
                                                              <td key={m} className="sh-dd-td-val ly">₹{Utils.formatCompact(product.monthlyTargets?.[m]?.lyRev || 0)}</td>
                                                            ))}
                                                            <td className="sh-dd-td-total ly">₹{Utils.formatCompact(lyTotal)}</td>
                                                          </tr>
                                                          <tr className="sh-dd-cy-row">
                                                            <td className="sh-dd-td-type cy">CY</td>
                                                            {MONTHS.map(m => (
                                                              <td key={m} className="sh-dd-td-val cy">₹{Utils.formatCompact(product.monthlyTargets?.[m]?.cyRev || 0)}</td>
                                                            ))}
                                                            <td className="sh-dd-td-total cy">₹{Utils.formatCompact(cyTotal)}</td>
                                                          </tr>
                                                        </React.Fragment>
                                                      );
                                                    })}
                                                  </tbody>
                                                </table>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SalesHeadDrilldown;
