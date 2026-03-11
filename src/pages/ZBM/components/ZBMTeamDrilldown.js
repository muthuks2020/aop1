import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ZBMApiService } from '../../../services/zbmApi';
import { Utils } from '../../../utils/helpers';
import '../../../styles/zbm/zbmTeamDrilldown.css';

const MONTHS = ['apr','may','jun','jul','aug','sep','oct','nov','dec','jan','feb','mar'];
const MONTH_LABELS = ['APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC','JAN','FEB','MAR'];

function ZBMTeamDrilldown({ showToast }) {
  const [hierarchy, setHierarchy] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedABMs, setExpandedABMs] = useState(new Set());
  const [expandedTBMs, setExpandedTBMs] = useState(new Set());
  const [expandedReps, setExpandedReps] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadHierarchy();

  }, []);

  const loadHierarchy = async () => {
    setIsLoading(true);
    try {
      const data = await ZBMApiService.getABMHierarchy();
      setHierarchy(data);
    } catch (error) {
      console.error('Failed to load hierarchy:', error);
      if (showToast) showToast('Error', 'Failed to load team data.', 'error');
    }
    setIsLoading(false);
  };

  const toggleABM = useCallback((abmId) => {
    setExpandedABMs(prev => { const n = new Set(prev); n.has(abmId) ? n.delete(abmId) : n.add(abmId); return n; });
  }, []);

  const toggleTBM = useCallback((tbmId) => {
    setExpandedTBMs(prev => { const n = new Set(prev); n.has(tbmId) ? n.delete(tbmId) : n.add(tbmId); return n; });
  }, []);

  const toggleRep = useCallback((repId) => {
    setExpandedReps(prev => { const n = new Set(prev); n.has(repId) ? n.delete(repId) : n.add(repId); return n; });
  }, []);

  const expandAll = () => {
    setExpandedABMs(new Set(hierarchy.map(a => a.id)));
    setExpandedTBMs(new Set(hierarchy.flatMap(a => (a.tbms || []).map(t => t.id))));
    setExpandedReps(new Set(hierarchy.flatMap(a => (a.tbms || []).flatMap(t => (t.salesReps || []).map(r => r.id)))));
  };

  const collapseAll = () => { setExpandedABMs(new Set()); setExpandedTBMs(new Set()); setExpandedReps(new Set()); };

  const filteredHierarchy = useMemo(() => {
    if (!searchTerm.trim()) return hierarchy;
    const term = searchTerm.toLowerCase();
    return hierarchy.map(abm => ({
      ...abm,
      tbms: (abm.tbms || []).map(tbm => ({
        ...tbm,
        salesReps: (tbm.salesReps || []).filter(rep =>
          rep.name?.toLowerCase().includes(term) ||
          rep.territory?.toLowerCase().includes(term) ||
          rep.products?.some(p => p.productName?.toLowerCase().includes(term))
        )
      })).filter(tbm =>
        tbm.name?.toLowerCase().includes(term) ||
        tbm.territory?.toLowerCase().includes(term) ||
        (tbm.salesReps || []).length > 0
      )
    })).filter(abm =>
      abm.name?.toLowerCase().includes(term) ||
      abm.territory?.toLowerCase().includes(term) ||
      (abm.tbms || []).length > 0
    );
  }, [hierarchy, searchTerm]);

  const getABMTotals = (abm) => {
    let totalCyRev = 0, totalLyRev = 0, totalCyQty = 0, totalLyQty = 0;
    let totalLyAchRev = 0, totalCyAchRev = 0;
    (abm.tbms || []).forEach(tbm => {
      (tbm.salesReps || []).forEach(rep => {
        rep.products?.forEach(p => {
          MONTHS.forEach(m => {
            totalCyRev    += p.monthlyTargets?.[m]?.cyRev    || 0;
            totalLyRev    += p.monthlyTargets?.[m]?.lyRev    || 0;
            totalCyQty    += p.monthlyTargets?.[m]?.cyQty    || 0;
            totalLyQty    += p.monthlyTargets?.[m]?.lyQty    || 0;
            totalLyAchRev += p.monthlyTargets?.[m]?.lyAchRev || 0;
            totalCyAchRev += p.monthlyTargets?.[m]?.cyAchRev || 0;
          });
        });
      });
    });
    return { totalCyRev, totalLyRev, totalCyQty, totalLyQty,
             totalLyAchRev, totalCyAchRev,
             growth: Utils.calcGrowth(totalLyRev, totalCyRev) };
  };

  const getTBMTotals = (tbm) => {
    let totalCyRev = 0, totalLyRev = 0, totalCyQty = 0, totalLyQty = 0;
    let totalLyAchRev = 0, totalCyAchRev = 0;
    (tbm.salesReps || []).forEach(rep => {
      rep.products?.forEach(p => {
        MONTHS.forEach(m => {
          totalCyRev    += p.monthlyTargets?.[m]?.cyRev    || 0;
          totalLyRev    += p.monthlyTargets?.[m]?.lyRev    || 0;
          totalCyQty    += p.monthlyTargets?.[m]?.cyQty    || 0;
          totalLyQty    += p.monthlyTargets?.[m]?.lyQty    || 0;
          totalLyAchRev += p.monthlyTargets?.[m]?.lyAchRev || 0;
          totalCyAchRev += p.monthlyTargets?.[m]?.cyAchRev || 0;
        });
      });
    });
    return { totalCyRev, totalLyRev, totalCyQty, totalLyQty,
             totalLyAchRev, totalCyAchRev,
             growth: Utils.calcGrowth(totalLyRev, totalCyRev) };
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

  const zoneSummary = useMemo(() => {
    let totalABMs = hierarchy.length;
    let totalTBMs = hierarchy.reduce((s, a) => s + (a.tbms?.length || 0), 0);
    let totalReps = hierarchy.reduce((s, a) => s + (a.tbms || []).reduce((ss, t) => ss + (t.salesReps?.length || 0), 0), 0);
    return { totalABMs, totalTBMs, totalReps };
  }, [hierarchy]);

  if (isLoading) {
    return <div className="zbm-dd-loading"><div className="loading-spinner"></div><p>Loading zone hierarchy...</p></div>;
  }

  return (
    <div className="zbm-dd-container">
      {}
      <div className="zbm-dd-header">
        <div className="zbm-dd-header-left">
          <div className="zbm-dd-icon"><i className="fas fa-project-diagram"></i></div>
          <div>
            <h2>Zone Team Drill-Down</h2>
            <span className="zbm-dd-subtitle">
              {zoneSummary.totalABMs} ABMs · {zoneSummary.totalTBMs} TBMs · {zoneSummary.totalReps} Sales Reps
            </span>
          </div>
        </div>
        <div className="zbm-dd-actions">
          <button className="zbm-dd-btn" onClick={expandAll}><i className="fas fa-expand-alt"></i> Expand All</button>
          <button className="zbm-dd-btn" onClick={collapseAll}><i className="fas fa-compress-alt"></i> Collapse</button>
        </div>
      </div>

      {}
      <div className="zbm-dd-info">
        <i className="fas fa-eye"></i>
        <span>Read-only view of the full zone hierarchy: <strong>ABM → TBM → Sales Rep</strong>. To set ABM targets, use the <strong>Team Yearly Targets</strong> tab.</span>
      </div>

      {}
      <div className="zbm-dd-search">
        <i className="fas fa-search"></i>
        <input type="text" placeholder="Search ABMs, TBMs, Sales Reps, or products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        {searchTerm && <button onClick={() => setSearchTerm('')}><i className="fas fa-times"></i></button>}
      </div>

      {}
      <div className="zbm-dd-list">
        {filteredHierarchy.map(abm => {
          const isABMExpanded = expandedABMs.has(abm.id);
          const abmTotals = getABMTotals(abm);

          return (
            <div key={abm.id} className={`zbm-dd-abm-card ${isABMExpanded ? 'expanded' : ''}`}>
              {}
              <div className="zbm-dd-abm-header" onClick={() => toggleABM(abm.id)}>
                <div className="zbm-dd-abm-left">
                  <i className={`fas fa-chevron-${isABMExpanded ? 'down' : 'right'} zbm-dd-chevron`}></i>
                  <div className="zbm-dd-abm-avatar">
                    {(abm.name || '??').split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  <div>
                    <span className="zbm-dd-abm-name">{abm.name || 'Unknown ABM'}</span>
                    <span className="zbm-dd-abm-territory"><i className="fas fa-map-marker-alt"></i> {abm.territory || '—'}</span>
                  </div>
                </div>
                <div className="zbm-dd-abm-stats">
                  <div className="zbm-dd-mini-stat">
                    <span className="zbm-dd-mini-label">TBMs</span>
                    {}
                    <span className="zbm-dd-mini-value">{(abm.tbms || []).length}</span>
                  </div>
                  <div className="zbm-dd-mini-stat">
                    <span className="zbm-dd-mini-label">Reps</span>
                    {}
                    <span className="zbm-dd-mini-value">{(abm.tbms || []).reduce((s, t) => s + (t.salesReps?.length || 0), 0)}</span>
                  </div>
                  {}
                  <div className="zbm-dd-mini-stat">
                    <span className="zbm-dd-mini-label">CY Target</span>
                    <span className="zbm-dd-mini-value">₹{Utils.formatCompact(abmTotals.totalCyRev)}</span>
                  </div>
                  <div className="zbm-dd-mini-stat">
                    <span className="zbm-dd-mini-label">LY Ahv</span>
                    <span className="zbm-dd-mini-value">
                      {abmTotals.totalLyAchRev > 0 ? `₹${Utils.formatCompact(abmTotals.totalLyAchRev)}` : '—'}
                    </span>
                  </div>
                  <div className="zbm-dd-mini-stat">
                    <span className="zbm-dd-mini-label">CY Ahv</span>
                    <span className="zbm-dd-mini-value">
                      {abmTotals.totalCyAchRev > 0 ? `₹${Utils.formatCompact(abmTotals.totalCyAchRev)}` : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {}
              {isABMExpanded && (
                <div className="zbm-dd-abm-body">
                  {}
                  {(abm.tbms || []).map(tbm => {
                    const isTBMExpanded = expandedTBMs.has(tbm.id);
                    const tbmTotals = getTBMTotals(tbm);

                    return (
                      <div key={tbm.id} className={`zbm-dd-tbm-card ${isTBMExpanded ? 'expanded' : ''}`}>
                        {}
                        <div className="zbm-dd-tbm-header" onClick={() => toggleTBM(tbm.id)}>
                          <div className="zbm-dd-tbm-left">
                            <i className={`fas fa-chevron-${isTBMExpanded ? 'down' : 'right'} zbm-dd-chevron`}></i>
                            <div className="zbm-dd-tbm-avatar">
                              {(tbm.name || '??').split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </div>
                            <div>
                              <span className="zbm-dd-tbm-name">{tbm.name || 'Unknown TBM'}</span>
                              <span className="zbm-dd-tbm-territory"><i className="fas fa-map-pin"></i> {tbm.territory || '—'}</span>
                            </div>
                          </div>
                          <div className="zbm-dd-tbm-stats">
                            <div className="zbm-dd-mini-stat">
                              <span className="zbm-dd-mini-label">Reps</span>
                              {}
                              <span className="zbm-dd-mini-value">{(tbm.salesReps || []).length}</span>
                            </div>
                            <div className="zbm-dd-mini-stat">
                              <span className="zbm-dd-mini-label">CY Rev</span>
                              <span className="zbm-dd-mini-value">₹{Utils.formatCompact(tbmTotals.totalCyRev)}</span>
                            </div>
                          </div>
                        </div>

                        {}
                        {isTBMExpanded && (
                          <div className="zbm-dd-tbm-body">
                            {}
                            {(tbm.salesReps || []).map(rep => {
                              const isRepExpanded = expandedReps.has(rep.id);
                              const repTotals = getRepTotals(rep);

                              return (
                                <div key={rep.id} className={`zbm-dd-rep-card ${isRepExpanded ? 'expanded' : ''}`}>
                                  {}
                                  <div className="zbm-dd-rep-header" onClick={() => toggleRep(rep.id)}>
                                    <div className="zbm-dd-rep-left">
                                      <i className={`fas fa-chevron-${isRepExpanded ? 'down' : 'right'} zbm-dd-chevron`}></i>
                                      <div className="zbm-dd-rep-avatar">
                                        {(rep.name || '??').split(' ').map(n => n[0]).join('').substring(0, 2)}
                                      </div>
                                      <div>
                                        <span className="zbm-dd-rep-name">{rep.name || 'Unknown Rep'}</span>
                                        <span className="zbm-dd-rep-territory"><i className="fas fa-map-marker-alt"></i> {rep.territory || '—'}</span>
                                      </div>
                                    </div>
                                    <div className="zbm-dd-rep-stats">
                                      <div className="zbm-dd-mini-stat">
                                        <span className="zbm-dd-mini-label">Products</span>
                                        <span className="zbm-dd-mini-value">{rep.products?.length || 0}</span>
                                      </div>
                                      <div className="zbm-dd-mini-stat">
                                        <span className="zbm-dd-mini-label">CY Rev</span>
                                        <span className="zbm-dd-mini-value">₹{Utils.formatCompact(repTotals.totalCyRev)}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {}
                                  {isRepExpanded && (
                                    <div className="zbm-dd-rep-body">
                                      {(!rep.products || rep.products.length === 0) ? (
                                        <div className="zbm-dd-no-products">
                                          <i className="fas fa-box-open"></i> No products assigned
                                        </div>
                                      ) : (
                                        <div className="zbm-dd-product-grid-wrapper">
                                          <table className="zbm-dd-product-table">
                                            <thead>
                                              <tr>
                                                <th className="zbm-dd-th-product">Product</th>
                                                <th className="zbm-dd-th-type"></th>
                                                {MONTH_LABELS.map(m => (
                                                  <th key={m} className="zbm-dd-th-month">{m}</th>
                                                ))}
                                                <th className="zbm-dd-th-total">TOTAL</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {rep.products.map(product => (
                                                <React.Fragment key={product.productId || product.productName}>
                                                  <tr className="zbm-dd-product-name-row">
                                                    <td colSpan={MONTHS.length + 3} className="zbm-dd-td-product-name">
                                                      {product.productName}
                                                    </td>
                                                  </tr>
                                                  <tr className="zbm-dd-ly-row">
                                                    <td className="zbm-dd-td-type ly">LY</td>
                                                    <td className="zbm-dd-td-type ly"></td>
                                                    {MONTHS.map(m => (
                                                      <td key={m} className="zbm-dd-td-val ly">
                                                        {product.monthlyTargets?.[m]?.lyQty || 0}
                                                      </td>
                                                    ))}
                                                    <td className="zbm-dd-td-total ly">
                                                      {MONTHS.reduce((s, m) => s + (product.monthlyTargets?.[m]?.lyQty || 0), 0)}
                                                    </td>
                                                  </tr>
                                                  <tr className="zbm-dd-cy-row">
                                                    <td className="zbm-dd-td-type cy">CY</td>
                                                    <td className="zbm-dd-td-type cy"></td>
                                                    {MONTHS.map(m => (
                                                      <td key={m} className="zbm-dd-td-val cy">
                                                        {product.monthlyTargets?.[m]?.cyQty || 0}
                                                      </td>
                                                    ))}
                                                    <td className="zbm-dd-td-total cy">
                                                      {MONTHS.reduce((s, m) => s + (product.monthlyTargets?.[m]?.cyQty || 0), 0)}
                                                    </td>
                                                  </tr>
                                                  <tr className="zbm-dd-aop-row">
                                                    <td className="zbm-dd-td-type aop">AOP</td>
                                                    <td className="zbm-dd-td-type aop"></td>
                                                    {MONTHS.map(m => (
                                                      <td key={m} className="zbm-dd-td-val aop">
                                                        {product.monthlyTargets?.[m]?.aopQty || 0}
                                                      </td>
                                                    ))}
                                                    <td className="zbm-dd-td-total aop">
                                                      {MONTHS.reduce((s, m) => s + (product.monthlyTargets?.[m]?.aopQty || 0), 0)}
                                                    </td>
                                                  </tr>
                                                </React.Fragment>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}
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

export default ZBMTeamDrilldown;
