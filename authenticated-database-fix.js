// AUTHENTICATED PRODUCTION DATABASE FIX SCRIPT
// Copy and paste this entire script into browser console on production site

(async function fixProductionDatabaseWithAuth() {
  console.log('🔐 AUTHENTICATED PRODUCTION DATABASE FIX');
  console.log('='.repeat(50));
  console.log('Site:', window.location.origin);
  console.log('Time:', new Date().toISOString());
  console.log('');

  // Admin password for authentication
  const ADMIN_PASSWORD = 'roseball';

  // Test 1: Check Products API
  console.log('📦 CHECKING PRODUCTS API...');
  try {
    const response = await fetch('/api/products');
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      console.log('❌ Products API failed with status:', response.status);
      return;
    }
    
    const products = await response.json();
    console.log('Products count:', products.length);
    
    if (products.length === 0) {
      console.log('⚠️ No products found - database is empty');
      console.log('💡 Attempting to add products with authentication...');
      await attemptAuthenticatedDatabaseFix();
    } else {
      console.log('✅ Products found:');
      products.slice(0, 5).forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} - ₦${product.price}`);
      });
      console.log('🎉 Products API working correctly!');
    }
    
  } catch (error) {
    console.log('❌ Products API error:', error.message);
  }
  
  async function attemptAuthenticatedDatabaseFix() {
    console.log('\n🚀 ATTEMPTING AUTHENTICATED DATABASE FIX...');
    
    const productsToAdd = [
      { name: 'Wound-Care Honey Gauze Big (Carton)', price: 65000, description: 'Large honey-based wound care gauze, carton pack', unit_of_measure: 'carton' },
      { name: 'Wound-Care Honey Gauze Big (Packet)', price: 6000, description: 'Large honey-based wound care gauze, individual packet', unit_of_measure: 'packet' },
      { name: 'Wound-Care Honey Gauze Small (Carton)', price: 61250, description: 'Small honey-based wound care gauze, carton pack', unit_of_measure: 'carton' },
      { name: 'Wound-Care Honey Gauze Small (Packet)', price: 3500, description: 'Small honey-based wound care gauze, individual packet', unit_of_measure: 'packet' },
      { name: 'Hera Wound-Gel 100g (Carton)', price: 65000, description: 'Hera wound healing gel 100g, carton pack', unit_of_measure: 'carton' },
      { name: 'Hera Wound-Gel 100g (Tube)', price: 3250, description: 'Hera wound healing gel 100g, single tube', unit_of_measure: 'tube' },
      { name: 'Hera Wound-Gel 40g (Carton)', price: 48000, description: 'Hera wound healing gel 40g, carton pack', unit_of_measure: 'carton' },
      { name: 'Hera Wound-Gel 40g (Tube)', price: 2000, description: 'Hera wound healing gel 40g, single tube', unit_of_measure: 'tube' },
      { name: 'Coban Bandage 6 inch (Piece)', price: 4500, description: '6 inch Coban self-adherent wrap, single piece', unit_of_measure: 'piece' },
      { name: 'Coban Bandage 6 inch (Carton)', price: 48500, description: '6 inch Coban self-adherent wrap, carton pack', unit_of_measure: 'carton' },
      { name: 'Coban Bandage 4 inch (Piece)', price: 3500, description: '4 inch Coban self-adherent wrap, single piece', unit_of_measure: 'piece' },
      { name: 'Coban Bandage 4 inch (Carton)', price: 37500, description: '4 inch Coban self-adherent wrap, carton pack', unit_of_measure: 'carton' },
      { name: 'Silicone Scar Sheet (Packet)', price: 10000, description: 'Silicone scar reduction sheet, packet', unit_of_measure: 'packet' },
      { name: 'Silicone Scar Sheet (Block)', price: 90000, description: 'Silicone scar reduction sheet, bulk block', unit_of_measure: 'block' },
      { name: 'Silicone Foot Pad (Pair)', price: 2000, description: 'Silicone foot protection pad, pair', unit_of_measure: 'pair' },
      { name: 'Sterile Dressing Pack (Bag)', price: 10000, description: 'Sterile wound dressing pack, bag of multiple', unit_of_measure: 'bag' },
      { name: 'Sterile Dressing Pack (Piece)', price: 600, description: 'Sterile wound dressing pack, single piece', unit_of_measure: 'piece' },
      { name: 'Sterile Gauze-Only Pack (Bag)', price: 10000, description: 'Sterile gauze pack, bag of multiple', unit_of_measure: 'bag' },
      { name: 'Sterile Gauze-Only Pack (Piece)', price: 600, description: 'Sterile gauze pack, single piece', unit_of_measure: 'piece' },
      { name: 'Skin Staples (Piece)', price: 4000, description: 'Surgical skin staples, single piece', unit_of_measure: 'piece' },
      { name: 'NPWT (VAC) Foam (Piece)', price: 2000, description: 'Negative pressure wound therapy foam, single piece', unit_of_measure: 'piece' },
      { name: 'Opsite (Piece)', price: 6000, description: 'Transparent adhesive film dressing, single piece', unit_of_measure: 'piece' },
      { name: 'Wound-Clex Solution 500ml (Carton)', price: 12500, description: 'Wound cleaning solution 500ml, carton pack', unit_of_measure: 'carton' },
      { name: 'Wound-Clex Solution 500ml (Bottle)', price: 2300, description: 'Wound cleaning solution 500ml, single bottle', unit_of_measure: 'bottle' }
    ];
    
    let successCount = 0;
    let failCount = 0;
    
    // Add products in batches to avoid overwhelming the server
    const batchSize = 5;
    const batches = [];
    for (let i = 0; i < productsToAdd.length; i += batchSize) {
      batches.push(productsToAdd.slice(i, i + batchSize));
    }
    
    console.log(`📦 Processing ${productsToAdd.length} products in ${batches.length} batches...`);
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`\n📦 Processing batch ${batchIndex + 1}/${batches.length}...`);
      
      for (const product of batch) {
        try {
          console.log(`   ➡️ Adding: ${product.name}...`);
          
          const payload = {
            ...product,
            adminPassword: ADMIN_PASSWORD
          };
          
          const addResponse = await fetch('/api/admin/products', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
          });
          
          if (addResponse.ok) {
            const result = await addResponse.json();
            console.log(`   ✅ Added: ${product.name} (ID: ${result.id || 'unknown'})`);
            successCount++;
          } else {
            const errorText = await addResponse.text();
            console.log(`   ❌ Failed: ${product.name} - Status: ${addResponse.status}`);
            console.log(`   Error: ${errorText}`);
            failCount++;
          }
          
        } catch (error) {
          console.log(`   ❌ Failed: ${product.name} - ${error.message}`);
          failCount++;
        }
      }
      
      // Small delay between batches
      if (batchIndex < batches.length - 1) {
        console.log('   ⏳ Waiting before next batch...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('\n📊 AUTHENTICATED DATABASE FIX RESULTS:');
    console.log(`✅ Successfully added: ${successCount} products`);
    console.log(`❌ Failed to add: ${failCount} products`);
    console.log(`📦 Total attempted: ${productsToAdd.length} products`);
    
    if (successCount > 0) {
      console.log('\n🔄 Verifying products are now available...');
      
      setTimeout(async () => {
        try {
          const verifyResponse = await fetch('/api/products');
          if (verifyResponse.ok) {
            const verifyProducts = await verifyResponse.json();
            console.log(`🎉 Verification SUCCESS: ${verifyProducts.length} products now available`);
            
            if (verifyProducts.length > 0) {
              console.log('\n📋 Sample products now available:');
              verifyProducts.slice(0, 5).forEach((product, index) => {
                console.log(`   ${index + 1}. ${product.name} - ₦${product.price.toLocaleString()}`);
              });
              
              console.log('\n🔄 Reloading page to refresh product list...');
              window.location.reload();
            }
          }
        } catch (e) {
          console.log('❌ Verification failed:', e.message);
        }
      }, 2000);
    } else {
      console.log('\n💡 TROUBLESHOOTING:');
      console.log('All products failed to add. Possible issues:');
      console.log('1. Database connection problems');
      console.log('2. Table schema issues (missing unit_of_measure column)');
      console.log('3. Server-side errors');
      console.log('4. Network connectivity issues');
    }
  }
  
  console.log('\n💡 WHAT THIS SCRIPT DOES:');
  console.log('✅ Uses correct admin password (roseball)');
  console.log('✅ Adds all 24 medical products to database');
  console.log('✅ Processes in batches to avoid server overload');
  console.log('✅ Verifies products were added successfully');
  console.log('✅ Automatically reloads page when complete');
})();
