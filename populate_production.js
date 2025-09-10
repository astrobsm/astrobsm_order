#!/usr/bin/env node

/**
 * Quick Production Database Population
 * Run this AFTER fixing the database credentials in production
 */

console.log('🚀 ASTRO-BSM Production Database Population');
console.log('==========================================\n');

const PRODUCTION_URL = 'https://astrobsm-order-placement-fykxb.ondigitalocean.app';

async function populateProductionData() {
  console.log('🎯 Target:', PRODUCTION_URL);
  console.log('📅 Date:', new Date().toISOString());
  
  // First, test if the database is now working
  console.log('\n🔍 Testing database connection...');
  try {
    const response = await fetch(`${PRODUCTION_URL}/api/admin/products`);
    if (response.ok) {
      const products = await response.json();
      console.log(`✅ Database working! Found ${products.length} products already`);
      
      if (products.length > 0) {
        console.log('🎉 Production database already has products! No migration needed.');
        return;
      }
    } else {
      console.log(`❌ Database still not working. Status: ${response.status}`);
      console.log('💡 Please check the PRODUCTION_FIX_GUIDE.md for steps to fix database credentials');
      return;
    }
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    console.log('💡 Please check the PRODUCTION_FIX_GUIDE.md for steps to fix database credentials');
    return;
  }
  
  // If we get here, database is working but empty - run migration
  console.log('\n📦 Database is working but empty. Running data migration...');
  
  // Load local data
  const pool = require('./server/database/db');
  
  try {
    // Get products from local database
    console.log('📋 Loading products from local database...');
    const productsResult = await pool.query('SELECT * FROM products ORDER BY name');
    const products = productsResult.rows;
    console.log(`Found ${products.length} products to migrate`);
    
    // Send products to production
    console.log('📤 Uploading products to production...');
    let uploadedCount = 0;
    
    for (const product of products) {
      try {
        const response = await fetch(`${PRODUCTION_URL}/api/admin/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: product.name,
            price: parseFloat(product.price),
            description: product.description || '',
            category: product.category || 'General'
          })
        });
        
        if (response.ok) {
          uploadedCount++;
          if (uploadedCount % 10 === 0) {
            console.log(`  ✅ Uploaded ${uploadedCount}/${products.length} products`);
          }
        } else {
          console.log(`  ⚠️ Failed to upload "${product.name}"`);
        }
      } catch (error) {
        console.log(`  ❌ Error uploading "${product.name}":`, error.message);
      }
    }
    
    console.log(`\n🎉 Migration complete! Uploaded ${uploadedCount}/${products.length} products`);
    
    // Verify the upload
    console.log('\n🔍 Verifying production data...');
    const verifyResponse = await fetch(`${PRODUCTION_URL}/api/admin/products`);
    if (verifyResponse.ok) {
      const verifyProducts = await verifyResponse.json();
      console.log(`✅ Verification: ${verifyProducts.length} products now in production`);
    }
    
  } catch (error) {
    console.log('❌ Migration failed:', error.message);
  } finally {
    await pool.end();
  }
}

// Add fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

populateProductionData();
