// Direct Database Migration Script - Run on server
// This should be run on the server where the app is deployed

const pool = require('./server/database/db');

async function addUnitOfMeasureColumn() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Checking if unit_of_measure column exists...');
    
    // Check if column already exists
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'unit_of_measure'
    `);

    if (columnCheck.rows.length > 0) {
      console.log('✅ Column unit_of_measure already exists');
      return;
    }

    console.log('📝 Adding unit_of_measure column to products table...');
    
    // Add the column
    await client.query('ALTER TABLE products ADD COLUMN unit_of_measure VARCHAR(50) DEFAULT \'PCS\'');
    
    // Update existing products with default unit
    await client.query('UPDATE products SET unit_of_measure = \'PCS\' WHERE unit_of_measure IS NULL');
    
    console.log('✅ Successfully added unit_of_measure column');
    
  } catch (error) {
    console.error('❌ Error adding column:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  addUnitOfMeasureColumn()
    .then(() => {
      console.log('🎉 Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addUnitOfMeasureColumn };
