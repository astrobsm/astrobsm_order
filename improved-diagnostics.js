// IMPROVED PRODUCTION DIAGNOSTICS SCRIPT
// Copy and paste this entire script into browser console on production site

(async function runImprovedDiagnostics() {
  console.log('🔍 IMPROVED PRODUCTION DIAGNOSTICS');
  console.log('='.repeat(50));
  console.log('Site:', window.location.origin);
  console.log('Time:', new Date().toISOString());
  console.log('');

  let passed = 0, failed = 0, criticalIssues = [];

  function test(name, condition, details, critical = false) {
    const status = condition ? 'PASS' : 'FAIL';
    const emoji = condition ? '✅' : '❌';
    const criticalFlag = critical && !condition ? ' 🚨 CRITICAL' : '';
    
    console.log(`${emoji} ${name}: ${status}${criticalFlag}`);
    if (details) console.log(`   ${details}`);
    
    if (condition) {
      passed++;
    } else {
      failed++;
      if (critical) criticalIssues.push(name);
    }
  }

  // Test APIs
  console.log('\n🔌 API TESTS');
  console.log('-'.repeat(20));
  
  try {
    const health = await fetch('/api/health').then(r => r.json());
    test('API Health', health.status === 'OK', `Status: ${health.status}`, true);
  } catch (e) {
    test('API Health', false, e.message, true);
  }

  try {
    const products = await fetch('/api/products').then(r => r.json());
    const hasProducts = Array.isArray(products) && products.length > 0;
    test('Products API', hasProducts, `${products.length} products loaded`, true);
    
    if (hasProducts) {
      const firstProduct = products[0];
      const hasRequired = firstProduct.id && firstProduct.name && firstProduct.price !== undefined;
      test('Product Structure', hasRequired, 'Required fields (id, name, price) present');
      
      // Test specific products
      const woundCareProducts = products.filter(p => p.name.includes('Wound-Care'));
      test('Wound-Care Products', woundCareProducts.length > 0, `${woundCareProducts.length} wound-care products found`);
    }
  } catch (e) {
    test('Products API', false, e.message, true);
  }

  try {
    const orders = await fetch('/api/orders').then(r => r.json());
    test('Orders API', Array.isArray(orders), `${orders.length} orders in system`);
  } catch (e) {
    test('Orders API', false, e.message);
  }

  // Test DOM Structure
  console.log('\n🎯 DOM STRUCTURE TESTS');
  console.log('-'.repeat(20));
  
  // Check main form elements
  const orderForm = document.getElementById('orderForm');
  test('Order Form', !!orderForm, orderForm ? 'Form found' : 'Form missing', true);
  
  const itemsContainer = document.getElementById('itemsContainer');
  test('Items Container', !!itemsContainer, itemsContainer ? 'Container found' : 'Container missing', true);
  
  const addItemBtn = document.getElementById('addItemBtn');
  test('Add Item Button', !!addItemBtn, addItemBtn ? 'Button found' : 'Button missing');
  
  // Check if dynamic items exist
  const itemRows = document.querySelectorAll('.item-row');
  test('Dynamic Item Rows', itemRows.length > 0, `${itemRows.length} item rows present`);
  
  if (itemRows.length > 0) {
    // Check first item row structure
    const firstRow = itemRows[0];
    const productSelect = firstRow.querySelector('select[id^="item"]');
    const quantityInput = firstRow.querySelector('input[id^="quantity"]');
    
    test('Product Select (Dynamic)', !!productSelect, productSelect ? `ID: ${productSelect.id}` : 'Missing');
    test('Quantity Input (Dynamic)', !!quantityInput, quantityInput ? `ID: ${quantityInput.id}` : 'Missing');
    
    if (productSelect) {
      const options = productSelect.querySelectorAll('option');
      test('Product Options', options.length > 1, `${options.length} options available`);
    }
  }
  
  // Check order total display
  const orderTotal = document.getElementById('orderTotal');
  test('Order Total Display', !!orderTotal, orderTotal ? 'Total display found' : 'Total display missing');
  
  const submitBtn = document.querySelector('button[type="submit"]');
  test('Submit Button', !!submitBtn, submitBtn ? 'Submit button found' : 'Submit button missing', true);

  // Test PWA Files
  console.log('\n📱 PWA FILES TESTS');
  console.log('-'.repeat(20));
  
  const pwaFiles = ['/app.js', '/style.css', '/manifest.json', '/sw.js'];
  for (const file of pwaFiles) {
    try {
      const response = await fetch(file);
      const critical = file === '/app.js';
      test(`File ${file}`, response.ok, `HTTP ${response.status}`, critical);
    } catch (e) {
      test(`File ${file}`, false, e.message, file === '/app.js');
    }
  }

  // Test Browser Features
  console.log('\n🌐 BROWSER FEATURES TESTS');
  console.log('-'.repeat(20));
  
  test('Local Storage', !!window.localStorage, 'Available');
  test('Service Worker Support', 'serviceWorker' in navigator, 'Supported');
  test('Online Status', navigator.onLine, `Online: ${navigator.onLine}`);
  
  // Test Service Worker Registration
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      test('Service Worker Registered', !!registration, registration ? 'Active registration found' : 'No registration');
    } catch (e) {
      test('Service Worker Registered', false, e.message);
    }
  }

  // Test JavaScript Functionality
  console.log('\n⚙️ FUNCTIONALITY TESTS');
  console.log('-'.repeat(20));
  
  // Test if main app variables are available
  test('Global Variables', typeof productList !== 'undefined', productList ? `${productList.length} products in productList` : 'productList undefined');
  test('Calculate Function', typeof calculateOrderTotal === 'function', 'calculateOrderTotal function available');
  
  // Test calculation functionality
  if (typeof calculateOrderTotal === 'function') {
    try {
      const result = calculateOrderTotal();
      test('Calculate Function Works', result !== undefined, `Returns: ${JSON.stringify(result)}`);
    } catch (e) {
      test('Calculate Function Works', false, e.message);
    }
  }

  // Summary
  console.log('\n📊 DIAGNOSTIC SUMMARY');
  console.log('='.repeat(50));
  const total = passed + failed;
  const successRate = total > 0 ? Math.round((passed / total) * 100) : 0;
  
  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed} | Failed: ${failed}`);
  console.log(`Success Rate: ${successRate}%`);
  
  if (criticalIssues.length > 0) {
    console.log(`🚨 CRITICAL ISSUES: ${criticalIssues.length}`);
    criticalIssues.forEach(issue => console.log(`   - ${issue}`));
  }
  
  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED! App is working correctly.');
  } else if (criticalIssues.length > 0) {
    console.log('🚨 CRITICAL ISSUES DETECTED - App may not function properly');
  } else {
    console.log('⚠️ MINOR ISSUES FOUND - App should work but may have some problems');
  }
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS');
  console.log('-'.repeat(20));
  
  if (criticalIssues.includes('Products API')) {
    console.log('🔧 Run database seeder: node smart-seed-database.js');
  }
  if (criticalIssues.includes('Order Form')) {
    console.log('🔧 Check HTML structure and ensure index.html is served correctly');
  }
  if (failed > 0) {
    console.log('🔧 Check browser console for additional error messages');
    console.log('🔧 Try refreshing the page to clear any cache issues');
  }
  
  return {
    total,
    passed,
    failed,
    successRate,
    criticalIssues,
    recommendation: failed === 0 ? 'All good!' : criticalIssues.length > 0 ? 'Fix critical issues' : 'Minor tweaks needed'
  };
})();
