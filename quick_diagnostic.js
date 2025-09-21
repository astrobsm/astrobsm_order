// 🩺 SIMPLE DIAGNOSTIC 
// Check if deployment worked and what's causing the 500 error

const https = require('https');

const BASE_URL = 'https://astrobsm-order-placement-fykxb.ondigitalocean.app';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const req = https.request(BASE_URL + path, { method: 'GET' }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function quickDiagnostic() {
  console.log('🩺 Quick Diagnostic\n');
  
  try {
    // Test order 63
    console.log('Testing order 63...');
    const result = await makeRequest('/api/orders/63');
    console.log(`Status: ${result.status}`);
    
    if (result.status === 200) {
      console.log(`✅ Customer: ${result.data.customer_name}`);
      console.log('🎉 SUCCESS - Customer data is working!');
    } else {
      console.log(`❌ Error: ${result.raw || result.data}`);
    }
    
    // Test order 62 
    console.log('\nTesting order 62...');
    const result2 = await makeRequest('/api/orders/62');
    console.log(`Status: ${result2.status}`);
    
    if (result2.status === 200) {
      console.log(`✅ Customer: ${result2.data.customer_name}`);
    } else {
      console.log(`❌ Error: ${result2.raw || result2.data}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

quickDiagnostic();