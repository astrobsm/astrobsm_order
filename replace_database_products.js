const { Pool } = require('pg');

// Frontend dropdown products - the source of truth
const frontendProducts = [
  { name: "Wound-Care Honey Gauze Big (Carton)", price: 65000 },
  { name: "Wound-Care Honey Gauze Big (Packet)", price: 6000 },
  { name: "Wound-Care Honey Gauze Small (Carton)", price: 61250 },
  { name: "Wound-Care Honey Gauze Small (Packet)", price: 3500 },
  { name: "Hera Wound-Gel 100g (Carton)", price: 65000 },
  { name: "Hera Wound-Gel 100g (Tube)", price: 3250 },
  { name: "Hera Wound-Gel 40g (Carton)", price: 48000 },
  { name: "Hera Wound-Gel 40g (Tube)", price: 2000 },
  { name: "Coban Bandage 6 inch (Piece)", price: 4500 },
  { name: "Coban Bandage 6 inch (Carton)", price: 48500 },
  { name: "Coban Bandage 4 inch (Piece)", price: 3500 },
  { name: "Coban Bandage 4 inch (Carton)", price: 37500 },
  { name: "Silicone Scar Sheet (Packet)", price: 10000 },
  { name: "Silicone Scar Sheet (Block)", price: 90000 },
  { name: "Silicone Foot Pad (Pair)", price: 2000 },
  { name: "Sterile Dressing Pack (Bag)", price: 10000 },
  { name: "Sterile Dressing Pack (Piece)", price: 600 },
  { name: "Sterile Gauze-Only Pack (Bag)", price: 10000 },
  { name: "Sterile Gauze-Only Pack (Piece)", price: 600 },
  { name: "Skin Staples (Piece)", price: 4000 },
  { name: "NPWT (VAC) Foam (Piece)", price: 2000 },
  { name: "Opsite (Piece)", price: 6000 },
  { name: "Wound-Clex Solution 500ml (Carton)", price: 12500 },
  { name: "Wound-Clex Solution 500ml (Bottle)", price: 2300 }
];

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'astro_order_db',
  password: 'natiss_natiss',
  port: 5432,
});

async function replaceDatabaseProducts() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting database products replacement...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // First, get all existing products
    console.log('� Getting existing products...');
    const existingResult = await client.query('SELECT id, name FROM products ORDER BY name');
    console.log(`📊 Found ${existingResult.rowCount} existing products`);
    
    // Mark all existing products for cleanup (we'll update or delete them)
    const existingProductIds = existingResult.rows.map(row => row.id);
    
    // Insert or update frontend products
    console.log('📦 Processing frontend products...');
    let insertCount = 0;
    let updateCount = 0;
    const processedProductIds = [];
    
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
          `Medical supply: ${product.name}`,
          unitOfMeasure
        ]);
        
        updateCount++;
        processedProductIds.push(existingProduct.rows[0].id);
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
          `Medical supply: ${product.name}`,
          unitOfMeasure,
          100 // Default stock quantity
        ]);
        
        insertCount++;
        processedProductIds.push(result.rows[0].id);
        console.log(`✅ Inserted: "${result.rows[0].name}" - ₦${result.rows[0].price}`);
      }
    }
    
    // Find products that are no longer needed (not in frontend list)
    const unusedProductIds = existingProductIds.filter(id => !processedProductIds.includes(id));
    
    if (unusedProductIds.length > 0) {
      console.log(`\n🗑️ Found ${unusedProductIds.length} unused products...`);
      
      // Check if any unused products have order items
      for (const productId of unusedProductIds) {
        const orderItemsCheck = await client.query('SELECT COUNT(*) FROM order_items WHERE product_id = $1', [productId]);
        const hasOrders = parseInt(orderItemsCheck.rows[0].count) > 0;
        
        if (hasOrders) {
          // Mark as discontinued instead of deleting
          await client.query('UPDATE products SET description = description || \' [DISCONTINUED]\', created_at = NOW() WHERE id = $1', [productId]);
          console.log(`⚠️ Marked product ID ${productId} as discontinued (has existing orders)`);
        } else {
          // Safe to delete
          const deleteResult = await client.query('DELETE FROM products WHERE id = $1 RETURNING name', [productId]);
          console.log(`🗑️ Deleted unused product: "${deleteResult.rows[0].name}"`);
        }
      }
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log(`\n🎉 Successfully updated database products!`);
    console.log(`📊 Statistics:`);
    console.log(`   • Inserted: ${insertCount} new products`);
    console.log(`   • Updated: ${updateCount} existing products`);
    console.log(`   • Total active products: ${frontendProducts.length}`);
    
    // Verify the replacement
    console.log('\n📋 Final products in database:');
    const verifyResult = await client.query('SELECT name, price FROM products WHERE description NOT LIKE \'%[DISCONTINUED]%\' ORDER BY name');
    verifyResult.rows.forEach((product, index) => {
      console.log(`${index + 1}. "${product.name}" - ₦${product.price}`);
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to replace products:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the replacement
replaceDatabaseProducts()
  .then(() => {
    console.log('\n✅ Database products replacement completed successfully!');
    console.log('🔍 Frontend dropdown and database are now perfectly matched.');
  })
  .catch(error => {
    console.error('\n❌ Database products replacement failed:', error.message);
    process.exit(1);
  });
