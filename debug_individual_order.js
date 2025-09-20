// 🔧 DEBUG INDIVIDUAL ORDER FETCH
// Test the Order.findById method directly against the production database

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

async function debugIndividualOrder() {
  console.log('🐛 DEBUGGING INDIVIDUAL ORDER FETCH\n');

  try {
    // First get any order ID
    console.log('📋 Getting orders list...');
    const ordersResult = await makeRequest('/api/orders');
    
    if (ordersResult.status === 200 && Array.isArray(ordersResult.data) && ordersResult.data.length > 0) {
      const testOrderId = ordersResult.data[0].id;
      console.log(`✅ Using order ID: ${testOrderId}`);
      
      // Test the problematic endpoint
      console.log('\n🔍 Testing individual order fetch...');
      const individualResult = await makeRequest(`/api/orders/${testOrderId}`);
      
      console.log(`📊 Status: ${individualResult.status}`);
      console.log('📋 Response:', JSON.stringify(individualResult.data, null, 2));
      
      if (individualResult.status === 500) {
        console.log('\n❌ 500 Error detected - checking error details...');
        console.log('🔧 This is likely a database schema mismatch in the findById method');
        console.log('🔧 The dynamic schema detection may have issues with JOIN queries');
      }
    } else {
      console.log('❌ Could not get orders list to test individual fetch');
    }

  } catch (error) {
    console.error('💥 Debug failed:', error.message);
  }
}

debugIndividualOrder();