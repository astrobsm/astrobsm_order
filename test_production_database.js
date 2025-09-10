#!/usr/bin/env node

/**
 * Test Production Database Schema Directly
 * Using the same database connection as the server
 */

// Load environment variables from .env file
require('dotenv').config();

const { Pool } = require('pg');

// Use production database connection
const pool = new Pool({
  connectionString: process.env.PRODUCTION_DATABASE_URL,
  ssl: false  // Try without SSL first
});

async function testDatabaseSchema() {
  console.log('🔍 Testing Production Database Schema');
  console.log('====================================\n');
  
  try {
    // Test basic connection
    console.log('🔌 Testing database connection...');
    const client = await pool.connect();
    console.log('✅ Connected to production database');
    
    // Check what tables exist
    console.log('\n📋 Checking existing tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('🗃️  Tables found:', tablesResult.rows.map(r => r.table_name));
    
    // Check customers table schema specifically
    console.log('\n👥 Checking customers table schema...');
    const customersSchema = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'customers' 
      ORDER BY ordinal_position;
    `);
    
    if (customersSchema.rows.length > 0) {
      console.log('📋 Customers table columns:');
      customersSchema.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    } else {
      console.log('❌ Customers table not found or has no columns');
    }
    
    // Check orders table schema
    console.log('\n📦 Checking orders table schema...');
    const ordersSchema = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      ORDER BY ordinal_position;
    `);
    
    if (ordersSchema.rows.length > 0) {
      console.log('📋 Orders table columns:');
      ordersSchema.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    } else {
      console.log('❌ Orders table not found or has no columns');
    }
    
    // Try to create a test customer directly
    console.log('\n🧪 Testing direct customer creation...');
    try {
      const testCustomerResult = await client.query(
        'INSERT INTO customers (name, phone, email) VALUES ($1, $2, $3) RETURNING *',
        ['Direct Test', '08111111111', 'direct@test.com']
      );
      console.log('✅ Direct customer creation successful:', testCustomerResult.rows[0]);
      
      // Clean up the test customer
      await client.query('DELETE FROM customers WHERE id = $1', [testCustomerResult.rows[0].id]);
      console.log('🧹 Test customer cleaned up');
      
    } catch (customerError) {
      console.error('❌ Direct customer creation failed:', customerError.message);
      console.error('💡 Error code:', customerError.code);
      console.error('💡 Error detail:', customerError.detail);
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('💡 Error code:', error.code);
  } finally {
    await pool.end();
  }
}

testDatabaseSchema();
