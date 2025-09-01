// EMERGENCY PRODUCTION PRODUCT ADDITION SCRIPT
// Run this in browser console on your production site to add products immediately

async function emergencyProductAddition() {
  console.log('🚨 EMERGENCY PRODUCT ADDITION FOR PRODUCTION');
  console.log('🔧 Attempting to add products using the new endpoint...\n');
  
  const productsToAdd = [
    { name: 'Wound-Care Honey Gauze Big (Carton)', description: 'Honey-infused gauze for wound care - Large size carton', price: 65000, unit_of_measure: 'CTN' },
    { name: 'Wound-Care Honey Gauze Big (Packet)', description: 'Honey-infused gauze for wound care - Large size packet', price: 6000, unit_of_measure: 'Packet' },
    { name: 'Wound-Care Honey Gauze Small (Carton)', description: 'Honey-infused gauze for wound care - Small size carton', price: 61250, unit_of_measure: 'CTN' },
    { name: 'Wound-Care Honey Gauze Small (Packet)', description: 'Honey-infused gauze for wound care - Small size packet', price: 3500, unit_of_measure: 'Packet' },
    { name: 'Hera Wound-Gel 100g (Carton)', description: 'Advanced wound healing gel - 100g carton', price: 65000, unit_of_measure: 'CTN' },
    { name: 'Hera Wound-Gel 100g (Tube)', description: 'Advanced wound healing gel - 100g tube', price: 3250, unit_of_measure: 'Tube' },
    { name: 'Hera Wound-Gel 40g (Carton)', description: 'Advanced wound healing gel - 40g carton', price: 48000, unit_of_measure: 'CTN' },
    { name: 'Hera Wound-Gel 40g (Tube)', description: 'Advanced wound healing gel - 40g tube', price: 2000, unit_of_measure: 'Tube' },
    { name: 'Coban Bandage 6 inch (Piece)', description: 'Self-adherent wrap - 6 inch width', price: 4500, unit_of_measure: 'PCS' },
    { name: 'Coban Bandage 6 inch (Carton)', description: 'Self-adherent wrap - 6 inch carton (12 pieces)', price: 48500, unit_of_measure: 'CTN' },
    { name: 'Coban Bandage 4 inch (Piece)', description: 'Self-adherent wrap - 4 inch width', price: 3500, unit_of_measure: 'PCS' },
    { name: 'Coban Bandage 4 inch (Carton)', description: 'Self-adherent wrap - 4 inch carton (12 pieces)', price: 37500, unit_of_measure: 'CTN' },
    { name: 'Silicone Scar Sheet (Packet)', description: 'Medical grade silicone scar treatment - 4 pieces per packet', price: 10000, unit_of_measure: 'Packet' },
    { name: 'Silicone Scar Sheet (Block)', description: 'Medical grade silicone scar treatment - 10 packets per block', price: 90000, unit_of_measure: 'Block' },
    { name: 'Silicone Foot Pad (Pair)', description: 'Comfort silicone foot padding - 2 pieces per pair', price: 2000, unit_of_measure: 'Pair' },
    { name: 'Sterile Dressing Pack (Bag)', description: 'Complete sterile dressing kit - 20 pieces per bag', price: 10000, unit_of_measure: 'Bag' },
    { name: 'Sterile Dressing Pack (Piece)', description: 'Individual sterile dressing pack', price: 600, unit_of_measure: 'PCS' },
    { name: 'Sterile Gauze-Only Pack (Bag)', description: 'Sterile gauze pads - 20 pieces per bag', price: 10000, unit_of_measure: 'Bag' },
    { name: 'Sterile Gauze-Only Pack (Piece)', description: 'Individual sterile gauze pad', price: 600, unit_of_measure: 'PCS' },
    { name: 'Skin Staples (Piece)', description: 'Surgical skin staples for wound closure', price: 4000, unit_of_measure: 'PCS' },
    { name: 'NPWT (VAC) Foam (Piece)', description: 'Negative pressure wound therapy foam dressing', price: 2000, unit_of_measure: 'PCS' },
    { name: 'Opsite (Piece)', description: 'Transparent adhesive film dressing', price: 6000, unit_of_measure: 'PCS' },
    { name: 'Wound-Clex Solution 500ml (Carton)', description: 'Antimicrobial wound cleansing solution - 500ml carton', price: 12500, unit_of_measure: 'CTN' },
    { name: 'Wound-Clex Solution 500ml (Bottle)', description: 'Antimicrobial wound cleansing solution - 500ml bottle', price: 2300, unit_of_measure: 'Bottle' }
  ];
  
  let successCount = 0;
  let failCount = 0;
  let results = [];
  
  for (const product of productsToAdd) {
    try {
      console.log(`📦 Adding: ${product.name}...`);
      
      const response = await fetch('/api/admin/products/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: product.name,
          description: product.description,
          price: product.price,
          unit_of_measure: product.unit_of_measure,
          stock_quantity: 100,
          adminPassword: 'roseball'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ SUCCESS: ${product.name}`);
        successCount++;
        results.push({ product: product.name, status: 'SUCCESS', id: result.id });
      } else {
        const error = await response.json();
        console.error(`❌ FAILED: ${product.name} - ${error.error}`);
        failCount++;
        results.push({ product: product.name, status: 'FAILED', error: error.error });
      }
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error(`💥 ERROR: ${product.name} - ${error.message}`);
      failCount++;
      results.push({ product: product.name, status: 'ERROR', error: error.message });
    }
  }
  
  console.log('\n📊 EMERGENCY ADDITION RESULTS:');
  console.log(`✅ Successfully added: ${successCount} products`);
  console.log(`❌ Failed to add: ${failCount} products`);
  console.log(`📦 Total attempted: ${productsToAdd.length} products`);
  
  if (failCount > 0) {
    console.log('\n❌ FAILED PRODUCTS:');
    results.filter(r => r.status !== 'SUCCESS').forEach(r => {
      console.log(`   - ${r.product}: ${r.error}`);
    });
  }
  
  // Test if products are now available
  try {
    console.log('\n🔍 Verifying products are now available...');
    const productsResponse = await fetch('/api/products');
    if (productsResponse.ok) {
      const allProducts = await productsResponse.json();
      console.log(`✅ Total products now available: ${allProducts.length}`);
      
      // Refresh the frontend if the function exists
      if (typeof loadProducts === 'function') {
        await loadProducts();
        console.log('🔄 Frontend product list refreshed');
      }
    }
  } catch (error) {
    console.error('❌ Error verifying products:', error);
  }
  
  console.log('\n🎉 Emergency product addition completed!');
  
  return {
    success: successCount,
    failed: failCount,
    total: productsToAdd.length,
    results: results
  };
}

// Auto-run the emergency addition
console.log('🚀 Starting emergency product addition...');
emergencyProductAddition();
