/**
 * TBM Dashboard Component - Updated Flow
 * @version 6.0.0 - Yearly Targets + removed My Target tab
 * 
 * FOUR tabs:
 * 1. Sales Rep Targets — Review/correct/approve sales rep submissions
 * 2. Overview & Summary — Territory-level KPIs
 * 3. Territory Target — Territory target entry grid
 * 4. Team Yearly Targets — ★ Set yearly targets for all sales reps
 * 
 * CHANGES IN v6:
 * - Removed "My Target" tab (TBM individual targets)
 * - Replaced old "Team Targets" with new TeamYearlyTargets component
 * - Integrated yearlyTargetApi methods directly
 * - No changes to Sales Rep page or shared components
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
import TeamYearlyTargets from './components/TeamYearlyTargets';
import '../../styles/tbm/tbmDashboard.css';
import '../../styles/tbm/tbmApprovalTableFix.css';
import TBMTerritoryTargetGrid from './components/TBMTerritoryTargetGrid';

const MONTHS = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];
const MONTH_LABELS = ['APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR'];

const TBM_OVERALL_YEARLY_TARGET_QTY = 50000;

function TBMDashboard() {
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('approvals');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [salesRepSubmissions, setSalesRepSubmissions] = useState([]);
  const [tbmTargets, setTbmTargets] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [salesRepFilter, setSalesRepFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [toasts, setToasts] = useState([]);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'warning', onConfirm: null });
  const [editedCells, setEditedCells] = useState(new Set());

  // ==================== TOAST HELPER ====================

  const showToast = useCallback((title, message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  // ==================== ONLINE/OFFLINE ====================

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); showToast('Online', 'Connection restored.', 'success'); };
    const handleOffline = () => { setIsOnline(false); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, [showToast]);

  // ==================== DATA LOADING ====================

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [cats, submissions, targets, stats] = await Promise.all([
        TBMApiService.getCategories(),
        TBMApiService.getSalesRepSubmissions(),
        TBMApiService.getTBMTargets(),
        TBMApiService.getDashboardStats(),
      ]);
      setCategories(cats);
      setSalesRepSubmissions(submissions);
      setTbmTargets(targets);
      setDashboardStats(stats);
    } catch (error) {
      showToast('Error', 'Failed to load data.', 'error');
    } finally {
      setIsLoading(false);
    }
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
    const reps = {};
    salesRepSubmissions.forEach(s => {
      if (!reps[s.salesRepId]) {
        reps[s.salesRepId] = { id: s.salesRepId, name: s.salesRepName, territory: s.territory };
      }
    });
    return Object.values(reps);
  }, [salesRepSubmissions]);

  const tbmTargetStats = useMemo(() => ({
    total: tbmTargets.length,
    draft: tbmTargets.filter(t => t.status === 'draft').length,
    submitted: tbmTargets.filter(t => t.status === 'submitted').length,
    approved: tbmTargets.filter(t => t.status === 'approved').length,
    rejected: tbmTargets.filter(t => t.status === 'rejected').length,
  }), [tbmTargets]);

  const filteredSubmissions = useMemo(() => {
    let result = [...salesRepSubmissions];
    if (salesRepFilter !== 'all') {
      result = result.filter(s => String(s.salesRepId) === salesRepFilter);
    }
    if (categoryFilter !== 'all') {
      result = result.filter(s => s.categoryId === categoryFilter);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(term) ||
        s.code.toLowerCase().includes(term) ||
        s.salesRepName.toLowerCase().includes(term)
      );
    }
    return result;
  }, [salesRepSubmissions, salesRepFilter, categoryFilter, searchTerm]);

  // submissionsByRep removed — using flat table layout matching original CSS

  // ==================== HANDLERS — APPROVAL ====================

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
            { ...s, status: 'approved', approvedDate: new Date().toISOString(), approvedBy: user?.name || 'TBM' } : s));
          showToast('Approved', `Target approved${wasEdited ? ' with corrections' : ''}.`, 'success');
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

  // Bulk approve handled inline in JSX

  // Edit a submission cell value (local state update, saved on approve)
  const handleEditSubmissionValue = useCallback((submissionId, month, newValue) => {
    setSalesRepSubmissions(prev => prev.map(s => {
      if (s.id === submissionId) {
        return {
          ...s,
          monthlyTargets: {
            ...s.monthlyTargets,
            [month]: { ...s.monthlyTargets[month], cyQty: newValue }
          }
        };
      }
      return s;
    }));
    setEditedCells(prev => new Set(prev).add(`${submissionId}-${month}`));
  }, []);

  // ==================== HANDLERS — TERRITORY TARGET ====================

  const handleUpdateTBMTarget = useCallback(async (targetId, month, values) => {
    try {
      await TBMApiService.updateTBMTarget(targetId, month, values);
      setTbmTargets(prev => prev.map(t => {
        if (t.id === targetId) {
          return {
            ...t,
            monthlyTargets: { ...t.monthlyTargets, [month]: { ...t.monthlyTargets[month], ...values } },
          };
        }
        return t;
      }));
    } catch (error) {
      showToast('Error', 'Failed to update target.', 'error');
    }
  }, [showToast]);

  const handleSaveTBMTargets = useCallback(async () => {
    try {
      await TBMApiService.saveTBMTargets(tbmTargets);
      showToast('Saved', 'Territory targets saved.', 'success');
    } catch (error) {
      showToast('Error', 'Failed to save targets.', 'error');
    }
  }, [tbmTargets, showToast]);

  const handleSubmitTBMTargets = useCallback(async () => {
    setModalConfig({
      isOpen: true,
      title: 'Submit Territory Targets',
      message: 'Submit all territory targets to ABM for approval?',
      type: 'warning',
      onConfirm: async () => {
        try {
          await TBMApiService.submitTBMTargets(tbmTargets.map(t => t.id));
          setTbmTargets(prev => prev.map(t => ({ ...t, status: 'submitted', submittedDate: new Date().toISOString() })));
          showToast('Submitted', 'Territory targets submitted.', 'success');
        } catch (error) {
          showToast('Error', 'Failed to submit targets.', 'error');
        }
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      },
    });
  }, [tbmTargets, showToast]);

  // ==================== MISC HANDLERS ====================

  const handleRefresh = useCallback(async () => {
    showToast('Refreshing', 'Updating...', 'info');
    await loadInitialData();
    showToast('Updated', 'Data refreshed.', 'success');
  }, [showToast, loadInitialData]);

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
          className={`tbm-tab ${activeTab === 'targets' ? 'active' : ''}`} 
          onClick={() => setActiveTab('targets')}
        >
          <i className="fas fa-bullseye"></i>
          <span>Territory Target</span>
        </button>
        <button 
          className={`tbm-tab ${activeTab === 'yearlyTargets' ? 'active' : ''}`} 
          onClick={() => setActiveTab('yearlyTargets')}
        >
          <i className="fas fa-calendar-check"></i>
          <span>Team Yearly Targets</span>
        </button>
      </div>

      <main className="tbm-main">

        {/* ==================== TAB 1: SALES REP TARGETS (Correct & Approve) ==================== */}
        {activeTab === 'approvals' && (
          <>
            {/* Filters - using original class names that match existing CSS */}
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
                <button className="bulk-approve-btn" onClick={() => {
                  const pending = filteredSubmissions.filter(s => s.status === 'submitted');
                  if (pending.length === 0) return;
                  setModalConfig({
                    isOpen: true, title: 'Approve All',
                    message: `Approve all ${pending.length} pending submissions?`,
                    type: 'warning',
                    onConfirm: async () => {
                      try {
                        for (const sub of pending) { await TBMApiService.approveSalesRepTarget(sub.id, ''); }
                        setSalesRepSubmissions(prev => prev.map(s => s.status === 'submitted' ? { ...s, status: 'approved', approvedDate: new Date().toISOString() } : s));
                        showToast('Approved', `All ${pending.length} targets approved.`, 'success');
                      } catch (error) { showToast('Error', 'Failed to approve.', 'error'); }
                      setModalConfig(prev => ({ ...prev, isOpen: false }));
                    },
                  });
                }}>
                  <i className="fas fa-check-double"></i> Approve All ({filteredSubmissions.filter(s => s.status === 'submitted').length})
                </button>
              )}
            </div>

            {/* Submissions Table - EDITABLE by TBM */}
            <div className="tbm-submissions-section">
              {filteredSubmissions.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-inbox" style={{ fontSize: '2rem', opacity: 0.3 }}></i>
                  <h3>No Submissions Found</h3>
                  <p>No sales rep submissions match your filters.</p>
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
                      <th className="th-growth">Growth</th>
                      <th className="th-actions">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmissions.map(sub => {
                      const isSubmitted = sub.status === 'submitted';
                      const lyTotal = MONTHS.reduce((s, m) => s + (sub.monthlyTargets?.[m]?.lyQty || 0), 0);
                      const cyTotal = MONTHS.reduce((s, m) => s + (sub.monthlyTargets?.[m]?.cyQty || 0), 0);
                      const growth = Utils.calcGrowth(lyTotal, cyTotal);

                      return (
                        <tr key={sub.id} className={`status-${sub.status}`}>
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
                            const cyQty = sub.monthlyTargets?.[month]?.cyQty || 0;
                            const wasEdited = editedCells.has(`${sub.id}-${month}`);
                            return (
                              <td key={month} className={`td-month ${getQuarterClass(idx)} ${wasEdited ? 'cell-edited' : ''}`}>
                                {isSubmitted ? (
                                  <input
                                    type="text"
                                    className={`submission-cell-input ${wasEdited ? 'edited' : ''}`}
                                    value={cyQty}
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
                                  <span>{Utils.formatNumber(cyQty)}</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="td-total">
                            <strong>{Utils.formatNumber(cyTotal, 0)}</strong>
                          </td>
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

        {/* ==================== TAB 3: TERRITORY TARGET ==================== */}
        {activeTab === 'targets' && (
  <TBMTerritoryTargetGrid
    categories={categories}
    products={tbmTargets}
    onUpdateTarget={(productId, month, value) => {
      handleUpdateTBMTarget(productId, month, { cyQty: value });
    }}
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
