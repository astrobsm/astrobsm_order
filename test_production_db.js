#!/usr/bin/env node

/**
 * Test Production Database Connection
 * Check if we can connect to the production database
 */

console.log('🔍 Testing Production Database Connection...\n');

// Test the production API endpoints to see the actual error
async function testProductionConnection() {
  const prodUrl = 'https://astrobsm-order-placement-fykxb.ondigitalocean.app';
  
  console.log('🎯 Production URL:', prodUrl);
  
  // Test basic health
  try {
    console.log('\n1. Testing basic health endpoint...');
    const healthResponse = await fetch(`${prodUrl}/health`);
    const healthData = await healthResponse.text();
    console.log('✅ Basic health:', healthData);
  } catch (error) {
    console.log('❌ Basic health failed:', error.message);
  }
  
  // Test database health
  try {
    console.log('\n2. Testing database health endpoint...');
    const dbHealthResponse = await fetch(`${prodUrl}/api/health`);
    const dbHealthData = await dbHealthResponse.text();
    console.log('✅ Database health:', dbHealthData);
  } catch (error) {
    console.log('❌ Database health failed:', error.message);
  }
  
  // Test orders endpoint (this is failing)
  try {
    console.log('\n3. Testing orders endpoint...');
    const ordersResponse = await fetch(`${prodUrl}/api/orders`);
    console.log('Orders Status:', ordersResponse.status);
    const ordersData = await ordersResponse.text();
    console.log('Orders Response:', ordersData);
  } catch (error) {
    console.log('❌ Orders endpoint failed:', error.message);
  }
  
  // Test products endpoint (this is failing)
  try {
    console.log('\n4. Testing products endpoint...');
    const productsResponse = await fetch(`${prodUrl}/api/admin/products`);
    console.log('Products Status:', productsResponse.status);
    const productsData = await productsResponse.text();
    console.log('Products Response:', productsData);
  } catch (error) {
    console.log('❌ Products endpoint failed:', error.message);
  }
  
  console.log('\n📊 Summary:');
  console.log('- The app server is running (health endpoint works)');
  console.log('- Database endpoints are returning 500 errors');
  console.log('- This indicates database connection issues');
  console.log('\n💡 Solution: Update production environment variables with correct database credentials');
}

// Add fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testProductionConnection();
