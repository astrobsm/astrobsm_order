/**
 * Production Database Migration Script
 * Run this on the production server to add the missing email column
 */

const pool = require('./server/database/db');

async function migrateProductionDatabase() {
    try {
        console.log('🚀 Starting production database migration...');
        
        // Step 1: Check if email column exists
        console.log('🔍 Checking if email column exists...');
        const checkColumn = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='customers' AND column_name='email'
        `);
        
        if (checkColumn.rows.length > 0) {
            console.log('✅ Email column already exists - no migration needed');
            return true;
        }
        
        console.log('📝 Email column not found - adding it...');
        
        // Step 2: Add email column
        await pool.query(`
            ALTER TABLE customers 
            ADD COLUMN email VARCHAR(255)
        `);
        
        console.log('✅ Email column added successfully');
        
        // Step 3: Verify the column was added
        const verifyColumn = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='customers' AND column_name='email'
        `);
        
        if (verifyColumn.rows.length > 0) {
            console.log('✅ Email column verified successfully');
            return true;
        } else {
            console.log('❌ Email column verification failed');
            return false;
        }
        
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
            console.log('🎉 Production database migration completed successfully!');
            console.log('📝 The order submission should now work properly.');
        } else {
            console.log('❌ Production database migration failed.');
            console.log('📝 The Customer model has fallback logic to handle missing email column.');
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
