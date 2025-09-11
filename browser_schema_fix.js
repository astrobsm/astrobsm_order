/*
=================================================================
ASTRO-BSM PRODUCTION SCHEMA FIX - BROWSER CONSOLE SCRIPT
=================================================================

INSTRUCTIONS:
1. Go to: https://astrobsm-order-placement-fykxb.ondigitalocean.app
2. Open Browser Console (F12 → Console tab)
3. Paste this entire script and press Enter
4. Watch the logs for success/failure

This script will:
- Call the production schema fix endpoint
- Fix the customer_id → id column issue
- Test order submission after fix
- Show success/failure status

=================================================================
*/

console.log('🚀 ASTRO-BSM Production Schema Fix Starting...');
console.log('='.repeat(60));

// Configuration
const PRODUCTION_URL = 'https://astrobsm-order-placement-fykxb.ondigitalocean.app';
const SETUP_KEY = 'astrobsm-setup-2025';

// Test order data
const testOrder = {
  customerData: {
    name: 'Test Customer (Schema Fix)',
    phone: '1234567890',
    delivery_address: '123 Test Street, Test City'
  },
  orderData: {
    delivery_date: '2025-09-11',
    preferred_delivery_method: 'pickup',
    request_status: 'urgent'
  },
  items: [
    {
      product_name: 'Test Product',
      quantity: 1,
      price: 1000
    }
  ],
  total: 1000
};

async function runSchemaFix() {
  try {
    console.log('🔍 Step 1: Testing current order submission (before fix)...');
    
    // Test order submission before fix
    const beforeResponse = await fetch(`${PRODUCTION_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testOrder)
    });
    
    const beforeResult = await beforeResponse.text();
    console.log(`❌ Before fix - Status: ${beforeResponse.status}`);
    console.log(`❌ Before fix - Response:`, beforeResult);
    
    if (beforeResponse.status === 200) {
      console.log('✅ Orders are already working! No schema fix needed.');
      return;
    }
    
    console.log('🛠️  Step 2: Running production schema fix...');
    
    // Call schema fix endpoint
    const schemaResponse = await fetch(`${PRODUCTION_URL}/api/setup-schema`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        setup_key: SETUP_KEY
      })
    });
    
    const schemaResult = await schemaResponse.json();
    console.log(`🔧 Schema fix status: ${schemaResponse.status}`);
    console.log(`🔧 Schema fix result:`, schemaResult);
    
    if (schemaResponse.status !== 200) {
      console.error('❌ Schema fix failed!');
      if (schemaResponse.status === 404) {
        console.error('💡 The schema fix endpoint is not deployed yet.');
        console.error('💡 You need to deploy the updated server.js to Digital Ocean first.');
      }
      return;
    }
    
    console.log('✅ Schema fix completed successfully!');
    
    console.log('🧪 Step 3: Testing order submission after fix...');
    
    // Wait a moment for database changes to propagate
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test order submission after fix
    const afterResponse = await fetch(`${PRODUCTION_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testOrder)
    });
    
    const afterResult = await afterResponse.text();
    console.log(`🎯 After fix - Status: ${afterResponse.status}`);
    console.log(`🎯 After fix - Response:`, afterResult);
    
    if (afterResponse.status === 200) {
      console.log('🎉 SUCCESS! Order submission now works!');
      console.log('🎉 Schema fix completed successfully!');
      console.log('='.repeat(60));
      console.log('✅ Your production order system is now fully operational!');
      console.log('✅ Orders will now save correctly');
      console.log('✅ Admin panel will now show orders');
      
      // Test admin panel loading
      console.log('🔍 Step 4: Testing admin panel order loading...');
      const ordersResponse = await fetch(`${PRODUCTION_URL}/api/orders`);
      const orders = await ordersResponse.json();
      console.log(`📊 Orders in database: ${orders.length}`);
      if (orders.length > 0) {
        console.log('📋 Recent orders:', orders.slice(0, 3));
      }
      
    } else {
      console.error('❌ Order submission still failing after schema fix');
      console.error('❌ Additional troubleshooting may be needed');
    }
    
  } catch (error) {
    console.error('💥 Error during schema fix:', error);
    console.error('💡 Make sure you are on the production website and have internet connection');
  }
}

// Run the schema fix
runSchemaFix();

console.log('⏳ Schema fix script executed. Watch above for results...');
