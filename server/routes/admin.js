const express = require('express');
const Product = require('../models/Product');
const pool = require('../database/db');
const router = express.Router();

// Password verification middleware
const verifyAdminPassword = (req, res, next) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  if (password !== adminPassword) {
    return res.status(401).json({ error: 'Invalid admin password' });
  }
  
  next();
};

// Schema info endpoint
router.post('/schema-info', verifyAdminPassword, async (req, res) => {
  try {
    console.log('🔍 Checking products table schema...');
    
    // Check if table exists and get column info
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'products'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      return res.json({ 
        tableExists: false, 
        columns: [],
        message: 'Products table does not exist' 
      });
    }
    
    // Get column information
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'products'
      ORDER BY ordinal_position;
    `);
    
    res.json({
      tableExists: true,
      columns: columns.rows,
      message: 'Schema information retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Error getting schema info:', error);
    res.status(500).json({ 
      error: 'Failed to get schema info', 
      details: error.message 
    });
  }
});

// Schema fix endpoint
router.post('/fix-schema', verifyAdminPassword, async (req, res) => {
  try {
    console.log('🔧 Fixing products table schema...');
    
    // Create products table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        price DECIMAL(10,2),
        stock_quantity INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Add missing columns if they don't exist
    const alterQueries = [
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS price DECIMAL(10,2)`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
    ];
    
    for (const query of alterQueries) {
      try {
        await pool.query(query);
      } catch (error) {
        console.log(`Query already applied or not needed: ${query}`);
      }
    }
    
    // Add unique constraint on name if it doesn't exist
    try {
      await pool.query(`
        ALTER TABLE products ADD CONSTRAINT products_name_unique UNIQUE (name)
      `);
    } catch (error) {
      console.log('Unique constraint on name already exists or not needed');
    }
    
    console.log('✅ Schema fix completed');
    res.json({ 
      success: true, 
      message: 'Products table schema fixed successfully' 
    });
    
  } catch (error) {
    console.error('❌ Error fixing schema:', error);
    res.status(500).json({ 
      error: 'Failed to fix schema', 
      details: error.message 
    });
  }
});

// GET all products for admin management
router.get('/products', async (req, res) => {
  try {
    console.log('📋 Admin GET products request received');
    const products = await Product.findAll();
    console.log(`✅ Found ${products.length} products for admin`);
    res.json(products);
  } catch (error) {
    console.error('❌ Error fetching products for admin:', error);
    console.error('Error stack:', error.stack);
    
    // Check if it's a table not found error
    if (error.message.includes('does not exist') || error.code === '42P01') {
      console.log('Products table does not exist, returning empty array');
      res.json([]);
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch products', 
        details: error.message,
        code: error.code || 'UNKNOWN'
      });
    }
  }
});

// POST version for admin management (with password verification)
router.post('/products', async (req, res) => {
  try {
    console.log('📋 Admin POST products request received');
    console.log('Request body keys:', Object.keys(req.body));
    
    const { password, adminPassword } = req.body;
    const submittedPassword = password || adminPassword;
    const adminPasswordEnv = process.env.ADMIN_PASSWORD || 'admin123';
    
    // Verify admin password
    if (submittedPassword !== adminPasswordEnv) {
      console.log('❌ Invalid admin password');
      return res.status(401).json({ error: 'Invalid admin password' });
    }
    
    // If this is just a fetch request with password
    if (submittedPassword && Object.keys(req.body).length === 1) {
      console.log('🔐 Password-protected product fetch request');
      console.log('✅ Admin password verified for product fetch');
      const products = await Product.findAll();
      console.log(`✅ Found ${products.length} products for admin`);
      return res.json(products);
    }
    
    // Otherwise, this is an add product request
    console.log('📦 Admin product addition request received');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { name, description, price, stock_quantity, unit_of_measure, unit } = req.body;

    console.log('✅ Admin password verified');

    // Handle both 'unit' and 'unit_of_measure' fields for compatibility
    const unitToUse = unit_of_measure || unit || 'PCS';
    console.log('🔧 Unit to use:', unitToUse);

    console.log('📝 Creating product with data:', {
      name,
      description,
      price,
      stock_quantity: stock_quantity || 100,
      unit_of_measure: unitToUse
    });

    const product = await Product.create({
      name,
      description,
      price,
      stock_quantity: stock_quantity || 100,
      unit_of_measure: unitToUse
    });

    console.log('✅ Product created successfully:', product);
    res.status(201).json(product);
    
  } catch (error) {
    console.error('❌ Error adding product:', error);
    console.error('Error stack:', error.stack);
    
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ error: 'Product with this name already exists' });
    } else if (error.code === '42703') { // Column does not exist
      console.log('🔧 Column does not exist, trying fallback...');
      res.status(500).json({ 
        error: 'Database schema issue - unit_of_measure column missing', 
        details: error.message,
        suggestion: 'Try using the emergency addition script without unit_of_measure'
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to add product', 
        details: error.message,
        code: error.code || 'UNKNOWN'
      });
    }
  }
});

// Add new product route (separate endpoint for clarity)
router.post('/products/add', async (req, res) => {
  try {
    console.log('📦 Admin product addition request received');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { name, description, price, stock_quantity, unit_of_measure, unit, adminPassword } = req.body;
    
    // Verify admin password
    if (adminPassword !== 'roseball') {
      console.log('❌ Unauthorized access attempt');
      return res.status(401).json({ error: 'Unauthorized access' });
    }

    console.log('✅ Admin password verified');

    // Handle both 'unit' and 'unit_of_measure' fields for compatibility
    const unitToUse = unit_of_measure || unit || 'PCS';
    console.log('🔧 Unit to use:', unitToUse);

    console.log('📝 Creating product with data:', {
      name,
      description,
      price,
      stock_quantity: stock_quantity || 100,
      unit_of_measure: unitToUse
    });

    const product = await Product.create({
      name,
      description,
      price,
      stock_quantity: stock_quantity || 100,
      unit_of_measure: unitToUse
    });

    console.log('✅ Product created successfully:', product);
    res.status(201).json(product);
    
  } catch (error) {
    console.error('❌ Error adding product:', error);
    console.error('Error stack:', error.stack);
    
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ error: 'Product with this name already exists' });
    } else if (error.code === '42703') { // Column does not exist
      console.log('🔧 Column does not exist, trying fallback...');
      res.status(500).json({ 
        error: 'Database schema issue - unit_of_measure column missing', 
        details: error.message,
        suggestion: 'Try using the emergency addition script without unit_of_measure'
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to add product', 
        details: error.message,
        code: error.code || 'UNKNOWN'
      });
    }
  }
});

// Update product (admin only)
router.put('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock_quantity, adminPassword, pricePassword } = req.body;
    
    // Verify admin password
    if (adminPassword !== 'roseball') {
      return res.status(401).json({ error: 'Unauthorized access' });
    }

    // If price is being updated, verify additional password
    const currentProduct = await Product.findById(id);
    if (price !== undefined && price !== currentProduct.price) {
      if (pricePassword !== 'redvelvet') {
        return res.status(401).json({ error: 'Price editing requires additional authorization' });
      }
    }

    const updatedProduct = await Product.update(id, {
      name,
      description,
      price,
      stock_quantity
    });

    if (!updatedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product (admin only)
router.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminPassword } = req.body;
    
    // Verify admin password
    if (adminPassword !== 'roseball') {
      return res.status(401).json({ error: 'Unauthorized access' });
    }

    const deleted = await Product.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Database migration endpoint
router.post('/migrate', async (req, res) => {
  try {
    const { adminPassword, action } = req.body;
    
    // Verify admin password
    if (adminPassword !== 'roseball') {
      return res.status(401).json({ error: 'Unauthorized access' });
    }

    if (action === 'add_unit_of_measure_column') {
      // Check if column already exists
      const columnCheck = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'unit_of_measure'
      `);

      if (columnCheck.rows.length > 0) {
        return res.json({ message: 'Column unit_of_measure already exists' });
      }

      // Add the column
      await pool.query('ALTER TABLE products ADD COLUMN unit_of_measure VARCHAR(50) DEFAULT \'PCS\'');
      
      // Update existing products with default unit
      await pool.query('UPDATE products SET unit_of_measure = \'PCS\' WHERE unit_of_measure IS NULL');
      
      res.json({ message: 'Successfully added unit_of_measure column to products table' });
    } else {
      res.status(400).json({ error: 'Unknown migration action' });
    }
  } catch (error) {
    console.error('Error running migration:', error);
    res.status(500).json({ error: 'Failed to run migration', details: error.message });
  }
});

module.exports = router;
