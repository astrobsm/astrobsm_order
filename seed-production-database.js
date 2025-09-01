/**
 * PRODUCTION DATABASE SEEDER
 * Run this script in production to seed the database with products
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

async function seedDatabase() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check if products table exists and has the right structure
    console.log('🔍 Checking table structure...');
    
    const tableCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Table structure:', tableCheck.rows);

    // Ensure table has unit_of_measure column
    const hasUnitColumn = tableCheck.rows.some(row => row.column_name === 'unit_of_measure');
    
    if (!hasUnitColumn) {
      console.log('🔧 Adding unit_of_measure column...');
      await client.query(`
        ALTER TABLE products 
        ADD COLUMN IF NOT EXISTS unit_of_measure VARCHAR(50) DEFAULT 'piece';
      `);
      console.log('✅ unit_of_measure column added');
    }

    // Clear existing products
    console.log('🗑️ Clearing existing products...');
    await client.query('DELETE FROM products');
    
    // Reset sequence
    await client.query('ALTER SEQUENCE products_id_seq RESTART WITH 1');
    
    console.log('📦 Inserting products...');
    
    let successCount = 0;
    let failCount = 0;
    
    for (const product of productData) {
      try {
        const result = await client.query(
          `INSERT INTO products (name, price, description, unit_of_measure) 
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [product.name, product.price, product.description, product.unit_of_measure]
        );
        
        console.log(`✅ Added: ${product.name} (ID: ${result.rows[0].id})`);
        successCount++;
      } catch (error) {
        console.log(`❌ Failed: ${product.name} - ${error.message}`);
        failCount++;
      }
    }
    
    console.log('\n📊 SEEDING RESULTS:');
    console.log(`✅ Successfully added: ${successCount} products`);
    console.log(`❌ Failed to add: ${failCount} products`);
    console.log(`📦 Total attempted: ${productData.length} products`);
    
    // Verify results
    const verifyResult = await client.query('SELECT COUNT(*) as count FROM products');
    console.log(`\n🔍 Verification: ${verifyResult.rows[0].count} products in database`);
    
    // Show sample data
    const sampleResult = await client.query('SELECT id, name, price FROM products LIMIT 5');
    console.log('\n📋 Sample products:');
    sampleResult.rows.forEach(row => {
      console.log(`   ${row.id}: ${row.name} - ₦${row.price.toLocaleString()}`);
    });
    
  } catch (error) {
    console.error('💥 Database seeding failed:', error);
    throw error;
  } finally {
    await client.end();
    console.log('📊 Database connection closed');
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('🎉 Database seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase, productData };
