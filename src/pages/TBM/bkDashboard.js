/**
 * TBM Dashboard Component v2
 * Territory Business Manager Dashboard
 * 
 * FOUR tabs:
 * 1. Sales Rep Approvals — Review/correct/approve Sales Rep submissions (with pie chart)
 * 2. Overview & Summary — Territory-level KPIs
 * 3. Territory Target — Territory-level target entry grid
 * 4. Team Yearly Targets — Set yearly targets for Sales Reps
 * 
 * HIERARCHY: Sales Rep → TBM → ABM → ZBM → Sales Head
 * TBM reviews Sales Rep submissions, enters territory targets for ABM
 * 
 * CHANGES v2:
 * - Removed className="abm-approval-stats" from approvals tab
 * - Added SalesRepGrowthPieChart showing cumulative growth % per Sales Rep
 * - Reuses Sales Rep OverviewStats Recharts pie chart pattern
 * - Backend ready with documented API endpoints
 * 
 * @author Appasamy Associates - Product Commitment PWA
 * @version 2.1.0 — Sales Rep Growth Pie Chart + no abm-approval-stats
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { TBMApiService } from '../../services/tbmApi';
import { Utils } from '../../utils/helpers';
import Header from '../../components/common/Header';
import Toast from '../../components/common/Toast';
import Modal from '../../components/common/Modal';
import TBMOverviewStats from './components/TBMOverviewStats';
import TBMTargetEntryGrid from './components/TBMTargetEntryGrid';
import TBMTerritoryTargetGrid from './components/TBMTerritoryTargetGrid';
import TeamYearlyTargets from './components/TeamYearlyTargets';
import SalesRepGrowthPieChart from './components/SalesRepGrowthPieChart';
import '../../styles/tbm/tbmDashboard.css';

const MONTHS = ['apr','may','jun','jul','aug','sep','oct','nov','dec','jan','feb','mar'];
const MONTH_LABELS = ['APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC','JAN','FEB','MAR'];

function TBMDashboard() {
  const { user } = useAuth();

  // ==================== STATE ====================
  const [activeTab, setActiveTab] = useState('approvals');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [salesRepSubmissions, setSalesRepSubmissions] = useState([]);
  const [tbmTargets, setTbmTargets] = useState([]);
  const [repFilter, setRepFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [toasts, setToasts] = useState([]);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'warning', onConfirm: null });
  const [editedCells, setEditedCells] = useState(new Set());

  // ==================== TOAST ====================
  const showToast = useCallback((title, message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  // ==================== ONLINE/OFFLINE ====================
  useEffect(() => {
    const on = () => { setIsOnline(true); showToast('Online', 'Connection restored.', 'success'); };
    const off = () => { setIsOnline(false); showToast('Offline', 'Working offline.', 'warning'); };
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, [showToast]);

  // ==================== DATA LOADING ====================
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [cats, subs, targets] = await Promise.all([
        TBMApiService.getCategories(),
        TBMApiService.getSalesRepSubmissions(),
        TBMApiService.getTBMTargets()
      ]);
      setCategories(cats);
      setSalesRepSubmissions(subs);
      setTbmTargets(targets);
    } catch (error) {
      console.error('Failed to load TBM data:', error);
      showToast('Error', 'Failed to load dashboard data.', 'error');
    }
    setIsLoading(false);
  }, [showToast]);

  useEffect(() => { loadInitialData(); }, [loadInitialData]);

  // ==================== COMPUTED VALUES ====================
  const approvalStats = useMemo(() => {
    const total = salesRepSubmissions.length;
    const pending = salesRepSubmissions.filter(s => s.status === 'submitted').length;
    const approved = salesRepSubmissions.filter(s => s.status === 'approved').length;
    const rejected = salesRepSubmissions.filter(s => s.status === 'rejected').length;
    return { total, pending, approved, rejected };
  }, [salesRepSubmissions]);

  const uniqueSalesReps = useMemo(() => {
    const m = {};
    salesRepSubmissions.forEach(s => {
      const id = s.salesRepId;
      if (id && !m[id]) {
        m[id] = { id, name: s.salesRepName, territory: s.territory };
      }
    });
    return Object.values(m);
  }, [salesRepSubmissions]);

  const filteredSubmissions = useMemo(() => {
    let f = salesRepSubmissions;
    if (repFilter !== 'all') f = f.filter(s => String(s.salesRepId) === String(repFilter));
    if (categoryFilter !== 'all') f = f.filter(s => s.categoryId === categoryFilter);
    if (searchTerm.trim()) {
      const t = searchTerm.toLowerCase();
      f = f.filter(s =>
        s.name?.toLowerCase().includes(t) ||
        s.salesRepName?.toLowerCase().includes(t) ||
        s.code?.toLowerCase().includes(t)
      );
    }
    return f;
  }, [salesRepSubmissions, repFilter, categoryFilter, searchTerm]);

  // ==================== HANDLERS ====================
  const handleApproveSubmission = useCallback(async (submissionId) => {
    try {
      const sub = salesRepSubmissions.find(s => s.id === submissionId);
      const corrections = {};
      editedCells.forEach(ck => {
        if (ck.startsWith(submissionId + '-')) {
          const m = ck.replace(submissionId + '-', '');
          const s = salesRepSubmissions.find(x => x.id === submissionId);
          if (s?.monthlyTargets?.[m]) corrections[m] = { cyQty: s.monthlyTargets[m].cyQty };
        }
      });
      await TBMApiService.approveSalesRepTarget(submissionId, Object.keys(corrections).length > 0 ? corrections : null);
      setSalesRepSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, status: 'approved' } : s));
      showToast('Approved', `${sub?.salesRepName}'s target approved.`, 'success');
    } catch (e) {
      showToast('Error', 'Failed to approve.', 'error');
    }
  }, [salesRepSubmissions, editedCells, showToast]);

  const handleBulkApprove = useCallback(async () => {
    const ids = filteredSubmissions.filter(s => s.status === 'submitted').map(s => s.id);
    if (!ids.length) { showToast('Info', 'Nothing to approve.', 'info'); return; }
    setModalConfig({
      isOpen: true, title: 'Bulk Approve', message: `Approve all ${ids.length} pending submissions?`, type: 'warning',
      onConfirm: async () => {
        try {
          await TBMApiService.bulkApproveSalesRep(ids);
          setSalesRepSubmissions(prev => prev.map(s => ids.includes(s.id) ? { ...s, status: 'approved' } : s));
          showToast('Done', `${ids.length} approved.`, 'success');
        } catch (e) { showToast('Error', 'Failed.', 'error'); }
        setModalConfig(p => ({ ...p, isOpen: false }));
      }
    });
  }, [filteredSubmissions, showToast]);

  const handleEditCell = useCallback((sid, month, val) => {
    const n = parseInt(String(val).replace(/[^0-9]/g, ''), 10) || 0;
    setSalesRepSubmissions(prev => prev.map(s => {
      if (s.id !== sid || !s.monthlyTargets?.[month]) return s;
      return { ...s, monthlyTargets: { ...s.monthlyTargets, [month]: { ...s.monthlyTargets[month], cyQty: n } } };
    }));
    setEditedCells(prev => new Set([...prev, `${sid}-${month}`]));
  }, []);

  const handleUpdateTBMTarget = useCallback((pid, month, val) => {
    const n = parseInt(val) || 0;
    setTbmTargets(prev => prev.map(t => {
      if (t.id !== pid || !t.monthlyTargets?.[month]) return t;
      return { ...t, monthlyTargets: { ...t.monthlyTargets, [month]: { ...t.monthlyTargets[month], cyQty: n } } };
    }));
  }, []);

  const handleSaveTBMTargets = useCallback(async () => {
    try {
      await TBMApiService.saveTBMTargets(tbmTargets);
      showToast('Saved', 'Territory targets saved.', 'success');
    } catch (e) { showToast('Error', 'Failed to save.', 'error'); }
  }, [tbmTargets, showToast]);

  const handleSubmitTBMTargets = useCallback(async () => {
    setModalConfig({
      isOpen: true, title: 'Submit Territory Targets', message: 'Submit territory targets to ABM for approval?', type: 'warning',
      onConfirm: async () => {
        try {
          await TBMApiService.submitTBMTargets(tbmTargets.map(t => t.id));
          setTbmTargets(prev => prev.map(t => ({ ...t, status: 'submitted' })));
          showToast('Submitted', 'Sent to ABM.', 'success');
        } catch (e) { showToast('Error', 'Failed.', 'error'); }
        setModalConfig(p => ({ ...p, isOpen: false }));
      }
    });
  }, [tbmTargets, showToast]);

  const handleRefresh = useCallback(async () => {
    showToast('Refreshing', '...', 'info');
    await loadInitialData();
    showToast('Updated', 'Data refreshed.', 'success');
  }, [showToast, loadInitialData]);

  const closeModal = useCallback(() => { setModalConfig(p => ({ ...p, isOpen: false })); }, []);
  const getQC = (i) => i < 3 ? 'q1' : i < 6 ? 'q2' : i < 9 ? 'q3' : 'q4';

  // ==================== LOADING ====================
  if (isLoading) {
    return (
      <div className="tbm-dashboard">
        <div className="loading-overlay"><div className="loading-spinner"></div></div>
      </div>
    );
  }

  // ==================== RENDER ====================
  return (
    <div className="tbm-dashboard">
      {!isOnline && <div className="offline-banner show"><i className="fas fa-wifi-slash"></i><span>You're offline.</span></div>}

      <Header user={user} onRefresh={handleRefresh} />

      {/* ==================== TAB NAVIGATION ==================== */}
      <div className="abm-tabs">
        <button className={`abm-tab ${activeTab === 'approvals' ? 'active' : ''}`} onClick={() => setActiveTab('approvals')}>
          <i className="fas fa-user-check"></i><span>Sales Rep Targets</span>
          {approvalStats.pending > 0 && <span className="tab-badge pending">{approvalStats.pending}</span>}
        </button>
        <button className={`abm-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          <i className="fas fa-chart-pie"></i><span>Overview & Summary</span>
        </button>
        <button className={`abm-tab ${activeTab === 'targets' ? 'active' : ''}`} onClick={() => setActiveTab('targets')}>
          <i className="fas fa-bullseye"></i><span>Territory Target</span>
        </button>
       
        <button className={`abm-tab ${activeTab === 'yearlyTargets' ? 'active' : ''}`} onClick={() => setActiveTab('yearlyTargets')}>
          <i className="fas fa-users-cog"></i><span>Team Yearly Targets</span>
        </button>
      </div>

      <main className="main excel-main">

        {/* ==================== TAB 1: SALES REP APPROVALS ==================== */}
        {activeTab === 'approvals' && (
          <>
            {/* ★ NEW — Sales Rep Growth Pie Chart (replaces abm-approval-stats) */}
            <SalesRepGrowthPieChart
              salesRepSubmissions={salesRepSubmissions}
              approvalStats={approvalStats}
            />

            {/* Filters */}
            <div className="abm-approval-filters">
              <div className="abm-filter-group">
                <label>Sales Rep:</label>
                <select value={repFilter} onChange={e => setRepFilter(e.target.value)}>
                  <option value="all">All Sales Reps</option>
                  {uniqueSalesReps.map(r => (
                    <option key={r.id} value={r.id}>{r.name} — {r.territory}</option>
                  ))}
                </select>
              </div>
              <div className="abm-filter-group">
                <label>Category:</label>
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                  <option value="all">All</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="abm-filter-group abm-search-group">
                <i className="fas fa-search"></i>
                <input type="text" placeholder="Search products or reps..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              {approvalStats.pending > 0 && (
                <button className="abm-bulk-approve-btn" onClick={handleBulkApprove}>
                  <i className="fas fa-check-double"></i> Approve All ({approvalStats.pending})
                </button>
              )}
            </div>

            {/* Approval Table */}
            <div className="abm-approval-table-container">
              {filteredSubmissions.length === 0 ? (
                <div className="abm-empty-state">
                  <i className="fas fa-check-circle"></i>
                  <p>No submissions to review.</p>
                </div>
              ) : (
                <table className="abm-approval-table">
                  <thead>
                    <tr>
                      <th className="th-tbm">Sales Rep</th>
                      <th className="th-territory">Territory</th>
                      <th className="th-product">Product</th>
                      <th className="th-category">Cat</th>
                      {MONTHS.map((m, i) => (
                        <th key={m} className={`th-month th-${getQC(i)}`}>{MONTH_LABELS[i]}</th>
                      ))}
                      <th className="th-total">Total</th>
                      <th className="th-growth">GR%</th>
                      <th className="th-actions">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmissions.map(sub => {
                      const isSub = sub.status === 'submitted';
                      let ly = 0, cy = 0;
                      MONTHS.forEach(m => {
                        ly += sub.monthlyTargets?.[m]?.lyQty || 0;
                        cy += sub.monthlyTargets?.[m]?.cyQty || 0;
                      });
                      const g = Utils.calcGrowth(ly, cy);

                      return (
                        <tr key={sub.id} className={`abm-submission-row ${sub.status}`}>
                          <td className="td-tbm">
                            <div className="abm-tbm-cell-info">
                              <span className="abm-tbm-avatar">
                                {(sub.salesRepName || '').split(' ').map(n => n[0]).join('').substring(0, 2)}
                              </span>
                              <span>{sub.salesRepName}</span>
                            </div>
                          </td>
                          <td className="td-territory">{sub.territory}</td>
                          <td className="td-product">{sub.name}</td>
                          <td className="td-category">
                            <span className={`abm-cat-badge abm-cat-${sub.categoryId}`}>{sub.categoryId.toUpperCase()}</span>
                          </td>
                          {MONTHS.map((m, i) => {
                            const md = sub.monthlyTargets?.[m] || {};
                            const ed = editedCells.has(`${sub.id}-${m}`);
                            return (
                              <td
                                key={m}
                                className={`td-month td-${getQC(i)} ${isSub ? 'td-editable' : ''} ${ed ? 'td-edited' : ''}`}
                                contentEditable={isSub}
                                suppressContentEditableWarning
                                onBlur={e => { if (isSub) handleEditCell(sub.id, m, e.target.textContent); }}
                              >
                                {Utils.formatNumber(md.cyQty || 0)}
                              </td>
                            );
                          })}
                          <td className="td-total"><strong>{Utils.formatNumber(cy)}</strong></td>
                          <td className="td-growth">
                            <span className={g >= 0 ? 'growth-positive' : 'growth-negative'}>
                              {g >= 0 ? '↑' : '↓'}{Utils.formatGrowth(g)}
                            </span>
                          </td>
                          <td className="td-actions">
                            {isSub ? (
                              <div className="action-buttons">
                                <button className="action-btn-sm approve" onClick={() => handleApproveSubmission(sub.id)}>
                                  <i className="fas fa-check"></i>
                                </button>
                              </div>
                            ) : (
                              <span className="status-tag approved">
                                <i className="fas fa-check-circle"></i> Approved
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* ==================== TAB 2: OVERVIEW ==================== */}
        {activeTab === 'overview' && (
          <TBMOverviewStats
            tbmTargets={tbmTargets}
            categories={categories}
            salesRepSubmissions={salesRepSubmissions}
            approvalStats={approvalStats}
          />
        )}

        {/* ==================== TAB 3: TERRITORY TARGET ==================== */}
        {activeTab === 'targets' && (
          <TBMTerritoryTargetGrid
            categories={categories}
            products={tbmTargets}
            onUpdateTarget={handleUpdateTBMTarget}
            onSaveAll={handleSaveTBMTargets}
            onSubmitAll={handleSubmitTBMTargets}
            fiscalYear="2026-27"
            overallYearlyTargetValue={null}
            territoryName={user?.territory || 'South Chennai Territory'}
          />
        )}

        {/* ==================== TAB 4: TEAM YEARLY TARGETS ==================== */}
        {activeTab === 'yearlyTargets' && (
          <TeamYearlyTargets
            role="TBM"
            fiscalYear="2026-27"
            teamMembers={uniqueSalesReps}
            showToast={showToast}
            managerName={user?.name || ''}
          />
        )}

      </main>

      <Modal isOpen={modalConfig.isOpen} title={modalConfig.title} message={modalConfig.message} type={modalConfig.type} onConfirm={modalConfig.onConfirm} onCancel={closeModal} />
      <div className="toast-container">
        {toasts.map(t => (
          <Toast key={t.id} {...t} onClose={() => setToasts(p => p.filter(x => x.id !== t.id))} />
        ))}
      </div>
    </div>
  );
}

export default TBMDashboard;
