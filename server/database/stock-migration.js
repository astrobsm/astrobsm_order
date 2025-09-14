const { createStockTable } = require('./stock-setup');

const runStockMigration = async () => {
  console.log('Starting stock management migration...');
  
  try {
    await createStockTable();
    console.log('✅ Stock management migration completed successfully!');
    console.log('   - Created stock_inventory table');
    console.log('   - Created stock_movements table');
    console.log('   - Created stock_intake table');
    console.log('   - Created low_stock_alerts table');
    console.log('   - Initialized stock data for existing products');
    console.log('   - Added performance indexes');
  } catch (error) {
    console.error('❌ Stock management migration failed:', error);
    process.exit(1);
  }
};

// Run migration if called directly
if (require.main === module) {
  runStockMigration().then(() => {
    process.exit(0);
  });
}

module.exports = { runStockMigration };