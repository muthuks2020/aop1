/**
 * TBM Dashboard Component - Enhanced Version with Individual Target
 * @version 4.0.0 - Added "My Target" tab for TBM individual targets
 * 
 * FOUR tabs:
 * 1. Sales Rep Approvals — Review/approve/reject sales rep submissions (unchanged)
 * 2. Overview & Summary — Territory-level KPIs mirroring Sales Rep dashboard
 * 3. My Target — TBM's own individual/personal target entry grid  ★ NEW
 * 4. Territory Target — Territory target entry grid with Overall Target Bar
 * 
 * RATIONALE:
 * TBM is both a territory manager AND an employee with personal sales targets.
 * The ABM needs to track TBM individually, so we split:
 *   - "My Target" = TBM's personal commitment (what TBM personally sells)
 *   - "Territory Target" = full territory commitment (what the team delivers)
 *
 * Sales Rep screens are FROZEN — no changes made to those files.
 * Backend API integration planned — all mock data toggleable via USE_MOCK flag.
 * 
 * @author Appasamy Associates - Product Commitment PWA
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
import TBMIndividualTargetGrid from './components/TBMIndividualTargetGrid';
import '../../styles/tbm/tbmDashboard.css';
import '../../styles/tbm/tbmApprovalTableFix.css';

const MONTHS = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];
const MONTH_LABELS = ['APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR'];

// ==================== OVERALL YEARLY TARGET ====================
// Fixed yearly target for the TBM territory.
// In production, fetch from API: GET /api/v1/tbm/yearly-target
const TBM_OVERALL_YEARLY_TARGET_QTY = 50000;

// Fixed yearly target for TBM's individual commitment
// In production, fetch from API: GET /api/v1/tbm/individual-yearly-target
const TBM_INDIVIDUAL_YEARLY_TARGET_QTY = 10000;

function TBMDashboard() {
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('approvals');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [salesRepSubmissions, setSalesRepSubmissions] = useState([]);
  const [tbmTargets, setTbmTargets] = useState([]);
  const [tbmIndividualTargets, setTbmIndividualTargets] = useState([]); // ★ NEW
  const [dashboardStats, setDashboardStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState('submitted');
  const [salesRepFilter, setSalesRepFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [toasts, setToasts] = useState([]);
  const [modalConfig, setModalConfig] = useState({ isOpen: false });
  const [rejectionModal, setRejectionModal] = useState({ isOpen: false, submissionId: null, productName: '' });
  const [rejectionReason, setRejectionReason] = useState('');
  const [uniqueSalesReps, setUniqueSalesReps] = useState([]);

  // ==================== DATA LOADING ====================

  useEffect(() => { loadInitialData(); }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [cats, submissions, targets, individualTargets, stats, reps] = await Promise.all([
        TBMApiService.getCategories(),
        TBMApiService.getSalesRepSubmissions(),
        TBMApiService.getTBMTargets(),
        TBMApiService.getTBMIndividualTargets(),  // ★ NEW
        TBMApiService.getDashboardStats(),
        TBMApiService.getUniqueSalesReps()
      ]);
      setCategories(cats);
      setSalesRepSubmissions(submissions);
      setTbmTargets(targets);
      setTbmIndividualTargets(individualTargets); // ★ NEW
      setDashboardStats(stats);
      setUniqueSalesReps(reps);
    } catch (error) {
      showToast('Error', 'Failed to load data.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== ONLINE/OFFLINE ====================

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); showToast('Online', 'Connection restored', 'success'); };
    const handleOffline = () => { setIsOnline(false); showToast('Offline', 'You are offline.', 'warning'); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  // ==================== TOAST HELPERS ====================

  const showToast = useCallback((title, message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  // ==================== COMPUTED STATS ====================

  const filteredSubmissions = useMemo(() => {
    let filtered = salesRepSubmissions;
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }
    if (salesRepFilter !== 'all') {
      filtered = filtered.filter(s => s.salesRepId === parseInt(salesRepFilter));
    }
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(s => s.categoryId === categoryFilter);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(term) ||
        s.code.toLowerCase().includes(term) ||
        s.salesRepName.toLowerCase().includes(term)
      );
    }
    return filtered;
  }, [salesRepSubmissions, statusFilter, salesRepFilter, categoryFilter, searchTerm]);

  const pendingCount = useMemo(() =>
    salesRepSubmissions.filter(s => s.status === 'submitted').length,
    [salesRepSubmissions]
  );

  const approvalStats = useMemo(() => ({
    pending: salesRepSubmissions.filter(s => s.status === 'submitted').length,
    approved: salesRepSubmissions.filter(s => s.status === 'approved').length,
    rejected: salesRepSubmissions.filter(s => s.status === 'rejected').length,
    total: salesRepSubmissions.length
  }), [salesRepSubmissions]);

  const tbmTargetStats = useMemo(() => ({
    draft: tbmTargets.filter(t => t.status === 'draft').length,
    submitted: tbmTargets.filter(t => t.status === 'submitted').length,
    approved: tbmTargets.filter(t => t.status === 'approved').length,
    rejected: tbmTargets.filter(t => t.status === 'rejected').length,
    total: tbmTargets.length
  }), [tbmTargets]);

  // ★ NEW — Individual target stats
  const tbmIndividualTargetStats = useMemo(() => ({
    draft: tbmIndividualTargets.filter(t => t.status === 'draft').length,
    submitted: tbmIndividualTargets.filter(t => t.status === 'submitted').length,
    approved: tbmIndividualTargets.filter(t => t.status === 'approved').length,
    rejected: tbmIndividualTargets.filter(t => t.status === 'rejected').length,
    total: tbmIndividualTargets.length
  }), [tbmIndividualTargets]);

  // ==================== APPROVAL HANDLERS ====================

  const handleApproveSubmission = useCallback(async (submissionId) => {
    const submission = salesRepSubmissions.find(s => s.id === submissionId);
    if (!submission) return;
    setModalConfig({
      isOpen: true, title: 'Approve Target',
      message: `Approve "${submission.name}" from ${submission.salesRepName}?`,
      type: 'success',
      onConfirm: async () => {
        try {
          await TBMApiService.approveSalesRepTarget(submissionId);
          setSalesRepSubmissions(prev => prev.map(s => s.id === submissionId ? 
            { ...s, status: 'approved', approvedDate: new Date().toISOString(), approvedBy: user.name } : s));
          showToast('Approved', `Target approved.`, 'success');
        } catch (error) { showToast('Error', 'Failed to approve.', 'error'); }
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  }, [salesRepSubmissions, user, showToast]);

  const handleOpenRejectionModal = useCallback((submissionId) => {
    const submission = salesRepSubmissions.find(s => s.id === submissionId);
    if (!submission) return;
    setRejectionModal({ isOpen: true, submissionId, productName: submission.name, salesRepName: submission.salesRepName });
    setRejectionReason('');
  }, [salesRepSubmissions]);

  const handleRejectSubmission = useCallback(async () => {
    if (!rejectionReason.trim()) { showToast('Error', 'Please provide a reason.', 'error'); return; }
    try {
      await TBMApiService.rejectSalesRepTarget(rejectionModal.submissionId, rejectionReason);
      setSalesRepSubmissions(prev => prev.map(s => s.id === rejectionModal.submissionId ? 
        { ...s, status: 'rejected', rejectedDate: new Date().toISOString(), rejectedBy: user.name, rejectionReason } : s));
      showToast('Rejected', `Target rejected.`, 'info');
      setRejectionModal({ isOpen: false, submissionId: null, productName: '' });
      setRejectionReason('');
    } catch (error) { showToast('Error', 'Failed to reject.', 'error'); }
  }, [rejectionModal, rejectionReason, user, showToast]);

  const handleBulkApprove = useCallback(async () => {
    const pending = filteredSubmissions.filter(s => s.status === 'submitted');
    if (pending.length === 0) { showToast('Info', 'No pending submissions.', 'info'); return; }
    setModalConfig({
      isOpen: true, title: 'Approve All',
      message: `Approve all ${pending.length} pending submissions?`,
      type: 'warning',
      onConfirm: async () => {
        try {
          const ids = pending.map(s => s.id);
          await TBMApiService.bulkApproveSalesRepTargets(ids);
          setSalesRepSubmissions(prev => prev.map(s => ids.includes(s.id) ? 
            { ...s, status: 'approved', approvedDate: new Date().toISOString(), approvedBy: user.name } : s));
          showToast('Approved', `${pending.length} approved.`, 'success');
        } catch (error) { showToast('Error', 'Failed.', 'error'); }
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  }, [filteredSubmissions, user, showToast]);

  // ==================== TBM TERRITORY TARGET HANDLERS ====================

  const handleUpdateTBMTarget = useCallback(async (targetId, month, values) => {
    try {
      await TBMApiService.updateTBMTarget(targetId, month, values);
      setTbmTargets(prev => prev.map(t => {
        if (t.id === targetId) {
          return { 
            ...t, 
            monthlyTargets: { ...t.monthlyTargets, [month]: { ...t.monthlyTargets?.[month], ...values } }, 
            status: t.status === 'rejected' ? 'draft' : t.status 
          };
        }
        return t;
      }));
    } catch (error) { showToast('Error', 'Failed to update.', 'error'); }
  }, [showToast]);

  const handleSaveTBMTargets = useCallback(async () => {
    try {
      await TBMApiService.saveTBMTargets(tbmTargets.filter(t => t.status === 'draft' || t.status === 'rejected'));
      showToast('Saved', 'Territory targets saved as draft.', 'success');
    } catch (error) { showToast('Error', 'Failed to save.', 'error'); }
  }, [tbmTargets, showToast]);

  const handleSubmitTBMTargets = useCallback(async () => {
    const submittable = tbmTargets.filter(t => t.status === 'draft' || t.status === 'rejected');
    if (submittable.length === 0) { showToast('Info', 'No targets to submit.', 'info'); return; }
    setModalConfig({
      isOpen: true, title: 'Submit Territory Targets',
      message: `Submit ${submittable.length} territory targets to ABM for approval?`,
      type: 'warning',
      onConfirm: async () => {
        try {
          await TBMApiService.submitTBMTargets(submittable.map(t => t.id));
          setTbmTargets(prev => prev.map(t => 
            (t.status === 'draft' || t.status === 'rejected') ? 
              { ...t, status: 'submitted', submittedDate: new Date().toISOString() } : t
          ));
          showToast('Submitted', `${submittable.length} territory targets submitted.`, 'success');
        } catch (error) { showToast('Error', 'Failed to submit.', 'error'); }
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  }, [tbmTargets, showToast]);

  // ==================== ★ NEW — TBM INDIVIDUAL TARGET HANDLERS ====================

  const handleUpdateIndividualTarget = useCallback(async (targetId, month, values) => {
    try {
      await TBMApiService.updateTBMIndividualTarget(targetId, month, values);
      setTbmIndividualTargets(prev => prev.map(t => {
        if (t.id === targetId) {
          return {
            ...t,
            monthlyTargets: { ...t.monthlyTargets, [month]: { ...t.monthlyTargets?.[month], ...values } },
            status: t.status === 'rejected' ? 'draft' : t.status
          };
        }
        return t;
      }));
    } catch (error) { showToast('Error', 'Failed to update individual target.', 'error'); }
  }, [showToast]);

  const handleSaveIndividualTargets = useCallback(async () => {
    try {
      await TBMApiService.saveTBMIndividualTargets(
        tbmIndividualTargets.filter(t => t.status === 'draft' || t.status === 'rejected')
      );
      showToast('Saved', 'Individual targets saved as draft.', 'success');
    } catch (error) { showToast('Error', 'Failed to save individual targets.', 'error'); }
  }, [tbmIndividualTargets, showToast]);

  const handleSubmitIndividualTargets = useCallback(async () => {
    const submittable = tbmIndividualTargets.filter(t => t.status === 'draft' || t.status === 'rejected');
    if (submittable.length === 0) { showToast('Info', 'No individual targets to submit.', 'info'); return; }
    setModalConfig({
      isOpen: true, title: 'Submit My Targets',
      message: `Submit ${submittable.length} individual targets to ABM for approval?`,
      type: 'warning',
      onConfirm: async () => {
        try {
          await TBMApiService.submitTBMIndividualTargets(submittable.map(t => t.id));
          setTbmIndividualTargets(prev => prev.map(t =>
            (t.status === 'draft' || t.status === 'rejected') ?
              { ...t, status: 'submitted', submittedDate: new Date().toISOString() } : t
          ));
          showToast('Submitted', `${submittable.length} individual targets submitted.`, 'success');
        } catch (error) { showToast('Error', 'Failed to submit individual targets.', 'error'); }
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  }, [tbmIndividualTargets, showToast]);

  // ==================== MISC HANDLERS ====================

  const handleRefresh = useCallback(async () => {
    showToast('Refreshing', 'Updating...', 'info');
    await loadInitialData();
    showToast('Updated', 'Data refreshed.', 'success');
  }, [showToast]);

  const closeModal = useCallback(() => { setModalConfig(prev => ({ ...prev, isOpen: false })); }, []);

  const getQuarterClass = (idx) => idx < 3 ? 'q1' : idx < 6 ? 'q2' : idx < 9 ? 'q3' : 'q4';

  // ==================== LOADING STATE ====================

  if (isLoading) {
    return (
      <div className="tbm-dashboard">
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  // ==================== RENDER ====================

  return (
    <div className="tbm-dashboard">
      {!isOnline && (
        <div className="offline-banner show">
          <i className="fas fa-wifi-slash"></i>
          <span>You're offline.</span>
        </div>
      )}

      <Header 
        user={user} 
        onRefresh={handleRefresh} 
        completionPercent={Math.round((approvalStats.approved / approvalStats.total) * 100) || 0}
        submittedCount={approvalStats.pending} 
        totalCount={approvalStats.total} 
        approvedCount={approvalStats.approved} 
        pendingCount={approvalStats.pending} 
      />

      {/* ==================== 4-TAB NAVIGATION ==================== */}
      <div className="tbm-tabs">
        <button 
          className={`tbm-tab ${activeTab === 'approvals' ? 'active' : ''}`} 
          onClick={() => setActiveTab('approvals')}
        >
          <i className="fas fa-user-check"></i>
          <span>Sales Rep Approvals</span>
          {pendingCount > 0 && <span className="tab-badge pending">{pendingCount}</span>}
        </button>
        <button 
          className={`tbm-tab ${activeTab === 'overview' ? 'active' : ''}`} 
          onClick={() => setActiveTab('overview')}
        >
          <i className="fas fa-chart-pie"></i>
          <span>Overview & Summary</span>
        </button>

        {/* ★ NEW TAB — My Target (Individual) */}
        <button 
          className={`tbm-tab ${activeTab === 'myTarget' ? 'active' : ''}`} 
          onClick={() => setActiveTab('myTarget')}
        >
          <i className="fas fa-user-tie"></i>
          <span>My Target</span>
          {(tbmIndividualTargetStats.draft + tbmIndividualTargetStats.rejected) > 0 && (
            <span className="tab-badge draft">{tbmIndividualTargetStats.draft + tbmIndividualTargetStats.rejected}</span>
          )}
        </button>

        <button 
          className={`tbm-tab ${activeTab === 'targets' ? 'active' : ''}`} 
          onClick={() => setActiveTab('targets')}
        >
          <i className="fas fa-bullseye"></i>
          <span>Territory Target</span>
          {(tbmTargetStats.draft + tbmTargetStats.rejected) > 0 && (
            <span className="tab-badge">{tbmTargetStats.draft + tbmTargetStats.rejected}</span>
          )}
        </button>
      </div>

      <main className="tbm-main">

        {/* ==================== TAB 1: SALES REP APPROVALS ==================== */}
        {activeTab === 'approvals' && (
          <>
            {/* Approval Stats */}
            <div className="tbm-stats-overview">
              <div className="tbm-stat-card pending">
                <div className="stat-card-header"><div className="stat-card-icon"><i className="fas fa-clock"></i></div></div>
                <div className="stat-card-value">{approvalStats.pending}</div>
                <div className="stat-card-label">Pending</div>
              </div>
              <div className="tbm-stat-card approved">
                <div className="stat-card-header"><div className="stat-card-icon"><i className="fas fa-check-circle"></i></div></div>
                <div className="stat-card-value">{approvalStats.approved}</div>
                <div className="stat-card-label">Approved</div>
              </div>
              <div className="tbm-stat-card rejected">
                <div className="stat-card-header"><div className="stat-card-icon"><i className="fas fa-times-circle"></i></div></div>
                <div className="stat-card-value">{approvalStats.rejected}</div>
                <div className="stat-card-label">Rejected</div>
              </div>
              <div className="tbm-stat-card total">
                <div className="stat-card-header"><div className="stat-card-icon"><i className="fas fa-inbox"></i></div></div>
                <div className="stat-card-value">{approvalStats.total}</div>
                <div className="stat-card-label">Total</div>
              </div>
            </div>

            {/* Filters */}
            <div className="approval-filters">
              <div className="filter-group">
                <label>Status</label>
                <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="submitted">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="all">All</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Sales Rep</label>
                <select className="filter-select" value={salesRepFilter} onChange={(e) => setSalesRepFilter(e.target.value)}>
                  <option value="all">All Sales Reps</option>
                  {uniqueSalesReps.map(rep => (
                    <option key={rep.id} value={rep.id}>{rep.name}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Category</label>
                <select className="filter-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="search-input-wrapper">
                <i className="fas fa-search"></i>
                <input type="text" className="search-input" placeholder="Search products or reps..." 
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              {statusFilter === 'submitted' && filteredSubmissions.length > 0 && (
                <button className="bulk-approve-btn" onClick={handleBulkApprove}>
                  <i className="fas fa-check-double"></i> Approve All ({filteredSubmissions.filter(s => s.status === 'submitted').length})
                </button>
              )}
            </div>

            {/* Submissions Table */}
            <div className="tbm-submissions-section">
              {filteredSubmissions.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-inbox" style={{fontSize: '2rem', opacity: 0.3, marginBottom: '1rem'}}></i>
                  <h3>No Submissions Found</h3>
                  <p>No sales rep submissions match your current filters.</p>
                </div>
              ) : (
                <table className="submissions-table">
                  <thead>
                    <tr>
                      <th className="th-product">Product</th>
                      <th className="th-rep">Sales Rep</th>
                      {MONTH_LABELS.map(m => <th key={m} className="th-month">{m}</th>)}
                      <th className="th-total">Total</th>
                      <th className="th-growth">YoY</th>
                      <th className="th-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmissions.map(sub => {
                      const totals = MONTHS.reduce((acc, month) => {
                        const m = sub.monthlyTargets?.[month] || {};
                        return { lyQty: acc.lyQty + (m.lyQty || 0), cyQty: acc.cyQty + (m.cyQty || 0) };
                      }, { lyQty: 0, cyQty: 0 });
                      const growth = Utils.calcGrowth(totals.lyQty, totals.cyQty);

                      return (
                        <tr key={sub.id} className={`submission-row status-${sub.status}`}>
                          <td className="td-product">
                            <div className="product-info">
                              <span className="product-name">{sub.name}</span>
                              <span className="product-code">{sub.code}</span>
                            </div>
                          </td>
                          <td className="td-rep">
                            <div className="rep-info">
                              <span className="rep-name">{sub.salesRepName}</span>
                              <span className="rep-territory">{sub.territory}</span>
                            </div>
                          </td>
                          {MONTHS.map(month => (
                            <td key={month} className={`td-month ${getQuarterClass(MONTHS.indexOf(month))}`}>
                              {Utils.formatNumber(sub.monthlyTargets?.[month]?.cyQty || 0)}
                            </td>
                          ))}
                          <td className="td-total">{Utils.formatNumber(totals.cyQty)}</td>
                          <td className="td-growth">
                            <span className={`growth-pill ${growth >= 0 ? 'positive' : 'negative'}`}>
                              {growth >= 0 ? '↑' : '↓'}{Utils.formatGrowth(growth)}
                            </span>
                          </td>
                          <td className="td-actions">
                            {sub.status === 'submitted' ? (
                              <div className="action-buttons">
                                <button className="action-btn-sm approve" onClick={() => handleApproveSubmission(sub.id)} title="Approve">
                                  <i className="fas fa-check"></i>
                                </button>
                                <button className="action-btn-sm reject" onClick={() => handleOpenRejectionModal(sub.id)} title="Reject">
                                  <i className="fas fa-times"></i>
                                </button>
                              </div>
                            ) : (
                              <span className={`status-tag ${sub.status}`}>
                                {sub.status === 'approved' ? 'Approved' : 'Rejected'}
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

        {/* ==================== TAB 2: OVERVIEW & SUMMARY ==================== */}
        {activeTab === 'overview' && (
          <TBMOverviewStats 
            tbmTargets={tbmTargets}
            categories={categories}
            salesRepSubmissions={salesRepSubmissions}
            approvalStats={approvalStats}
          />
        )}

        {/* ==================== ★ TAB 3: MY TARGET (Individual) ==================== */}
        {activeTab === 'myTarget' && (
          <>
            {/* Overall Individual Target Bar */}
            <div className="tbm-overall-target-bar" style={{ borderLeft: '4px solid #F59E0B' }}>
              <div className="tbm-otb-header">
                <div className="tbm-otb-title">
                  <i className="fas fa-user-tie" style={{ color: '#F59E0B' }}></i>
                  <span>My Individual Target</span>
                </div>
                <div className="tbm-otb-badge">
                  FY 2026-27 | Overall: <strong>{Utils.formatNumber(TBM_INDIVIDUAL_YEARLY_TARGET_QTY)}</strong> Qty
                </div>
              </div>

              <div className="tbm-otb-progress-section">
                <div className="tbm-otb-progress-bar">
                  <div
                    className="tbm-otb-progress-fill"
                    style={{
                      width: `${Math.min(
                        (tbmIndividualTargets.reduce((sum, p) => {
                          if (!p.monthlyTargets) return sum;
                          return sum + Object.values(p.monthlyTargets).reduce((s, m) => s + (m.cyQty || 0), 0);
                        }, 0) / TBM_INDIVIDUAL_YEARLY_TARGET_QTY) * 100,
                        100
                      )}%`,
                      background: 'linear-gradient(90deg, #F59E0B, #D97706)'
                    }}
                  ></div>
                </div>
                <div className="tbm-otb-stats">
                  <span>
                    <strong>
                      {Utils.formatNumber(
                        tbmIndividualTargets.reduce((sum, p) => {
                          if (!p.monthlyTargets) return sum;
                          return sum + Object.values(p.monthlyTargets).reduce((s, m) => s + (m.cyQty || 0), 0);
                        }, 0)
                      )}
                    </strong> entered
                  </span>
                  <span>of <strong>{Utils.formatNumber(TBM_INDIVIDUAL_YEARLY_TARGET_QTY)}</strong> total</span>
                  <span>
                    ({Math.round(
                      (tbmIndividualTargets.reduce((sum, p) => {
                        if (!p.monthlyTargets) return sum;
                        return sum + Object.values(p.monthlyTargets).reduce((s, m) => s + (m.cyQty || 0), 0);
                      }, 0) / TBM_INDIVIDUAL_YEARLY_TARGET_QTY) * 100
                    )}% filled)
                  </span>
                </div>
              </div>
            </div>

            <TBMIndividualTargetGrid
              categories={categories}
              products={tbmIndividualTargets}
              onUpdateTarget={handleUpdateIndividualTarget}
              onSaveAll={handleSaveIndividualTargets}
              onSubmitAll={handleSubmitIndividualTargets}
              fiscalYear="2026-27"
              targetStats={tbmIndividualTargetStats}
            />
          </>
        )}

        {/* ==================== TAB 4: TERRITORY TARGET ==================== */}
        {activeTab === 'targets' && (
          <>
            {/* Overall Territory Target Bar */}
            <div className="tbm-overall-target-bar">
              <div className="tbm-otb-header">
                <div className="tbm-otb-title">
                  <i className="fas fa-flag-checkered"></i>
                  <span>Overall Territory Target</span>
                </div>
                <div className="tbm-otb-badge">
                  FY 2026-27 | Overall: <strong>{Utils.formatNumber(TBM_OVERALL_YEARLY_TARGET_QTY)}</strong> Qty
                </div>
              </div>

              <div className="tbm-otb-progress-section">
                <div className="tbm-otb-progress-bar">
                  <div
                    className="tbm-otb-progress-fill"
                    style={{
                      width: `${Math.min(
                        (tbmTargets.reduce((sum, p) => {
                          if (!p.monthlyTargets) return sum;
                          return sum + Object.values(p.monthlyTargets).reduce((s, m) => s + (m.cyQty || 0), 0);
                        }, 0) / TBM_OVERALL_YEARLY_TARGET_QTY) * 100,
                        100
                      )}%`
                    }}
                  ></div>
                </div>
                <div className="tbm-otb-stats">
                  <span>
                    <strong>
                      {Utils.formatNumber(
                        tbmTargets.reduce((sum, p) => {
                          if (!p.monthlyTargets) return sum;
                          return sum + Object.values(p.monthlyTargets).reduce((s, m) => s + (m.cyQty || 0), 0);
                        }, 0)
                      )}
                    </strong> entered
                  </span>
                  <span>of <strong>{Utils.formatNumber(TBM_OVERALL_YEARLY_TARGET_QTY)}</strong> total</span>
                  <span>
                    ({Math.round(
                      (tbmTargets.reduce((sum, p) => {
                        if (!p.monthlyTargets) return sum;
                        return sum + Object.values(p.monthlyTargets).reduce((s, m) => s + (m.cyQty || 0), 0);
                      }, 0) / TBM_OVERALL_YEARLY_TARGET_QTY) * 100
                    )}% filled)
                  </span>
                </div>
              </div>
            </div>

            <TBMTargetEntryGrid
              categories={categories}
              products={tbmTargets}
              onUpdateTarget={handleUpdateTBMTarget}
              onSaveAll={handleSaveTBMTargets}
              onSubmitAll={handleSubmitTBMTargets}
              fiscalYear="2026-27"
              targetStats={tbmTargetStats}
            />
          </>
        )}
      </main>

      {/* ==================== MODALS & TOASTS ==================== */}

      {/* Rejection Modal */}
      {rejectionModal.isOpen && (
        <div className="rejection-modal-overlay" onClick={() => setRejectionModal({ isOpen: false, submissionId: null, productName: '' })}>
          <div className="rejection-modal" onClick={e => e.stopPropagation()}>
            <h3><i className="fas fa-times-circle" style={{color: '#EF4444', marginRight: '0.5rem'}}></i>Reject Target</h3>
            <p>Rejecting "<strong>{rejectionModal.productName}</strong>" from <strong>{rejectionModal.salesRepName}</strong></p>
            <label>Reason for rejection:</label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please provide a reason..."
              rows={3}
            />
            <div className="rejection-modal-actions">
              <button className="btn-cancel" onClick={() => setRejectionModal({ isOpen: false, submissionId: null, productName: '' })}>
                Cancel
              </button>
              <button className="btn-reject" onClick={handleRejectSubmission} disabled={!rejectionReason.trim()}>
                <i className="fas fa-times"></i> Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal 
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onConfirm={modalConfig.onConfirm}
        onCancel={closeModal}
      />

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} />
        ))}
      </div>
    </div>
  );
}

export default TBMDashboard;
