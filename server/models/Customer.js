const pool = require('../database/db');

class Customer {
  static async create(customerData) {
    const { name, phone, email } = customerData;
    
    console.log('👤 Creating customer:', { name, phone, email: email ? 'provided' : 'none' });
    
    try {
      // Try the most basic approach first - name and phone only (production schema)
      let result = await pool.query(
        'INSERT INTO customers (name, phone) VALUES ($1, $2) RETURNING *',
        [name, phone]
      );
      console.log('✅ Customer created with basic schema:', result.rows[0]);
      return result.rows[0];
    } catch (basicError) {
      console.log('⚠️ Basic schema failed, trying with email column...', basicError.message);
      
      // If basic approach fails, try with email (local schema)
      try {
        const result = await pool.query(
          'INSERT INTO customers (name, email, phone) VALUES ($1, $2, $3) RETURNING *',
          [name, email || null, phone]
        );
        console.log('✅ Customer created with email schema:', result.rows[0]);
        return result.rows[0];
      } catch (emailError) {
        console.error('❌ Both customer creation attempts failed');
        console.error('📋 Basic error:', basicError.message);
        console.error('📋 Email error:', emailError.message);
        
        // Check if this is a constraint violation on ID column
        if (basicError.message.includes('customer_id') || emailError.message.includes('customer_id')) {
          console.error('🔴 CRITICAL: customer_id constraint error suggests table schema corruption');
          console.error('💡 This should not happen - customer_id should be auto-generated');
        }
        
        throw new Error(`Customer creation failed: ${basicError.message}`);
      }
    }
  }

  static async findByEmail(email) {
    if (!email) return null;
    
    console.log('🔍 Looking up customer by email:', email);
    
    try {
      // Try basic lookup first
      const result = await pool.query('SELECT * FROM customers WHERE email = $1', [email]);
      console.log('✅ Email lookup successful, found:', result.rows.length, 'customers');
      return result.rows[0];
    } catch (error) {
      // If email column doesn't exist, return null (will create new customer)
      if (error.message.includes('column "email"') && error.message.includes('does not exist')) {
        console.log('📝 Email column not found, skipping email lookup...');
        return null;
      }
      console.error('❌ Customer email lookup error:', error.message);
      return null; // Don't throw, just return null to create new customer
    }
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
    return result.rows[0];
  }
}

module.exports = Customer;
