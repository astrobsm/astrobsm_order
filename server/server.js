// COMPLETE SERVER.JS UPDATE with database reset endpoint
// Add this endpoint to your existing server.js file

// Add this route to handle database reset
app.post('/api/reset-database', async (req, res) => {
  console.log('🔄 Database reset requested...');
  
  try {
    const { Pool } = require('pg');
    
    const pool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
      ssl: process.env.DB_SSL && process.env.DB_SSL !== 'false' ? {
        rejectUnauthorized: false
      } : false
    });

    const client = await pool.connect();
    
    try {
      console.log('🗑️ Dropping all existing tables...');
      
      // Drop all tables in correct order
      await client.query('DROP TABLE IF EXISTS order_items CASCADE;');
      await client.query('DROP TABLE IF EXISTS orders CASCADE;');
      await client.query('DROP TABLE IF EXISTS products CASCADE;');
      await client.query('DROP TABLE IF EXISTS customers CASCADE;');
      
      console.log('🏗️ Creating fresh tables...');
      
      // Create customers table
      await client.query(`
        CREATE TABLE customers (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          customer_id VARCHAR(100) UNIQUE NOT NULL,
          phone VARCHAR(50),
          address TEXT,
          company VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create products table
      await client.query(`
        CREATE TABLE products (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          description TEXT,
          unit_of_measure VARCHAR(50) DEFAULT 'PCS',
          stock_quantity INTEGER DEFAULT 100,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create orders table
      await client.query(`
        CREATE TABLE orders (
          id SERIAL PRIMARY KEY,
          customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
          total_amount DECIMAL(10,2) DEFAULT 0,
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create order_items table
      await client.query(`
        CREATE TABLE order_items (
          id SERIAL PRIMARY KEY,
          order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
          product_id INTEGER REFERENCES products(id),
          product_name VARCHAR(255) NOT NULL,
          quantity INTEGER NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          subtotal DECIMAL(10,2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      console.log('📦 Inserting fresh product data...');
      
      // Insert all products
      const products = [
        { name: "Wound-Care Honey Gauze Big (Carton)", price: 65000, description: "Medical supply: Wound-Care Honey Gauze Big (Carton)" },
        { name: "Wound-Care Honey Gauze Big (Packet)", price: 6000, description: "Medical supply: Wound-Care Honey Gauze Big (Packet)" },
        { name: "Wound-Care Honey Gauze Small (Carton)", price: 61250, description: "Medical supply: Wound-Care Honey Gauze Small (Carton)" },
        { name: "Wound-Care Honey Gauze Small (Packet)", price: 3500, description: "Medical supply: Wound-Care Honey Gauze Small (Packet)" },
        { name: "Hera Wound-Gel 100g (Carton)", price: 65000, description: "Medical supply: Hera Wound-Gel 100g (Carton)" },
        { name: "Hera Wound-Gel 100g (Tube)", price: 3250, description: "Medical supply: Hera Wound-Gel 100g (Tube)" },
        { name: "Hera Wound-Gel 40g (Carton)", price: 48000, description: "Medical supply: Hera Wound-Gel 40g (Carton)" },
        { name: "Hera Wound-Gel 40g (Tube)", price: 2000, description: "Medical supply: Hera Wound-Gel 40g (Tube)" },
        { name: "Coban Bandage 6 inch (Piece)", price: 4500, description: "Medical supply: Coban Bandage 6 inch (Piece)" },
        { name: "Coban Bandage 6 inch (Carton)", price: 48500, description: "Medical supply: Coban Bandage 6 inch (Carton)" },
        { name: "Coban Bandage 4 inch (Piece)", price: 3500, description: "Medical supply: Coban Bandage 4 inch (Piece)" },
        { name: "Coban Bandage 4 inch (Carton)", price: 37500, description: "Medical supply: Coban Bandage 4 inch (Carton)" },
        { name: "Silicone Scar Sheet (Packet)", price: 10000, description: "Medical supply: Silicone Scar Sheet (Packet)" },
        { name: "Silicone Scar Sheet (Block)", price: 90000, description: "Medical supply: Silicone Scar Sheet (Block)" },
        { name: "Silicone Foot Pad (Pair)", price: 2000, description: "Medical supply: Silicone Foot Pad (Pair)" },
        { name: "Sterile Dressing Pack (Bag)", price: 10000, description: "Medical supply: Sterile Dressing Pack (Bag)" },
        { name: "Sterile Dressing Pack (Piece)", price: 600, description: "Medical supply: Sterile Dressing Pack (Piece)" },
        { name: "Sterile Gauze-Only Pack (Bag)", price: 10000, description: "Medical supply: Sterile Gauze-Only Pack (Bag)" },
        { name: "Sterile Gauze-Only Pack (Piece)", price: 600, description: "Medical supply: Sterile Gauze-Only Pack (Piece)" },
        { name: "Skin Staples (Piece)", price: 4000, description: "Medical supply: Skin Staples (Piece)" },
        { name: "NPWT (VAC) Foam (Piece)", price: 2000, description: "Medical supply: NPWT (VAC) Foam (Piece)" },
        { name: "Opsite (Piece)", price: 6000, description: "Medical supply: Opsite (Piece)" },
        { name: "Wound-Clex Solution 500ml (Carton)", price: 12500, description: "Medical supply: Wound-Clex Solution 500ml (Carton)" },
        { name: "Wound-Clex Solution 500ml (Bottle)", price: 2300, description: "Medical supply: Wound-Clex Solution 500ml (Bottle)" }
      ];

      for (const product of products) {
        const unitMatch = product.name.match(/\(([^)]+)\)$/);
        const unitOfMeasure = unitMatch ? unitMatch[1] : 'PCS';
        
        await client.query(
          'INSERT INTO products (name, price, description, unit_of_measure, stock_quantity) VALUES ($1, $2, $3, $4, $5)',
          [product.name, product.price, product.description, unitOfMeasure, 100]
        );
      }
      
      // Get final counts
      const productCount = await client.query('SELECT COUNT(*) FROM products');
      const customerCount = await client.query('SELECT COUNT(*) FROM customers');
      const orderCount = await client.query('SELECT COUNT(*) FROM orders');
      
      console.log('✅ Database reset completed successfully');
      console.log(`📊 Products: ${productCount.rows[0].count}, Customers: ${customerCount.rows[0].count}, Orders: ${orderCount.rows[0].count}`);
      
      res.json({
        success: true,
        message: 'Database reset completed successfully',
        statistics: {
          products: parseInt(productCount.rows[0].count),
          customers: parseInt(customerCount.rows[0].count),
          orders: parseInt(orderCount.rows[0].count)
        }
      });
      
    } finally {
      client.release();
      await pool.end();
    }
    
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    res.status(500).json({
      success: false,
      message: 'Database reset failed',
      error: error.message
    });
  }
});
