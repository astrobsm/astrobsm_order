// Test Server Connectivity
const fetch = require('node-fetch');

async function testServerConnectivity() {
  console.log('🔍 Testing Server Connectivity...');
  
  try {
    // Test health endpoint
    console.log('📡 Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:3000/api/health');
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Server is reachable:', healthData);
    } else {
      console.log('❌ Health endpoint failed:', healthResponse.status);
    }
    
    // Test products endpoint
    console.log('📡 Testing products endpoint...');
    const productsResponse = await fetch('http://localhost:3000/api/products');
    
    if (productsResponse.ok) {
      const products = await productsResponse.json();
      console.log('✅ Products endpoint working, found', products.length, 'products');
      
      if (products.length > 0) {
        console.log('📦 First product:', products[0]);
      }
    } else {
      console.log('❌ Products endpoint failed:', productsResponse.status);
    }
    
    // Now test stock endpoint
    console.log('📡 Testing stock levels endpoint...');
    const stockResponse = await fetch('http://localhost:3000/api/stock/levels');
    
    console.log('📥 Stock response status:', stockResponse.status);
    const stockText = await stockResponse.text();
    console.log('📥 Stock response:', stockText);
    
  } catch (error) {
    console.log('❌ Connection error:', error.message);
    console.log('🔍 Make sure the server is running on port 3000');
  }
}

testServerConnectivity();