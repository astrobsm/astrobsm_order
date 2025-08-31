const pool = require('../database/db');

class Customer {
  static async create(customerData) {
    const { name, email, phone, delivery_address } = customerData;
    const result = await pool.query(
      'INSERT INTO customers (name, email, phone, delivery_address) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email || null, phone, delivery_address]
    );
    return result.rows[0];
  }

  static async findByEmail(email) {
    if (!email) return null;
    const result = await pool.query('SELECT * FROM customers WHERE email = $1', [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
    return result.rows[0];
  }
}

module.exports = Customer;
