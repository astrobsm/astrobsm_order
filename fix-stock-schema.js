// Fix Stock Intake Database Schema Issue
const pool = require('./server/database/db');

async function fixStockIntakeSchema() {
    console.log('🔧 Fixing stock_intake table schema...');
    
    let client;
    try {
        client = await pool.connect();
        
        // Check current schema
        console.log('🔍 Checking current stock_intake table structure...');
        const schemaResult = await client.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'stock_intake' 
            ORDER BY ordinal_position
        `);
        
        console.log('📋 Current columns:', schemaResult.rows);
        
        // Check if quantity_added column exists
        const hasQuantityAdded = schemaResult.rows.some(row => row.column_name === 'quantity_added');
        
        if (!hasQuantityAdded) {
            console.log('❌ Missing quantity_added column, adding it...');
            
            // Add missing columns to stock_intake table
            await client.query(`
                ALTER TABLE stock_intake 
                ADD COLUMN IF NOT EXISTS quantity_added INTEGER NOT NULL DEFAULT 0
            `);
            
            await client.query(`
                ALTER TABLE stock_intake 
                ADD COLUMN IF NOT EXISTS cost_per_unit DECIMAL(10,2)
            `);
            
            await client.query(`
                ALTER TABLE stock_intake 
                ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2)
            `);
            
            await client.query(`
                ALTER TABLE stock_intake 
                ADD COLUMN IF NOT EXISTS supplier VARCHAR(255)
            `);
            
            await client.query(`
                ALTER TABLE stock_intake 
                ADD COLUMN IF NOT EXISTS batch_number VARCHAR(100)
            `);
            
            await client.query(`
                ALTER TABLE stock_intake 
                ADD COLUMN IF NOT EXISTS expiry_date DATE
            `);
            
            await client.query(`
                ALTER TABLE stock_intake 
                ADD COLUMN IF NOT EXISTS notes TEXT
            `);
            
            console.log('✅ Added missing columns to stock_intake table');
        } else {
            console.log('✅ quantity_added column already exists');
        }
        
        // Verify the final schema
        console.log('🔍 Verifying updated schema...');
        const updatedSchemaResult = await client.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'stock_intake' 
            ORDER BY ordinal_position
        `);
        
        console.log('📋 Updated columns:', updatedSchemaResult.rows);
        
        // Test with a sample insert (then rollback)
        await client.query('BEGIN');
        
        try {
            await client.query(`
                INSERT INTO stock_intake (
                    product_id, quantity_added, cost_per_unit, supplier, notes
                ) VALUES ($1, $2, $3, $4, $5)
            `, [1, 10, 25.00, 'Test Supplier', 'Schema test']);
            
            console.log('✅ Test insert successful');
            await client.query('ROLLBACK'); // Don't save the test data
        } catch (testError) {
            await client.query('ROLLBACK');
            console.log('❌ Test insert failed:', testError.message);
        }
        
    } catch (error) {
        console.error('❌ Error fixing stock intake schema:', error.message);
        throw error;
    } finally {
        if (client) client.release();
    }
}

async function checkStockTables() {
    console.log('\n🔍 Checking all stock-related tables...');
    
    let client;
    try {
        client = await pool.connect();
        
        const tables = ['stock_intake', 'stock_inventory', 'stock_movements', 'low_stock_alerts'];
        
        for (const table of tables) {
            try {
                const result = await client.query(`
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_name = $1 
                    ORDER BY ordinal_position
                `, [table]);
                
                console.log(`📋 Table ${table}:`, result.rows.map(r => `${r.column_name} (${r.data_type})`));
            } catch (error) {
                console.log(`❌ Table ${table} not found or error:`, error.message);
            }
        }
        
    } catch (error) {
        console.error('❌ Error checking stock tables:', error.message);
    } finally {
        if (client) client.release();
    }
}

async function runFix() {
    try {
        console.log('🚀 Starting stock intake schema fix...\n');
        
        await checkStockTables();
        await fixStockIntakeSchema();
        
        console.log('\n✅ Stock intake schema fix completed successfully!');
        console.log('\n🧪 You can now test stock addition functionality.');
        
    } catch (error) {
        console.error('💥 Fix failed:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runFix();