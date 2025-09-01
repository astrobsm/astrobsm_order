// Database Status Checker - Run in browser console
// This will tell us exactly what's wrong with the database

async function checkDatabaseStatus() {
  console.log('🔍 ASTRO-BSM Database Status Check');
  console.log('==================================');
  
  try {
    // Test 1: Check if products API works
    console.log('\n1️⃣ Testing Products API...');
    const productsResponse = await fetch('/api/products');
    if (productsResponse.ok) {
      const products = await productsResponse.json();
      console.log(`✅ Products API works: ${products.length} products found`);
      
      if (products.length > 0) {
        const sampleProduct = products[0];
        console.log('📦 Sample product structure:', Object.keys(sampleProduct));
        console.log('🔍 Has unit_of_measure field?', sampleProduct.hasOwnProperty('unit_of_measure') ? '✅ YES' : '❌ NO');
      }
    } else {
      console.log('❌ Products API failed:', productsResponse.status);
    }
    
    // Test 2: Try adding a simple product without unit_of_measure
    console.log('\n2️⃣ Testing simple product addition (no unit)...');
    const simpleProduct = {
      adminPassword: 'roseball',
      name: 'Test Product Simple',
      description: 'Test product without unit',
      price: 100,
      stock_quantity: 10
    };
    
    const simpleResponse = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(simpleProduct)
    });
    
    if (simpleResponse.ok) {
      console.log('✅ Simple product addition works');
      // Clean up test product
      const result = await simpleResponse.json();
      console.log('🗑️ Test product added with ID:', result.id);
    } else {
      const errorText = await simpleResponse.text();
      console.log('❌ Simple product addition failed:', simpleResponse.status);
      console.log('Error details:', errorText);
    }
    
    // Test 3: Try adding product with unit_of_measure
    console.log('\n3️⃣ Testing product addition with unit_of_measure...');
    const unitProduct = {
      adminPassword: 'roseball',
      name: 'Test Product With Unit',
      description: 'Test product with unit',
      price: 200,
      stock_quantity: 20,
      unit_of_measure: 'PCS'
    };
    
    const unitResponse = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(unitProduct)
    });
    
    if (unitResponse.ok) {
      console.log('✅ Product with unit_of_measure works');
    } else {
      const errorText = await unitResponse.text();
      console.log('❌ Product with unit_of_measure failed:', unitResponse.status);
      console.log('Error details:', errorText);
    }
    
    // Test 4: Check health endpoints
    console.log('\n4️⃣ Testing health endpoints...');
    try {
      const healthResponse = await fetch('/api/health');
      if (healthResponse.ok) {
        console.log('✅ API health check passed');
      } else {
        console.log('❌ API health check failed');
      }
    } catch (error) {
      console.log('❌ Health check error:', error.message);
    }
    
    console.log('\n🎯 DIAGNOSIS COMPLETE');
    console.log('===================');
    
  } catch (error) {
    console.error('💥 Diagnostic error:', error);
  }
}

// Auto-run diagnosis
checkDatabaseStatus();

console.log(`
🔧 DATABASE STATUS CHECKER
This will diagnose the exact issue with product addition.

To run manually: checkDatabaseStatus()
`);

window.checkDatabaseStatus = checkDatabaseStatus;
