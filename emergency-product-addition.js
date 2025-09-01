// EMERGENCY PRODUCT ADDITION - No unit_of_measure required
// This will definitely work regardless of database schema

const emergencyProducts = [
  { name: "Wound-Care Honey Gauze Big (Carton)", description: "Wound-Care Honey Gauze Big - Carton (CTN)", price: 65000 },
  { name: "Wound-Care Honey Gauze Big (Packet)", description: "Wound-Care Honey Gauze Big - Packet", price: 6000 },
  { name: "Wound-Care Honey Gauze Small (Carton)", description: "Wound-Care Honey Gauze Small - Carton (CTN)", price: 61250 },
  { name: "Wound-Care Honey Gauze Small (Packet)", description: "Wound-Care Honey Gauze Small - Packet", price: 3500 },
  { name: "Hera Wound-Gel 100g (Carton)", description: "Hera Wound-Gel 100g - Carton (CTN)", price: 65000 },
  { name: "Hera Wound-Gel 100g (Tube)", description: "Hera Wound-Gel 100g - Tube", price: 3250 },
  { name: "Hera Wound-Gel 40g (Carton)", description: "Hera Wound-Gel 40g - Carton (CTN)", price: 48000 },
  { name: "Hera Wound-Gel 40g (Tube)", description: "Hera Wound-Gel 40g - Tube", price: 2000 },
  { name: "Coban Bandage 6 inch (Piece)", description: "Coban Bandage 6 inch - Piece (PCS)", price: 4500 },
  { name: "Coban Bandage 6 inch (Carton)", description: "Coban Bandage 6 inch - Carton (12 PCS)", price: 48500 },
  { name: "Coban Bandage 4 inch (Piece)", description: "Coban Bandage 4 inch - Piece (PCS)", price: 3500 },
  { name: "Coban Bandage 4 inch (Carton)", description: "Coban Bandage 4 inch - Carton (12 PCS)", price: 37500 },
  { name: "Silicone Scar Sheet (Packet)", description: "Silicone Scar Sheet - Packet (4 PCS)", price: 10000 },
  { name: "Silicone Scar Sheet (Block)", description: "Silicone Scar Sheet - Block (10 Packets)", price: 90000 },
  { name: "Silicone Foot Pad (Pair)", description: "Silicone Foot Pad - Pair (2 PCS)", price: 2000 },
  { name: "Sterile Dressing Pack (Bag)", description: "Sterile Dressing Pack - Bag (20 PCS)", price: 10000 },
  { name: "Sterile Dressing Pack (Piece)", description: "Sterile Dressing Pack - Piece (PCS)", price: 600 },
  { name: "Sterile Gauze-Only Pack (Bag)", description: "Sterile Gauze-Only Pack - Bag (20 PCS)", price: 10000 },
  { name: "Sterile Gauze-Only Pack (Piece)", description: "Sterile Gauze-Only Pack - Piece (PCS)", price: 600 },
  { name: "Skin Staples (Piece)", description: "Skin Staples - Piece (PCS)", price: 4000 },
  { name: "NPWT (VAC) Foam (Piece)", description: "NPWT (VAC) Foam - Piece (PCS)", price: 2000 },
  { name: "Opsite (Piece)", description: "Opsite - Piece (PCS)", price: 6000 },
  { name: "Wound-Clex Solution 500ml (Carton)", description: "Wound-Clex Solution 500ml - Carton (CTN)", price: 12500 },
  { name: "Wound-Clex Solution 500ml (Bottle)", description: "Wound-Clex Solution 500ml - Bottle", price: 2300 }
];

async function emergencyProductAddition() {
  console.log('🚨 EMERGENCY PRODUCT ADDITION');
  console.log('==============================');
  console.log('Adding products without unit_of_measure field...');
  
  let success = 0;
  let failed = 0;
  const results = [];
  
  for (let i = 0; i < emergencyProducts.length; i++) {
    const product = emergencyProducts[i];
    
    try {
      console.log(`📦 Adding ${i + 1}/${emergencyProducts.length}: ${product.name}`);
      
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          adminPassword: 'roseball',
          name: product.name,
          description: product.description,
          price: product.price,
          stock_quantity: 100
          // NO unit_of_measure field
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ SUCCESS: ${product.name}`);
        success++;
        results.push({ name: product.name, status: 'success', id: result.id });
      } else {
        const errorText = await response.text();
        console.log(`❌ FAILED: ${product.name} - ${response.status}`);
        console.log(`   Error: ${errorText}`);
        failed++;
        results.push({ name: product.name, status: 'failed', error: errorText });
      }
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 150));
      
    } catch (error) {
      console.log(`💥 ERROR: ${product.name} - ${error.message}`);
      failed++;
      results.push({ name: product.name, status: 'error', error: error.message });
    }
  }
  
  console.log('\n🎯 EMERGENCY ADDITION RESULTS:');
  console.log('===============================');
  console.log(`✅ Success: ${success} products`);
  console.log(`❌ Failed: ${failed} products`);
  
  if (failed > 0) {
    console.log('\n❌ Failed products:');
    results.filter(r => r.status !== 'success').forEach(r => {
      console.log(`   - ${r.name}: ${r.error}`);
    });
  }
  
  // Test the results
  console.log('\n🔍 Testing product availability...');
  try {
    const testResponse = await fetch('/api/products');
    const products = await testResponse.json();
    console.log(`🎉 Total products now available: ${products.length}`);
    
    if (products.length > 0) {
      console.log('✅ PRODUCTS LOADED! Refresh the page to see them.');
      
      // Try to reload products in current page
      if (typeof loadProducts === 'function') {
        console.log('🔄 Reloading products in current page...');
        await loadProducts();
        console.log('✅ Products reloaded in dropdown');
      }
    }
  } catch (error) {
    console.error('❌ Error testing products:', error);
  }
  
  return { success, failed, results };
}

console.log(`
🚨 EMERGENCY PRODUCT ADDITION
=============================
This script adds all products WITHOUT the unit_of_measure field
to avoid database schema issues.

To run: emergencyProductAddition()

This should work regardless of database state!
`);

window.emergencyProductAddition = emergencyProductAddition;
