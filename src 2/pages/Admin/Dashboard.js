/**
 * Admin Dashboard Component
 * Independent admin panel for system configuration
 *
 * THREE tabs:
 * 1. Product Management — Add/edit products, set list price, toggle active/inactive
 * 2. Team Hierarchy — Assign heads and reportees across all levels
 * 3. Vacant Positions — Manage unfilled positions, fill when recruits join
 *
 * CSS Prefix: 'adm-' for Admin
 * Color Accent: #6366F1 (Indigo) — distinct from all other roles
 *
 * @author Appasamy Associates - Product Commitment PWA
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/common/Header';
import Toast from '../../components/common/Toast';
import Modal from '../../components/common/Modal';
import AdminProductManager from './components/AdminProductManager';
import AdminHierarchyManager from './components/AdminHierarchyManager';
import AdminVacantPositions from './components/AdminVacantPositions';
import { AdminApiService } from '../../services/adminApi';
import '../../styles/admin/adminDashboard.css';

function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('products');
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [hierarchy, setHierarchy] = useState([]);
  const [vacantPositions, setVacantPositions] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'warning', onConfirm: null });

  const showToast = useCallback((title, message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const showModal = useCallback((title, message, type, onConfirm) => {
    setModalConfig({ isOpen: true, title, message, type, onConfirm });
  }, []);

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [prods, cats, hier, vacants] = await Promise.all([
        AdminApiService.getProducts(),
        AdminApiService.getCategories(),
        AdminApiService.getHierarchy(),
        AdminApiService.getVacantPositions(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setHierarchy(hier);
      setVacantPositions(vacants);
    } catch (error) {
      console.error('Failed to load admin data:', error);
      showToast('Error', 'Failed to load data. Please try again.', 'error');
    }
    setIsLoading(false);
  }, [showToast]);

  useEffect(() => { loadAllData(); }, [loadAllData]);

  const refreshProducts = async () => {
    try {
      const prods = await AdminApiService.getProducts();
      setProducts(prods);
    } catch (e) { showToast('Error', 'Failed to refresh products.', 'error'); }
  };

  const refreshHierarchy = async () => {
    try {
      const [hier, vacants] = await Promise.all([
        AdminApiService.getHierarchy(),
        AdminApiService.getVacantPositions(),
      ]);
      setHierarchy(hier);
      setVacantPositions(vacants);
    } catch (e) { showToast('Error', 'Failed to refresh hierarchy.', 'error'); }
  };

  // Stats
  const activeProducts = products.filter(p => p.isActive).length;
  const inactiveProducts = products.filter(p => !p.isActive).length;
  const vacantCount = vacantPositions.length;

  return (
    <div className="adm-dashboard">
      <Header user={user} onRefresh={loadAllData} />

      {/* Admin Tabs */}
      <div className="adm-tabs">
        <button className={`adm-tab ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
          <i className="fas fa-boxes"></i> Product Management
          <span className="tab-badge products">{products.length}</span>
        </button>
        <button className={`adm-tab ${activeTab === 'hierarchy' ? 'active' : ''}`} onClick={() => setActiveTab('hierarchy')}>
          <i className="fas fa-sitemap"></i> Team Hierarchy
        </button>
        <button className={`adm-tab ${activeTab === 'vacant' ? 'active' : ''}`} onClick={() => setActiveTab('vacant')}>
          <i className="fas fa-user-plus"></i> Vacant Positions
          {vacantCount > 0 && <span className="tab-badge vacant">{vacantCount}</span>}
        </button>
      </div>

      {/* Summary Stats Bar */}
      <div className="adm-stats-bar">
        <div className="adm-stat-pill">
          <i className="fas fa-check-circle" style={{ color: '#10B981' }}></i>
          <span>{activeProducts} Active Products</span>
        </div>
        <div className="adm-stat-pill">
          <i className="fas fa-pause-circle" style={{ color: '#F59E0B' }}></i>
          <span>{inactiveProducts} Inactive</span>
        </div>
        <div className="adm-stat-pill">
          <i className="fas fa-user-clock" style={{ color: '#EF4444' }}></i>
          <span>{vacantCount} Vacant Positions</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="adm-main">
        {isLoading ? (
          <div className="adm-loading">
            <div className="loading-spinner"></div>
            <p>Loading admin panel...</p>
          </div>
        ) : (
          <>
            {activeTab === 'products' && (
              <AdminProductManager
                products={products}
                categories={categories}
                onRefresh={refreshProducts}
                showToast={showToast}
                showModal={showModal}
              />
            )}
            {activeTab === 'hierarchy' && (
              <AdminHierarchyManager
                hierarchy={hierarchy}
                onRefresh={refreshHierarchy}
                showToast={showToast}
                showModal={showModal}
              />
            )}
            {activeTab === 'vacant' && (
              <AdminVacantPositions
                vacantPositions={vacantPositions}
                onRefresh={refreshHierarchy}
                showToast={showToast}
                showModal={showModal}
              />
            )}
          </>
        )}
      </div>

      {/* Toast & Modal */}
      <div className="toast-container">
        {toasts.map(t => <Toast key={t.id} {...t} onClose={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />)}
      </div>
      <Modal {...modalConfig} onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))} />
    </div>
  );
}

export default AdminDashboard;
