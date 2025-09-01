// ASTRO-BSM Production Database Product Addition Script
// Copy and paste this entire script into the browser console on your live site
// Then call addAllProducts() to add all 24 medical products

const productCatalog = [
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

async function addAllProducts() {
  console.log('🚀 Starting to add', productCatalog.length, 'medical products to production database...');
  let successCount = 0;
  let failCount = 0;
  const results = [];
  
  for (let i = 0; i < productCatalog.length; i++) {
    const product = productCatalog[i];
    try {
      console.log(`📦 Adding product ${i + 1}/${productCatalog.length}: ${product.name}`);
      
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
          unit: product.unit,
          stock_quantity: 100
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
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error(`💥 Error adding ${product.name}:`, error);
      failCount++;
      results.push({ product: product.name, status: 'error', error: error.message });
    }
  }
  
  console.log('\n🎯 FINAL RESULTS:');
  console.log(`✅ Successfully added: ${successCount} products`);
  console.log(`❌ Failed: ${failCount} products`);
  console.log('\n📋 Detailed Results:', results);
  
  // Test if products are now available
  console.log('\n🔍 Testing product availability...');
  try {
    const testResponse = await fetch('/api/products');
    const products = await testResponse.json();
    console.log(`🎉 Products now available: ${products.length}`);
    
    if (products.length > 0) {
      console.log('✅ SUCCESS! Products are now loaded. Refresh the page to see them in the dropdown.');
    } else {
      console.log('⚠️ No products found. There may be an issue with the database.');
    }
  } catch (error) {
    console.error('❌ Error testing products:', error);
  }
}

// Instructions for use:
console.log(`
🔧 INSTRUCTIONS:
1. Make sure you're on your live site: https://astrobsm-orderform-l4b35.ondigitalocean.app/
2. Open browser Developer Tools (F12)
3. Go to the Console tab
4. Copy and paste this entire script
5. Call: addAllProducts()
6. Wait for completion
7. Refresh the page to see products in dropdown

Type: addAllProducts()
`);
