/**
 * Database Migration Script
 * Adds unit_of_measure column to products table and fixes schema issues
 */

const pool = require('./server/database/db');

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Starting database migration...');
    
    // Check if unit_of_measure column exists
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'unit_of_measure'
    `);
    
    if (columnCheck.rows.length === 0) {
      console.log('➕ Adding unit_of_measure column to products table...');
      
      await client.query('ALTER TABLE products ADD COLUMN unit_of_measure VARCHAR(50) DEFAULT \'PCS\'');
      
      // Update existing products with default unit
      await client.query('UPDATE products SET unit_of_measure = \'PCS\' WHERE unit_of_measure IS NULL');
      
      console.log('✅ unit_of_measure column added successfully');
    } else {
      console.log('✅ unit_of_measure column already exists');
    }
    
    // Check products table structure
    const tableStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'products'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Products table structure:');
    tableStructure.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    // Check order_items table structure
    const orderItemsStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'order_items'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Order_items table structure:');
    orderItemsStructure.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    // Test product insertion
    console.log('🧪 Testing product insertion...');
    try {
      const testProduct = await client.query(
        'INSERT INTO products (name, description, price, stock_quantity, unit_of_measure) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [`Migration Test Product ${Date.now()}`, 'Test product for migration', 99.99, 100, 'PCS']
      );
      
      console.log('✅ Product insertion test successful:', testProduct.rows[0]);
      
      // Clean up test product
      await client.query('DELETE FROM products WHERE id = $1', [testProduct.rows[0].id]);
      console.log('🗑️ Test product cleaned up');
    } catch (error) {
      console.error('❌ Product insertion test failed:', error);
    }
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };
