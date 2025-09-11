const { Pool } = require('pg');
require('dotenv').config();

// Support both CONNECTION_STRING (Digital Ocean) and individual credentials
const poolConfig = process.env.DATABASE_URL 
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 5432,
    };

const pool = new Pool(poolConfig);

// Enhanced connection monitoring
pool.on('connect', (client) => {
  console.log('✅ New client connected to PostgreSQL database');
});

pool.on('error', (err, client) => {
  console.error('❌ Unexpected error on idle client:', err);
  console.error('Database connection lost, attempting to reconnect...');
});

pool.on('acquire', (client) => {
  console.log('📦 Client acquired from pool');
});

pool.on('release', (err, client) => {
  if (err) {
    console.error('❌ Error releasing client:', err.stack);
  }
});

// Test connection function
pool.testConnection = async () => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('🔍 Database test successful:', {
      time: result.rows[0].current_time,
      version: result.rows[0].pg_version.split(' ').slice(0, 2).join(' ')
    });
    return true;
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = pool;
