// Emergency Product Addition - Simple SQL Insert
// Run this in browser console if the comprehensive diagnostics shows database is healthy but product addition fails

async function emergencyAddProducts() {
  console.log('🚨 Emergency Product Addition Starting...');
  
  const products = [
    { name: 'Blood Pressure Monitor', price: 150 },
    { name: 'Digital Thermometer', price: 25 },
    { name: 'Pulse Oximeter', price: 80 },
    { name: 'Stethoscope', price: 120 },
    { name: 'Surgical Gloves (Box)', price: 30 },
    { name: 'Face Masks (Box)', price: 20 },
    { name: 'Antiseptic Solution', price: 15 },
    { name: 'Bandages (Pack)', price: 12 },
    { name: 'Syringe (10ml)', price: 5 },
    { name: 'Medical Tape', price: 8 }
  ];
  
  let successCount = 0;
  let failCount = 0;
  
  for (const product of products) {
    try {
      console.log(`Adding: ${product.name}...`);
      
      const response = await fetch('/api/db-test/create-test-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          adminPassword: 'roseball',
          name: product.name,
          price: product.price
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log(`✅ Added: ${product.name}`);
        successCount++;
      } else {
        console.error(`❌ Failed to add ${product.name}:`, result.error);
        failCount++;
      }
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`💥 Error adding ${product.name}:`, error);
      failCount++;
    }
  }
  
  console.log(`\n📊 Emergency Addition Results:`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  
  // Refresh products
  try {
    const productsResponse = await fetch('/api/products');
    const allProducts = await productsResponse.json();
    console.log(`📦 Total products now: ${allProducts.length}`);
    
    // Trigger frontend reload if available
    if (typeof loadProducts === 'function') {
      await loadProducts();
      console.log('🔄 Frontend products reloaded');
    }
    
  } catch (error) {
    console.error('❌ Error checking final products:', error);
  }
}

// Auto-run emergency addition
emergencyAddProducts();
