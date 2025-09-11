// Database Connection Test for Digital Ocean
const { Pool } = require('pg');

// Test connection with your Digital Ocean database
const testConnection = async () => {
  const pool = new Pool({
    host: 'astrobsmvelvet-db-do-user-23752526-0.e.db.ondigitalocean.com',
    port: 25060,
    user: 'doadmin',
    password: 'REPLACE_WITH_ACTUAL_PASSWORD', // Replace with real password
    database: 'defaultdb',
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Testing Digital Ocean database connection...');
    const client = await pool.connect();
    console.log('✅ Connected successfully!');
    
    // Test query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Query successful:', result.rows[0]);
    
    // Check if your tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('📋 Existing tables:', tablesResult.rows);
    
    client.release();
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
};

testConnection();
