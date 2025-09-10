#!/usr/bin/env node

/**
 * Production Order Submission Test
 * Tests the complete order flow in production
 */

require('dotenv').config();

const PRODUCTION_URL = 'https://astrobsm-orderform-l4b35.ondigitalocean.app';

// Helper function for API requests
async function apiRequest(endpoint, method = 'GET', data = null) {
  const url = `${PRODUCTION_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  console.log(`📡 ${method} ${url}`);
  
  try {
    const response = await fetch(url);
    const contentType = response.headers.get('content-type');
    
    let result;
    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      result = await response.text();
    }
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(result)}`);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ API request failed: ${error.message}`);
    throw error;
  }
}

// Test order data
const testOrder = {
  customerData: {
    name: "John Doe Test",
    email: "john.test@example.com",
    phone: "08123456789",
    delivery_address: "123 Test Street, Lagos, Nigeria"
  },
  orderData: {
    delivery_date: "2025-09-15",
    delivery_route: "Lagos Route",
    preferred_delivery_method: "delivery_enugu",
    request_status: "urgent"
  },
  items: [
    {
      product_name: "Skin Staples (Piece)",
      quantity: 2
    },
    {
      product_name: "NPWT (VAC) Foam (Piece)",
      quantity: 1
    }
  ],
  total: 12000
};

// Test functions
async function testProductionHealth() {
  console.log('🏥 Testing production health...\n');
  
  try {
    const health = await apiRequest('/health');
    console.log('✅ Production server is healthy');
    
    const apiHealth = await apiRequest('/api/health');
    console.log('✅ API endpoints are working');
    
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

async function testProductsAPI() {
  console.log('\n📦 Testing products API...\n');
  
  try {
    const products = await apiRequest('/api/admin/products');
    console.log(`✅ Products API working: ${products.length} products available`);
    
    // Check if our test products exist
    const skinStaples = products.find(p => p.name === 'Skin Staples (Piece)');
    const npwtFoam = products.find(p => p.name === 'NPWT (VAC) Foam (Piece)');
    
    if (skinStaples && npwtFoam) {
      console.log('✅ Test products found in production:');
      console.log(`   - ${skinStaples.name}: ₦${skinStaples.price}`);
      console.log(`   - ${npwtFoam.name}: ₦${npwtFoam.price}`);
      return true;
    } else {
      console.log('⚠️ Some test products not found');
      console.log('Available products:', products.slice(0, 5).map(p => p.name));
      return false;
    }
  } catch (error) {
    console.error('❌ Products API test failed:', error.message);
    return false;
  }
}

async function testOrderSubmission() {
  console.log('\n📋 Testing order submission...\n');
  
  try {
    console.log('📝 Submitting test order...');
    console.log('Customer:', testOrder.customerData.name);
    console.log('Items:', testOrder.items.length);
    console.log('Total: ₦' + testOrder.total);
    
    const result = await apiRequest('/api/orders', 'POST', testOrder);
    
    if (result.success || result.id) {
      console.log('✅ Order submitted successfully!');
      console.log('Response:', JSON.stringify(result, null, 2));
      return result;
    } else {
      console.log('⚠️ Unexpected response:', result);
      return null;
    }
  } catch (error) {
    console.error('❌ Order submission failed:', error.message);
    return null;
  }
}

async function testOrderRetrieval() {
  console.log('\n📋 Testing order retrieval...\n');
  
  try {
    const orders = await apiRequest('/api/orders');
    console.log(`✅ Orders API working: ${orders.length} orders found`);
    
    if (orders.length > 0) {
      console.log('\n📋 Recent orders:');
      orders.slice(-3).forEach(order => {
        console.log(`   - Order #${order.id}: ${order.customer_name || 'Unknown'} (${new Date(order.created_at).toLocaleDateString()})`);
      });
      
      // Look for our test order
      const testOrderFound = orders.find(order => 
        order.customer_name === testOrder.customerData.name
      );
      
      if (testOrderFound) {
        console.log('\n✅ Test order found in database!');
        console.log('Order details:', JSON.stringify(testOrderFound, null, 2));
        return true;
      } else {
        console.log('\n⚠️ Test order not found in recent orders');
        return false;
      }
    } else {
      console.log('📭 No orders found in production database');
      return false;
    }
  } catch (error) {
    console.error('❌ Order retrieval test failed:', error.message);
    return false;
  }
}

async function runProductionTest() {
  console.log('🚀 ASTRO-BSM Production Order Test');
  console.log('===================================\n');
  
  let allTestsPassed = true;
  
  try {
    // Test 1: Health check
    const healthOK = await testProductionHealth();
    if (!healthOK) {
      allTestsPassed = false;
      console.log('❌ Stopping tests - production server not healthy');
      return;
    }
    
    // Test 2: Products API
    const productsOK = await testProductsAPI();
    if (!productsOK) {
      allTestsPassed = false;
      console.log('⚠️ Products test failed, but continuing...');
    }
    
    // Test 3: Order submission
    const orderResult = await testOrderSubmission();
    if (!orderResult) {
      allTestsPassed = false;
      console.log('❌ Order submission failed');
    }
    
    // Wait a moment for database to process
    console.log('\n⏳ Waiting 3 seconds for order processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 4: Order retrieval
    const retrievalOK = await testOrderRetrieval();
    if (!retrievalOK) {
      allTestsPassed = false;
    }
    
    // Final summary
    console.log('\n🎯 Test Summary');
    console.log('===============');
    
    if (allTestsPassed) {
      console.log('✅ ALL TESTS PASSED! 🎉');
      console.log('📋 Production order system is working correctly');
      console.log('🔐 You can now test the admin panel at:');
      console.log(`   ${PRODUCTION_URL}`);
      console.log('   Password: roseball');
    } else {
      console.log('❌ Some tests failed');
      console.log('📋 Check the errors above for details');
    }
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Add fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// Run the test
runProductionTest();
