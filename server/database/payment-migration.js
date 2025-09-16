const pool = require('./db');

// Add payment tracking fields to orders table
async function addPaymentFieldsToOrders() {
  try {
    console.log('🔄 Adding payment tracking fields to orders table...');
    
    // Add payment columns to orders table
    await pool.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100),
      ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255),
      ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP,
      ADD COLUMN IF NOT EXISTS payment_notes TEXT,
      ADD COLUMN IF NOT EXISTS receipt_generated BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS receipt_generated_at TIMESTAMP
    `);
    
    console.log('✅ Payment fields added to orders table successfully');
    
    // Update existing orders to have pending payment status
    await pool.query(`
      UPDATE orders 
      SET payment_status = 'pending' 
      WHERE payment_status IS NULL
    `);
    
    console.log('✅ Existing orders updated with pending payment status');
    
    return true;
  } catch (error) {
    console.error('❌ Error adding payment fields to orders table:', error);
    throw error;
  }
}

// Create payment_receipts table for tracking generated receipts
async function createPaymentReceiptsTable() {
  try {
    console.log('🔄 Creating payment_receipts table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_receipts (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        receipt_number VARCHAR(100) UNIQUE NOT NULL,
        payment_method VARCHAR(100) NOT NULL,
        payment_reference VARCHAR(255) NOT NULL,
        amount_paid DECIMAL(10,2) NOT NULL,
        payment_date TIMESTAMP NOT NULL,
        receipt_generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        generated_by VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ payment_receipts table created successfully');
    return true;
  } catch (error) {
    console.error('❌ Error creating payment_receipts table:', error);
    throw error;
  }
}

// Run payment system migration
async function runPaymentMigration() {
  try {
    console.log('🚀 Starting payment system migration...');
    
    await addPaymentFieldsToOrders();
    await createPaymentReceiptsTable();
    
    console.log('🎉 Payment system migration completed successfully!');
    return true;
  } catch (error) {
    console.error('💥 Payment system migration failed:', error);
    throw error;
  }
}

// Export functions
module.exports = {
  addPaymentFieldsToOrders,
  createPaymentReceiptsTable,
  runPaymentMigration
};

// Run migration if called directly
if (require.main === module) {
  runPaymentMigration()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}