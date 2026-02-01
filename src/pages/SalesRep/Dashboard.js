import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiService } from '../../services/api';
import { Utils } from '../../utils/helpers';
import Header from '../../components/common/Header';
import OverviewStats from '../../components/common/OverviewStats';
import TargetEntryGrid from '../../components/common/TargetEntryGrid';
import Toast from '../../components/common/Toast';
import Modal from '../../components/common/Modal';

function SalesRepDashboard() {
  const { user } = useAuth();
  
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'entry'
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [toasts, setToasts] = useState([]);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cats, prods] = await Promise.all([
          ApiService.getCategories(),
          ApiService.getProducts()
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
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const closeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const calculateTotals = useCallback(() => {
    let lyQty = 0, cyQty = 0;
    products.forEach(p => {
      if (p.monthlyTargets) {
        Object.values(p.monthlyTargets).forEach(m => {
          lyQty += m.lyQty || 0;
          cyQty += m.cyQty || 0;
        });
      }
    });
    return { 
      count: products.length, 
      lyQty, cyQty, 
      qtyGrowth: Utils.calcGrowth(lyQty, cyQty)
    };
  }, [products]);

  const getStatusCounts = useCallback(() => {
    const counts = { draft: 0, submitted: 0, approved: 0, rejected: 0 };
    products.forEach(p => { 
      if (counts[p.status] !== undefined) counts[p.status]++; 
    });
    return counts;
  }, [products]);

  const handleUpdateTarget = useCallback((productId, month, value) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const updatedMonthlyTargets = {
          ...p.monthlyTargets,
          [month]: {
            ...p.monthlyTargets?.[month],
            cyQty: value
          }
        };
        const yearlyData = Utils.calculateYearlyTotals(updatedMonthlyTargets);
        return {
          ...p,
          monthlyTargets: updatedMonthlyTargets,
          cyQty: yearlyData.cyQty
        };
      }
      return p;
    }));
  }, []);

  const handleSaveAll = useCallback(async () => {
    try {
      await ApiService.saveAllDrafts(products);
      showToast('Saved', 'All targets saved as draft', 'success');
    } catch (error) {
      showToast('Error', 'Failed to save', 'error');
    }
  }, [products, showToast]);

  const handleSubmitAll = useCallback(() => {
    const draftProducts = products.filter(p => p.status === 'draft');
    if (draftProducts.length === 0) {
      showToast('Info', 'No draft targets to submit', 'info');
      return;
    }

    setModalConfig({
      isOpen: true,
      title: 'Submit for Approval',
      message: `Are you sure you want to submit ${draftProducts.length} product targets for approval? This will lock the values for manager review.`,
      type: 'warning',
      onConfirm: async () => {
        try {
          await ApiService.submitMultipleProducts(draftProducts.map(p => p.id));
          setProducts(prev => prev.map(p => 
            p.status === 'draft'
              ? { ...p, status: 'submitted', submittedDate: new Date().toISOString() }
              : p
          ));
          showToast('Submitted', `${draftProducts.length} products submitted for approval`, 'success');
        } catch (error) {
          showToast('Error', 'Failed to submit', 'error');
        }
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  }, [products, showToast]);

  const handleRefresh = useCallback(async () => {
    showToast('Refreshing', 'Updating data...', 'info');
    try {
      const [cats, prods] = await Promise.all([
        ApiService.getCategories(),
        ApiService.getProducts()
      ]);
      setCategories(cats);
      setProducts(prods);
      showToast('Updated', 'Data refreshed', 'success');
    } catch (error) {
      showToast('Error', 'Failed to refresh', 'error');
    }
  }, [showToast]);

  const closeModal = useCallback(() => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  }, []);

  const statusCounts = getStatusCounts();

  return (
    <div className="app excel-mode">
      {!isOnline && (
        <div className="offline-banner show">
          <i className="fas fa-wifi-slash"></i>
          <span>You're offline. Changes will sync when connected.</span>
        </div>
      )}

      <Header 
        user={user}
        onRefresh={handleRefresh}
        completionPercent={Math.round(((statusCounts.approved + statusCounts.submitted) / products.length) * 100) || 0}
        submittedCount={statusCounts.submitted}
        totalCount={products.length}
        approvedCount={statusCounts.approved}
        pendingCount={statusCounts.draft + statusCounts.rejected}
      />

      {/* Tab Navigation */}
      <div className="main-tabs">
        <button 
          className={`main-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <i className="fas fa-chart-pie"></i>
          Overview & Summary
        </button>
        <button 
          className={`main-tab ${activeTab === 'entry' ? 'active' : ''}`}
          onClick={() => setActiveTab('entry')}
        >
          <i className="fas fa-table"></i>
          Target Entry Grid
        </button>
      </div>

      <main className="main excel-main">
        {activeTab === 'overview' ? (
          <OverviewStats 
            products={products}
            categories={categories}
          />
        ) : (
          <TargetEntryGrid
            categories={categories}
            products={products}
            onUpdateTarget={handleUpdateTarget}
            onSaveAll={handleSaveAll}
            onSubmitAll={handleSubmitAll}
            userRole={user?.role}
          />
        )}
      </main>

      <div className="toast-container">
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} onClose={() => closeToast(toast.id)} />
        ))}
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
