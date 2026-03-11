/**
 * Sales Head Dashboard Component
 * Executive-level Dashboard — Top of the hierarchy
 * 
 * FOUR tabs:
 * 1. Executive Overview — KPIs, Pie Charts, Monthly Trends, Zone Performance
 * 2. ZBM Approvals — Review/correct/approve ZBM zone-level submissions
 * 3. Team Yearly Targets — Set yearly targets for ZBMs
 * 4. Organization Drill-Down — ZBM → ABM → TBM → Sales Rep hierarchy (read-only)
 * 
 * Color Accent: Appasamy Brand Navy (#0C2340) + Teal (#0097A7)
 * CSS Prefix: 'sh-' for Sales Head
 * 
 * HIERARCHY: Sales Rep → TBM → ABM → ZBM → Sales Head
 * 
 * @author Appasamy Associates - Product Commitment PWA
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SalesHeadApiService } from '../../services/salesHeadApi';
import { Utils } from '../../utils/helpers';
import Header from '../../components/common/Header';
import Toast from '../../components/common/Toast';
import Modal from '../../components/common/Modal';
import SalesHeadOverview from './components/SalesHeadOverview';
import SalesHeadDrilldown from './components/SalesHeadDrilldown';
import SalesHeadAnalytics from './components/SalesHeadAnalytics';
import TeamYearlyTargets from '../TBM/components/TeamYearlyTargets';
import '../../styles/saleshead/shDashboard.css';

const MONTHS = ['apr','may','jun','jul','aug','sep','oct','nov','dec','jan','feb','mar'];
const MONTH_LABELS = ['APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC','JAN','FEB','MAR'];

function SalesHeadDashboard() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [zbmSubmissions, setZbmSubmissions] = useState([]);
  const [zbmFilter, setZbmFilter] = useState('all');
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
    const onOn = () => { setIsOnline(true); showToast('Online', 'Connection restored.', 'success'); };
    const onOff = () => { setIsOnline(false); showToast('Offline', 'Working in offline mode.', 'warning'); };
    window.addEventListener('online', onOn);
    window.addEventListener('offline', onOff);
    return () => { window.removeEventListener('online', onOn); window.removeEventListener('offline', onOff); };
  }, [showToast]);

  useEffect(() => { loadData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cats, subs] = await Promise.all([
        SalesHeadApiService.getCategories(),
        SalesHeadApiService.getZBMSubmissions()
      ]);
      setCategories(cats);
      setZbmSubmissions(subs);
    } catch (error) {
      console.error('Failed to load data:', error);
      showToast('Error', 'Failed to load dashboard data.', 'error');
    }
    setIsLoading(false);
  };

  // ==================== COMPUTED ====================
  const uniqueZBMs = useMemo(() => {
    const map = {};
    zbmSubmissions.forEach(s => {
      if (!map[s.zbmId]) map[s.zbmId] = { id: s.zbmId, name: s.zbmName, territory: s.territory };
    });
    return Object.values(map);
  }, [zbmSubmissions]);

  const approvalStats = useMemo(() => {
    const total = zbmSubmissions.length;
    const pending = zbmSubmissions.filter(s => s.status === 'submitted').length;
    const approved = zbmSubmissions.filter(s => s.status === 'approved').length;
    return { total, pending, approved };
  }, [zbmSubmissions]);

  const filteredSubmissions = useMemo(() => {
    return zbmSubmissions.filter(s => {
      if (zbmFilter !== 'all' && s.zbmId !== zbmFilter) return false;
      if (categoryFilter !== 'all' && s.categoryId !== categoryFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!s.productName.toLowerCase().includes(term) && !s.zbmName.toLowerCase().includes(term) && !s.territory.toLowerCase().includes(term)) return false;
      }
      return true;
    });
  }, [zbmSubmissions, zbmFilter, categoryFilter, searchTerm]);

  const pendingSubmissions = useMemo(() => filteredSubmissions.filter(s => s.status === 'submitted'), [filteredSubmissions]);

  // ==================== APPROVAL ====================
  const handleApprove = async (submissionId) => {
    const submission = zbmSubmissions.find(s => s.id === submissionId);
    const corrections = {};
    let hasCorrections = false;
    editedCells.forEach(cellKey => {
      const [sid, month, field] = cellKey.split('__');
      if (sid === submissionId) {
        if (!corrections[month]) corrections[month] = {};
        const sub = zbmSubmissions.find(s => s.id === sid);
        corrections[month][field] = sub?.monthlyTargets?.[month]?.[field];
        hasCorrections = true;
      }
    });

    setModalConfig({
      isOpen: true,
      title: hasCorrections ? 'Approve with Corrections' : 'Approve Target',
      message: hasCorrections
        ? `Approve "${submission?.productName}" for ${submission?.zbmName} with your corrections?`
        : `Approve "${submission?.productName}" for ${submission?.zbmName}?`,
      type: hasCorrections ? 'warning' : 'success',
      onConfirm: async () => {
        try {
          await SalesHeadApiService.approveZBMTarget(submissionId, hasCorrections ? corrections : null);
          setZbmSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, status: 'approved' } : s));
          const newEdited = new Set(editedCells);
          editedCells.forEach(k => { if (k.startsWith(submissionId)) newEdited.delete(k); });
          setEditedCells(newEdited);
          showToast('Approved', `${submission?.productName} approved.`, 'success');
        } catch (error) {
          showToast('Error', 'Failed to approve.', 'error');
        }
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleBulkApprove = async () => {
    const ids = pendingSubmissions.map(s => s.id);
    if (ids.length === 0) return;
    setModalConfig({
      isOpen: true,
      title: 'Bulk Approve',
      message: `Approve all ${ids.length} pending zone-level targets?`,
      type: 'warning',
      onConfirm: async () => {
        try {
          await SalesHeadApiService.bulkApproveZBM(ids);
          setZbmSubmissions(prev => prev.map(s => ids.includes(s.id) ? { ...s, status: 'approved' } : s));
          setEditedCells(new Set());
          showToast('Bulk Approved', `${ids.length} targets approved.`, 'success');
        } catch (error) { showToast('Error', 'Bulk approval failed.', 'error'); }
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleCellEdit = (submissionId, month, field, value) => {
    setZbmSubmissions(prev => prev.map(s => {
      if (s.id === submissionId) {
        const updated = { ...s, monthlyTargets: { ...s.monthlyTargets } };
        updated.monthlyTargets[month] = { ...updated.monthlyTargets[month], [field]: parseInt(value) || 0 };
        return updated;
      }
      return s;
    }));
    setEditedCells(prev => new Set(prev).add(`${submissionId}__${month}__${field}`));
  };

  // ==================== RENDER ====================
  const renderApprovalTable = (submission) => {
    const isSubmitted = submission.status === 'submitted';
    const cat = categories.find(c => c.id === submission.categoryId);
    const isRevenueOnly = cat?.isRevenueOnly || false;

    return (
      <div key={submission.id} className={`sh-approval-card ${isSubmitted ? '' : 'approved'}`}>
        <div className="sh-approval-card-header">
          <div className="sh-approval-card-left">
            <div className="sh-approval-zbm-avatar">{submission.zbmName.split(' ').map(n => n[0]).join('').substring(0, 2)}</div>
            <div>
              <span className="sh-approval-zbm-name">{submission.zbmName}</span>
              <span className="sh-approval-territory"><i className="fas fa-globe-asia"></i> {submission.territory}</span>
            </div>
          </div>
          <div className="sh-approval-card-center">
            <span className="sh-approval-product-name"><i className={`fas ${cat?.icon || 'fa-box'}`}></i> {submission.productName}</span>
            <span className="sh-approval-category">{cat?.name || submission.categoryId}</span>
          </div>
          <div className="sh-approval-card-right">
            <span className={`sh-approval-status ${submission.status}`}>
              <i className={`fas ${submission.status === 'approved' ? 'fa-check-circle' : 'fa-clock'}`}></i>
              {submission.status === 'approved' ? 'Approved' : 'Pending'}
            </span>
            {isSubmitted && (
              <button className="sh-approve-btn" onClick={() => handleApprove(submission.id)}>
                <i className="fas fa-check"></i> Approve
              </button>
            )}
          </div>
        </div>

        <div className="sh-approval-table-wrapper">
          <table className="sh-approval-table">
            <thead>
              <tr>
                <th></th>
                {MONTH_LABELS.map((ml, i) => {
                  const qClass = i < 3 ? 'th-q1' : i < 6 ? 'th-q2' : i < 9 ? 'th-q3' : 'th-q4';
                  return <th key={i} className={qClass}>{ml}</th>;
                })}
                <th>TOTAL</th>
                <th>GROWTH</th>
              </tr>
            </thead>
            <tbody>
              {/* LY Revenue Row */}
              <tr className="sh-row-ly">
                <td className="type-tag ly">LY Rev</td>
                {MONTHS.map(m => (
                  <td key={m} className="td-val ly">₹{Utils.formatCompact(submission.monthlyTargets?.[m]?.lyRev || 0)}</td>
                ))}
                <td className="td-total ly">₹{Utils.formatCompact(MONTHS.reduce((s, m) => s + (submission.monthlyTargets?.[m]?.lyRev || 0), 0))}</td>
                <td rowSpan={3} className="td-growth">
                  {(() => {
                    const lyT = MONTHS.reduce((s, m) => s + (submission.monthlyTargets?.[m]?.lyRev || 0), 0);
                    const cyT = MONTHS.reduce((s, m) => s + (submission.monthlyTargets?.[m]?.cyRev || 0), 0);
                    const g = Utils.calcGrowth(lyT, cyT);
                    return <span className={`growth-pill ${g >= 0 ? 'positive' : 'negative'}`}>{g >= 0 ? '↑' : '↓'}{Utils.formatGrowth(g)}</span>;
                  })()}
                </td>
              </tr>
              {/* CY Revenue Row */}
              <tr className={`sh-row-cy ${isSubmitted ? 'editable-row' : ''}`}>
                <td className="type-tag cy">CY Rev</td>
                {MONTHS.map(m => {
                  const cellKey = `${submission.id}__${m}__cyRev`;
                  const isEdited = editedCells.has(cellKey);
                  return (
                    <td
                      key={m}
                      className={`td-val cy ${isSubmitted ? 'td-editable' : ''} ${isEdited ? 'td-edited' : ''}`}
                      contentEditable={isSubmitted}
                      suppressContentEditableWarning
                      onBlur={(e) => isSubmitted && handleCellEdit(submission.id, m, 'cyRev', e.target.textContent.replace(/[^\d]/g, ''))}
                    >
                      ₹{Utils.formatCompact(submission.monthlyTargets?.[m]?.cyRev || 0)}
                    </td>
                  );
                })}
                <td className="td-total cy">₹{Utils.formatCompact(MONTHS.reduce((s, m) => s + (submission.monthlyTargets?.[m]?.cyRev || 0), 0))}</td>
              </tr>
              {/* AOP Revenue Row — Read Only */}
              <tr className="sh-row-aop">
                <td className="type-tag aop">AOP Rev</td>
                {MONTHS.map(m => (
                  <td key={m} className="td-val aop">₹{Utils.formatCompact(submission.monthlyTargets?.[m]?.aopRev || 0)}</td>
                ))}
                <td className="td-total aop">₹{Utils.formatCompact(MONTHS.reduce((s, m) => s + (submission.monthlyTargets?.[m]?.aopRev || 0), 0))}</td>
              </tr>
              {/* Qty rows (if not revenue-only) */}
              {!isRevenueOnly && (
                <>
                  <tr className="sh-row-ly">
                    <td className="type-tag ly">LY Qty</td>
                    {MONTHS.map(m => (
                      <td key={m} className="td-val ly">{Utils.formatNumber(submission.monthlyTargets?.[m]?.lyQty || 0)}</td>
                    ))}
                    <td className="td-total ly">{Utils.formatNumber(MONTHS.reduce((s, m) => s + (submission.monthlyTargets?.[m]?.lyQty || 0), 0))}</td>
                    <td rowSpan={3} className="td-growth">
                      {(() => {
                        const lyT = MONTHS.reduce((s, m) => s + (submission.monthlyTargets?.[m]?.lyQty || 0), 0);
                        const cyT = MONTHS.reduce((s, m) => s + (submission.monthlyTargets?.[m]?.cyQty || 0), 0);
                        const g = Utils.calcGrowth(lyT, cyT);
                        return <span className={`growth-pill ${g >= 0 ? 'positive' : 'negative'}`}>{g >= 0 ? '↑' : '↓'}{Utils.formatGrowth(g)}</span>;
                      })()}
                    </td>
                  </tr>
                  <tr className={`sh-row-cy ${isSubmitted ? 'editable-row' : ''}`}>
                    <td className="type-tag cy">CY Qty</td>
                    {MONTHS.map(m => {
                      const cellKey = `${submission.id}__${m}__cyQty`;
                      const isEdited = editedCells.has(cellKey);
                      return (
                        <td
                          key={m}
                          className={`td-val cy ${isSubmitted ? 'td-editable' : ''} ${isEdited ? 'td-edited' : ''}`}
                          contentEditable={isSubmitted}
                          suppressContentEditableWarning
                          onBlur={(e) => isSubmitted && handleCellEdit(submission.id, m, 'cyQty', e.target.textContent.replace(/[^\d]/g, ''))}
                        >
                          {Utils.formatNumber(submission.monthlyTargets?.[m]?.cyQty || 0)}
                        </td>
                      );
                    })}
                    <td className="td-total cy">{Utils.formatNumber(MONTHS.reduce((s, m) => s + (submission.monthlyTargets?.[m]?.cyQty || 0), 0))}</td>
                  </tr>
                  {/* AOP Qty Row — Read Only */}
                  <tr className="sh-row-aop">
                    <td className="type-tag aop">AOP Qty</td>
                    {MONTHS.map(m => (
                      <td key={m} className="td-val aop">{Utils.formatNumber(submission.monthlyTargets?.[m]?.aopQty || 0)}</td>
                    ))}
                    <td className="td-total aop">{Utils.formatNumber(MONTHS.reduce((s, m) => s + (submission.monthlyTargets?.[m]?.aopQty || 0), 0))}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="sh-dashboard">
      <Header user={user} onRefresh={loadData} />

      {!isOnline && (
        <div className="sh-offline-banner"><i className="fas fa-wifi"></i> Working offline — changes will sync when connected</div>
      )}

      {/* ==================== TABS ==================== */}
      <div className="sh-tabs">
        <button className={`sh-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          <i className="fas fa-chart-pie"></i> Executive Overview
        </button>
        <button className={`sh-tab ${activeTab === 'approvals' ? 'active' : ''}`} onClick={() => setActiveTab('approvals')}>
          <i className="fas fa-clipboard-check"></i> ZBM Approvals
          {approvalStats.pending > 0 && <span className="tab-badge pending">{approvalStats.pending}</span>}
        </button>
        <button className={`sh-tab ${activeTab === 'targets' ? 'active' : ''}`} onClick={() => setActiveTab('targets')}>
          <i className="fas fa-bullseye"></i> Team Yearly Targets
        </button>
        <button className={`sh-tab ${activeTab === 'drilldown' ? 'active' : ''}`} onClick={() => setActiveTab('drilldown')}>
          <i className="fas fa-sitemap"></i> Organization Drill-Down
        </button>
        <button className={`sh-tab ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
          <i className="fas fa-chart-area"></i> Analytics & Compare
        </button>
      </div>

      {/* ==================== MAIN CONTENT ==================== */}
      <div className="sh-main">
        {isLoading ? (
          <div className="sh-loading"><div className="loading-spinner"></div><p>Loading executive dashboard...</p></div>
        ) : (
          <>
            {/* TAB: Executive Overview */}
            {activeTab === 'overview' && (
              <SalesHeadOverview
                zbmSubmissions={zbmSubmissions}
                categories={categories}
                approvalStats={approvalStats}
              />
            )}

            {/* TAB: ZBM Approvals */}
            {activeTab === 'approvals' && (
              <div className="sh-approvals-section">
                {/* Approval Stats */}
                <div className="sh-approval-stats">
                  <div className="sh-stat-card">
                    <div className="sh-stat-icon sh-stat-total"><i className="fas fa-file-alt"></i></div>
                    <div><span className="sh-stat-value">{approvalStats.total}</span><span className="sh-stat-label">Total Submissions</span></div>
                  </div>
                  <div className="sh-stat-card">
                    <div className="sh-stat-icon sh-stat-pending"><i className="fas fa-clock"></i></div>
                    <div><span className="sh-stat-value">{approvalStats.pending}</span><span className="sh-stat-label">Pending Approval</span></div>
                  </div>
                  <div className="sh-stat-card">
                    <div className="sh-stat-icon sh-stat-approved"><i className="fas fa-check-circle"></i></div>
                    <div><span className="sh-stat-value">{approvalStats.approved}</span><span className="sh-stat-label">Approved</span></div>
                  </div>
                </div>

                {/* Filters */}
                <div className="sh-filter-bar">
                  <div className="sh-filter-group">
                    <select className="sh-select" value={zbmFilter} onChange={(e) => setZbmFilter(e.target.value)}>
                      <option value="all">All ZBMs</option>
                      {uniqueZBMs.map(z => <option key={z.id} value={z.id}>{z.name} — {z.territory}</option>)}
                    </select>
                    <select className="sh-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                      <option value="all">All Categories</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <div className="sh-search-wrapper">
                      <i className="fas fa-search"></i>
                      <input className="sh-search-input" type="text" placeholder="Search products, ZBMs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                  </div>
                  {pendingSubmissions.length > 0 && (
                    <button className="sh-bulk-approve-btn" onClick={handleBulkApprove}>
                      <i className="fas fa-check-double"></i> Approve All ({pendingSubmissions.length})
                    </button>
                  )}
                </div>

                {/* Approval Cards */}
                <div className="sh-approval-list">
                  {filteredSubmissions.length === 0 ? (
                    <div className="sh-empty-state"><i className="fas fa-inbox"></i><h3>No submissions found</h3><p>Adjust filters to see ZBM submissions.</p></div>
                  ) : (
                    filteredSubmissions.map(renderApprovalTable)
                  )}
                </div>
              </div>
            )}

            {/* TAB: Team Yearly Targets */}
            {activeTab === 'targets' && (
              <TeamYearlyTargets
                role="SH"
                fiscalYear="2026-27"
                teamMembers={uniqueZBMs.map(z => ({
                  id: z.id,
                  name: z.name,
                  territory: z.territory,
                  designation: 'ZBM',
                }))}
                showToast={showToast}
                managerName={user?.name || 'Sales Head'}
              />
            )}

            {/* TAB: Organization Drill-Down */}
            {activeTab === 'drilldown' && (
              <SalesHeadDrilldown showToast={showToast} />
            )}

            {/* TAB: Analytics & Compare */}
            {activeTab === 'analytics' && (
              <SalesHeadAnalytics showToast={showToast} />
            )}
          </>
        )}
      </div>

      {/* Toast & Modal */}
      <div className="toast-container">{toasts.map(t => <Toast key={t.id} {...t} onClose={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />)}</div>
      <Modal {...modalConfig} onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))} />
    </div>
  );
}

export default SalesHeadDashboard;
