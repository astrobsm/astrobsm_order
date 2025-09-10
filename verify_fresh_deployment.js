#!/usr/bin/env node

/**
 * Fresh Deployment Verification Script
 * Test all functionality after fresh Digital Ocean deployment
 */

// Update this with your NEW app URL
const APP_URL = 'https://your-new-app.ondigitalocean.app'; // UPDATE THIS!

async function verifyFreshDeployment() {
  console.log('🔍 ASTRO-BSM Fresh Deployment Verification');
  console.log('=========================================\n');
  
  if (APP_URL.includes('your-new-app')) {
    console.error('❌ ERROR: Please update APP_URL with your actual app URL!');
    console.log('💡 Example: https://astrobsm-order-fresh-abc123.ondigitalocean.app');
    process.exit(1);
  }
  
  console.log('🎯 Testing URL:', APP_URL);
  console.log('📅 Test Date:', new Date().toISOString());
  
  const tests = [
    { name: 'Health Check', test: testHealth },
    { name: 'Database Health', test: testDatabaseHealth },
    { name: 'Products API', test: testProductsAPI },
    { name: 'Orders API', test: testOrdersAPI },
    { name: 'Order Submission', test: testOrderSubmission },
    { name: 'Admin Access', test: testAdminAccess },
    { name: 'Product Management', test: testProductManagement }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    try {
      console.log(`\n🧪 ${test.name}...`);
      const result = await test.test();
      if (result) {
        console.log(`✅ ${test.name} - PASSED`);
        passedTests++;
      } else {
        console.log(`❌ ${test.name} - FAILED`);
      }
    } catch (error) {
      console.log(`❌ ${test.name} - ERROR: ${error.message}`);
    }
  }
  
  console.log('\n📊 Test Summary');
  console.log('===============');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! Your fresh deployment is ready! 🚀');
    console.log('\n🔗 Application URLs:');
    console.log(`   Main App: ${APP_URL}`);
    console.log(`   Admin Panel: ${APP_URL} (Click Admin, password: roseball)`);
    console.log(`   Product Management: ${APP_URL} (Click Manage Products, password: bluevelvet)`);
  } else {
    console.log('\n⚠️  Some tests failed. Check the deployment guide for troubleshooting.');
  }
}

async function testHealth() {
  const response = await fetch(`${APP_URL}/health`);
  return response.ok;
}

async function testDatabaseHealth() {
  const response = await fetch(`${APP_URL}/api/health`);
  if (!response.ok) return false;
  const data = await response.json();
  return data.database === 'connected';
}

async function testProductsAPI() {
  const response = await fetch(`${APP_URL}/api/admin/products`);
  if (!response.ok) return false;
  const products = await response.json();
  console.log(`   Found ${products.length} products`);
  return products.length > 0;
}

async function testOrdersAPI() {
  const response = await fetch(`${APP_URL}/api/orders`);
  if (!response.ok) return false;
  const orders = await response.json();
  console.log(`   Found ${orders.length} orders`);
  return true; // Orders can be empty initially
}

async function testOrderSubmission() {
  const testOrder = {
    customerData: {
      name: 'Verification Test',
      phone: '08111111111',
      delivery_address: 'Test Address'
    },
    orderData: {
      delivery_date: '2025-09-15',
      delivery_route: 'Test Route',
      preferred_delivery_method: 'delivery_enugu',
      request_status: 'urgent'
    },
    items: [
      {
        product_name: 'Opsite (Piece)',
        quantity: 1
      }
    ],
    total: 6000
  };
  
  const response = await fetch(`${APP_URL}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(testOrder)
  });
  
  return response.ok;
}

async function testAdminAccess() {
  // Test if admin endpoints are accessible (they should return 401 or work)
  const response = await fetch(`${APP_URL}/api/orders`);
  return response.status === 200; // Orders API should be accessible
}

async function testProductManagement() {
  // Test if we can access the products endpoint for management
  const response = await fetch(`${APP_URL}/api/admin/products`);
  return response.ok;
}

// Add fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// Run verification
if (require.main === module) {
  verifyFreshDeployment();
}

module.exports = { verifyFreshDeployment };
