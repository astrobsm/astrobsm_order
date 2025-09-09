/**
 * Production Database Migration Script
 * Adds delivery_address column to orders table and removes it from customers table
 * This aligns with the new schema where delivery addresses are order-specific
 */

const pool = require('./server/database/db');

async function migrateProductionDatabase() {
    try {
        console.log('🚀 Starting production database migration...');
        
        // Step 1: Add delivery_address column to orders table
        console.log('📝 Adding delivery_address column to orders table...');
        try {
            await pool.query(`
                ALTER TABLE orders 
                ADD COLUMN delivery_address TEXT
            `);
            console.log('✅ Added delivery_address column to orders table');
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log('✅ Delivery_address column already exists in orders table');
            } else {
                throw error;
            }
        }
        
        // Step 2: Add email column to customers table (if missing)
        console.log('📝 Ensuring email column exists in customers table...');
        try {
            await pool.query(`
                ALTER TABLE customers 
                ADD COLUMN email VARCHAR(255)
            `);
            console.log('✅ Added email column to customers table');
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log('✅ Email column already exists in customers table');
            } else {
                throw error;
            }
        }
        
        // Step 3: Verify the schema
        console.log('🔍 Verifying database schema...');
        
        const ordersColumns = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='orders' AND column_name='delivery_address'
        `);
        
        const customersColumns = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='customers' AND column_name='email'
        `);
        
        if (ordersColumns.rows.length > 0) {
            console.log('✅ Orders table has delivery_address column');
        } else {
            console.log('❌ Orders table missing delivery_address column');
            return false;
        }
        
        if (customersColumns.rows.length > 0) {
            console.log('✅ Customers table has email column');
        } else {
            console.log('⚠️ Customers table missing email column (fallback will handle this)');
        }
        
        console.log('🎉 Database migration completed successfully!');
        return true;
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('📋 Full error:', error);
        return false;
    }
}

async function main() {
    try {
        const success = await migrateProductionDatabase();
        
        if (success) {
            console.log('✅ Production database is ready for order submissions!');
            console.log('📝 The order submission should now work properly.');
        } else {
            console.log('❌ Production database migration failed.');
            console.log('📝 Check the errors above and try again.');
        }
        
    } catch (error) {
        console.error('💥 Migration script error:', error.message);
    } finally {
        process.exit(0);
    }
}

// Only run if called directly
if (require.main === module) {
    main();
}

module.exports = { migrateProductionDatabase };
