# 🚨 IMMEDIATE FIX FOR PRODUCTION STOCK 500 ERRORS

## Current Status
Your production server at `https://astrobsm-order-placement-fykxb.ondigitalocean.app` is showing:
- `GET /api/stock/levels 500 (Internal Server Error)`
- `GET /api/stock/alerts 500 (Internal Server Error)`

## ⚡ URGENT DEPLOYMENT STEPS

### Step 1: SSH into your DigitalOcean server
```bash
ssh root@your-droplet-ip
# OR
ssh your-username@your-droplet-ip
```

### Step 2: Navigate to your application directory
```bash
# Common paths - try these in order:
cd /var/www/astrobsm_order
# OR
cd /opt/astrobsm_order  
# OR
cd ~/astrobsm_order
# OR find it with:
find / -name "package.json" -path "*/astrobsm*" 2>/dev/null
```

### Step 3: Pull latest fixes
```bash
git pull origin production-deploy-clean
```

### Step 4: Create and run the database setup (CRITICAL STEP)
```bash
# Create the stock setup script if it doesn't exist
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

createStockTables()
  .then(result => {
    console.log('🎉 Stock setup completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Stock setup failed:', error);
    process.exit(1);
  });
EOF
```

### Step 5: Run the database setup
```bash
node server/database/production-stock-setup.js
```

### Step 6: Restart your application
```bash
# If using PM2:
pm2 restart all

# If using systemd:
sudo systemctl restart your-app-service

# If running directly:
pkill node
nohup node server/server.js > server.log 2>&1 &
```

### Step 7: Verify the fix
```bash
# Test the endpoints:
curl https://astrobsm-order-placement-fykxb.ondigitalocean.app/api/stock/levels
curl "https://astrobsm-order-placement-fykxb.ondigitalocean.app/api/stock/alerts?acknowledged=false"

# Both should return JSON data, not 500 errors
```

## 🎯 ONE-LINER VERSION (if you're in a hurry)

After SSH'ing into your server and navigating to the app directory:

```bash
git pull origin production-deploy-clean && mkdir -p server/database && cat > server/database/fix.js << 'EOF'
const pool = require('./db');
(async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('CREATE TABLE IF NOT EXISTS stock_inventory (id SERIAL PRIMARY KEY, product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE, current_stock INTEGER NOT NULL DEFAULT 0, reorder_level INTEGER NOT NULL DEFAULT 10, max_stock_level INTEGER NOT NULL DEFAULT 100, last_restocked TIMESTAMP, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(product_id));');
    await client.query('CREATE TABLE IF NOT EXISTS stock_movements (id SERIAL PRIMARY KEY, product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE, movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('"'"'IN'"'"', '"'"'OUT'"'"', '"'"'ADJUSTMENT'"'"')), quantity INTEGER NOT NULL, reference_type VARCHAR(50), reference_id INTEGER, notes TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, created_by VARCHAR(100));');
    await client.query('CREATE TABLE IF NOT EXISTS stock_intake (id SERIAL PRIMARY KEY, product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE, quantity INTEGER NOT NULL, unit_cost DECIMAL(10,2), supplier VARCHAR(255), batch_number VARCHAR(100), expiry_date DATE, intake_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, notes TEXT, created_by VARCHAR(100));');
    await client.query('CREATE TABLE IF NOT EXISTS low_stock_alerts (id SERIAL PRIMARY KEY, product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE, alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('"'"'LOW'"'"', '"'"'CRITICAL'"'"', '"'"'OUT_OF_STOCK'"'"')), current_stock INTEGER NOT NULL, reorder_level INTEGER NOT NULL, alert_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, acknowledged BOOLEAN DEFAULT FALSE, acknowledged_at TIMESTAMP, acknowledged_by VARCHAR(100));');
    const products = await client.query('SELECT id FROM products');
    for (const product of products.rows) {
      const existing = await client.query('SELECT id FROM stock_inventory WHERE product_id = $1', [product.id]);
      if (existing.rows.length === 0) {
        await client.query('INSERT INTO stock_inventory (product_id, current_stock, reorder_level, max_stock_level, last_restocked) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)', [product.id, 50, 10, 100]);
        await client.query('INSERT INTO stock_movements (product_id, movement_type, quantity, reference_type, notes) VALUES ($1, '"'"'IN'"'"', $2, '"'"'initialization'"'"', '"'"'Initial stock setup'"'"')', [product.id, 50]);
      }
    }
    await client.query('COMMIT');
    console.log('✅ Stock tables created successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error);
  } finally {
    client.release();
    process.exit(0);
  }
})();
EOF
node server/database/fix.js && rm server/database/fix.js && pm2 restart all
```

## 🔍 Expected Results

After running these commands:

✅ **Database tables created:**
- `stock_inventory` (product stock levels)
- `stock_movements` (audit trail)
- `stock_intake` (supplier receipts)
- `low_stock_alerts` (notification system)

✅ **API endpoints working:**
- `/api/stock/levels` returns JSON (no 500 error)
- `/api/stock/alerts` returns JSON (no 500 error)

✅ **Application features enabled:**
- Admin panel stock management
- Real-time stock notifications
- Automatic stock deduction on orders

## ⏰ Total Time: 2-3 minutes

The fix is straightforward - the database tables just need to be created on your production server. Run the commands above to resolve the issue immediately!