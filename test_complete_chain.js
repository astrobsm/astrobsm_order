// Quick test to verify order loading chain
const pool = require('./server/database/db');
const Order = require('./server/models/Order');

async function testOrderLoadingChain() {
  console.log('🔍 Testing complete order loading chain...\n');
  
  // Test 1: Direct database query
  console.log('1️⃣ Testing direct database connection...');
  try {
    const dbResult = await pool.query('SELECT COUNT(*) as count FROM orders');
    console.log(`✅ Database orders count: ${dbResult.rows[0].count}`);
    
    if (dbResult.rows[0].count > 0) {
      const ordersQuery = await pool.query(`
        SELECT o.*, c.name as customer_name, c.phone, c.email, c.delivery_address as customer_delivery_address
        FROM orders o 
        LEFT JOIN customers c ON o.customer_id = c.id 
        ORDER BY o.created_at DESC 
        LIMIT 1
      `);
      console.log('📋 Sample order from DB:', ordersQuery.rows[0]);
    }
  } catch (error) {
    console.error('❌ Database error:', error.message);
  }
  
  // Test 2: Model method
  console.log('\n2️⃣ Testing Order.getAll() model method...');
  try {
    const modelOrders = await Order.getAll();
    console.log(`✅ Model orders count: ${modelOrders.length}`);
    if (modelOrders.length > 0) {
      console.log('📋 Sample order from Model:', {
        id: modelOrders[0].id,
        customer_name: modelOrders[0].customer_name,
        phone: modelOrders[0].phone,
        total: modelOrders[0].total_amount
      });
    }
  } catch (error) {
    console.error('❌ Model error:', error.message);
  }
  
  // Test 3: HTTP API
  console.log('\n3️⃣ Testing HTTP API endpoint...');
  try {
    const { default: fetch } = await import('node-fetch');
    const response = await fetch('http://localhost:3000/api/orders');
    console.log(`📡 API Response status: ${response.status}`);
    
    if (response.ok) {
      const apiOrders = await response.json();
      console.log(`✅ API orders count: ${apiOrders.length}`);
      if (apiOrders.length > 0) {
        console.log('📋 Sample order from API:', {
          id: apiOrders[0].id,
          customer_name: apiOrders[0].customer_name,
          phone: apiOrders[0].phone,
          total: apiOrders[0].total_amount
        });
      }
    } else {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
    }
  } catch (error) {
    console.error('❌ API connection error:', error.message);
  }
  
  console.log('\n✅ Order loading chain test complete!');
  process.exit(0);
}

testOrderLoadingChain().catch(console.error);
