
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

  const handleTargetChange = useCallback((index, value) => {
    const numValue = parseFloat(value) || 0;
    setTargets(prev => prev.map((t, i) => 
      i === index ? { ...t, cyTargetValue: numValue, status: t.status === 'not_set' ? 'draft' : t.status } : t
    ));
    setIsDirty(true);
  }, []);

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
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>LY Achieved</div>
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
                <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>LY Target (₹)</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>LY Achieved (₹)</th>
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
                          value={target.cyTargetValue || ''}
                          onChange={(e) => handleTargetChange(index, e.target.value)}
                          placeholder="Enter target value"
                          style={{
                            width: '100%', padding: '6px 10px', border: '1px solid #d1d5db',
                            borderRadius: '4px', fontSize: '0.9rem', textAlign: 'right',
                            outline: 'none', transition: 'border-color 0.2s'
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                          onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
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
    </div>
  );
}

export default ABMSpecialistYearlyTargets;
