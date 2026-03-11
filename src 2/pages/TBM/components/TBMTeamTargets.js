/**
 * TBMTeamTargets Component
 * TBM enters targets for all sales team members under them.
 * These targets get reflected as the assigned targets for each sales rep.
 * 
 * @author Appasamy Associates - Product Commitment PWA
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { TBMApiService } from '../../../services/tbmApi';
import { Utils } from '../../../utils/helpers';

const MONTHS = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];
const MONTH_LABELS = ['APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR'];

function TBMTeamTargets({ categories = [], salesReps = [], showToast }) {
  const [selectedRepId, setSelectedRepId] = useState('');
  const [repTargets, setRepTargets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeCell, setActiveCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(new Set(['equipment', 'iol', 'ovd']));
  const [summaryView, setSummaryView] = useState(false);
  const [allRepsSummary, setAllRepsSummary] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (activeCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [activeCell]);

  useEffect(() => {
    if (selectedRepId) loadRepTargets(selectedRepId);
  }, [selectedRepId]);

  useEffect(() => { loadAllRepsSummary(); }, []);

  const loadRepTargets = async (repId) => {
    setIsLoading(true);
    try {
      const targets = await TBMApiService.getTeamTargetsForRep(repId);
      setRepTargets(targets);
    } catch (error) {
      showToast('Error', 'Failed to load targets for this rep.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllRepsSummary = async () => {
    try {
      const summary = await TBMApiService.getTeamTargetsSummary();
      setAllRepsSummary(summary);
    } catch (error) { /* silently handle */ }
  };

  const handleUpdateTarget = useCallback((productId, month, value) => {
    setRepTargets(prev => prev.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          monthlyTargets: {
            ...p.monthlyTargets,
            [month]: { ...p.monthlyTargets?.[month], cyQty: value }
          }
        };
      }
      return p;
    }));
  }, []);

  const handleSaveTargets = useCallback(async () => {
    if (!selectedRepId) return;
    setIsSaving(true);
    try {
      await TBMApiService.saveTeamTargetsForRep(selectedRepId, repTargets);
      const repName = salesReps.find(r => r.id === parseInt(selectedRepId))?.name || 'sales rep';
      showToast('Saved', `Targets saved for ${repName}.`, 'success');
      loadAllRepsSummary();
    } catch (error) {
      showToast('Error', 'Failed to save targets.', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [selectedRepId, repTargets, salesReps, showToast]);

  const handleAssignTargets = useCallback(async () => {
    if (!selectedRepId) return;
    setIsSaving(true);
    try {
      await TBMApiService.assignTeamTargetsToRep(selectedRepId, repTargets);
      const repName = salesReps.find(r => r.id === parseInt(selectedRepId))?.name || 'sales rep';
      showToast('Assigned', `Targets assigned to ${repName}. They will see these as their targets.`, 'success');
      loadAllRepsSummary();
    } catch (error) {
      showToast('Error', 'Failed to assign targets.', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [selectedRepId, repTargets, salesReps, showToast]);

  const handleCellClick = (productId, month, currentValue) => {
    setActiveCell({ productId, month });
    setEditValue(currentValue?.toString() || '');
  };

  const handleCellBlur = () => {
    if (activeCell) {
      const numValue = parseInt(editValue) || 0;
      handleUpdateTarget(activeCell.productId, activeCell.month, numValue);
      setActiveCell(null);
      setEditValue('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleCellBlur();
    else if (e.key === 'Escape') { setActiveCell(null); setEditValue(''); }
    else if (e.key === 'Tab') { e.preventDefault(); handleCellBlur(); }
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(categoryId) ? next.delete(categoryId) : next.add(categoryId);
      return next;
    });
  };

  const getQuarterClass = (idx) => idx < 3 ? 'q1' : idx < 6 ? 'q2' : idx < 9 ? 'q3' : 'q4';

  const selectedRepName = useMemo(() => {
    const rep = salesReps.find(r => r.id === parseInt(selectedRepId));
    return rep?.name || '';
  }, [selectedRepId, salesReps]);

  // Group products by category
  const productsByCategory = useMemo(() => {
    const grouped = {};
    categories.forEach(cat => {
      grouped[cat.id] = repTargets.filter(p => p.categoryId === cat.id);
    });
    return grouped;
  }, [repTargets, categories]);

  // ==================== RENDER ====================

  return (
    <div style={{ padding: '0' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1B365D 0%, #2A5298 100%)',
        color: '#fff', padding: '1.25rem 1.5rem', borderRadius: '12px',
        margin: '1rem', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <i className="fas fa-users-cog" style={{ fontSize: '1.5rem' }}></i>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>Team Targets</h2>
            <span style={{ fontSize: '0.8125rem', opacity: 0.8 }}>Assign targets to sales team members</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={() => setSummaryView(!summaryView)} style={{
            padding: '0.5rem 1rem', borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.3)',
            background: summaryView ? 'rgba(255,255,255,0.2)' : 'transparent',
            color: '#fff', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}>
            <i className={`fas fa-${summaryView ? 'edit' : 'list'}`}></i>
            {summaryView ? 'Enter Targets' : 'View Summary'}
          </button>
        </div>
      </div>

      {/* Summary View */}
      {summaryView ? (
        <div style={{ padding: '0 1rem 1rem' }}>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr>
                  {['Sales Rep', 'Territory', 'Products', 'Total Qty', 'Status'].map(h => (
                    <th key={h} style={{
                      padding: '0.875rem 0.75rem', textAlign: h === 'Sales Rep' ? 'left' : 'center',
                      background: '#F3F4F6', fontWeight: 700, color: '#4B5563',
                      fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em',
                      borderBottom: '2px solid #E5E7EB'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allRepsSummary.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#9CA3AF' }}>
                    <i className="fas fa-inbox" style={{ fontSize: '2rem', opacity: 0.3, marginBottom: '0.5rem', display: 'block' }}></i>
                    No team targets assigned yet.
                  </td></tr>
                ) : allRepsSummary.map(rep => (
                  <tr key={rep.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 600, color: '#1F2937' }}>{rep.name}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', color: '#6B7280' }}>{rep.territory}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', color: '#6B7280' }}>{rep.productCount}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 700, color: '#10B981', fontFamily: 'JetBrains Mono, monospace' }}>
                      {Utils.formatNumber(rep.totalQty)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <span style={{
                        padding: '0.25rem 0.625rem', borderRadius: '9999px', fontSize: '0.6875rem', fontWeight: 600,
                        background: rep.assigned ? '#D1FAE5' : '#FEF3C7',
                        color: rep.assigned ? '#059669' : '#B45309'
                      }}>
                        {rep.assigned ? 'Assigned' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          {/* Rep Selector & Actions */}
          <div style={{
            padding: '1rem 1.5rem', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB',
            display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Sales Rep
              </label>
              <select
                value={selectedRepId}
                onChange={(e) => setSelectedRepId(e.target.value)}
                style={{
                  padding: '0.5rem 1rem', background: '#fff', border: '1px solid #E5E7EB',
                  borderRadius: '8px', color: '#374151', fontSize: '0.875rem', cursor: 'pointer', minWidth: '200px'
                }}
              >
                <option value="">-- Select Sales Rep --</option>
                {salesReps.map(rep => (
                  <option key={rep.id} value={rep.id}>{rep.name} ({rep.territory})</option>
                ))}
              </select>
            </div>

            {selectedRepId && (
              <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                <button onClick={handleSaveTargets} disabled={isSaving} style={{
                  padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #E5E7EB',
                  background: '#fff', color: '#374151', cursor: 'pointer', fontSize: '0.8125rem',
                  fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}>
                  {isSaving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
                  Save Draft
                </button>
                <button onClick={handleAssignTargets} disabled={isSaving} style={{
                  padding: '0.5rem 1rem', borderRadius: '8px', border: 'none',
                  background: 'linear-gradient(135deg, #10B981, #059669)', color: '#fff',
                  cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  boxShadow: '0 2px 8px rgba(16,185,129,0.3)'
                }}>
                  {isSaving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
                  Assign to {selectedRepName || 'Rep'}
                </button>
              </div>
            )}
          </div>

          {/* Target Entry Grid */}
          {!selectedRepId ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#9CA3AF' }}>
              <i className="fas fa-user-plus" style={{ fontSize: '3rem', opacity: 0.3, marginBottom: '1rem', display: 'block' }}></i>
              <h3 style={{ color: '#6B7280', marginBottom: '0.5rem' }}>Select a Sales Rep</h3>
              <p>Choose a sales representative from the dropdown above to enter their targets.</p>
            </div>
          ) : isLoading ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#9CA3AF' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '1rem', display: 'block' }}></i>
              <p>Loading targets...</p>
            </div>
          ) : (
            <div style={{ padding: '0 1rem 1rem', overflow: 'auto' }}>
              <div style={{ 
                background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB',
                overflow: 'auto', minWidth: '100%'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', minWidth: '1200px' }}>
                  <thead>
                    <tr>
                      <th style={{
                        padding: '0.875rem 1.25rem', textAlign: 'left', background: '#F3F4F6',
                        fontWeight: 700, color: '#4B5563', fontSize: '0.6875rem', textTransform: 'uppercase',
                        letterSpacing: '0.05em', borderBottom: '2px solid #E5E7EB',
                        position: 'sticky', left: 0, zIndex: 10, minWidth: '200px'
                      }}>Product</th>
                      {MONTH_LABELS.map((m, idx) => (
                        <th key={m} style={{
                          padding: '0.75rem 0.25rem', textAlign: 'center', fontWeight: 700,
                          fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em',
                          borderBottom: '2px solid #E5E7EB', minWidth: '55px',
                          background: idx < 3 ? '#EFF6FF' : idx < 6 ? '#F0FDF4' : idx < 9 ? '#FFFBEB' : '#FEF2F2',
                          color: idx < 3 ? '#1D4ED8' : idx < 6 ? '#15803D' : idx < 9 ? '#B45309' : '#B91C1C',
                          borderTop: `3px solid ${idx < 3 ? '#3B82F6' : idx < 6 ? '#22C55E' : idx < 9 ? '#F59E0B' : '#EF4444'}`
                        }}>{m}</th>
                      ))}
                      <th style={{
                        padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 700,
                        fontSize: '0.6875rem', background: '#D1FAE5', color: '#059669',
                        borderBottom: '2px solid #E5E7EB', borderLeft: '2px solid #10B981', minWidth: '70px'
                      }}>TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map(category => {
                      const catProducts = productsByCategory[category.id] || [];
                      if (catProducts.length === 0) return null;
                      const isExpanded = expandedCategories.has(category.id);

                      return (
                        <React.Fragment key={category.id}>
                          {/* Category Header */}
                          <tr onClick={() => toggleCategory(category.id)} style={{ cursor: 'pointer' }}>
                            <td colSpan={14} style={{
                              padding: '0.75rem 1.25rem', background: '#F8FAFC',
                              fontWeight: 700, color: '#1F2937', fontSize: '0.875rem',
                              borderBottom: '1px solid #E5E7EB'
                            }}>
                              <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'}`} style={{ marginRight: '0.5rem', color: '#9CA3AF', fontSize: '0.75rem' }}></i>
                              <i className={`fas ${category.icon || 'fa-box'}`} style={{ marginRight: '0.5rem', color: '#00A19B' }}></i>
                              {category.name}
                              <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 400 }}>
                                ({catProducts.length} products)
                              </span>
                            </td>
                          </tr>

                          {/* Product Rows */}
                          {isExpanded && catProducts.map(product => (
                            <tr key={product.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                              <td style={{
                                padding: '0.5rem 1.25rem', position: 'sticky', left: 0,
                                background: '#fff', zIndex: 5, borderRight: '1px solid #E5E7EB'
                              }}>
                                <div style={{ fontWeight: 600, color: '#1F2937', fontSize: '0.8125rem' }}>{product.name}</div>
                                <div style={{ fontSize: '0.6875rem', color: '#9CA3AF', fontFamily: 'JetBrains Mono, monospace' }}>{product.code}</div>
                              </td>
                              {MONTHS.map((month, idx) => {
                                const monthData = product.monthlyTargets?.[month] || {};
                                const isActive = activeCell?.productId === product.id && activeCell?.month === month;
                                return (
                                  <td key={month}
                                    onClick={() => handleCellClick(product.id, month, monthData.cyQty)}
                                    style={{
                                      padding: '0.25rem', textAlign: 'center', cursor: 'pointer',
                                      background: isActive ? 'rgba(0,161,155,0.1)' : 'transparent',
                                      borderRight: (idx === 2 || idx === 5 || idx === 8) ? '2px solid #E5E7EB' : '1px solid #F3F4F6'
                                    }}
                                  >
                                    {isActive ? (
                                      <input
                                        ref={inputRef}
                                        type="text"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value.replace(/[^0-9]/g, ''))}
                                        onBlur={handleCellBlur}
                                        onKeyDown={handleKeyDown}
                                        style={{
                                          width: '100%', border: '2px solid #00A19B', borderRadius: '4px',
                                          padding: '2px 4px', textAlign: 'center', fontSize: '0.8125rem',
                                          fontFamily: 'JetBrains Mono, monospace', outline: 'none',
                                          boxShadow: '0 0 0 3px rgba(0,161,155,0.15)'
                                        }}
                                      />
                                    ) : (
                                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8125rem', color: '#374151' }}>
                                        {Utils.formatNumber(monthData.cyQty || 0)}
                                      </span>
                                    )}
                                  </td>
                                );
                              })}
                              <td style={{
                                padding: '0.5rem', textAlign: 'center', fontWeight: 700,
                                color: '#10B981', fontFamily: 'JetBrains Mono, monospace',
                                borderLeft: '2px solid #10B981', background: 'rgba(16,185,129,0.05)'
                              }}>
                                {Utils.formatNumber(
                                  MONTHS.reduce((sum, m) => sum + (product.monthlyTargets?.[m]?.cyQty || 0), 0)
                                )}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default TBMTeamTargets;
