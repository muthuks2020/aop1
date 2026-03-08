
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Utils } from '../../../utils/helpers';

function ABMSpecialistYearlyTargets({
  fiscalYear = '2026-27',
  specialists = [],
  yearlyTargets = [],
  onSaveTargets,
  onPublishTargets,
  showToast
}) {
  const [targets, setTargets] = useState([]);
  const [isDirty, setIsDirty] = useState(false);
  const [cyBelowLyAlert, setCyBelowLyAlert] = useState(null); // { specialistName, cyValue, lyAchievedValue, onProceed }

  // Initialize targets from props or create empty ones
  useEffect(() => {
    if (yearlyTargets.length > 0) {
      setTargets(yearlyTargets.map(t => ({ ...t })));
    } else {
      // Create default target entries for each specialist
      setTargets(specialists.map(sp => ({
        id: sp.id,
        assigneeCode: sp.employeeCode || sp.id,
        assigneeName: sp.name,
        assigneeArea: sp.area || sp.territory || '',
        lyTargetValue: sp.lyTargetValue || 0,
        lyAchievedValue: sp.lyAchievedValue || 0,
        cyTargetValue: sp.cyTargetValue || 0,
        status: sp.status || 'not_set',
      })));
    }
  }, [specialists, yearlyTargets]);

  // ==================== HANDLERS ====================

  // Tracks the raw input value while typing (before validation)
  const [editingValues, setEditingValues] = useState({});

  const handleTargetInputChange = useCallback((index, value) => {
    setEditingValues(prev => ({ ...prev, [index]: value }));
  }, []);

  const handleTargetBlur = useCallback((index, value) => {
    setEditingValues(prev => { const n = { ...prev }; delete n[index]; return n; });
    const numValue = parseFloat(value) || 0;
    const specialist = targets[index];
    if (!specialist) return;

    // ── CY < LY Ahv validation ───────────────────────────────────────────
    if (numValue > 0 && specialist.lyAchievedValue > 0 && numValue < specialist.lyAchievedValue) {
      setCyBelowLyAlert({
        specialistName: specialist.assigneeName,
        cyValue: numValue,
        lyAchievedValue: specialist.lyAchievedValue,
        onProceed: () => {
          setTargets(prev => prev.map((t, i) =>
            i === index ? { ...t, cyTargetValue: numValue, status: t.status === 'not_set' ? 'draft' : t.status } : t
          ));
          setIsDirty(true);
          setCyBelowLyAlert(null);
        },
      });
      return; // block save until user decides
    }
    // ─────────────────────────────────────────────────────────────────────

    setTargets(prev => prev.map((t, i) =>
      i === index ? { ...t, cyTargetValue: numValue, status: t.status === 'not_set' ? 'draft' : t.status } : t
    ));
    setIsDirty(true);
  }, [targets]);

  const handleSave = useCallback(async () => {
    try {
      if (onSaveTargets) await onSaveTargets(targets);
      setIsDirty(false);
      if (showToast) showToast('Saved', 'Specialist yearly targets saved as draft', 'success');
    } catch (error) {
      if (showToast) showToast('Error', 'Failed to save specialist targets', 'error');
    }
  }, [targets, onSaveTargets, showToast]);

  const handlePublish = useCallback(async () => {
    try {
      if (onPublishTargets) await onPublishTargets(targets);
      setTargets(prev => prev.map(t => ({ ...t, status: 'published' })));
      setIsDirty(false);
      if (showToast) showToast('Published', 'Specialist yearly targets published', 'success');
    } catch (error) {
      if (showToast) showToast('Error', 'Failed to publish specialist targets', 'error');
    }
  }, [targets, onPublishTargets, showToast]);

  // ==================== COMPUTED ====================

  const totalLY = useMemo(() => targets.reduce((s, t) => s + (t.lyTargetValue || 0), 0), [targets]);
  const totalCY = useMemo(() => targets.reduce((s, t) => s + (t.cyTargetValue || 0), 0), [targets]);
  const totalLYAchieved = useMemo(() => targets.reduce((s, t) => s + (t.lyAchievedValue || 0), 0), [targets]);
  const overallGrowth = totalLY > 0 ? ((totalCY - totalLY) / totalLY * 100).toFixed(1) : 0;

  const targetStats = useMemo(() => ({
    total: targets.length,
    notSet: targets.filter(t => t.status === 'not_set').length,
    draft: targets.filter(t => t.status === 'draft').length,
    published: targets.filter(t => t.status === 'published').length,
  }), [targets]);

  // ==================== RENDER ====================

  return (
    <div className="specialist-yearly-targets">
      {/* Section Header */}
      <div className="yearly-targets-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>
            <i className="fas fa-user-tie" style={{ marginRight: '8px', color: '#6366f1' }}></i>
            Specialist Yearly Targets — FY {fiscalYear}
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Set yearly value targets (₹) for each Specialist under your area
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="abm-action-btn save"
            onClick={handleSave}
            disabled={!isDirty}
            style={{
              padding: '8px 16px', borderRadius: '6px', border: 'none',
              background: isDirty ? '#0ea5e9' : '#cbd5e1', color: '#fff',
              cursor: isDirty ? 'pointer' : 'not-allowed', fontSize: '0.85rem', fontWeight: 600
            }}
          >
            <i className="fas fa-save"></i> Save Draft
          </button>
          <button
            className="abm-action-btn publish"
            onClick={handlePublish}
            disabled={targetStats.draft === 0 && targetStats.notSet === targets.length}
            style={{
              padding: '8px 16px', borderRadius: '6px', border: 'none',
              background: '#6366f1', color: '#fff',
              cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600
            }}
          >
            <i className="fas fa-paper-plane"></i> Publish to Specialists
          </button>
        </div>
      </div>

      {/* Summary Row */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', minWidth: '150px', padding: '12px 16px', background: '#f0f9ff', borderRadius: '8px', borderLeft: '4px solid #0ea5e9' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Total Specialists</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0c4a6e' }}>{targets.length}</div>
        </div>
        <div style={{ flex: '1', minWidth: '150px', padding: '12px 16px', background: '#fdf4ff', borderRadius: '8px', borderLeft: '4px solid #6366f1' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Total CY Target</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#4c1d95' }}>₹{Utils.formatNumber(totalCY)}</div>
        </div>
        <div style={{ flex: '1', minWidth: '150px', padding: '12px 16px', background: '#f0fdf4', borderRadius: '8px', borderLeft: '4px solid #22c55e' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>LY Ahv</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#166534' }}>₹{Utils.formatNumber(totalLYAchieved)}</div>
        </div>
        <div style={{ flex: '1', minWidth: '150px', padding: '12px 16px', background: '#fffbeb', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Growth %</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: overallGrowth >= 0 ? '#166534' : '#dc2626' }}>
            {overallGrowth >= 0 ? '↑' : '↓'}{Math.abs(overallGrowth)}%
          </div>
        </div>
      </div>

      {/* Targets Table */}
      {targets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          <i className="fas fa-user-tie" style={{ fontSize: '2rem', marginBottom: '0.75rem', display: 'block' }}></i>
          <p>No specialists assigned to your area yet</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>#</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Specialist</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Area</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>LY Tgt (₹)</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>LY Ahv (₹)</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#475569', minWidth: '160px' }}>CY Target (₹)</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#475569' }}>Growth %</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#475569' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {targets.map((target, index) => {
                const growth = target.lyTargetValue > 0
                  ? ((target.cyTargetValue - target.lyTargetValue) / target.lyTargetValue * 100).toFixed(1)
                  : 0;
                const isPublished = target.status === 'published';

                return (
                  <tr key={target.id} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background 0.15s' }}>
                    <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{index + 1}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1e293b' }}>
                      <i className="fas fa-user-tie" style={{ marginRight: '6px', color: '#6366f1', fontSize: '0.8rem' }}></i>
                      {target.assigneeName}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#64748b' }}>{target.assigneeArea}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: '#64748b' }}>
                      {Utils.formatNumber(target.lyTargetValue)}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: '#64748b' }}>
                      {Utils.formatNumber(target.lyAchievedValue)}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      {isPublished ? (
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>
                          ₹{Utils.formatNumber(target.cyTargetValue)}
                        </span>
                      ) : (
                        <input
                          type="number"
                          value={editingValues[index] !== undefined ? editingValues[index] : (target.cyTargetValue || '')}
                          onChange={(e) => handleTargetInputChange(index, e.target.value)}
                          onBlur={(e) => handleTargetBlur(index, e.target.value)}
                          placeholder="Enter target value"
                          style={{
                            width: '100%', padding: '6px 10px', border: '1px solid #d1d5db',
                            borderRadius: '4px', fontSize: '0.9rem', textAlign: 'right',
                            outline: 'none', transition: 'border-color 0.2s'
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                          min="0"
                        />
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <span style={{
                        fontWeight: 600, fontSize: '0.85rem',
                        color: growth >= 0 ? '#16a34a' : '#dc2626'
                      }}>
                        {growth >= 0 ? '↑' : '↓'}{Math.abs(growth)}%
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block', padding: '3px 10px', borderRadius: '12px',
                        fontSize: '0.75rem', fontWeight: 600,
                        background: target.status === 'published' ? '#dcfce7' : target.status === 'draft' ? '#fef3c7' : '#f1f5f9',
                        color: target.status === 'published' ? '#166534' : target.status === 'draft' ? '#92400e' : '#64748b'
                      }}>
                        {target.status === 'published' ? 'Published' : target.status === 'draft' ? 'Draft' : 'Not Set'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Footer Totals */}
            <tfoot>
              <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0', fontWeight: 700 }}>
                <td colSpan="3" style={{ padding: '10px 12px', color: '#1e293b' }}>TOTAL</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: '#64748b' }}>
                  ₹{Utils.formatNumber(totalLY)}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: '#64748b' }}>
                  ₹{Utils.formatNumber(totalLYAchieved)}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: '#1e293b' }}>
                  ₹{Utils.formatNumber(totalCY)}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'center', color: overallGrowth >= 0 ? '#16a34a' : '#dc2626' }}>
                  {overallGrowth >= 0 ? '↑' : '↓'}{Math.abs(overallGrowth)}%
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
      {/* ========== CY BELOW LY AHV WARNING MODAL ========== */}
      {cyBelowLyAlert && (
        <div
          onClick={() => setCyBelowLyAlert(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '1rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '12px', maxWidth: '440px', width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              background: '#FFFBEB', borderBottom: '1px solid #FDE68A',
              padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
            }}>
              <i className="fas fa-exclamation-triangle" style={{ color: '#D97706', fontSize: '1.1rem' }}></i>
              <h3 style={{ margin: 0, color: '#D97706', fontSize: '1rem', fontWeight: 700 }}>
                CY Target Below LY Achievement
              </h3>
            </div>
            {/* Body */}
            <div style={{ padding: '1.25rem' }}>
              <p style={{ margin: '0 0 1rem', color: '#374151', lineHeight: 1.6, fontSize: '0.9rem' }}>
                The CY Target for{' '}
                <strong>{cyBelowLyAlert.specialistName}</strong> is being set to{' '}
                <strong style={{ color: '#DC2626' }}>₹{Utils.formatNumber(cyBelowLyAlert.cyValue)}</strong>,
                which is lower than last year's achievement of{' '}
                <strong style={{ color: '#059669' }}>₹{Utils.formatNumber(cyBelowLyAlert.lyAchievedValue)}</strong>.
              </p>
              {/* Comparison bar */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: '#F9FAFB', borderRadius: '8px', padding: '0.75rem 1rem',
                fontSize: '0.8125rem', color: '#374151', marginBottom: '1rem',
              }}>
                <span>LY Ahv: <strong style={{ color: '#059669' }}>₹{Utils.formatNumber(cyBelowLyAlert.lyAchievedValue)}</strong></span>
                <i className="fas fa-arrow-right" style={{ color: '#9CA3AF' }}></i>
                <span>CY Tgt: <strong style={{ color: '#DC2626' }}>₹{Utils.formatNumber(cyBelowLyAlert.cyValue)}</strong></span>
                <span style={{
                  background: '#FEE2E2', color: '#DC2626', padding: '2px 8px',
                  borderRadius: '999px', fontWeight: 700, fontSize: '0.75rem',
                }}>
                  {(((cyBelowLyAlert.cyValue - cyBelowLyAlert.lyAchievedValue) / cyBelowLyAlert.lyAchievedValue) * 100).toFixed(1)}%
                </span>
              </div>
              {/* Caution note */}
              <div style={{
                background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px',
                padding: '0.75rem 1rem', display: 'flex', gap: '0.625rem', alignItems: 'flex-start',
              }}>
                <i className="fas fa-info-circle" style={{ color: '#D97706', marginTop: '2px', flexShrink: 0 }}></i>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#92400E', lineHeight: 1.55 }}>
                  Setting a target below last year's actual achievement may signal a declining plan. Please confirm this is intentional.
                </p>
              </div>
            </div>
            {/* Actions */}
            <div style={{
              padding: '1rem 1.25rem', borderTop: '1px solid #F3F4F6',
              display: 'flex', gap: '0.75rem',
            }}>
              <button
                onClick={() => setCyBelowLyAlert(null)}
                style={{
                  flex: 1, padding: '9px 16px', borderRadius: '8px',
                  border: '1px solid #D1D5DB', background: '#fff',
                  color: '#374151', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem',
                }}
              >
                <i className="fas fa-arrow-left" style={{ marginRight: '6px' }}></i>Go Back & Change
              </button>
              <button
                onClick={cyBelowLyAlert.onProceed}
                style={{
                  flex: 1, padding: '9px 16px', borderRadius: '8px',
                  border: 'none', background: '#D97706',
                  color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem',
                }}
              >
                <i className="fas fa-check" style={{ marginRight: '6px' }}></i>Proceed Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ABMSpecialistYearlyTargets;
