/**
 * ABMAreaTargetGrid — Wraps the common TargetEntryGrid with area branding
 * Reuses the SAME target entry grid as Sales Rep (per requirement)
 * Adds area-level header + Submit to ZBM flow
 * 
 * @version 2.0.0 — Direct reuse of common TargetEntryGrid
 */
import React from 'react';
import TargetEntryGrid from '../../../components/common/TargetEntryGrid';

function ABMAreaTargetGrid({ categories, products, onUpdateTarget, onSaveAll, onSubmitAll, fiscalYear, overallYearlyTargetValue, areaName }) {
  return (
    <div className="abm-area-wrapper">
      {/* Area branding header */}
      <div style={{
        background: 'linear-gradient(135deg, #312E81, #4F46E5 60%, #6366F1)',
        padding: '1rem 1.5rem', color: '#fff', borderRadius: '12px 12px 0 0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem' }}>
            <i className="fas fa-map"></i>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
              <i className="fas fa-table" style={{ marginRight: 6, opacity: 0.8, fontSize: '0.875rem' }}></i>
              Area Target Entry
            </h3>
            <span style={{ fontSize: '0.8125rem', opacity: 0.85 }}>{areaName || 'Area'}</span>
          </div>
        </div>
        <span style={{ background: 'rgba(255,255,255,0.2)', padding: '0.375rem 1rem', borderRadius: 20, fontSize: '0.8125rem', fontWeight: 600 }}>
          FY {fiscalYear}
        </span>
      </div>
      <div style={{
        background: '#EEF2FF', padding: '0.625rem 1.5rem', fontSize: '0.8125rem', color: '#4338CA',
        display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #E0E7FF'
      }}>
        <i className="fas fa-info-circle"></i>
        <span>Enter <strong>area-level</strong> monthly targets. Once submitted, targets go to <strong>ZBM</strong> for approval.</span>
      </div>
      {/* Reuse the exact same TargetEntryGrid from Sales Rep */}
      <TargetEntryGrid
        categories={categories}
        products={products}
        onUpdateTarget={onUpdateTarget}
        onSaveAll={onSaveAll}
        onSubmitAll={onSubmitAll}
        userRole="abm"
        fiscalYear={fiscalYear}
        overallYearlyTargetValue={overallYearlyTargetValue}
      />
    </div>
  );
}
export default ABMAreaTargetGrid;
