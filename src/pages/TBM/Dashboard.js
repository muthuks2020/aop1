/**
 * TBM Dashboard Component - Updated Flow
 * @version 5.0.0 - New approval flow + Team Targets tab
 * 
 * FIVE tabs:
 * 1. Sales Rep Targets — Review/correct/approve sales rep submissions (NO reject)
 * 2. Overview & Summary — Territory-level KPIs
 * 3. My Target — TBM's own individual/personal target entry grid
 * 4. Territory Target — Territory target entry grid
 * 5. Team Targets — ★ NEW: TBM enters targets for all sales reps under them
 * 
 * UPDATED FLOW:
 * - Sales Rep enters targets → submits to TBM
 * - TBM reviews → can EDIT/CORRECT values → then APPROVE
 * - No more reject flow — TBM fixes values directly
 * - No status badges (draft/submitted/approved/rejected) shown anywhere
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
import TBMTeamTargets from './components/TBMTeamTargets';
import '../../styles/tbm/tbmDashboard.css';
import '../../styles/tbm/tbmApprovalTableFix.css';

const MONTHS = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];
const MONTH_LABELS = ['APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR'];

const TBM_OVERALL_YEARLY_TARGET_QTY = 50000;
const TBM_INDIVIDUAL_YEARLY_TARGET_QTY = 10000;

function TBMDashboard() {
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('approvals');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [salesRepSubmissions, setSalesRepSubmissions] = useState([]);
  const [tbmTargets, setTbmTargets] = useState([]);
  const [tbmIndividualTargets, setTbmIndividualTargets] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [salesRepFilter, setSalesRepFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [toasts, setToasts] = useState([]);
  const [modalConfig, setModalConfig] = useState({ isOpen: false });
  const [uniqueSalesReps, setUniqueSalesReps] = useState([]);
  // Track which cells TBM has edited for visual feedback
  const [editedCells, setEditedCells] = useState(new Set());

  // ==================== DATA LOADING ====================

  useEffect(() => { loadInitialData(); }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [cats, submissions, targets, individualTargets, stats, reps] = await Promise.all([
        TBMApiService.getCategories(),
        TBMApiService.getSalesRepSubmissions(),
        TBMApiService.getTBMTargets(),
        TBMApiService.getTBMIndividualTargets(),
        TBMApiService.getDashboardStats(),
        TBMApiService.getUniqueSalesReps()
      ]);
      setCategories(cats);
      setSalesRepSubmissions(submissions);
      setTbmTargets(targets);
      setTbmIndividualTargets(individualTargets);
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
  }, [salesRepSubmissions, salesRepFilter, categoryFilter, searchTerm]);

  const submissionCount = useMemo(() => salesRepSubmissions.length, [salesRepSubmissions]);

  const approvalStats = useMemo(() => ({
    pending: salesRepSubmissions.filter(s => s.status === 'submitted').length,
    approved: salesRepSubmissions.filter(s => s.status === 'approved').length,
    total: salesRepSubmissions.length
  }), [salesRepSubmissions]);

  const tbmTargetStats = useMemo(() => ({
    draft: tbmTargets.filter(t => t.status === 'draft').length,
    submitted: tbmTargets.filter(t => t.status === 'submitted').length,
    approved: tbmTargets.filter(t => t.status === 'approved').length,
    rejected: tbmTargets.filter(t => t.status === 'rejected').length,
    total: tbmTargets.length
  }), [tbmTargets]);

  const tbmIndividualTargetStats = useMemo(() => ({
    draft: tbmIndividualTargets.filter(t => t.status === 'draft').length,
    submitted: tbmIndividualTargets.filter(t => t.status === 'submitted').length,
    approved: tbmIndividualTargets.filter(t => t.status === 'approved').length,
    rejected: tbmIndividualTargets.filter(t => t.status === 'rejected').length,
    total: tbmIndividualTargets.length
  }), [tbmIndividualTargets]);

  // ==================== NEW APPROVAL FLOW: CORRECT & APPROVE ====================

  // TBM can edit any submitted value directly in the table
  const handleEditSubmissionValue = useCallback((submissionId, month, newValue) => {
    setSalesRepSubmissions(prev => prev.map(s => {
      if (s.id === submissionId) {
        const updated = {
          ...s,
          monthlyTargets: {
            ...s.monthlyTargets,
            [month]: { ...s.monthlyTargets?.[month], cyQty: newValue }
          }
        };
        return updated;
      }
      return s;
    }));
    // Track which cell was edited
    setEditedCells(prev => new Set(prev).add(`${submissionId}-${month}`));
  }, []);

  // Approve a submission (possibly after corrections)
  const handleApproveSubmission = useCallback(async (submissionId) => {
    const submission = salesRepSubmissions.find(s => s.id === submissionId);
    if (!submission) return;
    
    const wasEdited = MONTHS.some(m => editedCells.has(`${submissionId}-${m}`));
    const actionText = wasEdited ? 'Approve with corrections' : 'Approve';
    
    setModalConfig({
      isOpen: true, 
      title: actionText,
      message: wasEdited 
        ? `You've made corrections to "${submission.name}" from ${submission.salesRepName}. Approve with your corrections?`
        : `Approve "${submission.name}" from ${submission.salesRepName}?`,
      type: 'success',
      onConfirm: async () => {
        try {
          await TBMApiService.approveSalesRepTarget(submissionId);
          setSalesRepSubmissions(prev => prev.map(s => s.id === submissionId ? 
            { ...s, status: 'approved', approvedDate: new Date().toISOString(), approvedBy: user.name } : s));
          showToast('Approved', `Target approved${wasEdited ? ' with corrections' : ''}.`, 'success');
          // Clear edited markers for this submission
          setEditedCells(prev => {
            const next = new Set(prev);
            MONTHS.forEach(m => next.delete(`${submissionId}-${m}`));
            return next;
          });
        } catch (error) { showToast('Error', 'Failed to approve.', 'error'); }
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  }, [salesRepSubmissions, user, showToast, editedCells]);

  // Bulk approve all visible submissions
  const handleBulkApprove = useCallback(async () => {
    const pending = filteredSubmissions.filter(s => s.status === 'submitted');
    if (pending.length === 0) { showToast('Info', 'No pending submissions.', 'info'); return; }
    setModalConfig({
      isOpen: true, title: 'Approve All',
      message: `Approve all ${pending.length} submissions? Any corrections you've made will be saved.`,
      type: 'warning',
      onConfirm: async () => {
        try {
          const ids = pending.map(s => s.id);
          await TBMApiService.bulkApproveSalesRepTargets(ids);
          setSalesRepSubmissions(prev => prev.map(s => ids.includes(s.id) ? 
            { ...s, status: 'approved', approvedDate: new Date().toISOString(), approvedBy: user.name } : s));
          showToast('Approved', `${pending.length} targets approved.`, 'success');
          setEditedCells(new Set());
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
            monthlyTargets: { ...t.monthlyTargets, [month]: { ...t.monthlyTargets?.[month], ...values } }
          };
        }
        return t;
      }));
    } catch (error) { showToast('Error', 'Failed to update.', 'error'); }
  }, [showToast]);

  const handleSaveTBMTargets = useCallback(async () => {
    try {
      await TBMApiService.saveTBMTargets(tbmTargets);
      showToast('Saved', 'Territory targets saved.', 'success');
    } catch (error) { showToast('Error', 'Failed to save.', 'error'); }
  }, [tbmTargets, showToast]);

  const handleSubmitTBMTargets = useCallback(async () => {
    setModalConfig({
      isOpen: true, title: 'Submit Territory Targets',
      message: `Submit territory targets to ABM for approval?`,
      type: 'warning',
      onConfirm: async () => {
        try {
          await TBMApiService.submitTBMTargets(tbmTargets.map(t => t.id));
          setTbmTargets(prev => prev.map(t => ({ ...t, status: 'submitted', submittedDate: new Date().toISOString() })));
          showToast('Submitted', 'Territory targets submitted.', 'success');
        } catch (error) { showToast('Error', 'Failed to submit.', 'error'); }
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  }, [tbmTargets, showToast]);

  // ==================== TBM INDIVIDUAL TARGET HANDLERS ====================

  const handleUpdateIndividualTarget = useCallback(async (targetId, month, values) => {
    try {
      await TBMApiService.updateTBMIndividualTarget(targetId, month, values);
      setTbmIndividualTargets(prev => prev.map(t => {
        if (t.id === targetId) {
          return {
            ...t,
            monthlyTargets: { ...t.monthlyTargets, [month]: { ...t.monthlyTargets?.[month], ...values } }
          };
        }
        return t;
      }));
    } catch (error) { showToast('Error', 'Failed to update individual target.', 'error'); }
  }, [showToast]);

  const handleSaveIndividualTargets = useCallback(async () => {
    try {
      await TBMApiService.saveTBMIndividualTargets(tbmIndividualTargets);
      showToast('Saved', 'Individual targets saved.', 'success');
    } catch (error) { showToast('Error', 'Failed to save individual targets.', 'error'); }
  }, [tbmIndividualTargets, showToast]);

  const handleSubmitIndividualTargets = useCallback(async () => {
    setModalConfig({
      isOpen: true, title: 'Submit My Targets',
      message: `Submit individual targets to ABM for approval?`,
      type: 'warning',
      onConfirm: async () => {
        try {
          await TBMApiService.submitTBMIndividualTargets(tbmIndividualTargets.map(t => t.id));
          setTbmIndividualTargets(prev => prev.map(t => ({ ...t, status: 'submitted', submittedDate: new Date().toISOString() })));
          showToast('Submitted', 'Individual targets submitted.', 'success');
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

      {/* ==================== 5-TAB NAVIGATION ==================== */}
      <div className="tbm-tabs">
        <button 
          className={`tbm-tab ${activeTab === 'approvals' ? 'active' : ''}`} 
          onClick={() => setActiveTab('approvals')}
        >
          <i className="fas fa-user-check"></i>
          <span>Sales Rep Targets</span>
          {approvalStats.pending > 0 && <span className="tab-badge pending">{approvalStats.pending}</span>}
        </button>
        <button 
          className={`tbm-tab ${activeTab === 'overview' ? 'active' : ''}`} 
          onClick={() => setActiveTab('overview')}
        >
          <i className="fas fa-chart-pie"></i>
          <span>Overview & Summary</span>
        </button>
        <button 
          className={`tbm-tab ${activeTab === 'myTarget' ? 'active' : ''}`} 
          onClick={() => setActiveTab('myTarget')}
        >
          <i className="fas fa-user-tie"></i>
          <span>My Target</span>
        </button>
        <button 
          className={`tbm-tab ${activeTab === 'targets' ? 'active' : ''}`} 
          onClick={() => setActiveTab('targets')}
        >
          <i className="fas fa-bullseye"></i>
          <span>Territory Target</span>
        </button>
        <button 
          className={`tbm-tab ${activeTab === 'teamTargets' ? 'active' : ''}`} 
          onClick={() => setActiveTab('teamTargets')}
        >
          <i className="fas fa-users-cog"></i>
          <span>Team Targets</span>
        </button>
      </div>

      <main className="tbm-main">

        {/* ==================== TAB 1: SALES REP TARGETS (Correct & Approve) ==================== */}
        {activeTab === 'approvals' && (
          <>
            {/* Stats - simplified, no rejected */}
            <div className="tbm-stats-overview">
              <div className="tbm-stat-card pending">
                <div className="stat-card-header"><div className="stat-card-icon"><i className="fas fa-clock"></i></div></div>
                <div className="stat-card-value">{approvalStats.pending}</div>
                <div className="stat-card-label">Pending Review</div>
              </div>
              <div className="tbm-stat-card approved">
                <div className="stat-card-header"><div className="stat-card-icon"><i className="fas fa-check-circle"></i></div></div>
                <div className="stat-card-value">{approvalStats.approved}</div>
                <div className="stat-card-label">Approved</div>
              </div>
              <div className="tbm-stat-card total">
                <div className="stat-card-header"><div className="stat-card-icon"><i className="fas fa-inbox"></i></div></div>
                <div className="stat-card-value">{approvalStats.total}</div>
                <div className="stat-card-label">Total</div>
              </div>
            </div>

            {/* Filters - removed status filter, no more reject status */}
            <div className="approval-filters">
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
              {filteredSubmissions.filter(s => s.status === 'submitted').length > 0 && (
                <button className="bulk-approve-btn" onClick={handleBulkApprove}>
                  <i className="fas fa-check-double"></i> Approve All ({filteredSubmissions.filter(s => s.status === 'submitted').length})
                </button>
              )}
            </div>

            {/* Submissions Table - EDITABLE by TBM */}
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
                      {MONTH_LABELS.map((m, idx) => (
                        <th key={m} className={`th-month ${getQuarterClass(idx)}`}>{m}</th>
                      ))}
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
                      const isSubmitted = sub.status === 'submitted';

                      return (
                        <tr key={sub.id} className="submission-row">
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
                          {MONTHS.map((month, idx) => {
                            const cellKey = `${sub.id}-${month}`;
                            const wasEdited = editedCells.has(cellKey);
                            const monthData = sub.monthlyTargets?.[month] || {};
                            
                            return (
                              <td key={month} className={`td-month ${getQuarterClass(idx)} ${wasEdited ? 'cell-edited' : ''}`}>
                                {isSubmitted ? (
                                  <input
                                    type="text"
                                    className={`submission-cell-input ${wasEdited ? 'edited' : ''}`}
                                    value={monthData.cyQty || 0}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
                                      handleEditSubmissionValue(sub.id, month, val);
                                    }}
                                    style={{ 
                                      width: '100%', 
                                      border: wasEdited ? '2px solid #F59E0B' : '1px solid transparent',
                                      borderRadius: '4px',
                                      padding: '2px 4px',
                                      textAlign: 'center',
                                      fontSize: '0.8125rem',
                                      fontFamily: 'JetBrains Mono, monospace',
                                      background: wasEdited ? '#FFFBEB' : 'transparent'
                                    }}
                                  />
                                ) : (
                                  <span>{Utils.formatNumber(monthData.cyQty || 0)}</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="td-total">{Utils.formatNumber(totals.cyQty)}</td>
                          <td className="td-growth">
                            <span className={`growth-pill ${growth >= 0 ? 'positive' : 'negative'}`}>
                              {growth >= 0 ? '↑' : '↓'}{Utils.formatGrowth(growth)}
                            </span>
                          </td>
                          <td className="td-actions">
                            {isSubmitted ? (
                              <div className="action-buttons">
                                <button 
                                  className="action-btn-sm approve" 
                                  onClick={() => handleApproveSubmission(sub.id)} 
                                  title={editedCells.has(`${sub.id}-${MONTHS[0]}`) ? "Approve with corrections" : "Approve"}
                                >
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

        {/* ==================== TAB 2: OVERVIEW & SUMMARY ==================== */}
        {activeTab === 'overview' && (
          <TBMOverviewStats 
            tbmTargets={tbmTargets}
            categories={categories}
            salesRepSubmissions={salesRepSubmissions}
            approvalStats={approvalStats}
          />
        )}

        {/* ==================== TAB 3: MY TARGET (Individual) ==================== */}
        {activeTab === 'myTarget' && (
          <>
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

        {/* ==================== ★ TAB 5: TEAM TARGETS ==================== */}
        {activeTab === 'teamTargets' && (
          <TBMTeamTargets
            categories={categories}
            salesReps={uniqueSalesReps}
            showToast={showToast}
          />
        )}
      </main>

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
