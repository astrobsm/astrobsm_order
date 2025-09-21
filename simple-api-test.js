// Simple API test without database initialization
const http = require('http');

function testAPI() {
  console.log('🔍 Testing API endpoints...');
  
  // Test health endpoint
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/health',
    method: 'GET'
  };
  
  const req = http.request(options, (res) => {
    console.log('📡 Health endpoint status:', res.statusCode);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📦 Health response:', data);
      
      // Now test stock intake
      testStockIntake();
    });
  });
  
  req.on('error', (e) => {
    console.log('❌ Health test failed:', e.message);
  });
  
  req.end();
}

function testStockIntake() {
  console.log('\n📦 Testing stock intake endpoint...');
  
  const postData = JSON.stringify({
    product_id: 1,
    quantity_added: 10,
    cost_per_unit: 25.00,
    supplier: 'Test Supplier',
    userRole: 'superadmin'
  });
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/stock/intake',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  const req = http.request(options, (res) => {
    console.log('📡 Stock intake status:', res.statusCode);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📦 Stock response:', data);
      
      if (res.statusCode === 200) {
        console.log('✅ Stock intake working!');
      } else {
        console.log('❌ Stock intake failed with status:', res.statusCode);
      }
    });
  });
  
  req.on('error', (e) => {
    console.log('❌ Stock test failed:', e.message);
  });
  
  req.write(postData);
  req.end();
}

testAPI();