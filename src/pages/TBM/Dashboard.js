import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiService } from '../../services/api';
import { Utils } from '../../utils/helpers';
import Header from '../../components/common/Header';
import StatsRow from '../../components/common/StatsRow';
import Toolbar from '../../components/common/Toolbar';
import CategoryList from '../../components/common/CategoryList';
import Footer from '../../components/common/Footer';
import ProductPanel from '../../components/common/ProductPanel';
import Toast from '../../components/common/Toast';
import Modal from '../../components/common/Modal';

function TBMDashboard() {
  const { user } = useAuth();
  
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [allExpanded, setAllExpanded] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
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
        if (cats.length > 0) {
          setExpandedCategories(new Set([cats[0].id]));
        }
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
    let lyQty = 0, cyQty = 0, lyRev = 0, cyRev = 0;
    products.forEach(p => { 
      lyQty += p.lyQty || 0; 
      cyQty += p.cyQty || 0;
      lyRev += p.lyRev || 0;
      cyRev += p.cyRev || 0;
    });
    return { 
      count: products.length, 
      lyQty, cyQty, 
      qtyGrowth: Utils.calcGrowth(lyQty, cyQty),
      lyRev, cyRev,
      revGrowth: Utils.calcGrowth(lyRev, cyRev)
    };
  }, [products]);

  const getStatusCounts = useCallback(() => {
    const counts = { draft: 0, submitted: 0, approved: 0, rejected: 0 };
    products.forEach(p => { 
      if (counts[p.status] !== undefined) counts[p.status]++; 
    });
    return counts;
  }, [products]);

  const toggleCategory = useCallback((categoryId) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(categoryId) ? next.delete(categoryId) : next.add(categoryId);
      return next;
    });
  }, []);

  const toggleAllCategories = useCallback(() => {
    if (allExpanded) {
      setExpandedCategories(new Set());
      setAllExpanded(false);
    } else {
      setExpandedCategories(new Set(categories.map(c => c.id)));
      setAllExpanded(true);
    }
  }, [allExpanded, categories]);

  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    if (term) {
      const matchingCategories = new Set();
      products.forEach(p => {
        if (p.name.toLowerCase().includes(term.toLowerCase()) ||
            p.code.toLowerCase().includes(term.toLowerCase()) ||
            (p.subcategory && p.subcategory.toLowerCase().includes(term.toLowerCase()))) {
          matchingCategories.add(p.categoryId);
        }
      });
      setExpandedCategories(matchingCategories);
    }
  }, [products]);

  const openProductPanel = useCallback((productId) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      setIsPanelOpen(true);
    }
  }, [products]);

  const closeProductPanel = useCallback(() => {
    setIsPanelOpen(false);
    setSelectedProduct(null);
  }, []);

  const handleApproveProduct = useCallback((productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    setModalConfig({
      isOpen: true,
      title: 'Approve Target',
      message: `Approve targets for "${product.name}"?`,
      type: 'success',
      onConfirm: async () => {
        try {
          await ApiService.approveProduct(productId);
          setProducts(prev => prev.map(p => 
            p.id === productId 
              ? { ...p, status: 'approved', approvedDate: new Date().toISOString() } 
              : p
          ));
          showToast('Approved', `${product.name} approved`, 'success');
          closeProductPanel();
        } catch (error) {
          showToast('Error', 'Failed to approve', 'error');
        }
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  }, [products, showToast, closeProductPanel]);

  const handleRejectProduct = useCallback((productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    setModalConfig({
      isOpen: true,
      title: 'Reject Target',
      message: `Reject targets for "${product.name}"? Sales rep will need to revise.`,
      type: 'warning',
      onConfirm: async () => {
        try {
          await ApiService.rejectProduct(productId, 'Targets need revision');
          setProducts(prev => prev.map(p => 
            p.id === productId 
              ? { ...p, status: 'rejected', rejectedDate: new Date().toISOString() } 
              : p
          ));
          showToast('Rejected', `${product.name} sent back`, 'warning');
          closeProductPanel();
        } catch (error) {
          showToast('Error', 'Failed to reject', 'error');
        }
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  }, [products, showToast, closeProductPanel]);

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

  const totals = calculateTotals();
  const statusCounts = getStatusCounts();

  return (
    <div className="app">
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

      <main className="main">
        <StatsRow 
          totalProducts={totals.count}
          lyQty={totals.lyQty}
          cyQty={totals.cyQty}
          qtyGrowth={totals.qtyGrowth}
          lyRev={totals.lyRev}
          cyRev={totals.cyRev}
          revGrowth={totals.revGrowth}
        />

        <Toolbar 
          searchTerm={searchTerm}
          onSearchChange={handleSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          allExpanded={allExpanded}
          onToggleAll={toggleAllCategories}
        />

        <CategoryList 
          categories={categories}
          products={products}
          expandedCategories={expandedCategories}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          onToggleCategory={toggleCategory}
          onOpenProduct={openProductPanel}
          onSubmitProduct={handleApproveProduct}
        />
      </main>

      <Footer 
        lyQty={totals.lyQty}
        cyQty={totals.cyQty}
        qtyGrowth={totals.qtyGrowth}
        lyRev={totals.lyRev}
        cyRev={totals.cyRev}
        revGrowth={totals.revGrowth}
        pendingCount={statusCounts.submitted}
        onSaveAllDrafts={() => showToast('Info', 'No drafts to save', 'info')}
        onSubmitAllPending={() => {
          const pending = products.filter(p => p.status === 'submitted');
          if (pending.length === 0) {
            showToast('Info', 'No products pending approval', 'info');
            return;
          }
          setModalConfig({
            isOpen: true,
            title: 'Approve All Pending',
            message: `Approve all ${pending.length} pending products?`,
            type: 'success',
            onConfirm: async () => {
              setProducts(prev => prev.map(p => 
                p.status === 'submitted'
                  ? { ...p, status: 'approved', approvedDate: new Date().toISOString() }
                  : p
              ));
              showToast('Approved', `${pending.length} products approved`, 'success');
              setModalConfig(prev => ({ ...prev, isOpen: false }));
            }
          });
        }}
      />

      <ProductPanel 
        isOpen={isPanelOpen}
        product={selectedProduct}
        categories={categories}
        onClose={closeProductPanel}
        onUpdateMonthlyTarget={() => {}}
        onSaveDraft={() => {}}
        onSubmit={handleApproveProduct}
      />

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

export default TBMDashboard;
