

import React, { useState, useMemo, useCallback } from 'react';
import { Utils } from '../../../utils/helpers';

const MONTHS = ['apr','may','jun','jul','aug','sep','oct','nov','dec','jan','feb','mar'];
const MONTH_LABELS = ['APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC','JAN','FEB','MAR'];

function ABMSpecialistApprovals({
  submissions = [],
  categories = [],
  onApprove,
  onBulkApprove,
  onEditCell,
  editedCells = new Set(),
  showToast
}) {
  const [specialistFilter, setSpecialistFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // ==================== DERIVED DATA ====================

  const uniqueSpecialists = useMemo(() => {
    const map = {};
    submissions.forEach(s => {
      if (!map[s.specialistId]) {
        map[s.specialistId] = { id: s.specialistId, name: s.specialistName, area: s.area || '' };
      }
    });
    return Object.values(map);
  }, [submissions]);

  const approvalStats = useMemo(() => ({
    total: submissions.length,
    pending: submissions.filter(s => s.status === 'submitted').length,
    approved: submissions.filter(s => s.status === 'approved').length
  }), [submissions]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(s => {
      if (specialistFilter !== 'all' && s.specialistId !== specialistFilter) return false;
      if (categoryFilter !== 'all' && s.categoryId !== categoryFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          s.productName?.toLowerCase().includes(term) ||
          s.specialistName?.toLowerCase().includes(term) ||
          s.categoryId?.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [submissions, specialistFilter, categoryFilter, searchTerm]);

  // ==================== HANDLERS ====================

  const handleApprove = useCallback((submissionId) => {
    if (onApprove) onApprove(submissionId);
  }, [onApprove]);

  const handleBulkApprove = useCallback(() => {
    if (onBulkApprove) onBulkApprove();
  }, [onBulkApprove]);

  const getQuarterClass = (monthIndex) => {
    if (monthIndex < 3) return 'q1';
    if (monthIndex < 6) return 'q2';
    if (monthIndex < 9) return 'q3';
    return 'q4';
  };

  // ==================== RENDER ====================

  return (
    <div className="abm-specialist-approvals">
      {/* Stats */}
      <div className="abm-approval-stats">
        <div className="abm-stat-card">
          <i className="fas fa-inbox"></i>
          <div>
            <span className="abm-stat-value">{approvalStats.total}</span>
            <span className="abm-stat-label">Total</span>
          </div>
        </div>
        <div className="abm-stat-card abm-stat-pending">
          <i className="fas fa-clock"></i>
          <div>
            <span className="abm-stat-value">{approvalStats.pending}</span>
            <span className="abm-stat-label">Pending</span>
          </div>
        </div>
        <div className="abm-stat-card abm-stat-approved">
          <i className="fas fa-check-circle"></i>
          <div>
            <span className="abm-stat-value">{approvalStats.approved}</span>
            <span className="abm-stat-label">Approved</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="abm-approval-filters">
        <div className="abm-filter-group">
          <label>Specialist:</label>
          <select value={specialistFilter} onChange={(e) => setSpecialistFilter(e.target.value)}>
            <option value="all">All Specialists</option>
            {uniqueSpecialists.map(sp => (
              <option key={sp.id} value={sp.id}>{sp.name}{sp.area ? ` — ${sp.area}` : ''}</option>
            ))}
          </select>
        </div>
        <div className="abm-filter-group">
          <label>Category:</label>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div className="abm-filter-group abm-search-group">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search products or specialists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {approvalStats.pending > 0 && (
          <button className="abm-bulk-approve-btn" onClick={handleBulkApprove}>
            <i className="fas fa-check-double"></i> Approve All ({approvalStats.pending})
          </button>
        )}
      </div>

      {/* Submissions Table */}
      <div className="abm-approval-table-container">
        {filteredSubmissions.length === 0 ? (
          <div className="abm-empty-state">
            <i className="fas fa-clipboard-check"></i>
            <p>No specialist submissions found</p>
          </div>
        ) : (
          <table className="abm-approval-table">
            <thead>
              <tr>
                <th className="th-specialist">Specialist</th>
                <th className="th-product">Product</th>
                <th className="th-status">Status</th>
                {MONTH_LABELS.map((label, idx) => (
                  <th key={label} className={`th-month ${getQuarterClass(idx)}`}>{label}</th>
                ))}
                <th className="th-total">TOTAL</th>
                <th className="th-growth">Growth %</th>
                <th className="th-actions">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.map(sub => {
                const isSubmitted = sub.status === 'submitted';
                const totalLY = MONTHS.reduce((s, m) => s + (sub.monthlyTargets?.[m]?.lyQty || 0), 0);
                const totalCY = MONTHS.reduce((s, m) => s + (sub.monthlyTargets?.[m]?.cyQty || 0), 0);
                const growth = totalLY > 0 ? ((totalCY - totalLY) / totalLY * 100) : 0;

                return (
                  <tr key={sub.id} className={`approval-row ${sub.status}`}>
                    <td className="td-specialist">
                      <span className="specialist-name">{sub.specialistName}</span>
                    </td>
                    <td className="td-product">
                      <span className="product-name">{sub.productName}</span>
                      <span className="category-tag">{sub.categoryId}</span>
                    </td>
                    <td className="td-status">
                      <span className={`status-badge ${sub.status}`}>
                        {sub.status === 'submitted' ? 'Pending' : 'Approved'}
                      </span>
                    </td>
                    {MONTHS.map((month, idx) => {
                      const cellKey = `${sub.id}-${month}`;
                      const isEdited = editedCells.has(cellKey);
                      return (
                        <td key={month} className={`td-month ${getQuarterClass(idx)} ${isEdited ? 'edited' : ''}`}>
                          {isSubmitted ? (
                            <input
                              type="number"
                              className={`cell-input ${isEdited ? 'cell-edited' : ''}`}
                              value={sub.monthlyTargets?.[month]?.cyQty || 0}
                              onChange={(e) => onEditCell(sub.id, month, e.target.value)}
                              min="0"
                            />
                          ) : (
                            <span className="cell-value">
                              {Utils.formatNumber(sub.monthlyTargets?.[month]?.cyQty || 0)}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="td-total">
                      <strong>{Utils.formatNumber(totalCY)}</strong>
                    </td>
                    <td className="td-growth">
                      <span className={growth >= 0 ? 'growth-positive' : 'growth-negative'}>
                        {growth >= 0 ? '↑' : '↓'}{Math.abs(growth).toFixed(1)}%
                      </span>
                    </td>
                    <td className="td-actions">
                      {isSubmitted ? (
                        <button
                          className="action-btn-sm approve"
                          onClick={() => handleApprove(sub.id)}
                          title="Approve"
                        >
                          <i className="fas fa-check"></i>
                        </button>
                      ) : (
                        <span className="status-tag approved">
                          <i className="fas fa-check-circle"></i> Approved
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default ABMSpecialistApprovals;
