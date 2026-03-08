/**
 * Sales Representative Dashboard
 * Main dashboard with three tabs:
 * 1. Overview & Summary
 * 2. Target Entry Grid (with Overall Target Bar — VALUE-based)
 * 3. Quarterly Summary - Unit Wise
 *
 * UPDATED FLOW:
 * - Sales Rep enters targets and submits to TBM
 * - TBM will either approve or correct and approve
 * - No more reject/re-enter cycle
 * - No status badges shown on products
 *
 * @author Appasamy Associates - Product Commitment PWA
 * @version 3.1.0 - TARGET VALUE now fetched from DB (totalLY from dashboard-summary API)
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

// ==================== REMOVED ====================
// OVERALL_YEARLY_TARGET_VALUE hardcoded constant removed.
// TARGET VALUE is now fetched from GET /salesrep/dashboard-summary → totalLY
// =================================================

function SalesRepDashboard() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [dashboardSummary, setDashboardSummary] = useState(null); // ← NEW: holds totalLY, totalCY from DB
  const [activeTab, setActiveTab] = useState('overview');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [toasts, setToasts] = useState([]);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cats, prods, summary] = await Promise.all([
          ApiService.getCategories(),
          ApiService.getProducts(),
          ApiService.getDashboardSummary(), // ← NEW: fetches totalLY from DB
        ]);
        setCategories(cats);
        setProducts(prods);
        setDashboardSummary(summary);       // ← NEW
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

  const toastCounter = React.useRef(0);
  const showToast = useCallback((title, message, type = 'success') => {
    const id = ++toastCounter.current;
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  const closeToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  const handleUpdateTarget = useCallback((productId, month, value) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const updatedMonthlyTargets = { ...p.monthlyTargets, [month]: { ...p.monthlyTargets?.[month], cyQty: value } };
        return { ...p, monthlyTargets: updatedMonthlyTargets };
      }
      return p;
    }));
  }, []);

  const handleSaveAll = useCallback(async () => {
    try {
      const result = await ApiService.saveAllDrafts(products);
      showToast('Saved', 'All targets saved successfully', 'success');
    } catch (error) {
      showToast('Error', 'Failed to save targets', 'error');
    }
  }, [products, showToast]);

  const handleSubmitAll = useCallback(() => {
    setModalConfig({
      isOpen: true,
      title: 'Submit to TBM',
      message: `Are you sure you want to submit all targets to your TBM for review?\nTBM will approve or make corrections as needed.`,
      type: 'warning',
      onConfirm: async () => {
        try {
          const productsToSave = products.map(p => ({
            id: p.id,
            monthlyTargets: p.monthlyTargets || {}
          }));
          const saveResult = await ApiService.saveAllDrafts(productsToSave);

          if (!saveResult || !saveResult.success || saveResult.savedCount === 0) {
            showToast('Warning', 'No products were saved. Please enter target values first.', 'warning');
            setModalConfig(prev => ({ ...prev, isOpen: false }));
            return;
          }

          const productIds = products.map(p => p.id);
          await ApiService.submitMultipleProducts(productIds);
          showToast('Submitted', 'All targets submitted to TBM for review', 'success');
        } catch (error) {
          showToast('Error', `Failed to submit: ${error.message || 'Unknown error'}`, 'error');
        }
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  }, [products, showToast]);

  const closeModal = useCallback(() => { setModalConfig(prev => ({ ...prev, isOpen: false })); }, []);

  const totalProducts = products.length;

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
            overallYearlyTargetValue={dashboardSummary?.lyRev ?? 0} // ← CHANGED: from hardcoded to DB value
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
      />

      <div className="main-tabs">
        <button className={`main-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          <i className="fas fa-chart-pie"></i> Overview & Summary
        </button>
        <button className={`main-tab ${activeTab === 'entry' ? 'active' : ''}`} onClick={() => setActiveTab('entry')}>
          <i className="fas fa-table"></i> Target Entry Grid
        </button>
        {/* HIDDEN - Quarterly Summary temporarily disabled
        <button className={`main-tab ${activeTab === 'quarterly' ? 'active' : ''}`} onClick={() => setActiveTab('quarterly')}>
          <i className="fas fa-chart-bar"></i> Quarterly Summary
        </button>
        */}
      </div>

      <main className="main excel-main">
        {renderTabContent()}
      </main>

      <div className="toast-container">
        {toasts.map(toast => <Toast key={toast.id} {...toast} onClose={() => closeToast(toast.id)} />)}
      </div>

      <Modal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onClose={closeModal}
        onConfirm={modalConfig.onConfirm}
      />
    </div>
  );
}

export default SalesRepDashboard;
