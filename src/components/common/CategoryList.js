import React from 'react';
import ProductCard from './ProductCard';
import { Utils } from '../../utils/helpers';

function CategoryList({ categories, products, expandedCategories, searchTerm, statusFilter, onToggleCategory, onOpenProduct, onSubmitProduct }) {
  const filterProducts = (productList) => {
    let filtered = productList;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(search) || 
        p.code.toLowerCase().includes(search) ||
        (p.subcategory && p.subcategory.toLowerCase().includes(search))
      );
    }
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }
    return filtered;
  };

  const getSubcategories = (categoryId) => {
    const categoryProducts = products.filter(p => p.categoryId === categoryId);
    const subcats = [...new Set(categoryProducts.map(p => p.subcategory).filter(Boolean))];
    return subcats;
  };

  const getCategoryTotals = (categoryId) => {
    const categoryProducts = products.filter(p => p.categoryId === categoryId);
    let lyQty = 0, cyQty = 0;
    categoryProducts.forEach(p => {
      if (p.monthlyTargets) {
        Object.values(p.monthlyTargets).forEach(m => {
          lyQty += m.lyQty || 0;
          cyQty += m.cyQty || 0;
        });
      }
    });
    return { lyQty, cyQty, growth: Utils.calcGrowth(lyQty, cyQty), count: categoryProducts.length };
  };

  return (
    <div className="category-list">
      {categories.map(category => {
        const isExpanded = expandedCategories.has(category.id);
        const subcategories = getSubcategories(category.id);
        const categoryTotals = getCategoryTotals(category.id);
        const categoryProducts = filterProducts(products.filter(p => p.categoryId === category.id));

        if (categoryProducts.length === 0 && (searchTerm || statusFilter !== 'all')) return null;

        return (
          <div key={category.id} className={`category-section ${isExpanded ? 'expanded' : ''}`}>
            <div className="category-header" onClick={() => onToggleCategory(category.id)}>
              <div className="category-info">
                <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'} category-chevron`}></i>
                <div className={`category-icon ${category.color}`}><i className={`fas ${category.icon}`}></i></div>
                <div className="category-details">
                  <span className="category-name">{category.name}</span>
                  <span className="category-count">{categoryTotals.count} products</span>
                </div>
              </div>
              <div className="category-stats">
                <div className="category-stat"><span className="stat-label">LY</span><span className="stat-value">{Utils.formatNumber(categoryTotals.lyQty)}</span></div>
                <div className="category-stat highlight"><span className="stat-label">CY</span><span className="stat-value">{Utils.formatNumber(categoryTotals.cyQty)}</span></div>
                <div className={`category-growth ${categoryTotals.growth >= 0 ? 'positive' : 'negative'}`}>{Utils.formatGrowth(categoryTotals.growth)}</div>
              </div>
            </div>
            
            {isExpanded && (
              <div className="category-content">
                {subcategories.length > 0 ? (
                  subcategories.map(subcategory => {
                    const subcatProducts = filterProducts(categoryProducts.filter(p => p.subcategory === subcategory));
                    if (subcatProducts.length === 0) return null;
                    return (
                      <div key={subcategory} className="subcategory-section">
                        <div className="subcategory-header"><i className="fas fa-folder-open"></i><span>{subcategory}</span><span className="subcategory-count">{subcatProducts.length}</span></div>
                        <div className="product-grid">
                          {subcatProducts.map(product => (
                            <ProductCard key={product.id} product={product} onOpen={onOpenProduct} onSubmit={onSubmitProduct} />
                          ))}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="product-grid">
                    {categoryProducts.map(product => (
                      <ProductCard key={product.id} product={product} onOpen={onOpenProduct} onSubmit={onSubmitProduct} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default CategoryList;
