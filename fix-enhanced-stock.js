// Enhanced Production Stock Fix - Comprehensive Database Repair
console.log('🔧 ENHANCED Production Stock Database Fix');

const pool = require('./server/database/db');

async function fixAllStockTables() {
    console.log('\n🔧 Comprehensive stock database repair...');
    
    let client;
    try {
        client = await pool.connect();
        
        // 1. Ensure all stock tables exist with correct schema
        console.log('📋 Creating/verifying stock tables...');
        
        // stock_intake table
        await client.query(`
            CREATE TABLE IF NOT EXISTS stock_intake (
                id SERIAL PRIMARY KEY,
                product_id INTEGER REFERENCES products(id),
                quantity_added INTEGER NOT NULL DEFAULT 0,
                cost_per_unit DECIMAL(10,2),
                total_cost DECIMAL(10,2),
                supplier VARCHAR(255),
                batch_number VARCHAR(100),
                expiry_date DATE,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by VARCHAR(255)
            )
        `);
        
        // stock_inventory table
        await client.query(`
            CREATE TABLE IF NOT EXISTS stock_inventory (
                id SERIAL PRIMARY KEY,
                product_id INTEGER UNIQUE REFERENCES products(id),
                current_stock INTEGER DEFAULT 100,
                reorder_level INTEGER DEFAULT 10,
                max_stock_level INTEGER DEFAULT 1000,
                last_restocked TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // stock_movements table
        await client.query(`
            CREATE TABLE IF NOT EXISTS stock_movements (
                id SERIAL PRIMARY KEY,
                product_id INTEGER REFERENCES products(id),
                movement_type VARCHAR(10) NOT NULL CHECK (movement_type IN ('IN', 'OUT')),
                quantity INTEGER NOT NULL,
                reason VARCHAR(255),
                reference_id INTEGER,
                reference_type VARCHAR(50),
                previous_stock INTEGER DEFAULT 0,
                new_stock INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by VARCHAR(255),
                notes TEXT
            )
        `);
        
        // low_stock_alerts table
        await client.query(`
            CREATE TABLE IF NOT EXISTS low_stock_alerts (
                id SERIAL PRIMARY KEY,
                product_id INTEGER REFERENCES products(id),
                alert_level VARCHAR(50) NOT NULL,
                current_stock INTEGER NOT NULL,
                reorder_level INTEGER NOT NULL,
                alert_sent BOOLEAN DEFAULT FALSE,
                acknowledged BOOLEAN DEFAULT FALSE,
                acknowledged_by VARCHAR(255),
                acknowledged_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        console.log('✅ Stock tables created/verified');
        
        // 2. Initialize stock inventory for ALL products
        console.log('\n📦 Initializing stock inventory for all products...');
        
        // Get all products
        const productsResult = await client.query('SELECT id, name FROM products ORDER BY id');
        console.log(`📋 Found ${productsResult.rows.length} products to initialize`);
        
        for (const product of productsResult.rows) {
            // Check if inventory exists
            const inventoryCheck = await client.query(
                'SELECT id FROM stock_inventory WHERE product_id = $1',
                [product.id]
            );
            
            if (inventoryCheck.rows.length === 0) {
                // Create inventory entry
                await client.query(`
                    INSERT INTO stock_inventory (product_id, current_stock, reorder_level, created_at, updated_at)
                    VALUES ($1, 100, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                `, [product.id]);
                
                console.log(`  ✅ Initialized inventory for: ${product.name}`);
            } else {
                console.log(`  ✓ Inventory exists for: ${product.name}`);
            }
            
            // Sync products table stock_quantity with inventory
            await client.query(`
                UPDATE products 
                SET stock_quantity = (
                    SELECT current_stock 
                    FROM stock_inventory 
                    WHERE product_id = $1
                )
                WHERE id = $1
            `, [product.id]);
        }
        
        console.log('✅ All products have inventory records');
        
        // 3. Fix any missing columns in existing tables
        console.log('\n🔧 Adding missing columns if needed...');
        
        const columnsToCheck = [
            {
                table: 'stock_intake',
                column: 'quantity_added',
                type: 'INTEGER NOT NULL DEFAULT 0'
            },
            {
                table: 'stock_movements', 
                column: 'previous_stock',
                type: 'INTEGER DEFAULT 0'
            },
            {
                table: 'stock_movements',
                column: 'new_stock', 
                type: 'INTEGER DEFAULT 0'
            }
        ];
        
        for (const col of columnsToCheck) {
            try {
                const columnExists = await client.query(`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = $1 AND column_name = $2
                `, [col.table, col.column]);
                
                if (columnExists.rows.length === 0) {
                    await client.query(`
                        ALTER TABLE ${col.table} 
                        ADD COLUMN ${col.column} ${col.type}
                    `);
                    console.log(`  ✅ Added ${col.column} to ${col.table}`);
                } else {
                    console.log(`  ✓ Column ${col.column} exists in ${col.table}`);
                }
            } catch (error) {
                console.log(`  ⚠️ Could not check/add ${col.column} to ${col.table}:`, error.message);
            }
        }
        
        // 4. Test all stock operations
        console.log('\n🧪 Testing stock operations...');
        
        const testProduct = productsResult.rows[0];
        if (testProduct) {
            await client.query('BEGIN');
            
            try {
                // Test stock intake
                await client.query(`
                    INSERT INTO stock_intake (product_id, quantity_added, supplier, notes)
                    VALUES ($1, 5, 'Test Supplier', 'Schema test - will rollback')
                `, [testProduct.id]);
                
                // Test stock movement
                await client.query(`
                    INSERT INTO stock_movements (product_id, movement_type, quantity, reason, previous_stock, new_stock)
                    VALUES ($1, 'IN', 5, 'Test movement', 100, 105)
                `, [testProduct.id]);
                
                // Test stock adjustment
                await client.query(`
                    UPDATE stock_inventory 
                    SET current_stock = 105, updated_at = CURRENT_TIMESTAMP
                    WHERE product_id = $1
                `, [testProduct.id]);
                
                console.log('✅ All stock operations test successful');
                await client.query('ROLLBACK'); // Don't save test data
                
            } catch (testError) {
                await client.query('ROLLBACK');
                console.log('❌ Stock operations test failed:', testError.message);
                throw testError;
            }
        }
        
        console.log('\n✅ Enhanced stock database repair completed successfully!');
        
    } catch (error) {
        console.error('❌ Enhanced stock fix failed:', error.message);
        throw error;
    } finally {
        if (client) client.release();
    }
}

async function runEnhancedFix() {
    try {
        console.log('🚀 Starting enhanced production stock fix...');
        await fixAllStockTables();
        console.log('\n🎉 Production stock database is now fully operational!');
        console.log('\n📋 Fixed:');
        console.log('  ✅ Stock intake functionality');
        console.log('  ✅ Stock level adjustments');
        console.log('  ✅ Stock movement tracking');
        console.log('  ✅ Low stock alerts');
        console.log('  ✅ All products have inventory records');
    } catch (error) {
        console.error('💥 Enhanced fix failed:', error.message);
        process.exit(1);
    } finally {
        if (pool && typeof pool.end === 'function') {
            await pool.end();
        }
    }
}

if (require.main === module) {
    runEnhancedFix();
}

module.exports = {
    fixAllStockTables,
    runEnhancedFix
};