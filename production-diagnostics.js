/**
 * PRODUCTION DIAGNOSTICS SCRIPT
 * Run this in browser console on your production site to diagnose issues
 */

async function runProductionDiagnostics() {
  console.log('🔍 PRODUCTION DIAGNOSTICS STARTING...\n');
  console.log('Site URL:', window.location.origin);
  console.log('Current Time:', new Date().toISOString());
  console.log('='.repeat(60));
  
  let results = {
    tests: [],
    passed: 0,
    failed: 0,
    critical_issues: []
  };
  
  function logTest(name, status, details = '', critical = false) {
    const result = { name, status, details, critical };
    results.tests.push(result);
    
    if (status === 'PASS') results.passed++;
    else results.failed++;
    
    if (critical && status === 'FAIL') {
      results.critical_issues.push(name);
    }
    
    const emoji = status === 'PASS' ? '✅' : '❌';
    const criticalFlag = critical && status === 'FAIL' ? ' 🚨 CRITICAL' : '';
    console.log(`${emoji} ${name}: ${status}${criticalFlag}`);
    if (details) console.log(`   ${details}`);
  }
  
  // Test 1: Basic API Health
  console.log('\n1️⃣ BASIC API HEALTH');
  console.log('-'.repeat(30));
  
  try {
    const healthResponse = await fetch('/api/health');
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      logTest('API Health Check', 'PASS', `Status: ${health.status}`);
    } else {
      logTest('API Health Check', 'FAIL', `HTTP ${healthResponse.status}`, true);
    }
  } catch (error) {
    logTest('API Health Check', 'FAIL', error.message, true);
  }
  
  // Test 2: Database Connectivity
  console.log('\n2️⃣ DATABASE CONNECTIVITY');
  console.log('-'.repeat(30));
  
  try {
    const dbResponse = await fetch('/api/database/health');
    if (dbResponse.ok) {
      const dbHealth = await dbResponse.json();
      logTest('Database Connection', dbHealth.status === 'healthy' ? 'PASS' : 'FAIL', 
        `Status: ${dbHealth.status}`, dbHealth.status !== 'healthy');
    } else {
      logTest('Database Connection', 'FAIL', `HTTP ${dbResponse.status}`, true);
    }
  } catch (error) {
    logTest('Database Connection', 'FAIL', error.message, true);
  }
  
  // Test 3: Products API (Public)
  console.log('\n3️⃣ PRODUCTS API (PUBLIC)');
  console.log('-'.repeat(30));
  
  try {
    const productsResponse = await fetch('/api/products');
    if (productsResponse.ok) {
      const products = await productsResponse.json();
      logTest('Public Products API', 'PASS', `${products.length} products available`);
      
      if (products.length === 0) {
        logTest('Products Populated', 'FAIL', 'No products found in database', true);
      } else {
        logTest('Products Populated', 'PASS', `${products.length} products found`);
        
        // Check product structure
        const product = products[0];
        const hasRequired = product.id && product.name && product.price !== undefined;
        logTest('Product Data Structure', hasRequired ? 'PASS' : 'FAIL', 
          hasRequired ? 'Required fields present' : 'Missing required fields');
      }
    } else {
      logTest('Public Products API', 'FAIL', `HTTP ${productsResponse.status}`, true);
    }
  } catch (error) {
    logTest('Public Products API', 'FAIL', error.message, true);
  }
  
  // Test 4: Admin Products API
  console.log('\n4️⃣ ADMIN PRODUCTS API');
  console.log('-'.repeat(30));
  
  try {
    // Test GET endpoint
    const adminGetResponse = await fetch('/api/admin/products');
    if (adminGetResponse.ok) {
      const adminProducts = await adminGetResponse.json();
      logTest('Admin Products GET', 'PASS', `${adminProducts.length} products via GET`);
    } else {
      logTest('Admin Products GET', 'FAIL', `HTTP ${adminGetResponse.status}`);
    }
  } catch (error) {
    logTest('Admin Products GET', 'FAIL', error.message);
  }
  
  try {
    // Test POST endpoint with password
    const adminPostResponse = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPassword: 'roseball' })
    });
    
    if (adminPostResponse.ok) {
      const adminProducts = await adminPostResponse.json();
      logTest('Admin Products POST', 'PASS', `${adminProducts.length} products via POST`);
    } else {
      const errorText = await adminPostResponse.text();
      logTest('Admin Products POST', 'FAIL', `HTTP ${adminPostResponse.status} - ${errorText}`, true);
    }
  } catch (error) {
    logTest('Admin Products POST', 'FAIL', error.message, true);
  }
  
  // Test 5: Product Addition
  console.log('\n5️⃣ PRODUCT ADDITION TEST');
  console.log('-'.repeat(30));
  
  try {
    const testProduct = {
      name: `Diagnostic Test Product ${Date.now()}`,
      description: 'Test product for diagnostics',
      price: 99.99,
      unit_of_measure: 'PCS',
      stock_quantity: 100,
      adminPassword: 'roseball'
    };
    
    const addResponse = await fetch('/api/admin/products/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testProduct)
    });
    
    if (addResponse.ok) {
      const newProduct = await addResponse.json();
      logTest('Product Addition', 'PASS', `Test product created with ID: ${newProduct.id}`);
      
      // Clean up test product
      try {
        await fetch(`/api/admin/products/${newProduct.id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminPassword: 'roseball' })
        });
        logTest('Test Cleanup', 'PASS', 'Test product deleted');
      } catch (cleanupError) {
        logTest('Test Cleanup', 'FAIL', 'Could not delete test product');
      }
    } else {
      const errorData = await addResponse.json();
      logTest('Product Addition', 'FAIL', `${addResponse.status} - ${errorData.error}`, true);
    }
  } catch (error) {
    logTest('Product Addition', 'FAIL', error.message, true);
  }
  
  // Test 6: Orders API
  console.log('\n6️⃣ ORDERS API');
  console.log('-'.repeat(30));
  
  try {
    const ordersResponse = await fetch('/api/orders');
    if (ordersResponse.ok) {
      const orders = await ordersResponse.json();
      logTest('Orders API', 'PASS', `${orders.length} orders found`);
    } else {
      logTest('Orders API', 'FAIL', `HTTP ${ordersResponse.status}`);
    }
  } catch (error) {
    logTest('Orders API', 'FAIL', error.message);
  }
  
  // Test 7: Frontend Integration
  console.log('\n7️⃣ FRONTEND INTEGRATION');
  console.log('-'.repeat(30));
  
  const functionTests = [
    'loadProducts',
    'calculateOrderTotal', 
    'submitOrderOfflineCapable',
    'loadProductsForManagement'
  ];
  
  functionTests.forEach(funcName => {
    const exists = typeof window[funcName] === 'function';
    logTest(`Function ${funcName}`, exists ? 'PASS' : 'FAIL', 
      exists ? 'Function available' : 'Function missing');
  });
  
  // Final Summary
  console.log('\n📊 DIAGNOSTICS SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ PASSED: ${results.passed}`);
  console.log(`❌ FAILED: ${results.failed}`);
  console.log(`📊 SUCCESS RATE: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  if (results.critical_issues.length > 0) {
    console.log('\n🚨 CRITICAL ISSUES REQUIRING IMMEDIATE ATTENTION:');
    results.critical_issues.forEach(issue => console.log(`   • ${issue}`));
  }
  
  if (results.failed === 0) {
    console.log('\n🎉 ALL DIAGNOSTICS PASSED! System is fully operational.');
  } else if (results.critical_issues.length === 0) {
    console.log('\n⚠️ Minor issues detected but system is functional.');
  } else {
    console.log('\n🚨 Critical issues detected requiring immediate fixes.');
  }
  
  console.log('\n📝 NEXT STEPS:');
  if (results.critical_issues.includes('Product Addition')) {
    console.log('   1. Run: fetch("/emergency-production-fix.js").then(r=>r.text()).then(eval)');
  }
  if (results.critical_issues.includes('Database Connection')) {
    console.log('   2. Check database connection and credentials');
  }
  if (results.critical_issues.includes('Products Populated')) {
    console.log('   3. Run emergency product addition script');
  }
  
  return results;
}

// Auto-run diagnostics
console.log('🚀 Starting Production Diagnostics...');
runProductionDiagnostics();
