
    // ===== DROPDOWN MENU HANDLING =====
    function initDropdowns() {
        // Handle file menu dropdown
        const fileMenuBtn = document.getElementById('fileMenuBtn');
        const fileMenu = document.getElementById('fileMenu');
        
        if (fileMenuBtn && fileMenu) {
            fileMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = fileMenu.classList.contains('show');
                
                // Close all other dropdowns
                document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                    menu.classList.remove('show');
                });
                
                // Toggle current dropdown
                if (!isOpen) {
                    fileMenu.classList.add('show');
                    fileMenuBtn.setAttribute('aria-expanded', 'true');
                } else {
                    fileMenu.classList.remove('show');
                    fileMenuBtn.setAttribute('aria-expanded', 'false');
                }
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!fileMenuBtn.contains(e.target) && !fileMenu.contains(e.target)) {
                    fileMenu.classList.remove('show');
                    fileMenuBtn.setAttribute('aria-expanded', 'false');
                }
            });
        }
    }

    // ===== CORE =====
    window.appData = { metadata: { lastUpdated: new Date().toISOString() }, products: [], categories: ["AI Services", "Công cụ"] };

    // helpers
    function formatPrice(n) { return new Intl.NumberFormat('vi-VN').format(Number(n) || 0); }
    function parsePrice(v) { return Number(String(v).replace(/[^\d]/g, '')) || 0; }
    function bindPriceInput(el) { 
        if (!el) return; 
        el.addEventListener('input', e => {
            // Chỉ cho phép số và xóa dấu chấm khi đang gõ
            e.target.value = e.target.value.replace(/[^\d]/g, '');
        });
        el.addEventListener('blur', e => {
            // Format số khi rời khỏi ô input
            const r = parsePrice(e.target.value);
            e.target.value = r ? formatPrice(r) : "";
        });
    }
    function normalizeText(s) {
        return (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    function sanitizeProducts() {
        if (!Array.isArray(appData.products)) return;
        appData.products = appData.products.map(p => {
            let duration = Number(p?.duration);
            if (!Number.isFinite(duration) || duration <= 0) duration = 1;
            let unit = p?.durationUnit === 'ngày' || p?.durationUnit === 'tháng' ? p.durationUnit : 'tháng';
            return { ...p, duration, durationUnit: unit };
        });
    }

    function parseDurationFromText(text) {
        const m = String(text || '').match(/(\d{1,3})\s*(ngay|ngày|thang|tháng)/i);
        if (m) return { duration: parseInt(m[1]) || 1, unit: /ngay|ngày/i.test(m[2]) ? 'ngày' : 'tháng' };
        const n = parseInt(String(text || '').replace(/[^\d]/g, ''));
        return { duration: Number.isFinite(n) && n > 0 ? n : 0, unit: 'tháng' };
    }
    function showNotification(msg, type = 'success', t = 3000) { 
        // Create toast notification for important messages
        const shouldShowToast = (
            (type === 'success' && (msg.includes('Hoàn') || msg.includes('Đã tính'))) ||
            (type === 'error' && (msg.includes('ngày') || msg.includes('trước')))
        );
        
        if (shouldShowToast) {
            createToast(msg, type, t);
        }
        // Log removed for performance
    }

    function createToast(message, type = 'success', duration = 3000) {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.toast-notification');
        existingToasts.forEach(toast => toast.remove());

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.textContent = message;

        // Add styles
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            fontSize: '14px',
            zIndex: '10000',
            maxWidth: '300px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease, opacity 0.3s ease',
            opacity: '0'
        });

        // Set background color based on type
        if (type === 'success') {
            toast.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        } else if (type === 'error') {
            toast.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
        }

        // Add to page
        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        }, 10);

        // Auto remove
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
    function generateUUID() { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8); return v.toString(16); }); }

    // header/tabs/menu
    function updateHeaderStats() { 
        const n = (appData.products || []).length; 
        const pc1 = document.getElementById('productCountBadge');
        if (pc1) pc1.textContent = n;
        const pc2 = document.getElementById('productCountHeader');
        if (pc2) pc2.textContent = n;
        const listCount = document.getElementById('productsCount');
        if (listCount) listCount.textContent = `${n} sản phẩm`;
        const lu = document.getElementById('lastUpdated'); 
        if (lu) lu.textContent = new Date(appData.metadata.lastUpdated).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'}); 
    }

    function switchTab(id) { 
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(e => e.classList.remove('active')); 
        document.getElementById(id)?.classList.add('active'); 
        
        // Update sidebar navigation
        document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${id}"]`)?.classList.add('active');
        
        // Update page title and subtitle
        const titles = {
            'admin': { title: 'Quản lý sản phẩm', subtitle: 'Thêm, chỉnh sửa và quản lý các gói sản phẩm' },
            'templates': { title: 'Tạo Template', subtitle: 'Tạo nội dung template cho khách hàng' },
            'refund': { title: 'Tính hoàn tiền', subtitle: 'Tính toán số tiền hoàn lại cho khách hàng' },
            'upgrade': { title: 'Đổi gói sản phẩm', subtitle: 'Tính toán số tiền bù khi khách hàng đổi sang gói khác' },
            'schedule': { title: 'Lịch làm việc', subtitle: 'Quản lý lịch làm việc của team 4 người' },
            'notes': { title: 'Ghi chú khách hàng', subtitle: 'Tạo và quản lý ghi chú cho từng khách hàng' }
        };
        
        const pageTitle = document.getElementById('pageTitle');
        const pageSubtitle = document.getElementById('pageSubtitle');
        if (pageTitle && pageSubtitle && titles[id]) {
            pageTitle.textContent = titles[id].title;
            pageSubtitle.textContent = titles[id].subtitle;
        }
    }

    window.switchTab = switchTab;


    // ===== GOOGLE SHEETS INTEGRATION =====
    const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwd_o6e3jZ-vFLFT3Lmd0P6X7n7FNfzke8pY-EoXCiLz3Az-Z0_3xZ51X9yb3OCBMCnLw/exec';
    const GOOGLE_SHEET_TOKEN = 'PDC123456';

    // Load data from Google Sheets via Apps Script API
    async function loadFromGoogleSheets() {
        try {
            showNotification('Đang tải dữ liệu từ Google Sheets...', 'info');
            
            const response = await fetch(`${GOOGLE_APPS_SCRIPT_URL}?token=${GOOGLE_SHEET_TOKEN}&action=list`);
            const result = await response.json();
            
            if (result.ok && Array.isArray(result.data)) {
                // Convert Google Sheets data to app format
                const products = result.data.map(item => {
                    // duration fallbacks: duration | qty | quantity | months | note | name | unit like "3 tháng"
                    let duration = parseInt(item.duration);
                    let unit = item.unit || 'tháng';
                    if (!Number.isFinite(duration) || duration <= 0) duration = parseInt(item.qty);
                    if (!Number.isFinite(duration) || duration <= 0) duration = parseInt(item.quantity);
                    if (!Number.isFinite(duration) || duration <= 0) duration = parseInt(item.months);
                    if (!Number.isFinite(duration) || duration <= 0) {
                        const fromUnit = parseDurationFromText(item.unit);
                        if (fromUnit.duration > 0) { duration = fromUnit.duration; unit = fromUnit.unit; }
                    }
                    if (!Number.isFinite(duration) || duration <= 0) {
                        const fromNote = parseDurationFromText(item.note);
                        if (fromNote.duration > 0) { duration = fromNote.duration; unit = fromNote.unit; }
                    }
                    if (!Number.isFinite(duration) || duration <= 0) {
                        const fromName = parseDurationFromText(item.name);
                        if (fromName.duration > 0) { duration = fromName.duration; unit = fromName.unit; }
                    }
                    if (!Number.isFinite(duration) || duration <= 0) duration = 1;

                    return {
                        id: item.id || generateUUID(),
                        name: item.name || '',
                        duration,
                        durationUnit: unit === 'ngày' || unit === 'tháng' ? unit : 'tháng',
                        price: parseInt(item.price) || 0,
                        category: item.category || 'AI Services',
                        note: item.note || ''
                    };
                });
                
                appData.products = products;
                sanitizeProducts();
                appData.metadata.lastUpdated = new Date().toISOString();
                renderProductList();
                updateHeaderStats();
                updateTabs();
                if (typeof refreshRefundState === 'function') refreshRefundState();
                showNotification(`Đã tải ${products.length} sản phẩm từ Google Sheets!`);
            } else {
                throw new Error(result.error || 'Không thể tải dữ liệu');
            }
            
        } catch (error) {
            console.error('Error loading from Google Sheets:', error);
            showNotification('Lỗi: ' + error.message, 'error');
        }
    }

    // Save data to Google Sheets via Apps Script API
    async function saveToGoogleSheets() {
        console.log('saveToGoogleSheets called!');
        try {
            showNotification('Đang lưu dữ liệu vào Google Sheets...', 'info');
            
            // Convert app data to Google Sheets format
            const products = appData.products.map(product => ({
                id: product.id,
                name: product.name,
                duration: product.duration,
                unit: product.durationUnit,
                price: product.price,
                category: product.category,
                note: product.note || '',
                updatedAt: new Date().toISOString()
            }));
            
            console.log('Sending to Google Sheets:', products);
            
            // POST with text/plain to avoid preflight; token in query
            const url = `${GOOGLE_APPS_SCRIPT_URL}?token=${encodeURIComponent(GOOGLE_SHEET_TOKEN)}`;
            const payload = { action: 'upsert', products };
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('Google Sheets save response:', result);
            
            if (result.ok) {
                appData.metadata.lastUpdated = new Date().toISOString();
                updateHeaderStats();
                showNotification(`Đã lưu ${products.length} sản phẩm vào Google Sheets!`);
            } else {
                throw new Error(result.error || 'Không thể lưu dữ liệu');
            }
            
        } catch (error) {
            console.error('Error saving to Google Sheets:', error);
            showNotification('Lỗi: ' + error.message, 'error');
        }
    }

    // Delete products on Google Sheets via Apps Script API
    async function deleteFromGoogleSheets(ids) {
        if (!Array.isArray(ids) || ids.length === 0) return;
        try {
            const url = `${GOOGLE_APPS_SCRIPT_URL}?token=${encodeURIComponent(GOOGLE_SHEET_TOKEN)}`;
            const payload = { action: 'delete', ids };
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            const result = await response.json();
            if (!result.ok) throw new Error(result.error || 'Không thể xóa trên Google Sheets');
            showNotification('Đã xóa trên Google Sheets!');
        } catch (err) {
            console.error('Error deleting on Google Sheets:', err);
            showNotification('Lỗi xóa trên Google Sheets: ' + err.message, 'error');
        }
    }

    // export/import
    function exportData() { const blob = new Blob([JSON.stringify(appData, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'products.json'; a.click(); showNotification('Đã export!'); }
    function importData() { document.getElementById('importFile').click(); }
    function handleImport() { const f = this.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => { try { const d = JSON.parse(r.result); appData.products = Array.isArray(d.products) ? d.products : []; appData.categories = d.categories || appData.categories; appData.metadata.lastUpdated = new Date().toISOString(); renderProductList(); updateHeaderStats(); updateTabs(); showNotification('Đã import!'); } catch { showNotification('File JSON không hợp lệ', 'error'); } }; r.readAsText(f); }
    async function loadProductsFromJSON() { try { const res = await fetch('/data/products.json', { cache: 'no-store' }); const d = await res.json(); appData.products = d.products || []; appData.categories = d.categories || appData.categories; appData.metadata.lastUpdated = new Date().toISOString(); renderProductList(); updateHeaderStats(); updateTabs(); showNotification('Đã tải data!'); } catch { showNotification('Không đọc được /data/products.json', 'error'); } }
    function saveToLocalStorage() { 
        try { 
            appData.metadata.lastUpdated = new Date().toISOString();
            localStorage.setItem('pdc_app_data', JSON.stringify(appData)); 
            updateHeaderStats();
            showNotification('Đã lưu vào Local Storage!'); 
        } catch { 
            showNotification('Lỗi lưu Local Storage!', 'error'); 
        } 
    }
    window.exportData = exportData; window.importData = importData; window.handleImport = handleImport; window.loadProductsFromJSON = loadProductsFromJSON; window.saveToLocalStorage = saveToLocalStorage;
    window.loadFromGoogleSheets = loadFromGoogleSheets; 
    window.saveToGoogleSheets = saveToGoogleSheets;

    // Debug: Test if functions are loaded
    console.log('Google Sheets functions loaded:', {
        loadFromGoogleSheets: typeof loadFromGoogleSheets,
        saveToGoogleSheets: typeof saveToGoogleSheets
    });

    // admin list
    function getFilters() { return { q: (document.getElementById('adminSearch')?.value || '').toLowerCase(), cat: (document.getElementById('categoryFilter')?.value || '') }; }
    function filterProducts() { renderProductList(); } window.filterProducts = filterProducts;
    function renderProductList() {
        const root = document.getElementById('productList'); 
        if (!root) return;
        
        const { q, cat } = getFilters();
        const items = (appData.products || []).filter(p => {
            const nameN = normalizeText(p.name);
            const catN = normalizeText(p.category);
            const qN = normalizeText(q);
            const okQ = !qN || nameN.includes(qN) || catN.includes(qN) || nameN.startsWith(qN);
            const okC = !cat || p.category === cat; 
            return okQ && okC;
        });
        
        // Update products count
        const productsCount = document.getElementById('productsCount');
        if (productsCount) productsCount.textContent = `${items.length} sản phẩm`;
        
        if (items.length === 0) { 
            root.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📦</div>
                    <h4>Chưa có sản phẩm</h4>
                    <p>Hãy thêm sản phẩm đầu tiên của bạn</p>
                </div>
            `; 
            updateTabs(); 
            return; 
        }
        
        const group = {}; 
        items.forEach(p => { (group[p.category] ||= []).push(p); });
        
        root.innerHTML = Object.keys(group).map(c => {
            const rows = group[c].map(p => `
                <div class="product-item">
                    <div class="product-header">
                        <div class="product-info">
                            <h5>${p.name}</h5>
                            <p>${formatPrice(p.price)}đ</p>
                            <div class="product-meta">
                                <span>${Math.max(1, p.duration)} ${p.durationUnit}</span>
                                <span class="category-badge">${p.category}</span>
                            </div>
                        </div>
                        <div class="product-actions">
                            <button class="btn btn-outline" onclick="openEditModal('${p.id}')">
                                <span class="btn-icon">✏️</span>
                                Sửa
                            </button>
                            <button class="btn btn-danger" onclick="askDeleteProduct('${p.id}')">
                                <span class="btn-icon">🗑️</span>
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
            
            return `
                <div class="product-group">
                    <div class="product-group-header">
                        <h4>📦 ${c}</h4>
                    </div>
                    ${rows}
                </div>
            `;
        }).join('');
        
        updateTabs();
    }
    function addProduct() {
        const name = document.getElementById('productName').value.trim();
        let duration = Number(document.getElementById('productDuration').value);
        const durationUnit = document.getElementById('durationUnit').value;
        const price = parsePrice(document.getElementById('productPrice').value);
        const category = document.getElementById('productCategory').value;
        
        // Validation & sane defaults
        if (!name) { showNotification('Nhập tên sản phẩm!', 'error'); return; }
        if (!Number.isFinite(duration) || duration <= 0) duration = 1;
        if (!price || price <= 0) { showNotification('Nhập giá hợp lệ!', 'error'); return; }
        const unit = (durationUnit === 'ngày' || durationUnit === 'tháng') ? durationUnit : 'tháng';
        
        appData.products.push({ id: generateUUID(), name, duration, durationUnit: unit, price, category });
        appData.metadata.lastUpdated = new Date().toISOString();
        ['productName', 'productDuration', 'productPrice'].forEach(id => document.getElementById(id).value = '');
        renderProductList(); updateHeaderStats(); updateTabs(); if (typeof refreshRefundState === 'function') refreshRefundState(); showNotification('Đã thêm!');
        queueAutoSave();
    }
    window.addProduct = addProduct;

    // edit & confirm
    let _edit = null, _del = null;
    function openEditModal(id) {
        const p = appData.products.find(x => x.id === id); 
        if (!p) return; 
        _edit = id;
        document.getElementById('editProductName').value = p.name;
        document.getElementById('editProductDuration').value = p.duration;
        document.getElementById('editDurationUnit').value = p.durationUnit;
        document.getElementById('editProductPrice').value = formatPrice(p.price);
        document.getElementById('editProductCategory').value = p.category;
        document.getElementById('editModal').classList.add('show');
    }
    function closeEditModal() { 
        document.getElementById('editModal').classList.remove('show'); 
    }
    function saveEditProduct() {
        const p = appData.products.find(x => x.id === _edit); if (!p) return;
        const newName = document.getElementById('editProductName').value.trim();
        let newDuration = Number(document.getElementById('editProductDuration').value);
        const newUnit = document.getElementById('editDurationUnit').value;
        const newPrice = parsePrice(document.getElementById('editProductPrice').value);
        const newCategory = document.getElementById('editProductCategory').value;
        
        if (!newName) { showNotification('Nhập tên sản phẩm!', 'error'); return; }
        if (!Number.isFinite(newDuration) || newDuration <= 0) newDuration = 1;
        if (!newPrice || newPrice <= 0) { showNotification('Nhập giá hợp lệ!', 'error'); return; }
        const unit = (newUnit === 'ngày' || newUnit === 'tháng') ? newUnit : 'tháng';
        
        p.name = newName;
        p.duration = newDuration;
        p.durationUnit = unit;
        p.price = newPrice;
        p.category = newCategory;
        appData.metadata.lastUpdated = new Date().toISOString();
        closeEditModal(); renderProductList(); updateHeaderStats(); if (typeof refreshRefundState === 'function') refreshRefundState(); showNotification('Đã lưu!');
        queueAutoSave();
    }
    function askDeleteProduct(id) { _del = id; document.getElementById('confirmDialog').classList.add('show'); }
    function confirmAction() {
        if (_del) {
            const idToDelete = _del;
            appData.products = appData.products.filter(p => p.id !== idToDelete);
            _del = null;
            renderProductList();
            updateHeaderStats();
            if (typeof refreshRefundState === 'function') refreshRefundState();
            showNotification('Đã xóa!');
            // Sync deletion to Google Sheets
            deleteFromGoogleSheets([idToDelete]);
        }
        closeConfirm();
    }
    function closeConfirm() { 
        document.getElementById('confirmDialog').classList.remove('show'); 
    }
    window.openEditModal = openEditModal; window.closeEditModal = closeEditModal; window.saveEditProduct = saveEditProduct;
    window.askDeleteProduct = askDeleteProduct; window.confirmAction = confirmAction; window.closeConfirm = closeConfirm;

    // common search used by modules
    function searchProducts(q, boxId, handler) {
        const box = document.getElementById(boxId); 
        if (!box) return;
        const qN = normalizeText((q || '').trim()); 
        if (!qN) { 
            box.classList.remove('show'); 
            return; 
        }
        const hits = (appData.products || []).filter(p => {
            const nameN = normalizeText(p.name);
            const catN = normalizeText(p.category);
            return nameN.startsWith(qN) || nameN.includes(qN) || catN.includes(qN);
        }).slice(0, 20);
        
        box.innerHTML = hits.length ? 
            hits.map(p => `
                <div class="search-item" onclick="${handler}('${p.id}')">
                    <div class="product-name">${p.name}</div>
                    <div class="product-details">${Math.max(1, p.duration)} ${p.durationUnit} • ${formatPrice(p.price)}đ</div>
                </div>
            `).join('') : 
            '<div class="search-item">Không tìm thấy sản phẩm</div>';
        box.classList.add('show');
    }
    window.searchProducts = searchProducts;

    // Strict name-only search (used by refund)
    function searchProductsByName(q, boxId, handler) {
        const box = document.getElementById(boxId); 
        if (!box) return;
        const qN = normalizeText((q || '').trim());
        if (!qN) { 
            box.classList.remove('show');
            box.innerHTML = '';
            box.style.display = 'none';
            return; 
        }
        const hits = (appData.products || []).filter(p => {
            const nameN = normalizeText(p.name);
            // Match from word boundary or anywhere, but NAME only
            return nameN.startsWith(qN) || nameN.includes(qN);
        }).slice(0, 20);
        box.innerHTML = hits.length ? 
            (`<div class="search-hint">Nhấn vào gói để chọn</div>` +
            hits.map(p => `
                <div class="search-item" onclick="${handler}('${p.id}')">
                    <div class="product-name">${p.name}</div>
                    <div class="product-details">${Math.max(1, p.duration)} ${p.durationUnit} • ${formatPrice(p.price)}đ</div>
                </div>
            `).join('')) : '<div class="search-item">Không tìm thấy sản phẩm</div>';
        box.classList.add('show');
        box.style.display = 'block';
    }
    window.searchProductsByName = searchProductsByName;

    // boot
    document.addEventListener('DOMContentLoaded', () => {
        // Remove any theme toggle elements
        const themeElements = document.querySelectorAll('[class*="theme"], .theme-toggle, .theme-btn, .theme-icon, .theme-switcher, .theme-selector, .theme-control, .theme-button, .theme-toggle-btn, .theme-mode, .theme-switch, .theme-changer, .theme-controls, .theme-options, .theme-menu, .theme-dropdown, .theme-picker, .theme-selector, .theme-toggler, .theme-switcher-btn, .theme-mode-btn, .theme-control-btn');
        themeElements.forEach(el => {
            if (el && el.parentNode) {
                el.parentNode.removeChild(el);
            }
        });
        
        // Initialize dropdowns
        initDropdowns();

        // Apply saved theme
        try {
            const savedTheme = localStorage.getItem('pdc_theme') || 'light';
            if (savedTheme === 'dark') document.documentElement.classList.add('dark');
        } catch {}

        // Theme toggle
        const themeToggleBtn = document.getElementById('themeToggleBtn');
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', () => {
                const root = document.documentElement;
                const isDark = root.classList.toggle('dark');
                localStorage.setItem('pdc_theme', isDark ? 'dark' : 'light');
                showToast(isDark ? 'Đã bật Dark mode' : 'Đã bật Light mode', 'info');
            });
        }

        // Mobile sidebar bindings
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', toggleSidebar);
        const mobileOverlay = document.getElementById('mobileOverlay');
        if (mobileOverlay) mobileOverlay.addEventListener('click', closeSidebar);
        
        // Load data from localStorage
        try {
            const saved = localStorage.getItem('pdc_app_data');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.products) { appData.products = parsed.products; sanitizeProducts(); }
                if (parsed.categories) appData.categories = parsed.categories;
                if (parsed.metadata) appData.metadata = parsed.metadata;
            }
        } catch (e) {
            console.log('No saved data found or error loading:', e);
        }
        
        bindPriceInput(document.getElementById('productPrice'));
        bindPriceInput(document.getElementById('editProductPrice'));
        updateHeaderStats(); renderProductList();
        if (typeof updateTabs === 'function') updateTabs();
        // Auto load from Google Sheets on startup
        loadFromGoogleSheets().then(() => {
            // Force update tabs after loading
            setTimeout(() => {
                if (typeof updateTabs === 'function') updateTabs();
            }, 100);
        }).catch(() => {
            // Still update tabs even if loading fails
            setTimeout(() => {
                if (typeof updateTabs === 'function') updateTabs();
            }, 100);
        });
        
        // Show current version  
        showCurrentVersion();
        
        // Version is now managed by version.js
        
        // Bind refresh button (safety)
        const refreshBtn = document.getElementById('refundRefreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                if (typeof refreshRefundData === 'function') {
                    refreshRefundData();
                } else if (typeof updateRefundTab === 'function') {
                    updateRefundTab();
                }
            });
        }
        
        // FORCE SHOW REFUND FORM - Simple approach
        setTimeout(() => {
            console.log('=== FORCING REFUND FORM TO SHOW ===');
            const emptyState = document.getElementById('refundEmptyState');
            const refundForm = document.querySelector('.refund-form');
            
            if (emptyState) {
                emptyState.style.display = 'none';
                console.log('Hidden empty state');
            }
            if (refundForm) {
                refundForm.style.display = 'block';
                console.log('Showed refund form');
            }
            
            // Also try calling the function
            if (typeof updateRefundTab === 'function') {
                try {
                    updateRefundTab();
                    console.log('Called updateRefundTab successfully');
                } catch (e) {
                    console.error('updateRefundTab error:', e);
                }
            }
        }, 2000);

        // Add fade-in animation to main content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.classList.add('fade-in');
        }
    });
    function updateTabs() { 
        console.log('updateTabs called, products count:', appData.products?.length || 0);
        if (typeof updateTemplateTab === 'function') updateTemplateTab(); 
        if (typeof updateRefundTab === 'function') {
            console.log('Calling updateRefundTab...');
            updateRefundTab();
        } else {
            console.log('updateRefundTab function not found!');
        }
        if (typeof updateUpgradeTab === 'function') updateUpgradeTab(); 
        if (typeof updateScheduleTab === 'function') updateScheduleTab();
        if (typeof updateNotesTab === 'function') updateNotesTab(); 
    }

    // Set today's date to input
    function setToday(inputId) {
        const today = new Date().toISOString().slice(0, 10);
        const input = document.getElementById(inputId);
        if (input) {
            input.value = today;
            input.dispatchEvent(new Event('change'));
            showNotification('Đã đặt ngày hiện tại!');
        }
    }
    window.setToday = setToday;

    // Auto-save debounce helper
    let _autoSaveTimer = null;
    function queueAutoSave() {
        if (_autoSaveTimer) clearTimeout(_autoSaveTimer);
        _autoSaveTimer = setTimeout(() => {
            saveToGoogleSheets();
            _autoSaveTimer = null;
        }, 1200);
    }

    // Version management - Only bump when I fix code
    function showCurrentVersion() {
        try {
            const key = 'pdc_app_version';
            let versionStr = localStorage.getItem(key) || '0.0.0.1';
            const el = document.getElementById('versionBadge');
            if (el) el.textContent = `v${versionStr}`;
        } catch {}
    }
    
    function bumpVersion() {
        try {
            const key = 'pdc_app_version';
            let versionStr = localStorage.getItem(key) || '0.0.0.1';
            let parts = versionStr.split('.').map(n => parseInt(n) || 0);
            
            // Ensure we have 4 parts
            while (parts.length < 4) parts.push(0);
            
            // Increment patch version (last number)
            parts[3] = (parts[3] || 0) + 1;
            
            const newVersion = parts.join('.');
            localStorage.setItem(key, newVersion);
            const el = document.getElementById('versionBadge');
            if (el) el.textContent = `v${newVersion}`;
        } catch {}
    }

    // Simple toast notifications
    function showToast(message, type = 'success') {
        try {
            const container = document.getElementById('toastContainer');
            if (!container) return;
            const el = document.createElement('div');
            el.className = `toast ${type}`;
            el.textContent = message;
            container.appendChild(el);
            setTimeout(() => { el.remove(); }, 2500);
        } catch {}
    }
    window.showToast = showToast;

    function openSidebar() {
        const sb = document.getElementById('sidebar');
        const ov = document.getElementById('mobileOverlay');
        if (sb) sb.classList.add('open');
        if (ov) ov.classList.add('show');
    }
    function closeSidebar() {
        const sb = document.getElementById('sidebar');
        const ov = document.getElementById('mobileOverlay');
        if (sb) sb.classList.remove('open');
        if (ov) ov.classList.remove('show');
    }
    function toggleSidebar() {
        const sb = document.getElementById('sidebar');
        const ov = document.getElementById('mobileOverlay');
        const open = sb && sb.classList.toggle('open');
        if (ov) ov.classList.toggle('show', !!open);
    }
    function handleNavClick() { closeSidebar(); }
    window.toggleSidebar = toggleSidebar; window.closeSidebar = closeSidebar; window.handleNavClick = handleNavClick;