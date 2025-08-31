const express = require('express');
const pool = require('../database/db');
const router = express.Router();

// Database health check
router.get('/health', async (req, res) => {
  try {
    console.log('Database health check - Environment variables:');
    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('DB_PORT:', process.env.DB_PORT);
    console.log('DB_USER:', process.env.DB_USER);
    console.log('DB_NAME:', process.env.DB_NAME);
    console.log('DB_SSL:', process.env.DB_SSL);
    console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '[SET]' : '[NOT SET]');
    
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      status: 'healthy', 
      timestamp: result.rows[0].now,
      database: 'connected',
      environment: {
        DB_HOST: process.env.DB_HOST,
        DB_PORT: process.env.DB_PORT,
        DB_USER: process.env.DB_USER,
        DB_NAME: process.env.DB_NAME,
        DB_SSL: process.env.DB_SSL,
        DB_PASSWORD_SET: !!process.env.DB_PASSWORD
      }
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(500).json({ 
      status: 'unhealthy', 
      error: error.message,
      database: 'disconnected',
      environment: {
        DB_HOST: process.env.DB_HOST,
        DB_PORT: process.env.DB_PORT,
        DB_USER: process.env.DB_USER,
        DB_NAME: process.env.DB_NAME,
        DB_SSL: process.env.DB_SSL,
        DB_PASSWORD_SET: !!process.env.DB_PASSWORD
      }
    });
  }
});

// Initialize database tables if they don't exist (GET version for easy access)
router.get('/init', async (req, res) => {
  try {
    console.log('GET: Initializing database tables...');
    
    // Create customers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(50),
        hospital_name VARCHAR(255),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        stock_quantity INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id),
        delivery_date DATE,
        delivery_route VARCHAR(255),
        preferred_delivery_method VARCHAR(100),
        request_status VARCHAR(50) DEFAULT 'urgent',
        subtotal DECIMAL(10,2),
        vat_amount DECIMAL(10,2),
        total_amount DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create order_items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insert default products if none exist
    const productCount = await pool.query('SELECT COUNT(*) FROM products');
    if (parseInt(productCount.rows[0].count) === 0) {
      console.log('Inserting default products...');
      
      const defaultProducts = [
        { name: 'Surgical Gloves (Box)', description: 'Sterile surgical gloves, box of 100', price: 25.00 },
        { name: 'Surgical Mask (Box)', description: 'Disposable surgical masks, box of 50', price: 15.00 },
        { name: 'Syringe 5ml (Pack)', description: 'Disposable syringes 5ml, pack of 10', price: 8.00 },
        { name: 'Syringe 10ml (Pack)', description: 'Disposable syringes 10ml, pack of 10', price: 12.00 },
        { name: 'Bandage Roll', description: 'Medical bandage roll, 5cm x 4.5m', price: 3.50 },
        { name: 'Antiseptic Solution 500ml', description: 'Hospital grade antiseptic solution', price: 18.00 },
        { name: 'Thermometer Digital', description: 'Digital clinical thermometer', price: 22.00 },
        { name: 'Blood Pressure Monitor', description: 'Digital blood pressure monitor', price: 85.00 }
      ];
      
      for (const product of defaultProducts) {
        await pool.query(
          'INSERT INTO products (name, description, price, stock_quantity) VALUES ($1, $2, $3, $4)',
          [product.name, product.description, product.price, 100]
        );
      }
    }
    
    console.log('Database initialization completed successfully');
    
    // Return success page
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Database Initialized</title>
          <style>
              body { font-family: Arial; max-width: 600px; margin: 50px auto; padding: 20px; }
              .success { background: #d4edda; padding: 20px; border-radius: 5px; color: #155724; }
              button { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 10px; }
          </style>
      </head>
      <body>
          <div class="success">
              <h1>✅ Database Initialized Successfully!</h1>
              <p><strong>Tables Created:</strong> customers, products, orders, order_items</p>
              <p><strong>Default Products:</strong> 8 medical products inserted</p>
              <p><strong>Status:</strong> Your app should now work properly!</p>
          </div>
          <button onclick="window.location.href='/'">Go to Main App</button>
          <button onclick="window.location.href='/admin-tools'">Admin Tools</button>
      </body>
      </html>
    `);
    
  } catch (error) {
    console.error('Database initialization failed:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Database Error</title>
          <style>
              body { font-family: Arial; max-width: 600px; margin: 50px auto; padding: 20px; }
              .error { background: #f8d7da; padding: 20px; border-radius: 5px; color: #721c24; }
              button { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 10px; }
          </style>
      </head>
      <body>
          <div class="error">
              <h1>❌ Database Initialization Failed</h1>
              <p><strong>Error:</strong> ${error.message}</p>
              <p><strong>Check:</strong> Database connection and environment variables</p>
          </div>
          <button onclick="window.location.href='/admin-tools'">Try Admin Tools</button>
          <button onclick="window.location.href='/api/database/health'">Check Health</button>
      </body>
      </html>
    `);
  }
});

// Initialize database tables if they don't exist
router.post('/init', async (req, res) => {
  try {
    console.log('Initializing database tables...');
    
    // Create customers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(50),
        hospital_name VARCHAR(255),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        stock_quantity INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id),
        delivery_date DATE,
        delivery_route VARCHAR(255),
        preferred_delivery_method VARCHAR(100),
        request_status VARCHAR(50) DEFAULT 'urgent',
        subtotal DECIMAL(10,2),
        vat_amount DECIMAL(10,2),
        total_amount DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create order_items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insert default products if none exist
    const productCount = await pool.query('SELECT COUNT(*) FROM products');
    if (parseInt(productCount.rows[0].count) === 0) {
      console.log('Inserting default products...');
      
      const defaultProducts = [
        { name: 'Surgical Gloves (Box)', description: 'Sterile surgical gloves, box of 100', price: 25.00 },
        { name: 'Surgical Mask (Box)', description: 'Disposable surgical masks, box of 50', price: 15.00 },
        { name: 'Syringe 5ml (Pack)', description: 'Disposable syringes 5ml, pack of 10', price: 8.00 },
        { name: 'Syringe 10ml (Pack)', description: 'Disposable syringes 10ml, pack of 10', price: 12.00 },
        { name: 'Bandage Roll', description: 'Medical bandage roll, 5cm x 4.5m', price: 3.50 },
        { name: 'Antiseptic Solution 500ml', description: 'Hospital grade antiseptic solution', price: 18.00 },
        { name: 'Thermometer Digital', description: 'Digital clinical thermometer', price: 22.00 },
        { name: 'Blood Pressure Monitor', description: 'Digital blood pressure monitor', price: 85.00 }
      ];
      
      for (const product of defaultProducts) {
        await pool.query(
          'INSERT INTO products (name, description, price, stock_quantity) VALUES ($1, $2, $3, $4)',
          [product.name, product.description, product.price, 100]
        );
      }
    }
    
    console.log('Database initialization completed successfully');
    
    res.json({ 
      status: 'success', 
      message: 'Database initialized successfully',
      tables: ['customers', 'products', 'orders', 'order_items']
    });
    
  } catch (error) {
    console.error('Database initialization failed:', error);
    res.status(500).json({ 
      status: 'error', 
      error: error.message 
    });
  }
});

module.exports = router;
