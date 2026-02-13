/**
 * ZBM Dashboard Component
 * Zonal Business Manager Dashboard
 * 
 * FOUR tabs:
 * 1. ABM Approvals — Review/correct/approve ABM area-level submissions
 * 2. Overview & Summary — Zone-level KPIs
 * 3. Team Yearly Targets — Set yearly targets for ABMs
 * 4. Team Drill-Down — ABM → TBM → Sales Rep hierarchy (read-only)
 * 
 * NO Target Entry screen (ZBM does not enter targets directly)
 * 
 * HIERARCHY: Sales Rep → TBM → ABM → ZBM → Sales Head
 * 
 * @author Appasamy Associates - Product Commitment PWA
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ZBMApiService } from '../../services/zbmApi';
import { Utils } from '../../utils/helpers';
import Header from '../../components/common/Header';
import Toast from '../../components/common/Toast';
import Modal from '../../components/common/Modal';
import ZBMOverviewStats from './components/ZBMOverviewStats';
import ZBMTeamDrilldown from './components/ZBMTeamDrilldown';
import TeamYearlyTargets from '../TBM/components/TeamYearlyTargets';
import '../../styles/zbm/zbmDashboard.css';

const MONTHS = ['apr','may','jun','jul','aug','sep','oct','nov','dec','jan','feb','mar'];
const MONTH_LABELS = ['APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC','JAN','FEB','MAR'];

function ZBMDashboard() {
  const { user } = useAuth();

  // ==================== STATE ====================
  const [activeTab, setActiveTab] = useState('approvals');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [abmSubmissions, setAbmSubmissions] = useState([]);
  const [abmFilter, setAbmFilter] = useState('all');
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
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cats, subs] = await Promise.all([
        ZBMApiService.getCategories(),
        ZBMApiService.getABMSubmissions()
      ]);
      setCategories(cats);
      setAbmSubmissions(subs);
    } catch (error) {
      console.error('ZBM Dashboard: Failed to load data', error);
      showToast('Error', 'Failed to load data. Please try again.', 'error');
    }
    setIsLoading(false);
  };

  // ==================== UNIQUE ABMs ====================
  const uniqueABMs = useMemo(() => {
    const map = {};
    abmSubmissions.forEach(s => {
      if (!map[s.abmId]) map[s.abmId] = { id: s.abmId, name: s.abmName, territory: s.territory };
    });
    return Object.values(map);
  }, [abmSubmissions]);

  // ==================== APPROVAL STATS ====================
  const approvalStats = useMemo(() => {
    const total = abmSubmissions.length;
    const pending = abmSubmissions.filter(s => s.status === 'submitted').length;
    const approved = abmSubmissions.filter(s => s.status === 'approved').length;
    return { total, pending, approved };
  }, [abmSubmissions]);

  // ==================== FILTERED SUBMISSIONS ====================
  const filteredSubmissions = useMemo(() => {
    return abmSubmissions.filter(sub => {
      if (abmFilter !== 'all' && sub.abmId !== abmFilter) return false;
      if (categoryFilter !== 'all' && sub.categoryId !== categoryFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!sub.productName.toLowerCase().includes(term) && !sub.abmName.toLowerCase().includes(term)) return false;
      }
      return true;
    });
  }, [abmSubmissions, abmFilter, categoryFilter, searchTerm]);

  // ==================== HANDLERS ====================
  const handleApproveABMSubmission = useCallback(async (submissionId) => {
    const corrections = {};
    editedCells.forEach(key => {
      const [id, month] = key.split('-');
      if (id === submissionId) {
        const sub = abmSubmissions.find(s => s.id === id);
        if (sub?.monthlyTargets?.[month]) corrections[month] = { cyQty: sub.monthlyTargets[month].cyQty };
      }
    });

    try {
      await ZBMApiService.approveABMTarget(submissionId, Object.keys(corrections).length > 0 ? corrections : null);
      setAbmSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, status: 'approved' } : s));
      showToast('Approved', 'ABM target submission approved successfully.', 'success');
    } catch (error) {
      showToast('Error', 'Failed to approve. Please try again.', 'error');
    }
  }, [abmSubmissions, editedCells, showToast]);

  const handleBulkApprove = useCallback(() => {
    const pendingIds = filteredSubmissions.filter(s => s.status === 'submitted').map(s => s.id);
    if (pendingIds.length === 0) { showToast('Info', 'No pending submissions to approve.', 'info'); return; }
    setModalConfig({
      isOpen: true,
      title: 'Bulk Approve ABM Targets',
      message: `Approve all ${pendingIds.length} pending ABM submissions?`,
      type: 'warning',
      onConfirm: async () => {
        try {
          await ZBMApiService.bulkApproveABM(pendingIds);
          setAbmSubmissions(prev => prev.map(s => pendingIds.includes(s.id) ? { ...s, status: 'approved' } : s));
          showToast('Approved', `${pendingIds.length} ABM submissions approved.`, 'success');
        } catch (error) {
          showToast('Error', 'Bulk approve failed.', 'error');
        }
        closeModal();
      }
    });
  }, [filteredSubmissions, showToast]);

  const handleEditZBMCell = useCallback((subId, month, newValue) => {
    const numVal = parseInt(String(newValue).replace(/[^0-9]/g, ''), 10) || 0;
    setAbmSubmissions(prev => prev.map(s => {
      if (s.id !== subId) return s;
      const updated = { ...s, monthlyTargets: { ...s.monthlyTargets } };
      updated.monthlyTargets[month] = { ...updated.monthlyTargets[month], cyQty: numVal };
      return updated;
    }));
    setEditedCells(prev => new Set(prev).add(`${subId}-${month}`));
  }, []);

  const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

  // ==================== HELPER FUNCTIONS ====================
  const getQC = (monthIndex) => {
    if (monthIndex < 3) return 'q1';
    if (monthIndex < 6) return 'q2';
    if (monthIndex < 9) return 'q3';
    return 'q4';
  };

  // ==================== TAB CONFIG ====================
  const tabs = [
    { id: 'approvals', label: 'ABM Approvals', icon: 'fa-clipboard-check', badge: approvalStats.pending },
    { id: 'overview', label: 'Overview & Summary', icon: 'fa-chart-pie' },
    { id: 'yearlyTargets', label: 'Team Yearly Targets', icon: 'fa-bullseye' },
    { id: 'drilldown', label: 'Team Drill-Down', icon: 'fa-sitemap' },
  ];

  // ==================== RENDER ====================
  return (
    <div className="zbm-dashboard">
      <Header />

      {!isOnline && (
        <div className="zbm-offline-banner">
          <i className="fas fa-wifi-slash"></i> Working in offline mode
        </div>
      )}

      {/* Tab Navigation */}
      <div className="zbm-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`zbm-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <i className={`fas ${tab.icon}`}></i>
            {tab.label}
            {tab.badge > 0 && <span className="tab-badge pending">{tab.badge}</span>}
          </button>
        ))}
      </div>

      <main className="zbm-main">
        {/* ==================== TAB 1: ABM APPROVALS ==================== */}
        {activeTab === 'approvals' && (
          <>
            {/* Approval Stats */}
            <div className="zbm-approval-stats">
              <div className="zbm-stat-card">
                <div className="zbm-stat-icon zbm-stat-total"><i className="fas fa-file-alt"></i></div>
                <div className="zbm-stat-content">
                  <span className="zbm-stat-value">{approvalStats.total}</span>
                  <span className="zbm-stat-label">Total Submissions</span>
                </div>
              </div>
              <div className="zbm-stat-card">
                <div className="zbm-stat-icon zbm-stat-pending"><i className="fas fa-clock"></i></div>
                <div className="zbm-stat-content">
                  <span className="zbm-stat-value">{approvalStats.pending}</span>
                  <span className="zbm-stat-label">Pending Review</span>
                </div>
              </div>
              <div className="zbm-stat-card">
                <div className="zbm-stat-icon zbm-stat-approved"><i className="fas fa-check-circle"></i></div>
                <div className="zbm-stat-content">
                  <span className="zbm-stat-value">{approvalStats.approved}</span>
                  <span className="zbm-stat-label">Approved</span>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="zbm-filter-bar">
              <div className="zbm-filter-group">
                <select value={abmFilter} onChange={e => setAbmFilter(e.target.value)} className="zbm-select">
                  <option value="all">All ABMs</option>
                  {uniqueABMs.map(abm => (
                    <option key={abm.id} value={abm.id}>{abm.name} — {abm.territory}</option>
                  ))}
                </select>
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="zbm-select">
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <div className="zbm-search-wrapper">
                  <i className="fas fa-search"></i>
                  <input type="text" placeholder="Search products or ABMs..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="zbm-search-input" />
                </div>
              </div>
              <button className="zbm-bulk-approve-btn" onClick={handleBulkApprove}>
                <i className="fas fa-check-double"></i> Approve All Pending ({approvalStats.pending})
              </button>
            </div>

            {/* Submissions Table */}
            <div className="zbm-table-container">
              {isLoading ? (
                <div className="zbm-loading"><div className="loading-spinner"></div><p>Loading ABM submissions...</p></div>
              ) : filteredSubmissions.length === 0 ? (
                <div className="zbm-empty"><i className="fas fa-inbox"></i><p>No submissions found</p></div>
              ) : (
                <table className="zbm-approval-table">
                  <thead>
                    <tr>
                      <th className="th-product">Product</th>
                      <th className="th-abm">ABM</th>
                      <th className="th-type">Type</th>
                      {MONTH_LABELS.map((m, i) => (
                        <th key={m} className={`th-month th-${getQC(i)}`}>{m}</th>
                      ))}
                      <th className="th-total">TOTAL</th>
                      <th className="th-growth">Growth</th>
                      <th className="th-actions">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmissions.map(sub => {
                      const isSub = sub.status === 'submitted';
                      let ly = 0, cy = 0;
                      MONTHS.forEach(m => { ly += sub.monthlyTargets?.[m]?.lyQty || 0; cy += sub.monthlyTargets?.[m]?.cyQty || 0; });
                      const g = Utils.calcGrowth(ly, cy);

                      return (
                        <React.Fragment key={sub.id}>
                          {/* LY Row */}
                          <tr className={`zbm-row-ly ${isSub ? 'zbm-row-pending' : 'zbm-row-approved'}`}>
                            <td className="td-product" rowSpan="2">
                              <div className="zbm-product-info">
                                <span className="zbm-product-name">{sub.productName}</span>
                                <span className="zbm-product-cat">{categories.find(c => c.id === sub.categoryId)?.name || sub.categoryId}</span>
                              </div>
                            </td>
                            <td className="td-abm" rowSpan="2">
                              <div className="zbm-abm-info">
                                <span className="zbm-abm-name">{sub.abmName}</span>
                                <span className="zbm-abm-territory">{sub.territory}</span>
                              </div>
                            </td>
                            <td className="td-type"><span className="type-tag ly">LY</span></td>
                            {MONTHS.map((m, i) => (
                              <td key={m} className={`td-month td-${getQC(i)}`}>
                                {Utils.formatNumber(sub.monthlyTargets?.[m]?.lyQty || 0)}
                              </td>
                            ))}
                            <td className="td-total"><strong>{Utils.formatNumber(ly)}</strong></td>
                            <td className="td-growth" rowSpan="2">
                              <span className={g >= 0 ? 'growth-positive' : 'growth-negative'}>
                                {g >= 0 ? '↑' : '↓'}{Utils.formatGrowth(g)}
                              </span>
                            </td>
                            <td className="td-actions" rowSpan="2">
                              {isSub ? (
                                <div className="action-buttons">
                                  <button className="action-btn-sm approve" onClick={() => handleApproveABMSubmission(sub.id)} title="Approve">
                                    <i className="fas fa-check"></i>
                                  </button>
                                </div>
                              ) : (
                                <span className="status-tag approved"><i className="fas fa-check-circle"></i> Approved</span>
                              )}
                            </td>
                          </tr>
                          {/* CY Row */}
                          <tr className={`zbm-row-cy ${isSub ? 'zbm-row-pending' : 'zbm-row-approved'}`}>
                            <td className="td-type"><span className="type-tag cy">CY</span></td>
                            {MONTHS.map((m, i) => {
                              const md = sub.monthlyTargets?.[m] || {};
                              const ed = editedCells.has(`${sub.id}-${m}`);
                              return (
                                <td
                                  key={m}
                                  className={`td-month td-${getQC(i)} ${isSub ? 'td-editable' : ''} ${ed ? 'td-edited' : ''}`}
                                  contentEditable={isSub}
                                  suppressContentEditableWarning
                                  onBlur={e => { if (isSub) handleEditZBMCell(sub.id, m, e.target.textContent); }}
                                >
                                  {Utils.formatNumber(md.cyQty || 0)}
                                </td>
                              );
                            })}
                            <td className="td-total"><strong>{Utils.formatNumber(cy)}</strong></td>
                          </tr>
                        </React.Fragment>
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
          <ZBMOverviewStats
            abmSubmissions={abmSubmissions}
            categories={categories}
            approvalStats={approvalStats}
          />
        )}

        {/* ==================== TAB 3: TEAM YEARLY TARGETS ==================== */}
        {activeTab === 'yearlyTargets' && (
          <TeamYearlyTargets
            role="ZBM"
            fiscalYear="2026-27"
            teamMembers={uniqueABMs}
            showToast={showToast}
            managerName={user?.name || ''}
          />
        )}

        {/* ==================== TAB 4: TEAM DRILL-DOWN ==================== */}
        {activeTab === 'drilldown' && (
          <ZBMTeamDrilldown showToast={showToast} />
        )}
      </main>

      <Modal isOpen={modalConfig.isOpen} title={modalConfig.title} message={modalConfig.message}
        type={modalConfig.type} onConfirm={modalConfig.onConfirm} onCancel={closeModal} />

      <div className="toast-container">
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} />
        ))}
      </div>
    </div>
  );
}

export default ZBMDashboard;
