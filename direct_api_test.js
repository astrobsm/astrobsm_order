// Direct API test script - bypasses Service Worker caching
// Run this in browser console to test the fixed Customer model

const testDirectAPI = async () => {
    console.log('🧪 Testing direct API call (bypassing Service Worker)...');
    
    // Force a cache-busting request to bypass Service Worker
    const testOrder = {
        customerName: 'Direct API Test',
        customerPhone: '+1234567890',
        customerAddress: '123 Direct Test Street',
        customerCompany: 'Direct Test Co',
        items: [{
            name: 'Test Product',
            quantity: 1,
            price: 25.99
        }]
    };
    
    try {
        // Add cache-busting parameters to bypass Service Worker
        const response = await fetch('/api/orders?' + Date.now(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
            body: JSON.stringify(testOrder)
        });
        
        console.log('📡 Direct API Response Status:', response.status);
        console.log('📡 Direct API Response OK:', response.ok);
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Direct API Success:', result);
            
            // Now test retrieving orders
            const ordersResponse = await fetch('/api/orders?' + Date.now(), {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            if (ordersResponse.ok) {
                const orders = await ordersResponse.json();
                console.log('✅ Orders retrieved:', orders.length);
                console.log('📋 Latest order:', orders[0]);
            } else {
                console.log('❌ Failed to retrieve orders:', ordersResponse.status);
            }
        } else {
            const errorText = await response.text();
            console.log('❌ Direct API Error:', response.status, errorText);
        }
    } catch (error) {
        console.log('❌ Direct API Exception:', error);
    }
};

// Also test server health
const testServerHealth = async () => {
    try {
        const healthResponse = await fetch('/api/health?' + Date.now(), {
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        
        console.log('🏥 Server Health Status:', healthResponse.status);
        
        if (healthResponse.ok) {
            const health = await healthResponse.json();
            console.log('🏥 Server Health:', health);
        }
    } catch (error) {
        console.log('❌ Health check failed:', error);
    }
};

// Run both tests
console.log('🚀 Starting direct API tests...');
testServerHealth();
testDirectAPI();

console.log(`
🧪 Direct API Test Script
========================
This script:
1. Bypasses Service Worker caching
2. Tests direct API calls to the server
3. Checks if the Customer model fix is working
4. Shows real server responses

If you see errors, the Customer.js file needs to be deployed via GitHub.
`);
