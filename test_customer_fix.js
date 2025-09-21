// 🧪 TEST CUSTOMER DATA FIX
// Simple test to verify the customer JOIN fix is working

const https = require('https');

const BASE_URL = 'https://astrobsm-order-placement-fykxb.ondigitalocean.app';

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = BASE_URL + path;
    
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

async function testCustomerDataFix() {
  console.log('🧪 TESTING CUSTOMER DATA FIX\n');

  try {
    console.log('📋 Testing order 63 after fix...');
    const result63 = await makeRequest('/api/orders/63');
    
    if (result63.status === 200) {
      console.log('✅ Order 63 fetched successfully');
      console.log(`Customer Name: ${result63.data.customer_name}`);
      console.log(`Phone: ${result63.data.phone || 'N/A'}`);
      console.log(`Email: ${result63.data.email || 'N/A'}`);
      console.log(`Address: ${result63.data.address || 'N/A'}`);
      
      if (result63.data.customer_name !== 'Unknown Customer' && result63.data.customer_name !== 'N/A') {
        console.log('🎉 SUCCESS: Customer data is now properly loaded!');
        console.log(`✅ Real customer: ${result63.data.customer_name}`);
        console.log('📄 PDF exports should now show correct customer information');
      } else {
        console.log('❌ STILL ISSUE: Customer data not loading properly');
        console.log('🔧 May need to check server restart or database connection');
      }
    } else {
      console.log(`❌ Failed to fetch order 63: ${result63.status}`);
    }
    
    // Test a few more orders
    console.log('\n📋 Testing other recent orders...');
    const ordersResult = await makeRequest('/api/orders');
    
    if (ordersResult.status === 200 && Array.isArray(ordersResult.data)) {
      const testOrders = ordersResult.data.slice(0, 3);
      
      for (const order of testOrders) {
        console.log(`\n🧪 Testing Order ${order.id}:`);
        const individualResult = await makeRequest(`/api/orders/${order.id}`);
        
        if (individualResult.status === 200) {
          const listCustomer = order.customer_name;
          const individualCustomer = individualResult.data.customer_name;
          
          console.log(`📋 List shows: ${listCustomer}`);
          console.log(`🔍 Individual shows: ${individualCustomer}`);
          
          if (listCustomer === individualCustomer && individualCustomer !== 'Unknown Customer') {
            console.log('✅ MATCH: Customer data consistent');
          } else {
            console.log('❌ MISMATCH: Customer data inconsistent');
          }
        }
      }
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

testCustomerDataFix();