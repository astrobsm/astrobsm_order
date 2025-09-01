// Table Structure Checker - Run in browser console
// This will check if the products table exists and what columns it has

async function checkTableStructure() {
  console.log('🔍 TABLE STRUCTURE CHECKER');
  console.log('=========================');
  
  try {
    // Test basic connectivity
    console.log('\n1️⃣ Testing basic API connectivity...');
    const healthResponse = await fetch('/api/health');
    if (healthResponse.ok) {
      console.log('✅ API is responding');
    } else {
      console.log('❌ API health check failed');
      return;
    }
    
    // Test products endpoint
    console.log('\n2️⃣ Testing products endpoint...');
    const productsResponse = await fetch('/api/products');
    if (productsResponse.ok) {
      const products = await productsResponse.json();
      console.log(`✅ Products endpoint works: ${products.length} products`);
      
      if (products.length > 0) {
        console.log('📋 Sample product structure:');
        const sample = products[0];
        Object.keys(sample).forEach(key => {
          console.log(`   - ${key}: ${typeof sample[key]} (${sample[key]})`);
        });
      }
    } else {
      console.log('❌ Products endpoint failed:', productsResponse.status);
    }
    
    // Test admin authentication
    console.log('\n3️⃣ Testing admin authentication...');
    const authTest = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adminPassword: 'wrong_password',
        name: 'Test',
        price: 100
      })
    });
    
    if (authTest.status === 401) {
      console.log('✅ Admin authentication is working (correctly rejected wrong password)');
    } else {
      console.log('⚠️ Admin authentication response:', authTest.status);
    }
    
    // Test minimal product creation
    console.log('\n4️⃣ Testing minimal product creation...');
    const minimalTest = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adminPassword: 'roseball',
        name: 'MINIMAL_TEST_PRODUCT_' + Date.now(),
        price: 1
      })
    });
    
    if (minimalTest.ok) {
      const result = await minimalTest.json();
      console.log('✅ Minimal product creation works! Product ID:', result.id);
      console.log('📦 Created product structure:');
      Object.keys(result).forEach(key => {
        console.log(`   - ${key}: ${typeof result[key]} (${result[key]})`);
      });
    } else {
      const errorText = await minimalTest.text();
      console.log('❌ Minimal product creation failed:', minimalTest.status);
      console.log('Error response:', errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.log('Parsed error:', errorJson);
      } catch (e) {
        console.log('Raw error text:', errorText);
      }
    }
    
    console.log('\n🎯 DIAGNOSIS COMPLETE');
    console.log('====================');
    
  } catch (error) {
    console.error('💥 Diagnostic error:', error);
  }
}

// Auto-run
checkTableStructure();

console.log(`
🔍 TABLE STRUCTURE CHECKER
This will diagnose database connectivity and table structure issues.

To run manually: checkTableStructure()
`);

window.checkTableStructure = checkTableStructure;
