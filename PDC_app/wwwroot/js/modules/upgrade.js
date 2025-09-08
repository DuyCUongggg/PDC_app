// ===== UPGRADE MODULE =====
let selectedCurrentProduct = null;
let selectedNewProduct = null;

(function initUpgrade() {
    // Current product search
    const currentSearch = document.getElementById('currentProductSearch');
    currentSearch?.addEventListener('input', () => { 
        searchProducts(currentSearch.value, 'currentProductSearchResults', 'selectCurrentProduct'); 
        selectedCurrentProduct = null; 
        updateUpgradeState(); 
        updateUpgradeDisplay(); 
    });
    
    // New product search
    const newSearch = document.getElementById('newProductSearch');
    newSearch?.addEventListener('input', () => { 
        searchProducts(newSearch.value, 'newProductSearchResults', 'selectNewProduct'); 
        selectedNewProduct = null; 
        updateUpgradeState(); 
        updateUpgradeDisplay(); 
    });
    
    // Date inputs
    ['upgradeStartDate', 'upgradeEndDate'].forEach(id => 
        document.getElementById(id)?.addEventListener('change', updateUpgradeState)
    );
    
    // Set default dates
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 7);
    
    document.getElementById('upgradeStartDate').value = startDate.toISOString().slice(0, 10);
    document.getElementById('upgradeEndDate').value = today.toISOString().slice(0, 10);
})();

function selectCurrentProduct(id) {
    selectedCurrentProduct = (appData.products || []).find(p => p.id === id) || null;
    document.getElementById('currentProductSearch').value = selectedCurrentProduct?.name || '';
    document.getElementById('currentProductSearchResults').classList.remove('show');
    updateUpgradeDisplay();
    updateUpgradeState();
}
window.selectCurrentProduct = selectCurrentProduct;

function selectNewProduct(id) {
    selectedNewProduct = (appData.products || []).find(p => p.id === id) || null;
    document.getElementById('newProductSearch').value = selectedNewProduct?.name || '';
    document.getElementById('newProductSearchResults').classList.remove('show');
    updateUpgradeDisplay();
    updateUpgradeState();
}
window.selectNewProduct = selectNewProduct;

function updateUpgradeState() {
    const ok = !!(selectedCurrentProduct && selectedNewProduct && 
                  document.getElementById('upgradeStartDate').value && 
                  document.getElementById('upgradeEndDate').value);
    document.getElementById('upgradeBtn').disabled = !ok;
}

function updateUpgradeDisplay() {
    const box = document.getElementById('upgradeSelectedProducts');
    if (!selectedCurrentProduct || !selectedNewProduct) { 
        if (box) box.style.display = 'none'; 
        return; 
    }
    
    if (box) box.style.display = 'block';
    
    // Update current product
    document.getElementById('currentProductName').textContent = selectedCurrentProduct.name;
    document.getElementById('currentProductPrice').textContent = formatPrice(selectedCurrentProduct.price) + 'đ';
    document.getElementById('currentProductDuration').textContent = `${selectedCurrentProduct.duration} ${selectedCurrentProduct.durationUnit}`;
    
    // Update new product
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

    // Calculate days used
    const daysUsed = Math.ceil((endDate - startDate) / (1000 * 3600 * 24));
    
    // Convert durations to days
    let currentTotalDays = selectedCurrentProduct.duration;
    if (selectedCurrentProduct.durationUnit === 'tháng') currentTotalDays *= 30;
    
    let newTotalDays = selectedNewProduct.duration;
    if (selectedNewProduct.durationUnit === 'tháng') newTotalDays *= 30;
    
    // Calculate remaining days for current product
    const remainingDays = currentTotalDays - daysUsed;
    
    if (remainingDays <= 0) {
        showNotification('Gói hiện tại đã hết hạn!', 'error');
        return;
    }
    
    // Calculate refund amount for current product
    const refundAmount = Math.round((remainingDays / currentTotalDays) * selectedCurrentProduct.price);
    
    // Calculate cost for new product
    const newProductCost = selectedNewProduct.price;
    
    // Calculate amount to pay
    const amountToPay = newProductCost - refundAmount;
    
    // Display results
    document.getElementById('upgradeBreakdown').innerHTML = `
        <div class="calc-row">
            <span class="calc-label">📦 Gói hiện tại:</span>
            <span class="calc-value">${selectedCurrentProduct.name}</span>
        </div>
        <div class="calc-row">
            <span class="calc-label">💰 Giá gói hiện tại:</span>
            <span class="calc-value">${formatPrice(selectedCurrentProduct.price)}đ</span>
        </div>
        <div class="calc-row">
            <span class="calc-label">⏰ Đã sử dụng:</span>
            <span class="calc-value">${daysUsed} ngày</span>
        </div>
        <div class="calc-row">
            <span class="calc-label">📅 Còn lại:</span>
            <span class="calc-value">${remainingDays} ngày</span>
        </div>
        <div class="calc-row">
            <span class="calc-label">💸 Hoàn tiền gói cũ:</span>
            <span class="calc-value text-success">${formatPrice(refundAmount)}đ</span>
        </div>
        <div class="calc-row">
            <span class="calc-label">🆕 Gói mới:</span>
            <span class="calc-value">${selectedNewProduct.name}</span>
        </div>
        <div class="calc-row">
            <span class="calc-label">💰 Giá gói mới:</span>
            <span class="calc-value">${formatPrice(selectedNewProduct.price)}đ</span>
        </div>
        <div class="calc-row">
            <span class="calc-label">🧮 SỐ TIỀN CẦN BÙ:</span>
            <span class="calc-value ${amountToPay > 0 ? 'text-danger' : 'text-success'}">${formatPrice(Math.abs(amountToPay))}đ</span>
        </div>
    `;
    
    // Generate customer message
    const customerMessage = amountToPay > 0 ? 
        `🔄 THÔNG TIN ĐỔI GÓI\n\n📦 Gói hiện tại: ${selectedCurrentProduct.name}\n📅 Đã sử dụng: ${daysUsed} ngày (từ ${startDate.toLocaleDateString('vi-VN')})\n💸 Hoàn tiền: ${formatPrice(refundAmount)}đ\n\n🆕 Gói mới: ${selectedNewProduct.name}\n💰 Giá gói mới: ${formatPrice(selectedNewProduct.price)}đ\n\n🧮 SỐ TIỀN CẦN BÙ: ${formatPrice(amountToPay)}đ\n\n✅ Vui lòng thanh toán số tiền trên để hoàn tất đổi gói.` :
        `🔄 THÔNG TIN ĐỔI GÓI\n\n📦 Gói hiện tại: ${selectedCurrentProduct.name}\n📅 Đã sử dụng: ${daysUsed} ngày (từ ${startDate.toLocaleDateString('vi-VN')})\n💸 Hoàn tiền: ${formatPrice(refundAmount)}đ\n\n🆕 Gói mới: ${selectedNewProduct.name}\n💰 Giá gói mới: ${formatPrice(selectedNewProduct.price)}đ\n\n🎉 HOÀN TIỀN THỪA: ${formatPrice(Math.abs(amountToPay))}đ\n\n✅ Chúng tôi sẽ hoàn lại số tiền thừa cho bạn.`;
    
    document.getElementById('upgradeCustomerContent').textContent = customerMessage;
    document.getElementById('upgradeResult').style.display = 'block';
    showNotification('Đã tính đổi gói!');
}
window.calculateUpgrade = calculateUpgrade;

function copyUpgradeResult() {
    const txt = document.getElementById('upgradeCustomerContent').textContent || '';
    if (!txt) return showNotification('Chưa có kết quả!', 'error');
    navigator.clipboard.writeText(txt).then(() => showNotification('Đã copy!'));
}
window.copyUpgradeResult = copyUpgradeResult;

function updateUpgradeTab() {
    const has = (appData.products || []).length > 0;
    const emptyState = document.getElementById('upgradeEmptyState');
    const upgradeForm = document.querySelector('.upgrade-form');
    
    if (emptyState) emptyState.style.display = has ? 'none' : 'block';
    if (upgradeForm) upgradeForm.style.display = has ? 'block' : 'none';
}
window.updateUpgradeTab = updateUpgradeTab;
