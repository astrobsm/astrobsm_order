// IMMEDIATE FIX: Frontend Fallback Products
// Copy and paste this into your browser console to instantly show products

const fallbackProducts = [
  { name: "Wound-Care Honey Gauze Big (Carton)", price: 65000 },
  { name: "Wound-Care Honey Gauze Big (Packet)", price: 6000 },
  { name: "Wound-Care Honey Gauze Small (Carton)", price: 61250 },
  { name: "Wound-Care Honey Gauze Small (Packet)", price: 3500 },
  { name: "Hera Wound-Gel 100g (Carton)", price: 65000 },
  { name: "Hera Wound-Gel 100g (Tube)", price: 3250 },
  { name: "Hera Wound-Gel 40g (Carton)", price: 48000 },
  { name: "Hera Wound-Gel 40g (Tube)", price: 2000 },
  { name: "Coban Bandage 6 inch (Piece)", price: 4500 },
  { name: "Coban Bandage 6 inch (Carton)", price: 48500 },
  { name: "Coban Bandage 4 inch (Piece)", price: 3500 },
  { name: "Coban Bandage 4 inch (Carton)", price: 37500 },
  { name: "Silicone Scar Sheet (Packet)", price: 10000 },
  { name: "Silicone Scar Sheet (Block)", price: 90000 },
  { name: "Silicone Foot Pad (Pair)", price: 2000 },
  { name: "Sterile Dressing Pack (Bag)", price: 10000 },
  { name: "Sterile Dressing Pack (Piece)", price: 600 },
  { name: "Sterile Gauze-Only Pack (Bag)", price: 10000 },
  { name: "Sterile Gauze-Only Pack (Piece)", price: 600 },
  { name: "Skin Staples (Piece)", price: 4000 },
  { name: "NPWT (VAC) Foam (Piece)", price: 2000 },
  { name: "Opsite (Piece)", price: 6000 },
  { name: "Wound-Clex Solution 500ml (Carton)", price: 12500 },
  { name: "Wound-Clex Solution 500ml (Bottle)", price: 2300 }
];

function addFallbackProducts() {
  // Override the global productList
  if (window.productList !== undefined) {
    window.productList = fallbackProducts;
    console.log('✅ ProductList updated with fallback products');
  }
  
  // Find all product dropdowns and update them
  const selects = document.querySelectorAll('select[id^="item"], select[name^="item"]');
  
  selects.forEach(select => {
    // Clear existing options except the first one
    while (select.children.length > 1) {
      select.removeChild(select.lastChild);
    }
    
    // Add fallback products
    fallbackProducts.forEach(product => {
      const option = document.createElement('option');
      option.value = product.name;
      
      // Format price with thousands separator
      const formattedPrice = new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(product.price);
      
      option.textContent = `${product.name} - ${formattedPrice}`;
      select.appendChild(option);
    });
  });
  
  console.log(`✅ Updated ${selects.length} product dropdowns`);
  console.log('🎉 Products are now available! Try selecting from the dropdown.');
}

// Run the fix
addFallbackProducts();

// Also override the loadProducts function to use fallback
if (window.loadProducts) {
  window.loadProducts = async function() {
    window.productList = fallbackProducts;
    console.log('✅ LoadProducts overridden with fallback products');
    return fallbackProducts;
  };
}

console.log(`
🚀 QUICK FIX APPLIED!
====================
✅ 24 products now available in dropdowns
✅ Prices included and formatted
✅ Order system should work normally

This is a temporary fix while we resolve the backend issue.
`);
