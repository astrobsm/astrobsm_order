// COMPLETE DATABASE SETUP FIX - setup.js replacement
// This fixes all schema issues and database setup problems

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: process.env.DB_SSL && process.env.DB_SSL !== 'false' ? {
    rejectUnauthorized: false
  } : false
});

const createTables = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting complete database reset...');
    
    // STEP 1: Drop all existing tables to start fresh
    console.log('🗑️ Dropping existing tables...');
    await client.query('DROP TABLE IF EXISTS order_items CASCADE;');
    await client.query('DROP TABLE IF EXISTS orders CASCADE;');
    await client.query('DROP TABLE IF EXISTS products CASCADE;');
    await client.query('DROP TABLE IF EXISTS customers CASCADE;');
    console.log('✅ All existing tables dropped');

    // STEP 2: Create customers table with correct schema
    console.log('🏗️ Creating customers table...');
    await client.query(`
      CREATE TABLE customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        customer_id VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(50),
        address TEXT,
        company VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Customers table created');

    // STEP 3: Create products table (using PRICE, not unit_price)
    console.log('🏗️ Creating products table...');
    await client.query(`
      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        description TEXT,
        unit_of_measure VARCHAR(50) DEFAULT 'PCS',
        stock_quantity INTEGER DEFAULT 100,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Products table created');

    // STEP 4: Create orders table
    console.log('🏗️ Creating orders table...');
    await client.query(`
      CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        total_amount DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Orders table created');

    // STEP 5: Create order_items table (using PRICE, not unit_price)
    console.log('🏗️ Creating order_items table...');
    await client.query(`
      CREATE TABLE order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        product_name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Order_items table created');

    console.log('📦 Inserting products...');
    
    // Insert default products with proper error handling
    await insertDefaultProducts(client);
    
    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

const insertDefaultProducts = async (client) => {
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

  let successCount = 0;
  let errorCount = 0;

  for (const product of products) {
    try {
      // Extract unit of measure from product name
      const unitMatch = product.name.match(/\(([^)]+)\)$/);
      const unitOfMeasure = unitMatch ? unitMatch[1] : 'PCS';
      
      // Ensure price is valid
      const productPrice = parseFloat(product.price) || 0;
      
      if (productPrice <= 0) {
        console.log(`⚠️ Warning: Product "${product.name}" has invalid price: ${product.price}`);
        continue;
      }
      
      await client.query(
        'INSERT INTO products (name, price, description, unit_of_measure, stock_quantity) VALUES ($1, $2, $3, $4, $5)',
        [product.name, productPrice, product.description, unitOfMeasure, 100]
      );
      
      console.log(`✅ Product: "${product.name}" - ₦${productPrice.toLocaleString()}`);
      successCount++;
      
    } catch (error) {
      console.error(`❌ Error inserting product "${product.name}":`, error.message);
      errorCount++;
    }
  }
  
  console.log(`📊 Product insertion complete: ${successCount} successful, ${errorCount} failed`);
  
  if (errorCount > 0) {
    throw new Error(`Failed to insert ${errorCount} products`);
  }
};

// Run setup if called directly
if (require.main === module) {
  console.log('🚀 Starting database setup...');
  createTables().then(() => {
    console.log('✅ Database setup complete');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  });
}

module.exports = { createTables };
