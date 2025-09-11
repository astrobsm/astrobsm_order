# DIGITAL OCEAN MANUAL UPDATE GUIDE

## The Problem
- Local branch has schema fix endpoint
- GitHub push blocked by secret scanning  
- Digital Ocean can't deploy what's not on GitHub
- Schema fix endpoint returns 404

## The Solution: Manual App Spec Update

### Step 1: Go to Digital Ocean
1. Visit: https://cloud.digitalocean.com/apps
2. Click: `astrobsm-order-placement-fykxb`
3. Go to: **Settings** → **App Spec**

### Step 2: Edit App Spec
1. Click **Edit**
2. Find the `github` section (around line 10-15)
3. Change the branch to point to latest working commit

### Step 3: Alternative - Use GitHub Web Interface
1. Go to: https://github.com/astrobsm/astrobsm_order
2. Switch to `production-ready` branch
3. Click on `server/server.js`
4. Click **Edit** (pencil icon)
5. Add the schema fix endpoint code manually
6. Commit directly to GitHub

### Step 4: Copy Schema Fix Code
Add this code to server.js around line 93:

```javascript
// Temporary schema setup endpoint for production database fix
app.post('/api/setup-schema', async (req, res) => {
  console.log('🏗️ Schema setup endpoint called');
  
  if (req.body.setup_key !== 'astrobsm-setup-2025') {
    console.log('❌ Unauthorized schema setup attempt');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const pool = require('./database/db');
    
    console.log('🔍 Checking current database schema...');
    
    // Check current customers table structure
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'customers' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Current customers table structure:', tableInfo.rows);
    
    // Check if the table exists and has the right structure
    const hasIdColumn = tableInfo.rows.some(col => col.column_name === 'id');
    const hasCustomerIdColumn = tableInfo.rows.some(col => col.column_name === 'customer_id');
    
    console.log('🔍 Schema analysis:', { hasIdColumn, hasCustomerIdColumn });
    
    if (hasCustomerIdColumn && !hasIdColumn) {
      console.log('🔧 Fixing customer_id to id column naming...');
      await pool.query('ALTER TABLE customers RENAME COLUMN customer_id TO id;');
      console.log('✅ Renamed customer_id column to id');
    }
    
    // Ensure customers table has correct structure
    console.log('🏗️ Ensuring customers table has correct structure...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50) NOT NULL,
        delivery_address TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Ensure orders table references customers(id) correctly
    console.log('🏗️ Ensuring orders table structure...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id),
        delivery_date DATE,
        delivery_route VARCHAR(255),
        preferred_delivery_method VARCHAR(100),
        request_status VARCHAR(100),
        total_amount DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Ensure order_items table
    console.log('🏗️ Ensuring order_items table structure...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id),
        product_name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL,
        price DECIMAL(10,2)
      )
    `);
    
    // Verify final structure
    const finalTableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'customers' 
      ORDER BY ordinal_position
    `);
    
    console.log('✅ Database schema setup complete!');
    console.log('📋 Final customers table structure:', finalTableInfo.rows);
    
    res.json({ 
      success: true, 
      message: 'Database schema setup complete',
      tables_updated: ['customers', 'orders', 'order_items'],
      customers_structure: finalTableInfo.rows
    });
    
  } catch (error) {
    console.error('❌ Schema setup error:', error);
    res.status(500).json({ 
      error: 'Schema setup failed', 
      details: error.message,
      stack: error.stack 
    });
  }
});
```

### Step 5: After Update
1. Digital Ocean will auto-deploy
2. Wait 2-3 minutes
3. Run the browser console script again
4. Should see 401 instead of 404, then success!
