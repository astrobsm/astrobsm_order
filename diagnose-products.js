// Production Diagnostic - Check current products vs expected products
const { Pool } = require('pg');

// Use environment variables or fallback to local
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'astro_order_db',
  password: process.env.DB_PASSWORD || 'natiss_natiss',
  port: process.env.DB_PORT || 5432,
  ssl: process.env.DB_SSL && process.env.DB_SSL !== 'false' ? {
    rejectUnauthorized: false
  } : false
});

// Expected products (what should be in database)
const expectedProducts = [
  "Wound-Care Honey Gauze Big (Carton)",
  "Wound-Care Honey Gauze Big (Packet)", 
  "Wound-Care Honey Gauze Small (Carton)",
  "Wound-Care Honey Gauze Small (Packet)",
  "Hera Wound-Gel 100g (Carton)",
  "Hera Wound-Gel 100g (Tube)",
  "Hera Wound-Gel 40g (Carton)", 
  "Hera Wound-Gel 40g (Tube)",
  "Coban Bandage 6 inch (Piece)",
  "Coban Bandage 6 inch (Carton)",
  "Coban Bandage 4 inch (Piece)",
  "Coban Bandage 4 inch (Carton)",
  "Silicone Scar Sheet (Packet)",
  "Silicone Scar Sheet (Block)",
  "Silicone Foot Pad (Pair)",
  "Sterile Dressing Pack (Bag)",
  "Sterile Dressing Pack (Piece)",
  "Sterile Gauze-Only Pack (Bag)",
  "Sterile Gauze-Only Pack (Piece)",
  "Skin Staples (Piece)",
  "NPWT (VAC) Foam (Piece)",
  "Opsite (Piece)",
  "Wound-Clex Solution 500ml (Carton)",
  "Wound-Clex Solution 500ml (Bottle)"
];

async function diagnoseProducts() {
  try {
    console.log('🔍 PRODUCTION DIAGNOSTIC: Checking product names...\n');
    
    // Get current products from database
    const result = await pool.query('SELECT name, price, description FROM products ORDER BY name');
    const currentProducts = result.rows;
    
    console.log(`📊 Current Database Products (${currentProducts.length}):`);
    currentProducts.forEach((product, index) => {
      const hasDescription = product.description ? '✅' : '❌';
      console.log(`${index + 1}. "${product.name}" - ₦${product.price} ${hasDescription}`);
    });
    
    console.log(`\n📋 Expected Products (${expectedProducts.length}):`);
    expectedProducts.forEach((name, index) => {
      console.log(`${index + 1}. "${name}"`);
    });
    
    // Check for mismatches
    console.log('\n🔍 MISMATCH ANALYSIS:');
    
    const currentNames = currentProducts.map(p => p.name);
    const missingProducts = expectedProducts.filter(name => !currentNames.includes(name));
    const extraProducts = currentNames.filter(name => !expectedProducts.includes(name));
    
    if (missingProducts.length > 0) {
      console.log(`\n❌ MISSING PRODUCTS (${missingProducts.length}):`);
      missingProducts.forEach(name => console.log(`   - "${name}"`));
    }
    
    if (extraProducts.length > 0) {
      console.log(`\n⚠️ EXTRA PRODUCTS (${extraProducts.length}):`);
      extraProducts.forEach(name => console.log(`   - "${name}"`));
    }
    
    if (missingProducts.length === 0 && extraProducts.length === 0) {
      console.log('✅ ALL PRODUCTS MATCH PERFECTLY!');
    }
    
    // Check products without descriptions
    const productsWithoutDesc = currentProducts.filter(p => !p.description || p.description.trim() === '');
    if (productsWithoutDesc.length > 0) {
      console.log(`\n❌ PRODUCTS WITHOUT DESCRIPTIONS (${productsWithoutDesc.length}):`);
      productsWithoutDesc.forEach(p => console.log(`   - "${p.name}"`));
      console.log('\n💡 FIX: Run "node production-db-fix.js" to add missing descriptions.');
    } else {
      console.log('\n✅ All products have descriptions');
    }
    
    console.log('\n🔧 RECOMMENDATION:');
    if (missingProducts.length > 0 || extraProducts.length > 0 || productsWithoutDesc.length > 0) {
      console.log('Run the production database fix script: node production-db-fix.js');
    } else {
      console.log('Database products are correctly synchronized!');
    }
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.log('\n💡 Database connection issue. Check environment variables:');
      console.log('   DB_USER, DB_PASSWORD, DB_HOST, DB_NAME, DB_PORT');
    }
  } finally {
    await pool.end();
  }
}

diagnoseProducts();
