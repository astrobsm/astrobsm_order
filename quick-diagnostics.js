// Simple inline diagnostics script for browser console
// Copy and paste this entire script into browser console

(async function runQuickDiagnostics() {
  console.log('🔍 QUICK PRODUCTION DIAGNOSTICS');
  console.log('='.repeat(50));
  console.log('Site:', window.location.origin);
  console.log('Time:', new Date().toISOString());
  console.log('');

  let passed = 0, failed = 0;

  function test(name, condition, details) {
    const status = condition ? 'PASS' : 'FAIL';
    const emoji = condition ? '✅' : '❌';
    console.log(`${emoji} ${name}: ${status}`);
    if (details) console.log(`   ${details}`);
    condition ? passed++ : failed++;
  }

  // Test APIs
  try {
    const health = await fetch('/api/health').then(r => r.json());
    test('API Health', health.status === 'OK', `Status: ${health.status}`);
  } catch (e) {
    test('API Health', false, e.message);
  }

  try {
    const products = await fetch('/api/products').then(r => r.json());
    test('Products API', Array.isArray(products) && products.length > 0, `${products.length} products`);
    
    if (products.length > 0) {
      const hasRequired = products[0].id && products[0].name && products[0].price;
      test('Product Structure', hasRequired, 'Required fields present');
    }
  } catch (e) {
    test('Products API', false, e.message);
  }

  try {
    const orders = await fetch('/api/orders').then(r => r.json());
    test('Orders API', Array.isArray(orders), `${orders.length} orders`);
  } catch (e) {
    test('Orders API', false, e.message);
  }

  // Test PWA files
  const files = ['/app.js', '/style.css', '/manifest.json', '/sw.js'];
  for (const file of files) {
    try {
      const response = await fetch(file);
      test(`File ${file}`, response.ok, `HTTP ${response.status}`);
    } catch (e) {
      test(`File ${file}`, false, e.message);
    }
  }

  // Test DOM elements
  const elements = ['#productSelect', '#quantityInput', '#calculateBtn', '#submitOrderBtn'];
  for (const selector of elements) {
    const exists = !!document.querySelector(selector);
    test(`DOM ${selector}`, exists, exists ? 'Found' : 'Missing');
  }

  // Test browser features
  test('Local Storage', !!window.localStorage, 'Available');
  test('Service Worker', 'serviceWorker' in navigator, 'Supported');
  test('Online Status', navigator.onLine, `Online: ${navigator.onLine}`);

  console.log('');
  console.log('📊 SUMMARY');
  console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED!');
  } else if (failed > passed) {
    console.log('🚨 CRITICAL ISSUES DETECTED');
  } else {
    console.log('⚠️ SOME ISSUES FOUND');
  }
})();
