// MANUAL PRODUCT ADDITION HELPER - Use the Admin Panel Interface
// This creates a helper to add products one by one through the admin interface

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

let currentProductIndex = 0;

function fillProductForm(index) {
  if (index >= productCatalog.length) {
    console.log('✅ All products listed! You can now manually submit them.');
    return;
  }
  
  const product = productCatalog[index];
  
  // Try to find and fill the form fields
  const nameField = document.querySelector('#productName, [name="name"], input[placeholder*="name" i]');
  const descField = document.querySelector('#productDescription, [name="description"], textarea[placeholder*="description" i]');
  const priceField = document.querySelector('#productPrice, [name="price"], input[placeholder*="price" i]');
  const unitField = document.querySelector('#productUnit, [name="unit"], input[placeholder*="unit" i]');
  
  if (nameField) nameField.value = product.name;
  if (descField) descField.value = product.description;
  if (priceField) priceField.value = product.price;
  if (unitField) unitField.value = product.unit;
  
  console.log(`📝 Product ${index + 1}/24 filled:`, product.name);
  console.log(`   Name: ${product.name}`);
  console.log(`   Description: ${product.description}`);
  console.log(`   Price: ₦${product.price.toLocaleString()}`);
  console.log(`   Unit: ${product.unit}`);
  console.log(`\n🔽 Now click 'Add Product' or 'Save' button, then call nextProduct()`);
  
  currentProductIndex = index;
}

function nextProduct() {
  currentProductIndex++;
  if (currentProductIndex < productCatalog.length) {
    fillProductForm(currentProductIndex);
  } else {
    console.log('🎉 All products completed!');
  }
}

function listAllProducts() {
  console.log('📋 Complete Product List for Manual Entry:');
  console.log('=====================================');
  
  productCatalog.forEach((product, index) => {
    console.log(`\n${index + 1}. ${product.name}`);
    console.log(`   Description: ${product.description}`);
    console.log(`   Price: ₦${product.price.toLocaleString()}`);
    console.log(`   Unit: ${product.unit}`);
  });
  
  console.log(`\n📝 To start auto-filling: fillProductForm(0)`);
  console.log(`   After each save: nextProduct()`);
}

// Start helper
console.log(`
🔧 MANUAL PRODUCT ADDITION HELPER
=================================

INSTRUCTIONS:
1. First, click the "Admin" button on your site
2. Enter password: roseball
3. Click "Manage Products" 
4. When the product form appears, run these commands:

COMMANDS:
• listAllProducts() - See all products to add
• fillProductForm(0) - Auto-fill the first product
• nextProduct() - Move to next product after saving

WORKFLOW:
1. Run: fillProductForm(0)
2. Click "Add Product" or "Save" on the form
3. Run: nextProduct()
4. Repeat steps 2-3 for all 24 products

Ready to start!
`);

// Expose functions globally
window.fillProductForm = fillProductForm;
window.nextProduct = nextProduct;
window.listAllProducts = listAllProducts;
