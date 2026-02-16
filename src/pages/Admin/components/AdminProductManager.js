/**
 * AdminProductManager Component
 * Add / Edit / Toggle Active-Inactive / Delete products
 * Products marked active will show across all existing screens
 *
 * Features:
 * - Product table with search and category filter
 * - Add/Edit form as slide-over panel
 * - Active/Inactive toggle with visual indicator
 * - List price entry with currency formatting
 * - Bulk status operations
 *
 * @version 1.0.0
 */

import React, { useState, useMemo } from 'react';
import { AdminApiService } from '../../../services/adminApi';

const EMPTY_PRODUCT = {
  name: '', code: '', categoryId: '', subcategory: '', listPrice: '', unit: 'Units', isActive: true,
};

function AdminProductManager({ products, categories, onRefresh, showToast, showModal }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ ...EMPTY_PRODUCT });
  const [isSaving, setIsSaving] = useState(false);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = !searchTerm || 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = categoryFilter === 'all' || p.categoryId === categoryFilter;
      const matchStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && p.isActive) || 
        (statusFilter === 'inactive' && !p.isActive);
      return matchSearch && matchCategory && matchStatus;
    });
  }, [products, searchTerm, categoryFilter, statusFilter]);

  const formatCurrency = (val) => {
    if (!val && val !== 0) return '';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  const getCategoryName = (catId) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : catId;
  };

  const getCategoryColor = (catId) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.color : '#6B7280';
  };

  // Open add form
  const handleAddNew = () => {
    setEditingProduct(null);
    setFormData({ ...EMPTY_PRODUCT });
    setShowForm(true);
  };

  // Open edit form
  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      code: product.code,
      categoryId: product.categoryId,
      subcategory: product.subcategory || '',
      listPrice: product.listPrice,
      unit: product.unit,
      isActive: product.isActive,
    });
    setShowForm(true);
  };

  // Save (create or update)
  const handleSave = async () => {
    if (!formData.name.trim()) { showToast('Validation', 'Product name is required.', 'warning'); return; }
    if (!formData.code.trim()) { showToast('Validation', 'Product code is required.', 'warning'); return; }
    if (!formData.categoryId) { showToast('Validation', 'Please select a category.', 'warning'); return; }
    if (formData.listPrice === '' || isNaN(Number(formData.listPrice)) || Number(formData.listPrice) < 0) {
      showToast('Validation', 'Please enter a valid list price.', 'warning'); return;
    }

    setIsSaving(true);
    try {
      const payload = { ...formData, listPrice: Number(formData.listPrice) };
      if (editingProduct) {
        await AdminApiService.updateProduct(editingProduct.id, payload);
        showToast('Updated', `${formData.name} has been updated.`, 'success');
      } else {
        await AdminApiService.createProduct(payload);
        showToast('Created', `${formData.name} has been added.`, 'success');
      }
      setShowForm(false);
      await onRefresh();
    } catch (error) {
      showToast('Error', `Failed to save product: ${error.message}`, 'error');
    }
    setIsSaving(false);
  };

  // Toggle active/inactive
  const handleToggleStatus = async (product) => {
    const action = product.isActive ? 'deactivate' : 'activate';
    showModal(
      `${product.isActive ? 'Deactivate' : 'Activate'} Product`,
      `Are you sure you want to ${action} "${product.name}"? ${product.isActive ? 'It will no longer appear in target screens.' : 'It will appear across all target screens.'}`,
      product.isActive ? 'warning' : 'success',
      async () => {
        try {
          await AdminApiService.toggleProductStatus(product.id);
          showToast('Updated', `${product.name} has been ${action}d.`, 'success');
          await onRefresh();
        } catch (error) {
          showToast('Error', `Failed to ${action}: ${error.message}`, 'error');
        }
      }
    );
  };

  // Delete product
  const handleDelete = (product) => {
    showModal(
      'Delete Product',
      `Are you sure you want to permanently delete "${product.name}" (${product.code})? This action cannot be undone.`,
      'danger',
      async () => {
        try {
          await AdminApiService.deleteProduct(product.id);
          showToast('Deleted', `${product.name} has been removed.`, 'success');
          await onRefresh();
        } catch (error) {
          showToast('Error', `Failed to delete: ${error.message}`, 'error');
        }
      }
    );
  };

  return (
    <div className="adm-product-section">
      {/* Toolbar */}
      <div className="adm-toolbar">
        <div className="adm-toolbar-left">
          <div className="adm-search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && <button className="adm-clear-btn" onClick={() => setSearchTerm('')}><i className="fas fa-times"></i></button>}
          </div>
          <select className="adm-filter-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="adm-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
        <button className="adm-btn adm-btn-primary" onClick={handleAddNew}>
          <i className="fas fa-plus"></i> Add Product
        </button>
      </div>

      {/* Product Count */}
      <div className="adm-result-count">
        Showing {filteredProducts.length} of {products.length} products
      </div>

      {/* Product Table */}
      <div className="adm-table-wrapper">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Code</th>
              <th>Category</th>
              <th>Subcategory</th>
              <th className="adm-text-right">List Price</th>
              <th>Unit</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr><td colSpan="8" className="adm-empty-row">
                <i className="fas fa-inbox"></i>
                <span>No products found. {searchTerm || categoryFilter !== 'all' ? 'Try adjusting filters.' : 'Click "Add Product" to get started.'}</span>
              </td></tr>
            ) : (
              filteredProducts.map(product => (
                <tr key={product.id} className={!product.isActive ? 'adm-row-inactive' : ''}>
                  <td className="adm-product-name">
                    <span className="adm-product-dot" style={{ background: getCategoryColor(product.categoryId) }}></span>
                    {product.name}
                  </td>
                  <td><code className="adm-code">{product.code}</code></td>
                  <td>
                    <span className="adm-cat-badge" style={{ background: getCategoryColor(product.categoryId) + '18', color: getCategoryColor(product.categoryId), border: `1px solid ${getCategoryColor(product.categoryId)}33` }}>
                      {getCategoryName(product.categoryId)}
                    </span>
                  </td>
                  <td>{product.subcategory || '—'}</td>
                  <td className="adm-text-right adm-price">{formatCurrency(product.listPrice)}</td>
                  <td>{product.unit}</td>
                  <td>
                    <button
                      className={`adm-status-toggle ${product.isActive ? 'active' : 'inactive'}`}
                      onClick={() => handleToggleStatus(product)}
                      title={product.isActive ? 'Click to deactivate' : 'Click to activate'}
                    >
                      <span className="adm-toggle-track">
                        <span className="adm-toggle-thumb"></span>
                      </span>
                      <span className="adm-toggle-label">{product.isActive ? 'Active' : 'Inactive'}</span>
                    </button>
                  </td>
                  <td>
                    <div className="adm-action-btns">
                      <button className="adm-icon-btn adm-icon-edit" onClick={() => handleEdit(product)} title="Edit">
                        <i className="fas fa-pen"></i>
                      </button>
                      <button className="adm-icon-btn adm-icon-delete" onClick={() => handleDelete(product)} title="Delete">
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Slide-over Form */}
      {showForm && (
        <div className="adm-panel-overlay" onClick={() => setShowForm(false)}>
          <div className="adm-panel" onClick={(e) => e.stopPropagation()}>
            <div className="adm-panel-header">
              <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button className="adm-panel-close" onClick={() => setShowForm(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="adm-panel-body">
              <div className="adm-form-group">
                <label>Product Name <span className="adm-required">*</span></label>
                <input type="text" value={formData.name} onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Slit Lamp SL-700" />
              </div>
              <div className="adm-form-group">
                <label>Product Code <span className="adm-required">*</span></label>
                <input type="text" value={formData.code} onChange={(e) => setFormData(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. EQ-DG-001" />
              </div>
              <div className="adm-form-row">
                <div className="adm-form-group">
                  <label>Category <span className="adm-required">*</span></label>
                  <select value={formData.categoryId} onChange={(e) => setFormData(f => ({ ...f, categoryId: e.target.value }))}>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="adm-form-group">
                  <label>Subcategory</label>
                  <input type="text" value={formData.subcategory} onChange={(e) => setFormData(f => ({ ...f, subcategory: e.target.value }))} placeholder="e.g. Diagnostic" />
                </div>
              </div>
              <div className="adm-form-row">
                <div className="adm-form-group">
                  <label>List Price (₹) <span className="adm-required">*</span></label>
                  <input type="number" min="0" step="0.01" value={formData.listPrice} onChange={(e) => setFormData(f => ({ ...f, listPrice: e.target.value }))} placeholder="0" />
                </div>
                <div className="adm-form-group">
                  <label>Unit</label>
                  <select value={formData.unit} onChange={(e) => setFormData(f => ({ ...f, unit: e.target.value }))}>
                    <option value="Units">Units</option>
                    <option value="₹">₹ (Revenue Only)</option>
                  </select>
                </div>
              </div>
              <div className="adm-form-group">
                <label>Status</label>
                <div className="adm-status-switch">
                  <label className="adm-switch">
                    <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData(f => ({ ...f, isActive: e.target.checked }))} />
                    <span className="adm-slider"></span>
                  </label>
                  <span className={`adm-switch-label ${formData.isActive ? 'active' : 'inactive'}`}>
                    {formData.isActive ? 'Active — visible in all screens' : 'Inactive — hidden from target screens'}
                  </span>
                </div>
              </div>
            </div>
            <div className="adm-panel-footer">
              <button className="adm-btn adm-btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="adm-btn adm-btn-primary" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <><span className="adm-spinner"></span> Saving...</> : <><i className="fas fa-save"></i> {editingProduct ? 'Update' : 'Create'} Product</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProductManager;
