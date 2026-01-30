import React, { useState } from 'react';
import { Utils } from '../../utils/helpers';

function Toolbar({ 
  searchTerm, 
  onSearchChange, 
  statusFilter, 
  onStatusFilterChange,
  allExpanded,
  onToggleAll 
}) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filterOptions = [
    { value: 'all', label: 'All Products', icon: null },
    { value: 'draft', label: 'Draft', icon: 'fa-edit' },
    { value: 'submitted', label: 'Submitted', icon: 'fa-clock' },
    { value: 'approved', label: 'Approved', icon: 'fa-check-circle' },
    { value: 'rejected', label: 'Rejected', icon: 'fa-times-circle' }
  ];

  const handleFilterSelect = (value) => {
    onStatusFilterChange(value);
    setIsFilterOpen(false);
  };

  return (
    <div className="toolbar">
      <div className="search-wrapper">
        <i className="fas fa-search"></i>
        <input 
          type="text" 
          placeholder="Search products by name or code..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchTerm && (
          <button 
            className="search-clear visible"
            onClick={() => onSearchChange('')}
          >
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>
      
      <div className="toolbar-actions">
        <div className="filter-dropdown">
          <button 
            className="filter-btn"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <i className="fas fa-filter"></i>
            <span>{statusFilter === 'all' ? 'All Status' : Utils.getStatusLabel(statusFilter)}</span>
            <i className="fas fa-chevron-down"></i>
          </button>
          
          <div className={`filter-menu ${isFilterOpen ? 'open' : ''}`}>
            {filterOptions.map(option => (
              <button
                key={option.value}
                className={`filter-option ${statusFilter === option.value ? 'active' : ''}`}
                onClick={() => handleFilterSelect(option.value)}
              >
                {option.icon && <i className={`fas ${option.icon}`}></i>}
                {option.label}
              </button>
            ))}
          </div>
        </div>
        
        <button className="toolbar-btn" onClick={onToggleAll}>
          <i className={`fas ${allExpanded ? 'fa-compress-alt' : 'fa-expand-alt'}`}></i>
          <span>{allExpanded ? 'Collapse All' : 'Expand All'}</span>
        </button>
      </div>
    </div>
  );
}

export default Toolbar;
