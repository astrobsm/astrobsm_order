// 🔧 STANDALONE SERVICE WORKER REGISTRATION
// Guaranteed service worker registration for PWA install

(function() {
  'use strict';
  
  console.log('🔧 Standalone SW registration starting...');
  
  if ('serviceWorker' in navigator) {
    // Register immediately when DOM is ready
    function registerServiceWorker() {
      console.log('📱 Registering service worker...');
      
      navigator.serviceWorker.register('/sw-enhanced.js')
        .then(function(registration) {
          console.log('✅ Service Worker registered successfully:', registration.scope);
          
          // Dispatch custom event to signal SW is ready
          window.dispatchEvent(new CustomEvent('swRegistered', { detail: registration }));
          
          // Check for updates
          registration.addEventListener('updatefound', function() {
            console.log('🔄 Service Worker update found');
          });
        })
        .catch(function(error) {
          console.warn('⚠️ Enhanced SW failed, trying fallback...');
          
          // Try fallback service worker
          return navigator.serviceWorker.register('/sw.js');
        })
        .then(function(registration) {
          if (registration) {
            console.log('✅ Fallback Service Worker registered:', registration.scope);
          }
        })
        .catch(function(error) {
          console.error('❌ Service Worker registration failed:', error);
        });
    }
    
    // Register as soon as possible
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', registerServiceWorker);
    } else {
      registerServiceWorker();
    }
    
  } else {
    console.warn('⚠️ Service Workers not supported in this browser');
  }
  
})();