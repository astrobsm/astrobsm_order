/**
 * COMPREHENSIVE SYSTEM INTEGRITY CHECKER
 * Validates all frontend-backend connections and fixes
 * Run this in browser console after applying fixes
 */

async function runSystemIntegrityCheck() {
  console.log('🔍 COMPREHENSIVE SYSTEM INTEGRITY CHECK\n');
  console.log('='.repeat(50));
  
  let allChecks = [];
  let passedChecks = 0;
  let failedChecks = 0;
  
  // Helper function to add check result
  function addCheck(name, status, details = '') {
    allChecks.push({ name, status, details });
    if (status === 'PASS') passedChecks++;
    else failedChecks++;
    
    const emoji = status === 'PASS' ? '✅' : '❌';
    console.log(`${emoji} ${name}: ${status}`);
    if (details) console.log(`   ${details}`);
  }
  
  try {
    // 1. Database Health Check
    console.log('\n1️⃣ DATABASE CONNECTIVITY');
    console.log('-'.repeat(30));
    
    try {
      const dbResponse = await fetch('/api/database/health');
      const dbHealth = await dbResponse.json();
      
      if (dbHealth.status === 'healthy') {
        addCheck('Database Connection', 'PASS', 'Database is accessible');
      } else {
        addCheck('Database Connection', 'FAIL', dbHealth.error || 'Database unhealthy');
      }
    } catch (error) {
      addCheck('Database Connection', 'FAIL', error.message);
    }
    
    // 2. Products API Tests
    console.log('\n2️⃣ PRODUCTS API');
    console.log('-'.repeat(30));
    
    try {
      const productsResponse = await fetch('/api/products');
      if (productsResponse.ok) {
        const products = await productsResponse.json();
        addCheck('Products API', 'PASS', `${products.length} products loaded`);
        
        // Check product structure
        if (products.length > 0) {
          const product = products[0];
          const hasRequiredFields = product.id && product.name && product.price !== undefined;
          addCheck('Product Data Structure', hasRequiredFields ? 'PASS' : 'FAIL', 
            hasRequiredFields ? 'All required fields present' : 'Missing required fields');
        } else {
          addCheck('Product Data Structure', 'FAIL', 'No products to validate');
        }
      } else {
        addCheck('Products API', 'FAIL', `Status: ${productsResponse.status}`);
      }
    } catch (error) {
      addCheck('Products API', 'FAIL', error.message);
    }
    
    // 3. Admin API Tests
    console.log('\n3️⃣ ADMIN API');
    console.log('-'.repeat(30));
    
    try {
      // Test admin products fetch
      const adminProductsResponse = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPassword: 'roseball' })
      });
      
      if (adminProductsResponse.ok) {
        const adminProducts = await adminProductsResponse.json();
        addCheck('Admin Products Fetch', 'PASS', `${adminProducts.length} products accessible`);
      } else {
        addCheck('Admin Products Fetch', 'FAIL', `Status: ${adminProductsResponse.status}`);
      }
    } catch (error) {
      addCheck('Admin Products Fetch', 'FAIL', error.message);
    }
    
    // Test new product addition endpoint
    try {
      const testProductResponse = await fetch('/api/admin/products/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Integration Test Product ${Date.now()}`,
          price: 99.99,
          description: 'Test product for integration check',
          unit_of_measure: 'PCS',
          adminPassword: 'roseball'
        })
      });
      
      if (testProductResponse.ok) {
        const newProduct = await testProductResponse.json();
        addCheck('Product Addition', 'PASS', 'New product endpoint working');
        
        // Clean up test product
        try {
          await fetch(`/api/admin/products/${newProduct.id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminPassword: 'roseball' })
          });
        } catch (cleanupError) {
          console.log('Note: Test product cleanup failed (not critical)');
        }
      } else {
        const errorData = await testProductResponse.json();
        addCheck('Product Addition', 'FAIL', errorData.error || 'Addition failed');
      }
    } catch (error) {
      addCheck('Product Addition', 'FAIL', error.message);
    }
    
    // 4. Orders API Tests
    console.log('\n4️⃣ ORDERS API');
    console.log('-'.repeat(30));
    
    try {
      const ordersResponse = await fetch('/api/orders');
      if (ordersResponse.ok) {
        const orders = await ordersResponse.json();
        addCheck('Orders API', 'PASS', `${orders.length} orders loaded`);
      } else {
        addCheck('Orders API', 'FAIL', `Status: ${ordersResponse.status}`);
      }
    } catch (error) {
      addCheck('Orders API', 'FAIL', error.message);
    }
    
    // 5. Frontend Integration Tests
    console.log('\n5️⃣ FRONTEND INTEGRATION');
    console.log('-'.repeat(30));
    
    // Check if loadProducts function exists and works
    if (typeof loadProducts === 'function') {
      try {
        await loadProducts();
        const hasProducts = productList && productList.length > 0;
        addCheck('Frontend Product Loading', hasProducts ? 'PASS' : 'FAIL', 
          hasProducts ? `${productList.length} products loaded in frontend` : 'No products in frontend');
      } catch (error) {
        addCheck('Frontend Product Loading', 'FAIL', error.message);
      }
    } else {
      addCheck('Frontend Product Loading', 'FAIL', 'loadProducts function not available');
    }
    
    // Check calculation functions
    if (typeof calculateOrderTotal === 'function') {
      addCheck('Calculation Functions', 'PASS', 'calculateOrderTotal function available');
    } else {
      addCheck('Calculation Functions', 'FAIL', 'calculateOrderTotal function missing');
    }
    
    // 6. Route Accessibility Tests
    console.log('\n6️⃣ ROUTE ACCESSIBILITY');
    console.log('-'.repeat(30));
    
    const routesToTest = [
      '/api/health',
      '/api/db-test/test',
      '/manifest.json',
      '/sw.js'
    ];
    
    for (const route of routesToTest) {
      try {
        const response = await fetch(route);
        addCheck(`Route ${route}`, response.ok ? 'PASS' : 'FAIL', `Status: ${response.status}`);
      } catch (error) {
        addCheck(`Route ${route}`, 'FAIL', error.message);
      }
    }
    
    // 7. PWA Features Test
    console.log('\n7️⃣ PWA FEATURES');
    console.log('-'.repeat(30));
    
    addCheck('Service Worker', 'serviceWorker' in navigator ? 'PASS' : 'FAIL', 
      'serviceWorker' in navigator ? 'Service Worker API available' : 'Service Worker not supported');
    
    addCheck('Local Storage', typeof localStorage !== 'undefined' ? 'PASS' : 'FAIL',
      typeof localStorage !== 'undefined' ? 'Local Storage available' : 'Local Storage not available');
    
    // Final Summary
    console.log('\n📊 FINAL SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ PASSED: ${passedChecks}`);
    console.log(`❌ FAILED: ${failedChecks}`);
    console.log(`📊 SUCCESS RATE: ${((passedChecks / (passedChecks + failedChecks)) * 100).toFixed(1)}%`);
    
    if (failedChecks === 0) {
      console.log('\n🎉 ALL CHECKS PASSED! System integrity is excellent.');
    } else if (failedChecks <= 2) {
      console.log('\n⚠️ Minor issues detected. System is mostly functional.');
    } else {
      console.log('\n🚨 Multiple issues detected. System needs attention.');
    }
    
    console.log('\n📋 DETAILED RESULTS:');
    allChecks.forEach((check, index) => {
      console.log(`${index + 1}. ${check.name}: ${check.status}${check.details ? ` - ${check.details}` : ''}`);
    });
    
  } catch (error) {
    console.error('💥 Integrity check failed:', error);
  }
}

// Auto-run integrity check
console.log('🚀 Starting System Integrity Check...');
runSystemIntegrityCheck();
