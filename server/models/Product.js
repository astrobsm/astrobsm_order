const pool = require('../database/db');

class Product {
  static async getAll() {
    const result = await pool.query('SELECT * FROM products ORDER BY name');
    return result.rows;
  }

  static async findAll() {
    const result = await pool.query('SELECT * FROM products ORDER BY name');
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findByName(name) {
    const result = await pool.query('SELECT * FROM products WHERE name = $1', [name]);
    return result.rows[0];
  }

  static async create(productData) {
    const { name, description, price, stock_quantity, unit_of_measure } = productData;
    const result = await pool.query(
      'INSERT INTO products (name, description, price, stock_quantity, unit_of_measure) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description, price, stock_quantity, unit_of_measure || 'PCS']
    );
    return result.rows[0];
  }

  static async update(id, productData) {
    const { name, description, price, stock_quantity, unit_of_measure } = productData;
    const result = await pool.query(
      'UPDATE products SET name = $1, description = $2, price = $3, stock_quantity = $4, unit_of_measure = $5 WHERE id = $6 RETURNING *',
      [name, description, price, stock_quantity, unit_of_measure || 'PCS', id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

  static async updateStock(id, quantity) {
    const result = await pool.query(
      'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2 RETURNING *',
      [quantity, id]
    );
    return result.rows[0];
  }
}

module.exports = Product;
