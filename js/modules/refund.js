// ===== REFUND =====
let selectedRefundProduct = null;

function formatDMY(d) {
    if (!(d instanceof Date) || isNaN(d)) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

(function initRefund() {
    const s = document.getElementById('refundProductSearch');
    s?.addEventListener('input', () => { searchProductsByName(s.value, 'refundSearchResults', 'selectRefundProduct'); selectedRefundProduct = null; updateRefundState(); updateRefundDisplay(); });
    ['startDate', 'endDate'].forEach(id => document.getElementById(id)?.addEventListener('change', updateRefundState));
    const today = new Date(), start = new Date(); 
    start.setDate(today.getDate() - 7);
    const sd = document.getElementById('startDate');
    const ed = document.getElementById('endDate');
    if (sd) sd.value = start.toISOString().slice(0, 10);
    if (ed) ed.value = today.toISOString().slice(0, 10);
})();

function selectRefundProduct(id) {
    selectedRefundProduct = (appData.products || []).find(p => p.id === id) || null;
    const input = document.getElementById('refundProductSearch');
    if (input) input.value = selectedRefundProduct?.name || '';
    const list = document.getElementById('refundSearchResults');
    if (list) { list.classList.remove('show'); list.innerHTML = ''; list.style.display = 'none'; }
    updateRefundDisplay(); updateRefundState();
}
window.selectRefundProduct = selectRefundProduct;

function updateRefundState() {
    const ok = !!(selectedRefundProduct && document.getElementById('startDate')?.value && document.getElementById('endDate')?.value);
    const btn = document.getElementById('refundBtn');
    if (btn) btn.disabled = !ok;
}
function updateRefundDisplay() {
    const box = document.getElementById('refundSelectedProduct');
    if (!selectedRefundProduct) { 
        if (box) box.style.display = 'none'; 
        return; 
    }
    if (box) box.style.display = 'block';
    const nameEl = document.getElementById('refundProductName');
    const priceEl = document.getElementById('refundProductPrice');
    const durationEl = document.getElementById('refundProductDuration');
    if (nameEl) nameEl.textContent = selectedRefundProduct.name;
    if (priceEl) priceEl.textContent = formatPrice(selectedRefundProduct.price) + 'đ';
    if (durationEl) durationEl.textContent = `${selectedRefundProduct.duration} ${selectedRefundProduct.durationUnit}`;
}

function calculateRefund() {
    if (!selectedRefundProduct) { showNotification('Vui lòng chọn sản phẩm!', 'error'); return; }
    const s = new Date(document.getElementById('startDate')?.value || '');
    const e = new Date(document.getElementById('endDate')?.value || '');
    if (isNaN(s) || isNaN(e)) return showNotification('Chọn đủ ngày!', 'error');
    if (e <= s) return showNotification('Ngày kết thúc phải sau ngày bắt đầu!', 'error');

    let totalDays = Number(selectedRefundProduct.duration) || 0;
    const unit = selectedRefundProduct.durationUnit === 'tháng' ? 'tháng' : 'ngày';
    if (totalDays <= 0) totalDays = 1; // guard
    if (unit === 'tháng') totalDays *= 30; // approx month => days

    const daysUsed = Math.ceil((e - s) / (1000 * 3600 * 24));
    const daysRemaining = totalDays - daysUsed;

    if (daysRemaining <= 0) {
        const br = document.getElementById('refundBreakdown');
        if (br) br.innerHTML =
            `<div class="calc-row"><span class="calc-label">💰 Giá gói:</span><span class="calc-value">${formatPrice(selectedRefundProduct.price)}đ</span></div>
       <div class="calc-row"><span class="calc-label">⏰ Tổng thời hạn:</span><span class="calc-value">${totalDays} ngày (${selectedRefundProduct.duration} ${selectedRefundProduct.durationUnit})</span></div>
       <div class="calc-row"><span class="calc-label">📅 Khoảng tính:</span><span class="calc-value">${formatDMY(s)} → ${formatDMY(e)}</span></div>
       <div class="calc-row"><span class="calc-label">📅 Đã sử dụng:</span><span class="calc-value">${daysUsed} ngày</span></div>
       <div class="calc-row"><span class="calc-label">📅 Còn lại:</span><span class="calc-value text-danger">${daysRemaining} ngày (đã hết hạn)</span></div>
       <div class="calc-row"><span class="calc-label">💸 Số tiền hoàn:</span><span class="calc-value text-danger">0đ</span></div>`;
        const cc = document.getElementById('refundCustomerContent');
        if (cc) cc.textContent =
            `Kính gửi Quý khách,\n\nGói ${selectedRefundProduct.name} đã hết hạn. Thời gian sử dụng từ ${formatDMY(s)} đến ${formatDMY(e)}.\nTheo chính sách hoàn tiền theo ngày còn lại, số tiền hoàn là 0đ.\n\nTrân trọng.`;
        const rr = document.getElementById('refundResult'); if (rr) rr.style.display = 'block';
        return;
    }

    const refund = Math.round((daysRemaining / totalDays) * selectedRefundProduct.price);
    const perDay = Math.round(selectedRefundProduct.price / totalDays);
    const planText = `${selectedRefundProduct.duration} ${selectedRefundProduct.durationUnit}`;
    const br2 = document.getElementById('refundBreakdown');
    if (br2) br2.innerHTML =
        `<div class="calc-row"><span class="calc-label">💰 Giá gói:</span><span class="calc-value">${formatPrice(selectedRefundProduct.price)}đ</span></div>
     <div class="calc-row"><span class="calc-label">⏰ Tổng thời hạn:</span><span class="calc-value">${totalDays} ngày (${planText})</span></div>
     <div class="calc-row"><span class="calc-label">📅 Khoảng tính:</span><span class="calc-value">${formatDMY(s)} → ${formatDMY(e)}</span></div>
     <div class="calc-row"><span class="calc-label">🧮 Đơn giá/ngày:</span><span class="calc-value">${formatPrice(perDay)}đ</span></div>
     <div class="calc-row"><span class="calc-label">📅 Đã sử dụng:</span><span class="calc-value">${daysUsed} ngày</span></div>
     <div class="calc-row"><span class="calc-label">📅 Còn lại:</span><span class="calc-value text-success">${daysRemaining} ngày</span></div>
     <div class="calc-row"><span class="calc-label">💸 SỐ TIỀN HOÀN:</span><span class="calc-value text-success">${formatPrice(refund)}đ</span></div>`;
    const cc2 = document.getElementById('refundCustomerContent');
    if (cc2) cc2.textContent =
        `Kính gửi Quý khách,\n\nCentrix xin thông tin kết quả hoàn tiền cho gói ${selectedRefundProduct.name} ${planText} như sau:\n- Khoảng thời gian tính: ${formatDMY(s)} → ${formatDMY(e)}\n- Số ngày còn lại: ${daysRemaining} ngày\n- Số tiền hoàn dự kiến: ${formatPrice(refund)}đ\n\nCentrix sẽ tiến hành xử lý và chuyển hoàn trong vòng 1–2 ngày làm việc. Nếu cần hỗ trợ thêm, Quý khách vui lòng phản hồi để Centrix phục vụ tốt hơn.\nTrân trọng.`;
    const rr2 = document.getElementById('refundResult'); if (rr2) rr2.style.display = 'block';
    showNotification('Đã tính hoàn tiền!');
    if (typeof showToast === 'function') showToast('Đã tính hoàn tiền!', 'success');
}
window.calculateRefund = calculateRefund;

function copyRefundResult() {
    const txt = document.getElementById('refundCustomerContent')?.textContent || '';
    if (!txt) return showNotification('Chưa có kết quả!', 'error');
    navigator.clipboard.writeText(txt).then(() => { 
        showNotification('Đã copy!');
        if (typeof showToast === 'function') showToast('Đã copy nội dung gửi khách', 'success');
    }).catch(() => {
        if (typeof showToast === 'function') showToast('Không thể copy', 'error');
    });
}
window.copyRefundResult = copyRefundResult;

function updateRefundTab() {
    try {
        console.log('=== updateRefundTab START ===');
        
        let has = false;
        let productCount = 0;
        
        // Check appData first
        if (window.appData && window.appData.products && Array.isArray(window.appData.products)) {
            productCount = window.appData.products.length;
            has = productCount > 0;
            console.log('appData.products:', productCount, 'items');
        }
        
        // If no products in appData, check localStorage
        if (!has) {
            try {
                const saved = localStorage.getItem('pdc_app_data');
                console.log('localStorage data exists:', !!saved);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed.products && Array.isArray(parsed.products)) {
                        productCount = parsed.products.length;
                        has = productCount > 0;
                        if (has && window.appData) {
                            // Sync back to appData
                            window.appData.products = parsed.products;
                            console.log('Synced from localStorage:', productCount, 'products');
                        }
                    }
                }
            } catch (e) {
                console.error('Error loading from localStorage:', e);
            }
        }
        
        // Force check DOM for product count in sidebar
        const sidebarCount = document.getElementById('productCountBadge');
        if (sidebarCount && sidebarCount.textContent && !has) {
            const displayCount = parseInt(sidebarCount.textContent) || 0;
            if (displayCount > 0) {
                console.log('Sidebar shows', displayCount, 'products, forcing form to show');
                has = true; // Force show form if sidebar has count
            }
        }
        
        console.log('Final decision: has =', has, 'productCount =', productCount);
        
        const emptyState = document.getElementById('refundEmptyState');
        const refundForm = document.querySelector('.refund-form');
        
        console.log('DOM elements:', {
            emptyState: !!emptyState,
            refundForm: !!refundForm
        });
        
        if (emptyState) {
            emptyState.style.display = has ? 'none' : 'block';
            console.log('Empty state set to:', emptyState.style.display);
        }
        if (refundForm) {
            refundForm.style.display = has ? 'block' : 'none';  
            console.log('Refund form set to:', refundForm.style.display);
        }
        
        console.log('=== updateRefundTab END ===');
    } catch (error) {
        console.error('updateRefundTab error:', error);
        // Fallback: force show form if there's any error
        const emptyState = document.getElementById('refundEmptyState');
        const refundForm = document.querySelector('.refund-form');
        if (emptyState) emptyState.style.display = 'none';
        if (refundForm) refundForm.style.display = 'block';
        console.log('Fallback: forced form to show due to error');
    }
}
window.updateRefundTab = updateRefundTab;

// Allow other modules to force refresh
function refreshRefundState() { updateRefundTab(); }
window.refreshRefundState = refreshRefundState;

function refreshRefundData() {
    try {
        showNotification('Đang làm mới dữ liệu hoàn tiền...', 'info');
        if (typeof showToast === 'function') showToast('Đang làm mới...', 'info');
        // Clear selection and UI
        selectedRefundProduct = null;
        const input = document.getElementById('refundProductSearch');
        if (input) input.value = '';
        const list = document.getElementById('refundSearchResults');
        if (list) { list.classList.remove('show'); list.innerHTML = ''; list.style.display = 'none'; }
        document.getElementById('refundSelectedProduct')?.setAttribute('style', 'display:none');
        document.getElementById('refundResult')?.setAttribute('style', 'display:none');

        if (typeof loadFromGoogleSheets === 'function') {
            loadFromGoogleSheets().then(() => {
                if (typeof updateHeaderStats === 'function') updateHeaderStats();
                if (typeof renderProductList === 'function') renderProductList();
                updateRefundTab();
                showNotification('Đã làm mới dữ liệu!', 'success');
                if (typeof showToast === 'function') showToast('Đã làm mới dữ liệu', 'success');
            }).catch(() => {
                updateRefundTab();
                showNotification('Làm mới xong (từ localStorage)', 'success');
                if (typeof showToast === 'function') showToast('Làm mới từ bộ nhớ máy', 'success');
            });
        } else {
            updateRefundTab();
        }
    } catch (e) {
        console.error('refreshRefundData error:', e);
        updateRefundTab();
        if (typeof showToast === 'function') showToast('Làm mới thất bại', 'error');
    }
}
window.refreshRefundData = refreshRefundData;
