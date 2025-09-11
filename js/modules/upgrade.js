// ===== UPGRADE MODULE =====
let selectedCurrentProduct = null;
let selectedNewProduct = null;

function formatDMY(d) {
    if (!(d instanceof Date) || isNaN(d)) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

(function initUpgrade() {
    // Current product search
    const currentSearch = document.getElementById('currentProductSearch');
    currentSearch?.addEventListener('input', () => { 
        searchProductsByName(currentSearch.value, 'currentProductSearchResults', 'selectCurrentProduct'); 
        selectedCurrentProduct = null; 
        updateUpgradeState(); 
        updateUpgradeDisplay(); 
    });
    
    // New product search
    const newSearch = document.getElementById('newProductSearch');
    newSearch?.addEventListener('input', () => { 
        searchProductsByName(newSearch.value, 'newProductSearchResults', 'selectNewProduct'); 
        selectedNewProduct = null; 
        updateUpgradeState(); 
        updateUpgradeDisplay(); 
    });
    
    // Date inputs (rename meanings: ngày bắt đầu gói hiện tại, ngày đổi sang gói mới)
    ['upgradeStartDate', 'upgradeEndDate'].forEach(id => 
        document.getElementById(id)?.addEventListener('change', updateUpgradeState)
    );
    
    // Set default dates
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 7);
    
    document.getElementById('upgradeStartDate').value = startDate.toISOString().slice(0, 10);
    document.getElementById('upgradeEndDate').value = today.toISOString().slice(0, 10);

    // Bind refresh button if exists
    const btn = document.getElementById('upgradeRefreshBtn');
    btn?.addEventListener('click', refreshUpgradeData);
})();

function selectCurrentProduct(id) {
    selectedCurrentProduct = (appData.products || []).find(p => p.id === id) || null;
    document.getElementById('currentProductSearch').value = selectedCurrentProduct?.name || '';
    const list = document.getElementById('currentProductSearchResults');
    list?.classList.remove('show'); if (list) { list.innerHTML = ''; list.style.display = 'none'; }
    updateUpgradeDisplay();
    updateUpgradeState();
}
window.selectCurrentProduct = selectCurrentProduct;

function selectNewProduct(id) {
    selectedNewProduct = (appData.products || []).find(p => p.id === id) || null;
    document.getElementById('newProductSearch').value = selectedNewProduct?.name || '';
    const list = document.getElementById('newProductSearchResults');
    list?.classList.remove('show'); if (list) { list.innerHTML = ''; list.style.display = 'none'; }
    updateUpgradeDisplay();
    updateUpgradeState();
}
window.selectNewProduct = selectNewProduct;

function updateUpgradeState() {
    const ok = !!(selectedCurrentProduct && selectedNewProduct && 
                  document.getElementById('upgradeStartDate').value && 
                  document.getElementById('upgradeEndDate').value);
    const btn = document.getElementById('upgradeBtn');
    if (btn) btn.disabled = !ok;
}

function updateUpgradeDisplay() {
    const box = document.getElementById('upgradeSelectedProducts');
    if (!selectedCurrentProduct || !selectedNewProduct) { 
        if (box) box.style.display = 'none'; 
        return; 
    }
    if (box) box.style.display = 'block';
    document.getElementById('currentProductName').textContent = selectedCurrentProduct.name;
    document.getElementById('currentProductPrice').textContent = formatPrice(selectedCurrentProduct.price) + 'đ';
    document.getElementById('currentProductDuration').textContent = `${selectedCurrentProduct.duration} ${selectedCurrentProduct.durationUnit}`;
    document.getElementById('newProductName').textContent = selectedNewProduct.name;
    document.getElementById('newProductPrice').textContent = formatPrice(selectedNewProduct.price) + 'đ';
    document.getElementById('newProductDuration').textContent = `${selectedNewProduct.duration} ${selectedNewProduct.durationUnit}`;
}

function calculateUpgrade() {
    if (!selectedCurrentProduct || !selectedNewProduct) { 
        showNotification('Vui lòng chọn cả gói hiện tại và gói mới!', 'error'); 
        return; 
    }
    const startDate = new Date(document.getElementById('upgradeStartDate').value || '');
    const endDate = new Date(document.getElementById('upgradeEndDate').value || '');
    if (isNaN(startDate) || isNaN(endDate)) return showNotification('Chọn đủ ngày!', 'error');
    if (endDate <= startDate) return showNotification('Ngày đổi gói phải sau ngày bắt đầu!', 'error');

    const daysUsed = Math.ceil((endDate - startDate) / (1000 * 3600 * 24));
    let currentTotalDays = selectedCurrentProduct.duration; if (selectedCurrentProduct.durationUnit === 'tháng') currentTotalDays *= 30;
    let newTotalDays = selectedNewProduct.duration; if (selectedNewProduct.durationUnit === 'tháng') newTotalDays *= 30;
    const remainingDays = currentTotalDays - daysUsed; if (remainingDays <= 0) { showNotification('Gói hiện tại đã hết hạn!', 'error'); return; }
    const refundAmount = Math.round((remainingDays / currentTotalDays) * selectedCurrentProduct.price);
    const topUpAmount = Math.max(0, selectedNewProduct.price - refundAmount);
    const surplusAmount = Math.max(0, refundAmount - selectedNewProduct.price);
    const pricePerDayNew = newTotalDays > 0 ? (selectedNewProduct.price / newTotalDays) : 0;
    const extraDays = pricePerDayNew > 0 ? Math.floor(surplusAmount / pricePerDayNew) : 0;

    document.getElementById('upgradeBreakdown').innerHTML = `
        <div class="calc-row"><span class="calc-label">📦 Gói hiện tại:</span><span class="calc-value">${selectedCurrentProduct.name} (${selectedCurrentProduct.duration} ${selectedCurrentProduct.durationUnit})</span></div>
        <div class="calc-row"><span class="calc-label">💰 Giá gói hiện tại:</span><span class="calc-value">${formatPrice(selectedCurrentProduct.price)}đ</span></div>
        <div class="calc-row"><span class="calc-label">📅 Khoảng tính:</span><span class="calc-value">${formatDMY(startDate)} → ${formatDMY(endDate)}</span></div>
        <div class="calc-row"><span class="calc-label">⏰ Đã sử dụng:</span><span class="calc-value">${daysUsed} ngày</span></div>
        <div class="calc-row"><span class="calc-label">📅 Còn lại:</span><span class="calc-value">${remainingDays} ngày</span></div>
        <div class="calc-row"><span class="calc-label">💸 Giá trị còn lại (ước tính):</span><span class="calc-value text-success">${formatPrice(refundAmount)}đ</span></div>
        <div class="calc-row"><span class="calc-label">🆕 Gói muốn đổi:</span><span class="calc-value">${selectedNewProduct.name} (${selectedNewProduct.duration} ${selectedNewProduct.durationUnit})</span></div>
        <div class="calc-row"><span class="calc-label">💰 Giá gói mới:</span><span class="calc-value">${formatPrice(selectedNewProduct.price)}đ</span></div>
        <div class="calc-row"><span class="calc-label">🧮 SỐ TIỀN CẦN BÙ THÊM:</span><span class="calc-value ${topUpAmount > 0 ? 'text-danger' : 'text-success'}">${formatPrice(topUpAmount)}đ</span></div>
        ${surplusAmount > 0 ? `<div class="calc-row"><span class="calc-label">⏳ Quy đổi thêm thời hạn:</span><span class="calc-value text-success">${extraDays} ngày</span></div>` : ''}`;

    // Kết luận theo từng trường hợp thanh toán
    let paymentConclusion = '';
    if (topUpAmount > 0) {
        paymentConclusion = `\n\nSố tiền cần thanh toán thêm: ${formatPrice(topUpAmount)}đ\nVui lòng thanh toán để hoàn tất đổi gói.`;
    } else if (surplusAmount > 0) {
        paymentConclusion = `\n\nKhông cần thanh toán thêm. Phần chênh lệch được quy đổi thành ${extraDays} ngày sử dụng thêm.`;
    } else {
        paymentConclusion = `\n\nKhông cần thanh toán thêm. Giá hai gói tương đương trong giai đoạn tính.`;
    }

    const customerMessage = `Kính gửi Quý khách,\n\nCentrix xin thông tin về việc đổi gói dịch vụ như sau:\n- Gói hiện tại: ${selectedCurrentProduct.name} (${selectedCurrentProduct.duration} ${selectedCurrentProduct.durationUnit})\n- Thời gian tính đổi: ${formatDMY(startDate)} → ${formatDMY(endDate)}\n- Số ngày đã dùng: ${daysUsed} ngày\n- Giá trị còn lại (ước tính) của gói hiện tại: ${formatPrice(refundAmount)}đ\n\nGói muốn đổi: ${selectedNewProduct.name} (${selectedNewProduct.duration} ${selectedNewProduct.durationUnit})\nGiá gói mới: ${formatPrice(selectedNewProduct.price)}đ${surplusAmount > 0 ? `\nPhần dư quy đổi thêm thời hạn: ${extraDays} ngày` : ''}${paymentConclusion}\n\nCentrix sẵn sàng hỗ trợ nếu Quý khách cần thêm thông tin.\nTrân trọng.`;

    document.getElementById('upgradeCustomerContent').textContent = customerMessage;
    document.getElementById('upgradeResult').style.display = 'block';
    showNotification('Đã tính đổi gói!');
}
window.calculateUpgrade = calculateUpgrade;

function copyUpgradeResult() {
    const txt = document.getElementById('upgradeCustomerContent').textContent || '';
    if (!txt) return showNotification('Chưa có kết quả!', 'error');
    navigator.clipboard.writeText(txt).then(() => { showNotification('Đã copy!'); if (typeof showToast === 'function') showToast('Đã copy nội dung gửi khách', 'success'); });
}
window.copyUpgradeResult = copyUpgradeResult;

function refreshUpgradeData() {
    try {
        showNotification('Đang làm mới dữ liệu đổi gói...', 'info');
        if (typeof showToast === 'function') showToast('Đang làm mới...', 'info');
        selectedCurrentProduct = null; selectedNewProduct = null;
        ['currentProductSearch','newProductSearch'].forEach(id => { const i = document.getElementById(id); if (i) i.value = ''; });
        ['currentProductSearchResults','newProductSearchResults'].forEach(id => { const l = document.getElementById(id); if (l) { l.classList.remove('show'); l.innerHTML = ''; l.style.display = 'none'; } });
        document.getElementById('upgradeSelectedProducts')?.setAttribute('style', 'display:none');
        document.getElementById('upgradeResult')?.setAttribute('style', 'display:none');
        updateUpgradeState();
    } catch {}
}
window.refreshUpgradeData = refreshUpgradeData;

function updateUpgradeTab() {
    const has = (appData.products || []).length > 0;
    const emptyState = document.getElementById('upgradeEmptyState');
    const upgradeForm = document.querySelector('.upgrade-form');
    if (emptyState) emptyState.style.display = has ? 'none' : 'block';
    if (upgradeForm) upgradeForm.style.display = has ? 'block' : 'none';
}
window.updateUpgradeTab = updateUpgradeTab;