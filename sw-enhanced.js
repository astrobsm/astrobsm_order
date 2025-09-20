// 🚀 ENHANCED SERVICE WORKER - Advanced caching and offline capabilities
const CACHE_NAME = 'astro-bsm-v2.0';
const STATIC_CACHE = 'astro-bsm-static-v2.0';
const DYNAMIC_CACHE = 'astro-bsm-dynamic-v2.0';
const API_CACHE = 'astro-bsm-api-v2.0';

// Static assets that should be cached immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/auth.js',
  '/user-management.js',
  '/manifest.json',
  '/splash.css',
  '/offline.html',
  '/icon-192.png',
  '/icon-512.png',
  '/thermal-print.css',
  '/public/company_logo.PNG'
];

// API endpoints that should be cached
const API_ENDPOINTS = [
  '/api/products',
  '/api/users/authenticate'
];

// Cache duration settings (in milliseconds)
const CACHE_STRATEGIES = {
  static: 30 * 24 * 60 * 60 * 1000, // 30 days for static assets
  api: 5 * 60 * 1000, // 5 minutes for API responses
  dynamic: 7 * 24 * 60 * 60 * 1000 // 7 days for dynamic content
};

// 📦 INSTALL EVENT - Cache static assets
self.addEventListener('install', event => {
  console.log('🚀 Service Worker installing with enhanced caching...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then(cache => {
        console.log('📦 Caching static assets...');
        return cache.addAll(STATIC_ASSETS).catch(error => {
          console.warn('⚠️ Some static assets failed to cache:', error);
          // Cache individually to avoid complete failure
          return Promise.all(
            STATIC_ASSETS.map(url => 
              cache.add(url).catch(err => console.warn(`Failed to cache ${url}:`, err))
            )
          );
        });
      }),
      
      // Pre-cache API endpoints
      caches.open(API_CACHE).then(cache => {
        console.log('🌐 Pre-caching API endpoints...');
        return Promise.all(
          API_ENDPOINTS.map(url => 
            fetch(url)
              .then(response => response.ok ? cache.put(url, response.clone()) : null)
              .catch(err => console.warn(`Failed to pre-cache ${url}:`, err))
          )
        );
      })
    ]).then(() => {
      console.log('✅ Service Worker installation complete');
      self.skipWaiting(); // Activate immediately
    })
  );
});

// 🔄 ACTIVATE EVENT - Clean up old caches
self.addEventListener('activate', event => {
  console.log('🔄 Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete old caches
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== API_CACHE) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activated');
      return self.clients.claim(); // Take control of all pages immediately
    })
  );
});

// 🌐 FETCH EVENT - Advanced caching strategies
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests and external requests
  if (event.request.method !== 'GET' || url.origin !== location.origin) {
    return;
  }

  // Handle different types of requests with appropriate strategies
  if (isStaticAsset(event.request.url)) {
    // Static assets: Cache First strategy
    event.respondWith(cacheFirst(event.request, STATIC_CACHE));
  } else if (isApiRequest(event.request.url)) {
    // API requests: Network First with cache fallback
    event.respondWith(networkFirstWithCache(event.request, API_CACHE));
  } else if (isNavigationRequest(event.request)) {
    // Navigation requests: Network First with offline fallback
    event.respondWith(navigationHandler(event.request));
  } else {
    // Other requests: Stale While Revalidate
    event.respondWith(staleWhileRevalidate(event.request, DYNAMIC_CACHE));
  }
});

// 🎯 CACHING STRATEGIES

// Cache First - Best for static assets
async function cacheFirst(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse && !isCacheExpired(cachedResponse, CACHE_STRATEGIES.static)) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Cache first fallback for:', request.url);
    return await caches.match(request) || new Response('Asset not available offline');
  }
}

// Network First with Cache - Best for API requests
async function networkFirstWithCache(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('Network first cache fallback for:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse && !isCacheExpired(cachedResponse, CACHE_STRATEGIES.api)) {
      return cachedResponse;
    }
    
    // Return offline API response for critical endpoints
    if (request.url.includes('/api/products')) {
      return new Response(JSON.stringify([]), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      });
    }
    
    throw error;
  }
}

// Navigation Handler - For page requests
async function navigationHandler(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('Navigation offline fallback for:', request.url);
    
    // Try cached version first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to main page or offline page
    const mainPage = await caches.match('/');
    if (mainPage) {
      return mainPage;
    }
    
    // Final fallback to offline page
    return await caches.match('/offline.html') || new Response(
      '<h1>Offline</h1><p>Please check your internet connection.</p>', 
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}

// Stale While Revalidate - Best for dynamic content
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await caches.match(request);
  
  // Start network request in background
  const networkRequest = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);

  // Return cached version immediately if available
  if (cachedResponse && !isCacheExpired(cachedResponse, CACHE_STRATEGIES.dynamic)) {
    networkRequest; // Let it continue in background
    return cachedResponse;
  }

  // Wait for network if no cache or cache expired
  return await networkRequest || cachedResponse || new Response('Content not available offline');
}

// 🔍 HELPER FUNCTIONS

function isStaticAsset(url) {
  return /\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)(\?.*)?$/.test(url) ||
         url.includes('manifest.json') || 
         url.includes('offline.html');
}

function isApiRequest(url) {
  return url.includes('/api/');
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('accept') && 
          request.headers.get('accept').includes('text/html'));
}

function isCacheExpired(cachedResponse, maxAge) {
  const cachedDate = cachedResponse.headers.get('sw-cached-date');
  if (!cachedDate) return false;
  
  const cacheTime = new Date(cachedDate).getTime();
  const now = Date.now();
  return (now - cacheTime) > maxAge;
}

// 📢 PUSH NOTIFICATION HANDLING
self.addEventListener('push', event => {
  console.log('📢 Push notification received:', event);
  
  let notificationData = {
    title: 'ASTRO-BSM Order Update',
    body: 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'order-update',
    data: { url: '/' }
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      console.log('Failed to parse notification data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('🔔 Notification clicked:', event);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// 🔄 BACKGROUND SYNC (for offline order submission)
self.addEventListener('sync', event => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'order-sync') {
    event.waitUntil(syncOfflineOrders());
  }
});

async function syncOfflineOrders() {
  try {
    // This would sync any orders stored offline
    console.log('🔄 Syncing offline orders...');
    
    // Get offline orders from IndexedDB or cache
    // Send them to server when connection is restored
    // This is a placeholder for future implementation
    
    return Promise.resolve();
  } catch (error) {
    console.error('Failed to sync offline orders:', error);
    throw error;
  }
}

console.log('📱 Enhanced Service Worker loaded with advanced caching strategies');