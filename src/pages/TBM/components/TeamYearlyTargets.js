/**
 * TeamYearlyTargets Component
 * Shared across TBM, ABM, ZBM, SH roles for setting team members' yearly value targets.
 *
 * PART 1 — Item 1: Consistent label naming ("LY Tgt", "LY Ahv")
 * PART 3 — Item 9:  Target Share % shown on each member card
 * PART 3 — Item 15: Summary breakdown: Sales Rep Target / TBM Target / Others
 *
 * @version 3.0.0 — Part 3 Items 9 & 15
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TBMApiService } from '../../../services/tbmApi';
import { Utils } from '../../../utils/helpers';
import '../../../styles/tbm/teamYearlyTargets.css';

// ─── Role-specific config ────────────────────────────────────────────────────
const ROLE_CONFIG = {
  TBM: {
    accentColor: '#0891B2',
    memberLabel: 'Sales Rep',
    teamLabel: 'Territory Team',
    apiGet: (fy) => TBMApiService.getTeamYearlyTargets(fy),
    apiSave: (data) => TBMApiService.saveTeamYearlyTargets(data),
  },
  ABM: {
    accentColor: '#4F46E5',
    memberLabel: 'TBM',
    teamLabel: 'Area Team',
    apiGet: (fy) => TBMApiService.getTeamYearlyTargets(fy, 'ABM'),
    apiSave: (data) => TBMApiService.saveTeamYearlyTargets(data, 'ABM'),
  },
  ZBM: {
    accentColor: '#7C3AED',
    memberLabel: 'ABM',
    teamLabel: 'Zone Team',
    apiGet: (fy) => TBMApiService.getTeamYearlyTargets(fy, 'ZBM'),
    apiSave: (data) => TBMApiService.saveTeamYearlyTargets(data, 'ZBM'),
  },
  SH: {
    accentColor: '#0C2340',
    memberLabel: 'ZBM',
    teamLabel: 'National Team',
    apiGet: (fy) => TBMApiService.getTeamYearlyTargets(fy, 'SH'),
    apiSave: (data) => TBMApiService.saveTeamYearlyTargets(data, 'SH'),
  },
};

const STATUS_CONFIG = {
  not_set:  { label: 'Not Set',  icon: 'fa-circle',        bg: '#F3F4F6', color: '#6B7280' },
  draft:    { label: 'Draft',    icon: 'fa-edit',           bg: '#FEF3C7', color: '#D97706' },
  set:      { label: 'Set',      icon: 'fa-check-circle',   bg: '#D1FAE5', color: '#059669' },
  locked:   { label: 'Locked',   icon: 'fa-lock',           bg: '#EDE9FE', color: '#7C3AED' },
};

function getGrowthPct(ly, cy) {
  if (!ly || ly === 0) return cy > 0 ? 100 : 0;
  return ((cy - ly) / ly) * 100;
}

function getGrowthClass(pct) {
  if (pct > 15) return 'high';
  if (pct > 0)  return 'positive';
  if (pct === 0) return 'neutral';
  return 'negative';
}

function TeamYearlyTargets({ role = 'TBM', fiscalYear = '2026-27', teamMembers = [], showToast, managerName = '' }) {
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.TBM;

  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedMember, setExpandedMember] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState(new Set());
  const [editingCell, setEditingCell] = useState(null); // { memberId, field }
  const [editValue, setEditValue] = useState('');

  // ─── Load data ───────────────────────────────────────────────────────────
  useEffect(() => {
    loadData();
  }, [fiscalYear]); // eslint-disable-line

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await config.apiGet(fiscalYear);
      // Merge API data with passed teamMembers prop (prop may have more members)
      const merged = teamMembers.map(tm => {
        const found = data.find(d => d.id === tm.id || d.employeeCode === tm.id);
        return found
          ? { ...tm, ...found }
          : { ...tm, lyTargetValue: 0, lyAchievedValue: 0, cyTargetValue: 0, status: 'not_set', categories: [] };
      });
      setMembers(merged.length > 0 ? merged : data);
    } catch (err) {
      console.error(err);
      // Fall back to teamMembers prop with zero values
      setMembers(teamMembers.map(tm => ({
        ...tm,
        lyTargetValue: 0,
        lyAchievedValue: 0,
        cyTargetValue: 0,
        status: 'not_set',
        categories: [],
      })));
    }
    setIsLoading(false);
  };

  // ─── Summary totals ──────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const lyTarget   = members.reduce((s, m) => s + (m.lyTargetValue   || 0), 0);
    const lyAchieved = members.reduce((s, m) => s + (m.lyAchievedValue || 0), 0);
    const cyTarget   = members.reduce((s, m) => s + (m.cyTargetValue   || 0), 0);
    const lyAchPct   = lyTarget > 0 ? Math.round((lyAchieved / lyTarget) * 100) : 0;
    const growthPct  = getGrowthPct(lyTarget, cyTarget);

    // PART 3 — Item 15: breakdown by designation (Sales Rep / TBM / Others)
    const salesRepTarget = members.filter(m => /sales.?rep|sr$/i.test(m.designation || m.role || ''))
      .reduce((s, m) => s + (m.cyTargetValue || 0), 0);
    const tbmTarget = members.filter(m => /^tbm$/i.test(m.designation || m.role || ''))
      .reduce((s, m) => s + (m.cyTargetValue || 0), 0);
    const othersTarget = cyTarget - salesRepTarget - tbmTarget;
    const hasDesignationBreakdown = members.some(m => m.designation || m.role);

    return { lyTarget, lyAchieved, cyTarget, lyAchPct, growthPct,
             salesRepTarget, tbmTarget, othersTarget: Math.max(0, othersTarget), hasDesignationBreakdown };
  }, [members]);

  // ─── Editable cell helpers ───────────────────────────────────────────────
  const startEdit = (memberId, field, currentVal) => {
    setEditingCell({ memberId, field });
    setEditValue(String(currentVal || 0));
  };

  const commitEdit = useCallback(() => {
    if (!editingCell) return;
    const numVal = parseFloat(String(editValue).replace(/[^0-9.]/g, '')) || 0;
    setMembers(prev => prev.map(m =>
      m.id === editingCell.memberId
        ? { ...m, [editingCell.field]: numVal, status: m.status === 'not_set' ? 'draft' : m.status }
        : m
    ));
    setEditingCell(null);
  }, [editingCell, editValue]);

  const renderEditableValueCell = (memberId, field, value) => {
    const isEditing = editingCell?.memberId === memberId && editingCell?.field === field;
    if (isEditing) {
      return (
        <input
          className="tyt-inline-input"
          value={editValue}
          autoFocus
          onChange={e => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingCell(null); }}
        />
      );
    }
    return (
      <span className="tyt-editable-value" onClick={() => startEdit(memberId, field, value)}>
        {Utils.formatShortCurrency(value || 0)}
      </span>
    );
  };

  // ─── Select all helpers ──────────────────────────────────────────────────
  const handleSelectAll = () => {
    if (selectedMembers.size === members.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(members.map(m => m.id)));
    }
  };

  const handleSelectMember = (id) => {
    setSelectedMembers(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  // ─── Save ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await config.apiSave(members.map(m => ({
        id: m.id,
        employeeCode: m.employeeCode || m.id,
        cyTargetValue: m.cyTargetValue || 0,
        fiscalYear,
      })));
      setMembers(prev => prev.map(m => ({ ...m, status: m.cyTargetValue > 0 ? 'set' : m.status })));
      if (showToast) showToast('Saved', 'Yearly targets saved successfully.', 'success');
    } catch (err) {
      if (showToast) showToast('Error', 'Failed to save targets.', 'error');
    }
    setIsSaving(false);
  };

  // ─── Loading ─────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="tyt-container">
        <div className="tyt-loading"><div className="loading-spinner"></div><p>Loading team targets...</p></div>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="tyt-container" style={{ '--accent': config.accentColor }}>

      {/* Header */}
      <div className="tyt-header">
        <div className="tyt-header-left">
          <div className="tyt-header-icon" style={{ background: config.accentColor }}>
            <i className="fas fa-bullseye"></i>
          </div>
          <div>
            <h2 className="tyt-header-title">{config.teamLabel} — Yearly Targets</h2>
            <span className="tyt-header-sub">FY {fiscalYear} · {members.length} {config.memberLabel}s</span>
          </div>
        </div>
        <div className="tyt-header-actions">
          <button className="tyt-save-btn" onClick={handleSave} disabled={isSaving}>
            {isSaving
              ? <><i className="fas fa-spinner fa-spin"></i> Saving…</>
              : <><i className="fas fa-save"></i> Save Targets</>
            }
          </button>
        </div>
      </div>

      {/* Summary Row */}
      <div className="tyt-summary-row">
        {/* PART 1 — Item 1: "LY Tgt" label */}
        <div className="tyt-summary-card tyt-sum-ly-tgt">
          <span className="tyt-sum-label"><i className="fas fa-bullseye"></i> LY Tgt</span>
          <span className="tyt-sum-value">{Utils.formatShortCurrency(totals.lyTarget)}</span>
        </div>
        {/* PART 1 — Item 1: "LY Ahv" label */}
        <div className="tyt-summary-card tyt-sum-ly-ahv">
          <span className="tyt-sum-label"><i className="fas fa-trophy"></i> LY Ahv</span>
          <span className="tyt-sum-value">{Utils.formatShortCurrency(totals.lyAchieved)}</span>
          {/* PART 1 — Item 4: % of LY target achieved */}
          <span className={`tyt-sum-pct ${totals.lyAchPct >= 100 ? 'exceeded' : totals.lyAchPct >= 80 ? 'good' : 'low'}`}>
            {totals.lyAchPct}% of LY Tgt
          </span>
        </div>
        <div className="tyt-summary-card tyt-sum-cy-tgt">
          <span className="tyt-sum-label"><i className="fas fa-flag"></i> CY Tgt <span className="tyt-fy-badge">FY {fiscalYear}</span></span>
          <span className="tyt-sum-value tyt-cy-value">{Utils.formatShortCurrency(totals.cyTarget)}</span>
          {/* PART 1 — Item 4: YoY growth % */}
          {totals.cyTarget > 0 && (
            <span className={`tyt-sum-pct ${totals.growthPct >= 0 ? 'positive' : 'negative'}`}>
              {totals.growthPct >= 0 ? '↑' : '↓'}{Math.abs(totals.growthPct).toFixed(1)}% vs LY Tgt
            </span>
          )}
        </div>
      </div>

      {/* PART 3 — Item 15: Target breakdown by role: Sales Rep / TBM / Others */}
      {totals.cyTarget > 0 && (
        <div className="tyt-breakdown-row">
          <span className="tyt-breakdown-label"><i className="fas fa-layer-group"></i> CY Target Breakdown</span>
          <div className="tyt-breakdown-pills">
            <div className="tyt-breakdown-pill tyt-bdp-salesrep">
              <i className="fas fa-user"></i>
              <span className="tyt-bdp-role">Sales Rep</span>
              <span className="tyt-bdp-value">{Utils.formatShortCurrency(totals.salesRepTarget)}</span>
              <span className="tyt-bdp-pct">{totals.cyTarget > 0 ? Math.round((totals.salesRepTarget / totals.cyTarget) * 100) : 0}%</span>
            </div>
            <div className="tyt-breakdown-pill tyt-bdp-tbm">
              <i className="fas fa-user-tie"></i>
              <span className="tyt-bdp-role">TBM</span>
              <span className="tyt-bdp-value">{Utils.formatShortCurrency(totals.tbmTarget)}</span>
              <span className="tyt-bdp-pct">{totals.cyTarget > 0 ? Math.round((totals.tbmTarget / totals.cyTarget) * 100) : 0}%</span>
            </div>
            <div className="tyt-breakdown-pill tyt-bdp-others">
              <i className="fas fa-users"></i>
              <span className="tyt-bdp-role">Others</span>
              <span className="tyt-bdp-value">{Utils.formatShortCurrency(totals.othersTarget)}</span>
              <span className="tyt-bdp-pct">{totals.cyTarget > 0 ? Math.round((totals.othersTarget / totals.cyTarget) * 100) : 0}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Select all toolbar */}
      {members.length > 0 && (
        <div className="tyt-toolbar">
          <label className="tyt-select-all-wrapper">
            <input
              type="checkbox"
              checked={selectedMembers.size === members.length && members.length > 0}
              onChange={handleSelectAll}
            />
            <span className="tyt-checkbox-custom"></span>
            <span className="tyt-select-all-label">
              {selectedMembers.size === 0 ? `Select all ${members.length}` : `${selectedMembers.size} selected`}
            </span>
          </label>
        </div>
      )}

      {/* Member Cards */}
      <div className="tyt-member-list">
        {members.map(member => {
          const isExpanded = expandedMember === member.id;
          const isSelected = selectedMembers.has(member.id);
          const initials = (member.name || '??').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
          const statusCfg = STATUS_CONFIG[member.status] || STATUS_CONFIG.not_set;
          const lyAchievePct = member.lyTargetValue > 0
            ? Math.round((member.lyAchievedValue / member.lyTargetValue) * 100)
            : 0;

          return (
            <div
              key={member.id}
              className={`tyt-member-card ${isExpanded ? 'expanded' : ''} ${isSelected ? 'selected' : ''}`}
            >
              {/* Card Header */}
              <div className="tyt-card-header">
                <div className="tyt-card-header-left">
                  <label className="tyt-checkbox-wrapper" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectMember(member.id)}
                    />
                    <span className="tyt-checkbox-custom"></span>
                  </label>
                  <div className="tyt-member-avatar" style={{ '--accent': config.accentColor }}>
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
                  <button
                    className="tyt-expand-btn"
                    onClick={() => setExpandedMember(isExpanded ? null : member.id)}
                    title={isExpanded ? 'Collapse' : 'Expand category breakdown'}
                  >
                    <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
                  </button>
                </div>
              </div>

              {/* Main Target Row — 3 columns */}
              <div className="tyt-target-grid">

                {/* PART 1 — Item 1: "LY Tgt" (was "LY Target") */}
                <div className="tyt-target-col tyt-ly-target">
                  <div className="tyt-col-label">
                    <i className="fas fa-bullseye"></i>
                    LY Tgt
                  </div>
                  <div className="tyt-col-values">
                    <div className="tyt-primary-value">{Utils.formatShortCurrency(member.lyTargetValue)}</div>
                  </div>
                </div>

                {/* PART 1 — Item 1: "LY Ahv" (was "LY Achieved") */}
                <div className="tyt-target-col tyt-ly-achieved">
                  <div className="tyt-col-label">
                    <i className="fas fa-trophy"></i>
                    LY Ahv
                  </div>
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
                  {/* PART 1 — Item 4: % of LY Tgt achieved */}
                  <div style={{ fontSize: '0.6875rem', color: '#6B7280', marginTop: '0.25rem' }}>
                    {lyAchievePct >= 100 ? '✓ Target Met' : `${lyAchievePct}% of LY Tgt`}
                  </div>
                </div>

                {/* CY Target (Editable) + Growth Badge */}
                <div className="tyt-target-col tyt-cy-target">
                  <div className="tyt-col-label">
                    <i className="fas fa-flag"></i>
                    CY Tgt <span className="tyt-fy-badge">FY {fiscalYear}</span>
                  </div>
                  <div className="tyt-cy-row">
                    <div className="tyt-cy-input-box">
                      {renderEditableValueCell(member.id, 'cyTargetValue', member.cyTargetValue)}
                    </div>
                    <div className={`tyt-growth-badge ${member.cyTargetValue > 0 ? getGrowthClass(getGrowthPct(member.lyTargetValue, member.cyTargetValue)) : 'waiting'}`}>
                      {member.cyTargetValue > 0 ? (
                        <>
                          <i className={`fas fa-arrow-${getGrowthPct(member.lyTargetValue, member.cyTargetValue) >= 0 ? 'up' : 'down'}`}></i>
                          {/* PART 1 — Item 4: growth % vs LY Tgt */}
                          <span className="tyt-growth-num">
                            {getGrowthPct(member.lyTargetValue, member.cyTargetValue) >= 0 ? '+' : ''}
                            {getGrowthPct(member.lyTargetValue, member.cyTargetValue).toFixed(1)}% vs LY Tgt
                          </span>
                        </>
                      ) : (
                        <span className="tyt-growth-waiting">Enter target</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* PART 3 — Item 9: Target Share % of team total */}
                <div className="tyt-target-col tyt-target-share">
                  <div className="tyt-col-label">
                    <i className="fas fa-chart-pie"></i>
                    Team Share
                  </div>
                  <div className="tyt-col-values">
                    {totals.cyTarget > 0 && member.cyTargetValue > 0 ? (
                      <>
                        <div className="tyt-share-pct">
                          {((member.cyTargetValue / totals.cyTarget) * 100).toFixed(1)}%
                        </div>
                        <div className="tyt-share-bar-wrap">
                          <div className="tyt-share-bar">
                            <div
                              className="tyt-share-bar-fill"
                              style={{ width: `${Math.min((member.cyTargetValue / totals.cyTarget) * 100, 100)}%`, background: config.accentColor }}
                            ></div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <span className="tyt-share-empty">—</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded: category breakdown */}
              {isExpanded && member.categories && member.categories.length > 0 && (
                <div className="tyt-category-breakdown">
                  <div className="tyt-category-header">
                    <span>Category</span>
                    {/* PART 1 — Item 1: consistent column headers */}
                    <span>LY Tgt</span>
                    <span>LY Ahv</span>
                    <span>CY Tgt</span>
                    {/* PART 1 — Item 4: growth % column */}
                    <span>Growth %</span>
                  </div>
                  {member.categories.map(cat => {
                    const catGrowth = getGrowthPct(cat.lyTarget || 0, cat.cyTarget || 0);
                    const catAchPct = cat.lyTarget > 0 ? Math.round(((cat.lyAchieved || 0) / cat.lyTarget) * 100) : 0;
                    return (
                      <div key={cat.id} className="tyt-category-row">
                        <span className="tyt-cat-name">
                          <i className={`fas ${cat.icon || 'fa-tag'}`}></i> {cat.name}
                        </span>
                        <span className="tyt-cat-val">{Utils.formatShortCurrency(cat.lyTarget || 0)}</span>
                        <span className="tyt-cat-val">
                          {Utils.formatShortCurrency(cat.lyAchieved || 0)}
                          {cat.lyTarget > 0 && (
                            <span style={{ fontSize: '0.625rem', color: '#6B7280', marginLeft: '3px' }}>
                              ({catAchPct}%)
                            </span>
                          )}
                        </span>
                        <span className="tyt-cat-val tyt-cat-cy">
                          {renderEditableValueCell(member.id, `cat_${cat.id}`, cat.cyTarget || 0)}
                        </span>
                        {/* PART 1 — Item 4: growth % per category */}
                        <span className={`tyt-cat-growth ${catGrowth >= 0 ? 'positive' : 'negative'}`}>
                          {catGrowth >= 0 ? '↑' : '↓'}{Math.abs(catGrowth).toFixed(1)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Quick actions */}
              <div className="tyt-quick-actions">
                <button className="tyt-quick-btn" onClick={() => startEdit(member.id, 'cyTargetValue', member.cyTargetValue)}>
                  <i className="fas fa-edit"></i> Edit Target
                </button>
                {member.lyTargetValue > 0 && (
                  <button
                    className="tyt-quick-btn"
                    onClick={() => {
                      const suggested = Math.round(member.lyTargetValue * 1.10);
                      setMembers(prev => prev.map(m =>
                        m.id === member.id ? { ...m, cyTargetValue: suggested, status: 'draft' } : m
                      ));
                    }}
                    title="Set CY target to LY + 10%"
                  >
                    <i className="fas fa-magic"></i> +10% vs LY Tgt
                  </button>
                )}
                {member.lyAchievedValue > 0 && (
                  <button
                    className="tyt-quick-btn"
                    onClick={() => {
                      const suggested = Math.round(member.lyAchievedValue * 1.10);
                      setMembers(prev => prev.map(m =>
                        m.id === member.id ? { ...m, cyTargetValue: suggested, status: 'draft' } : m
                      ));
                    }}
                    title="Set CY target to LY Achievement + 10%"
                  >
                    <i className="fas fa-chart-line"></i> +10% vs LY Ahv
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {members.length === 0 && (
        <div className="tyt-empty">
          <i className="fas fa-users-slash"></i>
          <h3>No team members found</h3>
          <p>Team members will appear here once added to the system.</p>
        </div>
      )}
    </div>
  );
}

export default TeamYearlyTargets;
