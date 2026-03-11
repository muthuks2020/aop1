import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SpecialistApiService } from '../../services/specialistApi';
import { Utils } from '../../utils/helpers';
import Header from '../../components/common/Header';
import OverviewStats from '../../components/common/OverviewStats';
import TargetEntryGrid from '../../components/common/TargetEntryGrid';
import QuarterlySummary from '../../components/common/QuarterlySummary';
import Toast from '../../components/common/Toast';
import Modal from '../../components/common/Modal';
import '../../styles/specialist/specialistDashboard.css';

const OVERALL_YEARLY_TARGET_VALUE = 30000000;

function SpecialistDashboard() {
  const { user } = useAuth();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [toasts, setToasts] = useState([]);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false, title: '', message: '', type: 'info', onConfirm: null
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cats, prods] = await Promise.all([
          SpecialistApiService.getCategories(),
          SpecialistApiService.getProducts()
        ]);
        setCategories(cats);
        setProducts(prods);
      } catch (error) {
        showToast('Error', 'Failed to load data', 'error');
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Online', 'Connection restored', 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Offline', 'You are now offline', 'warning');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showToast = useCallback((title, message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  const closeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleUpdateTarget = useCallback((productId, month, value) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const updatedMonthlyTargets = {
          ...p.monthlyTargets,
          [month]: { ...p.monthlyTargets?.[month], cyQty: value }
        };
        return { ...p, monthlyTargets: updatedMonthlyTargets };
      }
      return p;
    }));
  }, []);

  const handleSaveAll = useCallback(async () => {
    try {
      await SpecialistApiService.saveAllDrafts(products);
      showToast('Saved', 'All targets saved successfully', 'success');
    } catch (error) {
      showToast('Error', 'Failed to save targets', 'error');
    }
  }, [products, showToast]);

  const handleSubmitAll = useCallback(() => {
    setModalConfig({
      isOpen: true,
      title: 'Submit to ABM',
      message: `Are you sure you want to submit all targets to your ABM for review?\nABM will approve or make corrections as needed.`,
      type: 'warning',
      onConfirm: async () => {
        try {
          const productIds = products.map(p => p.id);
          await SpecialistApiService.submitMultipleProducts(productIds);

          setProducts(prev => prev.map(p => ({ ...p, status: 'submitted' })));
          showToast('Submitted', 'All targets submitted to ABM for review', 'success');
        } catch (error) {
          showToast('Error', 'Failed to submit', 'error');
        }
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  }, [products, showToast]);

  const closeModal = useCallback(() => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  }, []);

  const totalProducts = products.length;
  const submittedCount = products.filter(p => p.status === 'submitted').length;
  const approvedCount = products.filter(p => p.status === 'approved').length;
  const pendingCount = products.filter(p => p.status === 'draft' || p.status === 'not_started').length;

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
            userRole="specialist"
            fiscalYear="2026-27"
            overallYearlyTargetValue={OVERALL_YEARLY_TARGET_VALUE}
          />
        );

      case 'quarterly':
        return (
          <QuarterlySummary
            products={products}
            categories={categories}
            fiscalYear="2026-27"
          />
        );

      default:
        return <OverviewStats products={products} categories={categories} />;
    }
  };

  return (
    <div className="specialist-dashboard dashboard">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="offline-banner show">
          <i className="fas fa-wifi-slash"></i>
          <span>You're offline. Changes will sync when connected.</span>
        </div>
      )}

      {/* Header */}
      <Header
        user={user}
        completionPercent={totalProducts > 0 ? Math.round(((submittedCount + approvedCount) / totalProducts) * 100) : 0}
        submittedCount={submittedCount}
        totalCount={totalProducts}
        approvedCount={approvedCount}
        pendingCount={pendingCount}
      />

      {/* Role Banner */}
      <div className="specialist-role-banner">
        <div className="specialist-role-info">
          <i className="fas fa-user-tie"></i>
          <span className="specialist-role-label">Specialist</span>
          <span className="specialist-separator">|</span>
          <span className="specialist-area">{user?.territory || 'Area'}</span>
          <span className="specialist-separator">|</span>
          <span className="specialist-reports-to">Reports to: ABM</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="main-tabs">
        <button
          className={`main-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <i className="fas fa-chart-pie"></i> Overview & Summary
        </button>
        <button
          className={`main-tab ${activeTab === 'entry' ? 'active' : ''}`}
          onClick={() => setActiveTab('entry')}
        >
          <i className="fas fa-table"></i> Target Entry Grid
        </button>
       {/*  <button
          className={`main-tab ${activeTab === 'quarterly' ? 'active' : ''}`}
          onClick={() => setActiveTab('quarterly')}
        >
          <i className="fas fa-calendar-alt"></i> Quarterly Summary
        </button> */}
      </div>

      {/* Main Content */}
      <main className="main excel-main">
        {renderTabContent()}
      </main>

      {/* Modal */}
      <Modal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onConfirm={modalConfig.onConfirm}
        onCancel={closeModal}
      />

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} onClose={() => closeToast(toast.id)} />
        ))}
      </div>
    </div>
  );
}

export default SpecialistDashboard;
