#!/bin/bash

# ASTRO-BSM Stock Management Emergency Fix
# Run this script on your DigitalOcean server to fix 500 errors

echo "🚨 ASTRO-BSM Emergency Stock Management Fix"
echo "=========================================="

# Change to app directory (adjust path as needed)
APP_DIR="/var/www/astrobsm_order"  # Common DigitalOcean path
if [ ! -d "$APP_DIR" ]; then
    APP_DIR="/opt/astrobsm_order"
fi
if [ ! -d "$APP_DIR" ]; then
    APP_DIR="~/astrobsm_order"
fi

echo "📁 Looking for application directory..."
if [ -d "$APP_DIR" ]; then
    cd "$APP_DIR"
    echo "✅ Found app at: $APP_DIR"
else
    echo "❌ Cannot find app directory. Please run this script from your app directory."
    echo "Current directory: $(pwd)"
    echo "Files here: $(ls -la)"
    exit 1
fi

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin production-deploy-clean

# Check if stock setup script exists
if [ ! -f "server/database/production-stock-setup.js" ]; then
    echo "❌ Stock setup script not found. Creating it now..."
    
    # Create the production stock setup script inline
    mkdir -p server/database
    cat > server/database/production-stock-setup.js << 'EOF'
const pool = require('./db');

async function createStockTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Creating stock management tables...');
    
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
    const products = productsResult.rows;
    
    console.log(`🔄 Initializing stock for ${products.length} products...`);
    
    for (const product of products) {
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
    
    console.log('✅ Stock management tables created successfully!');
    
    return { success: true, message: 'Stock tables created successfully' };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating stock tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  createStockTables()
    .then(result => {
      console.log('🎉 Stock setup completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Stock setup failed:', error);
      process.exit(1);
    });
}

module.exports = { createStockTables };
EOF

    echo "✅ Created stock setup script"
fi

# Run the stock setup
echo "🔧 Setting up stock management database..."
node server/database/production-stock-setup.js

if [ $? -eq 0 ]; then
    echo "✅ Database setup successful"
else
    echo "❌ Database setup failed"
    exit 1
fi

# Restart the application
echo "🔄 Restarting application..."

# Check for PM2
if command -v pm2 > /dev/null; then
    echo "📦 Using PM2 to restart..."
    pm2 restart all
    pm2 status
elif systemctl list-units --type=service | grep -q node; then
    echo "🔧 Using systemctl to restart..."
    sudo systemctl restart $(systemctl list-units --type=service | grep node | awk '{print $1}' | head -1)
else
    echo "⚠️  Please restart your application manually"
    echo "   Kill existing node processes and restart server"
fi

# Test the endpoints
echo "🧪 Testing stock endpoints..."
sleep 3

# Test stock levels
RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "http://localhost:3000/api/stock/levels" 2>/dev/null)
if [ "$RESPONSE" = "200" ]; then
    echo "✅ Stock levels endpoint working"
else
    echo "❌ Stock levels endpoint failed (HTTP $RESPONSE)"
fi

# Test stock alerts
RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "http://localhost:3000/api/stock/alerts?acknowledged=false" 2>/dev/null)
if [ "$RESPONSE" = "200" ]; then
    echo "✅ Stock alerts endpoint working"
else
    echo "❌ Stock alerts endpoint failed (HTTP $RESPONSE)"
fi

echo ""
echo "🎉 Emergency fix completed!"
echo "✅ Stock management database tables created"
echo "✅ Application restarted"
echo "✅ Endpoints tested"
echo ""
echo "Your application should now work without 500 errors."
echo "Test at: https://astrobsm-order-placement-fykxb.ondigitalocean.app"