import React from 'react';
import { Utils } from '../../utils/helpers';
import ProductCard from './ProductCard';

function CategoryList({ 
  categories, 
  products, 
  expandedCategories, 
  searchTerm, 
  statusFilter,
  onToggleCategory,
  onOpenProduct,
  onSubmitProduct
}) {
  const search = searchTerm.toLowerCase();

  const getCategoryProducts = (categoryId) => {
    return products.filter(p => {
      const matchCat = p.categoryId === categoryId;
      const matchSearch = !search || 
        p.name.toLowerCase().includes(search) || 
        p.code.toLowerCase().includes(search) || 
        (p.subcategory && p.subcategory.toLowerCase().includes(search));
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchCat && matchSearch && matchStatus;
    });
  };

  const calculateCategoryTotals = (categoryId) => {
    const categoryProducts = products.filter(p => p.categoryId === categoryId);
    let ly = 0, cy = 0;
    categoryProducts.forEach(p => { ly += p.lyQty; cy += p.cyQty; });
    return { ly, cy, growth: Utils.calcGrowth(ly, cy) };
  };

  const groupBySubcategory = (prods) => {
    const groups = {};
    prods.forEach(p => {
      const subcat = p.subcategory || 'General';
      if (!groups[subcat]) groups[subcat] = [];
      groups[subcat].push(p);
    });
    return groups;
  };

  const filteredCategories = categories.filter(cat => {
    const prods = getCategoryProducts(cat.id);
    return prods.length > 0;
  });

  if (filteredCategories.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <i className="fas fa-search"></i>
        </div>
        <h3>No products found</h3>
        <p>Try adjusting your search or filter criteria</p>
      </div>
    );
  }

  return (
    <div className="category-list">
      {filteredCategories.map(cat => {
        const categoryProducts = getCategoryProducts(cat.id);
        const totals = calculateCategoryTotals(cat.id);
        const isExpanded = expandedCategories.has(cat.id);
        const pendingCount = categoryProducts.filter(
          p => p.status === 'draft' || p.status === 'rejected'
        ).length;
        const subcategoryGroups = groupBySubcategory(categoryProducts);

        return (
          <div 
            key={cat.id}
            className={`category-card ${isExpanded ? 'expanded' : ''}`}
          >
            <div 
              className="category-header"
              onClick={() => onToggleCategory(cat.id)}
            >
              <div className="cat-icon-wrapper">
                <div className={`cat-icon ${cat.color}`}>
                  <i className={`fas ${cat.icon}`}></i>
                </div>
                {pendingCount > 0 && (
                  <span className="cat-count">{pendingCount}</span>
                )}
              </div>
              
              <div className="cat-info">
                <div className="cat-name">{cat.name}</div>
                <div className="cat-meta">
                  <span>
                    <i className="fas fa-box"></i> {categoryProducts.length} Products
                  </span>
                  <span>
                    <i className="fas fa-check-circle"></i> 
                    {categoryProducts.filter(p => p.status === 'approved').length} Approved
                  </span>
                  <span>
                    <i className="fas fa-layer-group"></i> 
                    {Object.keys(subcategoryGroups).length} Groups
                  </span>
                </div>
              </div>
              
              <div className="cat-stats">
                <div className="cat-stat">
                  <span className="cat-stat-label">LY Qty</span>
                  <span className="cat-stat-value">{Utils.formatNumber(totals.ly)}</span>
                </div>
                <div className="cat-stat">
                  <span className="cat-stat-label">CY Qty</span>
                  <span className="cat-stat-value">{Utils.formatNumber(totals.cy)}</span>
                </div>
              </div>
              
              <div className={`cat-growth ${totals.growth >= 0 ? 'positive' : 'negative'}`}>
                {Utils.formatGrowth(totals.growth)}
              </div>
              
              <div className="cat-chevron">
                <i className="fas fa-chevron-down"></i>
              </div>
            </div>
            
            <div className="cat-content">
              <div className="products-container">
                {Object.entries(subcategoryGroups).map(([subcat, prods]) => (
                  <div key={subcat} className="subcategory-section">
                    <div className="subcategory-header">
                      <span className="subcategory-name">
                        <i className="fas fa-folder"></i> {subcat}
                      </span>
                      <span className="subcategory-count">{prods.length} items</span>
                    </div>
                    <div className="product-grid">
                      {prods.map(product => (
                        <ProductCard 
                          key={product.id}
                          product={product}
                          onOpenProduct={onOpenProduct}
                          onSubmitProduct={onSubmitProduct}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default CategoryList;
