// Version configuration - Single source of truth
const APP_VERSION = '0.0.0.28';

// Auto-update version in HTML
document.addEventListener('DOMContentLoaded', function() {
    // Update version badge
    const versionBadge = document.getElementById('versionBadge');
    if (versionBadge) {
        versionBadge.textContent = `v${APP_VERSION}`;
    }
    
    // Update CSS version parameter
    const cssLink = document.querySelector('link[href*="styles.css"]');
    if (cssLink) {
        cssLink.href = cssLink.href.replace(/v=\d+\.\d+\.\d+\.\d+/, `v=${APP_VERSION}`);
    }
    
    // Update logo with current config (if config is loaded)
    const logoImg = document.querySelector('.logo-img');
    if (logoImg && window.APP_CONFIG) {
        logoImg.src = window.APP_CONFIG.LOGO.URL_WITH_VERSION;
        logoImg.width = window.APP_CONFIG.LOGO.WIDTH;
        logoImg.height = window.APP_CONFIG.LOGO.HEIGHT;
        logoImg.alt = window.APP_CONFIG.BRANDING.ALT_TEXT;
    }
    
    // Update favicon with current config
    const faviconLinks = document.querySelectorAll('link[rel*="icon"]');
    if (window.APP_CONFIG) {
        faviconLinks.forEach(link => {
            link.href = window.APP_CONFIG.LOGO.URL_WITH_VERSION;
        });
    }

    // Store in localStorage
    localStorage.setItem('pdc_app_version', APP_VERSION);
});

// Export for other modules
window.APP_VERSION = APP_VERSION;
