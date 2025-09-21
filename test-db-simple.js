// Simple database connection test
require('dotenv').config();
const { Pool } = require('pg');

async function testConnection() {
    console.log('🔍 Testing database connection...');
    console.log('Database URL:', process.env.DATABASE_URL);
    
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });
    
    try {
        const client = await pool.connect();
        console.log('✅ Database connected successfully!');
        
        const result = await client.query('SELECT NOW()');
        console.log('✅ Query test successful:', result.rows[0]);
        
        client.release();
        await pool.end();
        
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
    }
}

testConnection();