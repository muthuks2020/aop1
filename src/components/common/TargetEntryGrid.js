import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Utils } from '../../utils/helpers';

function TargetEntryGrid({ 
  categories, 
  products, 
  onUpdateTarget,
  onSaveAll,
  onSubmitAll,
  userRole 
}) {
  const [activeCell, setActiveCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(new Set(['equipment', 'iol', 'ovd']));
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef(null);
  const searchInputRef = useRef(null);
  
  const months = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];
  const monthLabels = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  
  const revenueOnlyCategories = ['mis', 'others'];

  useEffect(() => {
    if (activeCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [activeCell]);

  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    
    const search = searchTerm.toLowerCase().trim();
    return products.filter(p => 
      p.name.toLowerCase().includes(search) ||
      p.code.toLowerCase().includes(search) ||
      (p.subcategory && p.subcategory.toLowerCase().includes(search))
    );
  }, [products, searchTerm]);

  // Get categories that have matching products
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    
    const categoryIdsWithProducts = new Set(filteredProducts.map(p => p.categoryId));
    return categories.filter(cat => categoryIdsWithProducts.has(cat.id));
  }, [categories, filteredProducts, searchTerm]);

  // Auto-expand categories when searching
  useEffect(() => {
    if (searchTerm.trim()) {
      const categoryIdsWithProducts = new Set(filteredProducts.map(p => p.categoryId));
      setExpandedCategories(categoryIdsWithProducts);
    }
  }, [searchTerm, filteredProducts]);

  const getProductsByCategory = (categoryId) => {
    return filteredProducts.filter(p => p.categoryId === categoryId);
  };

  const getSubcategories = (categoryId) => {
    const categoryProducts = getProductsByCategory(categoryId);
    const subcats = [...new Set(categoryProducts.map(p => p.subcategory))];
    return subcats.filter(Boolean);
  };

  const getProductsBySubcategory = (categoryId, subcategory) => {
    return filteredProducts.filter(p => p.categoryId === categoryId && p.subcategory === subcategory);
  };

  const getCategoryStatusCounts = (categoryId) => {
    const categoryProducts = products.filter(p => p.categoryId === categoryId);
    const counts = {
      total: categoryProducts.length,
      draft: categoryProducts.filter(p => p.status === 'draft').length,
      submitted: categoryProducts.filter(p => p.status === 'submitted').length,
      approved: categoryProducts.filter(p => p.status === 'approved').length,
      rejected: categoryProducts.filter(p => p.status === 'rejected').length
    };
    counts.pending = counts.draft + counts.rejected;
    return counts;
  };

  const getSubcategoryStatusCounts = (categoryId, subcategory) => {
    const subcatProducts = products.filter(p => p.categoryId === categoryId && p.subcategory === subcategory);
    const counts = {
      total: subcatProducts.length,
      draft: subcatProducts.filter(p => p.status === 'draft').length,
      submitted: subcatProducts.filter(p => p.status === 'submitted').length,
      approved: subcatProducts.filter(p => p.status === 'approved').length,
      rejected: subcatProducts.filter(p => p.status === 'rejected').length
    };
    counts.pending = counts.draft + counts.rejected;
    return counts;
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(categoryId) ? next.delete(categoryId) : next.add(categoryId);
      return next;
    });
  };

  const handleCellClick = (productId, month, year, currentValue, status) => {
    if (year === 'LY') return;
    if (status === 'submitted' || status === 'approved') return;
    setActiveCell({ productId, month, year });
    setEditValue(currentValue?.toString() || '');
  };

  const handleInputChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setEditValue(value);
  };

  const handleInputBlur = () => {
    if (activeCell) {
      const value = parseInt(editValue) || 0;
      onUpdateTarget(activeCell.productId, activeCell.month, value);
      setActiveCell(null);
      setEditValue('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleInputBlur();
      if (activeCell) {
        const currentMonthIndex = months.indexOf(activeCell.month);
        if (currentMonthIndex < months.length - 1) {
          const nextMonth = months[currentMonthIndex + 1];
          const product = products.find(p => p.id === activeCell.productId);
          if (product && product.status !== 'submitted' && product.status !== 'approved') {
            const nextValue = product.monthlyTargets?.[nextMonth]?.cyQty || 0;
            setActiveCell({ ...activeCell, month: nextMonth });
            setEditValue(nextValue.toString());
          }
        }
      }
    } else if (e.key === 'Escape') {
      setActiveCell(null);
      setEditValue('');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleInputBlur();
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Escape') {
      setSearchTerm('');
      searchInputRef.current?.blur();
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  const calculateCategoryTotal = (categoryId, month, year) => {
    const categoryProducts = products.filter(p => p.categoryId === categoryId);
    return categoryProducts.reduce((sum, p) => {
      const monthData = p.monthlyTargets?.[month] || {};
      return sum + (year === 'CY' ? (monthData.cyQty || 0) : (monthData.lyQty || 0));
    }, 0);
  };

  const calculateSubcategoryTotal = (categoryId, subcategory, month, year) => {
    const subcatProducts = products.filter(p => p.categoryId === categoryId && p.subcategory === subcategory);
    return subcatProducts.reduce((sum, p) => {
      const monthData = p.monthlyTargets?.[month] || {};
      return sum + (year === 'CY' ? (monthData.cyQty || 0) : (monthData.lyQty || 0));
    }, 0);
  };

  const calculateYearlyTotal = (productId, year) => {
    const product = products.find(p => p.id === productId);
    if (!product) return 0;
    return months.reduce((sum, month) => {
      const monthData = product.monthlyTargets?.[month] || {};
      return sum + (year === 'CY' ? (monthData.cyQty || 0) : (monthData.lyQty || 0));
    }, 0);
  };

  const calculateGrowth = (productId) => {
    const ly = calculateYearlyTotal(productId, 'LY');
    const cy = calculateYearlyTotal(productId, 'CY');
    return Utils.calcGrowth(ly, cy);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'approved': return 'status-approved';
      case 'submitted': return 'status-submitted';
      case 'rejected': return 'status-rejected';
      default: return 'status-draft';
    }
  };

  const isEditable = (status) => status === 'draft' || status === 'rejected';

  // Highlight matching text
  const highlightMatch = (text, search) => {
    if (!search.trim()) return text;
    const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? <mark key={i} className="search-highlight">{part}</mark> : part
    );
  };

  const renderCell = (productId, month, year, value, status) => {
    const isActive = activeCell?.productId === productId && 
                     activeCell?.month === month && 
                     activeCell?.year === year;
    const canEdit = year === 'CY' && isEditable(status);
    
    if (isActive && canEdit) {
      return (
        <input
          ref={inputRef}
          type="text"
          className="cell-input"
          value={editValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
        />
      );
    }

    return (
      <div 
        className={`cell-value ${canEdit ? 'editable' : ''} ${year === 'LY' ? 'ly-value' : ''} ${!canEdit && year === 'CY' ? 'locked' : ''}`}
        onClick={() => canEdit && handleCellClick(productId, month, year, value, status)}
        title={!canEdit && year === 'CY' ? `${status === 'submitted' ? 'Pending approval' : status === 'approved' ? 'Approved' : ''}` : ''}
      >
        {value || '-'}
        {!canEdit && year === 'CY' && status === 'submitted' && <i className="fas fa-lock lock-icon"></i>}
      </div>
    );
  };

  const renderStatusBadges = (counts) => (
    <div className="status-badges">
      {counts.approved > 0 && (
        <span className="status-badge approved" title="Approved">
          <i className="fas fa-check"></i> {counts.approved}
        </span>
      )}
      {counts.submitted > 0 && (
        <span className="status-badge submitted" title="Pending Approval">
          <i className="fas fa-clock"></i> {counts.submitted}
        </span>
      )}
      {counts.pending > 0 && (
        <span className="status-badge pending" title="Pending Entry">
          <i className="fas fa-edit"></i> {counts.pending}
        </span>
      )}
    </div>
  );

  const renderRevenueOnlyCategory = (category) => {
    const isExpanded = expandedCategories.has(category.id);
    const statusCounts = getCategoryStatusCounts(category.id);
    const firstProduct = getProductsByCategory(category.id)[0];
    const status = firstProduct?.status || 'draft';
    
    if (!firstProduct) return null;
    
    return (
      <div key={category.id} className={`category-section revenue-only ${getStatusClass(status)}`}>
        <div className="category-header-row" onClick={() => toggleCategory(category.id)}>
          <div className="category-name-cell">
            <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'} chevron-icon`}></i>
            <div className={`category-icon ${category.color}`}>
              <i className={`fas ${category.icon}`}></i>
            </div>
            <span>{highlightMatch(category.name, searchTerm)}</span>
            <span className="revenue-badge">Revenue Only</span>
            {renderStatusBadges(statusCounts)}
          </div>
          {months.map(month => (
            <div key={month} className="month-cell category-total">
              {Utils.formatNumber(calculateCategoryTotal(category.id, month, 'CY'))}
            </div>
          ))}
          <div className="total-cell category-total">
            {Utils.formatNumber(months.reduce((sum, m) => sum + calculateCategoryTotal(category.id, m, 'CY'), 0))}
          </div>
          <div className="growth-cell">
            {(() => {
              const lyTotal = months.reduce((sum, m) => sum + calculateCategoryTotal(category.id, m, 'LY'), 0);
              const cyTotal = months.reduce((sum, m) => sum + calculateCategoryTotal(category.id, m, 'CY'), 0);
              const growth = Utils.calcGrowth(lyTotal, cyTotal);
              return <span className={`growth-value ${growth >= 0 ? 'positive' : 'negative'}`}>{Utils.formatGrowth(growth)}</span>;
            })()}
          </div>
        </div>
        
        {isExpanded && (
          <div className="revenue-input-section">
            <div className={`revenue-row ${getStatusClass(status)}`}>
              <div className="product-name-cell">
                <span className="year-label">CY Target</span>
                <span className={`product-status-badge ${status}`}>
                  {status === 'approved' && <><i className="fas fa-check-circle"></i> Approved</>}
                  {status === 'submitted' && <><i className="fas fa-clock"></i> Pending</>}
                  {status === 'rejected' && <><i className="fas fa-times-circle"></i> Rejected</>}
                  {status === 'draft' && <><i className="fas fa-edit"></i> Draft</>}
                </span>
              </div>
              {months.map(month => {
                const totalValue = calculateCategoryTotal(category.id, month, 'CY');
                const canEdit = isEditable(status);
                return (
                  <div key={month} className={`month-cell ${canEdit ? 'editable-revenue' : 'locked-cell'}`}>
                    {canEdit ? (
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
                    ) : (
                      <span className="locked-value">{Utils.formatNumber(totalValue)}</span>
                    )}
                  </div>
                );
              })}
              <div className="total-cell">{Utils.formatNumber(months.reduce((sum, m) => sum + calculateCategoryTotal(category.id, m, 'CY'), 0))}</div>
              <div className="growth-cell">-</div>
            </div>
            <div className="revenue-row ly-row">
              <div className="product-name-cell"><span className="year-label ly">LY Actual</span></div>
              {months.map(month => (
                <div key={month} className="month-cell ly-value">{Utils.formatNumber(calculateCategoryTotal(category.id, month, 'LY'))}</div>
              ))}
              <div className="total-cell ly-value">{Utils.formatNumber(months.reduce((sum, m) => sum + calculateCategoryTotal(category.id, m, 'LY'), 0))}</div>
              <div className="growth-cell">-</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderProductCategory = (category) => {
    const isExpanded = expandedCategories.has(category.id);
    const subcategories = getSubcategories(category.id);
    const statusCounts = getCategoryStatusCounts(category.id);

    if (subcategories.length === 0 && searchTerm) return null;

    return (
      <div key={category.id} className="category-section">
        <div className="category-header-row" onClick={() => toggleCategory(category.id)}>
          <div className="category-name-cell">
            <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'} chevron-icon`}></i>
            <div className={`category-icon ${category.color}`}>
              <i className={`fas ${category.icon}`}></i>
            </div>
            <span>{highlightMatch(category.name, searchTerm)}</span>
            {renderStatusBadges(statusCounts)}
          </div>
          {months.map(month => (
            <div key={month} className="month-cell category-total">{Utils.formatNumber(calculateCategoryTotal(category.id, month, 'CY'))}</div>
          ))}
          <div className="total-cell category-total">{Utils.formatNumber(months.reduce((sum, m) => sum + calculateCategoryTotal(category.id, m, 'CY'), 0))}</div>
          <div className="growth-cell">
            {(() => {
              const lyTotal = months.reduce((sum, m) => sum + calculateCategoryTotal(category.id, m, 'LY'), 0);
              const cyTotal = months.reduce((sum, m) => sum + calculateCategoryTotal(category.id, m, 'CY'), 0);
              const growth = Utils.calcGrowth(lyTotal, cyTotal);
              return <span className={`growth-value ${growth >= 0 ? 'positive' : 'negative'}`}>{Utils.formatGrowth(growth)}</span>;
            })()}
          </div>
        </div>

        {isExpanded && subcategories.map(subcategory => {
          const subcatStatusCounts = getSubcategoryStatusCounts(category.id, subcategory);
          const subcatProducts = getProductsBySubcategory(category.id, subcategory);
          
          if (subcatProducts.length === 0) return null;
          
          return (
            <div key={subcategory} className="subcategory-section">
              <div className="subcategory-header-row">
                <div className="subcategory-name-cell">
                  <i className="fas fa-folder-open"></i>
                  <span>{highlightMatch(subcategory, searchTerm)}</span>
                  {renderStatusBadges(subcatStatusCounts)}
                </div>
                {months.map(month => (
                  <div key={month} className="month-cell subcategory-total">{Utils.formatNumber(calculateSubcategoryTotal(category.id, subcategory, month, 'CY'))}</div>
                ))}
                <div className="total-cell subcategory-total">{Utils.formatNumber(months.reduce((sum, m) => sum + calculateSubcategoryTotal(category.id, subcategory, m, 'CY'), 0))}</div>
                <div className="growth-cell">
                  {(() => {
                    const lyTotal = months.reduce((sum, m) => sum + calculateSubcategoryTotal(category.id, subcategory, m, 'LY'), 0);
                    const cyTotal = months.reduce((sum, m) => sum + calculateSubcategoryTotal(category.id, subcategory, m, 'CY'), 0);
                    const growth = Utils.calcGrowth(lyTotal, cyTotal);
                    return <span className={`growth-value small ${growth >= 0 ? 'positive' : 'negative'}`}>{Utils.formatGrowth(growth)}</span>;
                  })()}
                </div>
              </div>

              {subcatProducts.map(product => (
                <div key={product.id} className={`product-rows ${getStatusClass(product.status)}`}>
                  <div className="product-row cy-row">
                    <div className="product-name-cell">
                      <span className="product-name">{highlightMatch(product.name, searchTerm)}</span>
                      <span className={`year-badge cy ${product.status}`}>
                        {product.status === 'approved' && <i className="fas fa-check"></i>}
                        {product.status === 'submitted' && <i className="fas fa-clock"></i>}
                        {product.status === 'rejected' && <i className="fas fa-times"></i>}
                        CY
                      </span>
                    </div>
                    {months.map(month => {
                      const monthData = product.monthlyTargets?.[month] || {};
                      return (
                        <div key={month} className={`month-cell ${getStatusClass(product.status)}`}>
                          {renderCell(product.id, month, 'CY', monthData.cyQty, product.status)}
                        </div>
                      );
                    })}
                    <div className={`total-cell cy-total ${getStatusClass(product.status)}`}>{Utils.formatNumber(calculateYearlyTotal(product.id, 'CY'))}</div>
                    <div className="growth-cell">
                      <span className={`growth-value ${calculateGrowth(product.id) >= 0 ? 'positive' : 'negative'}`}>{Utils.formatGrowth(calculateGrowth(product.id))}</span>
                    </div>
                  </div>
                  
                  <div className="product-row ly-row">
                    <div className="product-name-cell">
                      <span className="product-code">{highlightMatch(product.code, searchTerm)}</span>
                      <span className="year-badge ly">LY</span>
                    </div>
                    {months.map(month => {
                      const monthData = product.monthlyTargets?.[month] || {};
                      return <div key={month} className="month-cell ly-value">{monthData.lyQty || '-'}</div>;
                    })}
                    <div className="total-cell ly-total">{Utils.formatNumber(calculateYearlyTotal(product.id, 'LY'))}</div>
                    <div className="growth-cell"></div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="target-entry-container">
      <div className="grid-header">
        <div className="grid-title">
          <h2><i className="fas fa-table"></i> Monthly Target Entry</h2>
          <span className="fiscal-year">FY 2025-26</span>
        </div>
        <div className="grid-actions">
          <button className="action-btn save" onClick={onSaveAll}><i className="fas fa-save"></i> Save Draft</button>
          <button className="action-btn submit" onClick={onSubmitAll}><i className="fas fa-paper-plane"></i> Submit for Approval</button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="grid-search-bar">
        <div className="search-input-wrapper">
          <i className="fas fa-search search-icon"></i>
          <input
            ref={searchInputRef}
            type="text"
            className="grid-search-input"
            placeholder="Search products, codes, categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          {searchTerm && (
            <button className="search-clear-btn" onClick={clearSearch}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
        {searchTerm && (
          <div className="search-results-info">
            <span className="results-count">
              <i className="fas fa-filter"></i>
              {filteredProducts.length} of {products.length} products
            </span>
            {filteredProducts.length === 0 && (
              <span className="no-results-hint">Try a different search term</span>
            )}
          </div>
        )}
      </div>

      <div className="grid-wrapper">
        <div className="excel-grid">
          <div className="grid-header-row">
            <div className="header-cell product-header">
              <span>Product / Category</span>
              <span className="year-indicator">Year</span>
            </div>
            {monthLabels.map((month, index) => (
              <div key={month} className={`header-cell month-header ${index < 3 ? 'q1' : index < 6 ? 'q2' : index < 9 ? 'q3' : 'q4'}`}>{month}</div>
            ))}
            <div className="header-cell total-header">Total</div>
            <div className="header-cell growth-header">Growth %</div>
          </div>

          <div className="quarter-row">
            <div className="quarter-cell empty"></div>
            <div className="quarter-cell q1" style={{gridColumn: 'span 3'}}><span>Q1</span></div>
            <div className="quarter-cell q2" style={{gridColumn: 'span 3'}}><span>Q2</span></div>
            <div className="quarter-cell q3" style={{gridColumn: 'span 3'}}><span>Q3</span></div>
            <div className="quarter-cell q4" style={{gridColumn: 'span 3'}}><span>Q4</span></div>
            <div className="quarter-cell empty"></div>
            <div className="quarter-cell empty"></div>
          </div>

          {filteredCategories.length === 0 ? (
            <div className="no-results-message">
              <i className="fas fa-search"></i>
              <h3>No products found</h3>
              <p>No products match "{searchTerm}". Try a different search term.</p>
              <button className="clear-search-btn" onClick={clearSearch}>
                <i className="fas fa-times"></i> Clear Search
              </button>
            </div>
          ) : (
            filteredCategories.map(category => 
              revenueOnlyCategories.includes(category.id) 
                ? renderRevenueOnlyCategory(category)
                : renderProductCategory(category)
            )
          )}
        </div>
      </div>

      <div className="grid-footer">
        <div className="footer-info">
          <i className="fas fa-info-circle"></i>
          <span>Click on any CY cell to edit. Press Enter to move to next cell, Escape to cancel.</span>
        </div>
        <div className="footer-legend">
          <span className="legend-item"><span className="legend-color draft"></span> Draft</span>
          <span className="legend-item"><span className="legend-color submitted"></span> Submitted</span>
          <span className="legend-item"><span className="legend-color approved"></span> Approved</span>
          <span className="legend-item"><span className="legend-color rejected"></span> Rejected</span>
        </div>
      </div>
    </div>
  );
}

export default TargetEntryGrid;
