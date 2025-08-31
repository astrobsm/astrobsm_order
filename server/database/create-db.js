const { Client } = require('pg');
require('dotenv').config();

async function createDatabase() {
  // Connect to postgres database (default) to create our target database
  const client = new Client({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'postgres', // Connect to default postgres database
    password: process.env.DB_PASSWORD || 'natiss_natiss',
    port: process.env.DB_PORT || 5432,
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL server');

    // Check if database exists
    const checkDbQuery = `SELECT 1 FROM pg_database WHERE datname = '${process.env.DB_NAME || 'astro_order_db'}'`;
    const result = await client.query(checkDbQuery);

    if (result.rows.length === 0) {
      // Database doesn't exist, create it
      await client.query(`CREATE DATABASE ${process.env.DB_NAME || 'astro_order_db'}`);
      console.log(`Database '${process.env.DB_NAME || 'astro_order_db'}' created successfully`);
    } else {
      console.log(`Database '${process.env.DB_NAME || 'astro_order_db'}' already exists`);
    }

  } catch (error) {
    console.error('Error creating database:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\nPlease ensure PostgreSQL is running and accessible.');
      console.log('You can start PostgreSQL service and try again.');
    }
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  createDatabase().then(() => {
    console.log('Database creation process complete');
    process.exit(0);
  }).catch(error => {
    console.error('Database creation failed:', error);
    process.exit(1);
  });
}

module.exports = { createDatabase };
