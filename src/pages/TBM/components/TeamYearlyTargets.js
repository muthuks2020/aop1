/**
 * TeamYearlyTargets Component (Reusable)
 * 
 * A user-friendly yearly target setting screen where managers (TBM/ABM/ZBM)
 * can set yearly targets for all their team members. Shows Last Year Target
 * and Last Year Achieved alongside each member for informed decision-making.
 * 
 * USAGE:
 *   <TeamYearlyTargets
 *     role="TBM"                          // "TBM" | "ABM" | "ZBM"
 *     fiscalYear="2026-27"
 *     teamMembers={[...]}                 // Array of team member objects
 *     apiService={TeamTargetApiService}   // API service with required methods
 *     showToast={showToast}               // Toast notification function
 *     managerName="Rajesh Kumar"          // Current manager name
 *   />
 * 
 * REQUIRED API SERVICE METHODS:
 *   - getYearlyTargets(fiscalYear)        → { members: [...] }
 *   - saveYearlyTargets(fiscalYear, data) → { success: boolean }
 *   - publishYearlyTargets(fiscalYear, memberIds) → { success: boolean }
 * 
 * @author Appasamy Associates - Product Commitment PWA
 * @version 1.0.0 - Production Ready
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Utils } from '../../../utils/helpers';
import '../../../styles/tbm/teamYearlyTargets.css';

// ==================== CONSTANTS ====================

const ROLE_CONFIG = {
  TBM: {
    title: 'Team Yearly Targets',
    subtitle: 'Set yearly targets for your Sales Representatives',
    memberLabel: 'Sales Rep',
    membersLabel: 'Sales Reps',
    publishLabel: 'Publish to Sales Reps',
    publishConfirm: 'Publish targets to selected Sales Reps? They will see these as their assigned yearly targets.',
    icon: 'fa-users-cog',
    accentColor: '#00A19B',
    reportingTo: 'ABM',
  },
  ABM: {
    title: 'Territory Yearly Targets',
    subtitle: 'Set yearly targets for your Territory Business Managers',
    memberLabel: 'TBM',
    membersLabel: 'TBMs',
    publishLabel: 'Publish to TBMs',
    publishConfirm: 'Publish targets to selected TBMs? They will see these as their assigned yearly targets.',
    icon: 'fa-sitemap',
    accentColor: '#3B82F6',
    reportingTo: 'ZBM',
  },
  ZBM: {
    title: 'Zone Yearly Targets',
    subtitle: 'Set yearly targets for your Area Business Managers',
    memberLabel: 'ABM',
    membersLabel: 'ABMs',
    publishLabel: 'Publish to ABMs',
    publishConfirm: 'Publish targets to selected ABMs? They will see these as their assigned yearly targets.',
    icon: 'fa-globe-asia',
    accentColor: '#8B5CF6',
    reportingTo: 'NSM',
  },
};

const STATUS_CONFIG = {
  not_set: { label: 'Not Set', icon: 'fa-minus-circle', color: '#9CA3AF', bg: '#F3F4F6' },
  draft: { label: 'Draft', icon: 'fa-pencil-alt', color: '#F59E0B', bg: '#FEF3C7' },
  published: { label: 'Published', icon: 'fa-check-circle', color: '#10B981', bg: '#D1FAE5' },
};

function TeamYearlyTargets({
  role = 'TBM',
  fiscalYear = '2026-27',
  teamMembers = [],
  apiService,
  showToast,
  managerName = '',
}) {
  // ==================== STATE ====================
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState(new Set());
  const [expandedMember, setExpandedMember] = useState(null);
  const [editingCell, setEditingCell] = useState(null); // { memberId, field }
  const [editValue, setEditValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name' | 'territory' | 'lyAchieved' | 'growth'
  const [sortDir, setSortDir] = useState('asc');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  
  const inputRef = useRef(null);
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.TBM;

  // ==================== BUILT-IN MOCK DATA ====================
  // Used when no apiService is provided (development/demo mode)

  const BUILTIN_MOCK_MEMBERS = useMemo(() => [
    {
      id: 1, name: 'Vasanthakumar C', territory: 'Central Delhi', designation: 'Sales Rep',
      lyTarget: 24500, lyAchieved: 22180, lyTargetValue: 8750000, lyAchievedValue: 7920000,
      cyTarget: 0, cyTargetValue: 0, status: 'not_set', lastUpdated: null,
      categoryBreakdown: [
        { id: 'equipment', name: 'Equipment', lyTarget: 1800, lyAchieved: 1650, lyTargetValue: 4200000, lyAchievedValue: 3850000, cyTarget: 0, cyTargetValue: 0 },
        { id: 'iol', name: 'IOL', lyTarget: 12000, lyAchieved: 11200, lyTargetValue: 2800000, lyAchievedValue: 2600000, cyTarget: 0, cyTargetValue: 0 },
        { id: 'ovd', name: 'OVD', lyTarget: 7500, lyAchieved: 6800, lyTargetValue: 1200000, lyAchievedValue: 1050000, cyTarget: 0, cyTargetValue: 0 },
        { id: 'mis', name: 'MIS', lyTarget: 2200, lyAchieved: 1780, lyTargetValue: 400000, lyAchievedValue: 320000, cyTarget: 0, cyTargetValue: 0 },
        { id: 'others', name: 'Others', lyTarget: 1000, lyAchieved: 750, lyTargetValue: 150000, lyAchievedValue: 100000, cyTarget: 0, cyTargetValue: 0 },
      ],
    },
    {
      id: 6, name: 'Arun Sharma', territory: 'South Delhi', designation: 'Sales Rep',
      lyTarget: 28000, lyAchieved: 30100, lyTargetValue: 10200000, lyAchievedValue: 11050000,
      cyTarget: 0, cyTargetValue: 0, status: 'not_set', lastUpdated: null,
      categoryBreakdown: [
        { id: 'equipment', name: 'Equipment', lyTarget: 2200, lyAchieved: 2500, lyTargetValue: 5100000, lyAchievedValue: 5800000, cyTarget: 0, cyTargetValue: 0 },
        { id: 'iol', name: 'IOL', lyTarget: 14000, lyAchieved: 15200, lyTargetValue: 3200000, lyAchievedValue: 3500000, cyTarget: 0, cyTargetValue: 0 },
        { id: 'ovd', name: 'OVD', lyTarget: 8500, lyAchieved: 9000, lyTargetValue: 1400000, lyAchievedValue: 1300000, cyTarget: 0, cyTargetValue: 0 },
        { id: 'mis', name: 'MIS', lyTarget: 2500, lyAchieved: 2600, lyTargetValue: 350000, lyAchievedValue: 300000, cyTarget: 0, cyTargetValue: 0 },
        { id: 'others', name: 'Others', lyTarget: 800, lyAchieved: 800, lyTargetValue: 150000, lyAchievedValue: 150000, cyTarget: 0, cyTargetValue: 0 },
      ],
    },
    {
      id: 11, name: 'Meera Krishnan', territory: 'East Delhi', designation: 'Sales Rep',
      lyTarget: 18500, lyAchieved: 15200, lyTargetValue: 6200000, lyAchievedValue: 5100000,
      cyTarget: 0, cyTargetValue: 0, status: 'not_set', lastUpdated: null,
      categoryBreakdown: [
        { id: 'equipment', name: 'Equipment', lyTarget: 1200, lyAchieved: 950, lyTargetValue: 2800000, lyAchievedValue: 2200000, cyTarget: 0, cyTargetValue: 0 },
        { id: 'iol', name: 'IOL', lyTarget: 9500, lyAchieved: 7800, lyTargetValue: 2200000, lyAchievedValue: 1800000, cyTarget: 0, cyTargetValue: 0 },
        { id: 'ovd', name: 'OVD', lyTarget: 5500, lyAchieved: 4600, lyTargetValue: 850000, lyAchievedValue: 750000, cyTarget: 0, cyTargetValue: 0 },
        { id: 'mis', name: 'MIS', lyTarget: 1800, lyAchieved: 1400, lyTargetValue: 250000, lyAchievedValue: 200000, cyTarget: 0, cyTargetValue: 0 },
        { id: 'others', name: 'Others', lyTarget: 500, lyAchieved: 450, lyTargetValue: 100000, lyAchievedValue: 150000, cyTarget: 0, cyTargetValue: 0 },
      ],
    },
    {
      id: 16, name: 'Rajiv Nair', territory: 'West Delhi', designation: 'Sales Rep',
      lyTarget: 21000, lyAchieved: 20500, lyTargetValue: 7500000, lyAchievedValue: 7200000,
      cyTarget: 0, cyTargetValue: 0, status: 'not_set', lastUpdated: null,
      categoryBreakdown: [
        { id: 'equipment', name: 'Equipment', lyTarget: 1500, lyAchieved: 1450, lyTargetValue: 3500000, lyAchievedValue: 3350000, cyTarget: 0, cyTargetValue: 0 },
        { id: 'iol', name: 'IOL', lyTarget: 11000, lyAchieved: 10800, lyTargetValue: 2500000, lyAchievedValue: 2450000, cyTarget: 0, cyTargetValue: 0 },
        { id: 'ovd', name: 'OVD', lyTarget: 6000, lyAchieved: 5800, lyTargetValue: 950000, lyAchievedValue: 900000, cyTarget: 0, cyTargetValue: 0 },
        { id: 'mis', name: 'MIS', lyTarget: 2000, lyAchieved: 1950, lyTargetValue: 400000, lyAchievedValue: 380000, cyTarget: 0, cyTargetValue: 0 },
        { id: 'others', name: 'Others', lyTarget: 500, lyAchieved: 500, lyTargetValue: 150000, lyAchievedValue: 120000, cyTarget: 0, cyTargetValue: 0 },
      ],
    },
    {
      id: 21, name: 'Sunita Devi', territory: 'North Delhi', designation: 'Sales Rep',
      lyTarget: 16000, lyAchieved: 17200, lyTargetValue: 5500000, lyAchievedValue: 5900000,
      cyTarget: 0, cyTargetValue: 0, status: 'not_set', lastUpdated: null,
      categoryBreakdown: [
        { id: 'equipment', name: 'Equipment', lyTarget: 1000, lyAchieved: 1150, lyTargetValue: 2300000, lyAchievedValue: 2650000, cyTarget: 0, cyTargetValue: 0 },
        { id: 'iol', name: 'IOL', lyTarget: 8500, lyAchieved: 9200, lyTargetValue: 2000000, lyAchievedValue: 2150000, cyTarget: 0, cyTargetValue: 0 },
        { id: 'ovd', name: 'OVD', lyTarget: 4500, lyAchieved: 4800, lyTargetValue: 750000, lyAchievedValue: 700000, cyTarget: 0, cyTargetValue: 0 },
        { id: 'mis', name: 'MIS', lyTarget: 1500, lyAchieved: 1550, lyTargetValue: 300000, lyAchievedValue: 280000, cyTarget: 0, cyTargetValue: 0 },
        { id: 'others', name: 'Others', lyTarget: 500, lyAchieved: 500, lyTargetValue: 150000, lyAchievedValue: 120000, cyTarget: 0, cyTargetValue: 0 },
      ],
    },
  ], []);

  // ==================== DATA LOADING ====================

  useEffect(() => {
    loadTargets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fiscalYear]);

  const loadTargets = useCallback(async () => {
    setIsLoading(true);
    try {
      if (apiService?.getYearlyTargets) {
        // PRODUCTION PATH: use API service
        const data = await apiService.getYearlyTargets(fiscalYear);
        setMembers(data.members || []);
      } else if (teamMembers && teamMembers.length > 0) {
        // teamMembers provided but no API — enrich with mock LY data
        const membersWithHistory = teamMembers.map(tm => ({
          id: tm.id,
          name: tm.name,
          territory: tm.territory || tm.area || '',
          avatar: tm.avatar || null,
          designation: tm.designation || config.memberLabel,
          lyTarget: tm.lyTarget || Math.round(15000 + Math.random() * 35000),
          lyAchieved: tm.lyAchieved || Math.round(12000 + Math.random() * 30000),
          lyTargetValue: tm.lyTargetValue || Math.round(5000000 + Math.random() * 15000000),
          lyAchievedValue: tm.lyAchievedValue || Math.round(4000000 + Math.random() * 14000000),
          cyTarget: tm.cyTarget || 0,
          cyTargetValue: tm.cyTargetValue || 0,
          status: tm.status || 'not_set',
          lastUpdated: tm.lastUpdated || null,
          categoryBreakdown: tm.categoryBreakdown || generateMockCategoryBreakdown(),
        }));
        setMembers(membersWithHistory);
      } else {
        // No API, no teamMembers — use built-in mock data for demo
        setMembers(JSON.parse(JSON.stringify(BUILTIN_MOCK_MEMBERS)));
      }
    } catch (error) {
      console.error('TeamYearlyTargets: Failed to load data', error);
      // Fallback to built-in mock on error
      setMembers(JSON.parse(JSON.stringify(BUILTIN_MOCK_MEMBERS)));
      showToast?.('Info', 'Loaded demo data. Connect API for live data.', 'info');
    } finally {
      setIsLoading(false);
    }
  }, [fiscalYear, teamMembers, apiService, config.memberLabel, showToast, BUILTIN_MOCK_MEMBERS]);

  // ==================== FOCUS MANAGEMENT ====================

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  // ==================== COMPUTED VALUES ====================

  const filteredMembers = useMemo(() => {
    let result = [...members];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(m =>
        m.name.toLowerCase().includes(term) ||
        m.territory.toLowerCase().includes(term)
      );
    }

    // Sort
    result.sort((a, b) => {
      let valA, valB;
      switch (sortBy) {
        case 'name': valA = a.name; valB = b.name; break;
        case 'territory': valA = a.territory; valB = b.territory; break;
        case 'lyAchieved': valA = a.lyAchievedValue; valB = b.lyAchievedValue; break;
        case 'growth': {
          const growthA = a.lyTarget > 0 ? ((a.lyAchieved - a.lyTarget) / a.lyTarget) * 100 : 0;
          const growthB = b.lyTarget > 0 ? ((b.lyAchieved - b.lyTarget) / b.lyTarget) * 100 : 0;
          valA = growthA; valB = growthB; break;
        }
        case 'cyTarget': valA = a.cyTargetValue; valB = b.cyTargetValue; break;
        default: valA = a.name; valB = b.name;
      }
      if (typeof valA === 'string') {
        return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortDir === 'asc' ? valA - valB : valB - valA;
    });

    return result;
  }, [members, searchTerm, sortBy, sortDir]);

  const teamSummary = useMemo(() => {
    const total = members.length;
    const setCount = members.filter(m => m.cyTargetValue > 0).length;
    const publishedCount = members.filter(m => m.status === 'published').length;
    const totalLyTarget = members.reduce((s, m) => s + (m.lyTarget || 0), 0);
    const totalLyAchieved = members.reduce((s, m) => s + (m.lyAchieved || 0), 0);
    const totalCyTarget = members.reduce((s, m) => s + (m.cyTarget || 0), 0);
    const totalLyTargetValue = members.reduce((s, m) => s + (m.lyTargetValue || 0), 0);
    const totalLyAchievedValue = members.reduce((s, m) => s + (m.lyAchievedValue || 0), 0);
    const totalCyTargetValue = members.reduce((s, m) => s + (m.cyTargetValue || 0), 0);
    const overallLyGrowth = totalLyTargetValue > 0 ? ((totalLyAchievedValue - totalLyTargetValue) / totalLyTargetValue) * 100 : 0;
    const cyVsLyGrowth = totalLyTargetValue > 0 ? ((totalCyTargetValue - totalLyTargetValue) / totalLyTargetValue) * 100 : 0;

    return {
      total, setCount, publishedCount,
      totalLyTarget, totalLyAchieved, totalCyTarget,
      totalLyTargetValue, totalLyAchievedValue, totalCyTargetValue,
      overallLyGrowth, cyVsLyGrowth,
      completionPct: total > 0 ? Math.round((setCount / total) * 100) : 0,
    };
  }, [members]);

  // ==================== HANDLERS ====================

  const handleTargetChange = useCallback((memberId, field, value) => {
    const numValue = parseInt(value) || 0;
    setMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        return {
          ...m,
          [field]: numValue,
          status: m.status === 'published' ? 'draft' : (numValue > 0 ? 'draft' : 'not_set'),
          lastUpdated: new Date().toISOString(),
        };
      }
      return m;
    }));
    setHasUnsavedChanges(true);
  }, []);

  const handleCategoryTargetChange = useCallback((memberId, categoryId, field, value) => {
    const numValue = parseInt(value) || 0;
    setMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        const updatedBreakdown = (m.categoryBreakdown || []).map(cat => {
          if (cat.id === categoryId) {
            return { ...cat, [field]: numValue };
          }
          return cat;
        });
        // Recalculate totals from category breakdown
        const totalQty = updatedBreakdown.reduce((s, c) => s + (c.cyTarget || 0), 0);
        const totalValue = updatedBreakdown.reduce((s, c) => s + (c.cyTargetValue || 0), 0);
        return {
          ...m,
          categoryBreakdown: updatedBreakdown,
          cyTarget: totalQty,
          cyTargetValue: totalValue,
          status: totalQty > 0 ? 'draft' : 'not_set',
          lastUpdated: new Date().toISOString(),
        };
      }
      return m;
    }));
    setHasUnsavedChanges(true);
  }, []);

  const handleEditStart = useCallback((memberId, field, currentValue) => {
    setEditingCell({ memberId, field });
    setEditValue(String(currentValue || ''));
  }, []);

  const handleEditComplete = useCallback(() => {
    if (editingCell) {
      const { memberId, field } = editingCell;
      // Check if this is a category-level field
      if (field.startsWith('cat_')) {
        const [, categoryId, catField] = field.split('_');
        handleCategoryTargetChange(memberId, categoryId, catField, editValue);
      } else {
        handleTargetChange(memberId, field, editValue);
      }
    }
    setEditingCell(null);
    setEditValue('');
  }, [editingCell, editValue, handleTargetChange, handleCategoryTargetChange]);

  const handleEditKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      handleEditComplete();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleEditComplete();
    }
  }, [handleEditComplete]);

  const handleSelectMember = useCallback((memberId) => {
    setSelectedMembers(prev => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedMembers.size === filteredMembers.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(filteredMembers.map(m => m.id)));
    }
  }, [selectedMembers.size, filteredMembers]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      if (apiService?.saveYearlyTargets) {
        await apiService.saveYearlyTargets(fiscalYear, members);
      }
      setHasUnsavedChanges(false);
      showToast?.('Saved', 'Yearly targets saved as draft.', 'success');
    } catch (error) {
      showToast?.('Error', 'Failed to save targets.', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [members, fiscalYear, apiService, showToast]);

  const handlePublish = useCallback(async () => {
    if (selectedMembers.size === 0) {
      showToast?.('Warning', `Please select at least one ${config.memberLabel} to publish.`, 'warning');
      return;
    }

    setShowPublishConfirm(true);
  }, [selectedMembers.size, config.memberLabel, showToast]);

  const confirmPublish = useCallback(async () => {
    setIsPublishing(true);
    setShowPublishConfirm(false);
    try {
      const memberIds = Array.from(selectedMembers);
      if (apiService?.publishYearlyTargets) {
        await apiService.publishYearlyTargets(fiscalYear, memberIds);
      }
      setMembers(prev => prev.map(m => {
        if (selectedMembers.has(m.id)) {
          return { ...m, status: 'published', lastUpdated: new Date().toISOString() };
        }
        return m;
      }));
      setSelectedMembers(new Set());
      setHasUnsavedChanges(false);
      showToast?.('Published', `Targets published to ${memberIds.length} ${config.membersLabel}.`, 'success');
    } catch (error) {
      showToast?.('Error', 'Failed to publish targets.', 'error');
    } finally {
      setIsPublishing(false);
    }
  }, [selectedMembers, fiscalYear, apiService, config.membersLabel, showToast]);

  const handleCopyLyTarget = useCallback((memberId) => {
    setMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        const updatedBreakdown = (m.categoryBreakdown || []).map(cat => ({
          ...cat,
          cyTarget: cat.lyTarget || 0,
          cyTargetValue: cat.lyTargetValue || 0,
        }));
        return {
          ...m,
          cyTarget: m.lyTarget || 0,
          cyTargetValue: m.lyTargetValue || 0,
          categoryBreakdown: updatedBreakdown,
          status: 'draft',
          lastUpdated: new Date().toISOString(),
        };
      }
      return m;
    }));
    setHasUnsavedChanges(true);
    showToast?.('Copied', 'Last year targets copied. Adjust as needed.', 'info');
  }, [showToast]);

  const handleApplyGrowth = useCallback((memberId, growthPct) => {
    const factor = 1 + (growthPct / 100);
    setMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        const updatedBreakdown = (m.categoryBreakdown || []).map(cat => ({
          ...cat,
          cyTarget: Math.round((cat.lyTarget || 0) * factor),
          cyTargetValue: Math.round((cat.lyTargetValue || 0) * factor),
        }));
        return {
          ...m,
          cyTarget: Math.round((m.lyTarget || 0) * factor),
          cyTargetValue: Math.round((m.lyTargetValue || 0) * factor),
          categoryBreakdown: updatedBreakdown,
          status: 'draft',
          lastUpdated: new Date().toISOString(),
        };
      }
      return m;
    }));
    setHasUnsavedChanges(true);
  }, []);

  const toggleSort = useCallback((field) => {
    if (sortBy === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  }, [sortBy]);

  // ==================== RENDER HELPERS ====================

  const getAchievementPct = (achieved, target) => {
    if (!target || target === 0) return 0;
    return Math.round((achieved / target) * 100);
  };

  const getGrowthPct = (ly, cy) => {
    if (!ly || ly === 0) return cy > 0 ? 100 : 0;
    return ((cy - ly) / ly) * 100;
  };

  const getGrowthClass = (pct) => {
    if (pct > 5) return 'positive';
    if (pct < -5) return 'negative';
    return 'neutral';
  };

  const renderEditableCell = (memberId, field, value, prefix = '', suffix = '') => {
    const isEditing = editingCell?.memberId === memberId && editingCell?.field === field;

    if (isEditing) {
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
        />
      );
    }

    return (
      <span
        className="tyt-editable-value"
        onClick={() => handleEditStart(memberId, field, value)}
        title="Click to edit"
      >
        {prefix}{typeof value === 'number' && value > 0 ? Utils.formatNumber(value, 0) : '—'}{suffix}
      </span>
    );
  };

  const renderEditableValueCell = (memberId, field, value) => {
    const isEditing = editingCell?.memberId === memberId && editingCell?.field === field;

    if (isEditing) {
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
          placeholder="Enter amount"
        />
      );
    }

    // Always show a clickable box — filled style when value exists, empty prompt when not
    return (
      <span
        className={`tyt-editable-value ${value > 0 ? 'tyt-has-value' : 'tyt-empty-target'}`}
        onClick={() => handleEditStart(memberId, field, value)}
        title="Click to enter target"
      >
        {value > 0 ? Utils.formatShortCurrency(value) : '₹ Enter Target'}
      </span>
    );
  };

  // ==================== MEMBER CARD RENDERER ====================

  const renderMemberCard = (member) => {
    const lyAchievePct = getAchievementPct(member.lyAchievedValue, member.lyTargetValue);
    const lyGrowth = getGrowthPct(member.lyTargetValue, member.lyAchievedValue);
    const cyVsLy = getGrowthPct(member.lyTargetValue, member.cyTargetValue);
    const statusCfg = STATUS_CONFIG[member.status] || STATUS_CONFIG.not_set;
    const isExpanded = expandedMember === member.id;
    const isSelected = selectedMembers.has(member.id);
    const initials = Utils.getInitials(member.name);

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

        {/* Main Target Row - 3 columns: LY Target | LY Achieved | CY Target */}
        <div className="tyt-target-grid">
          {/* LY Target */}
          <div className="tyt-target-col tyt-ly-target">
            <div className="tyt-col-label">
              <i className="fas fa-bullseye"></i>
              LY Target
            </div>
            <div className="tyt-col-values">
              <div className="tyt-primary-value">{Utils.formatShortCurrency(member.lyTargetValue)}</div>
            </div>
          </div>

          {/* LY Achieved */}
          <div className="tyt-target-col tyt-ly-achieved">
            <div className="tyt-col-label">
              <i className="fas fa-trophy"></i>
              LY Achieved
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
          </div>

          {/* CY Target (Editable - Value only) + Growth Badge */}
          <div className="tyt-target-col tyt-cy-target">
            <div className="tyt-col-label">
              <i className="fas fa-flag"></i>
              CY Target <span className="tyt-fy-badge">FY {fiscalYear}</span>
            </div>
            <div className="tyt-cy-row">
              <div className="tyt-cy-input-box">
                {renderEditableValueCell(member.id, 'cyTargetValue', member.cyTargetValue)}
              </div>
              <div className={`tyt-growth-badge ${member.cyTargetValue > 0 ? getGrowthClass(getGrowthPct(member.lyTargetValue, member.cyTargetValue)) : 'waiting'}`}>
                {member.cyTargetValue > 0 ? (
                  <>
                    <i className={`fas fa-arrow-${getGrowthPct(member.lyTargetValue, member.cyTargetValue) >= 0 ? 'up' : 'down'}`}></i>
                    <span className="tyt-growth-num">{getGrowthPct(member.lyTargetValue, member.cyTargetValue) >= 0 ? '+' : ''}{getGrowthPct(member.lyTargetValue, member.cyTargetValue).toFixed(1)}%</span>
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

        {/* Expanded Category Breakdown */}
        {isExpanded && member.categoryBreakdown && (
          <div className="tyt-category-breakdown">
            <div className="tyt-breakdown-header">
              <h4><i className="fas fa-th-list"></i> Category-wise Breakdown</h4>
              <span className="tyt-breakdown-hint">Click values to edit</span>
            </div>
            <div className="tyt-breakdown-table-wrapper">
              <table className="tyt-breakdown-table">
                <thead>
                  <tr>
                    <th className="tyt-cat-name-col">Category</th>
                    <th className="tyt-cat-data-col">LY Target (₹)</th>
                    <th className="tyt-cat-data-col">LY Achieved (₹)</th>
                    <th className="tyt-cat-data-col">LY Achieved</th>
                    <th className="tyt-cat-data-col">Achieve %</th>
                    <th className="tyt-cat-data-col tyt-editable-col">CY Target (₹)</th>
                    <th className="tyt-cat-data-col">Growth</th>
                  </tr>
                </thead>
                <tbody>
                  {member.categoryBreakdown.map(cat => {
                    const catAchPct = getAchievementPct(cat.lyAchievedValue, cat.lyTargetValue);
                    const catGrowth = getGrowthPct(cat.lyTargetValue, cat.cyTargetValue);
                    return (
                      <tr key={cat.id}>
                        <td className="tyt-cat-name">
                          <span className={`tyt-cat-dot ${cat.id}`}></span>
                          {cat.name}
                        </td>
                        <td className="tyt-cat-value">{Utils.formatShortCurrency(cat.lyTargetValue)}</td>
                        <td className="tyt-cat-value">{Utils.formatShortCurrency(cat.lyAchievedValue)}</td>
                        <td className="tyt-cat-value">
                          <span className={`tyt-cat-pct ${catAchPct >= 100 ? 'exceeded' : catAchPct >= 80 ? 'good' : 'low'}`}>
                            {catAchPct}%
                          </span>
                        </td>
                        <td className="tyt-cat-value tyt-editable-cell">
                          {renderEditableValueCell(member.id, `cat_${cat.id}_cyTargetValue`, cat.cyTargetValue)}
                        </td>
                        <td className="tyt-cat-value">
                          {cat.cyTargetValue > 0 ? (
                            <span className={`tyt-cat-growth ${getGrowthClass(catGrowth)}`}>
                              <i className={`fas fa-arrow-${catGrowth >= 0 ? 'up' : 'down'}`}></i>
                              {Math.abs(catGrowth).toFixed(1)}%
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="tyt-breakdown-total-row">
                    <td className="tyt-cat-name"><strong>Total</strong></td>
                    <td className="tyt-cat-value"><strong>{Utils.formatShortCurrency(member.lyTargetValue)}</strong></td>
                    <td className="tyt-cat-value"><strong>{Utils.formatShortCurrency(member.lyAchievedValue)}</strong></td>
                    <td className="tyt-cat-value">
                      <strong className={`tyt-cat-pct ${lyAchievePct >= 100 ? 'exceeded' : lyAchievePct >= 80 ? 'good' : 'low'}`}>
                        {lyAchievePct}%
                      </strong>
                    </td>
                    <td className="tyt-cat-value"><strong>{Utils.formatShortCurrency(member.cyTargetValue)}</strong></td>
                    <td className="tyt-cat-value">
                      {member.cyTargetValue > 0 ? (
                        <strong className={`tyt-cat-growth ${getGrowthClass(getGrowthPct(member.lyTargetValue, member.cyTargetValue))}`}>
                          <i className={`fas fa-arrow-${getGrowthPct(member.lyTargetValue, member.cyTargetValue) >= 0 ? 'up' : 'down'}`}></i>
                          {Math.abs(getGrowthPct(member.lyTargetValue, member.cyTargetValue)).toFixed(1)}%
                        </strong>
                      ) : '—'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ==================== LOADING STATE ====================

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

  // ==================== MAIN RENDER ====================

  return (
    <div className="tyt-container">
      {/* ========== HEADER SECTION ========== */}
      <div className="tyt-header" style={{ '--role-accent': config.accentColor }}>
        <div className="tyt-header-top">
          <div className="tyt-header-title">
            <i className={`fas ${config.icon}`}></i>
            <div>
              <h2>{config.title}</h2>
              <p>{config.subtitle}</p>
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
              {config.publishLabel}
              {selectedMembers.size > 0 && <span className="tyt-btn-count">{selectedMembers.size}</span>}
            </button>
          </div>
        </div>

        {/* Summary Strip */}
        <div className="tyt-summary-strip">
          <div className="tyt-summary-item">
            <span className="tyt-summary-label">Team Size</span>
            <span className="tyt-summary-value">{teamSummary.total} {config.membersLabel}</span>
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
            <span className="tyt-summary-label">LY Total Target</span>
            <span className="tyt-summary-value">{Utils.formatShortCurrency(teamSummary.totalLyTargetValue)}</span>
          </div>
          <div className="tyt-summary-divider"></div>
          <div className="tyt-summary-item">
            <span className="tyt-summary-label">LY Total Achieved</span>
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
                  {getGrowthPct(teamSummary.totalLyTargetValue, teamSummary.totalCyTargetValue) >= 0 ? '+' : ''}{Math.abs(getGrowthPct(teamSummary.totalLyTargetValue, teamSummary.totalCyTargetValue)).toFixed(1)}% vs LY
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

      {/* ========== TOOLBAR ========== */}
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
              placeholder={`Search ${config.membersLabel.toLowerCase()}...`}
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
        <div className="tyt-toolbar-right">
          <div className="tyt-sort-group">
            <span className="tyt-sort-label">Sort:</span>
            {[
              { key: 'name', label: 'Name' },
              { key: 'lyAchieved', label: 'LY Achieved' },
              { key: 'cyTarget', label: 'CY Target' },
              { key: 'growth', label: 'Growth' },
            ].map(opt => (
              <button
                key={opt.key}
                className={`tyt-sort-btn ${sortBy === opt.key ? 'active' : ''}`}
                onClick={() => toggleSort(opt.key)}
              >
                {opt.label}
                {sortBy === opt.key && (
                  <i className={`fas fa-arrow-${sortDir === 'asc' ? 'up' : 'down'}`}></i>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========== MEMBER CARDS ========== */}
      <div className="tyt-members-list">
        {filteredMembers.length === 0 ? (
          <div className="tyt-empty-state">
            <i className="fas fa-users-slash"></i>
            <h3>No {config.membersLabel} Found</h3>
            <p>
              {searchTerm
                ? `No results matching "${searchTerm}". Try a different search.`
                : `No team members available. Please check your team configuration.`
              }
            </p>
          </div>
        ) : (
          filteredMembers.map(renderMemberCard)
        )}
      </div>

      {/* ========== FOOTER ========== */}
      <div className="tyt-footer">
        <div className="tyt-footer-hints">
          <span><i className="fas fa-mouse-pointer"></i> Click target values to edit inline</span>
          <span><i className="fas fa-chevron-down"></i> Expand cards for category breakdown</span>
          <span><i className="fas fa-copy"></i> Use "Copy LY" to prefill from last year</span>
          <span><i className="fas fa-chart-line"></i> Apply growth % to auto-calculate</span>
        </div>
      </div>

      {/* ========== PUBLISH CONFIRMATION MODAL ========== */}
      {showPublishConfirm && (
        <div className="tyt-modal-overlay" onClick={() => setShowPublishConfirm(false)}>
          <div className="tyt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tyt-modal-header">
              <i className="fas fa-paper-plane"></i>
              <h3>{config.publishLabel}</h3>
            </div>
            <div className="tyt-modal-body">
              <p>{config.publishConfirm}</p>
              <div className="tyt-modal-selected-list">
                {Array.from(selectedMembers).map(id => {
                  const m = members.find(mem => mem.id === id);
                  return m ? (
                    <div key={id} className="tyt-modal-member-row">
                      <span className="tyt-modal-member-name">{m.name}</span>
                      <span className="tyt-modal-member-target">
                        {Utils.formatShortCurrency(m.cyTargetValue)}
                      </span>
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

// ==================== MOCK CATEGORY BREAKDOWN HELPER ====================

function generateMockCategoryBreakdown() {
  return [
    {
      id: 'equipment',
      name: 'Equipment',
      lyTarget: Math.round(500 + Math.random() * 2000),
      lyAchieved: Math.round(400 + Math.random() * 1800),
      lyTargetValue: Math.round(2000000 + Math.random() * 5000000),
      lyAchievedValue: Math.round(1800000 + Math.random() * 4500000),
      cyTarget: 0,
      cyTargetValue: 0,
    },
    {
      id: 'iol',
      name: 'IOL',
      lyTarget: Math.round(5000 + Math.random() * 15000),
      lyAchieved: Math.round(4000 + Math.random() * 14000),
      lyTargetValue: Math.round(1500000 + Math.random() * 5000000),
      lyAchievedValue: Math.round(1200000 + Math.random() * 4800000),
      cyTarget: 0,
      cyTargetValue: 0,
    },
    {
      id: 'ovd',
      name: 'OVD',
      lyTarget: Math.round(3000 + Math.random() * 10000),
      lyAchieved: Math.round(2500 + Math.random() * 9000),
      lyTargetValue: Math.round(800000 + Math.random() * 3000000),
      lyAchievedValue: Math.round(700000 + Math.random() * 2800000),
      cyTarget: 0,
      cyTargetValue: 0,
    },
    {
      id: 'mis',
      name: 'MIS',
      lyTarget: Math.round(1000 + Math.random() * 5000),
      lyAchieved: Math.round(800 + Math.random() * 4500),
      lyTargetValue: Math.round(500000 + Math.random() * 2000000),
      lyAchievedValue: Math.round(400000 + Math.random() * 1800000),
      cyTarget: 0,
      cyTargetValue: 0,
    },
    {
      id: 'others',
      name: 'Others',
      lyTarget: Math.round(500 + Math.random() * 3000),
      lyAchieved: Math.round(400 + Math.random() * 2800),
      lyTargetValue: Math.round(200000 + Math.random() * 1000000),
      lyAchievedValue: Math.round(150000 + Math.random() * 950000),
      cyTarget: 0,
      cyTargetValue: 0,
    },
  ];
}

export default TeamYearlyTargets;
