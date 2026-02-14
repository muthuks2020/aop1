/**
 * ABM Dashboard Component v2
 * 
 * FIVE tabs:
 * 1. TBM Targets — Review/correct/approve TBM territory submissions
 * 2. Overview & Summary — Area-level KPIs
 * 3. Area Target — Area-level target entry grid (reuses Sales Rep TargetEntryGrid)
 * 4. Team Yearly Targets — Set yearly targets for TBMs
 * 5. Team Drill-Down — ★ View TBM → Sales Rep hierarchy with read-only target visibility
 * 
 * HIERARCHY: Sales Rep → TBM → ABM → ZBM → Sales Head
 * ABM sets targets for TBMs, has READ-ONLY visibility of TBM→SalesRep targets
 * 
 * @author Appasamy Associates - Product Commitment PWA
 * @version 2.0.0 — Drill-down + no header-progress
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ABMApiService } from '../../services/abmApi';
import { Utils } from '../../utils/helpers';
import Header from '../../components/common/Header';
import Toast from '../../components/common/Toast';
import Modal from '../../components/common/Modal';
import ABMOverviewStats from './components/ABMOverviewStats';
import ABMAreaTargetGrid from './components/ABMAreaTargetGrid';
import ABMTeamDrilldown from './components/ABMTeamDrilldown';
import TeamYearlyTargets from '../TBM/components/TeamYearlyTargets';
import '../../styles/abm/abmDashboard.css';
import SalesRepGrowthPieChart from './components/SalesRepGrowthPieChart';

const MONTHS = ['apr','may','jun','jul','aug','sep','oct','nov','dec','jan','feb','mar'];
const MONTH_LABELS = ['APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC','JAN','FEB','MAR'];

function ABMDashboard() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('approvals');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [tbmSubmissions, setTbmSubmissions] = useState([]);
  const [abmTargets, setAbmTargets] = useState([]);
  const [tbmFilter, setTbmFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [toasts, setToasts] = useState([]);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'warning', onConfirm: null });
  const [editedCells, setEditedCells] = useState(new Set());

  const showToast = useCallback((title, message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  useEffect(() => {
    const on = () => { setIsOnline(true); showToast('Online', 'Connection restored.', 'success'); };
    const off = () => { setIsOnline(false); showToast('Offline', 'Working offline.', 'warning'); };
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, [showToast]);

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [cats, subs, targets] = await Promise.all([
        ABMApiService.getCategories(), ABMApiService.getTBMSubmissions(), ABMApiService.getABMTargets()
      ]);
      setCategories(cats); setTbmSubmissions(subs); setAbmTargets(targets);
    } catch (error) {
      console.error('Failed to load ABM data:', error);
      showToast('Error', 'Failed to load dashboard data.', 'error');
    }
    setIsLoading(false);
  }, [showToast]);

  useEffect(() => { loadInitialData(); }, [loadInitialData]);

  const approvalStats = useMemo(() => {
    const total = tbmSubmissions.length;
    const pending = tbmSubmissions.filter(s => s.status === 'submitted').length;
    const approved = tbmSubmissions.filter(s => s.status === 'approved').length;
    return { total, pending, approved };
  }, [tbmSubmissions]);

  const uniqueTBMs = useMemo(() => {
    const m = {};
    tbmSubmissions.forEach(s => { if (!m[s.tbmId]) m[s.tbmId] = { id: s.tbmId, name: s.tbmName, territory: s.territory }; });
    return Object.values(m);
  }, [tbmSubmissions]);

  const filteredSubmissions = useMemo(() => {
    let f = tbmSubmissions;
    if (tbmFilter !== 'all') f = f.filter(s => s.tbmId === tbmFilter);
    if (categoryFilter !== 'all') f = f.filter(s => s.categoryId === categoryFilter);
    if (searchTerm.trim()) { const t = searchTerm.toLowerCase(); f = f.filter(s => s.productName?.toLowerCase().includes(t) || s.tbmName?.toLowerCase().includes(t)); }
    return f;
  }, [tbmSubmissions, tbmFilter, categoryFilter, searchTerm]);

  // ===== HANDLERS =====
  const handleApproveTBMSubmission = useCallback(async (submissionId) => {
    try {
      const sub = tbmSubmissions.find(s => s.id === submissionId);
      const corrections = {};
      editedCells.forEach(ck => { if (ck.startsWith(submissionId+'-')) { const m=ck.replace(submissionId+'-',''); const s=tbmSubmissions.find(x=>x.id===submissionId); if(s?.monthlyTargets?.[m]) corrections[m]={cyQty:s.monthlyTargets[m].cyQty}; }});
      await ABMApiService.approveTBMTarget(submissionId, Object.keys(corrections).length>0?corrections:null);
      setTbmSubmissions(prev => prev.map(s => s.id===submissionId?{...s,status:'approved'}:s));
      showToast('Approved', `${sub?.tbmName}'s target approved.`, 'success');
    } catch (e) { showToast('Error', 'Failed to approve.', 'error'); }
  }, [tbmSubmissions, editedCells, showToast]);

  const handleBulkApprove = useCallback(async () => {
    const ids = filteredSubmissions.filter(s => s.status==='submitted').map(s => s.id);
    if (!ids.length) { showToast('Info', 'Nothing to approve.', 'info'); return; }
    setModalConfig({ isOpen: true, title: 'Bulk Approve', message: `Approve all ${ids.length} pending?`, type: 'warning',
      onConfirm: async () => {
        try { await ABMApiService.bulkApproveTBM(ids); setTbmSubmissions(prev => prev.map(s => ids.includes(s.id)?{...s,status:'approved'}:s)); showToast('Done', `${ids.length} approved.`, 'success'); }
        catch(e) { showToast('Error', 'Failed.', 'error'); }
        setModalConfig(p => ({...p, isOpen: false}));
      }
    });
  }, [filteredSubmissions, showToast]);

  const handleEditTBMCell = useCallback((sid, month, val) => {
    const n = parseInt(val)||0;
    setTbmSubmissions(prev => prev.map(s => s.id===sid&&s.monthlyTargets?.[month]?{...s,monthlyTargets:{...s.monthlyTargets,[month]:{...s.monthlyTargets[month],cyQty:n}}}:s));
    setEditedCells(prev => new Set([...prev, `${sid}-${month}`]));
  }, []);

  const handleUpdateABMTarget = useCallback((pid, month, val) => {
    const n = parseInt(val)||0;
    setAbmTargets(prev => prev.map(t => t.id===pid&&t.monthlyTargets?.[month]?{...t,monthlyTargets:{...t.monthlyTargets,[month]:{...t.monthlyTargets[month],cyQty:n}}}:t));
  }, []);

  const handleSaveABMTargets = useCallback(async () => {
    try { await ABMApiService.saveABMTargets(abmTargets); showToast('Saved', 'Area targets saved.', 'success'); }
    catch(e) { showToast('Error', 'Failed to save.', 'error'); }
  }, [abmTargets, showToast]);

  const handleSubmitABMTargets = useCallback(async () => {
    setModalConfig({ isOpen: true, title: 'Submit Area Targets', message: 'Submit to ZBM for approval?', type: 'warning',
      onConfirm: async () => {
        try { await ABMApiService.submitABMTargets(abmTargets.map(t=>t.id)); setAbmTargets(prev=>prev.map(t=>({...t,status:'submitted'}))); showToast('Submitted', 'Sent to ZBM.', 'success'); }
        catch(e) { showToast('Error', 'Failed.', 'error'); }
        setModalConfig(p=>({...p,isOpen:false}));
      }
    });
  }, [abmTargets, showToast]);

  const handleRefresh = useCallback(async () => { showToast('Refreshing','...','info'); await loadInitialData(); showToast('Updated','Data refreshed.','success'); }, [showToast, loadInitialData]);
  const closeModal = useCallback(() => { setModalConfig(p=>({...p,isOpen:false})); }, []);
  const getQC = (i) => i<3?'q1':i<6?'q2':i<9?'q3':'q4';

  if (isLoading) return <div className="abm-dashboard"><div className="loading-overlay"><div className="loading-spinner"></div></div></div>;

  return (
    <div className="abm-dashboard">
      {!isOnline && <div className="offline-banner show"><i className="fas fa-wifi-slash"></i><span>You're offline.</span></div>}

      <Header user={user} onRefresh={handleRefresh} />

      {/* ===== 5-TAB NAVIGATION ===== */}
      <div className="abm-tabs">
        <button className={`abm-tab ${activeTab==='approvals'?'active':''}`} onClick={()=>setActiveTab('approvals')}>
          <i className="fas fa-user-check"></i><span>TBM Targets</span>
          {approvalStats.pending>0 && <span className="tab-badge pending">{approvalStats.pending}</span>}
        </button>
        <button className={`abm-tab ${activeTab==='overview'?'active':''}`} onClick={()=>setActiveTab('overview')}>
          <i className="fas fa-chart-pie"></i><span>Overview & Summary</span>
        </button>
        <button className={`abm-tab ${activeTab==='targets'?'active':''}`} onClick={()=>setActiveTab('targets')}>
          <i className="fas fa-bullseye"></i><span>Area Target</span>
        </button>
        <button className={`abm-tab ${activeTab==='yearlyTargets'?'active':''}`} onClick={()=>setActiveTab('yearlyTargets')}>
          <i className="fas fa-users-cog"></i><span>Team Yearly Targets</span>
        </button>
        <button className={`abm-tab ${activeTab==='drilldown'?'active':''}`} onClick={()=>setActiveTab('drilldown')}>
          <i className="fas fa-sitemap"></i><span>Team Drill-Down</span>
        </button>
      </div>

      <main className="main excel-main">

        {/* TAB 1: TBM TARGETS APPROVAL */}
        {activeTab==='approvals' && (<>
          <div className="abm-approval-stats">
            <div className="abm-stat-card"><i className="fas fa-inbox"></i><div><span className="abm-stat-value">{approvalStats.total}</span><span className="abm-stat-label">Total</span></div></div>
            <div className="abm-stat-card abm-stat-pending"><i className="fas fa-clock"></i><div><span className="abm-stat-value">{approvalStats.pending}</span><span className="abm-stat-label">Pending</span></div></div>
            <div className="abm-stat-card abm-stat-approved"><i className="fas fa-check-circle"></i><div><span className="abm-stat-value">{approvalStats.approved}</span><span className="abm-stat-label">Approved</span></div></div>
          </div>
          <div className="abm-approval-filters">
            <div className="abm-filter-group"><label>TBM:</label><select value={tbmFilter} onChange={e=>setTbmFilter(e.target.value)}><option value="all">All TBMs</option>{uniqueTBMs.map(t=><option key={t.id} value={t.id}>{t.name} — {t.territory}</option>)}</select></div>
            <div className="abm-filter-group"><label>Category:</label><select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}><option value="all">All</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div className="abm-filter-group abm-search-group"><i className="fas fa-search"></i><input type="text" placeholder="Search..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} /></div>
            {approvalStats.pending>0 && <button className="abm-bulk-approve-btn" onClick={handleBulkApprove}><i className="fas fa-check-double"></i> Approve All ({approvalStats.pending})</button>}
          </div>
          <div className="abm-approval-table-container">
            {filteredSubmissions.length===0 ? <div className="abm-empty-state"><i className="fas fa-check-circle"></i><p>No submissions.</p></div> : (
              <table className="abm-approval-table"><thead><tr>
                <th className="th-tbm">TBM</th><th className="th-territory">Territory</th><th className="th-product">Product</th><th className="th-category">Cat</th>
                {MONTHS.map((m,i)=><th key={m} className={`th-month th-${getQC(i)}`}>{MONTH_LABELS[i]}</th>)}
                <th className="th-total">Total</th><th className="th-growth">GR%</th><th className="th-actions">Action</th>
              </tr></thead><tbody>
                {filteredSubmissions.map(sub => {
                  const isSub = sub.status==='submitted';
                  let ly=0,cy=0; MONTHS.forEach(m=>{ly+=sub.monthlyTargets?.[m]?.lyQty||0;cy+=sub.monthlyTargets?.[m]?.cyQty||0;});
                  const g=Utils.calcGrowth(ly,cy);
                  return (<tr key={sub.id} className={`abm-submission-row ${sub.status}`}>
                    <td className="td-tbm"><div className="abm-tbm-cell-info"><span className="abm-tbm-avatar">{sub.tbmName.split(' ').map(n=>n[0]).join('').substring(0,2)}</span><span>{sub.tbmName}</span></div></td>
                    <td className="td-territory">{sub.territory}</td><td className="td-product">{sub.productName}</td>
                    <td className="td-category"><span className={`abm-cat-badge abm-cat-${sub.categoryId}`}>{sub.categoryId.toUpperCase()}</span></td>
                    {MONTHS.map((m,i)=>{const md=sub.monthlyTargets?.[m]||{};const ed=editedCells.has(`${sub.id}-${m}`); return (
                      <td key={m} className={`td-month td-${getQC(i)} ${isSub?'td-editable':''} ${ed?'td-edited':''}`} contentEditable={isSub} suppressContentEditableWarning onBlur={e=>{if(isSub)handleEditTBMCell(sub.id,m,e.target.textContent);}}>{Utils.formatNumber(md.cyQty||0)}</td>
                    );})}
                    <td className="td-total"><strong>{Utils.formatNumber(cy)}</strong></td>
                    <td className="td-growth"><span className={g>=0?'growth-positive':'growth-negative'}>{g>=0?'↑':'↓'}{Utils.formatGrowth(g)}</span></td>
                    <td className="td-actions">{isSub?<div className="action-buttons"><button className="action-btn-sm approve" onClick={()=>handleApproveTBMSubmission(sub.id)}><i className="fas fa-check"></i></button></div>:<span className="status-tag approved"><i className="fas fa-check-circle"></i> Approved</span>}</td>
                  </tr>);
                })}
              </tbody></table>
            )}
          </div>
        </>)}

        {/* TAB 2: OVERVIEW */}
        {activeTab==='overview' && <ABMOverviewStats abmTargets={abmTargets} categories={categories} tbmSubmissions={tbmSubmissions} approvalStats={approvalStats} />}

        {/* TAB 3: AREA TARGET — reuses Sales Rep TargetEntryGrid */}
        {activeTab==='targets' && <ABMAreaTargetGrid categories={categories} products={abmTargets} onUpdateTarget={handleUpdateABMTarget} onSaveAll={handleSaveABMTargets} onSubmitAll={handleSubmitABMTargets} fiscalYear="2026-27" overallYearlyTargetValue={null} areaName={user?.territory||'Delhi NCR Area'} />}

        {/* TAB 4: TEAM YEARLY TARGETS — Set targets for TBMs */}
        {activeTab==='yearlyTargets' && <TeamYearlyTargets role="ABM" fiscalYear="2026-27" teamMembers={uniqueTBMs} showToast={showToast} managerName={user?.name||''} />}

        {/* TAB 5: TEAM DRILL-DOWN — TBM → Sales Rep visibility */}
        {activeTab==='drilldown' && <ABMTeamDrilldown showToast={showToast} />}

      </main>

      <Modal isOpen={modalConfig.isOpen} title={modalConfig.title} message={modalConfig.message} type={modalConfig.type} onConfirm={modalConfig.onConfirm} onCancel={closeModal} />
      <div className="toast-container">{toasts.map(t=><Toast key={t.id} {...t} onClose={()=>setToasts(p=>p.filter(x=>x.id!==t.id))} />)}</div>
    </div>
  );
}

export default ABMDashboard;
