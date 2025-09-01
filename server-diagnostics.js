// Server-side diagnostics script
// Run this with: node server-diagnostics.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import models
const Customer = require('./server/models/Customer');
const Order = require('./server/models/Order');
const Product = require('./server/models/Product');
const pool = require('./server/database/db');

async function runDiagnostics() {
  console.log('🔍 Running server-side diagnostics...\n');
  
  // Test database connection
  try {
    console.log('1. Testing database connection...');
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connected successfully');
    console.log('   Current time:', result.rows[0].now);
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return;
  }
  
  // Test tables exist
  try {
    console.log('\n2. Checking tables exist...');
    const tables = ['customers', 'products', 'orders', 'order_items'];
    
    for (const table of tables) {
      const result = await pool.query(
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)`,
        [table]
      );
      
      if (result.rows[0].exists) {
        // Get row count
        const countResult = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`✅ Table '${table}' exists with ${countResult.rows[0].count} rows`);
      } else {
        console.log(`❌ Table '${table}' does not exist`);
      }
    }
  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
  }
  
  // Test products
  try {
    console.log('\n3. Testing products...');
    const products = await Product.getAll();
    console.log(`✅ Found ${products.length} products`);
    
    if (products.length > 0) {
      console.log('   Sample products:');
      products.slice(0, 3).forEach(product => {
        console.log(`   - ${product.name}: ₦${product.price} (${product.unit_of_measure})`);
      });
    }
  } catch (error) {
    console.error('❌ Error fetching products:', error.message);
  }
  
  // Test orders
  try {
    console.log('\n4. Testing orders...');
    const orders = await Order.getAll();
    console.log(`✅ Found ${orders.length} orders`);
    
    if (orders.length > 0) {
      console.log('   Recent orders:');
      orders.slice(0, 3).forEach(order => {
        console.log(`   - Order #${order.id}: ${order.customer_name} - ₦${order.total_amount}`);
      });
    }
  } catch (error) {
    console.error('❌ Error fetching orders:', error.message);
  }
  
  // Test API endpoints
  try {
    console.log('\n5. Testing internal API calls...');
    
    // Create a test Express app
    const app = express();
    app.use(cors());
    app.use(express.json());
    
    // Import routes
    const productRoutes = require('./server/routes/products');
    const orderRoutes = require('./server/routes/orders');
    
    app.use('/api/products', productRoutes);
    app.use('/api/orders', orderRoutes);
    
    const server = app.listen(0, async () => {
      const port = server.address().port;
      console.log(`   Test server running on port ${port}`);
      
      // Test products endpoint
      try {
        const response = await fetch(`http://localhost:${port}/api/products`);
        if (response.ok) {
          const products = await response.json();
          console.log(`✅ Products API: ${products.length} products returned`);
        } else {
          console.error(`❌ Products API failed: ${response.status}`);
        }
      } catch (error) {
        console.error('❌ Products API error:', error.message);
      }
      
      // Test orders endpoint
      try {
        const response = await fetch(`http://localhost:${port}/api/orders`);
        if (response.ok) {
          const orders = await response.json();
          console.log(`✅ Orders API: ${orders.length} orders returned`);
        } else {
          console.error(`❌ Orders API failed: ${response.status}`);
        }
      } catch (error) {
        console.error('❌ Orders API error:', error.message);
      }
      
      server.close();
      console.log('\n🎉 Diagnostics complete!');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Error testing API endpoints:', error.message);
  }
}

// Run diagnostics if this file is run directly
if (require.main === module) {
  runDiagnostics().catch(console.error);
}

module.exports = { runDiagnostics };
