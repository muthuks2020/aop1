import React, { useState, useEffect, useMemo } from 'react';
import { Utils } from '../../../utils/helpers';
import '../../../styles/abm/abmOverview.css';

const MONTHS = ['apr','may','jun','jul','aug','sep','oct','nov','dec','jan','feb','mar'];

function ABMOverviewStats({ abmTargets = [], categories = [], tbmSubmissions = [], approvalStats = {} }) {
  const [animateIn, setAnimateIn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimateIn(true), 100); return () => clearTimeout(t); }, []);

  const overallTotals = useMemo(() => {
    let lyQty=0,cyQty=0,lyRev=0,cyRev=0;
    abmTargets.forEach(p => { if(p.monthlyTargets) Object.values(p.monthlyTargets).forEach(m => { lyQty+=m.lyQty||0; cyQty+=m.cyQty||0; lyRev+=m.lyRev||0; cyRev+=m.cyRev||0; }); });
    return { lyQty,cyQty,lyRev,cyRev, qtyGrowth:Utils.calcGrowth(lyQty,cyQty), revGrowth:Utils.calcGrowth(lyRev,cyRev) };
  }, [abmTargets]);

  const categoryPerformance = useMemo(() => {
    return categories.map(cat => {
      const cp = abmTargets.filter(p => p.categoryId===cat.id);
      let lyQty=0,cyQty=0,lyRev=0,cyRev=0;
      cp.forEach(p => { if(p.monthlyTargets) Object.values(p.monthlyTargets).forEach(m => { lyQty+=m.lyQty||0; cyQty+=m.cyQty||0; lyRev+=m.lyRev||0; cyRev+=m.cyRev||0; }); });
      return { ...cat, lyQty,cyQty,lyRev,cyRev, growth:Utils.calcGrowth(lyQty,cyQty), contribution:overallTotals.cyQty>0?((cyQty/overallTotals.cyQty)*100).toFixed(1):0, productCount:cp.length };
    }).filter(c => c.productCount>0);
  }, [abmTargets, categories, overallTotals]);

  const tbmSummary = useMemo(() => {
    const m={};
    tbmSubmissions.forEach(sub => {
      if(!m[sub.tbmId]) m[sub.tbmId]={id:sub.tbmId,name:sub.tbmName,territory:sub.territory,totalCyRev:0,totalLyRev:0,submitted:0,approved:0,total:0};
      const t=m[sub.tbmId]; t.total++; if(sub.status==='submitted')t.submitted++; if(sub.status==='approved')t.approved++;
      if(sub.monthlyTargets) Object.values(sub.monthlyTargets).forEach(v => { t.totalCyRev+=v.cyRev||0; t.totalLyRev+=v.lyRev||0; });
    });
    return Object.values(m);
  }, [tbmSubmissions]);

  return (
    <div className={`abm-overview ${animateIn?'abm-ov-animate-in':''}`}>
      <div className="abm-ov-kpi-grid">
        <div className="abm-ov-kpi-card abm-ov-kpi-revenue"><div className="abm-ov-kpi-icon"><i className="fas fa-rupee-sign"></i></div><div className="abm-ov-kpi-content"><span className="abm-ov-kpi-label">Area Target (CY Revenue)</span><span className="abm-ov-kpi-value">₹{Utils.formatShortCurrency?Utils.formatShortCurrency(overallTotals.cyRev):Utils.formatCompact(overallTotals.cyRev)}</span><span className={`abm-ov-kpi-growth ${overallTotals.revGrowth>=0?'positive':'negative'}`}><i className={`fas fa-arrow-${overallTotals.revGrowth>=0?'up':'down'}`}></i> {Utils.formatGrowth(overallTotals.revGrowth)} vs LY</span></div></div>
        <div className="abm-ov-kpi-card abm-ov-kpi-qty"><div className="abm-ov-kpi-icon"><i className="fas fa-boxes"></i></div><div className="abm-ov-kpi-content"><span className="abm-ov-kpi-label">Area Target (CY Qty)</span><span className="abm-ov-kpi-value">{Utils.formatNumber(overallTotals.cyQty)}</span><span className={`abm-ov-kpi-growth ${overallTotals.qtyGrowth>=0?'positive':'negative'}`}><i className={`fas fa-arrow-${overallTotals.qtyGrowth>=0?'up':'down'}`}></i> {Utils.formatGrowth(overallTotals.qtyGrowth)} vs LY</span></div></div>
        <div className="abm-ov-kpi-card abm-ov-kpi-tbms"><div className="abm-ov-kpi-icon"><i className="fas fa-user-tie"></i></div><div className="abm-ov-kpi-content"><span className="abm-ov-kpi-label">TBMs Under Area</span><span className="abm-ov-kpi-value">{tbmSummary.length}</span><span className="abm-ov-kpi-sub">{approvalStats.approved||0} approved / {approvalStats.pending||0} pending</span></div></div>
        <div className="abm-ov-kpi-card abm-ov-kpi-approval"><div className="abm-ov-kpi-icon"><i className="fas fa-clipboard-check"></i></div><div className="abm-ov-kpi-content"><span className="abm-ov-kpi-label">Approval Progress</span><span className="abm-ov-kpi-value">{approvalStats.total>0?Math.round((approvalStats.approved/approvalStats.total)*100):0}%</span><div className="abm-ov-kpi-progress-bar"><div className="abm-ov-kpi-progress-fill" style={{width:`${approvalStats.total>0?(approvalStats.approved/approvalStats.total)*100:0}%`}}></div></div></div></div>
      </div>

      <div className="abm-ov-section"><h3 className="abm-ov-section-title"><i className="fas fa-user-tie"></i> TBM Performance</h3><div className="abm-ov-tbm-grid">{tbmSummary.map(tbm => { const g=Utils.calcGrowth(tbm.totalLyRev,tbm.totalCyRev); return (<div key={tbm.id} className="abm-ov-tbm-card"><div className="abm-ov-tbm-header"><div className="abm-ov-tbm-avatar">{tbm.name.split(' ').map(n=>n[0]).join('').substring(0,2)}</div><div className="abm-ov-tbm-info"><span className="abm-ov-tbm-name">{tbm.name}</span><span className="abm-ov-tbm-territory">{tbm.territory}</span></div><span className={`abm-ov-tbm-status ${tbm.submitted>0?'pending':'done'}`}>{tbm.submitted>0?`${tbm.submitted} pending`:'All approved'}</span></div><div className="abm-ov-tbm-metrics"><div className="abm-ov-tbm-metric"><span className="abm-ov-tbm-metric-label">CY Revenue</span><span className="abm-ov-tbm-metric-value">₹{Utils.formatCompact(tbm.totalCyRev)}</span></div><div className="abm-ov-tbm-metric"><span className="abm-ov-tbm-metric-label">Growth</span><span className={`abm-ov-tbm-metric-value ${g>=0?'positive':'negative'}`}>{g>=0?'↑':'↓'}{Utils.formatGrowth(g)}</span></div></div></div>); })}</div></div>

      <div className="abm-ov-section"><h3 className="abm-ov-section-title"><i className="fas fa-th-large"></i> Category Performance</h3><div className="abm-ov-category-grid">{categoryPerformance.map(cat => (<div key={cat.id} className="abm-ov-cat-card"><div className="abm-ov-cat-header"><div className="abm-ov-cat-icon"><i className={`fas ${cat.icon}`}></i></div><span className="abm-ov-cat-name">{cat.name}</span><span className="abm-ov-cat-contribution">{cat.contribution}%</span></div><div className="abm-ov-cat-metrics"><div className="abm-ov-cat-row"><span>CY Qty</span><span className="abm-ov-cat-bold">{Utils.formatNumber(cat.cyQty)}</span></div><div className="abm-ov-cat-row"><span>Growth</span><span className={cat.growth>=0?'positive':'negative'}>{cat.growth>=0?'↑':'↓'}{Utils.formatGrowth(cat.growth)}</span></div></div></div>))}</div></div>
    </div>
  );
}
export default ABMOverviewStats;
