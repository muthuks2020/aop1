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
 * @version 1.1.0 - Per-card Save & Publish buttons
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
  const [savingMemberId, setSavingMemberId] = useState(null);   // per-card save
  const [publishingMemberId, setPublishingMemberId] = useState(null); // per-card publish
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
  const [overAllocationAlert, setOverAllocationAlert] = useState(null);
  const [cyBelowLyAlert, setCyBelowLyAlert] = useState(null);
  const [unallocatedAlert, setUnallocatedAlert] = useState(null); // { members: [{name, unallocated, cyTargetValue}], onProceed }
  
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
    // Value fields (cyTargetValue etc.) are entered in Crores → convert to raw rupees for storage
    const isValueField = field.endsWith('Value') || field.endsWith('Rev');
    const numValue = isValueField
      ? Math.round((parseFloat(value) || 0) * 10000000)
      : (parseInt(value) || 0);
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
    // Value fields (cyTargetValue etc.) are entered in Crores → convert to raw rupees for storage
    const isValueField = field.endsWith('Value') || field.endsWith('Rev');
    const numValue = isValueField
      ? Math.round((parseFloat(value) || 0) * 10000000)
      : (parseInt(value) || 0);
    setMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        const updatedBreakdown = (m.categoryBreakdown || []).map(cat => {
          if (cat.id === categoryId) {
            return { ...cat, [field]: numValue };
          }
          return cat;
        });
        // NOTE: Do NOT recalculate cyTarget/cyTargetValue from the breakdown sum.
        // The top-level target is set independently by the TBM and must stay locked.
        // The breakdown is a manual split of that fixed total.
        return {
          ...m,
          categoryBreakdown: updatedBreakdown,
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
      if (field.startsWith('cat_')) {
        // field format: cat_<categoryId>_<catField>
        const withoutPrefix = field.slice(4);
        const lastUnderscore = withoutPrefix.lastIndexOf('_');
        const categoryId = withoutPrefix.slice(0, lastUnderscore);
        const catField = withoutPrefix.slice(lastUnderscore + 1);

        if (catField === 'cyTargetValue') {
          const member = members.find(m => m.id === memberId);
          const cat = member?.categoryBreakdown?.find(c => c.id === categoryId);

          // ── CY < LY Ahv warning (category level) ──────────────────────────
          if (member && cat && cat.lyAchievedValue > 0) {
            const enteredRaw = Math.round((parseFloat(editValue) || 0) * 10000000);
            if (enteredRaw > 0 && enteredRaw < cat.lyAchievedValue) {
              setCyBelowLyAlert({
                memberName: member.name,
                context: `${cat.name} category`,
                cyValue: enteredRaw,
                lyAchievedValue: cat.lyAchievedValue,
                onProceed: () => {
                  handleCategoryTargetChange(memberId, categoryId, catField, editValue);
                  setCyBelowLyAlert(null);
                },
              });
              setEditingCell(null);
              setEditValue('');
              return;
            }
          }

          // ── Over-allocation guard ──────────────────────────────────────────
          if (member && member.cyTargetValue > 0) {
            const enteredRaw = Math.round((parseFloat(editValue) || 0) * 10000000);
            const otherCatsTotal = (member.categoryBreakdown || [])
              .filter(c => c.id !== categoryId)
              .reduce((s, c) => s + (c.cyTargetValue || 0), 0);
            const newTotal = otherCatsTotal + enteredRaw;
            if (newTotal > member.cyTargetValue) {
              const remaining = member.cyTargetValue - otherCatsTotal;
              setOverAllocationAlert({
                memberName: member.name,
                cyTargetValue: member.cyTargetValue,
                attempted: enteredRaw,
                remaining: remaining > 0 ? remaining : 0,
              });
              setEditingCell(null);
              setEditValue('');
              return;
            }
          }
        }

        handleCategoryTargetChange(memberId, categoryId, catField, editValue);
      } else {
        // ── CY < LY Ahv warning (top-level) ─────────────────────────────────
        if (field === 'cyTargetValue') {
          const member = members.find(m => m.id === memberId);
          if (member && member.lyAchievedValue > 0) {
            const enteredRaw = Math.round((parseFloat(editValue) || 0) * 10000000);
            if (enteredRaw > 0 && enteredRaw < member.lyAchievedValue) {
              setCyBelowLyAlert({
                memberName: member.name,
                context: 'overall CY Target',
                cyValue: enteredRaw,
                lyAchievedValue: member.lyAchievedValue,
                onProceed: () => {
                  handleTargetChange(memberId, field, editValue);
                  setCyBelowLyAlert(null);
                },
              });
              setEditingCell(null);
              setEditValue('');
              return;
            }
          }
        }
        handleTargetChange(memberId, field, editValue);
      }
    }
    setEditingCell(null);
    setEditValue('');
  }, [editingCell, editValue, members, handleTargetChange, handleCategoryTargetChange]);

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

  // ── Helper: find members with unallocated breakdown amounts ──────────────
  const getUnallocatedMembers = useCallback((memberIds = null) => {
    const pool = memberIds
      ? members.filter(m => memberIds.includes(m.id))
      : members;
    return pool
      .filter(m => m.cyTargetValue > 0 && m.categoryBreakdown?.length > 0)
      .map(m => {
        const allocated = m.categoryBreakdown.reduce((s, c) => s + (c.cyTargetValue || 0), 0);
        const unallocated = m.cyTargetValue - allocated;
        return unallocated > 0 ? { id: m.id, name: m.name, unallocated, cyTargetValue: m.cyTargetValue } : null;
      })
      .filter(Boolean);
  }, [members]);

  const handleSave = useCallback(async () => {
    // Warn if any member has unallocated breakdown amounts
    const unallocated = getUnallocatedMembers();
    if (unallocated.length > 0) {
      setUnallocatedAlert({
        members: unallocated,
        context: 'save',
        onProceed: async () => {
          setUnallocatedAlert(null);
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
        },
      });
      return;
    }
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
  }, [members, fiscalYear, apiService, showToast, getUnallocatedMembers]);

  const handlePublish = useCallback(async () => {
    if (selectedMembers.size === 0) {
      showToast?.('Warning', `Please select at least one ${config.memberLabel} to publish.`, 'warning');
      return;
    }
    // Warn if any selected member has unallocated breakdown amounts
    const unallocated = getUnallocatedMembers(Array.from(selectedMembers));
    if (unallocated.length > 0) {
      setUnallocatedAlert({
        members: unallocated,
        context: 'publish',
        onProceed: () => {
          setUnallocatedAlert(null);
          setShowPublishConfirm(true);
        },
      });
      return;
    }
    setShowPublishConfirm(true);
  }, [selectedMembers, config.memberLabel, showToast, getUnallocatedMembers]);

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

  // ── Per-card Save ──
  const handleSaveMember = useCallback(async (memberId) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    setSavingMemberId(memberId);
    try {
      if (apiService?.saveYearlyTargets) {
        await apiService.saveYearlyTargets(fiscalYear, [member]);
      }
      setMembers(prev => prev.map(m =>
        m.id === memberId ? { ...m, status: m.status === 'not_set' ? 'draft' : m.status } : m
      ));
      showToast?.('Saved', `Target saved for ${member.name}.`, 'success');
    } catch (error) {
      showToast?.('Error', 'Failed to save target.', 'error');
    } finally {
      setSavingMemberId(null);
    }
  }, [members, fiscalYear, apiService, showToast]);

  // ── Per-card Publish (saves first, then publishes) ──
  const handlePublishMember = useCallback(async (memberId) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    if (!member.cyTargetValue || member.cyTargetValue <= 0) {
      showToast?.('Warning', `Please enter a CY target for ${member.name} before publishing.`, 'warning');
      return;
    }
    setPublishingMemberId(memberId);
    try {
      if (apiService?.saveYearlyTargets) {
        await apiService.saveYearlyTargets(fiscalYear, [member]);
      }
      if (apiService?.publishYearlyTargets) {
        await apiService.publishYearlyTargets(fiscalYear, [memberId]);
      }
      setMembers(prev => prev.map(m =>
        m.id === memberId ? { ...m, status: 'published', lastUpdated: new Date().toISOString() } : m
      ));
      showToast?.('Published', `Target published to ${member.name}.`, 'success');
    } catch (error) {
      showToast?.('Error', 'Failed to publish target.', 'error');
    } finally {
      setPublishingMemberId(null);
    }
  }, [members, fiscalYear, apiService, showToast]);

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
          step="0.01"
          placeholder="Enter in Crores (e.g. 5 = ₹5 Cr)"
        />
      );
    }

    // Always show a clickable box — filled style when value exists, empty prompt when not
    return (
      <span
        className={`tyt-editable-value ${value > 0 ? 'tyt-has-value' : 'tyt-empty-target'}`}
        onClick={() => handleEditStart(memberId, field, value > 0 ? parseFloat((value / 10000000).toFixed(4)) : '')}
        title="Click to edit (enter value in Crores)"
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

        {/* Main Target Row - 3 columns: LY Tgt | LY Ahv | CY Target */}
        <div className="tyt-target-grid">
          {/* LY Tgt */}
          <div className="tyt-target-col tyt-ly-target">
            <div className="tyt-col-label">
              <i className="fas fa-bullseye"></i>
              LY Tgt
            </div>
            <div className="tyt-col-values">
              <div className="tyt-primary-value">{Utils.formatShortCurrency(member.lyTargetValue)}</div>
            </div>
          </div>

          {/* LY Ahv */}
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

        {/* ── Per-card Action Footer ── */}
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
            title={
              member.status === 'published' ? 'Already published'
              : !member.cyTargetValue ? 'Enter a CY target first'
              : `Publish to ${member.name}`
            }
          >
            {publishingMemberId === member.id
              ? <><i className="fas fa-spinner fa-spin"></i> Publishing…</>
              : member.status === 'published'
              ? <><i className="fas fa-check-circle"></i> Published</>
              : <><i className="fas fa-paper-plane"></i> Publish</>}
          </button>
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
                    <th className="tyt-cat-data-col">LY Tgt (₹)</th>
                    <th className="tyt-cat-data-col">LY Ahv (₹)</th>
                    <th className="tyt-cat-data-col">LY Ahv</th>
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
                  {(() => {
                    const allocatedValue = member.categoryBreakdown.reduce(
                      (s, c) => s + (c.cyTargetValue || 0), 0
                    );
                    const remaining = (member.cyTargetValue || 0) - allocatedValue;
                    const isOver = remaining < 0;
                    const isBalanced = member.cyTargetValue > 0 && remaining === 0;
                    return (
                      <tr className="tyt-breakdown-total-row">
                        <td className="tyt-cat-name"><strong>Total</strong></td>
                        <td className="tyt-cat-value"><strong>{Utils.formatShortCurrency(member.lyTargetValue)}</strong></td>
                        <td className="tyt-cat-value"><strong>{Utils.formatShortCurrency(member.lyAchievedValue)}</strong></td>
                        <td className="tyt-cat-value">
                          <strong className={`tyt-cat-pct ${lyAchievePct >= 100 ? 'exceeded' : lyAchievePct >= 80 ? 'good' : 'low'}`}>
                            {lyAchievePct}%
                          </strong>
                        </td>
                        <td className="tyt-cat-value">
                          <strong>{Utils.formatShortCurrency(member.cyTargetValue)}</strong>
                          {member.cyTargetValue > 0 && (
                            <span style={{
                              display: 'block',
                              fontSize: '0.7rem',
                              marginTop: '3px',
                              fontWeight: 500,
                              color: isOver ? '#DC2626' : isBalanced ? '#059669' : '#D97706',
                            }}>
                              {isOver
                                ? `⚠ Over by ${Utils.formatShortCurrency(Math.abs(remaining))}`
                                : isBalanced
                                ? '✓ Fully allocated'
                                : `${Utils.formatShortCurrency(remaining)} unallocated`}
                            </span>
                          )}
                        </td>
                        <td className="tyt-cat-value">
                          {member.cyTargetValue > 0 ? (
                            <strong className={`tyt-cat-growth ${getGrowthClass(getGrowthPct(member.lyTargetValue, member.cyTargetValue))}`}>
                              <i className={`fas fa-arrow-${getGrowthPct(member.lyTargetValue, member.cyTargetValue) >= 0 ? 'up' : 'down'}`}></i>
                              {Math.abs(getGrowthPct(member.lyTargetValue, member.cyTargetValue)).toFixed(1)}%
                            </strong>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })()}
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
      {/* ========== UNALLOCATED BREAKDOWN WARNING MODAL ========== */}
      {unallocatedAlert && (
        <div className="tyt-modal-overlay" onClick={() => setUnallocatedAlert(null)}>
          <div className="tyt-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <div className="tyt-modal-header" style={{ background: '#FFF7ED', borderBottom: '1px solid #FED7AA' }}>
              <i className="fas fa-layer-group" style={{ color: '#EA580C' }}></i>
              <h3 style={{ color: '#EA580C' }}>Unallocated Target Amount</h3>
            </div>
            <div className="tyt-modal-body">
              <p style={{ marginBottom: '1rem', color: '#374151', lineHeight: 1.6 }}>
                The following {unallocatedAlert.members.length > 1 ? `${unallocatedAlert.members.length} members have` : 'member has'} a CY Target that hasn't been fully split across categories:
              </p>
              {/* Per-member unallocated list */}
              <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {unallocatedAlert.members.map(m => (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: '#F9FAFB', border: '1px solid #E5E7EB',
                    borderRadius: '8px', padding: '0.625rem 0.875rem',
                  }}>
                    <span style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>{m.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                        Total: <strong>{Utils.formatShortCurrency(m.cyTargetValue)}</strong>
                      </span>
                      <span style={{
                        background: '#FEF3C7', color: '#D97706', fontSize: '0.75rem',
                        fontWeight: 700, padding: '2px 8px', borderRadius: '999px',
                        border: '1px solid #FDE68A',
                      }}>
                        {Utils.formatShortCurrency(m.unallocated)} unallocated
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{
                background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '8px',
                padding: '0.75rem 1rem', display: 'flex', gap: '0.625rem', alignItems: 'flex-start',
              }}>
                <i className="fas fa-info-circle" style={{ color: '#EA580C', marginTop: '2px', flexShrink: 0 }}></i>
                <p style={{ fontSize: '0.8125rem', color: '#9A3412', lineHeight: 1.55, margin: 0 }}>
                  Unallocated amounts mean the category breakdown doesn't add up to the total CY Target. 
                  Expand the member card and allocate the remaining amount before {unallocatedAlert.context === 'publish' ? 'publishing' : 'saving'}.
                </p>
              </div>
            </div>
            <div className="tyt-modal-actions" style={{ gap: '0.75rem' }}>
              <button
                className="tyt-modal-btn tyt-modal-cancel"
                onClick={() => setUnallocatedAlert(null)}
                style={{ flex: 1 }}
              >
                <i className="fas fa-arrow-left"></i> Go Back & Fix
              </button>
              <button
                className="tyt-modal-btn tyt-modal-confirm"
                onClick={unallocatedAlert.onProceed}
                style={{ flex: 1, background: '#EA580C', borderColor: '#EA580C' }}
              >
                <i className="fas fa-check"></i> {unallocatedAlert.context === 'publish' ? 'Publish Anyway' : 'Save Anyway'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ========== CY BELOW LY AHV WARNING MODAL ========== */}
      {cyBelowLyAlert && (
        <div className="tyt-modal-overlay" onClick={() => setCyBelowLyAlert(null)}>
          <div className="tyt-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="tyt-modal-header" style={{ background: '#FFFBEB', borderBottom: '1px solid #FDE68A' }}>
              <i className="fas fa-exclamation-triangle" style={{ color: '#D97706' }}></i>
              <h3 style={{ color: '#D97706' }}>CY Target Below LY Achievement</h3>
            </div>
            <div className="tyt-modal-body">
              <p style={{ marginBottom: '1rem', color: '#374151', lineHeight: 1.6 }}>
                The {cyBelowLyAlert.context} for{' '}
                <strong>{cyBelowLyAlert.memberName}</strong> is being set to{' '}
                <strong style={{ color: '#DC2626' }}>{Utils.formatShortCurrency(cyBelowLyAlert.cyValue)}</strong>,
                which is lower than last year's achievement of{' '}
                <strong style={{ color: '#059669' }}>{Utils.formatShortCurrency(cyBelowLyAlert.lyAchievedValue)}</strong>.
              </p>
              <div style={{
                background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px',
                padding: '0.875rem 1rem', marginBottom: '1rem',
                display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
              }}>
                <i className="fas fa-info-circle" style={{ color: '#D97706', marginTop: '2px', flexShrink: 0 }}></i>
                <div style={{ fontSize: '0.8125rem', color: '#92400E', lineHeight: 1.55 }}>
                  Setting a target lower than what was actually achieved last year may demotivate the team and signal a declining business plan. Please confirm this is intentional.
                </div>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: '#F9FAFB', borderRadius: '8px', padding: '0.75rem 1rem',
                fontSize: '0.8125rem', color: '#374151',
              }}>
                <span>LY Ahv: <strong style={{ color: '#059669' }}>{Utils.formatShortCurrency(cyBelowLyAlert.lyAchievedValue)}</strong></span>
                <i className="fas fa-arrow-right" style={{ color: '#9CA3AF' }}></i>
                <span>CY Tgt: <strong style={{ color: '#DC2626' }}>{Utils.formatShortCurrency(cyBelowLyAlert.cyValue)}</strong></span>
                <span style={{
                  background: '#FEE2E2', color: '#DC2626', padding: '2px 8px',
                  borderRadius: '999px', fontWeight: 600,
                }}>
                  {(((cyBelowLyAlert.cyValue - cyBelowLyAlert.lyAchievedValue) / cyBelowLyAlert.lyAchievedValue) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="tyt-modal-actions" style={{ gap: '0.75rem' }}>
              <button
                className="tyt-modal-btn tyt-modal-cancel"
                onClick={() => setCyBelowLyAlert(null)}
                style={{ flex: 1 }}
              >
                <i className="fas fa-arrow-left"></i> Go Back & Change
              </button>
              <button
                className="tyt-modal-btn tyt-modal-confirm"
                onClick={cyBelowLyAlert.onProceed}
                style={{ flex: 1, background: '#D97706', borderColor: '#D97706' }}
              >
                <i className="fas fa-check"></i> Proceed Anyway
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ========== OVER-ALLOCATION BLOCKING MODAL ========== */}
      {overAllocationAlert && (
        <div className="tyt-modal-overlay" onClick={() => setOverAllocationAlert(null)}>
          <div className="tyt-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="tyt-modal-header" style={{ background: '#FEF2F2', borderBottom: '1px solid #FECACA' }}>
              <i className="fas fa-exclamation-triangle" style={{ color: '#DC2626' }}></i>
              <h3 style={{ color: '#DC2626' }}>Over-Allocation Not Allowed</h3>
            </div>
            <div className="tyt-modal-body">
              <p style={{ marginBottom: '1rem', color: '#374151', lineHeight: 1.6 }}>
                You're trying to allocate{' '}
                <strong style={{ color: '#DC2626' }}>{Utils.formatShortCurrency(overAllocationAlert.attempted)}</strong>{' '}
                to this category, but the total would exceed{' '}
                <strong>{overAllocationAlert.memberName}</strong>'s CY Target of{' '}
                <strong style={{ color: '#00A19B' }}>{Utils.formatShortCurrency(overAllocationAlert.cyTargetValue)}</strong>.
              </p>
              <div style={{
                background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px',
                padding: '0.875rem 1rem', marginBottom: '1rem',
              }}>
                <div style={{ fontSize: '0.8125rem', color: '#6B7280', marginBottom: '0.25rem' }}>
                  Maximum you can enter for this category:
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#059669' }}>
                  {overAllocationAlert.remaining > 0
                    ? Utils.formatShortCurrency(overAllocationAlert.remaining)
                    : '₹0 — All other categories are already fully allocated'}
                </div>
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#6B7280', lineHeight: 1.5 }}>
                <i className="fas fa-info-circle" style={{ marginRight: '0.375rem', color: '#3B82F6' }}></i>
                To increase this category's target, first raise the overall CY Target at the top of the card, then return here to allocate.
              </p>
            </div>
            <div className="tyt-modal-actions">
              <button
                className="tyt-modal-btn tyt-modal-confirm"
                onClick={() => setOverAllocationAlert(null)}
                style={{ background: '#DC2626', borderColor: '#DC2626', width: '100%' }}
              >
                <i className="fas fa-check"></i> Got it
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

// ── Inject per-card button styles (avoids needing CSS file changes) ──
const perCardStyles = `
  .tyt-card-footer-actions {
    display: flex;
    gap: 0.5rem;
    padding: 0.625rem 1rem 0.75rem;
    border-top: 1px solid #F3F4F6;
    justify-content: flex-end;
  }
  .tyt-card-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.4rem 0.875rem;
    border-radius: 6px;
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
    border: 1.5px solid transparent;
    transition: all 0.15s;
  }
  .tyt-card-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .tyt-card-save-btn {
    background: #F3F4F6;
    border-color: #D1D5DB;
    color: #374151;
  }
  .tyt-card-save-btn:not(:disabled):hover {
    background: #E5E7EB;
    border-color: #9CA3AF;
  }
  .tyt-card-publish-btn {
    background: #00A19B;
    border-color: #00A19B;
    color: #fff;
  }
  .tyt-card-publish-btn:not(:disabled):hover {
    background: #00857F;
    border-color: #00857F;
  }
  .tyt-card-publish-btn:disabled[title="Already published"] {
    background: #D1FAE5;
    border-color: #6EE7B7;
    color: #059669;
    opacity: 1;
  }
`;
if (typeof document !== 'undefined' && !document.getElementById('tyt-card-actions-style')) {
  const s = document.createElement('style');
  s.id = 'tyt-card-actions-style';
  s.textContent = perCardStyles;
  document.head.appendChild(s);
}

export default TeamYearlyTargets;
