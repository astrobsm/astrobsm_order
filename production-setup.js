#!/usr/bin/env node

/**
 * Production Database Setup and Test Script
 * 
 * This script tests the production database connection and sets up the initial schema
 * if needed. Run this on your production server to verify everything works.
 */

require('dotenv').config({ path: '.env.production' });
const { Pool } = require('pg');

// Production database configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
};

const pool = new Pool(dbConfig);

async function testConnection() {
  console.log('🔗 Testing production database connection...');
  console.log(`   Host: ${process.env.DB_HOST}`);
  console.log(`   Port: ${process.env.DB_PORT}`);
  console.log(`   Database: ${process.env.DB_NAME}`);
  console.log(`   User: ${process.env.DB_USER}`);
  
  try {
    const result = await pool.query('SELECT NOW() as current_time, version() as db_version');
    console.log('✅ Database connection successful!');
    console.log(`   Time: ${result.rows[0].current_time}`);
    console.log(`   Version: ${result.rows[0].db_version.split(' ').slice(0,2).join(' ')}`);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function checkTables() {
  console.log('\n📋 Checking existing tables...');
  
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const tables = result.rows.map(row => row.table_name);
    console.log(`   Found ${tables.length} tables:`, tables.join(', '));
    
    // Check for required tables
    const requiredTables = ['customers', 'orders', 'products'];
    const missingTables = requiredTables.filter(table => !tables.includes(table));
    
    if (missingTables.length > 0) {
      console.log(`⚠️  Missing required tables: ${missingTables.join(', ')}`);
      return false;
    } else {
      console.log('✅ All required tables exist');
      return true;
    }
  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
    return false;
  }
}

async function createInitialSchema() {
  console.log('\n🏗️  Creating initial database schema...');
  
  const schemaSQL = `
    -- Create customers table
    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      email VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create orders table
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER REFERENCES customers(id),
      delivery_date DATE NOT NULL,
      preferred_delivery_method VARCHAR(50) NOT NULL,
      request_status VARCHAR(50) NOT NULL,
      delivery_address TEXT,
      total DECIMAL(10,2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create products table
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create order_items table
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      product_name VARCHAR(255) NOT NULL,
      quantity INTEGER NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
    CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
  `;

  try {
    await pool.query(schemaSQL);
    console.log('✅ Schema created successfully');
    return true;
  } catch (error) {
    console.error('❌ Error creating schema:', error.message);
    return false;
  }
}

async function insertSampleProducts() {
  console.log('\n📦 Checking and inserting sample products...');
  
  // Check if products exist
  const productCount = await pool.query('SELECT COUNT(*) FROM products');
  
  if (parseInt(productCount.rows[0].count) > 0) {
    console.log(`   Found ${productCount.rows[0].count} existing products`);
    return true;
  }

  console.log('   No products found, inserting sample products...');
  
  const sampleProducts = [
    { name: 'Silicone Scar Sheet (Packet)', price: 10250 },
    { name: 'Hera Wound-Gel 40g (Carton)', price: 6800 },
    { name: 'Skin Staples - Piece (PCS)', price: 4000 },
    { name: 'Opsite (Piece)', price: 3200 },
    { name: 'Sterile Gauze (Pack)', price: 1500 }
  ];

  try {
    for (const product of sampleProducts) {
      await pool.query(
        'INSERT INTO products (name, price, description) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING',
        [product.name, product.price, `Medical supply: ${product.name}`]
      );
    }
    console.log(`✅ Inserted ${sampleProducts.length} sample products`);
    return true;
  } catch (error) {
    console.error('❌ Error inserting products:', error.message);
    return false;
  }
}

async function runProductionSetup() {
  console.log('🚀 Production Database Setup');
  console.log('==============================');
  
  try {
    // Test connection
    if (!(await testConnection())) {
      process.exit(1);
    }

    // Check existing tables
    const tablesExist = await checkTables();
    
    // Create schema if needed
    if (!tablesExist) {
      if (!(await createInitialSchema())) {
        process.exit(1);
      }
      
      // Verify tables were created
      if (!(await checkTables())) {
        process.exit(1);
      }
    }

    // Insert sample products
    await insertSampleProducts();

    // Final verification
    console.log('\n🎯 Final verification...');
    const finalCheck = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM customers) as customers,
        (SELECT COUNT(*) FROM orders) as orders,
        (SELECT COUNT(*) FROM products) as products,
        (SELECT COUNT(*) FROM order_items) as order_items
    `);
    
    const counts = finalCheck.rows[0];
    console.log(`   Customers: ${counts.customers}`);
    console.log(`   Orders: ${counts.orders}`);
    console.log(`   Products: ${counts.products}`);
    console.log(`   Order Items: ${counts.order_items}`);

    console.log('\n🎉 Production database setup completed successfully!');
    console.log('   The application is ready to accept orders.');
    
  } catch (error) {
    console.error(`\n💥 Setup failed: ${error.message}`);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  runProductionSetup();
}

module.exports = { runProductionSetup };
