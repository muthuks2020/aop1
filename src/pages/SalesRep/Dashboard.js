/**
 * Sales Representative Dashboard
 * Main dashboard with three tabs:
 * 1. Overview & Summary
 * 2. Target Entry Grid (with Overall Target Bar)
 * 3. Quarterly Summary - Unit Wise
 * 
 * @author Appasamy Associates - Product Commitment PWA
 * @version 2.4.0 - Added Overall Target support
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiService } from '../../services/api';
import { Utils } from '../../utils/helpers';
import Header from '../../components/common/Header';
import OverviewStats from '../../components/common/OverviewStats';
import TargetEntryGrid from '../../components/common/TargetEntryGrid';
import QuarterlySummary from '../../components/common/QuarterlySummary';
import Toast from '../../components/common/Toast';
import Modal from '../../components/common/Modal';

// ==================== OVERALL YEARLY TARGET ====================
// This is the fixed yearly target assigned to the sales rep.
// In production, this should come from the API (e.g., from TBM/ABM assignments).
// For now, it's set as a constant. Update this value or fetch from backend.
const OVERALL_YEARLY_TARGET_QTY = 15000; // Fixed yearly quantity target for this sales rep

function SalesRepDashboard() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [toasts, setToasts] = useState([]);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cats, prods] = await Promise.all([ApiService.getCategories(), ApiService.getProducts()]);
        setCategories(cats);
        setProducts(prods);
      } catch (error) {
        showToast('Error', 'Failed to load data', 'error');
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); showToast('Online', 'Connection restored', 'success'); };
    const handleOffline = () => { setIsOnline(false); showToast('Offline', 'You are now offline', 'warning'); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  const showToast = useCallback((title, message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  const closeToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  const getStatusCounts = useCallback(() => {
    const counts = { draft: 0, submitted: 0, approved: 0, rejected: 0 };
    products.forEach(p => { if (counts[p.status] !== undefined) counts[p.status]++; });
    return counts;
  }, [products]);

  const handleUpdateTarget = useCallback((productId, month, value) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const updatedMonthlyTargets = { ...p.monthlyTargets, [month]: { ...p.monthlyTargets?.[month], cyQty: value } };
        return { ...p, monthlyTargets: updatedMonthlyTargets, status: p.status === 'rejected' ? 'draft' : p.status };
      }
      return p;
    }));
  }, []);

  const handleSaveAll = useCallback(async () => {
    try {
      const result = await ApiService.saveAllDrafts(products);
      showToast('Saved', `${result.savedCount} drafts saved successfully`, 'success');
    } catch (error) {
      showToast('Error', 'Failed to save drafts', 'error');
    }
  }, [products, showToast]);

  const handleSubmitAll = useCallback(() => {
    const draftProducts = products.filter(p => p.status === 'draft' || p.status === 'rejected');
    if (draftProducts.length === 0) {
      showToast('Info', 'No drafts to submit', 'info');
      return;
    }

    setModalConfig({
      isOpen: true,
      title: 'Submit for Approval',
      message: `Are you sure you want to submit ${draftProducts.length} product(s) for TBM approval? You won't be able to edit them until they are reviewed.`,
      type: 'warning',
      onConfirm: async () => {
        try {
          const productIds = draftProducts.map(p => p.id);
          await ApiService.submitMultipleProducts(productIds);
          setProducts(prev => prev.map(p => 
            draftProducts.find(d => d.id === p.id) ? { ...p, status: 'submitted' } : p
          ));
          showToast('Submitted', `${draftProducts.length} products submitted for approval`, 'success');
        } catch (error) {
          showToast('Error', 'Failed to submit', 'error');
        }
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  }, [products, showToast]);

  const closeModal = useCallback(() => { setModalConfig(prev => ({ ...prev, isOpen: false })); }, []);

  const statusCounts = getStatusCounts();
  const totalProducts = products.length;
  const completionPercent = totalProducts > 0 ? Math.round(((statusCounts.approved + statusCounts.submitted) / totalProducts) * 100) : 0;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewStats products={products} categories={categories} />;
      case 'entry':
        return (
          <TargetEntryGrid
            categories={categories}
            products={products}
            onUpdateTarget={handleUpdateTarget}
            onSaveAll={handleSaveAll}
            onSubmitAll={handleSubmitAll}
            userRole="salesrep"
            fiscalYear="2025-26"
            overallYearlyTarget={OVERALL_YEARLY_TARGET_QTY}
          />
        );
      case 'quarterly':
        return (
          <QuarterlySummary
            products={products}
            categories={categories}
            fiscalYear="2025-26"
          />
        );
      default:
        return <OverviewStats products={products} categories={categories} />;
    }
  };

  return (
    <div className="dashboard">
      {!isOnline && <div className="offline-banner show"><i className="fas fa-wifi-slash"></i><span>You're offline. Changes will sync when connected.</span></div>}

      <Header 
        user={user} 
        completionPercent={completionPercent}
        submittedCount={statusCounts.submitted}
        totalCount={totalProducts}
        approvedCount={statusCounts.approved}
        pendingCount={statusCounts.draft + statusCounts.rejected}
      />

      <div className="main-tabs">
        <button className={`main-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          <i className="fas fa-chart-pie"></i> Overview & Summary
        </button>
        <button className={`main-tab ${activeTab === 'entry' ? 'active' : ''}`} onClick={() => setActiveTab('entry')}>
          <i className="fas fa-table"></i> Target Entry Grid
        </button>
        <button className={`main-tab ${activeTab === 'quarterly' ? 'active' : ''}`} onClick={() => setActiveTab('quarterly')}>
          <i className="fas fa-chart-bar"></i> Quarterly Summary
        </button>
      </div>
      <main className="main excel-main">
        {renderTabContent()}
      </main>
      <div className="toast-container">{toasts.map(toast => <Toast key={toast.id} {...toast} onClose={() => closeToast(toast.id)} />)}</div>
      <Modal isOpen={modalConfig.isOpen} title={modalConfig.title} message={modalConfig.message} type={modalConfig.type} onClose={closeModal} onConfirm={modalConfig.onConfirm} />
    </div>
  );
}

export default SalesRepDashboard;
