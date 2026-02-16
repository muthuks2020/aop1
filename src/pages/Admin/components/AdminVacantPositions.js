/**
 * AdminVacantPositions Component
 * Flat list of all vacant positions across hierarchy
 * Admin can fill vacancies when recruits are hired
 *
 * Features:
 * - List of all vacant positions with reporting chain
 * - Quick-fill form to assign a name to the vacant slot
 * - Filter by role level
 * - Summary cards showing vacancies by level
 *
 * @version 1.0.0
 */

import React, { useState, useMemo } from 'react';
import { AdminApiService } from '../../../services/adminApi';

const ROLE_LABELS = {
  sales_head: 'Sales Head',
  zbm: 'Zonal Business Manager',
  abm: 'Area Business Manager',
  tbm: 'Territory Business Manager',
  sales_rep: 'Sales Representative',
};

const ROLE_SHORT = {
  sales_head: 'SH',
  zbm: 'ZBM',
  abm: 'ABM',
  tbm: 'TBM',
  sales_rep: 'SR',
};

const ROLE_COLORS = {
  sales_head: '#0C2340',
  zbm: '#7C3AED',
  abm: '#2563EB',
  tbm: '#0891B2',
  sales_rep: '#059669',
};

function AdminVacantPositions({ vacantPositions, onRefresh, showToast, showModal }) {
  const [roleFilter, setRoleFilter] = useState('all');
  const [fillingId, setFillingId] = useState(null);
  const [fillForm, setFillForm] = useState({ name: '', territory: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Count by role
  const countByRole = useMemo(() => {
    const counts = { zbm: 0, abm: 0, tbm: 0, sales_rep: 0 };
    vacantPositions.forEach(v => { if (counts[v.role] !== undefined) counts[v.role]++; });
    return counts;
  }, [vacantPositions]);

  // Filtered
  const filtered = useMemo(() => {
    if (roleFilter === 'all') return vacantPositions;
    return vacantPositions.filter(v => v.role === roleFilter);
  }, [vacantPositions, roleFilter]);

  // Fill a vacant position
  const handleFill = (position) => {
    setFillingId(position.id);
    setFillForm({ name: '', territory: position.territory || '' });
  };

  const handleSaveFill = async () => {
    if (!fillForm.name.trim()) {
      showToast('Validation', 'Please enter the recruit\'s name.', 'warning');
      return;
    }
    setIsSaving(true);
    try {
      await AdminApiService.fillVacantPosition(fillingId, {
        name: fillForm.name.trim(),
        territory: fillForm.territory.trim(),
      });
      showToast('Filled', `Position filled with ${fillForm.name.trim()}.`, 'success');
      setFillingId(null);
      await onRefresh();
    } catch (error) {
      showToast('Error', `Failed to fill position: ${error.message}`, 'error');
    }
    setIsSaving(false);
  };

  // Remove vacant position
  const handleRemoveVacant = (position) => {
    showModal(
      'Remove Vacant Position',
      `Remove the vacant ${ROLE_LABELS[position.role]} slot at "${position.territory}"? Any planned targets assigned to this position will also be removed.`,
      'danger',
      async () => {
        try {
          await AdminApiService.removeMember(position.id);
          showToast('Removed', 'Vacant position removed.', 'success');
          await onRefresh();
        } catch (error) {
          showToast('Error', `Failed to remove: ${error.message}`, 'error');
        }
      }
    );
  };

  return (
    <div className="adm-vacant-section">
      {/* Summary Cards */}
      <div className="adm-vacant-summary">
        {Object.entries(countByRole).map(([role, count]) => (
          <div
            key={role}
            className={`adm-vacant-card ${roleFilter === role ? 'active' : ''} ${count === 0 ? 'zero' : ''}`}
            onClick={() => setRoleFilter(roleFilter === role ? 'all' : role)}
          >
            <div className="adm-vacant-card-icon" style={{ background: ROLE_COLORS[role] + '15', color: ROLE_COLORS[role] }}>
              <i className="fas fa-user-clock"></i>
            </div>
            <div className="adm-vacant-card-info">
              <span className="adm-vacant-card-count">{count}</span>
              <span className="adm-vacant-card-label">{ROLE_SHORT[role]}</span>
            </div>
          </div>
        ))}
        <div
          className={`adm-vacant-card total ${roleFilter === 'all' ? 'active' : ''}`}
          onClick={() => setRoleFilter('all')}
        >
          <div className="adm-vacant-card-icon" style={{ background: '#EF444415', color: '#EF4444' }}>
            <i className="fas fa-users"></i>
          </div>
          <div className="adm-vacant-card-info">
            <span className="adm-vacant-card-count">{vacantPositions.length}</span>
            <span className="adm-vacant-card-label">Total</span>
          </div>
        </div>
      </div>

      {/* Vacant List */}
      {filtered.length === 0 ? (
        <div className="adm-vacant-empty">
          <i className="fas fa-check-circle"></i>
          <h3>{roleFilter === 'all' ? 'No vacant positions' : `No vacant ${ROLE_LABELS[roleFilter]} positions`}</h3>
          <p>All positions are currently filled. Use the Team Hierarchy tab to add vacant slots for future recruitment planning.</p>
        </div>
      ) : (
        <div className="adm-vacant-list">
          {filtered.map(position => (
            <div key={position.id} className="adm-vacant-item">
              <div className="adm-vacant-item-left">
                <div className="adm-vacant-avatar" style={{ background: ROLE_COLORS[position.role] + '15', color: ROLE_COLORS[position.role], border: `2px dashed ${ROLE_COLORS[position.role]}40` }}>
                  <i className="fas fa-user-plus"></i>
                </div>
                <div className="adm-vacant-info">
                  <div className="adm-vacant-role">
                    <span className="adm-role-badge" style={{ background: ROLE_COLORS[position.role], color: '#fff' }}>{ROLE_SHORT[position.role]}</span>
                    <span>{ROLE_LABELS[position.role]}</span>
                  </div>
                  <div className="adm-vacant-territory">
                    <i className="fas fa-map-marker-alt"></i> {position.territory || 'No territory assigned'}
                  </div>
                  <div className="adm-vacant-reports">
                    <i className="fas fa-level-up-alt" style={{ transform: 'rotate(90deg)' }}></i> Reports to: <strong>{position.parentName || 'N/A'}</strong>
                  </div>
                </div>
              </div>

              <div className="adm-vacant-item-right">
                {fillingId === position.id ? (
                  <div className="adm-fill-form">
                    <input
                      type="text"
                      placeholder="Recruit's full name"
                      value={fillForm.name}
                      onChange={(e) => setFillForm(f => ({ ...f, name: e.target.value }))}
                      autoFocus
                    />
                    <input
                      type="text"
                      placeholder="Territory"
                      value={fillForm.territory}
                      onChange={(e) => setFillForm(f => ({ ...f, territory: e.target.value }))}
                    />
                    <div className="adm-fill-btns">
                      <button className="adm-btn adm-btn-sm adm-btn-primary" onClick={handleSaveFill} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Fill Position'}
                      </button>
                      <button className="adm-btn adm-btn-sm adm-btn-ghost" onClick={() => setFillingId(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="adm-vacant-btns">
                    <button className="adm-btn adm-btn-sm adm-btn-success" onClick={() => handleFill(position)}>
                      <i className="fas fa-user-check"></i> Fill Position
                    </button>
                    <button className="adm-icon-btn adm-icon-delete" onClick={() => handleRemoveVacant(position)} title="Remove vacant slot">
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Note */}
      <div className="adm-vacant-note">
        <i className="fas fa-lightbulb"></i>
        <div>
          <strong>Tip:</strong> Vacant positions allow targets and values to be entered for planning purposes even before recruitment is complete. 
          Once a recruit joins, click "Fill Position" to assign their name. All previously entered values will be preserved.
        </div>
      </div>
    </div>
  );
}

export default AdminVacantPositions;
