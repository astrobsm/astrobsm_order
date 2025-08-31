// Script to add new medical products to the ASTRO-BSM Order System
// Run this in the browser console on your admin page or via API

const newProducts = [
  { name: "Wound-Care Honey Gauze Big (Carton)", description: "Wound-Care Honey Gauze Big - Carton (CTN)", price: 65000, unit: "CTN", stock_quantity: 50 },
  { name: "Wound-Care Honey Gauze Big (Packet)", description: "Wound-Care Honey Gauze Big - Packet", price: 6000, unit: "Packet", stock_quantity: 100 },
  { name: "Wound-Care Honey Gauze Small (Carton)", description: "Wound-Care Honey Gauze Small - Carton (CTN)", price: 61250, unit: "CTN", stock_quantity: 50 },
  { name: "Wound-Care Honey Gauze Small (Packet)", description: "Wound-Care Honey Gauze Small - Packet", price: 3500, unit: "Packet", stock_quantity: 100 },
  { name: "Hera Wound-Gel 100g (Carton)", description: "Hera Wound-Gel 100g - Carton (CTN)", price: 65000, unit: "CTN", stock_quantity: 30 },
  { name: "Hera Wound-Gel 100g (Tube)", description: "Hera Wound-Gel 100g - Tube", price: 3250, unit: "Tube", stock_quantity: 200 },
  { name: "Hera Wound-Gel 40g (Carton)", description: "Hera Wound-Gel 40g - Carton (CTN)", price: 48000, unit: "CTN", stock_quantity: 30 },
  { name: "Hera Wound-Gel 40g (Tube)", description: "Hera Wound-Gel 40g - Tube", price: 2000, unit: "Tube", stock_quantity: 200 },
  { name: "Coban Bandage 6 inch (Piece)", description: "Coban Bandage 6 inch - Piece (PCS)", price: 4500, unit: "PCS", stock_quantity: 150 },
  { name: "Coban Bandage 6 inch (Carton)", description: "Coban Bandage 6 inch - Carton (12 PCS)", price: 48500, unit: "CTN", stock_quantity: 25 },
  { name: "Coban Bandage 4 inch (Piece)", description: "Coban Bandage 4 inch - Piece (PCS)", price: 3500, unit: "PCS", stock_quantity: 150 },
  { name: "Coban Bandage 4 inch (Carton)", description: "Coban Bandage 4 inch - Carton (12 PCS)", price: 37500, unit: "CTN", stock_quantity: 25 },
  { name: "Silicone Scar Sheet (Packet)", description: "Silicone Scar Sheet - Packet (4 PCS)", price: 10000, unit: "Packet", stock_quantity: 80 },
  { name: "Silicone Scar Sheet (Block)", description: "Silicone Scar Sheet - Block (10 Packets)", price: 90000, unit: "Block", stock_quantity: 20 },
  { name: "Silicone Foot Pad (Pair)", description: "Silicone Foot Pad - Pair (2 PCS)", price: 2000, unit: "Pair", stock_quantity: 100 },
  { name: "Sterile Dressing Pack (Bag)", description: "Sterile Dressing Pack - Bag (20 PCS)", price: 10000, unit: "Bag", stock_quantity: 60 },
  { name: "Sterile Dressing Pack (Piece)", description: "Sterile Dressing Pack - Piece (PCS)", price: 600, unit: "PCS", stock_quantity: 300 },
  { name: "Sterile Gauze-Only Pack (Bag)", description: "Sterile Gauze-Only Pack - Bag (20 PCS)", price: 10000, unit: "Bag", stock_quantity: 60 },
  { name: "Sterile Gauze-Only Pack (Piece)", description: "Sterile Gauze-Only Pack - Piece (PCS)", price: 600, unit: "PCS", stock_quantity: 300 },
  { name: "Skin Staples (Piece)", description: "Skin Staples - Piece (PCS)", price: 4000, unit: "PCS", stock_quantity: 100 },
  { name: "NPWT (VAC) Foam (Piece)", description: "NPWT (VAC) Foam - Piece (PCS)", price: 2000, unit: "PCS", stock_quantity: 80 },
  { name: "Opsite (Piece)", description: "Opsite - Piece (PCS)", price: 6000, unit: "PCS", stock_quantity: 120 },
  { name: "Wound-Clex Solution 500ml (Carton)", description: "Wound-Clex Solution 500ml - Carton (CTN)", price: 12500, unit: "CTN", stock_quantity: 40 },
  { name: "Wound-Clex Solution 500ml (Bottle)", description: "Wound-Clex Solution 500ml - Bottle", price: 2300, unit: "Bottle", stock_quantity: 200 }
];

async function addProductsBatch() {
  console.log('Starting to add', newProducts.length, 'new medical products...');
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < newProducts.length; i++) {
    const product = newProducts[i];
    try {
      console.log(`Adding product ${i + 1}/${newProducts.length}: ${product.name}`);
      
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
          stock_quantity: product.stock_quantity
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Added: ${product.name} - ₦${product.price.toLocaleString()}`);
        successCount++;
      } else {
        const error = await response.json();
        console.error(`❌ Failed to add ${product.name}: ${error.error}`);
        failCount++;
      }
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`❌ Error adding ${product.name}:`, error);
      failCount++;
    }
  }
  
  console.log(`\n🎉 Product addition completed!`);
  console.log(`✅ Successfully added: ${successCount} products`);
  console.log(`❌ Failed to add: ${failCount} products`);
  console.log(`\nRefresh the page to see the new products in the dropdown!`);
}

// Run the batch addition
addProductsBatch();
