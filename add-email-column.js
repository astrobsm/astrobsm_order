const pool = require('./server/database/db');

async function addEmailColumn() {
    try {
        console.log('🔧 Adding missing email column to customers table...');
        
        // First check if email column exists
        const checkColumn = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='customers' AND column_name='email'
        `);
        
        if (checkColumn.rows.length > 0) {
            console.log('✅ Email column already exists');
            return;
        }
        
        // Add email column
        await pool.query(`
            ALTER TABLE customers 
            ADD COLUMN email VARCHAR(255)
        `);
        
        console.log('✅ Email column added successfully');
        
        // Verify the column was added
        const verifyColumn = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='customers' AND column_name='email'
        `);
        
        if (verifyColumn.rows.length > 0) {
            console.log('✅ Email column verified');
        } else {
            console.log('❌ Email column verification failed');
        }
        
    } catch (error) {
        console.error('❌ Error adding email column:', error.message);
    } finally {
        process.exit(0);
    }
}

addEmailColumn();
