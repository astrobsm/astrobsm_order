// Cache-busting script - Run this in console to force refresh
// Copy and paste this into browser console on your live site

console.log('🔄 ASTRO-BSM Cache Buster v14 - Force Refresh Script');

function forceCacheClear() {
  console.log('🧹 Clearing all caches...');
  
  // Clear all storage
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      for(let registration of registrations) {
        console.log('🗑️ Unregistering service worker...');
        registration.unregister();
      }
    });
  }
  
  // Clear all caches
  if ('caches' in window) {
    caches.keys().then(function(cacheNames) {
      cacheNames.forEach(function(cacheName) {
        console.log('🗑️ Deleting cache:', cacheName);
        caches.delete(cacheName);
      });
    });
  }
  
  // Clear localStorage and sessionStorage
  localStorage.clear();
  sessionStorage.clear();
  console.log('🗑️ Cleared local storage');
  
  // Force reload with cache busting
  console.log('🔄 Force reloading page...');
  setTimeout(() => {
    window.location.href = window.location.protocol + '//' + window.location.host + window.location.pathname + '?v=14&t=' + Date.now() + '&bust=' + Math.random();
  }, 1000);
}

// Auto-run cache clear
forceCacheClear();

console.log(`
🚨 EMERGENCY CACHE CLEAR COMPLETE!

The page will reload automatically in 1 second with:
- All service workers unregistered
- All caches cleared
- Fresh app.js v14 loaded
- DOM fixes applied

If you still see v12 in errors, try:
1. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. Open DevTools → Application → Storage → Clear Site Data
3. Close and reopen browser tab
`);
