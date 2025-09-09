const pool = require('../database/db');

class Customer {
  static async create(customerData) {
    const { name, phone, delivery_address } = customerData;
    
    try {
      // First try with email column (for complete schema)
      const { email } = customerData;
      const result = await pool.query(
        'INSERT INTO customers (name, email, phone, delivery_address) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, email || null, phone, delivery_address]
      );
      return result.rows[0];
    } catch (error) {
      // If email column doesn't exist, try without it
      if (error.message.includes('column "email"') && error.message.includes('does not exist')) {
        console.log('📝 Email column not found, creating customer without email...');
        try {
          const result = await pool.query(
            'INSERT INTO customers (name, phone, delivery_address) VALUES ($1, $2, $3) RETURNING *',
            [name, phone, delivery_address]
          );
          return result.rows[0];
        } catch (fallbackError) {
          console.error('❌ Fallback customer creation failed:', fallbackError.message);
          throw fallbackError;
        }
      }
      // Re-throw other errors
      console.error('❌ Customer creation error:', error.message);
      throw error;
    }
  }

  static async findByEmail(email) {
    if (!email) return null;
    
    try {
      const result = await pool.query('SELECT * FROM customers WHERE email = $1', [email]);
      return result.rows[0];
    } catch (error) {
      // If email column doesn't exist, return null (will create new customer)
      if (error.message.includes('column "email"') && error.message.includes('does not exist')) {
        console.log('📝 Email column not found, skipping email lookup...');
        return null;
      }
      console.error('❌ Customer email lookup error:', error.message);
      throw error;
    }
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
    return result.rows[0];
  }
}

module.exports = Customer;
