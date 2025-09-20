// 🔍 ORDERS DIAGNOSTIC TEST
// Test orders API and database queries to find the issue

const https = require('https');

const BASE_URL = 'https://astrobsm-order-placement-fykxb.ondigitalocean.app';

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function diagnoseOrdersIssue() {
  console.log('🔍 DIAGNOSING ORDERS API ISSUE...\n');

  try {
    // Test 1: Check orders endpoint
    console.log('📋 Testing orders API endpoint...');
    const ordersResult = await makeRequest('/api/orders');
    
    console.log(`📊 Orders API Status: ${ordersResult.status}`);
    console.log(`📊 Response Headers:`, Object.keys(ordersResult.headers));
    
    if (ordersResult.status === 200) {
      console.log(`✅ API Response: ${Array.isArray(ordersResult.data) ? ordersResult.data.length : 'Not an array'} orders`);
      
      if (Array.isArray(ordersResult.data)) {
        if (ordersResult.data.length === 0) {
          console.log('⚠️ ISSUE FOUND: API returns empty array - no orders in database or query issue');
        } else {
          console.log('✅ Orders found in API response');
          console.log('📋 Sample order:', JSON.stringify(ordersResult.data[0], null, 2));
        }
      } else {
        console.log('❌ ISSUE: API response is not an array');
        console.log('📋 Response:', JSON.stringify(ordersResult.data, null, 2));
      }
    } else {
      console.log('❌ ISSUE: Orders API failed');
      console.log('📋 Error response:', JSON.stringify(ordersResult.data, null, 2));
    }

    // Test 2: Check if we can create and verify a test order
    console.log('\n🧪 Testing order creation to verify database...');
    const testOrderPayload = {
      customerData: { 
        name: 'Diagnostic Test Customer', 
        phone: '0800000000', 
        address: 'Test Address' 
      },
      orderData: { 
        delivery_route: 'Test Route',
        preferred_delivery_method: 'Pick-up',
        request_status: 'pending'
      },
      items: [{ 
        product_name: 'Test Product', 
        quantity: 1 
      }]
    };

    const createResult = await makeRequest('/api/orders', {
      method: 'POST',
      body: testOrderPayload
    });

    console.log(`📊 Create Order Status: ${createResult.status}`);
    if (createResult.status === 200 || createResult.status === 201) {
      console.log('✅ Test order created successfully');
      const orderId = createResult.data.order?.id;
      
      if (orderId) {
        // Now test if we can fetch orders again
        console.log('\n🔄 Re-testing orders API after creation...');
        const ordersResult2 = await makeRequest('/api/orders');
        
        if (ordersResult2.status === 200 && Array.isArray(ordersResult2.data)) {
          console.log(`📊 Orders after creation: ${ordersResult2.data.length} orders`);
          
          if (ordersResult2.data.length > 0) {
            console.log('🎉 SUCCESS: Orders are now being returned!');
            console.log('💡 The issue might have been a temporary database connection problem');
          } else {
            console.log('❌ ISSUE PERSISTS: Still no orders returned after successful creation');
          }
        }
      }
    } else {
      console.log('❌ Test order creation failed');
      console.log('📋 Error:', JSON.stringify(createResult.data, null, 2));
    }

  } catch (error) {
    console.error('💥 Diagnostic test failed:', error.message);
  }
}

diagnoseOrdersIssue();