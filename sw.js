self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('order-pwa-v2').then(cache => {
      return cache.addAll([
        './',
        './index.html',
        './style.css',
        './app.js',
        './manifest.json'
      ]).catch(error => {
        console.log('Cache addAll failed:', error);
        // Continue with installation even if some resources fail to cache
      });
    })
  );
});

self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip external CDN requests to avoid CSP issues
  const url = new URL(event.request.url);
  if (url.hostname !== location.hostname) {
    return; // Let the browser handle external requests normally
  }
  
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        return response;
      }
      
      return fetch(event.request).catch(error => {
        console.log('Fetch failed for:', event.request.url, error);
        // Return a fallback response for failed requests
        if (event.request.url.includes('.css')) {
          return new Response('/* Offline CSS fallback */', {
            headers: { 'Content-Type': 'text/css' }
          });
        }
        if (event.request.url.includes('.js')) {
          return new Response('console.log("Offline JS fallback");', {
            headers: { 'Content-Type': 'application/javascript' }
          });
        }
        // For other resources, just re-throw the error
        throw error;
      });
    })
  );
});

// Handle notification click events
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  // Open the app when notification is clicked
  event.waitUntil(
    clients.matchAll().then(clientList => {
      // If the app is already open, focus it
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      // Otherwise open a new window
      return clients.openWindow('/');
    })
  );
});

// Handle notification close events
self.addEventListener('notificationclose', event => {
  console.log('Notification closed:', event.notification.tag);
});
