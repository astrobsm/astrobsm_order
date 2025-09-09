const pool = require('./server/database/db');

async function testProducts() {
    try {
        console.log('Checking specific products...');
        
        const result = await pool.query(
            "SELECT name, price FROM products WHERE name ILIKE $1 OR name ILIKE $2",
            ['%Silicone%', '%Hera%']
        );
        
        console.log('Products found:');
        result.rows.forEach(p => {
            console.log(`- "${p.name}" - ₦${p.price}`);
        });
        
        // Also check all products
        const allResult = await pool.query("SELECT COUNT(*) FROM products");
        console.log(`\nTotal products in database: ${allResult.rows[0].count}`);
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        process.exit(0);
    }
}

testProducts();
