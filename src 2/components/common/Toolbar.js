import React, { useState } from 'react';

function Toolbar({ searchTerm, onSearchChange, statusFilter, onStatusFilterChange, allExpanded, onToggleAll }) {
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const filterOptions = [
    { value: 'all', label: 'All Status', icon: 'fa-list' },
    { value: 'draft', label: 'Draft', icon: 'fa-edit' },
    { value: 'submitted', label: 'Pending Approval', icon: 'fa-clock' },
    { value: 'approved', label: 'Approved', icon: 'fa-check-circle' },
    { value: 'rejected', label: 'Rejected', icon: 'fa-times-circle' }
  ];
  const currentFilter = filterOptions.find(f => f.value === statusFilter);

  return (
    <div className="toolbar">
      <div className="search-wrapper">
        <i className="fas fa-search search-icon"></i>
        <input type="text" className="search-input" placeholder="Search products, codes, categories..." value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} />
        {searchTerm && <button className="search-clear" onClick={() => onSearchChange('')}><i className="fas fa-times"></i></button>}
      </div>
      <div className="toolbar-actions">
        <div className="filter-dropdown" style={{ position: 'relative' }}>
          <button className="filter-btn" onClick={() => setShowFilterMenu(!showFilterMenu)}>
            <i className={`fas ${currentFilter?.icon}`}></i>
            <span>{currentFilter?.label}</span>
            <i className="fas fa-chevron-down"></i>
          </button>
          <div className={`filter-menu ${showFilterMenu ? 'open' : ''}`}>
            {filterOptions.map(option => (
              <button key={option.value} className={`filter-option ${statusFilter === option.value ? 'active' : ''}`} onClick={() => { onStatusFilterChange(option.value); setShowFilterMenu(false); }}>
                <i className={`fas ${option.icon}`}></i><span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
        <button className="toolbar-btn" onClick={onToggleAll}>
          <i className={`fas fa-${allExpanded ? 'compress-alt' : 'expand-alt'}`}></i>
          <span>{allExpanded ? 'Collapse All' : 'Expand All'}</span>
        </button>
      </div>
    </div>
  );
}

export default Toolbar;
