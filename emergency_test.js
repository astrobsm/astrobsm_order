// 🆘 EMERGENCY BYPASS TEST
// Test if the problem is with the Order model or something else

const https = require('https');

const BASE_URL = 'https://astrobsm-order-placement-fykxb.ondigitalocean.app';

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(BASE_URL + path, {
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ 
          status: res.statusCode, 
          raw: data,
          parsed: (() => {
            try { return JSON.parse(data); } catch(e) { return null; }
          })()
        });
      });
    });
    req.on('error', reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

async function emergencyTest() {
  console.log('🆘 EMERGENCY BYPASS TEST\n');
  
  try {
    // Test basic connectivity
    console.log('1. Basic connectivity...');
    const basic = await makeRequest('/');
    console.log(`Status: ${basic.status} ${basic.status === 200 ? '✅' : '❌'}`);
    
    // Test orders list
    console.log('\n2. Orders list API...');
    const ordersList = await makeRequest('/api/orders');
    console.log(`Status: ${ordersList.status} ${ordersList.status === 200 ? '✅' : '❌'}`);
    
    if (ordersList.status === 200 && ordersList.parsed) {
      console.log(`Found ${ordersList.parsed.length} orders`);
      
      if (ordersList.parsed.length > 0) {
        const testOrder = ordersList.parsed[0];
        console.log(`First order: ID ${testOrder.id}, Customer: ${testOrder.customer_name}`);
        
        // Test individual order
        console.log(`\n3. Individual order ${testOrder.id}...`);
        const individual = await makeRequest(`/api/orders/${testOrder.id}`);
        console.log(`Status: ${individual.status} ${individual.status === 200 ? '✅' : '❌'}`);
        
        if (individual.status === 500) {
          console.log('Raw 500 response:', individual.raw);
        } else if (individual.parsed) {
          console.log(`Individual customer: ${individual.parsed.customer_name}`);
        }
        
        // Test another approach - try the products API
        console.log('\n4. Products API (for comparison)...');
        const products = await makeRequest('/api/products');
        console.log(`Status: ${products.status} ${products.status === 200 ? '✅' : '❌'}`);
        
        // Test users API
        console.log('\n5. Users API (for comparison)...');
        const users = await makeRequest('/api/users');
        console.log(`Status: ${users.status} ${users.status === 200 ? '✅' : '❌'}`);
      }
    } else {
      console.log('Failed to get orders list:', ordersList.raw);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

emergencyTest();