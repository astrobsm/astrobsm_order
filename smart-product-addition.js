// Quick Fix Product Addition - Browser Console Script
// This version automatically handles the unit_of_measure field issue

const productCatalogComplete = [
  { name: "Wound-Care Honey Gauze Big (Carton)", description: "Wound-Care Honey Gauze Big - Carton (CTN)", price: 65000, unit: "CTN" },
  { name: "Wound-Care Honey Gauze Big (Packet)", description: "Wound-Care Honey Gauze Big - Packet", price: 6000, unit: "Packet" },
  { name: "Wound-Care Honey Gauze Small (Carton)", description: "Wound-Care Honey Gauze Small - Carton (CTN)", price: 61250, unit: "CTN" },
  { name: "Wound-Care Honey Gauze Small (Packet)", description: "Wound-Care Honey Gauze Small - Packet", price: 3500, unit: "Packet" },
  { name: "Hera Wound-Gel 100g (Carton)", description: "Hera Wound-Gel 100g - Carton (CTN)", price: 65000, unit: "CTN" },
  { name: "Hera Wound-Gel 100g (Tube)", description: "Hera Wound-Gel 100g - Tube", price: 3250, unit: "Tube" },
  { name: "Hera Wound-Gel 40g (Carton)", description: "Hera Wound-Gel 40g - Carton (CTN)", price: 48000, unit: "CTN" },
  { name: "Hera Wound-Gel 40g (Tube)", description: "Hera Wound-Gel 40g - Tube", price: 2000, unit: "Tube" },
  { name: "Coban Bandage 6 inch (Piece)", description: "Coban Bandage 6 inch - Piece (PCS)", price: 4500, unit: "PCS" },
  { name: "Coban Bandage 6 inch (Carton)", description: "Coban Bandage 6 inch - Carton (12 PCS)", price: 48500, unit: "CTN" },
  { name: "Coban Bandage 4 inch (Piece)", description: "Coban Bandage 4 inch - Piece (PCS)", price: 3500, unit: "PCS" },
  { name: "Coban Bandage 4 inch (Carton)", description: "Coban Bandage 4 inch - Carton (12 PCS)", price: 37500, unit: "CTN" },
  { name: "Silicone Scar Sheet (Packet)", description: "Silicone Scar Sheet - Packet (4 PCS)", price: 10000, unit: "Packet" },
  { name: "Silicone Scar Sheet (Block)", description: "Silicone Scar Sheet - Block (10 Packets)", price: 90000, unit: "Block" },
  { name: "Silicone Foot Pad (Pair)", description: "Silicone Foot Pad - Pair (2 PCS)", price: 2000, unit: "Pair" },
  { name: "Sterile Dressing Pack (Bag)", description: "Sterile Dressing Pack - Bag (20 PCS)", price: 10000, unit: "Bag" },
  { name: "Sterile Dressing Pack (Piece)", description: "Sterile Dressing Pack - Piece (PCS)", price: 600, unit: "PCS" },
  { name: "Sterile Gauze-Only Pack (Bag)", description: "Sterile Gauze-Only Pack - Bag (20 PCS)", price: 10000, unit: "Bag" },
  { name: "Sterile Gauze-Only Pack (Piece)", description: "Sterile Gauze-Only Pack - Piece (PCS)", price: 600, unit: "PCS" },
  { name: "Skin Staples (Piece)", description: "Skin Staples - Piece (PCS)", price: 4000, unit: "PCS" },
  { name: "NPWT (VAC) Foam (Piece)", description: "NPWT (VAC) Foam - Piece (PCS)", price: 2000, unit: "PCS" },
  { name: "Opsite (Piece)", description: "Opsite - Piece (PCS)", price: 6000, unit: "PCS" },
  { name: "Wound-Clex Solution 500ml (Carton)", description: "Wound-Clex Solution 500ml - Carton (CTN)", price: 12500, unit: "CTN" },
  { name: "Wound-Clex Solution 500ml (Bottle)", description: "Wound-Clex Solution 500ml - Bottle", price: 2300, unit: "Bottle" }
];

async function addProductsWithFallback() {
  console.log('🚀 SMART PRODUCT ADDITION: Trying multiple methods...');
  let successCount = 0;
  let failCount = 0;
  const results = [];
  
  for (let i = 0; i < productCatalogComplete.length; i++) {
    const product = productCatalogComplete[i];
    console.log(`📦 Adding ${i + 1}/${productCatalogComplete.length}: ${product.name}`);
    
    // Try method 1: With unit_of_measure
    try {
      const response1 = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminPassword: 'roseball',
          name: product.name,
          description: product.description,
          price: product.price,
          unit_of_measure: product.unit,
          stock_quantity: 100
        })
      });
      
      if (response1.ok) {
        console.log(`✅ Method 1 success: ${product.name}`);
        successCount++;
        results.push({ product: product.name, status: 'success', method: 'with_unit' });
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }
    } catch (error1) {
      console.log(`⚠️ Method 1 failed for ${product.name}, trying method 2...`);
    }
    
    // Try method 2: Without unit_of_measure
    try {
      const response2 = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminPassword: 'roseball',
          name: product.name,
          description: product.description,
          price: product.price,
          stock_quantity: 100
        })
      });
      
      if (response2.ok) {
        console.log(`✅ Method 2 success: ${product.name}`);
        successCount++;
        results.push({ product: product.name, status: 'success', method: 'without_unit' });
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }
    } catch (error2) {
      console.log(`❌ Both methods failed for ${product.name}`);
    }
    
    // Both methods failed
    failCount++;
    results.push({ product: product.name, status: 'failed', error: 'Both methods failed' });
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n🎯 SMART ADDITION RESULTS:');
  console.log(`✅ Successfully added: ${successCount} products`);
  console.log(`❌ Failed: ${failCount} products`);
  
  // Test products
  try {
    const testResponse = await fetch('/api/products');
    const products = await testResponse.json();
    console.log(`🎉 Products available: ${products.length}`);
    
    if (products.length > 0) {
      console.log('✅ SUCCESS! Refresh the page to see products in dropdown');
      console.log('🔄 Reloading products in current page...');
      if (typeof loadProducts === 'function') {
        await loadProducts();
      }
    }
  } catch (error) {
    console.error('❌ Error testing products:', error);
  }
  
  return results;
}

console.log(`
🚀 SMART PRODUCT ADDITION SCRIPT
This tries multiple methods automatically:
1. First tries with unit_of_measure field
2. Falls back to without unit_of_measure if needed
3. Automatically reloads products when done

Type: addProductsWithFallback()
`);

window.addProductsWithFallback = addProductsWithFallback;
