// 🎯 ENHANCED PWA INSTALL BANNER
// More prominent install promotion for better user experience

document.addEventListener('DOMContentLoaded', function() {
  // Check if we're already in standalone mode (installed)
  const isInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                      window.navigator.standalone === true;
  
  if (isInstalled) {
    console.log('✅ App is already installed - skipping install promotion');
    return;
  }
  
  // Check if user has dismissed install banner recently
  const dismissKey = 'astro-bsm-install-dismissed';
  const lastDismissed = localStorage.getItem(dismissKey);
  const daysSinceDismissal = lastDismissed ? 
    Math.floor((Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24)) : 999;
  
  if (daysSinceDismissal < 7) {
    console.log('🚫 Install banner dismissed recently - waiting 7 days');
    return;
  }
  
  let installPromptEvent = null;
  let bannerShown = false;
  
  // Listen for the install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('🎯 Install prompt available - showing enhanced banner');
    e.preventDefault();
    installPromptEvent = e;
    
    if (!bannerShown) {
      showInstallBanner(true);
      bannerShown = true;
    }
  });
  
  // Show install banner
  function showInstallBanner(hasPrompt = false) {
    // Remove existing banner
    const existing = document.getElementById('pwa-install-banner');
    if (existing) existing.remove();
    
    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
        color: white;
        padding: 12px 20px;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 2px 10px rgba(0,123,255,0.3);
        animation: slideDown 0.3s ease-out;
      ">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 24px;">📱</span>
          <div>
            <div style="font-weight: bold; font-size: 16px;">Install ASTRO-BSM App</div>
            <div style="font-size: 13px; opacity: 0.9;">Get faster access and offline features</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          ${hasPrompt ? `
            <button onclick="installPWAFromBanner()" style="
              background: white;
              color: #007bff;
              border: none;
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: bold;
              cursor: pointer;
              font-size: 14px;
            ">Install</button>
          ` : `
            <button onclick="showManualInstallFromBanner()" style="
              background: rgba(255,255,255,0.2);
              color: white;
              border: 1px solid rgba(255,255,255,0.3);
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: bold;
              cursor: pointer;
              font-size: 14px;
            ">How to Install</button>
          `}
          <button onclick="dismissInstallBanner()" style="
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            padding: 4px 8px;
          ">×</button>
        </div>
      </div>
      <style>
        @keyframes slideDown {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
      </style>
    `;
    
    document.body.appendChild(banner);
    
    // Adjust page padding to account for banner
    document.body.style.paddingTop = '70px';
  }
  
  // Install PWA from banner
  window.installPWAFromBanner = async function() {
    if (!installPromptEvent) {
      showManualInstallFromBanner();
      return;
    }
    
    try {
      await installPromptEvent.prompt();
      const result = await installPromptEvent.userChoice;
      
      if (result.outcome === 'accepted') {
        console.log('✅ User installed the app from banner!');
        removeBanner();
      } else {
        console.log('❌ User declined installation from banner');
        dismissInstallBanner(); // Auto-dismiss if declined
      }
    } catch (error) {
      console.error('💥 Install error:', error);
      showManualInstallFromBanner();
    }
  };
  
  // Show manual install instructions
  window.showManualInstallFromBanner = function() {
    const modal = document.createElement('div');
    modal.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      " onclick="this.remove()">
        <div style="
          background: white;
          padding: 30px;
          border-radius: 15px;
          max-width: 500px;
          width: 100%;
          text-align: center;
        " onclick="event.stopPropagation()">
          <h2 style="margin-top: 0; color: #007bff;">📱 Install ASTRO-BSM</h2>
          
          <div style="text-align: left; margin: 20px 0; line-height: 1.6;">
            <div style="margin-bottom: 15px;">
              <strong>🌐 Chrome/Edge:</strong><br>
              • Look for install icon (⬇️) in address bar<br>
              • OR Menu (⋮) → "Install ASTRO-BSM..."
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong>🦊 Firefox:</strong><br>
              • Address bar install icon<br>
              • OR Menu → "Install this site as an app"
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong>📱 Safari (iOS):</strong><br>
              • Tap share button <strong>⤴️</strong><br>
              • Select "Add to Home Screen"
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong>🌐 Samsung Internet:</strong><br>
              • Menu → "Add page to" → "Home screen"
            </div>
          </div>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 14px;">
            <strong>✨ After Installing:</strong><br>
            • Launch from home screen/desktop<br>
            • Works offline with cached orders<br>
            • Faster loading and native app feel
          </div>
          
          <button onclick="this.parentElement.parentElement.remove()" style="
            background: #007bff;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 25px;
            cursor: pointer;
            font-weight: bold;
          ">Got It!</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  };
  
  // Dismiss banner
  window.dismissInstallBanner = function() {
    localStorage.setItem(dismissKey, Date.now().toString());
    removeBanner();
  };
  
  // Remove banner
  function removeBanner() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.style.animation = 'slideUp 0.3s ease-out forwards';
      setTimeout(() => {
        banner.remove();
        document.body.style.paddingTop = '0';
      }, 300);
    }
    
    // Add slideUp animation
    if (!document.getElementById('slideUpStyle')) {
      const style = document.createElement('style');
      style.id = 'slideUpStyle';
      style.textContent = `
        @keyframes slideUp {
          from { transform: translateY(0); }
          to { transform: translateY(-100%); }
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  // Show banner after a short delay if no automatic prompt
  setTimeout(() => {
    if (!installPromptEvent && !bannerShown) {
      console.log('💡 No automatic install prompt - showing manual install banner');
      showInstallBanner(false);
      bannerShown = true;
    }
  }, 2000);
  
  console.log('🎯 Enhanced PWA install banner loaded');
});