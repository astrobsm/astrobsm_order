const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const stockRoutes = require('./routes/stock');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      styleSrcElem: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://fonts.googleapis.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));
app.use(morgan('combined'));

// Enhanced CORS configuration for stock management
app.use(cors({
  origin: true, // Allow all origins for development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../')));

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve the main app
app.get('/', (req, res) => {
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

// Test database connection on startup
const pool = require('./database/db');

async function startServer() {
  try {
    // Test database connection with retry logic
    console.log('🔄 Testing database connection...');
    
    let retries = 3;
    while (retries > 0) {
      try {
        await pool.testConnection();
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw error;
        }
        console.log(`⚠️ Database connection failed, retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Initialize stock management tables on startup
    console.log('🔄 Checking stock management tables...');
    try {
      // Try to load the external function first
      const { createStockTables } = require('./database/production-stock-setup');
      await createStockTables();
      console.log('✅ Stock management tables ready (external setup)');
    
    // Fix production stock schema if needed
    try {
      console.log('🔧 Checking production stock schema...');
      const { fixAllStockSchemaIssues } = require('../fix-comprehensive-stock-schema.js');
      await fixAllStockSchemaIssues();
      console.log('✅ Production stock schema verified and fixed');
    } catch (error) {
      console.log('⚠️ Stock schema check completed (may not be needed):', error.message);
    }
    } catch (externalError) {
      console.log('⚠️ External setup failed, creating tables inline...', externalError.message);
      
      // Fallback: create tables inline
      const client = await pool.connect();
      try {
        console.log('🔄 Creating stock tables inline...');
        await client.query('BEGIN');
        
        // Create stock_inventory table
        await client.query(`
          CREATE TABLE IF NOT EXISTS stock_inventory (
            id SERIAL PRIMARY KEY,
            product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            current_stock INTEGER NOT NULL DEFAULT 0,
            reorder_level INTEGER NOT NULL DEFAULT 10,
            max_stock_level INTEGER NOT NULL DEFAULT 100,
            last_restocked TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(product_id)
          );
        `);
        
        // Create stock_movements table
        await client.query(`
          CREATE TABLE IF NOT EXISTS stock_movements (
            id SERIAL PRIMARY KEY,
            product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('IN', 'OUT', 'ADJUSTMENT')),
            quantity INTEGER NOT NULL,
            reference_type VARCHAR(50),
            reference_id INTEGER,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_by VARCHAR(100)
          );
        `);
        
        // Create stock_intake table
        await client.query(`
          CREATE TABLE IF NOT EXISTS stock_intake (
            id SERIAL PRIMARY KEY,
            product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            quantity INTEGER NOT NULL,
            unit_cost DECIMAL(10,2),
            supplier VARCHAR(255),
            batch_number VARCHAR(100),
            expiry_date DATE,
            intake_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            notes TEXT,
            created_by VARCHAR(100)
          );
        `);
        
        // Create low_stock_alerts table
        await client.query(`
          CREATE TABLE IF NOT EXISTS low_stock_alerts (
            id SERIAL PRIMARY KEY,
            product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('LOW', 'CRITICAL', 'OUT_OF_STOCK')),
            current_stock INTEGER NOT NULL,
            reorder_level INTEGER NOT NULL,
            alert_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            acknowledged BOOLEAN DEFAULT FALSE,
            acknowledged_at TIMESTAMP,
            acknowledged_by VARCHAR(100)
          );
        `);
        
        // Create indexes
        await client.query('CREATE INDEX IF NOT EXISTS idx_stock_inventory_product_id ON stock_inventory(product_id);');
        await client.query('CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);');
        await client.query('CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_product_id ON low_stock_alerts(product_id);');
        
        // Initialize stock for existing products
        const productsResult = await client.query('SELECT id FROM products');
        console.log(`🔄 Found ${productsResult.rows.length} products, initializing stock...`);
        
        for (const product of productsResult.rows) {
          const existingStock = await client.query(
            'SELECT id FROM stock_inventory WHERE product_id = $1',
            [product.id]
          );
          
          if (existingStock.rows.length === 0) {
            await client.query(`
              INSERT INTO stock_inventory (product_id, current_stock, reorder_level, max_stock_level, last_restocked)
              VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
            `, [product.id, 50, 10, 100]);
            
            await client.query(`
              INSERT INTO stock_movements (product_id, movement_type, quantity, reference_type, notes)
              VALUES ($1, 'IN', $2, 'initialization', 'Initial stock setup')
            `, [product.id, 50]);
          }
        }
        
        await client.query('COMMIT');
        console.log('✅ Stock management tables ready (inline creation)');
        
      } catch (inlineError) {
        await client.query('ROLLBACK');
        console.log('⚠️ Inline stock setup failed (tables may already exist):', inlineError.message);
      } finally {
        client.release();
      }
    }
    
    // Initialize payment system
    console.log('🔄 Setting up payment system...');
    try {
      const { runPaymentMigration } = require('./database/payment-migration');
      await runPaymentMigration();
      console.log('✅ Payment system ready');
    } catch (paymentError) {
      console.log('⚠️ Payment system setup failed (may already exist):', paymentError.message);
    }
    
    // Initialize user management system
    console.log('🔄 Setting up user management system...');
    try {
      const { createUserManagementTables } = require('./database/user-management-setup');
      await createUserManagementTables();
      console.log('✅ User management system ready');
    } catch (userMgmtError) {
      console.log('⚠️ User management setup failed (may already exist):', userMgmtError.message);
    }
    
    // Start server
    const server = app.listen(PORT, '0.0.0.0', async () => {
      console.log(`🚀 ASTRO-BSM Server running on port ${PORT}`);
      console.log(`📱 App available at http://localhost:${PORT}`);
      console.log(`🔗 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`💾 Database: Connected and ready`);
      
      // Skip production authentication fix for now
      console.log('✅ Server startup complete');
    });
    
    // Handle server shutdown gracefully
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('📴 Server closed');
        pool.end(() => {
          console.log('💾 Database connections closed');
          process.exit(0);
        });
      });
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('💡 Please check:');
    console.error('   - DATABASE_URL environment variable is set');
    console.error('   - Database server is running and accessible');
    console.error('   - Database credentials are correct');
    console.error('   - Network connectivity to database host');
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = app;
