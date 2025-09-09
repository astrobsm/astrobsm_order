// Test order loading from admin panel
const http = require('http');

async function testOrderLoading() {
  console.log('🔍 Testing Order Loading for Admin Panel');
  console.log('==========================================\n');
  
  try {
    // Test 1: Check database directly
    console.log('1️⃣ Testing database connection...');
    const pool = require('./server/database/db');
    
    const orderCount = await pool.query('SELECT COUNT(*) FROM orders');
    console.log('✅ Orders in database:', orderCount.rows[0].count);
    
    const customerCount = await pool.query('SELECT COUNT(*) FROM customers');
    console.log('✅ Customers in database:', customerCount.rows[0].count);
    
    // Test 2: Test the Order model directly
    console.log('\n2️⃣ Testing Order.getAll() method...');
    const Order = require('./server/models/Order');
    const orders = await Order.getAll();
    console.log('✅ Orders from model:', orders.length);
    
    if (orders.length > 0) {
      console.log('📋 First order details:');
      console.log('   - ID:', orders[0].id);
      console.log('   - Customer Name:', orders[0].customer_name);
      console.log('   - Phone:', orders[0].phone);
      console.log('   - Email:', orders[0].email);
      console.log('   - Created:', orders[0].created_at);
    }
    
    // Test 3: Test API endpoint via HTTP
    console.log('\n3️⃣ Testing API endpoint...');
    console.log('Starting test server...');
    
    // Import and start server components
    const express = require('express');
    const orderRoutes = require('./server/routes/orders');
    
    const app = express();
    app.use(express.json());
    app.use('/api/orders', orderRoutes);
    
    const server = app.listen(3001, () => {
      console.log('✅ Test server running on port 3001');
      
      // Make API request
      const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/orders',
        method: 'GET'
      };
      
      const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          console.log('✅ API Response Status:', res.statusCode);
          try {
            const orders = JSON.parse(data);
            console.log('✅ API Response Data:', orders.length, 'orders');
            if (orders.length > 0) {
              console.log('📋 API First Order:', {
                id: orders[0].id,
                customer_name: orders[0].customer_name,
                phone: orders[0].phone
              });
            }
          } catch (e) {
            console.log('❌ API Response not JSON:', data);
          }
          
          server.close();
          process.exit(0);
        });
      });
      
      req.on('error', (e) => {
        console.error('❌ API Request Error:', e.message);
        server.close();
        process.exit(1);
      });
      
      req.end();
    });
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
    process.exit(1);
  }
}

testOrderLoading();
