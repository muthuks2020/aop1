/**
 * ABMTeamDrilldown Component
 * Provides ABM with drill-down visibility: TBM → Sales Reps → Product Targets
 * 
 * READ-ONLY — ABM can view but NOT edit Sales Rep targets set by TBMs.
 * ABM sets targets only for TBMs (via Team Yearly Targets tab).
 * 
 * @version 1.0.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ABMApiService } from '../../../services/abmApi';
import { Utils } from '../../../utils/helpers';
import '../../../styles/abm/abmTeamDrilldown.css';

const MONTHS = ['apr','may','jun','jul','aug','sep','oct','nov','dec','jan','feb','mar'];
const MONTH_LABELS = ['APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC','JAN','FEB','MAR'];

function ABMTeamDrilldown({ showToast }) {
  const [hierarchy, setHierarchy] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTBMs, setExpandedTBMs] = useState(new Set());
  const [expandedReps, setExpandedReps] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadHierarchy();
  }, []);

  const loadHierarchy = async () => {
    setIsLoading(true);
    try {
      const data = await ABMApiService.getTBMHierarchy();
      setHierarchy(data);
    } catch (error) {
      console.error('Failed to load hierarchy:', error);
      if (showToast) showToast('Error', 'Failed to load team data.', 'error');
    }
    setIsLoading(false);
  };

  const toggleTBM = useCallback((tbmId) => {
    setExpandedTBMs(prev => {
      const next = new Set(prev);
      next.has(tbmId) ? next.delete(tbmId) : next.add(tbmId);
      return next;
    });
  }, []);

  const toggleRep = useCallback((repId) => {
    setExpandedReps(prev => {
      const next = new Set(prev);
      next.has(repId) ? next.delete(repId) : next.add(repId);
      return next;
    });
  }, []);

  const expandAll = () => {
    setExpandedTBMs(new Set(hierarchy.map(t => t.id)));
    setExpandedReps(new Set(hierarchy.flatMap(t => t.salesReps.map(r => r.id))));
  };

  const collapseAll = () => { setExpandedTBMs(new Set()); setExpandedReps(new Set()); };

  // Filter by search
  const filteredHierarchy = useMemo(() => {
    if (!searchTerm.trim()) return hierarchy;
    const term = searchTerm.toLowerCase();
    return hierarchy.map(tbm => ({
      ...tbm,
      salesReps: tbm.salesReps.filter(rep =>
        rep.name.toLowerCase().includes(term) ||
        rep.territory.toLowerCase().includes(term) ||
        rep.products?.some(p => p.productName.toLowerCase().includes(term))
      )
    })).filter(tbm =>
      tbm.name.toLowerCase().includes(term) ||
      tbm.territory.toLowerCase().includes(term) ||
      tbm.salesReps.length > 0
    );
  }, [hierarchy, searchTerm]);

  // Compute TBM-level totals
  const getTBMTotals = (tbm) => {
    let totalCyRev = 0, totalLyRev = 0, totalCyQty = 0, totalLyQty = 0;
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
    return { totalCyRev, totalLyRev, totalCyQty, totalLyQty, growth: Utils.calcGrowth(totalLyRev, totalCyRev) };
  };

  const getRepTotals = (rep) => {
    let totalCyRev = 0, totalLyRev = 0, totalCyQty = 0, totalLyQty = 0;
    rep.products?.forEach(p => {
      MONTHS.forEach(m => {
        totalCyRev += p.monthlyTargets?.[m]?.cyRev || 0;
        totalLyRev += p.monthlyTargets?.[m]?.lyRev || 0;
        totalCyQty += p.monthlyTargets?.[m]?.cyQty || 0;
        totalLyQty += p.monthlyTargets?.[m]?.lyQty || 0;
      });
    });
    return { totalCyRev, totalLyRev, totalCyQty, totalLyQty, growth: Utils.calcGrowth(totalLyRev, totalCyRev) };
  };

  if (isLoading) {
    return <div className="abm-dd-loading"><div className="loading-spinner"></div><p>Loading team hierarchy...</p></div>;
  }

  return (
    <div className="abm-dd-container">
      {/* Header */}
      <div className="abm-dd-header">
        <div className="abm-dd-header-left">
          <div className="abm-dd-icon"><i className="fas fa-sitemap"></i></div>
          <div>
            <h2>Team Drill-Down</h2>
            <span className="abm-dd-subtitle">
              {hierarchy.length} TBMs · {hierarchy.reduce((s, t) => s + t.salesReps.length, 0)} Sales Reps
            </span>
          </div>
        </div>
        <div className="abm-dd-actions">
          <button className="abm-dd-btn" onClick={expandAll}><i className="fas fa-expand-alt"></i> Expand All</button>
          <button className="abm-dd-btn" onClick={collapseAll}><i className="fas fa-compress-alt"></i> Collapse</button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="abm-dd-info">
        <i className="fas fa-eye"></i>
        <span>Read-only view of targets set by TBMs for their Sales Reps. To set TBM targets, use the <strong>Team Yearly Targets</strong> tab.</span>
      </div>

      {/* Search */}
      <div className="abm-dd-search">
        <i className="fas fa-search"></i>
        <input type="text" placeholder="Search TBMs, Sales Reps, or products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        {searchTerm && <button onClick={() => setSearchTerm('')}><i className="fas fa-times"></i></button>}
      </div>

      {/* TBM Cards */}
      <div className="abm-dd-list">
        {filteredHierarchy.map(tbm => {
          const isExpanded = expandedTBMs.has(tbm.id);
          const totals = getTBMTotals(tbm);

          return (
            <div key={tbm.id} className={`abm-dd-tbm-card ${isExpanded ? 'expanded' : ''}`}>
              {/* TBM Header */}
              <div className="abm-dd-tbm-header" onClick={() => toggleTBM(tbm.id)}>
                <div className="abm-dd-tbm-left">
                  <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'} abm-dd-chevron`}></i>
                  <div className="abm-dd-tbm-avatar">{tbm.name.split(' ').map(n => n[0]).join('').substring(0, 2)}</div>
                  <div className="abm-dd-tbm-info">
                    <span className="abm-dd-tbm-name">{tbm.name}</span>
                    <span className="abm-dd-tbm-territory"><i className="fas fa-map-marker-alt"></i> {tbm.territory}</span>
                  </div>
                </div>
                <div className="abm-dd-tbm-stats">
                  <div className="abm-dd-mini-stat">
                    <span className="abm-dd-mini-label">Sales Reps</span>
                    <span className="abm-dd-mini-value">{tbm.salesReps.length}</span>
                  </div>
                  <div className="abm-dd-mini-stat">
                    <span className="abm-dd-mini-label">CY Revenue</span>
                    <span className="abm-dd-mini-value">₹{Utils.formatCompact(totals.totalCyRev)}</span>
                  </div>
                  <div className="abm-dd-mini-stat">
                    <span className="abm-dd-mini-label">CY Qty</span>
                    <span className="abm-dd-mini-value">{Utils.formatNumber(totals.totalCyQty)}</span>
                  </div>
                  <div className="abm-dd-mini-stat">
                    <span className="abm-dd-mini-label">Growth</span>
                    <span className={`abm-dd-mini-value ${totals.growth >= 0 ? 'positive' : 'negative'}`}>
                      {totals.growth >= 0 ? '↑' : '↓'}{Utils.formatGrowth(totals.growth)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sales Reps Under TBM */}
              {isExpanded && (
                <div className="abm-dd-reps-container">
                  {tbm.salesReps.map(rep => {
                    const repExpanded = expandedReps.has(rep.id);
                    const repTotals = getRepTotals(rep);

                    return (
                      <div key={rep.id} className={`abm-dd-rep-card ${repExpanded ? 'expanded' : ''}`}>
                        {/* Rep Header */}
                        <div className="abm-dd-rep-header" onClick={() => toggleRep(rep.id)}>
                          <div className="abm-dd-rep-left">
                            <i className={`fas fa-chevron-${repExpanded ? 'down' : 'right'} abm-dd-chevron-sm`}></i>
                            <div className="abm-dd-rep-avatar">{rep.name.split(' ').map(n => n[0]).join('').substring(0, 2)}</div>
                            <div>
                              <span className="abm-dd-rep-name">{rep.name}</span>
                              <span className="abm-dd-rep-territory">{rep.territory}</span>
                            </div>
                          </div>
                          <div className="abm-dd-rep-stats">
                            <span className="abm-dd-rep-metric">₹{Utils.formatCompact(repTotals.totalCyRev)}</span>
                            <span className="abm-dd-rep-metric">{Utils.formatNumber(repTotals.totalCyQty)} units</span>
                            <span className={`abm-dd-rep-growth ${repTotals.growth >= 0 ? 'positive' : 'negative'}`}>
                              {repTotals.growth >= 0 ? '↑' : '↓'}{Utils.formatGrowth(repTotals.growth)}
                            </span>
                          </div>
                        </div>

                        {/* Product Targets Table (Read-Only) */}
                        {repExpanded && rep.products && (
                          <div className="abm-dd-products-table">
                            <table>
                              <thead>
                                <tr>
                                  <th className="abm-dd-th-product">Product</th>
                                  <th className="abm-dd-th-type">Type</th>
                                  {MONTHS.map((m, i) => (
                                    <th key={m} className={`abm-dd-th-month abm-dd-q${Math.floor(i/3)+1}`}>{MONTH_LABELS[i]}</th>
                                  ))}
                                  <th>Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {rep.products.map((product, pIdx) => {
                                  let lyT = 0, cyT = 0;
                                  MONTHS.forEach(m => { lyT += product.monthlyTargets?.[m]?.cyQty || 0; cyT += product.monthlyTargets?.[m]?.cyQty || 0; });
                                  return (
                                    <React.Fragment key={pIdx}>
                                      <tr className="abm-dd-ly-row">
                                        <td className="abm-dd-td-product" rowSpan="2">{product.productName}</td>
                                        <td className="abm-dd-td-type ly">LY</td>
                                        {MONTHS.map(m => (<td key={m} className="abm-dd-td-val ly">{product.monthlyTargets?.[m]?.lyQty || 0}</td>))}
                                        <td className="abm-dd-td-total ly">{MONTHS.reduce((s, m) => s + (product.monthlyTargets?.[m]?.lyQty || 0), 0)}</td>
                                      </tr>
                                      <tr className="abm-dd-cy-row">
                                        <td className="abm-dd-td-type cy">CY</td>
                                        {MONTHS.map(m => (<td key={m} className="abm-dd-td-val cy">{product.monthlyTargets?.[m]?.cyQty || 0}</td>))}
                                        <td className="abm-dd-td-total cy">{MONTHS.reduce((s, m) => s + (product.monthlyTargets?.[m]?.cyQty || 0), 0)}</td>
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
    </div>
  );
}

export default ABMTeamDrilldown;
