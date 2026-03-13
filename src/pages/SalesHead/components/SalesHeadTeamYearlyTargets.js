import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Utils } from '../../../utils/helpers';
import SalesHeadApiService from '../../../services/salesHeadApi';
import '../../../styles/tbm/teamYearlyTargets.css';

const CONFIG = {
  title: 'Team Yearly Targets',
  subtitle: 'Set yearly targets for your Zonal Business Managers',
  memberLabel: 'ZBM',
  membersLabel: 'ZBMs',
  publishLabel: 'Publish to ZBMs',
  publishConfirm: 'Publish targets to selected ZBMs? They will see these as their assigned yearly targets.',
  icon: 'fa-users-cog',
  accentColor: '#0097A7',
};

const STATUS_CONFIG = {
  not_set:   { label: 'Not Set',   icon: 'fa-minus-circle', color: '#9CA3AF', bg: '#F3F4F6' },
  draft:     { label: 'Draft',     icon: 'fa-pencil-alt',   color: '#F59E0B', bg: '#FEF3C7' },
  published: { label: 'Published', icon: 'fa-check-circle', color: '#10B981', bg: '#D1FAE5' },
};

const perCardStyles = `
  .tyt-card-footer-actions { display:flex; gap:0.5rem; padding:0.625rem 1rem 0.75rem; border-top:1px solid #F3F4F6; justify-content:flex-end; }
  .tyt-card-btn { display:inline-flex; align-items:center; gap:0.375rem; padding:0.4rem 0.875rem; border-radius:6px; font-size:0.8125rem; font-weight:600; cursor:pointer; border:1.5px solid transparent; transition:all 0.15s; }
  .tyt-card-btn:disabled { opacity:0.45; cursor:not-allowed; }
  .tyt-card-save-btn { background:#F3F4F6; border-color:#D1D5DB; color:#374151; }
  .tyt-card-save-btn:not(:disabled):hover { background:#E5E7EB; border-color:#9CA3AF; }
  .tyt-card-publish-btn { background:#00A19B; border-color:#00A19B; color:#fff; }
  .tyt-card-publish-btn:not(:disabled):hover { background:#00857F; border-color:#00857F; }
`;
if (typeof document !== 'undefined' && !document.getElementById('sh-tyt-card-style')) {
  const s = document.createElement('style');
  s.id = 'sh-tyt-card-style';
  s.textContent = perCardStyles;
  document.head.appendChild(s);
}

function SalesHeadTeamYearlyTargets({ showToast }) {
  const [members, setMembers]                   = useState([]);
  const [isLoading, setIsLoading]               = useState(true);
  const [isSaving, setIsSaving]                 = useState(false);
  const [isPublishing, setIsPublishing]         = useState(false);
  const [savingMemberId, setSavingMemberId]     = useState(null);
  const [publishingMemberId, setPublishingMemberId] = useState(null);
  const [selectedMembers, setSelectedMembers]   = useState(new Set());
  const [editingCell, setEditingCell]           = useState(null);
  const [editValue, setEditValue]               = useState('');
  const [searchTerm, setSearchTerm]             = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { loadTargets(); }, []);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const loadTargets = async () => {
    setIsLoading(true);
    try {
      const data = await SalesHeadApiService.getTeamYearlyTargets();
      console.log('[SH-TYT] getTeamYearlyTargets response:', data);
      const mapped = (data?.members || []).map((m) => ({
        id: m.employeeCode,
        name: m.fullName || m.employeeCode,
        territory: m.zone || m.designation || 'ZBM',
        designation: m.designation || 'Zonal Business Manager',
        lyTargetValue: m.lyTarget || 0,
        lyAchievedValue: m.lyAchieved || 0,
        cyTargetValue: m.cyTargetValue || 0,
        status: m.status || 'not_set',
        lastUpdated: null,
      }));
      setMembers(mapped);
    } catch (err) {
      console.error('[SH-TYT] load error:', err);
      showToast?.('Error', 'Failed to load ZBM targets.', 'error');
    }
    setIsLoading(false);
  };

  // ── Filtered / sorted list ──────────────────────────────────────────────
  const filteredMembers = useMemo(() => {
    if (!searchTerm.trim()) return [...members];
    const term = searchTerm.toLowerCase();
    return members.filter(m =>
      m.name.toLowerCase().includes(term) ||
      (m.territory || '').toLowerCase().includes(term)
    );
  }, [members, searchTerm]);

  // ── Summary strip ───────────────────────────────────────────────────────
  const teamSummary = useMemo(() => {
    const total              = members.length;
    const setCount           = members.filter(m => m.cyTargetValue > 0).length;
    const publishedCount     = members.filter(m => m.status === 'published').length;
    const totalLyTargetValue = members.reduce((s, m) => s + (m.lyTargetValue || 0), 0);
    const totalLyAchievedValue = members.reduce((s, m) => s + (m.lyAchievedValue || 0), 0);
    const totalCyTargetValue = members.reduce((s, m) => s + (m.cyTargetValue || 0), 0);
    const overallLyGrowth    = totalLyTargetValue > 0
      ? ((totalLyAchievedValue - totalLyTargetValue) / totalLyTargetValue) * 100 : 0;
    return {
      total, setCount, publishedCount,
      totalLyTargetValue, totalLyAchievedValue, totalCyTargetValue,
      overallLyGrowth,
      completionPct: total > 0 ? Math.round((setCount / total) * 100) : 0,
    };
  }, [members]);

  // ── Inline edit helpers ─────────────────────────────────────────────────
  const handleTargetChange = useCallback((memberId, value) => {
    const rupees = Math.round((parseFloat(value) || 0) * 10000000);
    setMembers(prev => prev.map(m => m.id === memberId
      ? { ...m, cyTargetValue: rupees, status: rupees > 0 ? 'draft' : 'not_set' }
      : m
    ));
    setHasUnsavedChanges(true);
  }, []);

  const handleEditStart = useCallback((memberId, currentRupees) => {
    setEditingCell(memberId);
    setEditValue(currentRupees > 0 ? parseFloat((currentRupees / 10000000).toFixed(4)) : '');
  }, []);

  const handleEditComplete = useCallback(() => {
    if (editingCell != null) handleTargetChange(editingCell, editValue);
    setEditingCell(null);
    setEditValue('');
  }, [editingCell, editValue, handleTargetChange]);

  const handleEditKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); handleEditComplete(); }
    else if (e.key === 'Escape') { setEditingCell(null); setEditValue(''); }
  }, [handleEditComplete]);

  // ── Select helpers ──────────────────────────────────────────────────────
  const handleSelectMember = useCallback((id) => {
    setSelectedMembers(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedMembers.size === filteredMembers.length) setSelectedMembers(new Set());
    else setSelectedMembers(new Set(filteredMembers.map(m => m.id)));
  }, [selectedMembers.size, filteredMembers]);

  // ── Bulk Save Draft ─────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    const targets = members
      .filter(m => m.cyTargetValue > 0)
      .map(m => ({ employeeCode: m.id, yearlyTarget: m.cyTargetValue, status: 'draft' }));
    if (targets.length === 0) { showToast?.('Warning', 'No targets to save.', 'warning'); return; }
    setIsSaving(true);
    try {
      await SalesHeadApiService.saveTeamYearlyTargets(targets);
      setHasUnsavedChanges(false);
      showToast?.('Saved', 'Yearly targets saved as draft.', 'success');
    } catch (err) {
      console.error('[SH-TYT] save error:', err);
      showToast?.('Error', 'Failed to save targets.', 'error');
    }
    setIsSaving(false);
  }, [members, showToast]);

  // ── Bulk Publish ────────────────────────────────────────────────────────
  const handlePublish = useCallback(() => {
    if (selectedMembers.size === 0) {
      showToast?.('Warning', 'Please select at least one ZBM to publish.', 'warning');
      return;
    }
    setShowPublishConfirm(true);
  }, [selectedMembers.size, showToast]);

  const confirmPublish = useCallback(async () => {
    setIsPublishing(true);
    setShowPublishConfirm(false);
    try {
      const memberIds = Array.from(selectedMembers);
      const targets = members
        .filter(m => memberIds.includes(m.id) && m.cyTargetValue > 0)
        .map(m => ({ employeeCode: m.id, yearlyTarget: m.cyTargetValue, status: 'published' }));
      await SalesHeadApiService.saveTeamYearlyTargets(targets);
      setMembers(prev => prev.map(m =>
        selectedMembers.has(m.id) ? { ...m, status: 'published' } : m
      ));
      setSelectedMembers(new Set());
      setHasUnsavedChanges(false);
      showToast?.('Published', `Targets published to ${memberIds.length} ZBMs.`, 'success');
    } catch (err) {
      console.error('[SH-TYT] publish error:', err);
      showToast?.('Error', 'Failed to publish targets.', 'error');
    }
    setIsPublishing(false);
  }, [selectedMembers, members, showToast]);

  // ── Per-card Save ───────────────────────────────────────────────────────
  const handleSaveMember = useCallback(async (memberId) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    setSavingMemberId(memberId);
    try {
      await SalesHeadApiService.saveTeamYearlyTargets([
        { employeeCode: memberId, yearlyTarget: member.cyTargetValue, status: 'draft' }
      ]);
      setMembers(prev => prev.map(m =>
        m.id === memberId && m.status === 'not_set' ? { ...m, status: 'draft' } : m
      ));
      showToast?.('Saved', `Target saved for ${member.name}.`, 'success');
    } catch (err) {
      showToast?.('Error', 'Failed to save target.', 'error');
    }
    setSavingMemberId(null);
  }, [members, showToast]);

  // ── Per-card Publish ────────────────────────────────────────────────────
  const handlePublishMember = useCallback(async (memberId) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    if (!member.cyTargetValue || member.cyTargetValue <= 0) {
      showToast?.('Warning', `Please enter a CY target for ${member.name} before publishing.`, 'warning');
      return;
    }
    setPublishingMemberId(memberId);
    try {
      await SalesHeadApiService.saveTeamYearlyTargets([
        { employeeCode: memberId, yearlyTarget: member.cyTargetValue, status: 'published' }
      ]);
      setMembers(prev => prev.map(m =>
        m.id === memberId ? { ...m, status: 'published' } : m
      ));
      showToast?.('Published', `Target published to ${member.name}.`, 'success');
    } catch (err) {
      showToast?.('Error', 'Failed to publish target.', 'error');
    }
    setPublishingMemberId(null);
  }, [members, showToast]);

  // ── Helpers ─────────────────────────────────────────────────────────────
  const getAchievementPct = (achieved, target) =>
    !target || target === 0 ? 0 : Math.round((achieved / target) * 100);

  const getGrowthPct = (ly, cy) => {
    if (!ly || ly === 0) return cy > 0 ? 100 : 0;
    return ((cy - ly) / ly) * 100;
  };

  const getGrowthClass = (pct) => pct > 5 ? 'positive' : pct < -5 ? 'negative' : 'neutral';

  // ── Editable value cell ──────────────────────────────────────────────────
  const renderEditableValueCell = (memberId, value) => {
    if (editingCell === memberId) {
      return (
        <input
          ref={inputRef}
          type="number"
          className="tyt-inline-input"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleEditComplete}
          onKeyDown={handleEditKeyDown}
          min="0"
          step="0.01"
          placeholder="Enter in Crores"
        />
      );
    }
    return (
      <span
        className={`tyt-editable-value ${value > 0 ? 'tyt-has-value' : 'tyt-empty-target'}`}
        onClick={() => handleEditStart(memberId, value)}
        title="Click to edit (enter value in Crores)"
      >
        {value > 0 ? Utils.formatShortCurrency(value) : '₹ Enter Target'}
      </span>
    );
  };

  // ── Member card ──────────────────────────────────────────────────────────
  const renderMemberCard = (member) => {
    const lyAchievePct = getAchievementPct(member.lyAchievedValue, member.lyTargetValue);
    const statusCfg    = STATUS_CONFIG[member.status] || STATUS_CONFIG.not_set;
    const isSelected   = selectedMembers.has(member.id);
    const initials     = Utils.getInitials ? Utils.getInitials(member.name)
      : (member.name || '?').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    return (
      <div key={member.id} className={`tyt-member-card ${isSelected ? 'selected' : ''}`}>
        {/* Card header */}
        <div className="tyt-card-header">
          <div className="tyt-card-header-left">
            <label className="tyt-checkbox-wrapper" onClick={(e) => e.stopPropagation()}>
              <input type="checkbox" checked={isSelected} onChange={() => handleSelectMember(member.id)} />
              <span className="tyt-checkbox-custom"></span>
            </label>
            <div className="tyt-member-avatar" style={{ '--accent': CONFIG.accentColor }}>
              {initials}
            </div>
            <div className="tyt-member-info">
              <h3 className="tyt-member-name">{member.name}</h3>
              <span className="tyt-member-territory">
                <i className="fas fa-map-marker-alt"></i> {member.territory}
              </span>
            </div>
          </div>
          <div className="tyt-card-header-right">
            <span className="tyt-status-badge" style={{ background: statusCfg.bg, color: statusCfg.color }}>
              <i className={`fas ${statusCfg.icon}`}></i>
              {statusCfg.label}
            </span>
          </div>
        </div>

        {/* Target grid */}
        <div className="tyt-target-grid">
          {/* LY Target */}
          <div className="tyt-target-col tyt-ly-target">
            <div className="tyt-col-label"><i className="fas fa-bullseye"></i> LY Tgt</div>
            <div className="tyt-col-values">
              <div className="tyt-primary-value">{Utils.formatShortCurrency(member.lyTargetValue)}</div>
            </div>
          </div>

          {/* LY Achieved */}
          <div className="tyt-target-col tyt-ly-achieved">
            <div className="tyt-col-label"><i className="fas fa-trophy"></i> LY Ahv</div>
            <div className="tyt-col-values">
              <div className="tyt-primary-value">{Utils.formatShortCurrency(member.lyAchievedValue)}</div>
            </div>
            <div className="tyt-achievement-bar-wrapper">
              <div className="tyt-achievement-bar">
                <div
                  className={`tyt-achievement-fill ${lyAchievePct >= 100 ? 'exceeded' : lyAchievePct >= 80 ? 'good' : 'low'}`}
                  style={{ width: `${Math.min(lyAchievePct, 100)}%` }}
                ></div>
              </div>
              <span className={`tyt-achievement-pct ${lyAchievePct >= 100 ? 'exceeded' : lyAchievePct >= 80 ? 'good' : 'low'}`}>
                {lyAchievePct}%
              </span>
            </div>
          </div>

          {/* CY Target */}
          <div className="tyt-target-col tyt-cy-target">
            <div className="tyt-col-label">
              <i className="fas fa-flag"></i>
              CY Target <span className="tyt-fy-badge">FY 2026-27</span>
            </div>
            <div className="tyt-cy-row">
              <div className="tyt-cy-input-box">
                {renderEditableValueCell(member.id, member.cyTargetValue)}
              </div>
              <div className={`tyt-growth-badge ${member.cyTargetValue > 0 ? getGrowthClass(getGrowthPct(member.lyTargetValue, member.cyTargetValue)) : 'waiting'}`}>
                {member.cyTargetValue > 0 ? (
                  <>
                    <i className={`fas fa-arrow-${getGrowthPct(member.lyTargetValue, member.cyTargetValue) >= 0 ? 'up' : 'down'}`}></i>
                    <span className="tyt-growth-num">
                      {getGrowthPct(member.lyTargetValue, member.cyTargetValue) >= 0 ? '+' : ''}
                      {getGrowthPct(member.lyTargetValue, member.cyTargetValue).toFixed(1)}%
                    </span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-percentage"></i>
                    <span className="tyt-growth-num">—</span>
                  </>
                )}
                <span className="tyt-growth-vs">vs LY</span>
              </div>
            </div>
          </div>
        </div>

        {/* Per-card Save / Publish */}
        <div className="tyt-card-footer-actions">
          <button
            className="tyt-card-btn tyt-card-save-btn"
            onClick={(e) => { e.stopPropagation(); handleSaveMember(member.id); }}
            disabled={savingMemberId === member.id || member.status === 'published'}
            title={member.status === 'published' ? 'Already published' : 'Save as draft'}
          >
            {savingMemberId === member.id
              ? <><i className="fas fa-spinner fa-spin"></i> Saving…</>
              : <><i className="fas fa-save"></i> Save</>}
          </button>
          <button
            className="tyt-card-btn tyt-card-publish-btn"
            onClick={(e) => { e.stopPropagation(); handlePublishMember(member.id); }}
            disabled={publishingMemberId === member.id || member.status === 'published' || !member.cyTargetValue}
            title={member.status === 'published' ? 'Already published' : !member.cyTargetValue ? 'Enter a CY target first' : `Publish to ${member.name}`}
          >
            {publishingMemberId === member.id
              ? <><i className="fas fa-spinner fa-spin"></i> Publishing…</>
              : member.status === 'published'
              ? <><i className="fas fa-check-circle"></i> Published</>
              : <><i className="fas fa-paper-plane"></i> Publish</>}
          </button>
        </div>
      </div>
    );
  };

  // ── Loading ─────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="tyt-container">
        <div className="tyt-loading">
          <div className="tyt-loading-spinner"></div>
          <p>Loading yearly targets...</p>
        </div>
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────
  return (
    <div className="tyt-container">
      {/* Header */}
      <div className="tyt-header" style={{ '--role-accent': CONFIG.accentColor }}>
        <div className="tyt-header-top">
          <div className="tyt-header-title">
            <i className={`fas ${CONFIG.icon}`}></i>
            <div>
              <h2>{CONFIG.title}</h2>
              <p>{CONFIG.subtitle}</p>
            </div>
          </div>
          <div className="tyt-header-actions">
            {hasUnsavedChanges && (
              <span className="tyt-unsaved-indicator">
                <i className="fas fa-circle"></i> Unsaved changes
              </span>
            )}
            <button
              className="tyt-action-btn tyt-save-btn"
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
            >
              {isSaving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
              Save Draft
            </button>
            <button
              className="tyt-action-btn tyt-publish-btn"
              onClick={handlePublish}
              disabled={isPublishing || selectedMembers.size === 0}
            >
              {isPublishing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
              {CONFIG.publishLabel}
              {selectedMembers.size > 0 && <span className="tyt-btn-count">{selectedMembers.size}</span>}
            </button>
          </div>
        </div>

        {/* Summary strip */}
        <div className="tyt-summary-strip">
          <div className="tyt-summary-item">
            <span className="tyt-summary-label">Team Size</span>
            <span className="tyt-summary-value">{teamSummary.total} {CONFIG.membersLabel}</span>
          </div>
          <div className="tyt-summary-divider"></div>
          <div className="tyt-summary-item">
            <span className="tyt-summary-label">Targets Set</span>
            <span className="tyt-summary-value">
              {teamSummary.setCount}/{teamSummary.total}
              <span className="tyt-summary-pct">{teamSummary.completionPct}%</span>
            </span>
          </div>
          <div className="tyt-summary-divider"></div>
          <div className="tyt-summary-item">
            <span className="tyt-summary-label">LY Total Tgt</span>
            <span className="tyt-summary-value">{Utils.formatShortCurrency(teamSummary.totalLyTargetValue)}</span>
          </div>
          <div className="tyt-summary-divider"></div>
          <div className="tyt-summary-item">
            <span className="tyt-summary-label">LY Total Ahv</span>
            <span className="tyt-summary-value">
              {Utils.formatShortCurrency(teamSummary.totalLyAchievedValue)}
              <span className={`tyt-summary-growth ${getGrowthClass(teamSummary.overallLyGrowth)}`}>
                {teamSummary.overallLyGrowth >= 0 ? '+' : ''}{teamSummary.overallLyGrowth.toFixed(1)}%
              </span>
            </span>
          </div>
          <div className="tyt-summary-divider"></div>
          <div className="tyt-summary-item tyt-summary-highlight">
            <span className="tyt-summary-label">CY Total Target</span>
            <span className="tyt-summary-value">
              {Utils.formatShortCurrency(teamSummary.totalCyTargetValue)}
              {teamSummary.totalCyTargetValue > 0 && (
                <span className={`tyt-summary-growth ${getGrowthClass(getGrowthPct(teamSummary.totalLyTargetValue, teamSummary.totalCyTargetValue))}`}>
                  {getGrowthPct(teamSummary.totalLyTargetValue, teamSummary.totalCyTargetValue) >= 0 ? '+' : ''}
                  {Math.abs(getGrowthPct(teamSummary.totalLyTargetValue, teamSummary.totalCyTargetValue)).toFixed(1)}% vs LY
                </span>
              )}
            </span>
          </div>
          <div className="tyt-summary-divider"></div>
          <div className="tyt-summary-item">
            <span className="tyt-summary-label">Published</span>
            <span className="tyt-summary-value">{teamSummary.publishedCount}/{teamSummary.total}</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="tyt-toolbar">
        <div className="tyt-toolbar-left">
          <label className="tyt-checkbox-wrapper tyt-select-all" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={selectedMembers.size === filteredMembers.length && filteredMembers.length > 0}
              onChange={handleSelectAll}
            />
            <span className="tyt-checkbox-custom"></span>
            <span className="tyt-select-all-label">
              {selectedMembers.size > 0 ? `${selectedMembers.size} selected` : 'Select all'}
            </span>
          </label>
          <div className="tyt-search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search ZBMs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="tyt-search-clear" onClick={() => setSearchTerm('')}>
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Members list */}
      <div className="tyt-members-list">
        {filteredMembers.length === 0 ? (
          <div className="tyt-empty-state">
            <i className="fas fa-users-slash"></i>
            <h3>No ZBMs Found</h3>
            <p>{searchTerm
              ? `No results matching "${searchTerm}". Try a different search.`
              : 'No team members available. Please check your team configuration.'
            }</p>
          </div>
        ) : (
          filteredMembers.map(renderMemberCard)
        )}
      </div>

      {/* Footer */}
      <div className="tyt-footer">
        <div className="tyt-footer-hints">
          <span><i className="fas fa-mouse-pointer"></i> Click target values to edit inline</span>
          <span><i className="fas fa-check-square"></i> Select ZBMs then use Publish to ZBMs</span>
        </div>
      </div>

      {/* Publish confirm modal */}
      {showPublishConfirm && (
        <div className="tyt-modal-overlay" onClick={() => setShowPublishConfirm(false)}>
          <div className="tyt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tyt-modal-header">
              <i className="fas fa-paper-plane"></i>
              <h3>{CONFIG.publishLabel}</h3>
            </div>
            <div className="tyt-modal-body">
              <p>{CONFIG.publishConfirm}</p>
              <div className="tyt-modal-selected-list">
                {Array.from(selectedMembers).map(id => {
                  const m = members.find(mem => mem.id === id);
                  return m ? (
                    <div key={id} className="tyt-modal-member-row">
                      <span className="tyt-modal-member-name">{m.name}</span>
                      <span className="tyt-modal-member-target">{Utils.formatShortCurrency(m.cyTargetValue)}</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
            <div className="tyt-modal-actions">
              <button className="tyt-modal-btn tyt-modal-cancel" onClick={() => setShowPublishConfirm(false)}>
                Cancel
              </button>
              <button className="tyt-modal-btn tyt-modal-confirm" onClick={confirmPublish}>
                <i className="fas fa-paper-plane"></i> Confirm & Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SalesHeadTeamYearlyTargets;
