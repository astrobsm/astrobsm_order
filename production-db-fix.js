// Production Database Fix - Update products with descriptions and exact frontend names
// This script fixes the production database by ensuring all products have required descriptions
// and match exactly with the frontend dropdown options

const { Pool } = require('pg');

// Use environment variables for production database connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: process.env.DB_SSL && process.env.DB_SSL !== 'false' ? {
    rejectUnauthorized: false
  } : false
});

// Frontend dropdown products - the source of truth
const frontendProducts = [
  { name: "Wound-Care Honey Gauze Big (Carton)", price: 65000, description: "Medical supply: Wound-Care Honey Gauze Big (Carton)" },
  { name: "Wound-Care Honey Gauze Big (Packet)", price: 6000, description: "Medical supply: Wound-Care Honey Gauze Big (Packet)" },
  { name: "Wound-Care Honey Gauze Small (Carton)", price: 61250, description: "Medical supply: Wound-Care Honey Gauze Small (Carton)" },
  { name: "Wound-Care Honey Gauze Small (Packet)", price: 3500, description: "Medical supply: Wound-Care Honey Gauze Small (Packet)" },
  { name: "Hera Wound-Gel 100g (Carton)", price: 65000, description: "Medical supply: Hera Wound-Gel 100g (Carton)" },
  { name: "Hera Wound-Gel 100g (Tube)", price: 3250, description: "Medical supply: Hera Wound-Gel 100g (Tube)" },
  { name: "Hera Wound-Gel 40g (Carton)", price: 48000, description: "Medical supply: Hera Wound-Gel 40g (Carton)" },
  { name: "Hera Wound-Gel 40g (Tube)", price: 2000, description: "Medical supply: Hera Wound-Gel 40g (Tube)" },
  { name: "Coban Bandage 6 inch (Piece)", price: 4500, description: "Medical supply: Coban Bandage 6 inch (Piece)" },
  { name: "Coban Bandage 6 inch (Carton)", price: 48500, description: "Medical supply: Coban Bandage 6 inch (Carton)" },
  { name: "Coban Bandage 4 inch (Piece)", price: 3500, description: "Medical supply: Coban Bandage 4 inch (Piece)" },
  { name: "Coban Bandage 4 inch (Carton)", price: 37500, description: "Medical supply: Coban Bandage 4 inch (Carton)" },
  { name: "Silicone Scar Sheet (Packet)", price: 10000, description: "Medical supply: Silicone Scar Sheet (Packet)" },
  { name: "Silicone Scar Sheet (Block)", price: 90000, description: "Medical supply: Silicone Scar Sheet (Block)" },
  { name: "Silicone Foot Pad (Pair)", price: 2000, description: "Medical supply: Silicone Foot Pad (Pair)" },
  { name: "Sterile Dressing Pack (Bag)", price: 10000, description: "Medical supply: Sterile Dressing Pack (Bag)" },
  { name: "Sterile Dressing Pack (Piece)", price: 600, description: "Medical supply: Sterile Dressing Pack (Piece)" },
  { name: "Sterile Gauze-Only Pack (Bag)", price: 10000, description: "Medical supply: Sterile Gauze-Only Pack (Bag)" },
  { name: "Sterile Gauze-Only Pack (Piece)", price: 600, description: "Medical supply: Sterile Gauze-Only Pack (Piece)" },
  { name: "Skin Staples (Piece)", price: 4000, description: "Medical supply: Skin Staples (Piece)" },
  { name: "NPWT (VAC) Foam (Piece)", price: 2000, description: "Medical supply: NPWT (VAC) Foam (Piece)" },
  { name: "Opsite (Piece)", price: 6000, description: "Medical supply: Opsite (Piece)" },
  { name: "Wound-Clex Solution 500ml (Carton)", price: 12500, description: "Medical supply: Wound-Clex Solution 500ml (Carton)" },
  { name: "Wound-Clex Solution 500ml (Bottle)", price: 2300, description: "Medical supply: Wound-Clex Solution 500ml (Bottle)" }
];

async function fixProductionDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Starting production database fix...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // First, add missing descriptions to existing products
    console.log('🛠️ Fixing products with missing descriptions...');
    const productsWithoutDesc = await client.query('SELECT id, name FROM products WHERE description IS NULL');
    
    for (const product of productsWithoutDesc.rows) {
      await client.query(
        'UPDATE products SET description = $1 WHERE id = $2',
        [`Medical supply: ${product.name}`, product.id]
      );
      console.log(`✅ Fixed description for: "${product.name}"`);
    }
    
    // Now process frontend products
    console.log('\n📦 Processing frontend products...');
    let insertCount = 0;
    let updateCount = 0;
    
    for (const product of frontendProducts) {
      // Check if product with this exact name already exists
      const existingProduct = await client.query('SELECT id, name, price FROM products WHERE name = $1', [product.name]);
      
      // Extract unit of measure from product name
      const unitMatch = product.name.match(/\(([^)]+)\)$/);
      const unitOfMeasure = unitMatch ? unitMatch[1] : 'PCS';
      
      if (existingProduct.rows.length > 0) {
        // Update existing product
        const updateQuery = `
          UPDATE products 
          SET price = $2, description = $3, unit_of_measure = $4, created_at = NOW()
          WHERE id = $1
          RETURNING id, name, price
        `;
        
        const result = await client.query(updateQuery, [
          existingProduct.rows[0].id,
          product.price,
          product.description,
          unitOfMeasure
        ]);
        
        updateCount++;
        console.log(`🔄 Updated: "${result.rows[0].name}" - ₦${result.rows[0].price}`);
        
      } else {
        // Insert new product
        const insertQuery = `
          INSERT INTO products (name, price, description, unit_of_measure, stock_quantity, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
          RETURNING id, name, price
        `;
        
        const result = await client.query(insertQuery, [
          product.name,
          product.price,
          product.description,
          unitOfMeasure,
          100 // Default stock quantity
        ]);
        
        insertCount++;
        console.log(`✅ Inserted: "${result.rows[0].name}" - ₦${result.rows[0].price}`);
      }
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log(`\n🎉 Production database fix completed!`);
    console.log(`📊 Statistics:`);
    console.log(`   • Inserted: ${insertCount} new products`);
    console.log(`   • Updated: ${updateCount} existing products`);
    console.log(`   • Total frontend products: ${frontendProducts.length}`);
    
    // Verify the fix
    console.log('\n📋 Verifying production database:');
    const verifyResult = await client.query('SELECT name, price, description FROM products WHERE description IS NOT NULL ORDER BY name LIMIT 10');
    verifyResult.rows.forEach((product, index) => {
      console.log(`${index + 1}. "${product.name}" - ₦${product.price}`);
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Production database fix failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Only run if called directly (not when required)
if (require.main === module) {
  fixProductionDatabase()
    .then(() => {
      console.log('\n✅ Production database fix completed successfully!');
      console.log('🔍 Frontend dropdown and production database are now perfectly matched.');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Production database fix failed:', error.message);
      process.exit(1);
    });
}

module.exports = { fixProductionDatabase };
