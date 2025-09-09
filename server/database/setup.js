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
  // Updated product list - perfectly synchronized with frontend dropdown
  const products = [
    { name: "Wound-Care Honey Gauze Big (Carton)", price: 65000, description: "Medical supply: Wound-Care Honey Gauze Big (Carton)" },
    { name: "Wound-Care Honey Gauze Big (Packet)", price: 6000, description: "Medical supply: Wound-Care Honey Gauze Big (Packet)" },
    { name: "Wound-Care Honey Gauze Small (Carton)", price: 61250, description: "Medical supply: Wound-Care Honey Gauze Small (Carton)" },
    { name: "Wound-Care Honey Gauze Small (Packet)", price: 3500, description: "Medical supply: Wound-Care Honey Gauze Small (Packet)" },
    { name: "Hera Wound-Gel 100g (Carton)", price: 65000, description: "Medical supply: Hera Wound-Gel 100g (Carton)" },
    { name: "Hera Wound-Gel 100g (Tube)", price: 3250, description: "Medical supply: Hera Wound-Gel 100g (Tube)" },
    { name: "Hera Wound-Gel 40g (Carton)", price: 48000, description: "Medical supply: Hera Wound-Gel 40g (Carton)" },
    { name: "Hera Wound-Gel 40g (Tube)", price: 2000, description: "Medical supply: Hera Wound-Gel 40g (Tube)" },
    { name: "Coban Bandage 6 inch (Piece)", price: 4500, description: "Medical supply: Coban Bandage 6 inch (Piece)" },
    { name: "Coban Bandage 6 inch (Carton)", price: 48500, description: "Medical supply: Coban Bandage 6 inch (Carton)" },
    { name: "Coban Bandage 4 inch (Piece)", price: 3500, description: "Medical supply: Coban Bandage 4 inch (Piece)" },
    { name: "Coban Bandage 4 inch (Carton)", price: 37500, description: "Medical supply: Coban Bandage 4 inch (Carton)" },
    { name: "Silicone Scar Sheet (Packet)", price: 10000, description: "Medical supply: Silicone Scar Sheet (Packet)" },
    { name: "Silicone Scar Sheet (Block)", price: 90000, description: "Medical supply: Silicone Scar Sheet (Block)" },
    { name: "Silicone Foot Pad (Pair)", price: 2000, description: "Medical supply: Silicone Foot Pad (Pair)" },
    { name: "Sterile Dressing Pack (Bag)", price: 10000, description: "Medical supply: Sterile Dressing Pack (Bag)" },
    { name: "Sterile Dressing Pack (Piece)", price: 600, description: "Medical supply: Sterile Dressing Pack (Piece)" },
    { name: "Sterile Gauze-Only Pack (Bag)", price: 10000, description: "Medical supply: Sterile Gauze-Only Pack (Bag)" },
    { name: "Sterile Gauze-Only Pack (Piece)", price: 600, description: "Medical supply: Sterile Gauze-Only Pack (Piece)" },
    { name: "Skin Staples (Piece)", price: 4000, description: "Medical supply: Skin Staples (Piece)" },
    { name: "NPWT (VAC) Foam (Piece)", price: 2000, description: "Medical supply: NPWT (VAC) Foam (Piece)" },
    { name: "Opsite (Piece)", price: 6000, description: "Medical supply: Opsite (Piece)" },
    { name: "Wound-Clex Solution 500ml (Carton)", price: 12500, description: "Medical supply: Wound-Clex Solution 500ml (Carton)" },
    { name: "Wound-Clex Solution 500ml (Bottle)", price: 2300, description: "Medical supply: Wound-Clex Solution 500ml (Bottle)" }
  ];

  for (const product of products) {
    try {
      // Extract unit of measure from product name
      const unitMatch = product.name.match(/\(([^)]+)\)$/);
      const unitOfMeasure = unitMatch ? unitMatch[1] : 'PCS';
      
      await pool.query(
        'INSERT INTO products (name, price, description, unit_of_measure, stock_quantity, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) ON CONFLICT (name) DO UPDATE SET price = $2, description = $3, unit_of_measure = $4, created_at = NOW()',
        [product.name, product.price, product.description, unitOfMeasure, 100]
      );
      console.log(`✅ Product: "${product.name}" - ₦${product.price}`);
    } catch (error) {
      console.error('Error inserting product:', product.name, error);
    }
  }
  
  console.log('Default products inserted successfully');
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
