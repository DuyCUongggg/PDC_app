// ===== REFUND =====
let selectedRefundProduct = null;

(function initRefund() {
    const s = document.getElementById('refundProductSearch');
    s?.addEventListener('input', () => { searchProducts(s.value, 'refundSearchResults', 'selectRefundProduct'); selectedRefundProduct = null; updateRefundState(); updateRefundDisplay(); });
    ['startDate', 'endDate'].forEach(id => document.getElementById(id)?.addEventListener('change', updateRefundState));
    const today = new Date(), start = new Date(); 
    start.setDate(today.getDate() - 7);
    document.getElementById('startDate').value = start.toISOString().slice(0, 10);
    document.getElementById('endDate').value = today.toISOString().slice(0, 10);
})();

function selectRefundProduct(id) {
    selectedRefundProduct = (appData.products || []).find(p => p.id === id) || null;
    document.getElementById('refundProductSearch').value = selectedRefundProduct?.name || '';
    document.getElementById('refundSearchResults').classList.remove('show');
    updateRefundDisplay(); updateRefundState();
}
window.selectRefundProduct = selectRefundProduct;

function updateRefundState() {
    const ok = !!(selectedRefundProduct && document.getElementById('startDate').value && document.getElementById('endDate').value);
    document.getElementById('refundBtn').disabled = !ok;
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
    const s = new Date(document.getElementById('startDate').value || '');
    const e = new Date(document.getElementById('endDate').value || '');
    if (isNaN(s) || isNaN(e)) return showNotification('Chọn đủ ngày!', 'error');
    if (e <= s) return showNotification('Ngày kết thúc phải sau ngày bắt đầu!', 'error');

    let totalDays = selectedRefundProduct.duration;
    if (selectedRefundProduct.durationUnit === 'tháng') totalDays *= 30; // approx
    const daysUsed = Math.ceil((e - s) / (1000 * 3600 * 24));
    const daysRemaining = totalDays - daysUsed;

    if (daysRemaining <= 0) {
        document.getElementById('refundBreakdown').innerHTML =
            `<div class="calc-row"><span class="calc-label">💰 Giá gói:</span><span class="calc-value">${formatPrice(selectedRefundProduct.price)}đ</span></div>
       <div class="calc-row"><span class="calc-label">⏰ Tổng thời hạn:</span><span class="calc-value">${totalDays} ngày</span></div>
       <div class="calc-row"><span class="calc-label">📅 Đã sử dụng:</span><span class="calc-value">${daysUsed} ngày</span></div>
       <div class="calc-row"><span class="calc-label">📅 Còn lại:</span><span class="calc-value text-danger">${daysRemaining} ngày (hết hạn)</span></div>
       <div class="calc-row"><span class="calc-label">💸 SỐ TIỀN HOÀN:</span><span class="calc-value text-danger">0đ</span></div>`;
        document.getElementById('refundCustomerContent').textContent =
            `❌ SẢN PHẨM ĐÃ HẾT HẠN\n\n🎯 ${selectedRefundProduct.name}\n📅 ${s.toLocaleDateString('vi-VN')} → ${e.toLocaleDateString('vi-VN')}\n⏰ Đã dùng: ${daysUsed} ngày\n💸 Hoàn: 0đ`;
        document.getElementById('refundResult').style.display = 'block';
        return;
    }

    const refund = Math.round((daysRemaining / totalDays) * selectedRefundProduct.price);
    document.getElementById('refundBreakdown').innerHTML =
        `<div class="calc-row"><span class="calc-label">💰 Giá gói:</span><span class="calc-value">${formatPrice(selectedRefundProduct.price)}đ</span></div>
     <div class="calc-row"><span class="calc-label">⏰ Tổng thời hạn:</span><span class="calc-value">${totalDays} ngày</span></div>
     <div class="calc-row"><span class="calc-label">📅 Đã sử dụng:</span><span class="calc-value">${daysUsed} ngày</span></div>
     <div class="calc-row"><span class="calc-label">📅 Còn lại:</span><span class="calc-value text-success">${daysRemaining} ngày</span></div>
     <div class="calc-row"><span class="calc-label">💸 SỐ TIỀN HOÀN:</span><span class="calc-value text-success">${formatPrice(refund)}đ</span></div>`;
    document.getElementById('refundCustomerContent').textContent =
        `✅ THÔNG TIN HOÀN TIỀN\n\n🎯 ${selectedRefundProduct.name}\n📅 ${s.toLocaleDateString('vi-VN')} → ${e.toLocaleDateString('vi-VN')}\n⏰ Còn lại: ${daysRemaining} ngày\n💸 Hoàn: ${formatPrice(refund)}đ`;
    document.getElementById('refundResult').style.display = 'block';
    showNotification('Đã tính hoàn tiền!');
}
window.calculateRefund = calculateRefund;

function copyRefundResult() {
    const txt = document.getElementById('refundCustomerContent').textContent || '';
    if (!txt) return showNotification('Chưa có kết quả!', 'error');
    navigator.clipboard.writeText(txt).then(() => showNotification('Đã copy!'));
}
window.copyRefundResult = copyRefundResult;

function updateRefundTab() {
    const has = (appData.products || []).length > 0;
    const emptyState = document.getElementById('refundEmptyState');
    const refundForm = document.querySelector('.refund-form');
    
    if (emptyState) emptyState.style.display = has ? 'none' : 'block';
    if (refundForm) refundForm.style.display = has ? 'block' : 'none';
}
window.updateRefundTab = updateRefundTab;
