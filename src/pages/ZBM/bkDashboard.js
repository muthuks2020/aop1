/**
 * ZBM Dashboard Component
 * Zonal Business Manager Dashboard
 *
 * FOUR tabs (PART 1 — Item 17: reordered):
 * 1. Team Yearly Targets  — Set yearly targets for ABMs          [was tab 3]
 * 2. ABM Approvals        — Review/correct/approve ABM submissions [was tab 1]
 * 3. Overview & Summary   — Zone-level KPIs                      [was tab 2]
 * 4. Team Drill-Down      — ABM → TBM → Sales Rep (read-only)    [unchanged]
 *
 * NO Target Entry screen (ZBM does not enter targets directly)
 *
 * HIERARCHY: Sales Rep → TBM → ABM → ZBM → Sales Head
 *
 * PART 2 CHANGES (v2.0.0):
 *   Item 10 — ABM Approvals tab now highlights ABMs whose total submitted
 *             CY qty is below their assigned yearly guidance target.
 * PART 3 — Item 11: Added CY Revenue column alongside Qty in ABM Approval table.
 *             A "Below Guidance" badge and summary banner make this
 *             immediately visible to the ZBM without any product-wise
 *             breakdown (guidance is shown only at ABM level).
 *
 * @author Appasamy Associates - Product Commitment PWA
 * @version 2.0.0 — Part 2: Item 10
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ZBMApiService } from '../../services/zbmApi';
import { Utils } from '../../utils/helpers';
import { TARGET_THRESHOLDS } from '../../config/targetThresholds';
import Header from '../../components/common/Header';
import Toast from '../../components/common/Toast';
import Modal from '../../components/common/Modal';
import ZBMTeamDrilldown from './components/ZBMTeamDrilldown';
import TeamYearlyTargets from '../TBM/components/TeamYearlyTargets';
import '../../styles/zbm/zbmDashboard.css';

const MONTHS = ['apr','may','jun','jul','aug','sep','oct','nov','dec','jan','feb','mar'];
const MONTH_LABELS = ['APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC','JAN','FEB','MAR'];

function ZBMDashboard() {
  const { user } = useAuth();

  // ==================== STATE ====================
  // PART 1 — Item 17: default tab changed from 'approvals' → 'yearlyTargets'
  const [activeTab, setActiveTab] = useState('yearlyTargets');
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

  // ── PART 2 Item 10: yearly guidance targets per ABM (employeeCode → target value) ──
  const [abmYearlyGuidance, setAbmYearlyGuidance] = useState({});
  // Direct reports of this ZBM — from API, NOT derived from submissions
  const [zbmDirectReports, setZbmDirectReports] = useState([]);
  // ─────────────────────────────────────────────────────────────────────────────────

  // ==================== TOAST ====================
  const showToast = useCallback((title, message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  // ==================== ONLINE/OFFLINE ====================
  useEffect(() => {
    const onOn  = () => { setIsOnline(true);  showToast('Online',  'Connection restored.',      'success'); };
    const onOff = () => { setIsOnline(false); showToast('Offline', 'Working in offline mode.',  'warning'); };
    window.addEventListener('online',  onOn);
    window.addEventListener('offline', onOff);
    return () => { window.removeEventListener('online', onOn); window.removeEventListener('offline', onOff); };
  }, [showToast]);

  // ==================== DATA LOADING ====================
  useEffect(() => { loadData(); }, []); // eslint-disable-line

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load categories, submissions, yearly targets, and direct reports in parallel
      const [cats, subs, guidanceData, directReports] = await Promise.all([
        ZBMApiService.getCategories(),
        ZBMApiService.getABMSubmissions(),
        ZBMApiService.getTeamYearlyTargets().catch(() => ({ members: [] })),
        ZBMApiService.getUniqueABMs().catch(() => []),         // actual direct reports
      ]);
      setCategories(cats);
      setAbmSubmissions(subs);

      // Store actual direct reports (people whose reports_to = this ZBM's employee_code)
      setZbmDirectReports(Array.isArray(directReports) ? directReports : []);

      // Build employeeCode → guidanceValue map from yearly targets
      // API returns: { fiscalYear, members: [{ employeeCode, targets: [{yearlyTarget,...}] }] }
      const membersArray = guidanceData?.members || (Array.isArray(guidanceData) ? guidanceData : []);
      if (membersArray.length > 0) {
        const guidanceMap = {};
        membersArray.forEach(member => {
          const code = member.employeeCode || member.assigneeCode || '';
          const totalTarget = (member.targets || []).reduce(
            (sum, t) => sum + (t.yearlyTarget || t.cyTargetValue || 0), 0
          );
          if (code) guidanceMap[code] = (guidanceMap[code] || 0) + totalTarget;
        });
        setAbmYearlyGuidance(guidanceMap);
      }
    } catch (error) {
      showToast('Error', 'Failed to load data. Please refresh.', 'error');
    }
    setIsLoading(false);
  };

  // ==================== DERIVED STATE ====================
  const approvalStats = useMemo(() => {
    const total    = abmSubmissions.length;
    const approved = abmSubmissions.filter(s => s.status === 'approved').length;
    const pending  = abmSubmissions.filter(s => s.status === 'submitted').length;
    return { total, approved, pending };
  }, [abmSubmissions]);

  const uniqueABMs = useMemo(() => {
    const seen = new Set();
    return abmSubmissions
      .filter(s => { if (seen.has(s.employeeCode)) return false; seen.add(s.employeeCode); return true; })
      .map(s => ({ id: s.employeeCode, name: s.employeeName || s.abmName || s.employeeCode, territory: s.area || s.areaName || '' }));
  }, [abmSubmissions]);

  const filteredSubmissions = useMemo(() => {
    let result = abmSubmissions;
    if (abmFilter !== 'all') result = result.filter(s => s.employeeCode === abmFilter);
    if (categoryFilter !== 'all') result = result.filter(s => s.categoryId === categoryFilter);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(s =>
        (s.name || s.productName || '').toLowerCase().includes(q) ||
        (s.employeeName || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [abmSubmissions, abmFilter, categoryFilter, searchTerm]);

  // ── PART 2 Item 10: compute per-ABM submitted CY totals ──────────────────────
  // Groups ALL submissions (not filtered) by employeeCode to get true total CY qty.
  const abmCYTotals = useMemo(() => {
    const totals = {};
    abmSubmissions.forEach(sub => {
      const code = sub.employeeCode;
      if (!code) return;
      const cyQty = MONTHS.reduce((s, m) => s + (sub.monthlyTargets?.[m]?.cyQty || 0), 0);
      totals[code] = (totals[code] || 0) + cyQty;
    });
    return totals;
  }, [abmSubmissions]);

  /**
   * Returns whether an ABM is below their guidance threshold.
   * Returns null if no guidance has been set for this ABM.
   */
  const getAbmGuidanceStatus = useCallback((employeeCode) => {
    const guidance = abmYearlyGuidance[employeeCode];
    if (!guidance || guidance === 0) return null; // no guidance set — don't flag

    const cyTotal   = abmCYTotals[employeeCode] || 0;
    const minTarget = guidance * TARGET_THRESHOLDS.GUIDANCE_MIN_PCT;
    const pct       = Math.round((cyTotal / guidance) * 100);

    return {
      guidance,
      cyTotal,
      pct,
      isBelowGuidance: cyTotal < minTarget,
    };
  }, [abmYearlyGuidance, abmCYTotals]);

  // Count of ABMs below guidance (for summary banner)
  const abmsBelowGuidance = useMemo(() => {
    return uniqueABMs.filter(abm => {
      const gs = getAbmGuidanceStatus(abm.id);
      return gs && gs.isBelowGuidance;
    });
  }, [uniqueABMs, getAbmGuidanceStatus]);
  // ─────────────────────────────────────────────────────────────────────────────

  // ==================== HANDLERS ====================
  const handleApproveABM = useCallback(async (submissionId) => {
    const sub = abmSubmissions.find(s => s.id === submissionId);
    if (!sub || sub.status === 'approved') return;

    const corrections = {};
    MONTHS.forEach(month => {
      if (editedCells.has(`${submissionId}-${month}`)) {
        corrections[month] = { cyQty: sub.monthlyTargets[month].cyQty };
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
      },
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
  // PART 1 — Item 17: new order: Targets → ABM Approvals → Overview → Drilldown
  const tabs = [
    { id: 'yearlyTargets', label: 'Team Yearly Targets', icon: 'fa-bullseye' },
    { id: 'approvals',     label: 'ABM Approvals',       icon: 'fa-clipboard-check', badge: approvalStats.pending },
    { id: 'drilldown',     label: 'Team Drill-Down',     icon: 'fa-sitemap' },
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

        {/* ==================== TAB 1: TEAM YEARLY TARGETS ==================== */}
        {activeTab === 'yearlyTargets' && (() => {
          // Adapter: maps ZBM API → shape expected by TeamYearlyTargets component
          const zbmTargetApiService = {
            async getYearlyTargets(fy) {
              const data = await ZBMApiService.getTeamYearlyTargets();
              const members = (data?.members || []).map(m => ({
                id:               m.employeeCode,
                name:             m.fullName || m.name || m.employeeCode,
                territory:        m.area || m.territory || '—',
                designation:      'Area Business Manager',
                lyTargetValue:    (m.targets || []).reduce((s, t) => s + (t.lyTarget || 0), 0),
                lyAchievedValue:  0, // not stored in this DB
                lyTarget:         0,
                lyAchieved:       0,
                cyTargetValue:    (m.targets || []).reduce((s, t) => s + (t.yearlyTarget || 0), 0),
                cyTarget:         0,
                status:           m.targets?.length > 0 ? (m.targets[0].status || 'not_set') : 'not_set',
                lastUpdated:      null,
                categoryBreakdown: (m.targets || []).map(t => ({
                  id:              t.categoryId   || 'other',
                  name:            t.categoryName || t.categoryId || 'Other',
                  lyTargetValue:   t.lyTarget     || 0,
                  lyAchievedValue: 0,
                  lyTarget:        0,
                  lyAchieved:      0,
                  cyTargetValue:   t.yearlyTarget || 0,
                  cyTarget:        0,
                })),
              }));

              // No saved targets yet — seed list from direct reports with zeroed values
              if (members.length === 0 && zbmDirectReports.length > 0) {
                return {
                  members: zbmDirectReports.map(r => ({
                    id:               r.employeeCode,
                    name:             r.fullName || r.name || r.employeeCode,
                    territory:        r.area || r.territory || '—',
                    designation:      'Area Business Manager',
                    lyTargetValue:    0,
                    lyAchievedValue:  0,
                    lyTarget:         0,
                    lyAchieved:       0,
                    cyTargetValue:    0,
                    cyTarget:         0,
                    status:           'not_set',
                    lastUpdated:      null,
                    categoryBreakdown: [],
                  })),
                };
              }
              return { members };
            },

            async saveYearlyTargets(fy, membersToSave) {
              const targets = membersToSave.map(m => ({
                employeeCode: m.id,
                yearlyTarget: m.cyTargetValue || 0,
                areaCode:     null,
              }));
              return ZBMApiService.saveTeamYearlyTargets(targets);
            },

            async publishYearlyTargets(fy, memberIds) {
              // No separate publish endpoint yet — save covers it
              return { success: true };
            },
          };

          return (
            <TeamYearlyTargets
              role="ZBM"
              fiscalYear="2026-27"
              teamMembers={zbmDirectReports}
              apiService={zbmTargetApiService}
              showToast={showToast}
              managerName={user?.name || ''}
            />
          );
        })()}

        {/* ==================== TAB 2: ABM APPROVALS ==================== */}
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
              {/* ── PART 2 Item 10: below-guidance stat card ─────────────────── */}
              {abmsBelowGuidance.length > 0 && (
                <div className="zbm-stat-card" style={{
                  borderLeft: '3px solid #F59E0B',
                  background: '#FFFBEB',
                }}>
                  <div className="zbm-stat-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>
                    <i className="fas fa-exclamation-triangle"></i>
                  </div>
                  <div className="zbm-stat-content">
                    <span className="zbm-stat-value" style={{ color: '#D97706' }}>{abmsBelowGuidance.length}</span>
                    <span className="zbm-stat-label">Below Guidance</span>
                  </div>
                </div>
              )}
              {/* ─────────────────────────────────────────────────────────────── */}
            </div>

            {/* ── PART 2 Item 10: guidance summary banner ──────────────────────── */}
            {abmsBelowGuidance.length > 0 && (
              <div style={{
                margin: '0 0 0 0',
                padding: '0.75rem 1.25rem',
                background: '#FFFBEB',
                borderBottom: '1px solid #FDE68A',
                display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                fontSize: '0.8125rem',
              }}>
                <i className="fas fa-exclamation-triangle" style={{ color: '#D97706', marginTop: '2px', flexShrink: 0 }}></i>
                <div>
                  <div style={{ fontWeight: 700, color: '#92400E', marginBottom: '0.25rem' }}>
                    {abmsBelowGuidance.length} ABM{abmsBelowGuidance.length > 1 ? 's are' : ' is'} below the guidance target
                    ({Math.round(TARGET_THRESHOLDS.GUIDANCE_MIN_PCT * 100)}% of assigned yearly target):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {abmsBelowGuidance.map(abm => {
                      const gs = getAbmGuidanceStatus(abm.id);
                      return (
                        <span key={abm.id} style={{
                          background: '#FEF3C7', border: '1px solid #FDE68A',
                          borderRadius: '20px', padding: '2px 10px',
                          fontSize: '0.75rem', color: '#92400E', fontWeight: 600,
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                        }}>
                          <i className="fas fa-user-tie" style={{ fontSize: '0.6rem' }}></i>
                          {abm.name}
                          <span style={{ color: '#B45309', fontWeight: 500 }}>
                            ({gs?.pct ?? 0}% of target)
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            {/* ─────────────────────────────────────────────────────────────────── */}

            {/* Filters */}
            <div className="zbm-filter-bar">
              <div className="zbm-filter-group">
                <select value={abmFilter} onChange={e => setAbmFilter(e.target.value)} className="zbm-select">
                  <option value="all">All ABMs</option>
                  {uniqueABMs.map(abm => {
                    // ── PART 2 Item 10: append guidance warning to dropdown option ──
                    const gs = getAbmGuidanceStatus(abm.id);
                    const label = `${abm.name} — ${abm.territory}${gs?.isBelowGuidance ? ' ⚠' : ''}`;
                    return <option key={abm.id} value={abm.id}>{label}</option>;
                  })}
                </select>
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="zbm-select">
                  <option value="all">All Categories</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <div className="zbm-search-wrapper">
                  <i className="fas fa-search"></i>
                  <input
                    type="text"
                    className="zbm-search-input"
                    placeholder="Search products, ABMs..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              {filteredSubmissions.filter(s => s.status === 'submitted').length > 0 && (
                <button className="zbm-bulk-approve-btn" onClick={handleBulkApprove}>
                  <i className="fas fa-check-double"></i>
                  Approve All ({filteredSubmissions.filter(s => s.status === 'submitted').length})
                </button>
              )}
            </div>

            {/* Approval Table */}
            {isLoading ? (
              <div className="zbm-loading"><div className="loading-spinner"></div><p>Loading...</p></div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="zbm-empty-state">
                <i className="fas fa-inbox"></i>
                <h3>No submissions found</h3>
                <p>Adjust filters to see ABM submissions.</p>
              </div>
            ) : (
              <div className="zbm-approval-table-wrap">
                <table className="zbm-approval-table">
                  <thead>
                    <tr>
                      <th className="th-sticky">ABM / Product</th>
                      <th className="th-type">Type</th>
                      {MONTH_LABELS.map((ml, i) => (
                        <th key={ml} className={`th-month th-${getQC(i)}`}>{ml}</th>
                      ))}
                      <th className="th-total">Total Qty</th>
                      {/* PART 3 — Item 11: show value alongside qty */}
                      <th className="th-total th-value">CY Value</th>
                      <th className="th-action">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmissions.map(sub => {
                      const isSub = sub.status === 'submitted';
                      const ly    = MONTHS.reduce((s, m) => s + (sub.monthlyTargets?.[m]?.lyQty || 0), 0);
                      const cy    = MONTHS.reduce((s, m) => s + (sub.monthlyTargets?.[m]?.cyQty || 0), 0);

                      // ── PART 2 Item 10: guidance status for this ABM ──────────────
                      const gs = getAbmGuidanceStatus(sub.employeeCode);
                      const showGuidanceBadge = gs?.isBelowGuidance;
                      // ─────────────────────────────────────────────────────────────

                      return (
                        <React.Fragment key={sub.id}>
                          {/* LY Row */}
                          <tr
                            className={isSub ? 'zbm-row-pending' : 'zbm-row-approved'}
                            // ── PART 2 Item 10: highlight entire row group for below-guidance ABMs ──
                            style={showGuidanceBadge ? { background: 'rgba(245,158,11,0.06)' } : {}}
                          >
                            <td className="td-sticky" rowSpan={2} style={showGuidanceBadge ? {
                              borderLeft: '3px solid #F59E0B',
                            } : {}}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <span className="td-abm-name">{sub.employeeName || sub.abmName || '—'}</span>

                                {/* PART 2 Item 10: below-guidance badge — ABM level only, no product detail */}
                                {showGuidanceBadge && (
                                  <span
                                    title={`Submitted ${Utils.formatNumber(gs.cyTotal)} of ${Utils.formatNumber(gs.guidance)} guidance target (${gs.pct}%)`}
                                    style={{
                                      display: 'inline-flex', alignItems: 'center', gap: '3px',
                                      padding: '2px 7px', borderRadius: '12px',
                                      fontSize: '0.6rem', fontWeight: 700,
                                      background: '#FEF3C7', color: '#D97706',
                                      border: '1px solid #FDE68A', whiteSpace: 'nowrap',
                                      cursor: 'help',
                                    }}
                                  >
                                    <i className="fas fa-exclamation-triangle" style={{ fontSize: '0.55rem' }}></i>
                                    Below Guidance · {gs.pct}%
                                  </span>
                                )}
                              </div>
                              <div className="td-product-name">{sub.name || sub.productName}</div>
                            </td>
                            {/* PART 1 — Item 1: consistent label "LY Tgt" */}
                            <td className="td-type"><span className="type-tag ly">LY Tgt</span></td>
                            {MONTHS.map((m, i) => (
                              <td key={m} className={`td-month td-${getQC(i)} td-readonly`}>
                                {Utils.formatNumber(sub.monthlyTargets?.[m]?.lyQty || 0)}
                              </td>
                            ))}
                            <td className="td-total">{Utils.formatNumber(ly)}</td>
                            {/* PART 3 — Item 11: LY Revenue */}
                            <td className="td-total td-value">
                              ₹{Utils.formatCompact(MONTHS.reduce((s, m) => s + (sub.monthlyTargets?.[m]?.lyRev || 0), 0))}
                            </td>
                            <td className="td-action" rowSpan={2}>
                              {isSub ? (
                                <button
                                  className="action-btn-sm approve"
                                  onClick={() => handleApproveABM(sub.id)}
                                  title="Approve"
                                >
                                  <i className="fas fa-check"></i>
                                </button>
                              ) : (
                                <span className="status-tag approved">
                                  <i className="fas fa-check-circle"></i> Approved
                                </span>
                              )}
                            </td>
                          </tr>

                          {/* CY Row */}
                          <tr
                            className={isSub ? 'zbm-row-pending' : 'zbm-row-approved'}
                            style={showGuidanceBadge ? { background: 'rgba(245,158,11,0.06)' } : {}}
                          >
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
                            {/* PART 3 — Item 11: CY Revenue */}
                            <td className="td-total td-value">
                              <strong>₹{Utils.formatCompact(MONTHS.reduce((s, m) => s + (sub.monthlyTargets?.[m]?.cyRev || 0), 0))}</strong>
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ==================== TAB 3: OVERVIEW & SUMMARY ==================== 
        {activeTab === 'overview' && (
          <ZBMOverviewStats
            abmSubmissions={abmSubmissions}
            categories={categories}
            approvalStats={approvalStats}
          />
        )}*/}

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
