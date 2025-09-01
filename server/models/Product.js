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
    
    console.log('🔧 Product.create called with:', productData);
    
    try {
      // First, try the simplest possible query with just the core fields
      console.log('📝 Attempting simple product creation...');
      const result = await pool.query(
        'INSERT INTO products (name, description, price, stock_quantity) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, description || '', price, stock_quantity || 100]
      );
      
      console.log('✅ Simple product creation successful:', result.rows[0]);
      return result.rows[0];
      
    } catch (simpleError) {
      console.log('❌ Simple creation failed, checking if unit_of_measure column exists...');
      console.log('Simple error:', simpleError.message);
      
      try {
        // Check if unit_of_measure column exists
        const columnCheck = await pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'products' AND column_name = 'unit_of_measure'
        `);
        
        if (columnCheck.rows.length > 0) {
          console.log('✅ unit_of_measure column exists, trying with it...');
          // Column exists, include it in the query
          const result = await pool.query(
            'INSERT INTO products (name, description, price, stock_quantity, unit_of_measure) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, description || '', price, stock_quantity || 100, unit_of_measure || 'PCS']
          );
          console.log('✅ Product creation with unit_of_measure successful:', result.rows[0]);
          return result.rows[0];
        } else {
          console.log('❌ unit_of_measure column does not exist');
          // Re-throw the original simple error since that should have worked
          throw simpleError;
        }
      } catch (columnCheckError) {
        console.error('❌ Error checking columns or creating with unit_of_measure:', columnCheckError);
        // If everything fails, throw the original error
        throw simpleError;
      }
    }
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
