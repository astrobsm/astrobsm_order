const http = require('http');

// Test direct HTTP connection to our server
const testApiEndpoint = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/orders',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      console.log('📡 Response status:', res.statusCode);
      console.log('📡 Response headers:', res.headers);
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log('✅ API Response successful');
          console.log('📊 Orders count:', jsonData.length);
          console.log('📋 Data:', JSON.stringify(jsonData, null, 2));
          resolve(jsonData);
        } catch (e) {
          console.error('❌ Failed to parse JSON:', data);
          reject(e);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ HTTP Request error:', error.message);
      reject(error);
    });

    req.setTimeout(5000, () => {
      console.error('❌ Request timeout');
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
};

// Run the test
console.log('🔍 Testing API endpoint: GET /api/orders');
testApiEndpoint()
  .then(() => {
    console.log('✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  });
