#!/usr/bin/env node

/**
 * Production Migration Script
 * Migrates data from local database to production database
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🚀 ASTRO-BSM Production Migration Script');
console.log('==========================================\n');

// Configuration
const LOCAL_DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'astro_order_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'natiss_natiss'
};

const PRODUCTION_API_URL = 'https://astrobsm-orderform-l4b35.ondigitalocean.app';

// Helper function to make API requests
async function apiRequest(endpoint, method = 'GET', data = null) {
  const url = `${PRODUCTION_API_URL}${endpoint}`;
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
    const result = await response.text();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${result}`);
    }
    
    try {
      return JSON.parse(result);
    } catch (e) {
      return result;
    }
  } catch (error) {
    console.error(`❌ API request failed: ${error.message}`);
    throw error;
  }
}

// Export data from local database
async function exportLocalData() {
  console.log('1️⃣ Exporting data from local database...\n');
  
  const { Pool } = require('pg');
  const localPool = new Pool(LOCAL_DB_CONFIG);
  
  try {
    // Export products
    console.log('📦 Exporting products...');
    const productsResult = await localPool.query('SELECT * FROM products ORDER BY id');
    const products = productsResult.rows;
    console.log(`✅ Exported ${products.length} products`);
    
    // Export customers
    console.log('👥 Exporting customers...');
    const customersResult = await localPool.query('SELECT * FROM customers ORDER BY id');
    const customers = customersResult.rows;
    console.log(`✅ Exported ${customers.length} customers`);
    
    // Export orders with items
    console.log('📋 Exporting orders...');
    const ordersResult = await localPool.query(`
      SELECT o.*, c.name as customer_name, c.phone, c.email, c.delivery_address as customer_delivery_address
      FROM orders o 
      LEFT JOIN customers c ON o.customer_id = c.id 
      ORDER BY o.created_at DESC
    `);
    const orders = ordersResult.rows;
    console.log(`✅ Exported ${orders.length} orders`);
    
    // Export order items
    console.log('📦 Exporting order items...');
    const orderItemsResult = await localPool.query('SELECT * FROM order_items ORDER BY order_id, id');
    const orderItems = orderItemsResult.rows;
    console.log(`✅ Exported ${orderItems.length} order items`);
    
    await localPool.end();
    
    return { products, customers, orders, orderItems };
  } catch (error) {
    await localPool.end();
    throw error;
  }
}

// Import data to production
async function importToProduction(data) {
  console.log('\n2️⃣ Importing data to production...\n');
  
  const { products, customers, orders, orderItems } = data;
  
  // Import products first
  console.log('📦 Importing products to production...');
  try {
    for (const product of products) {
      const productData = {
        name: product.name,
        price: parseFloat(product.price),
        description: product.description || '',
        category: product.category || 'Medical Supplies'
      };
      
      try {
        await apiRequest('/api/admin/products', 'POST', productData);
        console.log(`✅ Imported product: ${product.name}`);
      } catch (error) {
        console.log(`⚠️ Product may already exist: ${product.name}`);
      }
    }
    console.log(`✅ Products import completed\n`);
  } catch (error) {
    console.error('❌ Products import failed:', error.message);
  }
  
  // Import orders (this will create customers automatically)
  console.log('📋 Importing orders to production...');
  try {
    for (const order of orders) {
      // Find order items for this order
      const items = orderItems.filter(item => item.order_id === order.id);
      
      if (items.length === 0) {
        console.log(`⚠️ Skipping order ${order.id} - no items found`);
        continue;
      }
      
      // Prepare order data
      const orderData = {
        customerData: {
          name: order.customer_name || 'Unknown Customer',
          phone: order.phone || '',
          email: order.email || '',
          delivery_address: order.customer_delivery_address || ''
        },
        orderData: {
          delivery_date: order.delivery_date,
          delivery_route: order.delivery_route || '',
          preferred_delivery_method: order.preferred_delivery_method || 'pickup',
          request_status: order.request_status || 'pending'
        },
        items: items.map(item => ({
          product_name: item.product_name,
          quantity: parseInt(item.quantity)
        })),
        total: parseFloat(order.total_amount)
      };
      
      try {
        const result = await apiRequest('/api/orders', 'POST', orderData);
        console.log(`✅ Imported order #${order.id} - ${order.customer_name}`);
      } catch (error) {
        console.error(`❌ Failed to import order #${order.id}:`, error.message);
      }
    }
    console.log(`✅ Orders import completed\n`);
  } catch (error) {
    console.error('❌ Orders import failed:', error.message);
  }
}

// Test production connectivity
async function testProductionConnectivity() {
  console.log('🔍 Testing production connectivity...\n');
  
  try {
    const healthCheck = await apiRequest('/health');
    console.log('✅ Production server is accessible');
    
    const productsCheck = await apiRequest('/api/admin/products');
    console.log(`✅ Production API working - ${productsCheck.length || 0} products found`);
    
    return true;
  } catch (error) {
    console.error('❌ Production connectivity test failed:', error.message);
    return false;
  }
}

// Verify migration
async function verifyMigration() {
  console.log('\n3️⃣ Verifying migration...\n');
  
  try {
    const products = await apiRequest('/api/admin/products');
    console.log(`📦 Production products: ${products.length}`);
    
    const orders = await apiRequest('/api/orders');
    console.log(`📋 Production orders: ${orders.length}`);
    
    if (orders.length > 0) {
      console.log('\n📋 Recent orders in production:');
      orders.slice(0, 3).forEach(order => {
        console.log(`- Order #${order.id}: ${order.customer_name} (${order.created_at})`);
      });
    }
    
    console.log('\n✅ Migration verification completed!');
    return true;
  } catch (error) {
    console.error('❌ Migration verification failed:', error.message);
    return false;
  }
}

// Main migration function
async function runMigration() {
  try {
    // Step 1: Test production connectivity
    const isConnected = await testProductionConnectivity();
    if (!isConnected) {
      console.error('❌ Cannot connect to production. Migration aborted.');
      process.exit(1);
    }
    
    // Step 2: Export local data
    const data = await exportLocalData();
    
    // Step 3: Import to production
    await importToProduction(data);
    
    // Step 4: Verify migration
    await verifyMigration();
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('You can now access the production site and see your orders in the admin panel.');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Add fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// Run migration
runMigration();
