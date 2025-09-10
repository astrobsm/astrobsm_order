#!/usr/bin/env node

/**
 * Debug Production Order Issue
 * Minimal test to capture exact error
 */

require('dotenv').config();

// Add fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

const PRODUCTION_URL = 'https://astrobsm-orderform-l4b35.ondigitalocean.app';

// Minimal test order
const testOrder = {
  customerData: {
    name: "Debug Test",
    email: "debug@test.com",
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

async function debugOrderSubmission() {
  console.log('🐛 DEBUG: Testing production order submission...\n');
  
  try {
    const url = `${PRODUCTION_URL}/api/orders`;
    console.log('📡 URL:', url);
    console.log('📋 Payload:', JSON.stringify(testOrder, null, 2));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testOrder)
    });
    
    console.log('\n📊 Response Status:', response.status, response.statusText);
    console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('\n📄 Raw Response Text:', responseText);
    
    // Try to parse as JSON
    try {
      const responseJson = JSON.parse(responseText);
      console.log('\n📋 Parsed JSON:', JSON.stringify(responseJson, null, 2));
    } catch (parseError) {
      console.log('\n⚠️ Response is not valid JSON');
    }
    
    if (response.ok) {
      console.log('\n✅ Request succeeded (status 2xx)');
    } else {
      console.log('\n❌ Request failed (status not 2xx)');
    }
    
  } catch (error) {
    console.error('\n❌ Fetch error:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugOrderSubmission();
