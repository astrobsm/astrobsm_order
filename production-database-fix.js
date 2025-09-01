// PRODUCTION DATABASE STATUS AND FIX SCRIPT
// Run this in browser console on production site to check and fix database issues

(async function checkAndFixProductionDatabase() {
  console.log('🔍 PRODUCTION DATABASE STATUS CHECK');
  console.log('='.repeat(50));
  console.log('Site:', window.location.origin);
  console.log('Time:', new Date().toISOString());
  console.log('');

  // Test 1: Check Products API
  console.log('📦 CHECKING PRODUCTS API...');
  try {
    const response = await fetch('/api/products');
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (!response.ok) {
      console.log('❌ Products API failed with status:', response.status);
      const text = await response.text();
      console.log('Response text:', text);
      return;
    }
    
    const products = await response.json();
    console.log('Products data type:', typeof products);
    console.log('Products is array:', Array.isArray(products));
    console.log('Products count:', products.length);
    
    if (products.length === 0) {
      console.log('⚠️ No products found - database might be empty');
      console.log('💡 Attempting to add products via admin API...');
      await attemptDatabaseFix();
    } else {
      console.log('✅ Products found:');
      products.slice(0, 5).forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} - ₦${product.price}`);
      });
      console.log('🎉 Products API working correctly!');
    }
    
  } catch (error) {
    console.log('❌ Products API error:', error.message);
    console.log('💡 This might be a network or server issue');
  }
  
  // Test 2: Check Admin API availability
  console.log('\n🔧 CHECKING ADMIN API AVAILABILITY...');
  try {
    const adminResponse = await fetch('/api/admin/products');
    console.log('Admin API status:', adminResponse.status);
    
    if (adminResponse.ok) {
      const adminProducts = await adminResponse.json();
      console.log('✅ Admin API accessible');
      console.log('Admin products count:', adminProducts.length);
    } else {
      console.log('⚠️ Admin API returned status:', adminResponse.status);
    }
  } catch (error) {
    console.log('❌ Admin API error:', error.message);
  }
  
  async function attemptDatabaseFix() {
    console.log('\n🚀 ATTEMPTING DATABASE FIX...');
    
    const sampleProducts = [
      { name: 'Wound-Care Honey Gauze Big (Carton)', price: 65000, description: 'Large honey-based wound care gauze, carton pack', unit_of_measure: 'carton' },
      { name: 'Wound-Care Honey Gauze Big (Packet)', price: 6000, description: 'Large honey-based wound care gauze, individual packet', unit_of_measure: 'packet' },
      { name: 'Hera Wound-Gel 100g (Carton)', price: 65000, description: 'Hera wound healing gel 100g, carton pack', unit_of_measure: 'carton' },
      { name: 'Hera Wound-Gel 100g (Tube)', price: 3250, description: 'Hera wound healing gel 100g, single tube', unit_of_measure: 'tube' },
      { name: 'Coban Bandage 6 inch (Piece)', price: 4500, description: '6 inch Coban self-adherent wrap, single piece', unit_of_measure: 'piece' }
    ];
    
    let successCount = 0;
    let failCount = 0;
    
    for (const product of sampleProducts) {
      try {
        console.log(`📦 Adding: ${product.name}...`);
        
        const addResponse = await fetch('/api/admin/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(product)
        });
        
        if (addResponse.ok) {
          const result = await addResponse.json();
          console.log(`✅ Added: ${product.name} (ID: ${result.id || 'unknown'})`);
          successCount++;
        } else {
          const errorText = await addResponse.text();
          console.log(`❌ Failed: ${product.name} - Status: ${addResponse.status}`);
          console.log(`   Error: ${errorText}`);
          failCount++;
        }
        
      } catch (error) {
        console.log(`❌ Failed: ${product.name} - ${error.message}`);
        failCount++;
      }
    }
    
    console.log('\n📊 DATABASE FIX RESULTS:');
    console.log(`✅ Successfully added: ${successCount} products`);
    console.log(`❌ Failed to add: ${failCount} products`);
    
    if (successCount > 0) {
      console.log('\n🔄 Refreshing products check...');
      setTimeout(async () => {
        try {
          const verifyResponse = await fetch('/api/products');
          if (verifyResponse.ok) {
            const verifyProducts = await verifyResponse.json();
            console.log(`🎉 Verification: ${verifyProducts.length} products now available`);
            
            // Trigger a page refresh to reload products
            if (verifyProducts.length > 0) {
              console.log('🔄 Reloading page to refresh product list...');
              window.location.reload();
            }
          }
        } catch (e) {
          console.log('❌ Verification failed:', e.message);
        }
      }, 2000);
    }
  }
  
  console.log('\n💡 MANUAL FIX INSTRUCTIONS:');
  console.log('If products are still empty after this script:');
  console.log('1. Contact the server administrator');
  console.log('2. Run: node smart-seed-database.js on the server');
  console.log('3. Check database connection and environment variables');
  console.log('4. Verify the database service is running');
})();
