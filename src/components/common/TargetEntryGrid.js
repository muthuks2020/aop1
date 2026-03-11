import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Utils } from '../../utils/helpers';
import { TARGET_THRESHOLDS } from '../../config/targetThresholds';

const MONTHS = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];
const MONTH_LABELS = ['APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR'];

const QUARTERS = [
  { id: 'Q1', label: 'Q1', fullLabel: 'Q1 (Apr-Jun)', months: ['apr', 'may', 'jun'], color: 'q1' },
  { id: 'Q2', label: 'Q2', fullLabel: 'Q2 (Jul-Sep)', months: ['jul', 'aug', 'sep'], color: 'q2' },
  { id: 'Q3', label: 'Q3', fullLabel: 'Q3 (Oct-Dec)', months: ['oct', 'nov', 'dec'], color: 'q3' },
  { id: 'Q4', label: 'Q4', fullLabel: 'Q4 (Jan-Mar)', months: ['jan', 'feb', 'mar'], color: 'q4' },
];

function validateEntry(product, month, newQty) {
  const warnings = [];
  const lyQty = product.monthlyTargets?.[month]?.lyQty || 0;
  const catId  = (product.categoryId || '').toLowerCase();

  if (newQty > 0 && lyQty > 0) {
    const ratio = newQty / lyQty;
    if (ratio > TARGET_THRESHOLDS.ABNORMAL_HIGH_MULTIPLIER) {
      warnings.push({
        type: 'high',
        message: `${MONTH_LABELS[MONTHS.indexOf(month)]}: CY ${Utils.formatNumber(newQty)} is ${Math.round(ratio * 100)}% of LY ${Utils.formatNumber(lyQty)} — unusually high`,
      });
    } else if (ratio < TARGET_THRESHOLDS.ABNORMAL_LOW_MULTIPLIER) {
      warnings.push({
        type: 'low',
        message: `${MONTH_LABELS[MONTHS.indexOf(month)]}: CY ${Utils.formatNumber(newQty)} is only ${Math.round(ratio * 100)}% of LY ${Utils.formatNumber(lyQty)} — unusually low`,
      });
    }
  }

  const cap = TARGET_THRESHOLDS.CATEGORY_MONTHLY_CAPS[catId] ?? TARGET_THRESHOLDS.DEFAULT_MAX_MONTHLY_QTY;
  if (newQty > cap) {
    warnings.push({
      type: 'cap',
      message: `${MONTH_LABELS[MONTHS.indexOf(month)]}: ${Utils.formatNumber(newQty)} exceeds the monthly limit of ${Utils.formatNumber(cap)} for ${catId.toUpperCase()}`,
    });
  }

  return warnings;
}

function SubmitWarningModal({ warnings, onConfirm, onCancel }) {
  const [comment, setComment] = useState('');

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '1rem',
    }}>
      <div style={{
        background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '520px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden',
      }}>
        {}
        <div style={{
          background: '#FEF3C7', borderBottom: '1px solid #FDE68A',
          padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
        }}>
          <i className="fas fa-exclamation-triangle" style={{ color: '#D97706', fontSize: '1.25rem' }}></i>
          <div>
            <div style={{ fontWeight: 700, color: '#92400E', fontSize: '0.9375rem' }}>
              Abnormal Entries Detected
            </div>
            <div style={{ fontSize: '0.75rem', color: '#B45309', marginTop: '2px' }}>
              {warnings.length} warning{warnings.length > 1 ? 's' : ''} found. Please review and provide a reason before submitting.
            </div>
          </div>
        </div>

        {}
        <div style={{ maxHeight: '220px', overflowY: 'auto', padding: '0.75rem 1.25rem' }}>
          {warnings.map((w, i) => (
            <div key={i} style={{
              display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
              padding: '0.4rem 0', borderBottom: i < warnings.length - 1 ? '1px solid #F3F4F6' : 'none',
              fontSize: '0.8125rem',
            }}>
              <i className={`fas ${w.type === 'cap' ? 'fa-ban' : 'fa-exclamation-circle'}`}
                style={{ color: w.type === 'cap' ? '#DC2626' : '#D97706', marginTop: '2px', flexShrink: 0 }}></i>
              <span style={{ color: '#374151' }}>{w.message}</span>
            </div>
          ))}
        </div>

        {}
        <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #F3F4F6' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.375rem' }}>
            Reason for abnormal entries <span style={{ color: '#DC2626' }}>*</span>
          </label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Explain why these targets are set at these levels (e.g. new product launch, market expansion, seasonal adjustment)…"
            rows={3}
            style={{
              width: '100%', boxSizing: 'border-box', padding: '0.5rem 0.75rem',
              border: '1.5px solid #D1D5DB', borderRadius: '6px',
              fontSize: '0.8125rem', color: '#1F2937', resize: 'vertical',
              outline: 'none', lineHeight: 1.5,
              fontFamily: 'inherit',
            }}
            onFocus={e => { e.target.style.borderColor = '#00A19B'; }}
            onBlur={e => { e.target.style.borderColor = '#D1D5DB'; }}
            autoFocus
          />
          <p style={{ fontSize: '0.6875rem', color: '#9CA3AF', margin: '0.25rem 0 0' }}>
            This comment will be visible to your TBM during review.
          </p>
        </div>

        {}
        <div style={{
          padding: '0.75rem 1.25rem', background: '#F9FAFB',
          display: 'flex', justifyContent: 'flex-end', gap: '0.625rem',
          borderTop: '1px solid #E5E7EB',
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '0.5rem 1rem', background: '#fff', border: '1px solid #D1D5DB',
              borderRadius: '6px', cursor: 'pointer', fontSize: '0.8125rem',
              color: '#374151', fontWeight: 500,
            }}
          >
            Go Back & Fix
          </button>
          <button
            onClick={() => onConfirm(comment)}
            disabled={!comment.trim()}
            style={{
              padding: '0.5rem 1.25rem',
              background: comment.trim() ? '#D97706' : '#E5E7EB',
              border: 'none', borderRadius: '6px', cursor: comment.trim() ? 'pointer' : 'not-allowed',
              fontSize: '0.8125rem', color: comment.trim() ? '#fff' : '#9CA3AF',
              fontWeight: 600, transition: 'background 0.15s',
            }}
          >
            <i className="fas fa-paper-plane" style={{ marginRight: '0.375rem' }}></i>
            Submit Anyway
          </button>
        </div>
      </div>
    </div>
  );
}

function TargetEntryGrid({
  categories = [],
  products = [],
  onUpdateTarget,
  onSaveAll,
  onSubmitAll,
  userRole = 'salesrep',
  fiscalYear = '2025-26',
  overallYearlyTargetValue = null,
  tbmAssignedTargetValue = 0,
}) {
  const [activeCell, setActiveCell]                 = useState(null);
  const [editValue, setEditValue]                   = useState('');
  const [expandedCategories, setExpandedCategories] = useState(new Set(['equipment', 'iol', 'ovd']));
  const [expandedSubcategories, setExpandedSubcategories] = useState(new Set());
  const [searchTerm, setSearchTerm]                 = useState('');
  const [isLoading, setIsLoading]                   = useState(false);
  const [lastSaved, setLastSaved]                   = useState(null);
  const [showOnlyEntered, setShowOnlyEntered]       = useState(false);
  const [showOnlyLYData, setShowOnlyLYData]         = useState(false);

  const [cellWarnings, setCellWarnings]             = useState({});
  const [showSubmitModal, setShowSubmitModal]        = useState(false);

  const inputRef      = useRef(null);
  const searchInputRef = useRef(null);
  const gridRef       = useRef(null);

  useEffect(() => {
    if (activeCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [activeCell]);

  const hasAnyCYValue = useCallback((product) => {
    if (!product.monthlyTargets) return false;
    return MONTHS.some(month => {
      const monthData = product.monthlyTargets[month];
      return monthData && (monthData.cyQty > 0 || monthData.cyRev > 0);
    });
  }, []);

  const hasAnyLYValue = useCallback((product) => {
    if (!product.monthlyTargets) return false;
    return MONTHS.some(month => {
      const monthData = product.monthlyTargets[month];
      return monthData && (monthData.lyQty > 0 || monthData.lyRev > 0);
    });
  }, []);

  const isEditable = useCallback((product) => {
    const status = product.status || 'draft';
    return status === 'draft';
  }, []);

  const allWarnings = useMemo(() => {
    const list = [];
    products.forEach(product => {
      if (!isEditable(product)) return;
      const pWarns = cellWarnings[product.id] || {};
      MONTHS.forEach(month => {
        const mWarns = pWarns[month] || [];
        mWarns.forEach(w => {
          list.push({ productId: product.id, productName: product.name, month, ...w });
        });
      });
    });
    return list;
  }, [cellWarnings, products]);

  const cyLyWarning = useMemo(() => {
    let totalCY = 0, totalLY = 0;
    products.forEach(p => {
      if (!p.monthlyTargets) return;
      MONTHS.forEach(m => {
        totalCY += p.monthlyTargets[m]?.cyQty || 0;
        totalLY += p.monthlyTargets[m]?.lyQty  || 0;
      });
    });
    if (totalLY === 0 || totalCY === 0) return null;
    const threshold = TARGET_THRESHOLDS.CY_VS_LY_WARN_THRESHOLD;
    if (totalCY < totalLY * threshold) {
      return {
        totalCY,
        totalLY,
        pct: Math.round((totalCY / totalLY) * 100),
      };
    }
    return null;
  }, [products]);

  const getStatusInfo = useCallback((status) => {
    switch (status) {
      case 'approved':
        return { icon: 'fa-lock',  label: 'Approved by TBM — Locked',       color: '#059669', bg: '#D1FAE5' };
      case 'submitted':
        return { icon: 'fa-clock', label: 'Submitted — Pending TBM Review',  color: '#D97706', bg: '#FEF3C7' };
      default:
        return { icon: 'fa-edit',  label: 'Draft — Click to edit',           color: '#00A19B', bg: '#E6FAF9' };
    }
  }, []);

  const filteredProducts = useMemo(() => {
    let result = products;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.code.toLowerCase().includes(term) ||
        (p.subcategory && p.subcategory.toLowerCase().includes(term)) ||
        (p.subgroup && p.subgroup.toLowerCase().includes(term))
      );
    }
    if (showOnlyEntered) result = result.filter(p => hasAnyCYValue(p));
    if (showOnlyLYData)  result = result.filter(p => hasAnyLYValue(p));
    const seen = new Set();
    result = result.filter(p => {
      const key = `${p.categoryId}__${p.subcategory}__${p.name.trim().toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return result;
  }, [products, searchTerm, showOnlyEntered, showOnlyLYData, hasAnyCYValue, hasAnyLYValue]);

  const getSubcategories = useCallback((categoryId) => {
    const subs = new Set();
    filteredProducts.filter(p => p.categoryId === categoryId).forEach(p => {
      if (p.subcategory) subs.add(p.subcategory);
    });
    return Array.from(subs);
  }, [filteredProducts]);

  const getSubgroups = useCallback((categoryId, subcategory) => {
    const groups = new Set();
    filteredProducts
      .filter(p => p.categoryId === categoryId && p.subcategory === subcategory)
      .forEach(p => { if (p.subgroup) groups.add(p.subgroup); });
    return Array.from(groups);
  }, [filteredProducts]);

  const calculateCategoryTotal = useCallback((categoryId, month, year) => {
    return products.filter(p => p.categoryId === categoryId).reduce((sum, p) => {
      const monthData = p.monthlyTargets?.[month] || {};
      return sum + (year === 'CY' ? (monthData.cyQty || 0) : (monthData.lyQty || 0));
    }, 0);
  }, [products]);

  const calculateYearlyTotal = useCallback((productId, year) => {
    const product = products.find(p => p.id === productId);
    if (!product) return 0;
    return MONTHS.reduce((sum, month) => {
      const monthData = product.monthlyTargets?.[month] || {};
      return sum + (year === 'CY' ? (monthData.cyQty || 0) : (monthData.lyQty || 0));
    }, 0);
  }, [products]);

  const calculateGrowth = useCallback((productId) => {
    const ly = calculateYearlyTotal(productId, 'LY');
    const cy = calculateYearlyTotal(productId, 'CY');
    return Utils.calcGrowth(ly, cy);
  }, [calculateYearlyTotal]);

  const overallTargetSummary = useMemo(() => {
    let totalCYQty = 0, totalLYQty = 0, totalCYRev = 0, totalLYRev = 0;
    let enteredCount = 0, approvedCount = 0, submittedCount = 0, draftCount = 0;
    let liveEnteredValue = 0;
    products.forEach(p => {
      if (hasAnyCYValue(p)) enteredCount++;
      if (p.status === 'approved')  approvedCount++;
      else if (p.status === 'submitted') submittedCount++;
      else draftCount++;
      const unitCost = p.listPrice || p.unitCost || 0;
      if (p.monthlyTargets) {
        MONTHS.forEach(month => {
          const md = p.monthlyTargets[month] || {};
          totalCYQty += md.cyQty || 0;
          totalLYQty += md.lyQty || 0;
          totalCYRev += md.cyRev || 0;
          totalLYRev += md.lyRev || 0;

          if (p.isRevenueOnly) {
            liveEnteredValue += md.cyRev || 0;
          } else {
            liveEnteredValue += (md.cyQty || 0) * unitCost;
          }
        });
      }
    });

    const totalEnteredValue  = tbmAssignedTargetValue > 0 ? tbmAssignedTargetValue : totalCYRev;
    const yearlyTargetValue  = overallYearlyTargetValue || 0;

    const completionPercent  = yearlyTargetValue > 0
      ? Math.min(100, Math.round((totalCYRev / yearlyTargetValue) * 100)) : 0;
    return {
      totalCYQty, totalLYQty, totalCYRev, totalLYRev,
      enteredCount, approvedCount, submittedCount, draftCount,
      totalProducts: products.length,
      yearlyTargetValue, totalEnteredValue, liveEnteredValue, completionPercent,
      qtyGrowth: Utils.calcGrowth(totalLYQty, totalCYQty),
      revGrowth: Utils.calcGrowth(totalLYRev, totalCYRev),
    };
  }, [products, overallYearlyTargetValue, tbmAssignedTargetValue, hasAnyCYValue]);

  const toggleCategory    = (categoryId) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(categoryId) ? next.delete(categoryId) : next.add(categoryId);
      return next;
    });
  };
  const toggleSubcategory = (key) => {
    setExpandedSubcategories(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleCellClick = (product, month, currentValue) => {
    if (!isEditable(product)) return;
    setActiveCell({ productId: product.id, month });
    setEditValue(currentValue?.toString() || '');
  };

  const handleCellChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setEditValue(value);
  };

  const handleCellBlur = () => {
    if (activeCell) {
      const numValue = parseInt(editValue) || 0;

      const product = products.find(p => p.id === activeCell.productId);
      if (product) {
        const warns = validateEntry(product, activeCell.month, numValue);
        setCellWarnings(prev => {
          const updated = { ...prev };
          const productWarns = { ...(updated[activeCell.productId] || {}) };
          if (warns.length > 0) {
            productWarns[activeCell.month] = warns;
          } else {
            delete productWarns[activeCell.month];
          }
          updated[activeCell.productId] = productWarns;
          return updated;
        });
      }

      if (onUpdateTarget) onUpdateTarget(activeCell.productId, activeCell.month, numValue);
      setActiveCell(null);
      setEditValue('');
    }
  };

  const handleCellKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCellBlur();
    } else if (e.key === 'Escape') {
      setActiveCell(null);
      setEditValue('');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleCellBlur();
      if (activeCell) {
        const monthIdx = MONTHS.indexOf(activeCell.month);
        if (monthIdx < MONTHS.length - 1) {
          const product = products.find(p => p.id === activeCell.productId);
          if (product && isEditable(product)) {
            const nextMonth = MONTHS[monthIdx + 1];
            const nextValue = product.monthlyTargets?.[nextMonth]?.cyQty || 0;
            setActiveCell({ productId: activeCell.productId, month: nextMonth });
            setEditValue(nextValue.toString());
          }
        }
      }
    }
  };

  const handleSaveAll = async () => {
    setIsLoading(true);
    try {
      if (onSaveAll) await onSaveAll();
      setLastSaved(new Date());
    } catch (error) { console.error('Save failed:', error); }
    setIsLoading(false);
  };

  const handleSubmitAll = async () => {
    if (allWarnings.length > 0) {
      setShowSubmitModal(true);
      return;
    }
    await doSubmit(null);
  };

  const handleSubmitConfirm = async (comment) => {
    setShowSubmitModal(false);
    await doSubmit(comment);
  };

  const doSubmit = async (comment) => {
    setIsLoading(true);
    try {
      if (onSubmitAll) await onSubmitAll(comment);
    } catch (error) { console.error('Submit failed:', error); }
    setIsLoading(false);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Escape') { setSearchTerm(''); searchInputRef.current?.blur(); }
  };
  const clearSearch = () => { setSearchTerm(''); searchInputRef.current?.focus(); };

  const highlightMatch = (text, search) => {
    if (!search || !search.trim()) return text;
    const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? <mark key={i} className="search-highlight">{part}</mark> : part
    );
  };

  const getCellWarning = (productId, month) => {
    const pw = cellWarnings[productId];
    if (!pw) return null;
    const mw = pw[month];
    if (!mw || mw.length === 0) return null;
    return mw;
  };

  const renderRevenueOnlyCategory = (category) => {
    const isExpanded  = expandedCategories.has(category.id);
    const catProducts = filteredProducts.filter(p => p.categoryId === category.id);
    const firstProduct = catProducts[0];
    if (catProducts.length === 0 && searchTerm) return null;

    return (
      <div key={category.id} className="category-section revenue-only-section">
        <div className="category-header-row" onClick={() => toggleCategory(category.id)}>
          <div className="category-name-cell">
            <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'} chevron-icon`}></i>
            <div className={`category-icon-badge ${category.id}`}>
              <i className={`fas ${category.icon || 'fa-box'}`}></i>
            </div>
            <span className="category-name">{category.name}</span>
          </div>
          {MONTHS.map(month => (
            <div key={month} className="month-cell">
              {Utils.formatNumber(calculateCategoryTotal(category.id, month, 'CY'))}
            </div>
          ))}
          <div className="total-cell">
            {Utils.formatNumber(MONTHS.reduce((sum, m) => sum + calculateCategoryTotal(category.id, m, 'CY'), 0))}
          </div>
        </div>

        {isExpanded && (
          <div className="revenue-input-section">
            <div className="revenue-row cy-row">
              <div className="product-name-cell"><span className="year-label">CY Target</span></div>
              {MONTHS.map(month => {
                const totalValue = calculateCategoryTotal(category.id, month, 'CY');
                return (
                  <div key={month} className="month-cell editable-revenue">
                    <input
                      type="text"
                      className="revenue-input"
                      value={totalValue || ''}
                      placeholder="0"
                      onChange={(e) => {
                        if (firstProduct) {
                          const value = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
                          onUpdateTarget(firstProduct.id, month, value);
                        }
                      }}
                    />
                  </div>
                );
              })}
              <div className="total-cell">{Utils.formatNumber(MONTHS.reduce((sum, m) => sum + calculateCategoryTotal(category.id, m, 'CY'), 0))}</div>
            </div>
            <div className="revenue-row ly-row">
              <div className="product-name-cell"><span className="year-label ly">Last Year Actual</span></div>
              {MONTHS.map(month => (
                <div key={month} className="month-cell ly-value">{Utils.formatNumber(calculateCategoryTotal(category.id, month, 'LY'))}</div>
              ))}
              <div className="total-cell ly-value">{Utils.formatNumber(MONTHS.reduce((sum, m) => sum + calculateCategoryTotal(category.id, m, 'LY'), 0))}</div>
            </div>
            <div className="revenue-row aop-row">
              <div className="product-name-cell"><span className="year-label aop">AOP Target</span></div>
              {MONTHS.map(month => {
                const monthData = firstProduct?.monthlyTargets?.[month] || {};
                return (
                  <div key={month} className="month-cell aop-value">
                    {Utils.formatNumber(monthData.aopRev || 0)}
                  </div>
                );
              })}
              <div className="total-cell aop-value">
                {Utils.formatNumber(MONTHS.reduce((s, m) => s + (firstProduct?.monthlyTargets?.[m]?.aopRev || 0), 0))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderProductRows = (product) => {
    const canEdit         = isEditable(product);
    const productHasValues = hasAnyCYValue(product);
    const productHasLYData = hasAnyLYValue(product);
    const statusInfo      = getStatusInfo(product.status);

    const productWarnings = cellWarnings[product.id] || {};
    const productWarnCount = Object.values(productWarnings).reduce((s, arr) => s + arr.length, 0);

    return (
      <div
        key={product.id}
        className={`product-rows ${product.status ? `status-${product.status}` : 'status-draft'} ${!productHasValues ? 'no-values-entered' : ''} ${!productHasLYData ? 'no-ly-data' : ''}`}
      >
        {}
        <div className="product-row cy-row">
          <div className="product-name-cell">
            <span className="product-name" title={product.name}>
              {highlightMatch(product.name, searchTerm)}
            </span>
            {productHasLYData && (
              <span title="Last year data available" style={{
                width: 7, height: 7, borderRadius: '50%', background: '#00A19B',
                display: 'inline-block', marginLeft: 5, flexShrink: 0, verticalAlign: 'middle',
              }} />
            )}
            <span className="year-label">CY</span>
            <span
              className="product-status-indicator"
              title={statusInfo.label}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '2px 8px', borderRadius: '12px', fontSize: '0.625rem',
                fontWeight: 700, background: statusInfo.bg, color: statusInfo.color,
                marginLeft: '6px', whiteSpace: 'nowrap', letterSpacing: '0.02em',
              }}
            >
              <i className={`fas ${statusInfo.icon}`} style={{ fontSize: '0.5625rem' }}></i>
              {product.status === 'approved' ? 'Locked' : product.status === 'submitted' ? 'Pending' : 'Draft'}
            </span>

            {}
            {productWarnCount > 0 && canEdit && (
              <span title={`${productWarnCount} warning${productWarnCount > 1 ? 's' : ''} — abnormal entries detected`} style={{
                display: 'inline-flex', alignItems: 'center', gap: '3px',
                padding: '2px 7px', borderRadius: '12px', fontSize: '0.625rem',
                fontWeight: 700, background: '#FEF3C7', color: '#D97706',
                marginLeft: '6px', whiteSpace: 'nowrap', border: '1px solid #FDE68A',
              }}>
                <i className="fas fa-exclamation-triangle" style={{ fontSize: '0.5625rem' }}></i>
                {productWarnCount}
              </span>
            )}
          </div>

          {MONTHS.map(month => {
            const monthData   = product.monthlyTargets?.[month] || {};
            const isActive    = activeCell?.productId === product.id && activeCell?.month === month;
            const cellWarn    = canEdit ? getCellWarning(product.id, month) : null;
            const hasCellWarn = cellWarn && cellWarn.length > 0;
            const warnType    = hasCellWarn ? cellWarn[0].type : null;

            const warnBorder  = warnType === 'cap' ? '#DC2626' : '#D97706';
            const warnBg      = warnType === 'cap' ? 'rgba(220,38,38,0.06)' : 'rgba(217,119,6,0.06)';

            return (
              <div
                key={month}
                className={`month-cell ${canEdit ? 'editable' : 'locked'} ${isActive ? 'active-cell' : ''}`}
                onClick={() => handleCellClick(product, month, monthData.cyQty)}
                title={
                  hasCellWarn
                    ? cellWarn.map(w => w.message).join('\n')
                    : (!canEdit ? `${statusInfo.label} — values are locked` : 'Click to edit')
                }
                style={hasCellWarn && !isActive ? {
                  border: `1.5px solid ${warnBorder}`,
                  background: warnBg,
                  borderRadius: '4px',
                  position: 'relative',
                } : {}}
              >
                {isActive ? (
                  <input
                    ref={inputRef} type="text" className="cell-input"
                    value={editValue}
                    onChange={handleCellChange} onBlur={handleCellBlur} onKeyDown={handleCellKeyDown}
                  />
                ) : (
                  <span className={`cell-value ${canEdit ? 'editable' : ''}`} style={{ position: 'relative' }}>
                    {Utils.formatNumber(monthData.cyQty || 0)}
                    {/* PART 2: tiny warning icon overlaid on cell */}
                    {hasCellWarn && (
                      <span style={{
                        position: 'absolute', top: -5, right: -5,
                        width: 12, height: 12, borderRadius: '50%',
                        background: warnType === 'cap' ? '#DC2626' : '#D97706',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.4375rem', color: '#fff', fontWeight: 700,
                        pointerEvents: 'none',
                      }}>!</span>
                    )}
                  </span>
                )}
              </div>
            );
          })}
          <div className="total-cell cy-total">{Utils.formatNumber(calculateYearlyTotal(product.id, 'CY'))}</div>
        </div>

        {}
        <div className="product-row ly-row">
          <div className="product-name-cell"><span className="year-label ly">LY</span></div>
          {MONTHS.map(month => {
            const monthData = product.monthlyTargets?.[month] || {};
            return <div key={month} className="month-cell ly-value">{Utils.formatNumber(monthData.lyQty || 0)}</div>;
          })}
          <div className="total-cell ly-value">{Utils.formatNumber(calculateYearlyTotal(product.id, 'LY'))}</div>
        </div>

        {}
        <div className="product-row aop-row">
          <div className="product-name-cell"><span className="year-label aop">AOP</span></div>
          {MONTHS.map(month => {
            const monthData = product.monthlyTargets?.[month] || {};
            return <div key={month} className="month-cell aop-value">{Utils.formatNumber(monthData.aopQty || 0)}</div>;
          })}
          <div className="total-cell aop-value">
            {Utils.formatNumber(MONTHS.reduce((s, m) => s + (product.monthlyTargets?.[m]?.aopQty || 0), 0))}
          </div>
        </div>
      </div>
    );
  };

  const renderProductCategory = (category) => {
    const isExpanded   = expandedCategories.has(category.id);
    const subcategories = getSubcategories(category.id);
    if (subcategories.length === 0 && searchTerm) return null;

    return (
      <div key={category.id} className="category-section">
        <div className="category-header-row" onClick={() => toggleCategory(category.id)}>
          <div className="category-name-cell">
            <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'} chevron-icon`}></i>
            <div className={`category-icon-badge ${category.id}`}>
              <i className={`fas ${category.icon || 'fa-box'}`}></i>
            </div>
            <span className="category-name">{category.name}</span>
          </div>
          {MONTHS.map(month => (
            <div key={month} className="month-cell">
              {Utils.formatNumber(calculateCategoryTotal(category.id, month, 'CY'))}
            </div>
          ))}
          <div className="total-cell">
            {Utils.formatNumber(MONTHS.reduce((sum, m) => sum + calculateCategoryTotal(category.id, m, 'CY'), 0))}
          </div>
        </div>

        {isExpanded && subcategories.map(subcategory => {
          const subcatKey = `${category.id}__${subcategory}`;
          const isSubExpanded = expandedSubcategories.has(subcatKey);
          const subcatProducts = filteredProducts.filter(
            p => p.categoryId === category.id && p.subcategory === subcategory
          );
          const subcatCYTotal = MONTHS.reduce((sum, m) =>
            sum + subcatProducts.reduce((s, p) => s + (p.monthlyTargets?.[m]?.cyQty || 0), 0), 0);
          const subcatLYTotal = MONTHS.reduce((sum, m) =>
            sum + subcatProducts.reduce((s, p) => s + (p.monthlyTargets?.[m]?.lyQty || 0), 0), 0);
          const subcatGrowth  = Utils.calcGrowth(subcatLYTotal, subcatCYTotal);

          return (
            <div key={subcategory} className="subcategory-section">
              <div
                className="subcategory-header-row"
                onClick={() => toggleSubcategory(subcatKey)}
                style={{ cursor: 'pointer' }}
              >
                <div className="subcategory-name-cell">
                  <i className={`fas fa-chevron-${isSubExpanded ? 'down' : 'right'}`}
                    style={{ marginRight: '6px', fontSize: '0.625rem', color: '#6B7280', width: '10px' }}></i>
                  <i className="fas fa-folder subcategory-icon"
                    style={{ marginRight: '6px', fontSize: '0.75rem', color: '#6B7280' }}></i>
                  <span className="subcategory-name">{highlightMatch(subcategory, searchTerm)}</span>
                  {(() => {
                    const lyCount = subcatProducts.filter(p => hasAnyLYValue(p)).length;
                    return (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}>
                        <span style={{ fontSize: '0.6rem', color: '#9CA3AF', fontWeight: 500 }}>{subcatProducts.length} products</span>
                        {lyCount > 0 && (
                          <span style={{
                            fontSize: '0.575rem', fontWeight: 600,
                            background: '#E6FAF9', color: '#00A19B',
                            border: '1px solid #b2e8e6', borderRadius: '10px',
                            padding: '1px 6px', whiteSpace: 'nowrap',
                            display: 'inline-flex', alignItems: 'center', gap: '3px',
                          }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#00A19B', display: 'inline-block' }}></span>
                            {lyCount} LY
                          </span>
                        )}
                      </span>
                    );
                  })()}
                </div>
                {MONTHS.map(m => (
                  <div key={m} className="month-cell" style={{ fontSize: '0.6875rem', color: '#6B7280' }}>
                    {Utils.formatNumber(subcatProducts.reduce((s, p) => s + (p.monthlyTargets?.[m]?.cyQty || 0), 0))}
                  </div>
                ))}
                <div className="total-cell" style={{ fontSize: '0.6875rem', color: '#6B7280' }}>
                  {Utils.formatNumber(subcatCYTotal)}
                </div>
              </div>

              {isSubExpanded && subcatProducts.map(product => renderProductRows(product))}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="target-entry-container" ref={gridRef}>

      {}
      {showSubmitModal && (
        <SubmitWarningModal
          warnings={allWarnings}
          onConfirm={handleSubmitConfirm}
          onCancel={() => setShowSubmitModal(false)}
        />
      )}

      {/* Grid Header */}
      <div className="grid-header">
        <div className="grid-title">
          <h2><i className="fas fa-table"></i> Monthly Target Entry</h2>
          <span className="fiscal-year">FY {fiscalYear}</span>
        </div>
        <div className="grid-actions">
          {lastSaved && (
            <span className="last-saved">
              <i className="fas fa-check-circle"></i> Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <button className="action-btn save" onClick={handleSaveAll} disabled={isLoading}>
            {isLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
            Save
          </button>
          <button
            className="action-btn submit"
            onClick={handleSubmitAll}
            disabled={isLoading}
            title={allWarnings.length > 0 ? `${allWarnings.length} warning(s) — you'll be asked to add a comment` : 'Submit to TBM'}
          >
            {isLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
            Submit to TBM
            {}
            {allWarnings.length > 0 && (
              <span style={{
                marginLeft: '5px', background: '#D97706', color: '#fff',
                borderRadius: '10px', padding: '1px 6px', fontSize: '0.6rem', fontWeight: 700,
              }}>
                {allWarnings.length}⚠
              </span>
            )}
          </button>
        </div>
      </div>

      {}
      <div className="overall-target-bar">
        <div className="otb-main-section">
          <div className="otb-card otb-yearly-target">
            <div className="otb-card-icon"><i className="fas fa-flag-checkered"></i></div>
            <div className="otb-card-content">
              <span className="otb-card-label">Target Value (FY 2025-26)</span>
              <span className="otb-card-value">
                {overallTargetSummary.yearlyTargetValue
                  ? `₹${Utils.formatCompact(overallTargetSummary.yearlyTargetValue)}`
                  : 'Not Set'}
              </span>
            </div>
          </div>
          <div className="otb-card otb-entered-value">
            <div className="otb-card-icon"><i className="fas fa-rupee-sign"></i></div>
            <div className="otb-card-content">
              <span className="otb-card-label">Target for FY 26-27</span>
              <span className="otb-card-value">₹{Utils.formatCompact(overallTargetSummary.totalEnteredValue)}</span>
            </div>
          </div>
          <div className="otb-card otb-live-value" style={{ borderLeft: '3px solid #00A19B' }}>
            <div className="otb-card-icon" style={{ background: 'linear-gradient(135deg, #00A19B, #00C4BC)' }}>
              <i className="fas fa-calculator"></i>
            </div>
            <div className="otb-card-content">
              <span className="otb-card-label">Entered Value (Qty × Price)</span>
              <span className="otb-card-value" style={{ color: overallTargetSummary.liveEnteredValue > 0 ? '#00A19B' : '#94a3b8' }}>
                {overallTargetSummary.liveEnteredValue > 0
                  ? `₹${Utils.formatCompact(overallTargetSummary.liveEnteredValue)}`
                  : '—'}
              </span>
            </div>
          </div>

        </div>

      </div>

      {}
      {cyLyWarning && (
        <div style={{
          margin: '0 0 0 0', padding: '0.625rem 1.25rem',
          background: '#FEF9C3', borderBottom: '1px solid #FDE047',
          display: 'flex', alignItems: 'center', gap: '0.625rem',
          fontSize: '0.8125rem',
        }}>
          <i className="fas fa-exclamation-triangle" style={{ color: '#CA8A04', flexShrink: 0 }}></i>
          <span style={{ color: '#78350F', fontWeight: 500 }}>
            <strong>CY target below last year:</strong> Your total CY target ({Utils.formatNumber(cyLyWarning.totalCY)} units) is{' '}
            {100 - cyLyWarning.pct}% lower than last year's total ({Utils.formatNumber(cyLyWarning.totalLY)} units).
            Review your entries or submit with a comment to proceed.
          </span>
        </div>
      )}

      {/* ── PART 2: active warnings summary bar ──────────────────────────── */}
      {allWarnings.length > 0 && (
        <div style={{
          padding: '0.5rem 1.25rem',
          background: '#FFFBEB', borderBottom: '1px solid #FDE68A',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          fontSize: '0.75rem', flexWrap: 'wrap',
        }}>
          <i className="fas fa-exclamation-triangle" style={{ color: '#D97706' }}></i>
          <span style={{ fontWeight: 600, color: '#92400E' }}>
            {allWarnings.length} abnormal entr{allWarnings.length > 1 ? 'ies' : 'y'} detected.
          </span>
          <span style={{ color: '#B45309' }}>
            Hover cells with the <strong>!</strong> badge for details. You'll be asked for a comment when submitting.
          </span>
        </div>
      )}
      {}

      {}
      <div className="grid-search-bar" style={{
        display: 'flex', flexWrap: 'wrap', gap: '8px',
        padding: '0.625rem 1rem', borderBottom: '1px solid #E5E7EB',
        background: '#FAFAFA', alignItems: 'center',
      }}>
        <div className="search-input-wrapper" style={{ flex: '1 1 180px', minWidth: 0 }}>
          <i className="fas fa-search search-icon"></i>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="search-input"
          />
          {searchTerm && (
            <button className="clear-search" onClick={clearSearch}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
            fontSize: '0.75rem', color: showOnlyEntered ? '#00A19B' : '#6B7280', fontWeight: 500,
            padding: '0.3rem 0.6rem', borderRadius: '20px',
            background: showOnlyEntered ? '#E6FAF9' : '#F3F4F6',
            border: `1px solid ${showOnlyEntered ? '#00A19B' : '#E5E7EB'}`,
            transition: 'all 0.2s ease', userSelect: 'none',
          }}>
            <input type="checkbox" checked={showOnlyEntered}
              onChange={(e) => setShowOnlyEntered(e.target.checked)}
              style={{ accentColor: '#00A19B', width: 13, height: 13 }} />
            <i className={`fas ${showOnlyEntered ? 'fa-eye' : 'fa-eye-slash'}`} style={{ fontSize: '0.7rem' }}></i>
            Entered only
          </label>

          <label style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
            fontSize: '0.75rem', color: showOnlyLYData ? '#00A19B' : '#6B7280', fontWeight: 500,
            padding: '0.3rem 0.6rem', borderRadius: '20px',
            background: showOnlyLYData ? '#E6FAF9' : '#F3F4F6',
            border: `1px solid ${showOnlyLYData ? '#00A19B' : '#E5E7EB'}`,
            transition: 'all 0.2s ease', userSelect: 'none',
          }}>
            <input type="checkbox" checked={showOnlyLYData}
              onChange={(e) => setShowOnlyLYData(e.target.checked)}
              style={{ accentColor: '#00A19B', width: 13, height: 13 }} />
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: showOnlyLYData ? '#00A19B' : '#D1D5DB',
              display: 'inline-block', flexShrink: 0,
            }}></span>
            LY data only
          </label>
        </div>

        <div className="grid-legend" style={{
          display: 'flex', gap: '10px', alignItems: 'center',
          fontSize: '0.625rem', color: '#9CA3AF', marginLeft: 'auto', flexWrap: 'wrap',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, border: '2px solid #00A19B', background: 'rgba(0,161,155,0.06)', display: 'inline-block' }}></span>
            Editable
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: '#D1FAE5', border: '1px solid #059669', display: 'inline-block' }}></span>
            Approved
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: '#FEF3C7', border: '1px solid #D97706', display: 'inline-block' }}></span>
            Pending
          </span>
          {}
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, border: '1.5px solid #D97706', background: 'rgba(217,119,6,0.06)', display: 'inline-block' }}></span>
            Abnormal
          </span>
        </div>
      </div>

      {}
      <div className="excel-grid">
        <div className="grid-header-row">
          <div className="header-cell product-header">Product</div>
          {MONTH_LABELS.map((label, idx) => (
            <div key={label} className={`header-cell month-header ${idx < 3 ? 'q1' : idx < 6 ? 'q2' : idx < 9 ? 'q3' : 'q4'}`}>
              {label}
            </div>
          ))}
          <div className="header-cell total-header">TOTAL</div>

        </div>

        {categories.map(category =>
          category.isRevenueOnly
            ? renderRevenueOnlyCategory(category)
            : renderProductCategory(category)
        )}

        {filteredProducts.length === 0 && searchTerm && (
          <div className="no-results">
            <i className="fas fa-search" style={{ fontSize: '1.5rem', opacity: 0.3 }}></i>
            <p>No products matching "{searchTerm}"</p>
            <button className="clear-search-btn" onClick={clearSearch}>Clear Search</button>
          </div>
        )}
      </div>

      <style>{`
        .product-rows.no-ly-data {
          opacity: 0.42;
          filter: grayscale(25%);
          transition: opacity 0.2s ease, filter 0.2s ease;
        }
        .product-rows.no-ly-data:hover {
          opacity: 0.88;
          filter: none;
        }
        @media (max-width: 600px) {
          .grid-legend { display: none !important; }
          .grid-search-bar { padding: 0.5rem !important; }
        }
        @media (max-width: 400px) {
          .grid-header { flex-direction: column; gap: 8px; }
          .grid-actions { width: 100%; justify-content: flex-end; }
        }
      `}</style>

      <div className="grid-footer-info" style={{
        padding: '0.75rem 1.5rem', background: '#F9FAFB',
        borderTop: '1px solid #E5E7EB',
        display: 'flex', gap: '2rem', fontSize: '0.6875rem',
        color: '#6B7280', flexWrap: 'wrap',
      }}>
        <span><i className="fas fa-mouse-pointer" style={{ marginRight: '0.375rem', color: '#00A19B' }}></i> Click on teal-bordered cells to edit</span>
        <span><i className="fas fa-lock" style={{ marginRight: '0.375rem', color: '#059669' }}></i> Green rows = Approved by TBM (locked)</span>
        <span><i className="fas fa-clock" style={{ marginRight: '0.375rem', color: '#D97706' }}></i> Yellow rows = Pending TBM approval (locked)</span>
        <span><i className="fas fa-keyboard" style={{ marginRight: '0.375rem' }}></i> Tab to move between cells, Enter to confirm</span>
        {}
        <span><i className="fas fa-exclamation-triangle" style={{ marginRight: '0.375rem', color: '#D97706' }}></i> Orange border = abnormal entry — hover for details</span>
      </div>
    </div>
  );
}

export default TargetEntryGrid;
