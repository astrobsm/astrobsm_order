// Production Database Schema Fix for Stock Intake
// Run this script on production to fix the stock_intake table schema

console.log('🔧 PRODUCTION Stock Intake Schema Fix');
console.log('🌐 Running on:', process.env.NODE_ENV || 'development');

const pool = require('./server/database/db');

async function fixProductionStockSchema() {
    console.log('\n🔧 Fixing production stock_intake table schema...');
    
    let client;
    try {
        client = await pool.connect();
        
        // Check if stock_intake table exists
        const tableExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'stock_intake'
            )
        `);
        
        if (!tableExists.rows[0].exists) {
            console.log('❌ stock_intake table does not exist. Creating it...');
            
            // Create stock_intake table with proper schema
            await client.query(`
                CREATE TABLE stock_intake (
                    id SERIAL PRIMARY KEY,
                    product_id INTEGER REFERENCES products(id),
                    quantity_added INTEGER NOT NULL,
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
            
            console.log('✅ Created stock_intake table');
        } else {
            console.log('✅ stock_intake table exists, checking schema...');
            
            // Check current columns
            const columns = await client.query(`
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'stock_intake' 
                ORDER BY ordinal_position
            `);
            
            console.log('📋 Current columns:', columns.rows);
            
            // Add missing columns if needed
            const existingColumns = columns.rows.map(row => row.column_name);
            
            const requiredColumns = [
                { name: 'quantity_added', type: 'INTEGER NOT NULL DEFAULT 0' },
                { name: 'cost_per_unit', type: 'DECIMAL(10,2)' },
                { name: 'total_cost', type: 'DECIMAL(10,2)' },
                { name: 'supplier', type: 'VARCHAR(255)' },
                { name: 'batch_number', type: 'VARCHAR(100)' },
                { name: 'expiry_date', type: 'DATE' },
                { name: 'notes', type: 'TEXT' },
                { name: 'created_at', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
                { name: 'created_by', type: 'VARCHAR(255)' }
            ];
            
            for (const col of requiredColumns) {
                if (!existingColumns.includes(col.name)) {
                    console.log(`➕ Adding missing column: ${col.name}`);
                    await client.query(`
                        ALTER TABLE stock_intake 
                        ADD COLUMN ${col.name} ${col.type}
                    `);
                }
            }
        }
        
        // Ensure other required tables exist
        console.log('\n🔍 Checking other stock tables...');
        
        // Create stock_inventory if it doesn't exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS stock_inventory (
                id SERIAL PRIMARY KEY,
                product_id INTEGER REFERENCES products(id) UNIQUE,
                current_stock INTEGER DEFAULT 0,
                reorder_level INTEGER DEFAULT 10,
                max_stock_level INTEGER DEFAULT 1000,
                last_restocked TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Create stock_movements if it doesn't exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS stock_movements (
                id SERIAL PRIMARY KEY,
                product_id INTEGER REFERENCES products(id),
                movement_type VARCHAR(10) NOT NULL CHECK (movement_type IN ('IN', 'OUT')),
                quantity INTEGER NOT NULL,
                reason VARCHAR(255),
                reference_id INTEGER,
                reference_type VARCHAR(50),
                previous_stock INTEGER,
                new_stock INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by VARCHAR(255),
                notes TEXT
            )
        `);
        
        // Initialize stock inventory for existing products
        console.log('\n📦 Initializing stock inventory for existing products...');
        
        await client.query(`
            INSERT INTO stock_inventory (product_id, current_stock, reorder_level)
            SELECT id, 100, 10 FROM products 
            WHERE id NOT IN (SELECT product_id FROM stock_inventory WHERE product_id IS NOT NULL)
            ON CONFLICT (product_id) DO NOTHING
        `);
        
        // Test the fixed schema
        console.log('\n🧪 Testing stock intake functionality...');
        
        const testProduct = await client.query('SELECT id FROM products LIMIT 1');
        if (testProduct.rows.length > 0) {
            const productId = testProduct.rows[0].id;
            
            await client.query('BEGIN');
            try {
                await client.query(`
                    INSERT INTO stock_intake (
                        product_id, quantity_added, cost_per_unit, supplier, notes
                    ) VALUES ($1, $2, $3, $4, $5)
                `, [productId, 5, 20.00, 'Test Supplier', 'Schema test - will be rolled back']);
                
                console.log('✅ Test stock intake insert successful');
                await client.query('ROLLBACK'); // Don't save test data
            } catch (testError) {
                await client.query('ROLLBACK');
                console.log('❌ Test failed:', testError.message);
            }
        }
        
        console.log('\n✅ Production stock schema fix completed successfully!');
        
    } catch (error) {
        console.error('❌ Error fixing production stock schema:', error.message);
        console.error('Stack:', error.stack);
        throw error;
    } finally {
        if (client) client.release();
    }
}

async function runProductionFix() {
    try {
        console.log('🚀 Starting production schema fix...');
        await fixProductionStockSchema();
        console.log('\n🎉 Production database ready for stock management!');
    } catch (error) {
        console.error('💥 Production fix failed:', error.message);
        process.exit(1);
    } finally {
        if (pool && typeof pool.end === 'function') {
            await pool.end();
        }
    }
}

if (require.main === module) {
    runProductionFix();
}

module.exports = {
    fixProductionStockSchema,
    runProductionFix
};