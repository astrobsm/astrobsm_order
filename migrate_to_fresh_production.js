#!/usr/bin/env node

/**
 * Fresh Production Migration Script
 * Migrate data from local database to NEW Digital Ocean instance
 * Use this after deploying to a fresh Digital Ocean app
 */

require('dotenv').config();
const { Pool } = require('pg');

// Update this with your NEW Digital Ocean app URL
const NEW_PRODUCTION_URL = 'https://astrobsm-order-placement-fykxb.ondigitalocean.app'; // CURRENT PRODUCTION URL

// Local database connection
const localPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function migrateToFreshProduction() {
  console.log('🚀 ASTRO-BSM Fresh Production Migration');
  console.log('=====================================\n');
  
  console.log('📍 Source: Local database');
  console.log('📍 Target:', NEW_PRODUCTION_URL);
  console.log('📅 Date:', new Date().toISOString());
  
  if (NEW_PRODUCTION_URL.includes('your-new-app')) {
    console.error('❌ ERROR: Please update NEW_PRODUCTION_URL with your actual app URL!');
    console.log('💡 Example: https://astrobsm-order-fresh-abc123.ondigitalocean.app');
    process.exit(1);
  }
  
  try {
    // Step 1: Initialize new production database
    console.log('\n🏗️  Step 1: Initialize fresh production database...');
    await initializeProductionDatabase();
    
    // Step 2: Migrate products
    console.log('\n📦 Step 2: Migrate products...');
    await migrateProducts();
    
    // Step 3: Migrate customers and orders
    console.log('\n👥 Step 3: Migrate customers and orders...');
    await migrateCustomersAndOrders();
    
    // Step 4: Verify migration
    console.log('\n✅ Step 4: Verify migration...');
    await verifyMigration();
    
    console.log('\n🎉 Fresh Production Migration Complete!');
    console.log('=====================================');
    console.log('✅ Your new production app is ready to use');
    console.log('🔗 URL:', NEW_PRODUCTION_URL);
    console.log('🔑 Admin Password: roseball');
    console.log('🔑 Products Password: bluevelvet');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('💡 Check the deployment guide for troubleshooting steps');
    process.exit(1);
  } finally {
    await localPool.end();
  }
}

async function initializeProductionDatabase() {
  try {
    const response = await fetch(`${NEW_PRODUCTION_URL}/api/database/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Database initialization failed: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ Database initialized:', result.message);
    console.log('📋 Tables created:', result.tables?.join(', ') || 'Unknown');
    
  } catch (error) {
    throw new Error(`Failed to initialize database: ${error.message}`);
  }
}

async function migrateProducts() {
  try {
    // Get local products
    const localResult = await localPool.query('SELECT * FROM products ORDER BY id');
    const localProducts = localResult.rows;
    
    console.log(`📦 Found ${localProducts.length} products in local database`);
    
    if (localProducts.length === 0) {
      console.log('⚠️  No products to migrate - using default products');
      return;
    }
    
    // Clear existing products in production
    console.log('🧹 Clearing existing products in production...');
    const clearResponse = await fetch(`${NEW_PRODUCTION_URL}/api/admin/products/clear`, {
      method: 'DELETE'
    });
    
    if (clearResponse.ok) {
      console.log('✅ Existing products cleared');
    } else {
      console.log('⚠️  Could not clear existing products (may not exist)');
    }
    
    // Migrate each product
    let successCount = 0;
    for (const product of localProducts) {
      try {
        const productData = {
          name: product.name,
          description: product.description,
          price: parseFloat(product.price),
          unit_of_measure: product.unit_of_measure || 'PCS',
          stock_quantity: product.stock_quantity || 0
        };
        
        const response = await fetch(`${NEW_PRODUCTION_URL}/api/admin/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(productData)
        });
        
        if (response.ok) {
          successCount++;
          console.log(`✅ Migrated: ${product.name}`);
        } else {
          const error = await response.text();
          console.log(`❌ Failed to migrate ${product.name}: ${error}`);
        }
        
      } catch (error) {
        console.log(`❌ Error migrating ${product.name}: ${error.message}`);
      }
    }
    
    console.log(`📊 Migration summary: ${successCount}/${localProducts.length} products migrated`);
    
  } catch (error) {
    throw new Error(`Product migration failed: ${error.message}`);
  }
}

async function migrateCustomersAndOrders() {
  try {
    // Get local orders with customer data
    const localResult = await localPool.query(`
      SELECT 
        o.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.delivery_address as customer_delivery_address
      FROM orders o 
      LEFT JOIN customers c ON o.customer_id = c.id 
      ORDER BY o.created_at DESC
    `);
    
    const localOrders = localResult.rows;
    console.log(`📋 Found ${localOrders.length} orders in local database`);
    
    if (localOrders.length === 0) {
      console.log('⚠️  No orders to migrate');
      return;
    }
    
    let successCount = 0;
    for (const order of localOrders) {
      try {
        // Get order items
        const itemsResult = await localPool.query(`
          SELECT 
            oi.*,
            p.name as product_name
          FROM order_items oi
          LEFT JOIN products p ON oi.product_id = p.id
          WHERE oi.order_id = $1
        `, [order.id]);
        
        const orderData = {
          customerData: {
            name: order.customer_name || 'Unknown Customer',
            email: order.customer_email,
            phone: order.customer_phone || '08000000000',
            delivery_address: order.customer_delivery_address || order.delivery_address || 'No address provided'
          },
          orderData: {
            delivery_date: order.delivery_date,
            delivery_route: order.delivery_route,
            preferred_delivery_method: order.preferred_delivery_method,
            request_status: order.request_status || 'urgent'
          },
          items: itemsResult.rows.map(item => ({
            product_name: item.product_name,
            quantity: item.quantity
          })),
          total: parseFloat(order.total_amount || order.subtotal || 0)
        };
        
        const response = await fetch(`${NEW_PRODUCTION_URL}/api/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(orderData)
        });
        
        if (response.ok) {
          successCount++;
          console.log(`✅ Migrated order #${order.id} for ${order.customer_name}`);
        } else {
          const error = await response.text();
          console.log(`❌ Failed to migrate order #${order.id}: ${error}`);
        }
        
      } catch (error) {
        console.log(`❌ Error migrating order #${order.id}: ${error.message}`);
      }
    }
    
    console.log(`📊 Orders migration summary: ${successCount}/${localOrders.length} orders migrated`);
    
  } catch (error) {
    throw new Error(`Orders migration failed: ${error.message}`);
  }
}

async function verifyMigration() {
  try {
    // Check products
    const productsResponse = await fetch(`${NEW_PRODUCTION_URL}/api/admin/products`);
    if (productsResponse.ok) {
      const products = await productsResponse.json();
      console.log(`✅ Production has ${products.length} products`);
    }
    
    // Check orders
    const ordersResponse = await fetch(`${NEW_PRODUCTION_URL}/api/orders`);
    if (ordersResponse.ok) {
      const orders = await ordersResponse.json();
      console.log(`✅ Production has ${orders.length} orders`);
    }
    
    // Test order submission
    console.log('🧪 Testing order submission...');
    const testOrder = {
      customerData: {
        name: 'Migration Test',
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
    
    const testResponse = await fetch(`${NEW_PRODUCTION_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testOrder)
    });
    
    if (testResponse.ok) {
      console.log('✅ Order submission test passed');
    } else {
      console.log('⚠️  Order submission test failed');
    }
    
  } catch (error) {
    console.log('⚠️  Verification had issues:', error.message);
  }
}

// Add fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// Run migration
if (require.main === module) {
  migrateToFreshProduction();
}

module.exports = { migrateToFreshProduction };
