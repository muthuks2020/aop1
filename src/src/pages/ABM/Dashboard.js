/**
 * ABM Dashboard Component
 * Area Business Manager Dashboard
 * 
 * FOUR tabs (mirrors TBM structure):
 * 1. TBM Targets — Review/correct/approve TBM territory submissions
 * 2. Overview & Summary — Area-level KPIs
 * 3. Area Target — Area-level target entry grid (same as Sales Rep grid)
 * 4. Team Yearly Targets — Set yearly targets for all TBMs
 * 
 * HIERARCHY: Sales Rep → TBM → ABM → ZBM → Sales Head
 * 
 * @author Appasamy Associates - Product Commitment PWA
 * @version 1.0.0
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
import TeamYearlyTargets from '../TBM/components/TeamYearlyTargets';
import '../../styles/abm/abmDashboard.css';

const MONTHS = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];
const MONTH_LABELS = ['APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR'];

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

  // ==================== TOAST ====================
  const showToast = useCallback((title, message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  // ==================== ONLINE/OFFLINE ====================
  useEffect(() => {
    const onOn = () => { setIsOnline(true); showToast('Online', 'Connection restored.', 'success'); };
    const onOff = () => { setIsOnline(false); showToast('Offline', 'Working in offline mode.', 'warning'); };
    window.addEventListener('online', onOn);
    window.addEventListener('offline', onOff);
    return () => { window.removeEventListener('online', onOn); window.removeEventListener('offline', onOff); };
  }, [showToast]);

  // ==================== DATA LOADING ====================
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [cats, tbmSubs, areaTargets] = await Promise.all([
        ABMApiService.getCategories(),
        ABMApiService.getTBMSubmissions(),
        ABMApiService.getABMTargets()
      ]);
      setCategories(cats);
      setTbmSubmissions(tbmSubs);
      setAbmTargets(areaTargets);
    } catch (error) {
      console.error('Failed to load ABM data:', error);
      showToast('Error', 'Failed to load dashboard data.', 'error');
    }
    setIsLoading(false);
  }, [showToast]);

  useEffect(() => { loadInitialData(); }, [loadInitialData]);

  // ==================== COMPUTED VALUES ====================
  const approvalStats = useMemo(() => {
    const total = tbmSubmissions.length;
    const pending = tbmSubmissions.filter(s => s.status === 'submitted').length;
    const approved = tbmSubmissions.filter(s => s.status === 'approved').length;
    return { total, pending, approved };
  }, [tbmSubmissions]);

  const uniqueTBMs = useMemo(() => {
    const tbmMap = {};
    tbmSubmissions.forEach(s => {
      if (!tbmMap[s.tbmId]) tbmMap[s.tbmId] = { id: s.tbmId, name: s.tbmName, territory: s.territory };
    });
    return Object.values(tbmMap);
  }, [tbmSubmissions]);

  const filteredSubmissions = useMemo(() => {
    let filtered = tbmSubmissions;
    if (tbmFilter !== 'all') filtered = filtered.filter(s => s.tbmId === tbmFilter);
    if (categoryFilter !== 'all') filtered = filtered.filter(s => s.categoryId === categoryFilter);
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => s.productName?.toLowerCase().includes(term) || s.tbmName?.toLowerCase().includes(term));
    }
    return filtered;
  }, [tbmSubmissions, tbmFilter, categoryFilter, searchTerm]);

  // ==================== APPROVAL HANDLERS ====================
  const handleApproveTBMSubmission = useCallback(async (submissionId) => {
    try {
      const sub = tbmSubmissions.find(s => s.id === submissionId);
      const corrections = {};
      editedCells.forEach(cellKey => {
        if (cellKey.startsWith(submissionId + '-')) {
          const month = cellKey.replace(submissionId + '-', '');
          const s = tbmSubmissions.find(x => x.id === submissionId);
          if (s?.monthlyTargets?.[month]) corrections[month] = { cyQty: s.monthlyTargets[month].cyQty };
        }
      });
      await ABMApiService.approveTBMTarget(submissionId, Object.keys(corrections).length > 0 ? corrections : null);
      setTbmSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, status: 'approved', approvedDate: new Date().toISOString() } : s));
      showToast('Approved', `${sub?.tbmName}'s target approved.`, 'success');
    } catch (error) {
      showToast('Error', 'Failed to approve target.', 'error');
    }
  }, [tbmSubmissions, editedCells, showToast]);

  const handleBulkApprove = useCallback(async () => {
    const pendingIds = filteredSubmissions.filter(s => s.status === 'submitted').map(s => s.id);
    if (pendingIds.length === 0) { showToast('Info', 'No pending submissions.', 'info'); return; }
    setModalConfig({
      isOpen: true, title: 'Bulk Approve TBM Targets',
      message: `Approve all ${pendingIds.length} pending TBM submissions?`, type: 'warning',
      onConfirm: async () => {
        try {
          await ABMApiService.bulkApproveTBM(pendingIds);
          setTbmSubmissions(prev => prev.map(s => pendingIds.includes(s.id) ? { ...s, status: 'approved' } : s));
          showToast('Approved', `${pendingIds.length} TBM targets approved.`, 'success');
        } catch (error) { showToast('Error', 'Failed to bulk approve.', 'error'); }
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  }, [filteredSubmissions, showToast]);

  const handleEditTBMCell = useCallback((submissionId, month, value) => {
    const numValue = parseInt(value) || 0;
    setTbmSubmissions(prev => prev.map(s => {
      if (s.id === submissionId && s.monthlyTargets?.[month]) {
        return { ...s, monthlyTargets: { ...s.monthlyTargets, [month]: { ...s.monthlyTargets[month], cyQty: numValue } } };
      }
      return s;
    }));
    setEditedCells(prev => new Set([...prev, `${submissionId}-${month}`]));
  }, []);

  // ==================== ABM AREA TARGET HANDLERS ====================
  const handleUpdateABMTarget = useCallback((productId, month, value) => {
    const numValue = parseInt(value) || 0;
    setAbmTargets(prev => prev.map(t => {
      if (t.id === productId && t.monthlyTargets?.[month]) {
        return { ...t, monthlyTargets: { ...t.monthlyTargets, [month]: { ...t.monthlyTargets[month], cyQty: numValue } } };
      }
      return t;
    }));
  }, []);

  const handleSaveABMTargets = useCallback(async () => {
    try { await ABMApiService.saveABMTargets(abmTargets); showToast('Saved', 'Area targets saved.', 'success'); }
    catch (error) { showToast('Error', 'Failed to save targets.', 'error'); }
  }, [abmTargets, showToast]);

  const handleSubmitABMTargets = useCallback(async () => {
    setModalConfig({
      isOpen: true, title: 'Submit Area Targets', message: 'Submit all area targets to ZBM for approval?', type: 'warning',
      onConfirm: async () => {
        try {
          await ABMApiService.submitABMTargets(abmTargets.map(t => t.id));
          setAbmTargets(prev => prev.map(t => ({ ...t, status: 'submitted' })));
          showToast('Submitted', 'Area targets submitted to ZBM.', 'success');
        } catch (error) { showToast('Error', 'Failed to submit targets.', 'error'); }
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  }, [abmTargets, showToast]);

  // ==================== MISC ====================
  const handleRefresh = useCallback(async () => {
    showToast('Refreshing', 'Updating...', 'info');
    await loadInitialData();
    showToast('Updated', 'Data refreshed.', 'success');
  }, [showToast, loadInitialData]);

  const closeModal = useCallback(() => { setModalConfig(prev => ({ ...prev, isOpen: false })); }, []);
  const getQuarterClass = (idx) => idx < 3 ? 'q1' : idx < 6 ? 'q2' : idx < 9 ? 'q3' : 'q4';

  // ==================== LOADING ====================
  if (isLoading) {
    return (<div className="abm-dashboard"><div className="loading-overlay"><div className="loading-spinner"></div></div></div>);
  }

  // ==================== RENDER ====================
  return (
    <div className="abm-dashboard">
      {!isOnline && (<div className="offline-banner show"><i className="fas fa-wifi-slash"></i><span>You're offline.</span></div>)}

      <Header user={user} onRefresh={handleRefresh}
        completionPercent={Math.round((approvalStats.approved / approvalStats.total) * 100) || 0}
        submittedCount={approvalStats.pending} totalCount={approvalStats.total}
        approvedCount={approvalStats.approved} pendingCount={approvalStats.pending}
      />

      {/* ==================== 4-TAB NAVIGATION ==================== */}
      <div className="abm-tabs">
        <button className={`abm-tab ${activeTab === 'approvals' ? 'active' : ''}`} onClick={() => setActiveTab('approvals')}>
          <i className="fas fa-user-check"></i><span>TBM Targets</span>
          {approvalStats.pending > 0 && <span className="tab-badge pending">{approvalStats.pending}</span>}
        </button>
        <button className={`abm-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          <i className="fas fa-chart-pie"></i><span>Overview & Summary</span>
        </button>
        <button className={`abm-tab ${activeTab === 'targets' ? 'active' : ''}`} onClick={() => setActiveTab('targets')}>
          <i className="fas fa-bullseye"></i><span>Area Target</span>
        </button>
        <button className={`abm-tab ${activeTab === 'yearlyTargets' ? 'active' : ''}`} onClick={() => setActiveTab('yearlyTargets')}>
          <i className="fas fa-users-cog"></i><span>Team Yearly Targets</span>
        </button>
      </div>

      <main className="main excel-main">
        {/* ==================== TAB 1: TBM TARGETS APPROVAL ==================== */}
        {activeTab === 'approvals' && (
          <>
            <div className="abm-approval-stats">
              <div className="abm-stat-card"><i className="fas fa-inbox"></i><div><span className="abm-stat-value">{approvalStats.total}</span><span className="abm-stat-label">Total</span></div></div>
              <div className="abm-stat-card abm-stat-pending"><i className="fas fa-clock"></i><div><span className="abm-stat-value">{approvalStats.pending}</span><span className="abm-stat-label">Pending</span></div></div>
              <div className="abm-stat-card abm-stat-approved"><i className="fas fa-check-circle"></i><div><span className="abm-stat-value">{approvalStats.approved}</span><span className="abm-stat-label">Approved</span></div></div>
            </div>

            <div className="abm-approval-filters">
              <div className="abm-filter-group">
                <label>TBM:</label>
                <select value={tbmFilter} onChange={(e) => setTbmFilter(e.target.value)}>
                  <option value="all">All TBMs</option>
                  {uniqueTBMs.map(tbm => (<option key={tbm.id} value={tbm.id}>{tbm.name} — {tbm.territory}</option>))}
                </select>
              </div>
              <div className="abm-filter-group">
                <label>Category:</label>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                  <option value="all">All Categories</option>
                  {categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                </select>
              </div>
              <div className="abm-filter-group abm-search-group">
                <i className="fas fa-search"></i>
                <input type="text" placeholder="Search products or TBMs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              {approvalStats.pending > 0 && (
                <button className="abm-bulk-approve-btn" onClick={handleBulkApprove}>
                  <i className="fas fa-check-double"></i> Approve All ({approvalStats.pending})
                </button>
              )}
            </div>

            <div className="abm-approval-table-container">
              {filteredSubmissions.length === 0 ? (
                <div className="abm-empty-state"><i className="fas fa-check-circle"></i><p>No submissions to review.</p></div>
              ) : (
                <table className="abm-approval-table">
                  <thead>
                    <tr>
                      <th className="th-tbm">TBM</th>
                      <th className="th-territory">Territory</th>
                      <th className="th-product">Product</th>
                      <th className="th-category">Category</th>
                      {MONTHS.map((month, idx) => (<th key={month} className={`th-month th-${getQuarterClass(idx)}`}>{MONTH_LABELS[idx]}</th>))}
                      <th className="th-total">Total</th>
                      <th className="th-growth">GR%</th>
                      <th className="th-actions">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmissions.map(sub => {
                      const isSubmitted = sub.status === 'submitted';
                      let lyTotal = 0, cyTotal = 0;
                      MONTHS.forEach(m => { lyTotal += sub.monthlyTargets?.[m]?.lyQty || 0; cyTotal += sub.monthlyTargets?.[m]?.cyQty || 0; });
                      const growth = Utils.calcGrowth(lyTotal, cyTotal);
                      return (
                        <tr key={sub.id} className={`abm-submission-row ${sub.status}`}>
                          <td className="td-tbm">
                            <div className="abm-tbm-cell-info">
                              <span className="abm-tbm-avatar">{sub.tbmName.split(' ').map(n => n[0]).join('').substring(0, 2)}</span>
                              <span>{sub.tbmName}</span>
                            </div>
                          </td>
                          <td className="td-territory">{sub.territory}</td>
                          <td className="td-product">{sub.productName}</td>
                          <td className="td-category"><span className={`abm-cat-badge abm-cat-${sub.categoryId}`}>{sub.categoryId}</span></td>
                          {MONTHS.map((month, idx) => {
                            const val = sub.monthlyTargets?.[month]?.cyQty || 0;
                            const isEdited = editedCells.has(`${sub.id}-${month}`);
                            return (
                              <td key={month} className={`td-month td-${getQuarterClass(idx)} ${isSubmitted ? 'td-editable' : ''} ${isEdited ? 'td-edited' : ''}`}
                                contentEditable={isSubmitted} suppressContentEditableWarning
                                onBlur={(e) => { if (isSubmitted) handleEditTBMCell(sub.id, month, e.target.textContent); }}
                              >
                                {Utils.formatNumber(val)}
                              </td>
                            );
                          })}
                          <td className="td-total">{Utils.formatNumber(cyTotal)}</td>
                          <td className="td-growth">
                            <span className={growth >= 0 ? 'growth-positive' : 'growth-negative'}>
                              {growth >= 0 ? '↑' : '↓'}{Utils.formatGrowth(growth)}
                            </span>
                          </td>
                          <td className="td-actions">
                            {isSubmitted ? (
                              <button className="action-btn-sm approve" onClick={() => handleApproveTBMSubmission(sub.id)} title="Approve">
                                <i className="fas fa-check"></i>
                              </button>
                            ) : (
                              <span className="status-tag approved"><i className="fas fa-check-circle"></i> Approved</span>
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

        {/* ==================== TAB 2: OVERVIEW & SUMMARY ==================== */}
        {activeTab === 'overview' && (
          <ABMOverviewStats abmTargets={abmTargets} categories={categories} tbmSubmissions={tbmSubmissions} approvalStats={approvalStats} />
        )}

        {/* ==================== TAB 3: AREA TARGET ==================== */}
        {activeTab === 'targets' && (
          <ABMAreaTargetGrid
            categories={categories}
            products={abmTargets}
            onUpdateTarget={(productId, month, value) => handleUpdateABMTarget(productId, month, value)}
            onSaveAll={handleSaveABMTargets}
            onSubmitAll={handleSubmitABMTargets}
            fiscalYear="2026-27"
            overallYearlyTargetValue={null}
            areaName={user?.territory || 'Delhi NCR Area'}
          />
        )}

        {/* ==================== TAB 4: TEAM YEARLY TARGETS ==================== */}
        {activeTab === 'yearlyTargets' && (
          <TeamYearlyTargets
            role="ABM"
            fiscalYear="2026-27"
            teamMembers={uniqueTBMs}
            showToast={showToast}
            managerName={user?.name || ''}
          />
        )}
      </main>

      <Modal isOpen={modalConfig.isOpen} title={modalConfig.title} message={modalConfig.message}
        type={modalConfig.type} onConfirm={modalConfig.onConfirm} onCancel={closeModal} />

      <div className="toast-container">
        {toasts.map(toast => (<Toast key={toast.id} {...toast} onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} />))}
      </div>
    </div>
  );
}

export default ABMDashboard;
