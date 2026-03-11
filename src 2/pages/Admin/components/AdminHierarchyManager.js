/**
 * AdminHierarchyManager Component
 * Visual org tree to manage: Sales Head → ZBMs → ABMs → TBMs → Sales Reps
 *
 * Features:
 * - Expandable/collapsible tree view
 * - Add reportee at any level (including vacant placeholder)
 * - Edit member details
 * - Remove member
 * - Visual distinction for vacant positions
 * - Supports "blank" entries for unknown future recruits
 *
 * @version 1.0.0
 */

import React, { useState, useCallback } from 'react';
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

const CHILD_ROLE = {
  sales_head: 'zbm',
  zbm: 'abm',
  abm: 'tbm',
  tbm: 'sales_rep',
};

const ROLE_COLORS = {
  sales_head: '#0C2340',
  zbm: '#7C3AED',
  abm: '#2563EB',
  tbm: '#0891B2',
  sales_rep: '#059669',
};

function AdminHierarchyManager({ hierarchy, onRefresh, showToast, showModal }) {
  const [expandedNodes, setExpandedNodes] = useState(new Set(['head_001']));
  const [addingTo, setAddingTo] = useState(null); // { parentId, parentRole }
  const [editingNode, setEditingNode] = useState(null);
  const [formData, setFormData] = useState({ name: '', territory: '', isVacant: false });
  const [isSaving, setIsSaving] = useState(false);

  const toggleNode = useCallback((id) => {
    setExpandedNodes(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }, []);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').filter(Boolean).map(w => w[0]).join('').substring(0, 2).toUpperCase();
  };

  // Count total reportees recursively
  const countAll = (node) => {
    if (!node.reportees || node.reportees.length === 0) return 0;
    return node.reportees.length + node.reportees.reduce((sum, r) => sum + countAll(r), 0);
  };

  // Count vacants
  const countVacants = (node) => {
    let count = 0;
    if (node.isVacant) count = 1;
    if (node.reportees) {
      node.reportees.forEach(r => { count += countVacants(r); });
    }
    return count;
  };

  // Open Add form
  const handleOpenAdd = (parentId, parentRole) => {
    setEditingNode(null);
    setAddingTo({ parentId, parentRole });
    setFormData({ name: '', territory: '', isVacant: false });
  };

  // Open Add Vacant form
  const handleAddVacant = (parentId, parentRole) => {
    setEditingNode(null);
    setAddingTo({ parentId, parentRole });
    setFormData({ name: '', territory: '', isVacant: true });
  };

  // Open Edit form
  const handleOpenEdit = (node) => {
    setAddingTo(null);
    setEditingNode(node);
    setFormData({ name: node.name, territory: node.territory, isVacant: node.isVacant });
  };

  // Close form
  const handleCloseForm = () => {
    setAddingTo(null);
    setEditingNode(null);
    setFormData({ name: '', territory: '', isVacant: false });
  };

  // Save add
  const handleSaveAdd = async () => {
    if (!formData.isVacant && !formData.name.trim()) {
      showToast('Validation', 'Name is required for non-vacant positions.', 'warning');
      return;
    }
    setIsSaving(true);
    try {
      const childRole = CHILD_ROLE[addingTo.parentRole];
      const name = formData.isVacant
        ? (formData.name.trim() || `Vacant - ${ROLE_SHORT[childRole]} Position`)
        : formData.name.trim();

      await AdminApiService.addMember({
        parentId: addingTo.parentId,
        name,
        role: childRole,
        territory: formData.territory.trim(),
        isVacant: formData.isVacant,
      });
      showToast('Added', `${name} added successfully.`, 'success');
      handleCloseForm();
      // Expand parent to show new child
      setExpandedNodes(prev => new Set([...prev, addingTo.parentId]));
      await onRefresh();
    } catch (error) {
      showToast('Error', `Failed to add: ${error.message}`, 'error');
    }
    setIsSaving(false);
  };

  // Save edit
  const handleSaveEdit = async () => {
    if (!formData.isVacant && !formData.name.trim()) {
      showToast('Validation', 'Name is required.', 'warning');
      return;
    }
    setIsSaving(true);
    try {
      await AdminApiService.updateMember(editingNode.id, {
        name: formData.name.trim() || editingNode.name,
        territory: formData.territory.trim(),
        isVacant: formData.isVacant,
      });
      showToast('Updated', `${formData.name || editingNode.name} updated.`, 'success');
      handleCloseForm();
      await onRefresh();
    } catch (error) {
      showToast('Error', `Failed to update: ${error.message}`, 'error');
    }
    setIsSaving(false);
  };

  // Remove member
  const handleRemove = (node) => {
    const childCount = countAll(node);
    showModal(
      'Remove Member',
      `Are you sure you want to remove "${node.name}"?${childCount > 0 ? ` This will also remove ${childCount} reportee(s) underneath.` : ''}`,
      'danger',
      async () => {
        try {
          await AdminApiService.removeMember(node.id);
          showToast('Removed', `${node.name} has been removed.`, 'success');
          await onRefresh();
        } catch (error) {
          showToast('Error', `Failed to remove: ${error.message}`, 'error');
        }
      }
    );
  };

  // Render a node in the tree
  const renderNode = (node, depth = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.reportees && node.reportees.length > 0;
    const canAddChild = CHILD_ROLE[node.role]; // Can add if there's a child role
    const totalReportees = countAll(node);
    const vacants = countVacants(node);
    const color = ROLE_COLORS[node.role] || '#6B7280';

    return (
      <div key={node.id} className="adm-tree-node" style={{ '--node-depth': depth }}>
        <div className={`adm-tree-card ${node.isVacant ? 'adm-tree-vacant' : ''}`}>
          {/* Expand/Collapse */}
          <div className="adm-tree-expand" onClick={() => hasChildren && toggleNode(node.id)}>
            {hasChildren ? (
              <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'} adm-tree-chevron`}></i>
            ) : (
              <span className="adm-tree-dot" style={{ background: color }}></span>
            )}
          </div>

          {/* Avatar */}
          <div className={`adm-tree-avatar ${node.isVacant ? 'vacant' : ''}`} style={{ background: node.isVacant ? '#F3F4F6' : color + '15', color: node.isVacant ? '#9CA3AF' : color, border: `2px solid ${node.isVacant ? '#D1D5DB' : color}40` }}>
            {node.isVacant ? <i className="fas fa-user-plus"></i> : getInitials(node.name)}
          </div>

          {/* Info */}
          <div className="adm-tree-info" onClick={() => hasChildren && toggleNode(node.id)}>
            <div className="adm-tree-name">
              {node.name}
              {node.isVacant && <span className="adm-vacant-badge">VACANT</span>}
            </div>
            <div className="adm-tree-meta">
              <span className="adm-tree-role" style={{ color }}>{ROLE_SHORT[node.role]}</span>
              {node.territory && <span className="adm-tree-territory"><i className="fas fa-map-marker-alt"></i> {node.territory}</span>}
              {hasChildren && (
                <span className="adm-tree-count">
                  {node.reportees.length} direct{vacants > 0 && <span className="adm-vacancy-count"> · {vacants} vacant</span>}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="adm-tree-actions">
            {canAddChild && (
              <>
                <button className="adm-icon-btn adm-icon-add" onClick={() => handleOpenAdd(node.id, node.role)} title={`Add ${ROLE_LABELS[CHILD_ROLE[node.role]]}`}>
                  <i className="fas fa-user-plus"></i>
                </button>
                <button className="adm-icon-btn adm-icon-vacant" onClick={() => handleAddVacant(node.id, node.role)} title={`Add Vacant ${ROLE_SHORT[CHILD_ROLE[node.role]]} Slot`}>
                  <i className="fas fa-user-clock"></i>
                </button>
              </>
            )}
            <button className="adm-icon-btn adm-icon-edit" onClick={() => handleOpenEdit(node)} title="Edit">
              <i className="fas fa-pen"></i>
            </button>
            {node.role !== 'sales_head' && (
              <button className="adm-icon-btn adm-icon-delete" onClick={() => handleRemove(node)} title="Remove">
                <i className="fas fa-trash-alt"></i>
              </button>
            )}
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="adm-tree-children">
            {node.reportees.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="adm-hierarchy-section">
      {/* Actions bar */}
      <div className="adm-hierarchy-toolbar">
        <div className="adm-hierarchy-info">
          <i className="fas fa-info-circle"></i>
          <span>Click <i className="fas fa-user-plus" style={{ color: '#6366F1' }}></i> to add a named member or <i className="fas fa-user-clock" style={{ color: '#F59E0B' }}></i> to create a vacant placeholder for future recruitment.</span>
        </div>
        <div className="adm-hierarchy-actions">
          <button className="adm-btn adm-btn-ghost" onClick={() => setExpandedNodes(new Set())}>
            <i className="fas fa-compress-alt"></i> Collapse All
          </button>
          <button className="adm-btn adm-btn-ghost" onClick={() => {
            const all = new Set();
            const collectIds = (nodes) => { nodes.forEach(n => { all.add(n.id); if (n.reportees) collectIds(n.reportees); }); };
            collectIds(hierarchy);
            setExpandedNodes(all);
          }}>
            <i className="fas fa-expand-alt"></i> Expand All
          </button>
        </div>
      </div>

      {/* Tree */}
      <div className="adm-tree">
        {hierarchy.map(node => renderNode(node))}
      </div>

      {/* Add/Edit Panel */}
      {(addingTo || editingNode) && (
        <div className="adm-panel-overlay" onClick={handleCloseForm}>
          <div className="adm-panel adm-panel-sm" onClick={(e) => e.stopPropagation()}>
            <div className="adm-panel-header">
              <h3>
                {addingTo
                  ? (formData.isVacant ? `Add Vacant ${ROLE_LABELS[CHILD_ROLE[addingTo.parentRole]]}` : `Add ${ROLE_LABELS[CHILD_ROLE[addingTo.parentRole]]}`)
                  : `Edit ${ROLE_LABELS[editingNode.role]}`}
              </h3>
              <button className="adm-panel-close" onClick={handleCloseForm}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="adm-panel-body">
              <div className="adm-form-group">
                <label>
                  {formData.isVacant ? 'Position Label' : 'Full Name'} 
                  {!formData.isVacant && <span className="adm-required">*</span>}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                  placeholder={formData.isVacant ? 'e.g. Vacant - Position 1 (optional)' : 'e.g. Rajesh Kumar'}
                />
              </div>
              <div className="adm-form-group">
                <label>Territory / Region</label>
                <input
                  type="text"
                  value={formData.territory}
                  onChange={(e) => setFormData(f => ({ ...f, territory: e.target.value }))}
                  placeholder="e.g. North Delhi"
                />
              </div>
              {editingNode && (
                <div className="adm-form-group">
                  <label>Mark as Vacant</label>
                  <div className="adm-status-switch">
                    <label className="adm-switch">
                      <input type="checkbox" checked={formData.isVacant} onChange={(e) => setFormData(f => ({ ...f, isVacant: e.target.checked }))} />
                      <span className="adm-slider"></span>
                    </label>
                    <span className={`adm-switch-label ${formData.isVacant ? 'inactive' : 'active'}`}>
                      {formData.isVacant ? 'Position is vacant (placeholder)' : 'Position is filled'}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="adm-panel-footer">
              <button className="adm-btn adm-btn-ghost" onClick={handleCloseForm}>Cancel</button>
              <button className="adm-btn adm-btn-primary" onClick={addingTo ? handleSaveAdd : handleSaveEdit} disabled={isSaving}>
                {isSaving ? <><span className="adm-spinner"></span> Saving...</> : <><i className="fas fa-save"></i> {addingTo ? 'Add' : 'Update'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminHierarchyManager;
