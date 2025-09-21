// 📱 PWA INSTALL DIAGNOSTIC
// Check why the install prompt isn't showing and fix it

document.addEventListener('DOMContentLoaded', function() {
  console.log('🔍 PWA Install Diagnostic Running...');
  
  // Check PWA compatibility
  console.log('📋 PWA Compatibility Check:');
  console.log('- Service Worker supported:', 'serviceWorker' in navigator);
  console.log('- Manifest supported:', 'manifest' in document.head.querySelector('link[rel="manifest"]') || false);
  console.log('- Is HTTPS:', location.protocol === 'https:');
  console.log('- Is localhost:', location.hostname === 'localhost' || location.hostname === '127.0.0.1');
  
  // Check if already installed
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isIOSStandalone = window.navigator.standalone === true;
  console.log('- Already installed (standalone):', isStandalone || isIOSStandalone);
  
  // Enhanced beforeinstallprompt listener
  let installPromptEvent = null;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('✅ beforeinstallprompt event fired!');
    e.preventDefault();
    installPromptEvent = e;
    
    // Show install button immediately
    showEnhancedInstallButton(e);
  });
  
  // Create enhanced install button
  function showEnhancedInstallButton(promptEvent) {
    // Remove any existing install button
    const existingBtn = document.getElementById('enhanced-install-btn');
    if (existingBtn) existingBtn.remove();
    
    // Create new install button
    const installBtn = document.createElement('div');
    installBtn.id = 'enhanced-install-btn';
    installBtn.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #007bff, #0056b3);
        color: white;
        padding: 15px 20px;
        border-radius: 50px;
        box-shadow: 0 4px 20px rgba(0,123,255,0.3);
        cursor: pointer;
        z-index: 10000;
        font-weight: bold;
        animation: installPulse 2s infinite;
        display: flex;
        align-items: center;
        gap: 8px;
      ">
        <span style="font-size: 20px;">📱</span>
        <span>Install App</span>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          margin-left: 10px;
          cursor: pointer;
        ">×</button>
      </div>
      <style>
        @keyframes installPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      </style>
    `;
    
    installBtn.onclick = async function(event) {
      if (event.target.tagName === 'BUTTON') return; // Don't trigger on close button
      
      try {
        console.log('🚀 Triggering install prompt...');
        await promptEvent.prompt();
        const result = await promptEvent.userChoice;
        console.log('📋 Install result:', result.outcome);
        
        if (result.outcome === 'accepted') {
          console.log('✅ User accepted installation!');
          installBtn.remove();
        } else {
          console.log('❌ User declined installation');
        }
      } catch (error) {
        console.error('💥 Install error:', error);
      }
    };
    
    document.body.appendChild(installBtn);
    console.log('✅ Enhanced install button created!');
  }
  
  // Manual trigger for testing
  window.triggerInstallPrompt = function() {
    console.log('🧪 Manual install trigger...');
    if (installPromptEvent) {
      showEnhancedInstallButton(installPromptEvent);
    } else {
      console.log('❌ No install prompt event available');
      
      // Show alternative install instructions
      showManualInstallInstructions();
    }
  };
  
  // Manual install instructions
  function showManualInstallInstructions() {
    const instructions = document.createElement('div');
    instructions.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 30px;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 10001;
        max-width: 400px;
        text-align: center;
      ">
        <h3>📱 Install ASTRO-BSM App</h3>
        <div style="text-align: left; margin: 20px 0;">
          <p><strong>Chrome/Edge:</strong><br>
          • Click the menu (⋮)<br>
          • Select "Install ASTRO-BSM..."</p>
          
          <p><strong>Safari (iOS):</strong><br>
          • Tap the share button<br>
          • Select "Add to Home Screen"</p>
          
          <p><strong>Samsung Internet:</strong><br>
          • Tap the menu<br>
          • Select "Add page to" → "Home screen"</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
        ">Got it!</button>
      </div>
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 10000;
      " onclick="this.parentElement.remove()"></div>
    `;
    
    document.body.appendChild(instructions);
  }
  
  // Check after 3 seconds if no prompt appeared
  setTimeout(() => {
    if (!installPromptEvent) {
      console.log('⚠️ No beforeinstallprompt event fired after 3 seconds');
      console.log('💡 This could be because:');
      console.log('  - App is already installed');
      console.log('  - Browser doesn\'t support PWA install');
      console.log('  - Manifest.json has issues');
      console.log('  - Service worker not registered');
      
      // Show manual install option anyway
      const manualBtn = document.createElement('div');
      manualBtn.innerHTML = `
        <div style="
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: #28a745;
          color: white;
          padding: 12px 16px;
          border-radius: 25px;
          cursor: pointer;
          z-index: 10000;
          font-size: 14px;
        " onclick="triggerInstallPrompt()">
          📱 Install Options
        </div>
      `;
      document.body.appendChild(manualBtn);
    }
  }, 3000);
  
  console.log('✅ PWA Install Diagnostic Complete!');
  console.log('💡 Try triggerInstallPrompt() in console to test');
});