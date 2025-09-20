// 🧪 TEST ORDERS ENDPOINT FUNCTIONALITY
// Verify that individual order fetching works after the fix

const https = require('https');

const BASE_URL = 'https://astrobsm-order-placement-fykxb.ondigitalocean.app';

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = BASE_URL + path;
    console.log(`🔗 Making request to: ${path}`);
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(url, requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed
          });
        } catch (parseError) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testOrdersEndpoint() {
  console.log('🧪 TESTING ORDERS ENDPOINT FUNCTIONALITY\n');

  try {
    // Test 1: Get orders list
    console.log('📋 Testing orders list endpoint...');
    const ordersResult = await makeRequest('/api/orders');
    
    console.log(`📊 Orders API Status: ${ordersResult.status}`);
    
    if (ordersResult.status === 200 && Array.isArray(ordersResult.data)) {
      console.log(`✅ Orders API: ${ordersResult.data.length} orders returned`);
      
      if (ordersResult.data.length > 0) {
        const sampleOrder = ordersResult.data[0];
        console.log(`✅ Sample order ID: ${sampleOrder.id}`);
        console.log(`✅ Customer name: ${sampleOrder.customer_name || 'N/A'}`);
        
        // Test 2: Get individual order details
        console.log(`\n📋 Testing individual order fetch for order ${sampleOrder.id}...`);
        const individualResult = await makeRequest(`/api/orders/${sampleOrder.id}`);
        
        console.log(`📊 Individual Order Status: ${individualResult.status}`);
        
        if (individualResult.status === 200) {
          console.log(`✅ Individual order fetch successful!`);
          console.log(`✅ Order has ${individualResult.data.items ? individualResult.data.items.length : 0} items`);
          
          if (individualResult.data.items && individualResult.data.items.length > 0) {
            const item = individualResult.data.items[0];
            console.log(`✅ Sample item: ${item.product_name || 'Unknown'} x${item.quantity || 0}`);
          }
          
          console.log('\n🎉 SUCCESS: Individual order fetching is working correctly!');
        } else {
          console.log(`❌ Individual order fetch failed: ${individualResult.status}`);
          console.log('📋 Error response:', JSON.stringify(individualResult.data, null, 2));
        }
      } else {
        console.log('ℹ️ No orders in database to test individual fetching');
      }
    } else {
      console.log('❌ Orders API failed or returned invalid data');
      console.log('📋 Response:', JSON.stringify(ordersResult.data, null, 2));
    }

    // Test 3: Check for any 404 errors in console
    console.log('\n🔍 Endpoint functionality test completed');
    console.log('✅ If no errors above, the orders endpoints are working correctly');
    console.log('🌐 Check the production app for improved order details display');

  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
  }
}

testOrdersEndpoint();