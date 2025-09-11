// Quick Production Endpoint Test
// Paste in browser console at: https://astrobsm-order-placement-fykxb.ondigitalocean.app

(async () => {
  const endpoints = [
    '/api/health',
    '/api/products', 
    '/api/orders',
    '/api/setup-schema'
  ];
  
  console.log('🔍 Testing Production Endpoints:');
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint);
      console.log(`${endpoint}: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.log(`${endpoint}: ERROR - ${error.message}`);
    }
  }
})();
