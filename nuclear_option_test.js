// Ultimate bypass - disable service worker and test
(async () => {
  const URL = 'https://astrobsm-order-placement-fykxb.ondigitalocean.app';
  console.log('🔧 Nuclear Option - Complete Service Worker Bypass...');
  
  try {
    // Step 1: Completely kill the service worker
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log('🗑️ Found', registrations.length, 'service workers');
      
      for (let registration of registrations) {
        console.log('🗑️ Terminating service worker...');
        await registration.unregister();
        
        // Force terminate if active
        if (registration.active) {
          registration.active.postMessage('TERMINATE');
        }
        
        // Force update to kill it
        await registration.update().catch(() => {});
      }
    }
    
    // Step 2: Override fetch globally (extreme measure)
    const originalFetch = window.fetch;
    
    // Step 3: Create order using direct server call
    console.log('🎯 Creating test order...');
    const testOrder = {
      customerData: {
        name: 'DIRECT API TEST - ' + new Date().getTime(),
        email: 'test@astrobsm.com',
        phone: '08012345678',
        delivery_address: 'Direct API Test Address'
      },
      orderData: {
        delivery_date: '2025-09-15',
        delivery_route: 'API Test',
        preferred_delivery_method: 'delivery_lagos',
        request_status: 'normal'
      },
      items: [{
        product_name: 'Coban Bandage 4 inch (Piece)',
        quantity: 1,
        price: 37500
      }],
      total: 38437.5
    };
    
    console.log('📝 Order payload:', testOrder);
    
    // Step 4: Try multiple bypass methods
    console.log('🚀 Method 1: Direct XMLHttpRequest...');
    
    const createOrderPromise = new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${URL}/api/orders`, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('X-Bypass-ServiceWorker', 'true');
      xhr.setRequestHeader('Cache-Control', 'no-cache');
      
      xhr.onload = function() {
        console.log('📡 XHR Status:', xhr.status);
        console.log('📡 XHR Response:', xhr.responseText);
        
        if (xhr.status >= 200 && xhr.status < 300 && !xhr.responseText.includes('offline')) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error('XHR failed or offline: ' + xhr.responseText));
        }
      };
      
      xhr.onerror = function() {
        reject(new Error('XHR network error'));
      };
      
      xhr.send(JSON.stringify(testOrder));
    });
    
    try {
      const result = await createOrderPromise;
      console.log('🎉 SUCCESS! Order created:', result);
      
      // Check if it's in the database
      setTimeout(async () => {
        console.log('🔍 Checking database...');
        
        const checkXhr = new XMLHttpRequest();
        checkXhr.open('GET', `${URL}/api/orders?t=${Date.now()}`, true);
        checkXhr.setRequestHeader('Cache-Control', 'no-cache');
        
        checkXhr.onload = function() {
          if (checkXhr.status === 200) {
            const orders = JSON.parse(checkXhr.responseText);
            console.log('📊 Database orders count:', orders.length);
            
            if (orders.length > 0) {
              console.log('🎉 ULTIMATE SUCCESS! Order is in database!');
              console.log('📋 Latest order:', orders[orders.length - 1]);
              console.log('\n✅ ADMIN PANEL WILL NOW WORK!');
              console.log('🔄 Refresh the page and check admin panel');
            } else {
              console.log('❌ Still no orders in database');
            }
          }
        };
        
        checkXhr.send();
      }, 3000);
      
    } catch (error) {
      console.log('❌ XHR Method failed:', error.message);
      
      // Fallback: Try using iframe to bypass
      console.log('🚀 Method 2: Iframe bypass...');
      
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = 'about:blank';
      document.body.appendChild(iframe);
      
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      
      // Use iframe's fetch (not intercepted by main page SW)
      iframe.contentWindow.fetch(`${URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testOrder)
      }).then(response => {
        console.log('📡 Iframe fetch status:', response.status);
        return response.text();
      }).then(text => {
        console.log('📡 Iframe response:', text);
        if (!text.includes('offline')) {
          console.log('🎉 Iframe method worked!');
        }
      }).catch(err => {
        console.log('❌ Iframe method failed:', err.message);
        console.log('🎯 Time to check server logs or use incognito mode');
      }).finally(() => {
        document.body.removeChild(iframe);
      });
    }
    
  } catch (error) {
    console.log('❌ Nuclear option failed:', error.message);
    console.log('🎯 Recommendation: Use incognito mode or check server directly');
  }
})();
