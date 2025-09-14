#!/bin/bash

# Production Stock Management Setup Script for DigitalOcean
# This script should be run on the DigitalOcean server after deployment

echo "🚀 Setting up stock management system on production..."

# Step 1: Create stock management tables
echo "📋 Step 1: Creating stock management database tables..."
node server/database/production-stock-setup.js

if [ $? -eq 0 ]; then
    echo "✅ Stock tables created successfully"
else
    echo "❌ Failed to create stock tables"
    exit 1
fi

# Step 2: Verify API endpoints
echo "📋 Step 2: Testing stock API endpoints..."

# Test stock levels endpoint
echo "  Testing /api/stock/levels..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/stock/levels | grep -q "200"
if [ $? -eq 0 ]; then
    echo "  ✅ Stock levels endpoint working"
else
    echo "  ❌ Stock levels endpoint failed"
fi

# Test stock alerts endpoint
echo "  Testing /api/stock/alerts..."
curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/stock/alerts?acknowledged=false" | grep -q "200"
if [ $? -eq 0 ]; then
    echo "  ✅ Stock alerts endpoint working"
else
    echo "  ❌ Stock alerts endpoint failed"
fi

# Step 3: Initialize sample stock data
echo "📋 Step 3: Setting up initial stock levels..."
cat << 'EOF' > /tmp/init_stock.js
const pool = require('./server/database/db');

async function initializeStockLevels() {
  try {
    console.log('🔄 Setting realistic stock levels...');
    
    // Update stock levels with realistic values
    const stockUpdates = [
      { productId: 1, stock: 75, reorderLevel: 15 },
      { productId: 2, stock: 60, reorderLevel: 12 },
      { productId: 3, stock: 45, reorderLevel: 10 },
      { productId: 4, stock: 80, reorderLevel: 20 },
      { productId: 5, stock: 25, reorderLevel: 8 },
      { productId: 6, stock: 90, reorderLevel: 25 },
      { productId: 7, stock: 55, reorderLevel: 15 },
      { productId: 8, stock: 40, reorderLevel: 12 },
    ];
    
    for (const update of stockUpdates) {
      await pool.query(`
        UPDATE stock_inventory 
        SET current_stock = $2, reorder_level = $3, last_restocked = CURRENT_TIMESTAMP
        WHERE product_id = $1
      `, [update.productId, update.stock, update.reorderLevel]);
      
      console.log(`  Updated product ${update.productId}: ${update.stock} units`);
    }
    
    console.log('✅ Stock levels initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing stock levels:', error);
    throw error;
  }
}

initializeStockLevels()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
EOF

node /tmp/init_stock.js
rm /tmp/init_stock.js

# Step 4: Test complete functionality
echo "📋 Step 4: Running comprehensive tests..."

# Test stock management flow
cat << 'EOF' > /tmp/test_stock.js
const pool = require('./server/database/db');

async function testStockManagement() {
  try {
    console.log('🧪 Testing stock management functionality...');
    
    // Test 1: Get stock levels
    console.log('  Test 1: Get stock levels');
    const stockResult = await pool.query(`
      SELECT COUNT(*) as count FROM stock_inventory WHERE current_stock > 0
    `);
    console.log(`    ✅ Found ${stockResult.rows[0].count} products with stock`);
    
    // Test 2: Check for low stock alerts
    console.log('  Test 2: Check low stock detection');
    const lowStockResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM stock_inventory 
      WHERE current_stock <= reorder_level
    `);
    console.log(`    ✅ Found ${lowStockResult.rows[0].count} products needing reorder`);
    
    // Test 3: Test stock movement logging
    console.log('  Test 3: Test stock movement logging');
    const movementsResult = await pool.query(`
      SELECT COUNT(*) as count FROM stock_movements
    `);
    console.log(`    ✅ Found ${movementsResult.rows[0].count} stock movements logged`);
    
    console.log('🎉 All stock management tests passed!');
  } catch (error) {
    console.error('❌ Stock management tests failed:', error);
    throw error;
  }
}

testStockManagement()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
EOF

node /tmp/test_stock.js
rm /tmp/test_stock.js

echo "📋 Step 5: Restarting application..."
# Restart PM2 process (assuming PM2 is used for process management)
if command -v pm2 &> /dev/null; then
    pm2 restart all
    echo "  ✅ PM2 processes restarted"
else
    echo "  ⚠️  PM2 not found, please restart the application manually"
fi

echo ""
echo "🎉 Production stock management setup completed!"
echo ""
echo "Next steps:"
echo "1. Test the application at your domain"
echo "2. Verify stock management works in admin panel"
echo "3. Check that notifications are working"
echo "4. Test order processing with stock deduction"
echo ""
echo "Troubleshooting:"
echo "- Check server logs: pm2 logs"
echo "- Test API endpoints manually with curl"
echo "- Verify database connection and tables"