
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
    function showNotification(msg, type = 'success', t = 3000) { 
        // Toast notification removed
        console.log('Notification:', msg, type);
    }
    function generateUUID() { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8); return v.toString(16); }); }

    // header/tabs/menu
    function updateHeaderStats() { 
        const n = (appData.products || []).length; 
        const pc = document.getElementById('productCount'); 
        if (pc) pc.textContent = n; 
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
            'schedule': { title: 'Lịch làm việc', subtitle: 'Quản lý lịch làm việc của team 4 người' }
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
                const products = result.data.map(item => ({
                    id: item.id || generateUUID(),
                    name: item.name || '',
                    duration: parseInt(item.duration) || 0,
                    durationUnit: item.unit || 'tháng',
                    price: parseInt(item.price) || 0,
                    category: item.category || 'AI Services',
                    note: item.note || ''
                }));
                
                appData.products = products;
                appData.metadata.lastUpdated = new Date().toISOString();
                renderProductList();
                updateHeaderStats();
                updateTabs();
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
            const okQ = !q || (p.name || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q);
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
                                <span>${p.duration} ${p.durationUnit}</span>
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
        const duration = Number(document.getElementById('productDuration').value) || 0;
        const durationUnit = document.getElementById('durationUnit').value;
        const price = parsePrice(document.getElementById('productPrice').value);
        const category = document.getElementById('productCategory').value;
        if (!name || !duration || !price) { showNotification('Nhập đủ tên/thời hạn/giá!', 'error'); return; }
        appData.products.push({ id: generateUUID(), name, duration, durationUnit, price, category });
        appData.metadata.lastUpdated = new Date().toISOString();
        ['productName', 'productDuration', 'productPrice'].forEach(id => document.getElementById(id).value = '');
        renderProductList(); updateHeaderStats(); updateTabs(); showNotification('Đã thêm!');
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
        p.name = document.getElementById('editProductName').value.trim();
        p.duration = Number(document.getElementById('editProductDuration').value) || p.duration;
        p.durationUnit = document.getElementById('editDurationUnit').value;
        p.price = parsePrice(document.getElementById('editProductPrice').value);
        p.category = document.getElementById('editProductCategory').value;
        appData.metadata.lastUpdated = new Date().toISOString();
        closeEditModal(); renderProductList(); updateHeaderStats(); showNotification('Đã lưu!');
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
        q = (q || '').trim().toLowerCase(); 
        if (!q) { 
            box.classList.remove('show'); 
            return; 
        }
        const hits = (appData.products || []).filter(p => 
            (p.name || '').toLowerCase().includes(q) || 
            (p.category || '').toLowerCase().includes(q)
        ).slice(0, 20);
        
        box.innerHTML = hits.length ? 
            hits.map(p => `
                <div class="search-item" onclick="${handler}('${p.id}')">
                    <div class="product-name">${p.name}</div>
                    <div class="product-details">${p.duration} ${p.durationUnit} • ${formatPrice(p.price)}đ</div>
                </div>
            `).join('') : 
            '<div class="search-item">Không tìm thấy sản phẩm</div>';
        box.classList.add('show');
    }
    window.searchProducts = searchProducts;

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
        
        // Load data from localStorage
        try {
            const saved = localStorage.getItem('pdc_app_data');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.products) appData.products = parsed.products;
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
        loadFromGoogleSheets();
        
        // Add fade-in animation to main content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.classList.add('fade-in');
        }
    });
    function updateTabs() { 
        if (typeof updateTemplateTab === 'function') updateTemplateTab(); 
        if (typeof updateRefundTab === 'function') updateRefundTab(); 
        if (typeof updateUpgradeTab === 'function') updateUpgradeTab(); 
        if (typeof updateScheduleTab === 'function') updateScheduleTab(); 
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
