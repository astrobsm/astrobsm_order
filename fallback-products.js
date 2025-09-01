// Fallback Product Addition Script (without unit_of_measure)
// Use this if the main script fails with 500 errors

const productCatalogFallback = [
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

async function addAllProductsFallback() {
  console.log('🚀 FALLBACK: Adding', productCatalogFallback.length, 'products without unit_of_measure...');
  let successCount = 0;
  let failCount = 0;
  const results = [];
  
  for (let i = 0; i < productCatalogFallback.length; i++) {
    const product = productCatalogFallback[i];
    try {
      console.log(`📦 Adding product ${i + 1}/${productCatalogFallback.length}: ${product.name}`);
      
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
          // No unit_of_measure field
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Successfully added: ${product.name}`);
        successCount++;
        results.push({ product: product.name, status: 'success', id: result.id });
      } else {
        const error = await response.text();
        console.error(`❌ Failed to add ${product.name}:`, error);
        failCount++;
        results.push({ product: product.name, status: 'failed', error: error });
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error(`💥 Error adding ${product.name}:`, error);
      failCount++;
      results.push({ product: product.name, status: 'error', error: error.message });
    }
  }
  
  console.log('\n🎯 FALLBACK RESULTS:');
  console.log(`✅ Successfully added: ${successCount} products`);
  console.log(`❌ Failed: ${failCount} products`);
  
  // Test products
  try {
    const testResponse = await fetch('/api/products');
    const products = await testResponse.json();
    console.log(`🎉 Products now available: ${products.length}`);
  } catch (error) {
    console.error('❌ Error testing products:', error);
  }
}

console.log(`
🔧 FALLBACK PRODUCT ADDITION:
Use this if the main script fails with 500 errors.
This version doesn't include unit_of_measure field.

Type: addAllProductsFallback()
`);

window.addAllProductsFallback = addAllProductsFallback;
