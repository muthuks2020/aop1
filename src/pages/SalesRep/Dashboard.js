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

function SalesRepDashboard() {
  const { user } = useAuth();
  
  // State
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [allExpanded, setAllExpanded] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Toast state
  const [toasts, setToasts] = useState([]);
  
  // Modal state
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null
  });

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [cats, prods] = await Promise.all([
          ApiService.getCategories(),
          ApiService.getProducts()
        ]);
        setCategories(cats);
        setProducts(prods);
        
        // Expand first category by default
        if (cats.length > 0) {
          setExpandedCategories(new Set([cats[0].id]));
        }
      } catch (error) {
        showToast('Error', 'Failed to load data', 'error');
      }
    };
    
    loadData();
  }, []);

  // Online/Offline handlers
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsPanelOpen(false);
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveAllDrafts();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [products]);

  // Toast functions
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

  // Calculate stats
  const calculateTotals = useCallback(() => {
    let ly = 0, cy = 0;
    products.forEach(p => { ly += p.lyQty; cy += p.cyQty; });
    return { 
      count: products.length, 
      ly, 
      cy, 
      growth: Utils.calcGrowth(ly, cy) 
    };
  }, [products]);

  const getStatusCounts = useCallback(() => {
    const counts = { draft: 0, submitted: 0, approved: 0, rejected: 0 };
    products.forEach(p => { 
      if (counts[p.status] !== undefined) counts[p.status]++; 
    });
    return counts;
  }, [products]);

  // Category handlers
  const toggleCategory = useCallback((categoryId) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
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

  // Search handler
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    if (term) {
      const matchingCategories = new Set();
      products.forEach(p => {
        const matchesSearch = 
          p.name.toLowerCase().includes(term.toLowerCase()) ||
          p.code.toLowerCase().includes(term.toLowerCase()) ||
          (p.subcategory && p.subcategory.toLowerCase().includes(term.toLowerCase()));
        if (matchesSearch) {
          matchingCategories.add(p.categoryId);
        }
      });
      setExpandedCategories(matchingCategories);
    }
  }, [products]);

  // Product handlers
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

  const updateProductQty = useCallback((productId, value) => {
    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, cyQty: parseInt(value) || 0 } : p
    ));
  }, []);

  const handleSaveProductDraft = useCallback(async (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    try {
      await ApiService.saveProductDraft(productId, { cyQty: product.cyQty });
      showToast('Draft Saved', `${product.name} saved successfully`, 'success');
    } catch (error) {
      showToast('Error', 'Failed to save draft', 'error');
    }
  }, [products, showToast]);

  const handleSubmitProduct = useCallback((productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    setModalConfig({
      isOpen: true,
      title: 'Submit for Approval',
      message: `Are you sure you want to submit "${product.name}" for approval?`,
      type: 'warning',
      onConfirm: async () => {
        try {
          await ApiService.submitProduct(productId);
          setProducts(prev => prev.map(p => 
            p.id === productId 
              ? { ...p, status: 'submitted', submittedDate: new Date().toISOString() } 
              : p
          ));
          showToast('Submitted', `${product.name} submitted for approval`, 'success');
        } catch (error) {
          showToast('Error', 'Failed to submit product', 'error');
        }
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  }, [products, showToast]);

  const handleSaveAllDrafts = useCallback(async () => {
    const drafts = products.filter(p => p.status === 'draft' || p.status === 'rejected');
    if (drafts.length === 0) {
      showToast('Info', 'No drafts to save', 'info');
      return;
    }
    
    try {
      await ApiService.saveAllDrafts(drafts);
      showToast('Saved', `${drafts.length} drafts saved successfully`, 'success');
    } catch (error) {
      showToast('Error', 'Failed to save drafts', 'error');
    }
  }, [products, showToast]);

  const handleSubmitAllPending = useCallback(() => {
    const pending = products.filter(p => p.status === 'draft');
    if (pending.length === 0) {
      showToast('Info', 'No products to submit', 'info');
      return;
    }
    
    setModalConfig({
      isOpen: true,
      title: 'Submit All Pending',
      message: `Are you sure you want to submit ${pending.length} products for approval?`,
      type: 'warning',
      onConfirm: async () => {
        try {
          const productIds = pending.map(p => p.id);
          await ApiService.submitMultipleProducts(productIds);
          setProducts(prev => prev.map(p => 
            pending.find(pen => pen.id === p.id)
              ? { ...p, status: 'submitted', submittedDate: new Date().toISOString() }
              : p
          ));
          showToast('Submitted', `${pending.length} products submitted for approval`, 'success');
        } catch (error) {
          showToast('Error', 'Failed to submit products', 'error');
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
      showToast('Updated', 'Data refreshed successfully', 'success');
    } catch (error) {
      showToast('Error', 'Failed to refresh data', 'error');
    }
  }, [showToast]);

  const closeModal = useCallback(() => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  }, []);

  const totals = calculateTotals();
  const statusCounts = getStatusCounts();

  return (
    <div className="app">
      {/* Offline Banner */}
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
          lyUnits={totals.ly}
          cyUnits={totals.cy}
          overallGrowth={totals.growth}
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
          onSubmitProduct={handleSubmitProduct}
        />
      </main>

      <Footer 
        lyTotal={totals.ly}
        cyTotal={totals.cy}
        growth={totals.growth}
        pendingCount={statusCounts.draft}
        onSaveAllDrafts={handleSaveAllDrafts}
        onSubmitAllPending={handleSubmitAllPending}
      />

      <ProductPanel 
        isOpen={isPanelOpen}
        product={selectedProduct}
        categories={categories}
        onClose={closeProductPanel}
        onUpdateQty={updateProductQty}
        onSaveDraft={handleSaveProductDraft}
        onSubmit={handleSubmitProduct}
      />

      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast 
            key={toast.id}
            {...toast}
            onClose={() => closeToast(toast.id)}
          />
        ))}
      </div>

      {/* Modal */}
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
