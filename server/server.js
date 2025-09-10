const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const databaseRoutes = require('./routes/database');
const diagnosticsRoutes = require('./routes/diagnostics');
const databaseTestRoutes = require('./routes/database-test');

const app = express();
const PORT = process.env.PORT || 3000;

// Add error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('📋 Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "'unsafe-hashes'", "https://cdnjs.cloudflare.com"],
      scriptSrcAttr: ["'unsafe-inline'", "'unsafe-hashes'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));
app.use(morgan('combined'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from root directory (for PWA assets)
app.use(express.static(path.join(__dirname, '../'), {
  setHeaders: (res, path) => {
    // Set proper MIME types for PWA files
    if (path.endsWith('.webmanifest') || path.endsWith('manifest.json')) {
      res.setHeader('Content-Type', 'application/manifest+json');
    }
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
      // Prevent caching of app.js to ensure updates are loaded
      if (path.includes('app.js')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    }
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Serve public directory assets
app.use('/public', express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/database', databaseRoutes);
app.use('/api/diagnostics', diagnosticsRoutes);
app.use('/api/db-test', databaseTestRoutes);

// Health check endpoints
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Temporary schema setup endpoint for production database fix
app.post('/api/setup-schema', async (req, res) => {
  console.log('🏗️ Schema setup endpoint called');
  
  if (req.body.setup_key !== 'astrobsm-setup-2025') {
    console.log('❌ Unauthorized schema setup attempt');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const pool = require('./database/db');
    
    console.log('🔍 Checking current database schema...');
    
    // Check current customers table structure
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'customers' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Current customers table structure:', tableInfo.rows);
    
    // Check if the table exists and has the right structure
    const hasIdColumn = tableInfo.rows.some(col => col.column_name === 'id');
    const hasCustomerIdColumn = tableInfo.rows.some(col => col.column_name === 'customer_id');
    
    console.log('🔍 Schema analysis:', { hasIdColumn, hasCustomerIdColumn });
    
    if (hasCustomerIdColumn && !hasIdColumn) {
      console.log('🔧 Fixing customer_id to id column naming...');
      await pool.query('ALTER TABLE customers RENAME COLUMN customer_id TO id;');
      console.log('✅ Renamed customer_id column to id');
    }
    
    // Ensure customers table has correct structure
    console.log('🏗️ Ensuring customers table has correct structure...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50) NOT NULL,
        delivery_address TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Ensure orders table references customers(id) correctly
    console.log('🏗️ Ensuring orders table structure...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id),
        delivery_date DATE,
        delivery_route VARCHAR(255),
        preferred_delivery_method VARCHAR(100),
        request_status VARCHAR(100),
        total_amount DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Ensure order_items table
    console.log('🏗️ Ensuring order_items table structure...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id),
        product_name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL,
        price DECIMAL(10,2)
      )
    `);
    
    // Verify final structure
    const finalTableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'customers' 
      ORDER BY ordinal_position
    `);
    
    console.log('✅ Database schema setup complete!');
    console.log('📋 Final customers table structure:', finalTableInfo.rows);
    
    res.json({ 
      success: true, 
      message: 'Database schema setup complete',
      tables_updated: ['customers', 'orders', 'order_items'],
      customers_structure: finalTableInfo.rows
    });
    
  } catch (error) {
    console.error('❌ Schema setup error:', error);
    res.status(500).json({ 
      error: 'Schema setup failed', 
      details: error.message,
      stack: error.stack 
    });
  }
});

// Favicon endpoint
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Serve the main app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Serve admin tools page
app.get('/admin-tools', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin-tools.html'));
});

// Serve diagnostics page
app.get('/diagnostics', (req, res) => {
  res.sendFile(path.join(__dirname, '../diagnostics.html'));
});

// Serve diagnostics script
app.get('/production-diagnostics.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, '../production-diagnostics.js'));
});

// Serve improved diagnostics script
app.get('/improved-diagnostics.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, '../improved-diagnostics.js'));
});

// Serve production database fix script
app.get('/production-database-fix.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, '../production-database-fix.js'));
});

// Serve quick diagnostics script
app.get('/quick-diagnostics.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, '../quick-diagnostics.js'));
});

// Serve production schema fix script
app.get('/production-schema-fix.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, '../production-schema-fix.js'));
});

// Serve production schema fix script (CSP-safe version)
app.get('/production-schema-fix-safe.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, '../production-schema-fix-safe.js'));
});

// Serve schema investigation script
app.get('/schema-investigation-fix.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, '../schema-investigation-fix.js'));
});

// Serve final production fix script
app.get('/final-production-fix.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, '../final-production-fix.js'));
});

// Serve password-free fix script
app.get('/password-free-fix.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, '../password-free-fix.js'));
});

// Serve quick price update script
app.get('/quick-price-update.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, '../quick-price-update.js'));
});

// PWA routes - serve main app for all non-API routes (SPA behavior)
app.get('*', (req, res, next) => {
  // Skip API routes and static files
  if (req.path.startsWith('/api/') || 
      req.path.startsWith('/public/') ||
      req.path.includes('.')) {
    return next();
  }
  // Serve main app for all other routes
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`App available at http://localhost:${PORT}`);
});

module.exports = app;
