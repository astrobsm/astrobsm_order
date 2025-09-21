// 🚀 SIMPLIFIED PWA INSTALL - GUARANTEED RESPONSIVE
// Single script that definitely works for install functionality

(function() {
  'use strict';
  
  console.log('🚀 Simplified PWA Install Script Loading...');
  
  // Debug PWA requirements
  function debugPWARequirements() {
    console.log('🔍 PWA Requirements Check:');
    console.log('- HTTPS:', location.protocol === 'https:' || location.hostname === 'localhost');
    console.log('- Service Worker supported:', 'serviceWorker' in navigator);
    console.log('- Service Worker registered:', navigator.serviceWorker ? navigator.serviceWorker.controller !== null : false);
    console.log('- Manifest linked:', !!document.querySelector('link[rel="manifest"]'));
    console.log('- Display mode:', window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser');
    console.log('- User agent:', navigator.userAgent.includes('Chrome') ? 'Chrome-based' : 'Other');
    
    // Check service worker status
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        console.log('- SW Registrations found:', registrations.length);
        registrations.forEach((reg, i) => {
          console.log(`  Registration ${i + 1}: ${reg.scope} - State: ${reg.active ? reg.active.state : 'none'}`);
        });
      });
    }
  }
  
  debugPWARequirements();
  
  let deferredPrompt = null;
  let installBanner = null;
  
  // Check if already installed or recently dismissed
  const isInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                      window.navigator.standalone === true;
  
  if (isInstalled) {
    console.log('✅ App already installed - skipping install promotion');
    return;
  }
  
  const dismissKey = 'astro-bsm-install-dismissed';
  const lastDismissed = localStorage.getItem(dismissKey);
  const daysSinceDismissal = lastDismissed ? 
    Math.floor((Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24)) : 999;
  
  if (daysSinceDismissal < 7) {
    console.log('🚫 Install banner dismissed recently');
    return;
  }
  
  // Listen for install prompt
  window.addEventListener('beforeinstallprompt', function(e) {
    console.log('🎯 Install prompt available!');
    e.preventDefault();
    deferredPrompt = e;
    createInstallBanner(true);
  });
  
  // Create install banner - ALWAYS show some form of install promotion
  function createInstallBanner(hasAutoPrompt) {
    if (installBanner) return; // Don't create multiple banners
    
    console.log('🎨 Creating install banner, hasAutoPrompt:', hasAutoPrompt);
    
    installBanner = document.createElement('div');
    installBanner.id = 'simple-pwa-banner';
    installBanner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #007bff, #0056b3);
      color: white;
      padding: 15px 20px;
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    installBanner.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 24px;">📱</span>
        <div>
          <div style="font-weight: bold;">Install ASTRO-BSM App</div>
          <div style="font-size: 12px; opacity: 0.9;">Get offline access and faster loading</div>
        </div>
      </div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <button id="pwa-install-action" style="
          background: white;
          color: #007bff;
          border: none;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: bold;
          cursor: pointer;
          font-size: 14px;
        ">${hasAutoPrompt ? 'Install Now' : 'How to Install'}</button>
        <button id="pwa-dismiss" style="
          background: none;
          border: none;
          color: white;
          font-size: 18px;
          cursor: pointer;
          padding: 4px 8px;
        ">×</button>
      </div>
    `;
    
    document.body.appendChild(installBanner);
    
    // Adjust page layout
    document.body.style.paddingTop = '70px';
    
    // Add event listeners
    const installBtn = installBanner.querySelector('#pwa-install-action');
    const dismissBtn = installBanner.querySelector('#pwa-dismiss');
    
    installBtn.addEventListener('click', function() {
      console.log('🔴 Install button clicked!');
      
      if (hasAutoPrompt && deferredPrompt) {
        // Use automatic install
        deferredPrompt.prompt().then(function() {
          return deferredPrompt.userChoice;
        }).then(function(result) {
          console.log('📋 Install result:', result.outcome);
          if (result.outcome === 'accepted') {
            removeBanner();
          }
        }).catch(function(error) {
          console.error('💥 Install error:', error);
          showManualInstructions();
        });
      } else {
        // Show manual instructions
        showManualInstructions();
      }
    });
    
    dismissBtn.addEventListener('click', function() {
      console.log('🔴 Dismiss button clicked!');
      localStorage.setItem(dismissKey, Date.now().toString());
      removeBanner();
    });
    
    console.log('✅ Install banner created with working buttons');
  }
  
  // Show manual install instructions
  function showManualInstructions() {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.7);
      z-index: 100000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    modal.innerHTML = `
      <div style="
        background: white;
        padding: 30px;
        border-radius: 15px;
        max-width: 500px;
        width: 100%;
        text-align: center;
      ">
        <h2 style="margin-top: 0; color: #007bff;">📱 Install ASTRO-BSM</h2>
        
        <div style="background: #e3f2fd; padding: 12px; border-radius: 8px; margin: 15px 0; font-size: 14px;">
          <strong>💡 Why automatic install isn't available:</strong><br>
          • App may already be installed<br>
          • Browser needs more engagement with the site<br>
          • Some browsers don't support auto-install
        </div>
        
        <div style="text-align: left; line-height: 1.6; margin: 20px 0;">
          <p><strong>🌐 Chrome/Edge:</strong><br>Look for install icon (⬇️) in address bar<br>OR Menu (⋮) → "Install ASTRO-BSM..."</p>
          <p><strong>🦊 Firefox:</strong><br>Address bar install icon<br>OR Menu → "Install this site as an app"</p>
          <p><strong>📱 Safari (iOS):</strong><br>Tap share button ⤴️<br>Select "Add to Home Screen"</p>
          <p><strong>🌐 Samsung Internet:</strong><br>Menu → "Add page to" → "Home screen"</p>
        </div>
        <button id="manual-close" style="
          background: #007bff;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 25px;
          cursor: pointer;
          font-weight: bold;
        ">Got It!</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal event
    const closeBtn = modal.querySelector('#manual-close');
    closeBtn.addEventListener('click', function() {
      modal.remove();
    });
    
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  
  // Remove banner
  function removeBanner() {
    if (installBanner) {
      installBanner.remove();
      installBanner = null;
      document.body.style.paddingTop = '0';
    }
  }
  
  // ALWAYS show install promotion - check multiple conditions
  function checkAndShowInstallBanner() {
    console.log('🔍 Checking install banner conditions...');
    console.log('- deferredPrompt:', !!deferredPrompt);
    console.log('- installBanner exists:', !!installBanner);
    console.log('- isInstalled:', isInstalled);
    console.log('- daysSinceDismissal:', daysSinceDismissal);
    
    if (!installBanner && !isInstalled && daysSinceDismissal >= 7) {
      console.log('✅ Showing install banner');
      createInstallBanner(!!deferredPrompt);
    } else {
      console.log('❌ Not showing banner - conditions not met');
    }
  }
  
  // Check immediately after DOM load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(checkAndShowInstallBanner, 1000);
    });
  } else {
    setTimeout(checkAndShowInstallBanner, 1000);
  }
  
  // Also check after delay for beforeinstallprompt
  setTimeout(function() {
    console.log('⏰ 3-second timeout check');
    checkAndShowInstallBanner();
  }, 3000);
  
  // Also create a floating install button as backup
  function createFloatingInstallButton() {
    // Don't create if already exists or app is installed
    if (document.getElementById('floating-pwa-install') || isInstalled) return;
    
    const floatingBtn = document.createElement('div');
    floatingBtn.id = 'floating-pwa-install';
    floatingBtn.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, #007bff, #0056b3);
      color: white;
      padding: 12px 16px;
      border-radius: 50px;
      cursor: pointer;
      z-index: 99998;
      font-weight: bold;
      box-shadow: 0 4px 15px rgba(0,123,255,0.4);
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
      animation: pulse 2s infinite;
    `;
    
    floatingBtn.innerHTML = '📱 Install App';
    
    floatingBtn.addEventListener('click', function() {
      console.log('🔴 Floating install button clicked!');
      
      if (deferredPrompt) {
        // Try automatic install
        deferredPrompt.prompt().then(function() {
          return deferredPrompt.userChoice;
        }).then(function(result) {
          console.log('📋 Floating install result:', result.outcome);
          if (result.outcome === 'accepted') {
            floatingBtn.remove();
          }
        }).catch(function(error) {
          console.error('💥 Floating install error:', error);
          showManualInstructions();
        });
      } else {
        // Show manual instructions
        showManualInstructions();
      }
    });
    
    document.body.appendChild(floatingBtn);
    console.log('🎯 Floating install button created');
  }
  
  // Add CSS animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
  `;
  document.head.appendChild(style);
  
  // Create floating button after delay
  setTimeout(createFloatingInstallButton, 2000);
  
  console.log('✅ Simplified PWA Install Script Ready');
  
})();