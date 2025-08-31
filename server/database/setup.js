const pool = require('./db');

const createTables = async () => {
  try {
    // Create customers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50) NOT NULL,
        delivery_address TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        price DECIMAL(10,2),
        stock_quantity INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id),
        delivery_date DATE,
        delivery_route TEXT,
        preferred_delivery_method VARCHAR(255),
        request_status VARCHAR(50) DEFAULT 'can_wait_24hrs',
        subtotal DECIMAL(10,2) DEFAULT 0,
        vat_amount DECIMAL(10,2) DEFAULT 0,
        total_amount DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create order_items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2),
        subtotal DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Tables created successfully');
    
    // Insert default products
    await insertDefaultProducts();
    
  } catch (error) {
    console.error('Error creating tables:', error);
  }
};

const insertDefaultProducts = async () => {
  const products = [
    { name: 'Wound-Care Honey Gauze Big (CTN)', price: 150.00 },
    { name: 'Wound-Care Honey Gauze Big (Packets)', price: 25.00 },
    { name: 'Wound-Care Honey Gauze Small (CTN)', price: 120.00 },
    { name: 'Wound-Care Honey Gauze Small (Packets)', price: 20.00 },
    { name: 'Hera Wound-Gel 100g (CTN)', price: 200.00 },
    { name: 'Hera Wound-Gel 100g (Tubes)', price: 35.00 },
    { name: 'Hera Wound-Gel 40g (CTN)', price: 160.00 },
    { name: 'Hera Wound-Gel 40g (Tubes)', price: 28.00 },
    { name: 'Coban Bandage 6inc (PCS)', price: 15.00 },
    { name: 'Coban Bandage 4inc (PCS)', price: 12.00 },
    { name: 'Silicone Scar Sheet (Packet)', price: 45.00 },
    { name: 'Opsite (PCS)', price: 18.00 },
    { name: 'Wound-Clex Solution 500ml (CTN)', price: 180.00 },
    { name: 'Wound-Clex Solution 500ml (Bottles)', price: 30.00 },
    { name: 'Sterile Dressing Packs (PCS)', price: 22.00 }
  ];

  for (const product of products) {
    try {
      await pool.query(
        'INSERT INTO products (name, price, stock_quantity) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING',
        [product.name, product.price, 100]
      );
    } catch (error) {
      console.error('Error inserting product:', product.name, error);
    }
  }
  
  console.log('Default products inserted');
};

// Run setup if called directly
if (require.main === module) {
  createTables().then(() => {
    console.log('Database setup complete');
    process.exit(0);
  }).catch(error => {
    console.error('Database setup failed:', error);
    process.exit(1);
  });
}

module.exports = { createTables };
