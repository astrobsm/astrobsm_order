/**
 * SMART PRODUCTION DATABASE SEEDER
 * Adds products without deleting existing ones (to avoid foreign key issues)
 */

const pg = require('pg');
require('dotenv').config();

// Use production database URL if available, otherwise construct from parts
const connectionString = process.env.DATABASE_URL || 
  `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`;

console.log('🗄️ Connecting to database...');
console.log('Database URL:', connectionString.replace(/:[^:@]*@/, ':***@')); // Hide password

const client = new pg.Client({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const productData = [
  { name: 'Wound-Care Honey Gauze Big (Carton)', price: 65000, description: 'Large honey-based wound care gauze, carton pack', unit_of_measure: 'carton' },
  { name: 'Wound-Care Honey Gauze Big (Packet)', price: 6000, description: 'Large honey-based wound care gauze, individual packet', unit_of_measure: 'packet' },
  { name: 'Wound-Care Honey Gauze Small (Carton)', price: 61250, description: 'Small honey-based wound care gauze, carton pack', unit_of_measure: 'carton' },
  { name: 'Wound-Care Honey Gauze Small (Packet)', price: 3500, description: 'Small honey-based wound care gauze, individual packet', unit_of_measure: 'packet' },
  { name: 'Hera Wound-Gel 100g (Carton)', price: 65000, description: 'Hera wound healing gel 100g, carton pack', unit_of_measure: 'carton' },
  { name: 'Hera Wound-Gel 100g (Tube)', price: 3250, description: 'Hera wound healing gel 100g, single tube', unit_of_measure: 'tube' },
  { name: 'Hera Wound-Gel 40g (Carton)', price: 48000, description: 'Hera wound healing gel 40g, carton pack', unit_of_measure: 'carton' },
  { name: 'Hera Wound-Gel 40g (Tube)', price: 2000, description: 'Hera wound healing gel 40g, single tube', unit_of_measure: 'tube' },
  { name: 'Coban Bandage 6 inch (Piece)', price: 4500, description: '6 inch Coban self-adherent wrap, single piece', unit_of_measure: 'piece' },
  { name: 'Coban Bandage 6 inch (Carton)', price: 48500, description: '6 inch Coban self-adherent wrap, carton pack', unit_of_measure: 'carton' },
  { name: 'Coban Bandage 4 inch (Piece)', price: 3500, description: '4 inch Coban self-adherent wrap, single piece', unit_of_measure: 'piece' },
  { name: 'Coban Bandage 4 inch (Carton)', price: 37500, description: '4 inch Coban self-adherent wrap, carton pack', unit_of_measure: 'carton' },
  { name: 'Silicone Scar Sheet (Packet)', price: 10000, description: 'Silicone scar reduction sheet, packet', unit_of_measure: 'packet' },
  { name: 'Silicone Scar Sheet (Block)', price: 90000, description: 'Silicone scar reduction sheet, bulk block', unit_of_measure: 'block' },
  { name: 'Silicone Foot Pad (Pair)', price: 2000, description: 'Silicone foot protection pad, pair', unit_of_measure: 'pair' },
  { name: 'Sterile Dressing Pack (Bag)', price: 10000, description: 'Sterile wound dressing pack, bag of multiple', unit_of_measure: 'bag' },
  { name: 'Sterile Dressing Pack (Piece)', price: 600, description: 'Sterile wound dressing pack, single piece', unit_of_measure: 'piece' },
  { name: 'Sterile Gauze-Only Pack (Bag)', price: 10000, description: 'Sterile gauze pack, bag of multiple', unit_of_measure: 'bag' },
  { name: 'Sterile Gauze-Only Pack (Piece)', price: 600, description: 'Sterile gauze pack, single piece', unit_of_measure: 'piece' },
  { name: 'Skin Staples (Piece)', price: 4000, description: 'Surgical skin staples, single piece', unit_of_measure: 'piece' },
  { name: 'NPWT (VAC) Foam (Piece)', price: 2000, description: 'Negative pressure wound therapy foam, single piece', unit_of_measure: 'piece' },
  { name: 'Opsite (Piece)', price: 6000, description: 'Transparent adhesive film dressing, single piece', unit_of_measure: 'piece' },
  { name: 'Wound-Clex Solution 500ml (Carton)', price: 12500, description: 'Wound cleaning solution 500ml, carton pack', unit_of_measure: 'carton' },
  { name: 'Wound-Clex Solution 500ml (Bottle)', price: 2300, description: 'Wound cleaning solution 500ml, single bottle', unit_of_measure: 'bottle' }
];

async function smartSeedDatabase() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check current state
    console.log('🔍 Checking current database state...');
    
    const existingProducts = await client.query('SELECT COUNT(*) as count, array_agg(name) as names FROM products');
    const existingOrders = await client.query('SELECT COUNT(*) as count FROM orders');
    
    console.log(`📦 Current products: ${existingProducts.rows[0].count}`);
    console.log(`📋 Current orders: ${existingOrders.rows[0].count}`);

    // Ensure table has unit_of_measure column
    console.log('🔍 Checking table structure...');
    const tableCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'unit_of_measure';
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log('🔧 Adding unit_of_measure column...');
      await client.query(`
        ALTER TABLE products 
        ADD COLUMN unit_of_measure VARCHAR(50) DEFAULT 'piece';
      `);
      console.log('✅ unit_of_measure column added');
    }

    // Get existing product names
    const existingNames = await client.query('SELECT name FROM products');
    const existingNameSet = new Set(existingNames.rows.map(row => row.name));
    
    console.log('📦 Adding missing products...');
    
    let successCount = 0;
    let skippedCount = 0;
    let failCount = 0;
    
    for (const product of productData) {
      try {
        if (existingNameSet.has(product.name)) {
          console.log(`⏭️ Skipped: ${product.name} (already exists)`);
          skippedCount++;
          continue;
        }

        const result = await client.query(
          `INSERT INTO products (name, price, description, unit_of_measure, stock_quantity) 
           VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [product.name, product.price, product.description, product.unit_of_measure, 100]
        );
        
        console.log(`✅ Added: ${product.name} (ID: ${result.rows[0].id})`);
        successCount++;
      } catch (error) {
        console.log(`❌ Failed: ${product.name} - ${error.message}`);
        failCount++;
      }
    }
    
    console.log('\n📊 SMART SEEDING RESULTS:');
    console.log(`✅ Successfully added: ${successCount} products`);
    console.log(`⏭️ Skipped (existing): ${skippedCount} products`);
    console.log(`❌ Failed to add: ${failCount} products`);
    console.log(`📦 Total attempted: ${productData.length} products`);
    
    // Verify final results
    const finalResult = await client.query('SELECT COUNT(*) as count FROM products');
    console.log(`\n🔍 Final verification: ${finalResult.rows[0].count} products in database`);
    
    // Show sample of new data
    const sampleResult = await client.query(`
      SELECT id, name, price, unit_of_measure 
      FROM products 
      WHERE name LIKE '%Wound-Care%' OR name LIKE '%Hera%'
      ORDER BY id DESC 
      LIMIT 5
    `);
    
    console.log('\n📋 Sample of added products:');
    sampleResult.rows.forEach(row => {
      console.log(`   ${row.id}: ${row.name} - ₦${row.price.toLocaleString()} (${row.unit_of_measure})`);
    });
    
  } catch (error) {
    console.error('💥 Smart database seeding failed:', error);
    throw error;
  } finally {
    await client.end();
    console.log('📊 Database connection closed');
  }
}

if (require.main === module) {
  smartSeedDatabase()
    .then(() => {
      console.log('🎉 Smart database seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Smart database seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { smartSeedDatabase, productData };
