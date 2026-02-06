/**
 * Component Detail Modal
 * Shows component details with Edit, Duplicate, and Cancel actions
 */

import React from 'react';
import { X, Copy, Edit2, Trash2, Loader2 } from 'lucide-react';
import '../styles/ComponentDetailModal.css';

const ComponentDetailModal = ({
  component,
  isOpen,
  onClose,
  onEdit,
  onDuplicate,
  onDelete,
  loading = false,
}) => {
  if (!isOpen || !component) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'cdm-status-active';
      case 'draft': return 'cdm-status-draft';
      case 'inactive': return 'cdm-status-inactive';
      default: return 'cdm-status-active';
    }
  };

  const getCategoryLabel = (category) => {
    const categories = {
      mechanical: 'Mechanical',
      electrical: 'Electrical',
      electronics: 'Electronics',
      optical: 'Optical',
      plastic: 'Plastic',
      critical_assembly: 'Critical Assembly',
    };
    return categories[category] || category;
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleEdit = () => {
    onEdit(component);
  };

  const handleDuplicate = () => {
    onDuplicate(component);
  };

  const handleDelete = () => {
    onDelete(component);
  };

  // Extract specifications from component
  const getSpecifications = () => {
    const specs = [];
    
    // Check for specifications object
    if (component.specifications) {
      Object.entries(component.specifications).forEach(([key, value]) => {
        specs.push({ label: key, value });
      });
    }
    
    // Check for checking parameters
    if (component.checkingParameters?.parameters) {
      component.checkingParameters.parameters.forEach((param) => {
        if (param.checkingPoint && param.specification) {
          specs.push({ 
            label: param.checkingPoint, 
            value: param.specification,
            tolerance: param.toleranceMin && param.toleranceMax 
              ? `±${Math.abs(parseFloat(param.toleranceMax) - parseFloat(param.specification || 0))}${param.unit || 'mm'}`
              : null
          });
        }
      });
    }
    
    // Add common specs if they exist
    if (component.material) specs.push({ label: 'Material', value: component.material });
    if (component.length) specs.push({ label: 'Length', value: component.length });
    if (component.dimension) specs.push({ label: 'Dimension', value: component.dimension });
    if (component.type) specs.push({ label: 'Type', value: component.type });
    if (component.resolution) specs.push({ label: 'Resolution', value: component.resolution });
    if (component.color) specs.push({ label: 'Color', value: component.color });
    if (component.input) specs.push({ label: 'Input', value: component.input });
    if (component.tolerance) specs.push({ label: 'Tolerance', value: component.tolerance });
    
    return specs;
  };

  const specifications = getSpecifications();

  return (
    <div className="cdm-backdrop" onClick={handleBackdropClick}>
      <div className="cdm-modal">
        {/* Modal Header */}
        <div className="cdm-header">
          <div className="cdm-header-content">
            <h2 className="cdm-title">{component.partName}</h2>
            <p className="cdm-subtitle">
              {component.partCode} • {component.productGroup || 'B-SCAN'}
            </p>
          </div>
          <div className="cdm-header-right">
            <span className={`cdm-status ${getStatusColor(component.status)}`}>
              {component.status || 'Active'}
            </span>
            <button className="cdm-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="cdm-body">
          {/* Basic Information Section */}
          <div className="cdm-section">
            <h3 className="cdm-section-title">Basic Information</h3>
            <div className="cdm-info-grid">
              <div className="cdm-info-item">
                <span className="cdm-info-label">Category</span>
                <span className="cdm-info-value">{getCategoryLabel(component.productCategory)}</span>
              </div>
              <div className="cdm-info-item">
                <span className="cdm-info-label">Vendor</span>
                <span className="cdm-info-value">{component.vendor || 'Not assigned'}</span>
              </div>
              <div className="cdm-info-item">
                <span className="cdm-info-label">QC Plan</span>
                <span className="cdm-info-value">{component.qcPlanNo || component.samplingPlan || 'N/A'}</span>
              </div>
              <div className="cdm-info-item">
                <span className="cdm-info-label">Checkpoints</span>
                <span className="cdm-info-value">
                  {component.checkpoints || component.checkingParameters?.parameters?.length || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Specifications Section */}
          {specifications.length > 0 && (
            <div className="cdm-section">
              <h3 className="cdm-section-title">Specifications</h3>
              <div className="cdm-specs-list">
                {specifications.map((spec, index) => (
                  <div key={index} className="cdm-spec-row">
                    <span className="cdm-spec-label">{spec.label}</span>
                    <span className="cdm-spec-value">
                      {spec.value}
                      {spec.tolerance && <span className="cdm-spec-tolerance">{spec.tolerance}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Checking Parameters Info */}
          {component.checkingParameters && (
            <div className="cdm-section">
              <h3 className="cdm-section-title">Checking Type</h3>
              <div className="cdm-checking-type">
                <span className="cdm-checking-badge">
                  {component.checkingParameters.type === 'visual' ? '👁 Visual Inspection' : '🔧 Functional Testing'}
                </span>
                <span className="cdm-checking-count">
                  {component.checkingParameters.parameters?.length || 0} parameters
                </span>
              </div>
            </div>
          )}

          {/* Additional Info */}
          {(component.drawingNo || component.inspectionType || component.prProcessCode) && (
            <div className="cdm-section">
              <h3 className="cdm-section-title">Additional Details</h3>
              <div className="cdm-info-grid">
                {component.drawingNo && (
                  <div className="cdm-info-item">
                    <span className="cdm-info-label">Drawing No.</span>
                    <span className="cdm-info-value">{component.drawingNo}</span>
                  </div>
                )}
                {component.inspectionType && (
                  <div className="cdm-info-item">
                    <span className="cdm-info-label">Inspection Type</span>
                    <span className="cdm-info-value" style={{ textTransform: 'capitalize' }}>
                      {component.inspectionType === '100%' ? '100% Inspection' : 'Sampling'}
                    </span>
                  </div>
                )}
                {component.prProcessCode && (
                  <div className="cdm-info-item">
                    <span className="cdm-info-label">Process Code</span>
                    <span className="cdm-info-value" style={{ textTransform: 'capitalize' }}>
                      {component.prProcessCode.replace(/_/g, ' ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timestamps */}
          {(component.lastInspected || component.createdAt || component.updatedAt) && (
            <div className="cdm-section cdm-section-timestamps">
              <div className="cdm-timestamps">
                {component.lastInspected && (
                  <span className="cdm-timestamp">
                    Last inspected: {new Date(component.lastInspected).toLocaleDateString('en-GB', { 
                      day: 'numeric', month: 'short', year: 'numeric' 
                    })}
                  </span>
                )}
                {component.createdAt && (
                  <span className="cdm-timestamp">
                    Created: {new Date(component.createdAt).toLocaleDateString('en-GB', { 
                      day: 'numeric', month: 'short', year: 'numeric' 
                    })}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="cdm-footer">
          <div className="cdm-footer-left">
            <button 
              className="cdm-btn cdm-btn-outline cdm-btn-duplicate"
              onClick={handleDuplicate}
              disabled={loading}
            >
              {loading ? <Loader2 size={18} className="cdm-spin" /> : <Copy size={18} />}
              Duplicate
            </button>
          </div>
          <div className="cdm-footer-right">
            <button 
              className="cdm-btn cdm-btn-ghost"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              className="cdm-btn cdm-btn-primary"
              onClick={handleEdit}
              disabled={loading}
            >
              <Edit2 size={18} />
              Edit Component
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComponentDetailModal;
