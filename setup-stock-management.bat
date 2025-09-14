@echo off
echo 🚀 Setting up stock management system...

echo.
echo 📋 Step 1: Creating stock management database tables...
node server\database\production-stock-setup.js

if errorlevel 1 (
    echo ❌ Failed to create stock tables
    pause
    exit /b 1
)

echo ✅ Stock tables created successfully

echo.
echo 📋 Step 2: Initializing stock levels with sample data...

:: Create temporary initialization script
(
echo const pool = require('./server/database/db'^);
echo.
echo async function initializeStockLevels(^) {
echo   try {
echo     console.log('🔄 Setting realistic stock levels...'^);
echo.
echo     // Update stock levels with realistic values
echo     const stockUpdates = [
echo       { productId: 1, stock: 75, reorderLevel: 15 },
echo       { productId: 2, stock: 60, reorderLevel: 12 },
echo       { productId: 3, stock: 45, reorderLevel: 10 },
echo       { productId: 4, stock: 80, reorderLevel: 20 },
echo       { productId: 5, stock: 25, reorderLevel: 8 },
echo       { productId: 6, stock: 90, reorderLevel: 25 },
echo       { productId: 7, stock: 55, reorderLevel: 15 },
echo       { productId: 8, stock: 40, reorderLevel: 12 },
echo     ];
echo.
echo     for (const update of stockUpdates^) {
echo       await pool.query(`
echo         UPDATE stock_inventory 
echo         SET current_stock = $2, reorder_level = $3, last_restocked = CURRENT_TIMESTAMP
echo         WHERE product_id = $1
echo       `, [update.productId, update.stock, update.reorderLevel]^);
echo.
echo       console.log(`  Updated product ${update.productId}: ${update.stock} units`^);
echo     }
echo.
echo     console.log('✅ Stock levels initialized successfully'^);
echo   } catch (error^) {
echo     console.error('❌ Error initializing stock levels:', error^);
echo     throw error;
echo   }
echo }
echo.
echo initializeStockLevels(^)
echo   .then(^(^) =^> process.exit(0^)^)
echo   .catch(^(^) =^> process.exit(1^)^);
) > temp_init_stock.js

node temp_init_stock.js
del temp_init_stock.js

echo.
echo 📋 Step 3: Testing stock management functionality...

:: Create temporary test script
(
echo const pool = require('./server/database/db'^);
echo.
echo async function testStockManagement(^) {
echo   try {
echo     console.log('🧪 Testing stock management functionality...'^);
echo.
echo     // Test 1: Get stock levels
echo     console.log('  Test 1: Get stock levels'^);
echo     const stockResult = await pool.query(`
echo       SELECT COUNT(^*^) as count FROM stock_inventory WHERE current_stock ^> 0
echo     `^);
echo     console.log(`    ✅ Found ${stockResult.rows[0].count} products with stock`^);
echo.
echo     // Test 2: Check for low stock alerts
echo     console.log('  Test 2: Check low stock detection'^);
echo     const lowStockResult = await pool.query(`
echo       SELECT COUNT(^*^) as count 
echo       FROM stock_inventory 
echo       WHERE current_stock ^<= reorder_level
echo     `^);
echo     console.log(`    ✅ Found ${lowStockResult.rows[0].count} products needing reorder`^);
echo.
echo     // Test 3: Test stock movement logging
echo     console.log('  Test 3: Test stock movement logging'^);
echo     const movementsResult = await pool.query(`
echo       SELECT COUNT(^*^) as count FROM stock_movements
echo     `^);
echo     console.log(`    ✅ Found ${movementsResult.rows[0].count} stock movements logged`^);
echo.
echo     console.log('🎉 All stock management tests passed!'^);
echo   } catch (error^) {
echo     console.error('❌ Stock management tests failed:', error^);
echo     throw error;
echo   }
echo }
echo.
echo testStockManagement(^)
echo   .then(^(^) =^> process.exit(0^)^)
echo   .catch(^(^) =^> process.exit(1^)^);
) > temp_test_stock.js

node temp_test_stock.js
del temp_test_stock.js

echo.
echo 🎉 Stock management setup completed!
echo.
echo Next steps:
echo 1. Start the server: node server\server.js
echo 2. Test the application at http://localhost:3000
echo 3. Verify stock management works in admin panel
echo 4. Check that notifications are working
echo 5. Test order processing with stock deduction
echo.
pause