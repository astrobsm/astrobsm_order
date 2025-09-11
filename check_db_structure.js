// Diagnostic script to check actual database structure
(async () => {
  const URL = 'https://astrobsm-order-placement-fykxb.ondigitalocean.app';
  console.log('🔍 Checking Database Structure...');
  
  try {
    // Run the schema check endpoint to see what's actually in the database
    const schemaResponse = await fetch(`${URL}/api/setup-schema`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ setup_key: 'astrobsm-setup-2025' })
    });
    
    console.log('📡 Schema check status:', schemaResponse.status);
    const schemaResult = await schemaResponse.json();
    console.log('📋 Current database structure:', schemaResult);
    
    if (schemaResult.customers_structure) {
      console.log('\n📊 CUSTOMERS TABLE COLUMNS:');
      schemaResult.customers_structure.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
      
      const hasId = schemaResult.customers_structure.some(col => col.column_name === 'id');
      const hasCustomerId = schemaResult.customers_structure.some(col => col.column_name === 'customer_id');
      
      console.log('\n🔍 ANALYSIS:');
      console.log('- Has "id" column:', hasId);
      console.log('- Has "customer_id" column:', hasCustomerId);
      
      if (hasCustomerId && !hasId) {
        console.log('\n🎯 SOLUTION IDENTIFIED:');
        console.log('The production database uses "customer_id" as primary key');
        console.log('We need to update the frontend to work with this structure');
        console.log('\n📝 NEXT STEPS:');
        console.log('1. Update Customer model to handle customer_id');
        console.log('2. Or run the table recreation to fix the schema');
      } else if (hasId && !hasCustomerId) {
        console.log('\n✅ Schema looks correct - may be a different issue');
      } else {
        console.log('\n⚠️ Unusual schema detected - needs investigation');
      }
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
})();
