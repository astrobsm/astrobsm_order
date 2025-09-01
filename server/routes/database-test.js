const express = require('express');
const pool = require('../database/db');
const router = express.Router();

// Database diagnostics endpoint
router.get('/test', async (req, res) => {
  try {
    console.log('🔍 Database diagnostics test started');
    
    // Test 1: Basic connection
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Test 2: Check if products table exists
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'products'
    `);
    
    const tableExists = tableCheck.rows.length > 0;
    console.log('📋 Products table exists:', tableExists);
    
    let columns = [];
    if (tableExists) {
      // Test 3: Get table structure
      const columnCheck = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'products'
        ORDER BY ordinal_position
      `);
      
      columns = columnCheck.rows;
      console.log('📋 Products table columns:', columns);
    }
    
    // Test 4: Count existing products
    let productCount = 0;
    if (tableExists) {
      const countResult = await client.query('SELECT COUNT(*) FROM products');
      productCount = parseInt(countResult.rows[0].count);
      console.log('📦 Existing products count:', productCount);
    }
    
    client.release();
    
    res.json({
      success: true,
      database_connected: true,
      products_table_exists: tableExists,
      table_columns: columns,
      existing_products_count: productCount,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Database diagnostic error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    });
  }
});

// Simple product creation test
router.post('/create-test-product', async (req, res) => {
  try {
    const { adminPassword, name, price } = req.body;
    
    if (adminPassword !== 'roseball') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const productName = name || `Test Product ${Date.now()}`;
    const productPrice = price || 100;
    
    console.log(`🧪 Testing product creation: ${productName} - $${productPrice}`);
    
    const client = await pool.connect();
    
    // Try the most basic insert possible
    const result = await client.query(
      'INSERT INTO products (name, price) VALUES ($1, $2) RETURNING *',
      [productName, productPrice]
    );
    
    client.release();
    
    console.log('✅ Test product created:', result.rows[0]);
    
    res.json({
      success: true,
      product: result.rows[0],
      message: 'Test product created successfully'
    });
    
  } catch (error) {
    console.error('❌ Test product creation failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      details: error.detail || 'No additional details'
    });
  }
});

module.exports = router;
