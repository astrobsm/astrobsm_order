const pool = require('./db');

const migrateDatabase = async () => {
  try {
    console.log('Starting database migration...');
    
    // Check if columns already exist before adding them
    const checkColumns = async (columnName) => {
      const result = await pool.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = $1
      `, [columnName]);
      return result.rows.length > 0;
    };
    
    // Add delivery_date as DATE if it doesn't exist
    if (!(await checkColumns('delivery_date'))) {
      await pool.query('ALTER TABLE orders ALTER COLUMN delivery_date TYPE DATE USING delivery_date::DATE');
      console.log('Updated delivery_date column to DATE type');
    }
    
    // Add preferred_delivery_method column
    if (!(await checkColumns('preferred_delivery_method'))) {
      await pool.query('ALTER TABLE orders ADD COLUMN preferred_delivery_method VARCHAR(255)');
      console.log('Added preferred_delivery_method column');
    }
    
    // Add request_status column
    if (!(await checkColumns('request_status'))) {
      await pool.query('ALTER TABLE orders ADD COLUMN request_status VARCHAR(50) DEFAULT \'can_wait_24hrs\'');
      console.log('Added request_status column');
    }
    
    // Update existing orders with default values if needed
    await pool.query(`
      UPDATE orders 
      SET request_status = 'can_wait_24hrs' 
      WHERE request_status IS NULL
    `);
    
    await pool.query(`
      UPDATE orders 
      SET preferred_delivery_method = 'pickup_enugu' 
      WHERE preferred_delivery_method IS NULL
    `);
    
    console.log('Database migration completed successfully');
    
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
};

// Run migration if called directly
if (require.main === module) {
  migrateDatabase().then(() => {
    console.log('Migration process complete');
    process.exit(0);
  }).catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

module.exports = { migrateDatabase };
