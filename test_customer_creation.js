#!/usr/bin/env node

/**
 * Test Customer Creation in Production
 * Focus on the customer creation step
 */

require('dotenv').config();

// Add fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

const PRODUCTION_URL = 'https://astrobsm-orderform-l4b35.ondigitalocean.app';

// Test with a minimal order that should work
const minimalOrder = {
  customerData: {
    name: "Minimal Test",
    phone: "08111111111",
    // Remove email and delivery_address to test schema mismatch
  },
  orderData: {
    delivery_date: "2025-09-15",
    delivery_route: "Test Route", 
    preferred_delivery_method: "delivery_enugu",
    request_status: "urgent"
  },
  items: [
    {
      product_name: "Skin Staples (Piece)", // We know this exists
      quantity: 1
    }
  ],
  total: 4000
};

// Test with schema matching production
const productionSchemaOrder = {
  customerData: {
    name: "Production Schema Test",
    phone: "08111111111",
    email: "test@production.com", // Include email as per production schema
    // No delivery_address as it's not in production customers table
  },
  orderData: {
    delivery_date: "2025-09-15",
    delivery_route: "Test Route",
    preferred_delivery_method: "delivery_enugu", 
    request_status: "urgent",
    // Move delivery_address to orderData since customers table doesn't have it
    delivery_address: "123 Production Test Address"
  },
  items: [
    {
      product_name: "Skin Staples (Piece)",
      quantity: 1
    }
  ],
  total: 4000
};

async function testOrderVariant(order, description) {
  console.log(`\n🧪 Testing ${description}...`);
  console.log('📋 Order data:', JSON.stringify(order, null, 2));
  
  try {
    const response = await fetch(`${PRODUCTION_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(order)
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log(`📄 Response: ${responseText}`);
    
    if (response.ok) {
      console.log(`✅ ${description} succeeded!`);
      return true;
    } else {
      console.log(`❌ ${description} failed`);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ ${description} error:`, error.message);
    return false;
  }
}

async function runCustomerTests() {
  console.log('🧪 ASTRO-BSM Customer Creation Tests');
  console.log('===================================');
  
  await testOrderVariant(minimalOrder, 'Minimal Order (no email/address)');
  
  await testOrderVariant(productionSchemaOrder, 'Production Schema Order');
  
  console.log('\n🎯 Test completed!');
}

runCustomerTests();
