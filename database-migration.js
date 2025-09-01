// Database Migration Script - Add unit_of_measure column
// Run this in browser console first, before adding products

console.log('🔧 ASTRO-BSM Database Migration Script');
console.log('Adding unit_of_measure column to products table...');

async function runDatabaseMigration() {
  try {
    console.log('📡 Sending migration request...');
    
    const response = await fetch('/api/admin/migrate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        adminPassword: 'roseball',
        action: 'add_unit_of_measure_column'
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Migration successful:', result.message);
      return true;
    } else {
      const error = await response.text();
      console.error('❌ Migration failed:', error);
      return false;
    }
  } catch (error) {
    console.error('💥 Migration error:', error);
    return false;
  }
}

console.log(`
🔧 INSTRUCTIONS:
1. Run this migration first: runDatabaseMigration()
2. Then run the product addition script: addAllProducts()

Type: runDatabaseMigration()
`);

// Export function
window.runDatabaseMigration = runDatabaseMigration;
