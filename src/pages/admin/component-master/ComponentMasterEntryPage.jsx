/**
 * Component Master Entry Page
 * Admin screen for creating and managing QC components
 * 
 * Features:
 * - Stunning UI with glass morphism and animations
 * - Complete form validation
 * - File upload with drag & drop
 * - Mock/Real API toggle
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  Layers, 
  FileText, 
  Settings, 
  Save, 
  X, 
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  Clipboard,
  Shield,
  Cog,
  Zap,
  Eye,
  FlaskConical,
  Lightbulb,
  HelpCircle,
  Plus,
  Trash2,
  Ruler,
  Wrench,
} from 'lucide-react';

// Import components
import { Header, Card } from '../../../components/common';
import { 
  FormInput, 
  FormSelect, 
  FormToggle, 
  FormCheckboxCard, 
  FormFileUpload,
  CategorySelector,
  FormSection,
  FormButton,
  SuccessModal,
} from './components/FormComponents';

// Import API and validation
import { 
  getProductCategories, 
  getProductGroups, 
  getSamplingPlans, 
  getQCPlans,
  createComponent,
  validatePartCode as apiValidatePartCode,
} from './api/componentMasterApi';

import {
  validateField,
  validateForm,
  validatePartCodeUnique,
  getInitialFormState,
  getInitialErrorState,
  debounce,
  hasErrors,
  clearFieldError,
  setFieldError,
} from './api/validation';

// Import styles
import './styles/ComponentMasterEntry.css';

// Theme constants
import { colors } from '../../../constants/theme';

const ComponentMasterEntryPage = () => {
  const navigate = useNavigate();
  
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [formData, setFormData] = useState(getInitialFormState());
  const [errors, setErrors] = useState(getInitialErrorState());
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [partCodeChecking, setPartCodeChecking] = useState(false);
  const [partCodeValid, setPartCodeValid] = useState(false);

  // Checking Parameters State
  const [checkingType, setCheckingType] = useState('visual'); // 'visual' or 'functional'
  const [checkingParams, setCheckingParams] = useState([
    { id: 1, checkingPoint: '', unit: 'mm', specification: '', instrumentName: '', toleranceMin: '', toleranceMax: '' }
  ]);

  // Master data
  const [categories, setCategories] = useState([]);
  const [productGroups, setProductGroups] = useState([]);
  const [samplingPlans, setSamplingPlans] = useState([]);
  const [qcPlans, setQCPlans] = useState([]);
  
  // Loading states
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingSamplingPlans, setLoadingSamplingPlans] = useState(true);
  const [loadingQCPlans, setLoadingQCPlans] = useState(true);

  // ============================================
  // LOAD MASTER DATA
  // ============================================
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        // Load categories
        setLoadingCategories(true);
        const categoriesData = await getProductCategories();
        setCategories(categoriesData);
        setLoadingCategories(false);

        // Load sampling plans
        setLoadingSamplingPlans(true);
        const samplingData = await getSamplingPlans();
        setSamplingPlans(samplingData);
        setLoadingSamplingPlans(false);

        // Load QC plans
        setLoadingQCPlans(true);
        const qcData = await getQCPlans();
        setQCPlans(qcData);
        setLoadingQCPlans(false);
      } catch (error) {
        console.error('Error loading master data:', error);
      }
    };

    loadMasterData();
  }, []);

  // Load product groups when category changes
  useEffect(() => {
    const loadProductGroups = async () => {
      if (!formData.productCategory) {
        setProductGroups([]);
        return;
      }

      try {
        setLoadingGroups(true);
        const groups = await getProductGroups(formData.productCategory);
        setProductGroups(groups.map(g => ({ id: g, name: g })));
        setLoadingGroups(false);
        
        // Reset product group if category changed
        setFormData(prev => ({ ...prev, productGroup: '' }));
      } catch (error) {
        console.error('Error loading product groups:', error);
        setLoadingGroups(false);
      }
    };

    loadProductGroups();
  }, [formData.productCategory]);

  // ============================================
  // PART CODE VALIDATION (Debounced)
  // ============================================
  const checkPartCodeUnique = useCallback(
    debounce(async (partCode) => {
      if (!partCode || partCode.length < 3) {
        setPartCodeValid(false);
        return;
      }

      setPartCodeChecking(true);
      const error = await validatePartCodeUnique(partCode, apiValidatePartCode);
      setPartCodeChecking(false);

      if (error) {
        setErrors(prev => setFieldError(prev, 'partCode', error));
        setPartCodeValid(false);
      } else {
        setPartCodeValid(true);
      }
    }, 500),
    []
  );

  // ============================================
  // FORM HANDLERS
  // ============================================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    }));

    // Clear error on change
    if (errors[name]) {
      setErrors(prev => clearFieldError(prev, name));
    }

    // Special handling for part code
    if (name === 'partCode') {
      setPartCodeValid(false);
      checkPartCodeUnique(value);
    }

    // Clear sampling plan if switching to 100% inspection
    if (name === 'inspectionType' && value === '100%') {
      setFormData(prev => ({ ...prev, samplingPlan: '' }));
      setErrors(prev => clearFieldError(prev, 'samplingPlan'));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));

    // Validate on blur
    const error = validateField(name, value, formData);
    if (error) {
      setErrors(prev => setFieldError(prev, name, error));
    }
  };

  const handleFileChange = (e) => {
    const { name, value, error } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) {
      setErrors(prev => setFieldError(prev, name, error));
    } else {
      setErrors(prev => clearFieldError(prev, name));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const { isValid, errors: validationErrors } = validateForm(formData);
    setErrors(validationErrors);

    // Mark all fields as touched
    const allTouched = Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {});
    setTouched(allTouched);

    if (!isValid) {
      // Scroll to first error
      const firstErrorField = Object.keys(validationErrors).find(key => validationErrors[key]);
      if (firstErrorField) {
        const element = document.querySelector(`[name="${firstErrorField}"]`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Prepare submission data with checking parameters
    const submissionData = {
      ...formData,
      checkingParameters: {
        type: checkingType,
        parameters: checkingParams.filter(p => p.checkingPoint.trim() !== ''),
      }
    };

    // Submit form
    setIsSubmitting(true);
    try {
      await createComponent(submissionData);
      setShowSuccess(true);
    } catch (error) {
      console.error('Error creating component:', error);
      // Handle error - could show error toast/modal
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(getInitialFormState());
    setErrors(getInitialErrorState());
    setTouched({});
    setPartCodeValid(false);
    setCheckingType('visual');
    setCheckingParams([{ id: 1, checkingPoint: '', unit: 'mm', specification: '', instrumentName: '', toleranceMin: '', toleranceMax: '' }]);
  };

  // ============================================
  // CHECKING PARAMETERS HANDLERS
  // ============================================
  const unitOptions = [
    { value: 'mm', label: 'mm' },
    { value: 'cm', label: 'cm' },
    { value: 'inch', label: 'inch' },
    { value: 'kg', label: 'kg' },
    { value: 'g', label: 'g' },
    { value: 'nos', label: 'Nos' },
    { value: 'pcs', label: 'Pcs' },
    { value: 'units', label: 'Units' },
    { value: '%', label: '%' },
    { value: 'V', label: 'V' },
    { value: 'A', label: 'A' },
    { value: 'Ω', label: 'Ω' },
  ];

  const handleCheckingTypeChange = (type) => {
    setCheckingType(type);
    // Reset params when changing type
    setCheckingParams([{ id: 1, checkingPoint: '', unit: 'mm', specification: '', instrumentName: '', toleranceMin: '', toleranceMax: '' }]);
  };

  const addCheckingParam = () => {
    const newId = Math.max(...checkingParams.map(p => p.id), 0) + 1;
    setCheckingParams([...checkingParams, { id: newId, checkingPoint: '', unit: 'mm', specification: '', instrumentName: '', toleranceMin: '', toleranceMax: '' }]);
  };

  const removeCheckingParam = (id) => {
    if (checkingParams.length > 1) {
      setCheckingParams(checkingParams.filter(p => p.id !== id));
    }
  };

  const updateCheckingParam = (id, field, value) => {
    setCheckingParams(checkingParams.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const handleCreateAnother = () => {
    setShowSuccess(false);
    handleReset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="cm-page">
      <Header 
        title="Component Master" 
        subtitle="Create and manage QC component specifications"
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <FormButton 
              variant="outline" 
              icon={ArrowLeft}
              onClick={() => navigate('/admin/component-master')}
            >
              Back to List
            </FormButton>
          </div>
        }
      />

      <div className="cm-content">
        <form onSubmit={handleSubmit}>
          <div className="cm-form-container">
            {/* Form Header */}
            <div className="cm-form-header">
              <div className="cm-form-header-content">
                <div className="cm-form-header-left">
                  <div className="cm-form-icon">
                    <Package size={28} color="white" />
                  </div>
                  <div>
                    <h1 className="cm-form-title">New Component Entry</h1>
                    <p className="cm-form-subtitle">Fill in the details to register a new QC component</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <FormButton 
                    variant="ghost" 
                    icon={RefreshCw}
                    onClick={handleReset}
                    style={{ color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.2)' }}
                  >
                    Reset
                  </FormButton>
                </div>
              </div>
            </div>

            {/* Form Body */}
            <div className="cm-form-body">
              {/* Section 1: Product Category Selection */}
              <FormSection 
                icon={Layers} 
                title="Product Classification" 
                badge="Step 1 of 4"
              >
                <CategorySelector
                  categories={categories}
                  value={formData.productCategory}
                  onChange={handleChange}
                  error={touched.productCategory && errors.productCategory}
                  required
                />
                
                <div className="cm-form-grid cm-form-grid-2" style={{ marginTop: '24px' }}>
                  <FormSelect
                    label="Product Group"
                    name="productGroup"
                    value={formData.productGroup}
                    onChange={handleChange}
                    options={productGroups}
                    placeholder={formData.productCategory ? 'Select product group' : 'Select category first'}
                    required
                    disabled={!formData.productCategory}
                    loading={loadingGroups}
                    error={touched.productGroup && errors.productGroup}
                  />
                </div>
              </FormSection>

              {/* Section 2: Part Information */}
              <FormSection 
                icon={FileText} 
                title="Part Information" 
                badge="Step 2 of 4"
              >
                <div className="cm-form-grid cm-form-grid-2">
                  <FormInput
                    label="Part Code"
                    name="partCode"
                    value={formData.partCode}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g., BSC-DM-001"
                    required
                    error={touched.partCode && errors.partCode}
                    success={partCodeValid && !errors.partCode}
                    helper={partCodeChecking ? 'Checking availability...' : partCodeValid ? 'Part code is available!' : null}
                    icon={Clipboard}
                    maxLength={50}
                  />
                  
                  <FormInput
                    label="Part Name"
                    name="partName"
                    value={formData.partName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g., LCD Display Panel 7 inch"
                    required
                    error={touched.partName && errors.partName}
                    maxLength={200}
                  />
                </div>

                <div className="cm-form-grid cm-form-grid-2" style={{ marginTop: '24px' }}>
                  <FormSelect
                    label="QC Plan Number"
                    name="qcPlanNo"
                    value={formData.qcPlanNo}
                    onChange={handleChange}
                    options={qcPlans.map(p => ({ id: p.id, name: `${p.id} - ${p.name}` }))}
                    placeholder="Select QC Plan"
                    required
                    loading={loadingQCPlans}
                    error={touched.qcPlanNo && errors.qcPlanNo}
                  />
                  
                  <FormInput
                    label="Drawing Number"
                    name="drawingNo"
                    value={formData.drawingNo}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g., DWG-DM-001-R2"
                    error={touched.drawingNo && errors.drawingNo}
                    maxLength={50}
                  />
                </div>
              </FormSection>

              {/* Section 3: Inspection Configuration */}
              <FormSection 
                icon={Settings} 
                title="Inspection Configuration" 
                badge="Step 3 of 4"
              >
                <FormToggle
                  label="Inspection Type"
                  name="inspectionType"
                  value={formData.inspectionType}
                  onChange={handleChange}
                  required
                  options={[
                    { 
                      value: 'sampling', 
                      label: 'Sampling Inspection',
                      description: 'Inspect a representative sample from each lot'
                    },
                    { 
                      value: '100%', 
                      label: '100% Inspection',
                      description: 'Inspect every unit in the lot'
                    },
                  ]}
                />

                {formData.inspectionType === 'sampling' && (
                  <div className="cm-form-grid" style={{ marginTop: '24px' }}>
                    <FormSelect
                      label="Sampling Plan"
                      name="samplingPlan"
                      value={formData.samplingPlan}
                      onChange={handleChange}
                      options={samplingPlans.map(p => ({ id: p.id, name: `${p.id} - ${p.name}` }))}
                      placeholder="Select Sampling Plan"
                      required
                      loading={loadingSamplingPlans}
                      error={touched.samplingPlan && errors.samplingPlan}
                    />
                  </div>
                )}

                <div style={{ marginTop: '24px' }}>
                  <label className="cm-label" style={{ marginBottom: '16px', display: 'block' }}>
                    PR Process Code
                    <span className="cm-label-required">*</span>
                  </label>
                  <div className="cm-form-grid cm-form-grid-3">
                    {[
                      { value: 'direct_purchase', label: 'Direct Purchase', icon: Package },
                      { value: 'internal_job_work', label: 'Internal Job Work', icon: Cog },
                      { value: 'external_job_work', label: 'External Job Work', icon: Zap },
                    ].map((option) => (
                      <div
                        key={option.value}
                        className={`cm-toggle-item ${formData.prProcessCode === option.value ? 'cm-toggle-active' : ''}`}
                        onClick={() => handleChange({ target: { name: 'prProcessCode', value: option.value } })}
                        style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px' }}
                      >
                        <option.icon size={24} style={{ color: formData.prProcessCode === option.value ? '#003366' : '#94A3B8' }} />
                        <span className="cm-toggle-label">{option.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </FormSection>

              {/* Section 4: Documents & Attachments */}
              <FormSection 
                icon={Shield} 
                title="Documents & Requirements" 
                badge="Step 4 of 5"
              >
                <div className="cm-form-grid cm-form-grid-2" style={{ marginBottom: '24px' }}>
                  <FormFileUpload
                    label="Drawing Attachment"
                    name="drawingAttachment"
                    value={formData.drawingAttachment}
                    onChange={handleFileChange}
                    accept=".pdf,.png,.jpg,.jpeg"
                    maxSize={5}
                    error={errors.drawingAttachment}
                  />
                </div>

                <label className="cm-label" style={{ marginBottom: '16px', display: 'block' }}>
                  Required Documents
                  <span className="cm-label-optional">(Upload documents - max 5MB each)</span>
                </label>
                <div className="cm-form-grid cm-form-grid-3">
                  <FormFileUpload
                    label="Test Certificate"
                    name="testCertFile"
                    value={formData.testCertFile}
                    onChange={handleFileChange}
                    accept=".pdf,.png,.jpg,.jpeg"
                    maxSize={5}
                    error={errors.testCertFile}
                    description="Material test certificate from vendor"
                  />
                  
                  <FormFileUpload
                    label="Specification Document"
                    name="specFile"
                    value={formData.specFile}
                    onChange={handleFileChange}
                    accept=".pdf,.png,.jpg,.jpeg"
                    maxSize={5}
                    error={errors.specFile}
                    description="Technical specifications sheet"
                  />
                  
                  <FormFileUpload
                    label="FQIR Document"
                    name="fqirFile"
                    value={formData.fqirFile}
                    onChange={handleFileChange}
                    accept=".pdf,.png,.jpg,.jpeg"
                    maxSize={5}
                    error={errors.fqirFile}
                    description="First article quality inspection report"
                  />
                </div>
              </FormSection>

              {/* Section 5: Detailed Checking Parameters */}
              <FormSection 
                icon={Ruler} 
                title="Detailed Checking Parameters" 
                badge="Step 5 of 5"
              >
                {/* Checking Type Selection */}
                <div className="cm-checking-type-selector">
                  <label className="cm-label" style={{ marginBottom: '16px', display: 'block' }}>
                    Checking Type
                    <span className="cm-label-required">*</span>
                  </label>
                  <div className="cm-checking-type-cards">
                    <div 
                      className={`cm-checking-type-card ${checkingType === 'visual' ? 'cm-checking-type-active' : ''}`}
                      onClick={() => handleCheckingTypeChange('visual')}
                    >
                      <div className="cm-checking-type-icon">
                        <Eye size={28} />
                      </div>
                      <div className="cm-checking-type-content">
                        <span className="cm-checking-type-title">Visual Inspection</span>
                        <span className="cm-checking-type-desc">Surface finish, color, appearance checks</span>
                      </div>
                      <div className="cm-checking-type-radio">
                        <div className="cm-checking-type-radio-inner" />
                      </div>
                    </div>
                    
                    <div 
                      className={`cm-checking-type-card ${checkingType === 'functional' ? 'cm-checking-type-active' : ''}`}
                      onClick={() => handleCheckingTypeChange('functional')}
                    >
                      <div className="cm-checking-type-icon">
                        <Wrench size={28} />
                      </div>
                      <div className="cm-checking-type-content">
                        <span className="cm-checking-type-title">Functional Testing</span>
                        <span className="cm-checking-type-desc">Measurements, tolerances, instrument-based</span>
                      </div>
                      <div className="cm-checking-type-radio">
                        <div className="cm-checking-type-radio-inner" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Parameters Table - Visual Type */}
                {checkingType === 'visual' && (
                  <div className="cm-param-section" style={{ marginTop: '24px' }}>
                    <div className="cm-param-header">
                      <div className="cm-param-title">
                        <Eye size={18} className="cm-param-icon" />
                        <span>Visual Checking Parameters</span>
                        <span className="cm-param-count">{checkingParams.length} parameter(s)</span>
                      </div>
                      <button 
                        type="button" 
                        className="cm-btn cm-btn-outline cm-btn-sm"
                        onClick={addCheckingParam}
                      >
                        <Plus size={16} /> Add Parameter
                      </button>
                    </div>
                    
                    <div className="cm-param-table">
                      <div className="cm-param-table-header">
                        <div className="cm-param-col cm-param-col-sl">Sl.No</div>
                        <div className="cm-param-col cm-param-col-check">Checking Point</div>
                        <div className="cm-param-col cm-param-col-unit">Unit</div>
                        <div className="cm-param-col cm-param-col-spec">Specification</div>
                        <div className="cm-param-col cm-param-col-action">Action</div>
                      </div>
                      {checkingParams.map((param, index) => (
                        <div key={param.id} className="cm-param-row">
                          <div className="cm-param-col cm-param-col-sl">{index + 1}</div>
                          <div className="cm-param-col cm-param-col-check">
                            <input
                              type="text"
                              className="cm-input cm-input-sm"
                              placeholder="e.g., Surface Finish, Color"
                              value={param.checkingPoint}
                              onChange={(e) => updateCheckingParam(param.id, 'checkingPoint', e.target.value)}
                            />
                          </div>
                          <div className="cm-param-col cm-param-col-unit">
                            <select
                              className="cm-select cm-select-sm"
                              value={param.unit}
                              onChange={(e) => updateCheckingParam(param.id, 'unit', e.target.value)}
                            >
                              {unitOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="cm-param-col cm-param-col-spec">
                            <input
                              type="text"
                              className="cm-input cm-input-sm"
                              placeholder="e.g., No scratches, Smooth"
                              value={param.specification}
                              onChange={(e) => updateCheckingParam(param.id, 'specification', e.target.value)}
                            />
                          </div>
                          <div className="cm-param-col cm-param-col-action">
                            <button 
                              type="button" 
                              className="cm-btn-icon cm-btn-danger-icon"
                              onClick={() => removeCheckingParam(param.id)}
                              disabled={checkingParams.length === 1}
                              title="Remove parameter"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Parameters Table - Functional Type */}
                {checkingType === 'functional' && (
                  <div className="cm-param-section" style={{ marginTop: '24px' }}>
                    <div className="cm-param-header">
                      <div className="cm-param-title">
                        <Wrench size={18} className="cm-param-icon" />
                        <span>Functional Checking Parameters</span>
                        <span className="cm-param-count">{checkingParams.length} parameter(s)</span>
                      </div>
                      <button 
                        type="button" 
                        className="cm-btn cm-btn-outline cm-btn-sm"
                        onClick={addCheckingParam}
                      >
                        <Plus size={16} /> Add Parameter
                      </button>
                    </div>
                    
                    <div className="cm-param-table cm-param-table-functional">
                      <div className="cm-param-table-header">
                        <div className="cm-param-col cm-param-col-sl">Sl.No</div>
                        <div className="cm-param-col cm-param-col-check-sm">Checking Point</div>
                        <div className="cm-param-col cm-param-col-unit">Unit</div>
                        <div className="cm-param-col cm-param-col-spec-sm">Specification</div>
                        <div className="cm-param-col cm-param-col-inst">Instrument</div>
                        <div className="cm-param-col cm-param-col-tol">Tol. Min</div>
                        <div className="cm-param-col cm-param-col-tol">Tol. Max</div>
                        <div className="cm-param-col cm-param-col-action">Action</div>
                      </div>
                      {checkingParams.map((param, index) => (
                        <div key={param.id} className="cm-param-row">
                          <div className="cm-param-col cm-param-col-sl">{index + 1}</div>
                          <div className="cm-param-col cm-param-col-check-sm">
                            <input
                              type="text"
                              className="cm-input cm-input-sm"
                              placeholder="e.g., Height, Weight"
                              value={param.checkingPoint}
                              onChange={(e) => updateCheckingParam(param.id, 'checkingPoint', e.target.value)}
                            />
                          </div>
                          <div className="cm-param-col cm-param-col-unit">
                            <select
                              className="cm-select cm-select-sm"
                              value={param.unit}
                              onChange={(e) => updateCheckingParam(param.id, 'unit', e.target.value)}
                            >
                              {unitOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="cm-param-col cm-param-col-spec-sm">
                            <input
                              type="text"
                              className="cm-input cm-input-sm"
                              placeholder="e.g., 100mm"
                              value={param.specification}
                              onChange={(e) => updateCheckingParam(param.id, 'specification', e.target.value)}
                            />
                          </div>
                          <div className="cm-param-col cm-param-col-inst">
                            <input
                              type="text"
                              className="cm-input cm-input-sm"
                              placeholder="e.g., Vernier Caliper"
                              value={param.instrumentName}
                              onChange={(e) => updateCheckingParam(param.id, 'instrumentName', e.target.value)}
                            />
                          </div>
                          <div className="cm-param-col cm-param-col-tol">
                            <input
                              type="number"
                              className="cm-input cm-input-sm"
                              placeholder="Min"
                              value={param.toleranceMin}
                              onChange={(e) => updateCheckingParam(param.id, 'toleranceMin', e.target.value)}
                            />
                          </div>
                          <div className="cm-param-col cm-param-col-tol">
                            <input
                              type="number"
                              className="cm-input cm-input-sm"
                              placeholder="Max"
                              value={param.toleranceMax}
                              onChange={(e) => updateCheckingParam(param.id, 'toleranceMax', e.target.value)}
                            />
                          </div>
                          <div className="cm-param-col cm-param-col-action">
                            <button 
                              type="button" 
                              className="cm-btn-icon cm-btn-danger-icon"
                              onClick={() => removeCheckingParam(param.id)}
                              disabled={checkingParams.length === 1}
                              title="Remove parameter"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </FormSection>
            </div>

            {/* Form Footer */}
            <div className="cm-form-footer">
              <div className="cm-form-footer-left">
                <FormButton 
                  variant="ghost" 
                  icon={X}
                  onClick={() => navigate('/admin/component-master')}
                >
                  Cancel
                </FormButton>
              </div>
              <div className="cm-form-footer-right">
                <FormButton 
                  variant="outline" 
                  icon={Eye}
                  onClick={() => console.log('Preview:', formData)}
                >
                  Preview
                </FormButton>
                <FormButton 
                  variant="success" 
                  type="submit"
                  icon={Save}
                  loading={isSubmitting}
                  disabled={hasErrors(errors)}
                >
                  Save Component
                </FormButton>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      <SuccessModal
        show={showSuccess}
        title="Component Created!"
        message="The component has been successfully added to the master list."
        onClose={() => {
          setShowSuccess(false);
          navigate('/admin/component-master');
        }}
        onAction={handleCreateAnother}
        actionLabel="Create Another"
      />
    </div>
  );
};

export default ComponentMasterEntryPage;
