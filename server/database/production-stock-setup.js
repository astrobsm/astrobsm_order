const pool = require('./db');

async function createStockTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Creating stock management tables...');
    
    // Start transaction
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
        reference_type VARCHAR(50), -- 'order', 'intake', 'adjustment'
        reference_id INTEGER, -- order_id, intake_id, etc.
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
    
    // Create indexes for better performance
    await client.query('CREATE INDEX IF NOT EXISTS idx_stock_inventory_product_id ON stock_inventory(product_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_stock_intake_product_id ON stock_intake(product_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_product_id ON low_stock_alerts(product_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_acknowledged ON low_stock_alerts(acknowledged);');
    
    // Create trigger function for updating updated_at timestamp
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    
    // Create trigger for stock_inventory
    await client.query(`
      DROP TRIGGER IF EXISTS update_stock_inventory_updated_at ON stock_inventory;
      CREATE TRIGGER update_stock_inventory_updated_at
        BEFORE UPDATE ON stock_inventory
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
    
    // Initialize stock inventory for existing products
    const productsResult = await client.query('SELECT id FROM products');
    const products = productsResult.rows;
    
    console.log(`🔄 Initializing stock inventory for ${products.length} products...`);
    
    for (const product of products) {
      // Check if stock inventory already exists
      const existingStock = await client.query(
        'SELECT id FROM stock_inventory WHERE product_id = $1',
        [product.id]
      );
      
      if (existingStock.rows.length === 0) {
        // Insert initial stock record
        await client.query(`
          INSERT INTO stock_inventory (product_id, current_stock, reorder_level, max_stock_level, last_restocked)
          VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        `, [product.id, 50, 10, 100]); // Default values
        
        // Log initial stock movement
        await client.query(`
          INSERT INTO stock_movements (product_id, movement_type, quantity, reference_type, notes)
          VALUES ($1, 'IN', $2, 'initialization', 'Initial stock setup')
        `, [product.id, 50]);
      }
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('✅ Stock management tables created and initialized successfully!');
    
    // Verify tables were created
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('stock_inventory', 'stock_movements', 'stock_intake', 'low_stock_alerts')
      ORDER BY table_name;
    `);
    
    console.log('📊 Stock tables created:');
    tablesResult.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });
    
    return {
      success: true,
      message: 'Stock management tables created successfully',
      tables: tablesResult.rows.map(row => row.table_name)
    };
    
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('❌ Error creating stock tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  createStockTables()
    .then(result => {
      console.log('🎉 Stock table creation completed!');
      console.log(result);
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Failed to create stock tables:', error);
      process.exit(1);
    });
}

module.exports = { createStockTables };