#!/usr/bin/env node

/**
 * Check Production Database Schema
 * Test what tables and columns exist
 */

require('dotenv').config();

// Add fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

const PRODUCTION_URL = 'https://astrobsm-orderform-l4b35.ondigitalocean.app';

async function testAPI(endpoint, description) {
  try {
    console.log(`\n🧪 Testing ${description}...`);
    const response = await fetch(`${PRODUCTION_URL}${endpoint}`);
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${description} successful`);
      console.log('📋 Response:', JSON.stringify(data, null, 2));
      return data;
    } else {
      const errorText = await response.text();
      console.log(`❌ ${description} failed: ${errorText}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ ${description} error:`, error.message);
    return null;
  }
}

async function checkSchemaAndData() {
  console.log('🔍 ASTRO-BSM Production Database Check');
  console.log('====================================\n');
  
  // Check what data we have
  await testAPI('/api/admin/products', 'Products API');
  await testAPI('/api/orders', 'Orders API');
  
  // Try to test a simple customer creation by hitting the endpoint directly
  console.log('\n🧪 Testing simple customer-only creation...');
  
  const simpleCustomer = {
    customerData: {
      name: "Simple Test",
      email: "simple@test.com", 
      phone: "08111111111",
      delivery_address: "Simple Address"
    },
    orderData: {
      delivery_date: "2025-09-15",
      delivery_route: "Test Route",
      preferred_delivery_method: "delivery_enugu",
      request_status: "urgent"
    },
    items: [],  // Empty items to trigger early validation
    total: 0
  };
  
  try {
    const response = await fetch(`${PRODUCTION_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(simpleCustomer)
    });
    
    console.log(`📊 Simple test status: ${response.status}`);
    const responseText = await response.text();
    console.log(`📄 Simple test response: ${responseText}`);
    
  } catch (error) {
    console.error('❌ Simple test error:', error.message);
  }
}

checkSchemaAndData();
