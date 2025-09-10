#!/usr/bin/env node

/**
 * Production Database Schema Repair
 * Fix the customer_id constraint issue in production
 */

require('dotenv').config();

// Add fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

const PRODUCTION_URL = 'https://astrobsm-orderform-l4b35.ondigitalocean.app';

async function fixProductionSchema() {
  console.log('🔧 ASTRO-BSM Production Schema Repair');
  console.log('====================================\n');
  
  console.log('🎯 Strategy: Use the existing database/repair endpoint');
  console.log('💡 This will recreate tables with correct schema\n');
  
  try {
    // Check if repair endpoint exists
    console.log('🔍 Testing database repair endpoint...');
    const response = await fetch(`${PRODUCTION_URL}/api/database/repair`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Database repair successful!');
      console.log('📋 Response:', JSON.stringify(result, null, 2));
      
      // Test order submission after repair
      console.log('\n🧪 Testing order submission after repair...');
      await testOrderAfterRepair();
      
    } else {
      const errorText = await response.text();
      console.log('❌ Database repair failed:', errorText);
      
      // Try alternative endpoints
      console.log('\n🔄 Trying alternative repair methods...');
      await tryAlternativeRepair();
    }
    
  } catch (error) {
    console.error('❌ Schema repair error:', error.message);
    console.log('\n💡 Alternative: Manual database initialization...');
    await tryManualRepair();
  }
}

async function testOrderAfterRepair() {
  const testOrder = {
    customerData: {
      name: "Repair Test",
      email: "repair@test.com",
      phone: "08111111111",
      delivery_address: "Test Address"
    },
    orderData: {
      delivery_date: "2025-09-15",
      delivery_route: "Test Route",
      preferred_delivery_method: "delivery_enugu",
      request_status: "urgent"
    },
    items: [
      {
        product_name: "Skin Staples (Piece)",
        quantity: 1
      }
    ],
    total: 4000
  };
  
  try {
    const response = await fetch(`${PRODUCTION_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testOrder)
    });
    
    console.log(`📊 Order test status: ${response.status}`);
    const responseText = await response.text();
    
    if (response.ok) {
      console.log('🎉 ORDER SUBMISSION NOW WORKS!');
      console.log('📋 Response:', responseText);
    } else {
      console.log('⚠️ Order submission still has issues:', responseText);
    }
    
  } catch (error) {
    console.error('❌ Order test error:', error.message);
  }
}

async function tryAlternativeRepair() {
  // Try the database setup endpoint
  try {
    console.log('🔧 Trying /api/database/setup...');
    const response = await fetch(`${PRODUCTION_URL}/api/database/setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`📊 Setup response: ${response.status}`);
    const result = await response.text();
    console.log('📋 Setup result:', result);
    
  } catch (error) {
    console.log('⚠️ Setup endpoint failed:', error.message);
  }
  
  // Try the database init endpoint 
  try {
    console.log('\n🔧 Trying /api/database/init...');
    const response = await fetch(`${PRODUCTION_URL}/api/database/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`📊 Init response: ${response.status}`);
    const result = await response.text();
    console.log('📋 Init result:', result);
    
  } catch (error) {
    console.log('⚠️ Init endpoint failed:', error.message);
  }
}

async function tryManualRepair() {
  console.log('\n🛠️ Manual Repair Instructions:');
  console.log('=============================');
  console.log('1. The production database has a schema issue');
  console.log('2. The customers table appears to have a customer_id column that should not exist');
  console.log('3. You may need to:');
  console.log('   - Access the Digital Ocean database directly');
  console.log('   - Drop and recreate the customers table');
  console.log('   - Or contact Digital Ocean support');
  console.log('\n📋 Expected customers table schema:');
  console.log('   CREATE TABLE customers (');
  console.log('     id SERIAL PRIMARY KEY,');
  console.log('     name VARCHAR(255) NOT NULL,');
  console.log('     phone VARCHAR(20) NOT NULL,');
  console.log('     email VARCHAR(255),');
  console.log('     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  console.log('   );');
}

fixProductionSchema();
