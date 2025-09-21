// Enhanced Production Stock Schema Fix - Handle Multiple Schema Variations
const pool = require('./server/database/db');

async function fixAllStockSchemaIssues() {
    console.log('🔧 COMPREHENSIVE Production Stock Schema Fix');
    console.log('============================================');
    
    let client;
    try {
        client = await pool.connect();
        
        // 1. First, let's see what the current schema looks like
        console.log('\n🔍 Analyzing current stock_intake table structure...');
        
        const stockIntakeColumns = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'stock_intake' 
            ORDER BY ordinal_position
        `);
        
        console.log('📋 Current stock_intake columns:');
        stockIntakeColumns.rows.forEach(col => {
            console.log(`   ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable}`);
        });
        
        // 2. Check if we have the problematic schema
        const hasQuantityColumn = stockIntakeColumns.rows.some(row => row.column_name === 'quantity');
        const hasQuantityAddedColumn = stockIntakeColumns.rows.some(row => row.column_name === 'quantity_added');
        
        if (hasQuantityColumn && !hasQuantityAddedColumn) {
            console.log('\n🔄 Detected legacy schema with "quantity" column instead of "quantity_added"');
            console.log('📝 Renaming column to match expected schema...');
            
            // Rename the quantity column to quantity_added
            await client.query(`
                ALTER TABLE stock_intake 
                RENAME COLUMN quantity TO quantity_added
            `);
            
            console.log('✅ Renamed "quantity" to "quantity_added"');
        }
        
        // 3. Ensure all required columns exist with correct types
        console.log('\n🔧 Ensuring all required columns exist...');
        
        const requiredColumns = [
            { name: 'quantity_added', type: 'INTEGER', nullable: false, default: '0' },
            { name: 'cost_per_unit', type: 'DECIMAL(10,2)', nullable: true },
            { name: 'total_cost', type: 'DECIMAL(10,2)', nullable: true },
            { name: 'supplier', type: 'VARCHAR(255)', nullable: true },
            { name: 'batch_number', type: 'VARCHAR(100)', nullable: true },
            { name: 'expiry_date', type: 'DATE', nullable: true },
            { name: 'notes', type: 'TEXT', nullable: true }
        ];
        
        const currentColumns = stockIntakeColumns.rows.map(row => row.column_name);
        
        for (const col of requiredColumns) {
            if (!currentColumns.includes(col.name)) {
                console.log(`➕ Adding missing column: ${col.name}`);
                const nullConstraint = col.nullable ? '' : `NOT NULL DEFAULT ${col.default}`;
                await client.query(`
                    ALTER TABLE stock_intake 
                    ADD COLUMN ${col.name} ${col.type} ${nullConstraint}
                `);
            }
        }
        
        // 4. Fix stock_inventory table issues
        console.log('\n🔧 Checking stock_inventory table...');
        
        // Check if stock_inventory exists
        const stockInventoryExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'stock_inventory'
            )
        `);
        
        if (!stockInventoryExists.rows[0].exists) {
            console.log('📦 Creating stock_inventory table...');
            await client.query(`
                CREATE TABLE stock_inventory (
                    id SERIAL PRIMARY KEY,
                    product_id INTEGER REFERENCES products(id) UNIQUE,
                    current_stock INTEGER DEFAULT 100,
                    reorder_level INTEGER DEFAULT 10,
                    max_stock_level INTEGER DEFAULT 1000,
                    last_restocked TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
        }
        
        // 5. Initialize stock inventory for all products
        console.log('\n📦 Initializing stock inventory for all products...');
        
        await client.query(`
            INSERT INTO stock_inventory (product_id, current_stock, reorder_level)
            SELECT id, 100, 10 FROM products 
            WHERE id NOT IN (
                SELECT COALESCE(product_id, 0) FROM stock_inventory WHERE product_id IS NOT NULL
            )
            ON CONFLICT (product_id) DO NOTHING
        `);
        
        // 6. Update products table stock_quantity to match stock_inventory
        console.log('\n🔄 Synchronizing products.stock_quantity with stock_inventory...');
        
        await client.query(`
            UPDATE products 
            SET stock_quantity = COALESCE(si.current_stock, 100)
            FROM stock_inventory si 
            WHERE products.id = si.product_id
        `);
        
        // 7. Create stock_movements table if it doesn't exist
        console.log('\n🔧 Ensuring stock_movements table exists...');
        
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
        
        // 8. Test the fixed schema
        console.log('\n🧪 Testing fixed schema with sample operations...');
        
        const testProduct = await client.query('SELECT id FROM products LIMIT 1');
        if (testProduct.rows.length > 0) {
            const productId = testProduct.rows[0].id;
            
            // Test stock intake
            await client.query('BEGIN');
            try {
                const intakeResult = await client.query(`
                    INSERT INTO stock_intake (
                        product_id, quantity_added, cost_per_unit, supplier, notes
                    ) VALUES ($1, $2, $3, $4, $5)
                    RETURNING id
                `, [productId, 5, 20.00, 'Test Supplier', 'Schema test']);
                
                console.log('✅ Stock intake test successful');
                
                // Test stock adjustment
                const currentStock = await client.query(`
                    SELECT current_stock FROM stock_inventory WHERE product_id = $1
                `, [productId]);
                
                if (currentStock.rows.length > 0) {
                    await client.query(`
                        UPDATE stock_inventory 
                        SET current_stock = current_stock + $1, updated_at = CURRENT_TIMESTAMP
                        WHERE product_id = $2
                    `, [5, productId]);
                    
                    console.log('✅ Stock adjustment test successful');
                }
                
                await client.query('ROLLBACK'); // Don't save test data
            } catch (testError) {
                await client.query('ROLLBACK');
                console.log('❌ Schema test failed:', testError.message);
                throw testError;
            }
        }
        
        console.log('\n✅ ALL STOCK SCHEMA ISSUES FIXED SUCCESSFULLY!');
        console.log('\n📊 Final Schema Summary:');
        
        // Show final schema
        const finalSchema = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'stock_intake' 
            ORDER BY ordinal_position
        `);
        
        finalSchema.rows.forEach(col => {
            console.log(`   ✓ ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable}`);
        });
        
    } catch (error) {
        console.error('❌ Comprehensive schema fix failed:', error.message);
        console.error('Stack trace:', error.stack);
        throw error;
    } finally {
        if (client) client.release();
    }
}

async function runComprehensiveFix() {
    try {
        console.log('🚀 Starting comprehensive stock schema fix...\n');
        await fixAllStockSchemaIssues();
        console.log('\n🎉 Stock management is now ready for production!');
        console.log('\n📝 Next steps:');
        console.log('   1. Restart your application');
        console.log('   2. Test stock addition as superadmin');
        console.log('   3. Verify stock level adjustments work');
    } catch (error) {
        console.error('\n💥 Fix failed:', error.message);
        process.exit(1);
    } finally {
        if (pool && typeof pool.end === 'function') {
            await pool.end();
        }
    }
}

if (require.main === module) {
    runComprehensiveFix();
}

module.exports = {
    fixAllStockSchemaIssues,
    runComprehensiveFix
};