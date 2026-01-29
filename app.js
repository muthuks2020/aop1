/**
 * Product Commitment System - Application JavaScript
 * Appasamy Associates
 * Updated with correct product categories
 */

// ============================================
// API SERVICE LAYER
// ============================================
const ApiService = {
    BASE_URL: '/api/v1',
    USE_MOCK: true,
    
    async getCategories() {
        if (this.USE_MOCK) return MockData.categories;
        const response = await fetch(`${this.BASE_URL}/categories`);
        if (!response.ok) throw new Error('Failed to fetch categories');
        return response.json();
    },
    
    async getProducts(categoryId = null) {
        if (this.USE_MOCK) {
            return categoryId 
                ? MockData.products.filter(p => p.categoryId === categoryId)
                : MockData.products;
        }
        const url = categoryId 
            ? `${this.BASE_URL}/products?category=${categoryId}`
            : `${this.BASE_URL}/products`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch products');
        return response.json();
    },
    
    async saveProductDraft(productId, data) {
        if (this.USE_MOCK) {
            console.log('Saving draft:', productId, data);
            return { success: true };
        }
        const response = await fetch(`${this.BASE_URL}/products/${productId}/draft`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to save draft');
        return response.json();
    },
    
    async submitProduct(productId) {
        if (this.USE_MOCK) {
            console.log('Submitting product:', productId);
            await new Promise(resolve => setTimeout(resolve, 500));
            return { success: true, status: 'submitted' };
        }
        const response = await fetch(`${this.BASE_URL}/products/${productId}/submit`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('Failed to submit product');
        return response.json();
    },
    
    async submitMultipleProducts(productIds) {
        if (this.USE_MOCK) {
            console.log('Submitting products:', productIds);
            await new Promise(resolve => setTimeout(resolve, 800));
            return { success: true, count: productIds.length };
        }
        const response = await fetch(`${this.BASE_URL}/products/submit-batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productIds })
        });
        if (!response.ok) throw new Error('Failed to submit products');
        return response.json();
    },
    
    async saveAllDrafts(products) {
        if (this.USE_MOCK) {
            console.log('Saving all drafts:', products.length);
            await new Promise(resolve => setTimeout(resolve, 600));
            return { success: true };
        }
        const response = await fetch(`${this.BASE_URL}/products/save-all`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ products })
        });
        if (!response.ok) throw new Error('Failed to save drafts');
        return response.json();
    }
};

// ============================================
// MOCK DATA - UPDATED CATEGORIES & PRODUCTS
// ============================================
const MockData = {
    categories: [
        { 
            id: 'equipment', 
            name: 'Equipment', 
            icon: 'fa-microscope', 
            color: 'equipment',
            subcategories: ['Diagnostic & Laser', 'Surgical Products', 'OPD', 'Tables, Stand & Accessories', 'Vision Testing Equipment', 'Accessories', 'New Product-EQ']
        },
        { 
            id: 'iol', 
            name: 'IOL', 
            icon: 'fa-eye', 
            color: 'iol',
            subcategories: ['Hydrophilic', 'Hydrophobic', 'PMMA', 'New Product-IOL']
        },
        { 
            id: 'ovd', 
            name: 'OVD', 
            icon: 'fa-tint', 
            color: 'ovd',
            subcategories: ['Viscoelastic', 'Dispersive', 'Cohesive']
        },
        { 
            id: 'mis', 
            name: 'MIS', 
            icon: 'fa-syringe', 
            color: 'mis',
            subcategories: ['Surgical Instruments', 'Consumables']
        },
        { 
            id: 'others', 
            name: 'Others Products', 
            icon: 'fa-boxes-stacked', 
            color: 'others',
            subcategories: ['Accessories', 'New Products']
        }
    ],
    products: [
        // EQUIPMENT - Diagnostic & Laser
        { id: 1, categoryId: 'equipment', subcategory: 'Diagnostic & Laser', name: 'Slit Lamp SL-700', code: 'EQ-DL-001', lyQty: 8, cyQty: 10, status: 'approved', approvedDate: '2025-01-15' },
        { id: 2, categoryId: 'equipment', subcategory: 'Diagnostic & Laser', name: 'Auto Refractometer AR-600', code: 'EQ-DL-002', lyQty: 6, cyQty: 8, status: 'approved', approvedDate: '2025-01-15' },
        { id: 3, categoryId: 'equipment', subcategory: 'Diagnostic & Laser', name: 'Fundus Camera FC-300', code: 'EQ-DL-003', lyQty: 3, cyQty: 4, status: 'submitted', submittedDate: '2025-01-20' },
        { id: 4, categoryId: 'equipment', subcategory: 'Diagnostic & Laser', name: 'YAG Laser System', code: 'EQ-DL-004', lyQty: 2, cyQty: 3, status: 'draft' },
        
        // EQUIPMENT - Surgical Products
        { id: 5, categoryId: 'equipment', subcategory: 'Surgical Products', name: 'Phaco Machine Centurion', code: 'EQ-SP-001', lyQty: 4, cyQty: 6, status: 'approved', approvedDate: '2025-01-10' },
        { id: 6, categoryId: 'equipment', subcategory: 'Surgical Products', name: 'Operating Microscope', code: 'EQ-SP-002', lyQty: 5, cyQty: 6, status: 'submitted', submittedDate: '2025-01-18' },
        { id: 7, categoryId: 'equipment', subcategory: 'Surgical Products', name: 'Vitrectomy System', code: 'EQ-SP-003', lyQty: 2, cyQty: 3, status: 'draft' },
        
        // EQUIPMENT - OPD
        { id: 8, categoryId: 'equipment', subcategory: 'OPD', name: 'Tonometer Applanation', code: 'EQ-OPD-001', lyQty: 12, cyQty: 15, status: 'approved', approvedDate: '2025-01-12' },
        { id: 9, categoryId: 'equipment', subcategory: 'OPD', name: 'Lensometer Digital', code: 'EQ-OPD-002', lyQty: 8, cyQty: 10, status: 'draft' },
        { id: 10, categoryId: 'equipment', subcategory: 'OPD', name: 'Keratometer Manual', code: 'EQ-OPD-003', lyQty: 6, cyQty: 7, status: 'submitted', submittedDate: '2025-01-22' },
        
        // EQUIPMENT - Tables, Stand & Accessories
        { id: 11, categoryId: 'equipment', subcategory: 'Tables, Stand & Accessories', name: 'Instrument Table SS', code: 'EQ-TA-001', lyQty: 20, cyQty: 25, status: 'approved', approvedDate: '2025-01-14' },
        { id: 12, categoryId: 'equipment', subcategory: 'Tables, Stand & Accessories', name: 'Mayo Stand Trolley', code: 'EQ-TA-002', lyQty: 15, cyQty: 18, status: 'draft' },
        
        // EQUIPMENT - Vision Testing Equipment
        { id: 13, categoryId: 'equipment', subcategory: 'Vision Testing Equipment', name: 'Vision Chart Projector', code: 'EQ-VT-001', lyQty: 10, cyQty: 12, status: 'approved', approvedDate: '2025-01-11' },
        { id: 14, categoryId: 'equipment', subcategory: 'Vision Testing Equipment', name: 'Trial Lens Set', code: 'EQ-VT-002', lyQty: 8, cyQty: 10, status: 'submitted', submittedDate: '2025-01-19' },
        
        // EQUIPMENT - Accessories
        { id: 15, categoryId: 'equipment', subcategory: 'Accessories', name: 'Chin Rest Assembly', code: 'EQ-AC-001', lyQty: 25, cyQty: 30, status: 'draft' },
        { id: 16, categoryId: 'equipment', subcategory: 'Accessories', name: 'Headrest Cushion', code: 'EQ-AC-002', lyQty: 40, cyQty: 50, status: 'approved', approvedDate: '2025-01-13' },
        
        // EQUIPMENT - New Products
        { id: 17, categoryId: 'equipment', subcategory: 'New Product-EQ', name: 'OCT Scanner Advanced', code: 'EQ-NP-001', lyQty: 0, cyQty: 3, status: 'draft' },
        
        // IOL - Hydrophilic
        { id: 18, categoryId: 'iol', subcategory: 'Hydrophilic', name: 'APPAFLEX Monofocal', code: 'IOL-HP-001', lyQty: 450, cyQty: 520, status: 'approved', approvedDate: '2025-01-15' },
        { id: 19, categoryId: 'iol', subcategory: 'Hydrophilic', name: 'APPAFLEX Toric', code: 'IOL-HP-002', lyQty: 180, cyQty: 210, status: 'approved', approvedDate: '2025-01-15' },
        { id: 20, categoryId: 'iol', subcategory: 'Hydrophilic', name: 'APPAFLEX Multifocal', code: 'IOL-HP-003', lyQty: 120, cyQty: 145, status: 'submitted', submittedDate: '2025-01-20' },
        { id: 21, categoryId: 'iol', subcategory: 'Hydrophilic', name: 'APPAFLEX Aspheric', code: 'IOL-HP-004', lyQty: 280, cyQty: 320, status: 'draft' },
        
        // IOL - Hydrophobic
        { id: 22, categoryId: 'iol', subcategory: 'Hydrophobic', name: 'APPASSUREFOLD Single', code: 'IOL-HB-001', lyQty: 380, cyQty: 440, status: 'approved', approvedDate: '2025-01-16' },
        { id: 23, categoryId: 'iol', subcategory: 'Hydrophobic', name: 'APPASSUREFOLD Toric', code: 'IOL-HB-002', lyQty: 150, cyQty: 175, status: 'submitted', submittedDate: '2025-01-21' },
        { id: 24, categoryId: 'iol', subcategory: 'Hydrophobic', name: 'APPASSUREFOLD Multifocal', code: 'IOL-HB-003', lyQty: 95, cyQty: 115, status: 'draft' },
        { id: 25, categoryId: 'iol', subcategory: 'Hydrophobic', name: 'APPASSUREFOLD EDOF', code: 'IOL-HB-004', lyQty: 65, cyQty: 80, status: 'rejected', rejectedDate: '2025-01-18', rejectionReason: 'Growth target too conservative. Increase by 10% minimum.' },
        
        // IOL - PMMA
        { id: 26, categoryId: 'iol', subcategory: 'PMMA', name: 'APPAPMMA Standard', code: 'IOL-PM-001', lyQty: 850, cyQty: 920, status: 'approved', approvedDate: '2025-01-14' },
        { id: 27, categoryId: 'iol', subcategory: 'PMMA', name: 'APPAPMMA AC IOL', code: 'IOL-PM-002', lyQty: 120, cyQty: 140, status: 'draft' },
        
        // IOL - New Products
        { id: 28, categoryId: 'iol', subcategory: 'New Product-IOL', name: 'APPAVISION Trifocal', code: 'IOL-NP-001', lyQty: 0, cyQty: 50, status: 'draft' },
        { id: 29, categoryId: 'iol', subcategory: 'New Product-IOL', name: 'APPAVISION Light Adj', code: 'IOL-NP-002', lyQty: 0, cyQty: 25, status: 'draft' },
        
        // OVD
        { id: 30, categoryId: 'ovd', subcategory: 'Viscoelastic', name: 'APPAVISCO Standard', code: 'OVD-VS-001', lyQty: 1200, cyQty: 1400, status: 'approved', approvedDate: '2025-01-12' },
        { id: 31, categoryId: 'ovd', subcategory: 'Viscoelastic', name: 'APPAVISCO Premium', code: 'OVD-VS-002', lyQty: 600, cyQty: 720, status: 'submitted', submittedDate: '2025-01-22' },
        { id: 32, categoryId: 'ovd', subcategory: 'Dispersive', name: 'APPADISPER Chondroitin', code: 'OVD-DP-001', lyQty: 450, cyQty: 530, status: 'draft' },
        { id: 33, categoryId: 'ovd', subcategory: 'Cohesive', name: 'APPACOHES Sodium HA', code: 'OVD-CH-001', lyQty: 380, cyQty: 450, status: 'approved', approvedDate: '2025-01-13' },
        
        // MIS
        { id: 34, categoryId: 'mis', subcategory: 'Surgical Instruments', name: 'Forceps Set Micro', code: 'MIS-SI-001', lyQty: 150, cyQty: 180, status: 'approved', approvedDate: '2025-01-11' },
        { id: 35, categoryId: 'mis', subcategory: 'Surgical Instruments', name: 'Scissors Curved', code: 'MIS-SI-002', lyQty: 200, cyQty: 240, status: 'submitted', submittedDate: '2025-01-20' },
        { id: 36, categoryId: 'mis', subcategory: 'Surgical Instruments', name: 'Speculum Wire', code: 'MIS-SI-003', lyQty: 180, cyQty: 210, status: 'draft' },
        { id: 37, categoryId: 'mis', subcategory: 'Consumables', name: 'Surgical Blades 15°', code: 'MIS-CO-001', lyQty: 2500, cyQty: 2900, status: 'approved', approvedDate: '2025-01-14' },
        { id: 38, categoryId: 'mis', subcategory: 'Consumables', name: 'Sutures Nylon 10-0', code: 'MIS-CO-002', lyQty: 1800, cyQty: 2100, status: 'draft' },
        { id: 39, categoryId: 'mis', subcategory: 'Consumables', name: 'Cannulas Irrigation', code: 'MIS-CO-003', lyQty: 1500, cyQty: 1750, status: 'submitted', submittedDate: '2025-01-23' },
        
        // OTHERS
        { id: 40, categoryId: 'others', subcategory: 'Accessories', name: 'Eye Shield Plastic', code: 'OTH-AC-001', lyQty: 3000, cyQty: 3500, status: 'approved', approvedDate: '2025-01-10' },
        { id: 41, categoryId: 'others', subcategory: 'Accessories', name: 'Tape Patches Sterile', code: 'OTH-AC-002', lyQty: 2000, cyQty: 2400, status: 'draft' },
        { id: 42, categoryId: 'others', subcategory: 'New Products', name: 'Smart Eye Drops Dispenser', code: 'OTH-NP-001', lyQty: 0, cyQty: 100, status: 'draft' }
    ]
};

// ============================================
// APPLICATION STATE
// ============================================
const AppState = {
    categories: [],
    products: [],
    expandedCategories: new Set(),
    searchTerm: '',
    statusFilter: 'all',
    allExpanded: false,
    selectedProduct: null,
    modalCallback: null
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
const Utils = {
    calcGrowth(ly, cy) {
        if (ly === 0) return cy > 0 ? 100 : 0;
        return ((cy - ly) / ly * 100);
    },
    
    formatGrowth(value) {
        const formatted = value.toFixed(1);
        return (value >= 0 ? '+' : '') + formatted + '%';
    },
    
    formatNumber(n) {
        return n.toLocaleString('en-IN');
    },
    
    getStatusIcon(status) {
        const icons = { draft: 'fa-edit', submitted: 'fa-clock', approved: 'fa-check-circle', rejected: 'fa-times-circle' };
        return icons[status] || 'fa-circle';
    },
    
    getStatusLabel(status) {
        const labels = { draft: 'Draft', submitted: 'Pending', approved: 'Approved', rejected: 'Rejected' };
        return labels[status] || status;
    },
    
    formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }
};

// ============================================
// UI RENDERING
// ============================================
const UI = {
    renderStats() {
        const totals = this.calculateTotals();
        
        document.getElementById('totalProducts').textContent = totals.count;
        document.getElementById('lyUnits').textContent = Utils.formatNumber(totals.ly);
        document.getElementById('cyUnits').textContent = Utils.formatNumber(totals.cy);
        
        const growthEl = document.getElementById('overallGrowth');
        growthEl.textContent = Utils.formatGrowth(totals.growth);
        growthEl.classList.toggle('negative', totals.growth < 0);
        
        document.getElementById('footerLy').textContent = Utils.formatNumber(totals.ly);
        document.getElementById('footerCy').textContent = Utils.formatNumber(totals.cy);
        document.getElementById('footerGrowth').textContent = Utils.formatGrowth(totals.growth);
        
        const statusCounts = this.getStatusCounts();
        const total = AppState.products.length;
        const completed = statusCounts.approved + statusCounts.submitted;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        document.getElementById('completionPercent').textContent = percent + '%';
        document.getElementById('submittedCount').textContent = `${statusCounts.submitted}/${total}`;
        document.getElementById('approvedCount').textContent = statusCounts.approved;
        document.getElementById('pendingCount').textContent = statusCounts.draft + statusCounts.rejected;
        document.getElementById('progressFill').style.width = percent + '%';
        
        const pendingBadge = document.getElementById('pendingBadge');
        const pendingCount = statusCounts.draft;
        pendingBadge.textContent = pendingCount;
        pendingBadge.style.display = pendingCount > 0 ? 'flex' : 'none';
    },
    
    calculateTotals() {
        let ly = 0, cy = 0;
        AppState.products.forEach(p => { ly += p.lyQty; cy += p.cyQty; });
        return { count: AppState.products.length, ly, cy, growth: Utils.calcGrowth(ly, cy) };
    },
    
    getStatusCounts() {
        const counts = { draft: 0, submitted: 0, approved: 0, rejected: 0 };
        AppState.products.forEach(p => { if (counts[p.status] !== undefined) counts[p.status]++; });
        return counts;
    },
    
    renderCategories() {
        const container = document.getElementById('categoryList');
        const search = AppState.searchTerm.toLowerCase();
        const statusFilter = AppState.statusFilter;
        
        let html = '';
        
        AppState.categories.forEach(cat => {
            const products = AppState.products.filter(p => {
                const matchCat = p.categoryId === cat.id;
                const matchSearch = !search || p.name.toLowerCase().includes(search) || p.code.toLowerCase().includes(search) || (p.subcategory && p.subcategory.toLowerCase().includes(search));
                const matchStatus = statusFilter === 'all' || p.status === statusFilter;
                return matchCat && matchSearch && matchStatus;
            });
            
            if (products.length === 0) return;
            
            const totals = this.calculateCategoryTotals(cat.id);
            const isExpanded = AppState.expandedCategories.has(cat.id);
            const pendingCount = products.filter(p => p.status === 'draft' || p.status === 'rejected').length;
            
            // Group products by subcategory
            const subcategoryGroups = {};
            products.forEach(p => {
                const subcat = p.subcategory || 'General';
                if (!subcategoryGroups[subcat]) subcategoryGroups[subcat] = [];
                subcategoryGroups[subcat].push(p);
            });
            
            html += `
                <div class="category-card ${isExpanded ? 'expanded' : ''}" data-category="${cat.id}">
                    <div class="category-header" onclick="toggleCategory('${cat.id}')">
                        <div class="cat-icon-wrapper">
                            <div class="cat-icon ${cat.color}"><i class="fas ${cat.icon}"></i></div>
                            ${pendingCount > 0 ? `<span class="cat-count">${pendingCount}</span>` : ''}
                        </div>
                        <div class="cat-info">
                            <div class="cat-name">${cat.name}</div>
                            <div class="cat-meta">
                                <span><i class="fas fa-box"></i> ${products.length} Products</span>
                                <span><i class="fas fa-check-circle"></i> ${products.filter(p => p.status === 'approved').length} Approved</span>
                                <span><i class="fas fa-layer-group"></i> ${Object.keys(subcategoryGroups).length} Groups</span>
                            </div>
                        </div>
                        <div class="cat-stats">
                            <div class="cat-stat"><span class="cat-stat-label">LY Qty</span><span class="cat-stat-value">${Utils.formatNumber(totals.ly)}</span></div>
                            <div class="cat-stat"><span class="cat-stat-label">CY Qty</span><span class="cat-stat-value">${Utils.formatNumber(totals.cy)}</span></div>
                        </div>
                        <div class="cat-growth ${totals.growth >= 0 ? 'positive' : 'negative'}">${Utils.formatGrowth(totals.growth)}</div>
                        <div class="cat-chevron"><i class="fas fa-chevron-down"></i></div>
                    </div>
                    <div class="cat-content">
                        <div class="products-container">
                            ${Object.entries(subcategoryGroups).map(([subcat, prods]) => `
                                <div class="subcategory-section">
                                    <div class="subcategory-header">
                                        <span class="subcategory-name"><i class="fas fa-folder"></i> ${subcat}</span>
                                        <span class="subcategory-count">${prods.length} items</span>
                                    </div>
                                    <div class="product-grid">${prods.map(p => this.renderProductCard(p)).join('')}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>`;
        });
        
        if (!html) {
            html = `<div class="empty-state"><div class="empty-state-icon"><i class="fas fa-search"></i></div><h3>No products found</h3><p>Try adjusting your search or filter criteria</p></div>`;
        }
        
        container.innerHTML = html;
    },
    
    calculateCategoryTotals(categoryId) {
        const products = AppState.products.filter(p => p.categoryId === categoryId);
        let ly = 0, cy = 0;
        products.forEach(p => { ly += p.lyQty; cy += p.cyQty; });
        return { ly, cy, growth: Utils.calcGrowth(ly, cy) };
    },
    
    renderProductCard(product) {
        const growth = Utils.calcGrowth(product.lyQty, product.cyQty);
        const canSubmit = product.status === 'draft' || product.status === 'rejected';
        const canEdit = product.status !== 'approved';
        const isNew = product.lyQty === 0;
        
        return `
            <div class="product-card ${product.status}" data-product-id="${product.id}">
                <div class="product-header">
                    <div class="product-info">
                        <div class="product-name">${product.name} ${isNew ? '<span class="new-badge">NEW</span>' : ''}</div>
                        <div class="product-code">${product.code}</div>
                    </div>
                    <div class="product-status ${product.status}">
                        <i class="fas ${Utils.getStatusIcon(product.status)}"></i>
                        <span>${Utils.getStatusLabel(product.status)}</span>
                    </div>
                </div>
                <div class="product-data">
                    <div class="data-cell"><span class="data-label">LY Qty</span><span class="data-value">${isNew ? '-' : Utils.formatNumber(product.lyQty)}</span></div>
                    <div class="data-cell highlight"><span class="data-label">CY Qty</span><span class="data-value editable">${Utils.formatNumber(product.cyQty)}</span></div>
                    <div class="data-cell"><span class="data-label">Growth</span><span class="data-value growth ${growth >= 0 ? 'positive' : 'negative'}">${isNew ? 'NEW' : Utils.formatGrowth(growth)}</span></div>
                    <div class="data-cell"><span class="data-label">Variance</span><span class="data-value">${isNew ? '+' + Utils.formatNumber(product.cyQty) : (product.cyQty - product.lyQty >= 0 ? '+' : '') + Utils.formatNumber(product.cyQty - product.lyQty)}</span></div>
                    <div class="data-cell"><span class="data-label">Target %</span><span class="data-value">${isNew ? '-' : ((product.cyQty / product.lyQty) * 100).toFixed(0) + '%'}</span></div>
                </div>
                <div class="product-actions">
                    <button class="product-btn edit" onclick="openProductPanel(${product.id})" ${!canEdit ? 'disabled' : ''}>
                        <i class="fas fa-${canEdit ? 'edit' : 'eye'}"></i><span>${canEdit ? 'Edit' : 'View'}</span>
                    </button>
                    ${canSubmit ? `<button class="product-btn submit" onclick="submitProduct(${product.id})"><i class="fas fa-paper-plane"></i><span>Submit</span></button>` : 
                    `<button class="product-btn view" onclick="openProductPanel(${product.id})"><i class="fas fa-info-circle"></i><span>Details</span></button>`}
                </div>
            </div>`;
    },
    
    showToast(title, message, type = 'success') {
        const container = document.getElementById('toastContainer');
        const id = 'toast-' + Date.now();
        const icons = { success: 'fa-check-circle', warning: 'fa-exclamation-triangle', error: 'fa-times-circle', info: 'fa-info-circle' };
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.id = id;
        toast.innerHTML = `
            <i class="toast-icon fas ${icons[type]}"></i>
            <div class="toast-content"><div class="toast-title">${title}</div><div class="toast-message">${message}</div></div>
            <button class="toast-close" onclick="closeToast('${id}')"><i class="fas fa-times"></i></button>`;
        
        container.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => closeToast(id), 5000);
    }
};

// ============================================
// EVENT HANDLERS
// ============================================
function toggleCategory(categoryId) {
    AppState.expandedCategories.has(categoryId) ? AppState.expandedCategories.delete(categoryId) : AppState.expandedCategories.add(categoryId);
    UI.renderCategories();
}

function toggleAllCategories() {
    const btn = document.getElementById('expandAllBtn');
    if (AppState.allExpanded) {
        AppState.expandedCategories.clear();
        AppState.allExpanded = false;
        btn.innerHTML = '<i class="fas fa-expand-alt"></i><span>Expand All</span>';
    } else {
        AppState.categories.forEach(c => AppState.expandedCategories.add(c.id));
        AppState.allExpanded = true;
        btn.innerHTML = '<i class="fas fa-compress-alt"></i><span>Collapse All</span>';
    }
    UI.renderCategories();
}

function openProductPanel(productId) {
    const product = AppState.products.find(p => p.id === productId);
    if (!product) return;
    
    AppState.selectedProduct = product;
    document.getElementById('panelProductName').textContent = product.name;
    document.getElementById('panelProductCode').textContent = product.code;
    
    const canEdit = product.status !== 'approved';
    const growth = Utils.calcGrowth(product.lyQty, product.cyQty);
    const isNew = product.lyQty === 0;
    
    document.getElementById('panelBody').innerHTML = `
        <div class="panel-section">
            <h4 class="panel-section-title">Product Information</h4>
            <div class="panel-field"><label>Category</label><div class="panel-value">${AppState.categories.find(c => c.id === product.categoryId)?.name || '-'}</div></div>
            <div class="panel-field"><label>Subcategory</label><div class="panel-value">${product.subcategory || '-'}</div></div>
            <div class="panel-field"><label>Product Code</label><div class="panel-value">${product.code}</div></div>
        </div>
        <div class="panel-section">
            <h4 class="panel-section-title">Commitment Details</h4>
            <div class="panel-field"><label>Last Year Quantity</label><div class="panel-value">${isNew ? 'New Product' : Utils.formatNumber(product.lyQty)}</div></div>
            <div class="panel-field"><label>Current Year Quantity</label>
                ${canEdit ? `<input type="number" class="panel-input" id="panelCyQty" value="${product.cyQty}" min="0" onchange="updateProductQty(${product.id}, this.value)">` : 
                `<div class="panel-value">${Utils.formatNumber(product.cyQty)}</div>`}
            </div>
            <div class="panel-field"><label>Growth</label><div class="panel-value growth ${growth >= 0 ? 'positive' : 'negative'}">${isNew ? 'New Product' : Utils.formatGrowth(growth)}</div></div>
            <div class="panel-field"><label>Variance</label><div class="panel-value">${(product.cyQty - product.lyQty >= 0 ? '+' : '') + Utils.formatNumber(product.cyQty - product.lyQty)} units</div></div>
        </div>
        <div class="panel-section">
            <h4 class="panel-section-title">Status Information</h4>
            <div class="panel-field"><label>Current Status</label><div class="product-status ${product.status}"><i class="fas ${Utils.getStatusIcon(product.status)}"></i><span>${Utils.getStatusLabel(product.status)}</span></div></div>
            ${product.approvedDate ? `<div class="panel-field"><label>Approved Date</label><div class="panel-value">${Utils.formatDate(product.approvedDate)}</div></div>` : ''}
            ${product.submittedDate ? `<div class="panel-field"><label>Submitted Date</label><div class="panel-value">${Utils.formatDate(product.submittedDate)}</div></div>` : ''}
            ${product.rejectedDate ? `<div class="panel-field"><label>Rejected Date</label><div class="panel-value">${Utils.formatDate(product.rejectedDate)}</div></div><div class="panel-field"><label>Rejection Reason</label><div class="panel-value rejection-reason">${product.rejectionReason}</div></div>` : ''}
        </div>
        <div class="panel-actions">
            ${canEdit ? `<button class="btn btn-secondary" onclick="saveProductDraft(${product.id})"><i class="fas fa-save"></i> Save Draft</button><button class="btn btn-primary" onclick="submitProduct(${product.id}); closeProductPanel();"><i class="fas fa-paper-plane"></i> Submit</button>` : 
            `<button class="btn btn-secondary" onclick="closeProductPanel()"><i class="fas fa-times"></i> Close</button>`}
        </div>`;
    
    if (!document.getElementById('panelStyles')) {
        const style = document.createElement('style');
        style.id = 'panelStyles';
        style.textContent = `.panel-section{margin-bottom:1.5rem}.panel-section-title{font-size:.875rem;font-weight:600;color:var(--gray-600);margin-bottom:1rem;text-transform:uppercase;letter-spacing:.05em}.panel-field{margin-bottom:1rem}.panel-field label{display:block;font-size:.75rem;color:var(--gray-500);margin-bottom:.375rem}.panel-value{font-size:1rem;font-weight:600;color:var(--gray-800)}.panel-value.growth.positive{color:var(--success)}.panel-value.growth.negative{color:var(--danger)}.panel-value.rejection-reason{font-weight:400;color:var(--danger);font-size:.875rem;padding:.75rem;background:var(--danger-light);border-radius:var(--radius-sm)}.panel-input{width:100%;padding:.75rem;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:1rem;font-family:var(--font-mono)}.panel-input:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-glow)}.panel-actions{display:flex;gap:.75rem;margin-top:2rem;padding-top:1.5rem;border-top:1px solid var(--border)}.panel-actions .btn{flex:1}`;
        document.head.appendChild(style);
    }
    
    document.getElementById('productPanel').classList.add('open');
}

function closeProductPanel() {
    document.getElementById('productPanel').classList.remove('open');
    AppState.selectedProduct = null;
}

function updateProductQty(productId, value) {
    const product = AppState.products.find(p => p.id === productId);
    if (product) { product.cyQty = parseInt(value) || 0; UI.renderStats(); UI.renderCategories(); }
}

async function saveProductDraft(productId) {
    const product = AppState.products.find(p => p.id === productId);
    if (!product) return;
    try {
        await ApiService.saveProductDraft(productId, { cyQty: product.cyQty });
        UI.showToast('Draft Saved', `${product.name} saved successfully`, 'success');
    } catch (error) { UI.showToast('Error', 'Failed to save draft', 'error'); }
}

async function submitProduct(productId) {
    const product = AppState.products.find(p => p.id === productId);
    if (!product) return;
    showModal('Submit for Approval', `Are you sure you want to submit "${product.name}" for approval?`, 'warning', async () => {
        try {
            await ApiService.submitProduct(productId);
            product.status = 'submitted';
            product.submittedDate = new Date().toISOString();
            UI.renderStats(); UI.renderCategories();
            UI.showToast('Submitted', `${product.name} submitted for approval`, 'success');
        } catch (error) { UI.showToast('Error', 'Failed to submit product', 'error'); }
    });
}

async function saveAllDrafts() {
    const drafts = AppState.products.filter(p => p.status === 'draft' || p.status === 'rejected');
    if (drafts.length === 0) { UI.showToast('Info', 'No drafts to save', 'info'); return; }
    try {
        await ApiService.saveAllDrafts(drafts);
        UI.showToast('Saved', `${drafts.length} drafts saved successfully`, 'success');
    } catch (error) { UI.showToast('Error', 'Failed to save drafts', 'error'); }
}

async function submitAllPending() {
    const pending = AppState.products.filter(p => p.status === 'draft');
    if (pending.length === 0) { UI.showToast('Info', 'No products to submit', 'info'); return; }
    showModal('Submit All Pending', `Are you sure you want to submit ${pending.length} products for approval?`, 'warning', async () => {
        try {
            const productIds = pending.map(p => p.id);
            await ApiService.submitMultipleProducts(productIds);
            pending.forEach(p => { p.status = 'submitted'; p.submittedDate = new Date().toISOString(); });
            UI.renderStats(); UI.renderCategories();
            UI.showToast('Submitted', `${pending.length} products submitted for approval`, 'success');
        } catch (error) { UI.showToast('Error', 'Failed to submit products', 'error'); }
    });
}

function showModal(title, message, iconType, callback) {
    const modal = document.getElementById('confirmModal');
    const icon = document.getElementById('modalIcon');
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;
    icon.className = 'modal-icon ' + iconType;
    const icons = { warning: 'fa-exclamation-triangle', success: 'fa-check-circle', info: 'fa-info-circle' };
    icon.innerHTML = `<i class="fas ${icons[iconType] || icons.info}"></i>`;
    AppState.modalCallback = callback;
    modal.classList.add('open');
}

function closeModal() { document.getElementById('confirmModal').classList.remove('open'); AppState.modalCallback = null; }

function confirmModalAction() { if (AppState.modalCallback) AppState.modalCallback(); closeModal(); }

function closeToast(id) { const toast = document.getElementById(id); if (toast) { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); } }

function clearSearch() { document.getElementById('searchInput').value = ''; AppState.searchTerm = ''; document.getElementById('searchClear').classList.remove('visible'); UI.renderCategories(); }

async function refreshData() { UI.showToast('Refreshing', 'Updating data...', 'info'); await init(); UI.showToast('Updated', 'Data refreshed successfully', 'success'); }

function toggleTheme() { const body = document.body; const isDark = body.getAttribute('data-theme') === 'dark'; body.setAttribute('data-theme', isDark ? 'light' : 'dark'); localStorage.setItem('theme', isDark ? 'light' : 'dark'); }

// ============================================
// EVENT LISTENERS
// ============================================
document.getElementById('searchInput').addEventListener('input', (e) => {
    AppState.searchTerm = e.target.value;
    document.getElementById('searchClear').classList.toggle('visible', !!AppState.searchTerm);
    if (AppState.searchTerm) {
        AppState.categories.forEach(cat => {
            const hasMatch = AppState.products.some(p => p.categoryId === cat.id && (p.name.toLowerCase().includes(AppState.searchTerm.toLowerCase()) || p.code.toLowerCase().includes(AppState.searchTerm.toLowerCase()) || (p.subcategory && p.subcategory.toLowerCase().includes(AppState.searchTerm.toLowerCase()))));
            if (hasMatch) AppState.expandedCategories.add(cat.id);
        });
    }
    UI.renderCategories();
});

document.getElementById('statusFilter').addEventListener('click', (e) => { e.stopPropagation(); document.getElementById('statusMenu').classList.toggle('open'); });

document.querySelectorAll('.filter-option').forEach(option => {
    option.addEventListener('click', (e) => {
        const status = e.currentTarget.dataset.status;
        AppState.statusFilter = status;
        document.querySelectorAll('.filter-option').forEach(opt => opt.classList.remove('active'));
        e.currentTarget.classList.add('active');
        document.querySelector('#statusFilter span').textContent = status === 'all' ? 'All Status' : Utils.getStatusLabel(status);
        document.getElementById('statusMenu').classList.remove('open');
        UI.renderCategories();
    });
});

document.addEventListener('click', (e) => { if (!e.target.closest('.filter-dropdown')) document.getElementById('statusMenu').classList.remove('open'); });

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeProductPanel(); closeModal(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveAllDrafts(); }
});

window.addEventListener('online', () => { document.getElementById('offlineBanner').classList.remove('show'); UI.showToast('Online', 'Connection restored', 'success'); });
window.addEventListener('offline', () => { document.getElementById('offlineBanner').classList.add('show'); UI.showToast('Offline', 'You are now offline', 'warning'); });

// ============================================
// INITIALIZATION
// ============================================
async function init() {
    try {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) document.body.setAttribute('data-theme', savedTheme);
        AppState.categories = await ApiService.getCategories();
        AppState.products = await ApiService.getProducts();
        if (AppState.categories.length > 0) AppState.expandedCategories.add(AppState.categories[0].id);
        UI.renderStats();
        UI.renderCategories();
    } catch (error) { console.error('Initialization failed:', error); UI.showToast('Error', 'Failed to load data', 'error'); }
}

init();

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').then(reg => console.log('SW registered')).catch(err => console.error('SW failed:', err));
