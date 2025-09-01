const CACHE_NAME = 'astro-bsm-pwa-v12';
const DATA_CACHE_NAME = 'astro-bsm-data-v11';
const OFFLINE_QUEUE = 'astro-bsm-offline-queue';

const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/html2canvas.min.js',
  '/icon-192.png',
  '/icon-512.png',
  '/public/company_logo.PNG'
];

const API_CACHE_URLS = [
  '/api/products',
  '/api/health'
];

// Handle skip waiting message
self.addEventListener('message', event => {
  if (event.data && event.data.action === 'skipWaiting') {
    console.log('🚀 Skipping waiting and activating new service worker...');
    self.skipWaiting();
  }
});

self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(cache => {
        console.log('Caching app shell');
        return cache.addAll(urlsToCache);
      }),
      caches.open(DATA_CACHE_NAME).then(cache => {
        console.log('Data cache opened');
        return Promise.resolve();
      })
    ])
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Initialize IndexedDB for offline queue
      initOfflineQueue()
    ])
  );
  self.clients.claim();
});

// Initialize IndexedDB for offline order queue
function initOfflineQueue() {
  return new Promise((resolve) => {
    const request = indexedDB.open(OFFLINE_QUEUE, 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('orders')) {
        db.createObjectStore('orders', { keyPath: 'id', autoIncrement: true });
      }
    };
    
    request.onsuccess = () => {
      console.log('Offline queue initialized');
      resolve();
    };
    
    request.onerror = () => {
      console.error('Failed to initialize offline queue');
      resolve(); // Continue anyway
    };
  });
}

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle different request types with appropriate strategies
  if (request.method === 'POST' && url.pathname.includes('/api/orders')) {
    // Handle order submissions with background sync
    event.respondWith(handleOrderSubmission(request));
    return;
  }
  
  if (request.method !== 'GET') {
    // For non-GET requests that aren't order submissions, try network first
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(JSON.stringify({ error: 'Offline - request queued' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 503
        });
      })
    );
    return;
  }
  
  // Handle GET requests based on type
  if (url.pathname.startsWith('/api/')) {
    // API requests: Network first, cache fallback
    event.respondWith(handleApiRequest(request));
  } else {
    // Static assets: Cache first, network fallback
    event.respondWith(handleStaticRequest(request));
  }
});

// Handle order submissions with offline queue
async function handleOrderSubmission(request) {
  try {
    // Try to submit online first
    const response = await fetch(request.clone());
    if (response.ok) {
      console.log('Order submitted successfully online');
      return response;
    }
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('Order submission failed, queuing for later:', error);
    
    // Store order in IndexedDB for later sync
    const orderData = await request.json();
    await queueOfflineOrder(orderData);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Order saved offline and will be submitted when connection is restored',
      offline: true
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 202 // Accepted
    });
  }
}

// Queue order for offline submission
async function queueOfflineOrder(orderData) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_QUEUE, 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['orders'], 'readwrite');
      const store = transaction.objectStore('orders');
      
      const orderWithTimestamp = {
        ...orderData,
        queuedAt: new Date().toISOString(),
        status: 'queued'
      };
      
      store.add(orderWithTimestamp);
      
      transaction.oncomplete = () => {
        console.log('Order queued successfully');
        resolve();
      };
      
      transaction.onerror = () => {
        console.error('Failed to queue order');
        reject();
      };
    };
    
    request.onerror = () => {
      console.error('Failed to open IndexedDB');
      reject();
    };
  });
}

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  try {
    const response = await fetch(request);
    
    // Cache successful API responses
    if (response.ok) {
      const cache = await caches.open(DATA_CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('API request failed, checking cache:', request.url);
    
    // Try to get from cache
    const cache = await caches.open(DATA_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('Serving API data from cache');
      return cachedResponse;
    }
    
    // Return offline fallback for specific APIs
    if (request.url.includes('/api/products')) {
      return new Response(JSON.stringify([]), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    throw error;
  }
}

// Handle static assets with cache-first strategy
async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    console.log('Serving from cache:', request.url);
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    
    // Cache new static assets
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('Failed to fetch:', request.url);
    
    // Return offline fallback for documents
    if (request.destination === 'document') {
      const fallbackResponse = await cache.match('/index.html');
      if (fallbackResponse) {
        return fallbackResponse;
      }
    }
    
    // Return fallback responses for different asset types
    if (request.url.includes('.css')) {
      return new Response('/* Offline CSS fallback */', {
        headers: { 'Content-Type': 'text/css' }
      });
    }
    if (request.url.includes('.js')) {
      return new Response('console.log("Offline JS fallback");', {
        headers: { 'Content-Type': 'application/javascript' }
      });
    }
    
    throw error;
  }
}

// Listen for messages from the main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'SYNC_OFFLINE_ORDERS') {
    syncOfflineOrders();
  }
});

// Background sync for offline orders
self.addEventListener('sync', event => {
  if (event.tag === 'background-order-sync') {
    console.log('Background sync triggered for orders');
    event.waitUntil(syncOfflineOrders());
  }
});

// Sync offline orders when connection is restored
async function syncOfflineOrders() {
  console.log('Syncing offline orders...');
  
  return new Promise((resolve) => {
    const request = indexedDB.open(OFFLINE_QUEUE, 1);
    
    request.onsuccess = async (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['orders'], 'readwrite');
      const store = transaction.objectStore('orders');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = async () => {
        const queuedOrders = getAllRequest.result;
        console.log(`Found ${queuedOrders.length} queued orders`);
        
        let syncedCount = 0;
        
        for (const order of queuedOrders) {
          try {
            const response = await fetch('/api/orders', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(order)
            });
            
            if (response.ok) {
              // Remove successfully synced order
              store.delete(order.id);
              syncedCount++;
              console.log('Order synced successfully:', order.id);
              
              // Notify main thread of successful sync
              self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                  client.postMessage({
                    type: 'ORDER_SYNCED',
                    orderId: order.id,
                    syncedCount,
                    totalQueued: queuedOrders.length
                  });
                });
              });
            }
          } catch (error) {
            console.error('Failed to sync order:', order.id, error);
          }
        }
        
        console.log(`Successfully synced ${syncedCount} orders`);
        resolve();
      };
    };
    
    request.onerror = () => {
      console.error('Failed to access offline queue for sync');
      resolve();
    };
  });
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'order-sync') {
    event.waitUntil(syncOfflineOrders());
  }
});
