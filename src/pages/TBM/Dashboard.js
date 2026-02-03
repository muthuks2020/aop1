/**
 * TBM Dashboard Component - Table Layout Version
 * @version 2.3.0 - Simple row-based table, no cards
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { TBMApiService } from '../../services/tbmApi';
import { Utils } from '../../utils/helpers';
import Header from '../../components/common/Header';
import Toast from '../../components/common/Toast';
import Modal from '../../components/common/Modal';
import TBMTargetEntryGrid from './components/TBMTargetEntryGrid';
import '../../styles/tbm/tbmDashboard.css';

const MONTHS = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];
const MONTH_LABELS = ['APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR'];

function TBMDashboard() {
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('approvals');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [salesRepSubmissions, setSalesRepSubmissions] = useState([]);
  const [tbmTargets, setTbmTargets] = useState([]);
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

  useEffect(() => { loadInitialData(); }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [cats, submissions, targets, stats, reps] = await Promise.all([
        TBMApiService.getCategories(),
        TBMApiService.getSalesRepSubmissions(),
        TBMApiService.getTBMTargets(),
        TBMApiService.getDashboardStats(),
        TBMApiService.getUniqueSalesReps()
      ]);
      setCategories(cats);
      setSalesRepSubmissions(submissions);
      setTbmTargets(targets);
      setDashboardStats(stats);
      setUniqueSalesReps(reps);
    } catch (error) {
      showToast('Error', 'Failed to load data.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); showToast('Online', 'Connection restored', 'success'); };
    const handleOffline = () => { setIsOnline(false); showToast('Offline', 'You are offline.', 'warning'); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showToast = useCallback((title, message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  const closeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const calculateProductTotals = useCallback((product) => {
    let lyQty = 0, cyQty = 0, lyRev = 0, cyRev = 0;
    if (product.monthlyTargets) {
      Object.values(product.monthlyTargets).forEach(m => {
        lyQty += m.lyQty || 0;
        cyQty += m.cyQty || 0;
        lyRev += m.lyRev || 0;
        cyRev += m.cyRev || 0;
      });
    }
    return { lyQty, cyQty, lyRev, cyRev };
  }, []);

  const filteredSubmissions = useMemo(() => {
    return salesRepSubmissions.filter(sub => {
      if (statusFilter !== 'all' && sub.status !== statusFilter) return false;
      if (salesRepFilter !== 'all' && sub.salesRepId !== parseInt(salesRepFilter)) return false;
      if (categoryFilter !== 'all' && sub.categoryId !== categoryFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return sub.name.toLowerCase().includes(term) || sub.code.toLowerCase().includes(term) ||
               sub.salesRepName.toLowerCase().includes(term) || sub.territory.toLowerCase().includes(term);
      }
      return true;
    });
  }, [salesRepSubmissions, statusFilter, salesRepFilter, categoryFilter, searchTerm]);

  const pendingCount = useMemo(() => salesRepSubmissions.filter(s => s.status === 'submitted').length, [salesRepSubmissions]);

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
          setSalesRepSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, status: 'approved', approvedDate: new Date().toISOString(), approvedBy: user.name } : s));
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
      setSalesRepSubmissions(prev => prev.map(s => s.id === rejectionModal.submissionId ? { ...s, status: 'rejected', rejectedDate: new Date().toISOString(), rejectedBy: user.name, rejectionReason } : s));
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
          setSalesRepSubmissions(prev => prev.map(s => ids.includes(s.id) ? { ...s, status: 'approved', approvedDate: new Date().toISOString(), approvedBy: user.name } : s));
          showToast('Approved', `${pending.length} approved.`, 'success');
        } catch (error) { showToast('Error', 'Failed.', 'error'); }
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  }, [filteredSubmissions, user, showToast]);

  const handleUpdateTBMTarget = useCallback(async (targetId, month, values) => {
    try {
      await TBMApiService.updateTBMTarget(targetId, month, values);
      setTbmTargets(prev => prev.map(t => {
        if (t.id === targetId) {
          return { ...t, monthlyTargets: { ...t.monthlyTargets, [month]: { ...t.monthlyTargets?.[month], ...values } }, status: t.status === 'rejected' ? 'draft' : t.status };
        }
        return t;
      }));
    } catch (error) { showToast('Error', 'Failed to update.', 'error'); }
  }, [showToast]);

  const handleSaveTBMTargets = useCallback(async () => {
    try { await TBMApiService.saveTBMTargets(tbmTargets); showToast('Saved', 'Saved as draft.', 'success'); }
    catch (error) { showToast('Error', 'Failed to save.', 'error'); }
  }, [tbmTargets, showToast]);

  const handleSubmitTBMTargets = useCallback(async () => {
    const drafts = tbmTargets.filter(t => t.status === 'draft' || t.status === 'rejected');
    if (drafts.length === 0) { showToast('Info', 'No drafts.', 'info'); return; }
    setModalConfig({
      isOpen: true, title: 'Submit for ABM Approval',
      message: `Submit ${drafts.length} targets?`,
      type: 'warning',
      onConfirm: async () => {
        try {
          const ids = drafts.map(t => t.id);
          await TBMApiService.submitTBMTargets(ids);
          setTbmTargets(prev => prev.map(t => ids.includes(t.id) ? { ...t, status: 'submitted', submittedDate: new Date().toISOString() } : t));
          showToast('Submitted', `${drafts.length} submitted.`, 'success');
        } catch (error) { showToast('Error', 'Failed.', 'error'); }
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  }, [tbmTargets, showToast]);

  const handleRefresh = useCallback(async () => {
    showToast('Refreshing', 'Updating...', 'info');
    await loadInitialData();
    showToast('Updated', 'Data refreshed.', 'success');
  }, [showToast]);

  const closeModal = useCallback(() => { setModalConfig(prev => ({ ...prev, isOpen: false })); }, []);

  const getQuarterClass = (idx) => idx < 3 ? 'q1' : idx < 6 ? 'q2' : idx < 9 ? 'q3' : 'q4';

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

  if (isLoading) {
    return <div className="tbm-dashboard"><div className="loading-overlay"><div className="loading-spinner"></div></div></div>;
  }

  return (
    <div className="tbm-dashboard">
      {!isOnline && <div className="offline-banner show"><i className="fas fa-wifi-slash"></i><span>You're offline.</span></div>}

      <Header user={user} onRefresh={handleRefresh} completionPercent={Math.round((approvalStats.approved / approvalStats.total) * 100) || 0}
        submittedCount={approvalStats.pending} totalCount={approvalStats.total} approvedCount={approvalStats.approved} pendingCount={approvalStats.pending} />

      <div className="tbm-tabs">
        <button className={`tbm-tab ${activeTab === 'approvals' ? 'active' : ''}`} onClick={() => setActiveTab('approvals')}>
          <i className="fas fa-user-check"></i><span>Sales Rep Approvals</span>
          {pendingCount > 0 && <span className="tab-badge pending">{pendingCount}</span>}
        </button>
        <button className={`tbm-tab ${activeTab === 'targets' ? 'active' : ''}`} onClick={() => setActiveTab('targets')}>
          <i className="fas fa-bullseye"></i><span>Territory Targets</span>
          <span className="tab-badge">{tbmTargetStats.draft + tbmTargetStats.rejected}</span>
        </button>
      </div>

      <main className="tbm-main">
        <div className="tbm-stats-overview">
          {activeTab === 'approvals' ? (
            <>
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
                <div className="stat-card-header"><div className="stat-card-icon"><i className="fas fa-layer-group"></i></div></div>
                <div className="stat-card-value">{approvalStats.total}</div>
                <div className="stat-card-label">Total</div>
              </div>
            </>
          ) : (
            <>
              <div className="tbm-stat-card" style={{'--accent-color': '#60A5FA'}}>
                <div className="stat-card-header"><div className="stat-card-icon" style={{background: 'rgba(96, 165, 250, 0.15)', color: '#60A5FA'}}><i className="fas fa-edit"></i></div></div>
                <div className="stat-card-value">{tbmTargetStats.draft}</div>
                <div className="stat-card-label">Draft</div>
              </div>
              <div className="tbm-stat-card pending">
                <div className="stat-card-header"><div className="stat-card-icon"><i className="fas fa-paper-plane"></i></div></div>
                <div className="stat-card-value">{tbmTargetStats.submitted}</div>
                <div className="stat-card-label">Submitted</div>
              </div>
              <div className="tbm-stat-card approved">
                <div className="stat-card-header"><div className="stat-card-icon"><i className="fas fa-check-double"></i></div></div>
                <div className="stat-card-value">{tbmTargetStats.approved}</div>
                <div className="stat-card-label">Approved</div>
              </div>
              <div className="tbm-stat-card rejected">
                <div className="stat-card-header"><div className="stat-card-icon"><i className="fas fa-undo"></i></div></div>
                <div className="stat-card-value">{tbmTargetStats.rejected}</div>
                <div className="stat-card-label">Rejected</div>
              </div>
            </>
          )}
        </div>

        {activeTab === 'approvals' ? (
          <div className="tbm-approval-container">
            <div className="approval-header">
              <div className="approval-header-title">
                <i className="fas fa-tasks"></i>
                <h2>Sales Rep Target Submissions</h2>
                <span className="approval-count-badge"><i className="fas fa-hourglass-half"></i>{approvalStats.pending} Pending</span>
              </div>
              <div className="approval-actions">
                <button className="approval-action-btn approve-all" onClick={handleBulkApprove}
                  disabled={filteredSubmissions.filter(s => s.status === 'submitted').length === 0}>
                  <i className="fas fa-check-double"></i>Approve All
                </button>
              </div>
            </div>

            <div className="approval-filters">
              <div className="filter-group">
                <label>STATUS</label>
                <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All</option>
                  <option value="submitted">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="filter-group">
                <label>SALES REP</label>
                <select className="filter-select" value={salesRepFilter} onChange={(e) => setSalesRepFilter(e.target.value)}>
                  <option value="all">All</option>
                  {uniqueSalesReps.map(rep => <option key={rep.id} value={rep.id}>{rep.name}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <label>CATEGORY</label>
                <select className="filter-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                  <option value="all">All</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div className="search-input-wrapper">
                <i className="fas fa-search"></i>
                <input type="text" className="search-input" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>

            {/* SIMPLE TABLE LAYOUT */}
            <div className="table-container">
              {filteredSubmissions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon"><i className="fas fa-inbox"></i></div>
                  <h3>No Submissions Found</h3>
                  <p>{statusFilter === 'submitted' ? "All done!" : "No matches."}</p>
                </div>
              ) : (
                <table className="approval-table">
                  <thead>
                    <tr>
                      <th className="th-fixed th-product">Product</th>
                      <th className="th-fixed th-rep">Sales Rep</th>
                      {MONTH_LABELS.map((m, i) => <th key={m} className={`th-month ${getQuarterClass(i)}`}>{m}</th>)}
                      <th className="th-total">Total</th>
                      <th className="th-growth">Growth</th>
                      <th className="th-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmissions.map(sub => {
                      const totals = calculateProductTotals(sub);
                      const growth = Utils.calcGrowth(totals.lyQty, totals.cyQty);
                      return (
                        <tr key={sub.id} className={`row-${sub.status}`}>
                          <td className="td-product">
                            <div className="product-cell">
                              <span className="product-name">{sub.name}</span>
                              <span className="product-code">{sub.code}</span>
                            </div>
                          </td>
                          <td className="td-rep">
                            <div className="rep-cell">
                              <span className="rep-avatar">{sub.salesRepName.split(' ').map(n=>n[0]).join('')}</span>
                              <div className="rep-info">
                                <span className="rep-name">{sub.salesRepName}</span>
                                <span className="rep-territory">{sub.territory}</span>
                              </div>
                            </div>
                          </td>
                          {MONTHS.map((month, i) => (
                            <td key={month} className={`td-month ${getQuarterClass(i)}`}>
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
                              <div className="action-btns">
                                <button className="btn-approve" onClick={() => handleApproveSubmission(sub.id)} title="Approve"><i className="fas fa-check"></i></button>
                                <button className="btn-reject" onClick={() => handleOpenRejectionModal(sub.id)} title="Reject"><i className="fas fa-times"></i></button>
                              </div>
                            ) : sub.status === 'approved' ? (
                              <span className="status-tag approved"><i className="fas fa-check"></i> Approved</span>
                            ) : (
                              <span className="status-tag rejected"><i className="fas fa-times"></i> Rejected</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : (
          <TBMTargetEntryGrid categories={categories} products={tbmTargets} onUpdateTarget={handleUpdateTBMTarget}
            onSaveAll={handleSaveTBMTargets} onSubmitAll={handleSubmitTBMTargets} fiscalYear="2026-27" targetStats={tbmTargetStats} />
        )}
      </main>

      {rejectionModal.isOpen && (
        <div className="rejection-modal-overlay" onClick={() => setRejectionModal({ isOpen: false, submissionId: null, productName: '' })}>
          <div className="rejection-modal" onClick={e => e.stopPropagation()}>
            <div className="rejection-modal-header"><i className="fas fa-exclamation-triangle"></i><h3>Reject Target</h3></div>
            <div className="rejection-modal-body">
              <p>Reject <strong>"{rejectionModal.productName}"</strong> from <strong>{rejectionModal.salesRepName}</strong>?</p>
              <textarea className="rejection-reason-textarea" placeholder="Enter reason..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
            </div>
            <div className="rejection-modal-footer">
              <button className="cancel-btn" onClick={() => setRejectionModal({ isOpen: false, submissionId: null, productName: '' })}>Cancel</button>
              <button className="reject-btn" onClick={handleRejectSubmission} disabled={!rejectionReason.trim()}><i className="fas fa-times"></i> Reject</button>
            </div>
          </div>
        </div>
      )}

      <div className="toast-container">{toasts.map(t => <Toast key={t.id} {...t} onClose={() => closeToast(t.id)} />)}</div>
      <Modal isOpen={modalConfig.isOpen} title={modalConfig.title} message={modalConfig.message} type={modalConfig.type} onClose={closeModal} onConfirm={modalConfig.onConfirm} />
    </div>
  );
}

export default TBMDashboard;
