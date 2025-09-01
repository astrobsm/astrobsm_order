// Alternative method to add products - Direct API approach without admin authentication
// This bypasses the admin route and tries to add products directly

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

// Test different endpoints to see which one works
async function testEndpoints() {
  console.log('🔍 Testing available endpoints...');
  
  const endpoints = [
    '/api/products',
    '/api/admin/products',
    '/api/database/health',
    '/api/orders'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint);
      console.log(`${endpoint}: ${response.status} ${response.statusText}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`  Data:`, data);
      } else {
        const text = await response.text();
        console.log(`  Error:`, text);
      }
    } catch (error) {
      console.log(`${endpoint}: Error -`, error.message);
    }
  }
}

// Alternative approach - try adding through POST to /api/products
async function addProductsAlternative() {
  console.log('🔄 Trying alternative approach...');
  let successCount = 0;
  
  for (let i = 0; i < Math.min(3, productCatalog.length); i++) { // Test with first 3 products
    const product = productCatalog[i];
    try {
      console.log(`🧪 Testing product ${i + 1}: ${product.name}`);
      
      // Try direct POST to products endpoint
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(product)
      });
      
      console.log(`Response: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Success:`, result);
        successCount++;
      } else {
        const error = await response.text();
        console.log(`❌ Failed:`, error);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.log(`💥 Error:`, error.message);
    }
  }
  
  console.log(`\n🎯 Alternative test completed. Success: ${successCount}/3`);
}

console.log(`
🛠️ DEBUGGING INSTRUCTIONS:
1. First run: testEndpoints()
2. Then run: addProductsAlternative()
3. This will help us identify the working endpoint

Commands to try:
- testEndpoints()
- addProductsAlternative()
`);
