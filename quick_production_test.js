// 🎯 QUICK PRODUCTION VERIFICATION TEST
// Tests the critical order submission fix

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
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
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

async function testProductionFix() {
  console.log('🚀 Testing production order submission fix...\n');

  try {
    // 1. Test products loading
    console.log('📦 Testing products API...');
    const productsResult = await makeRequest('/api/products');
    
    if (productsResult.status === 200 && Array.isArray(productsResult.data)) {
      console.log(`✅ Products loaded: ${productsResult.data.length} products available`);
      
      if (productsResult.data.length === 0) {
        console.log('❌ No products available for order testing');
        return;
      }
      
      const testProduct = productsResult.data[0];
      console.log(`📦 Using product: ${testProduct.name} (ID: ${testProduct.id})`);

      // 2. Test order submission with the fix
      console.log('\n🛒 Testing order submission...');
      const orderPayload = {
        userRole: 'customer',
        customerData: { 
          name: 'Production Test Customer', 
          phone: '0801234567', 
          address: 'Test Address Lagos' 
        },
        orderData: { 
          delivery_route: 'Lagos Mainland',
          preferred_delivery_method: 'Pick-up',
          request_status: 'pending'
        },
        items: [{ 
          product_name: testProduct.name, 
          quantity: 1 
        }]
      };

      const orderResult = await makeRequest('/api/orders', {
        method: 'POST',
        body: orderPayload
      });

      console.log(`📊 Order submission status: ${orderResult.status}`);
      
      if (orderResult.status === 200 || orderResult.status === 201) {
        console.log('🎉 SUCCESS! Order submission is working!');
        console.log('✅ Response:', JSON.stringify(orderResult.data, null, 2));
      } else {
        console.log('❌ Order submission still failing:');
        console.log('   Status:', orderResult.status);
        console.log('   Response:', JSON.stringify(orderResult.data, null, 2));
        
        if (orderResult.status === 500) {
          console.log('\n🔧 Debugging 500 error:');
          if (orderResult.data.details && orderResult.data.details.includes('product_name')) {
            console.log('   - The product_name column issue might still exist');
            console.log('   - The database schema might not be updated yet');
          }
        }
      }

      // 3. Test authentication
      console.log('\n🔐 Testing authentication...');
      const authResult = await makeRequest('/api/users/authenticate', {
        method: 'POST',
        body: { role: 'customer' }
      });

      if (authResult.status === 200) {
        console.log('✅ Customer authentication working');
      } else {
        console.log(`❌ Authentication issue: ${authResult.status}`);
      }

    } else {
      console.log('❌ Products API failed:', productsResult.status, productsResult.data);
    }

  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
  }
}

testProductionFix();