const pool = require('./db');

const createStockTable = async () => {
  try {
    // Create stock_inventory table for detailed stock tracking
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stock_inventory (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        current_stock INTEGER NOT NULL DEFAULT 0,
        reorder_level INTEGER DEFAULT 10,
        max_stock_level INTEGER DEFAULT 1000,
        last_restocked TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(product_id)
      )
    `);

    // Create stock_movements table for audit trail
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        movement_type VARCHAR(20) NOT NULL, -- 'IN', 'OUT', 'ADJUSTMENT'
        quantity INTEGER NOT NULL,
        reason VARCHAR(255),
        reference_id INTEGER, -- order_id for sales, or intake_id for restocking
        reference_type VARCHAR(50), -- 'ORDER', 'INTAKE', 'ADJUSTMENT'
        previous_stock INTEGER,
        new_stock INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100) DEFAULT 'system'
      )
    `);

    // Create stock_intake table for restocking records
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stock_intake (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        quantity_added INTEGER NOT NULL,
        cost_per_unit DECIMAL(10,2),
        total_cost DECIMAL(10,2),
        supplier VARCHAR(255),
        batch_number VARCHAR(100),
        expiry_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100) DEFAULT 'admin'
      )
    `);

    // Create low_stock_alerts table for notification tracking
    await pool.query(`
      CREATE TABLE IF NOT EXISTS low_stock_alerts (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        alert_level VARCHAR(20) DEFAULT 'LOW', -- 'LOW', 'CRITICAL', 'OUT_OF_STOCK'
        current_stock INTEGER,
        reorder_level INTEGER,
        alert_sent BOOLEAN DEFAULT false,
        acknowledged BOOLEAN DEFAULT false,
        acknowledged_by VARCHAR(100),
        acknowledged_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add indexes for performance
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_stock_inventory_product_id ON stock_inventory(product_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_product_id ON low_stock_alerts(product_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_acknowledged ON low_stock_alerts(acknowledged)`);

    console.log('Stock management tables created successfully');
    
    // Initialize stock data for existing products
    await initializeStockData();
    
  } catch (error) {
    console.error('Error creating stock tables:', error);
    throw error;
  }
};

const initializeStockData = async () => {
  try {
    // Get all products
    const products = await pool.query('SELECT id, name, stock_quantity FROM products');
    
    for (const product of products.rows) {
      // Initialize stock_inventory for each product
      await pool.query(`
        INSERT INTO stock_inventory (product_id, current_stock, reorder_level, max_stock_level)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (product_id) 
        DO UPDATE SET 
          current_stock = EXCLUDED.current_stock,
          updated_at = CURRENT_TIMESTAMP
      `, [product.id, product.stock_quantity || 100, 10, 1000]);

      // Create initial stock movement record
      await pool.query(`
        INSERT INTO stock_movements (product_id, movement_type, quantity, reason, previous_stock, new_stock, reference_type)
        VALUES ($1, 'IN', $2, 'Initial stock setup', 0, $3, 'SETUP')
      `, [product.id, product.stock_quantity || 100, product.stock_quantity || 100]);
    }

    console.log('Stock data initialized for all products');
  } catch (error) {
    console.error('Error initializing stock data:', error);
    throw error;
  }
};

// Function to update product stock and sync with stock_inventory
const updateProductStock = async (productId, newStock, reason = 'Manual update', referenceType = 'ADJUSTMENT', referenceId = null) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get current stock
    const currentStockResult = await client.query(
      'SELECT current_stock FROM stock_inventory WHERE product_id = $1',
      [productId]
    );
    
    const previousStock = currentStockResult.rows[0]?.current_stock || 0;
    const stockDifference = newStock - previousStock;

    // Update stock_inventory
    await client.query(`
      UPDATE stock_inventory 
      SET current_stock = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE product_id = $2
    `, [newStock, productId]);

    // Update products table
    await client.query(`
      UPDATE products 
      SET stock_quantity = $1 
      WHERE id = $2
    `, [newStock, productId]);

    // Check which columns exist in stock_movements table (production compatibility)
    const columnsResult = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'stock_movements' AND table_schema = 'public'
    `);
    const availableColumns = columnsResult.rows.map(row => row.column_name);
    
    console.log('📋 Available stock_movements columns:', availableColumns);

    // Build INSERT query based on available columns
    const insertFields = ['product_id', 'movement_type', 'quantity'];
    const insertValues = [
      productId,
      stockDifference > 0 ? 'IN' : 'OUT',
      Math.abs(stockDifference)
    ];

    // Add optional fields if they exist
    const optionalFields = {
      'reason': reason,
      'previous_stock': previousStock,
      'new_stock': newStock,
      'reference_type': referenceType,
      'reference_id': referenceId
    };

    Object.entries(optionalFields).forEach(([field, value]) => {
      if (availableColumns.includes(field) && value !== undefined) {
        insertFields.push(field);
        insertValues.push(value);
      }
    });

    const placeholders = insertValues.map((_, i) => `$${i + 1}`).join(', ');
    const movementQuery = `
      INSERT INTO stock_movements (${insertFields.join(', ')}) 
      VALUES (${placeholders})
    `;

    console.log('📤 Stock movement query:', movementQuery, insertValues);
    
    // Record stock movement
    await client.query(movementQuery, insertValues);

    await client.query('COMMIT');
    console.log(`Stock updated for product ${productId}: ${previousStock} → ${newStock}`);
    
    // Check for low stock alerts
    await checkLowStockAlert(productId);
    
    return { success: true, previousStock, newStock, difference: stockDifference };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating product stock:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Function to check and create low stock alerts
const checkLowStockAlert = async (productId) => {
  try {
    const result = await pool.query(`
      SELECT 
        si.current_stock,
        si.reorder_level,
        p.name as product_name
      FROM stock_inventory si
      JOIN products p ON p.id = si.product_id
      WHERE si.product_id = $1
    `, [productId]);

    if (result.rows.length === 0) return;

    const { current_stock, reorder_level, product_name } = result.rows[0];
    
    let alertLevel = null;
    if (current_stock === 0) {
      alertLevel = 'OUT_OF_STOCK';
    } else if (current_stock <= Math.floor(reorder_level * 0.5)) {
      alertLevel = 'CRITICAL';
    } else if (current_stock <= reorder_level) {
      alertLevel = 'LOW';
    }

    if (alertLevel) {
      // Check if alert already exists and not acknowledged
      const existingAlert = await pool.query(`
        SELECT id FROM low_stock_alerts 
        WHERE product_id = $1 AND acknowledged = false
        ORDER BY created_at DESC LIMIT 1
      `, [productId]);

      if (existingAlert.rows.length === 0) {
        // Create new alert
        await pool.query(`
          INSERT INTO low_stock_alerts (product_id, alert_level, current_stock, reorder_level)
          VALUES ($1, $2, $3, $4)
        `, [productId, alertLevel, current_stock, reorder_level]);
        
        console.log(`${alertLevel} stock alert created for ${product_name}: ${current_stock} units remaining`);
      }
    }
  } catch (error) {
    console.error('Error checking low stock alert:', error);
  }
};

// Run setup if called directly
if (require.main === module) {
  createStockTable().then(() => {
    console.log('Stock management setup complete');
    process.exit(0);
  }).catch(error => {
    console.error('Stock management setup failed:', error);
    process.exit(1);
  });
}

module.exports = { 
  createStockTable, 
  initializeStockData, 
  updateProductStock, 
  checkLowStockAlert 
};