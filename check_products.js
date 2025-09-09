const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'astro_order_db',
  password: 'natiss_natiss',
  port: 5432,
});

pool.query('SELECT name, price FROM products ORDER BY name')
  .then(result => {
    console.log('📋 All products in database:');
    result.rows.forEach((product, index) => {
      console.log(`${index + 1}. "${product.name}" - ₦${product.price}`);
    });
    pool.end();
  })
  .catch(err => {
    console.error('Error:', err);
    pool.end();
  });
