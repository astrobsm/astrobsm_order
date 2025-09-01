// Updated Emergency Diagnostic Script for ASTRO-BSM
// Run this in your browser console: https://astrobsm-orderform-l4b35.ondigitalocean.app/

console.log('🚨 ASTRO-BSM Emergency Diagnostic Script v13 🚨');
console.log('Running comprehensive system checks...\n');

async function emergencyDiagnostics() {
  const results = {
    dom: {},
    api: {},
    products: {},
    orders: {},
    network: {}
  };

  // 1. Check DOM Elements
  console.log('1️⃣ Checking DOM Elements...');
  const requiredElements = [
    'adminModal', 'ordersList', 'productsList', 'orderForm', 
    'adminBtn', 'loginBtn', 'manageProductsBtn'
  ];
  
  requiredElements.forEach(id => {
    const element = document.getElementById(id);
    results.dom[id] = element ? '✅ Found' : '❌ Missing';
    console.log(`   ${id}: ${results.dom[id]}`);
  });

  // 2. Check Network Status
  console.log('\n2️⃣ Checking Network Status...');
  results.network.online = navigator.onLine ? '✅ Online' : '❌ Offline';
  results.network.connection = navigator.connection ? 
    `${navigator.connection.effectiveType} (${navigator.connection.downlink}Mbps)` : 
    'Unknown';
  console.log(`   Status: ${results.network.online}`);
  console.log(`   Connection: ${results.network.connection}`);

  // 3. Test API Endpoints
  console.log('\n3️⃣ Testing API Endpoints...');
  const apiTests = [
    { name: 'Health Check', url: '/api/health' },
    { name: 'Products', url: '/api/products' },
    { name: 'Orders', url: '/api/orders' }
  ];

  for (const test of apiTests) {
    try {
      const response = await fetch(test.url);
      const data = await response.json();
      results.api[test.name] = response.ok ? 
        `✅ ${response.status} (${Array.isArray(data) ? data.length + ' items' : 'OK'})` :
        `❌ ${response.status}`;
      console.log(`   ${test.name}: ${results.api[test.name]}`);
    } catch (error) {
      results.api[test.name] = `❌ Error: ${error.message}`;
      console.log(`   ${test.name}: ${results.api[test.name]}`);
    }
  }

  // 4. Test Product Loading
  console.log('\n4️⃣ Testing Product Loading Function...');
  try {
    if (typeof loadProducts === 'function') {
      console.log('   Calling loadProducts()...');
      await loadProducts();
      const productSelect = document.querySelector('select[name="item1"]');
      const optionCount = productSelect ? productSelect.options.length - 1 : 0;
      results.products.loadFunction = `✅ Loaded ${optionCount} products`;
      console.log(`   ${results.products.loadFunction}`);
    } else {
      results.products.loadFunction = '❌ loadProducts function not found';
      console.log(`   ${results.products.loadFunction}`);
    }
  } catch (error) {
    results.products.loadFunction = `❌ Error: ${error.message}`;
    console.log(`   ${results.products.loadFunction}`);
  }

  // 5. Test Admin Order Loading
  console.log('\n5️⃣ Testing Admin Order Loading...');
  try {
    if (typeof loadAllOrders === 'function') {
      console.log('   Calling loadAllOrders()...');
      await loadAllOrders();
      results.orders.loadFunction = '✅ Function executed (check ordersList content)';
      console.log(`   ${results.orders.loadFunction}`);
    } else {
      results.orders.loadFunction = '❌ loadAllOrders function not found';
      console.log(`   ${results.orders.loadFunction}`);
    }
  } catch (error) {
    results.orders.loadFunction = `❌ Error: ${error.message}`;
    console.log(`   ${results.orders.loadFunction}`);
  }

  // 6. Check Cache Version
  console.log('\n6️⃣ Checking Cache Version...');
  const scriptTags = document.querySelectorAll('script[src*="app.js"]');
  const appScript = Array.from(scriptTags).find(s => s.src.includes('app.js'));
  if (appScript) {
    const version = appScript.src.match(/v=(\d+)/);
    results.cache = version ? `✅ Version ${version[1]}` : '⚠️ No version parameter';
    console.log(`   ${results.cache}`);
  }

  // 7. Test Product Addition (if needed)
  console.log('\n7️⃣ Product Addition Test Available...');
  console.log('   To add products, run: addAllProducts()');

  // Final Summary
  console.log('\n🎯 DIAGNOSTIC SUMMARY:');
  console.log('================================');
  Object.entries(results).forEach(([category, tests]) => {
    console.log(`\n${category.toUpperCase()}:`);
    if (typeof tests === 'object') {
      Object.entries(tests).forEach(([test, result]) => {
        console.log(`  ${test}: ${result}`);
      });
    } else {
      console.log(`  ${tests}`);
    }
  });

  console.log('\n🚀 NEXT STEPS:');
  if (results.dom.ordersList === '❌ Missing') {
    console.log('❌ Critical: ordersList element missing - admin orders won\'t work');
  }
  if (results.api.Products.includes('❌')) {
    console.log('❌ Critical: Products API failing');
  }
  if (results.api.Orders.includes('❌')) {
    console.log('❌ Critical: Orders API failing');
  }
  
  console.log('\n📱 To test order submission:');
  console.log('1. Fill out the order form');
  console.log('2. Submit an order');
  console.log('3. Check admin panel for the order');
  
  console.log('\n🛠️ To add products:');
  console.log('1. Run: addAllProducts()');
  console.log('2. Wait for completion');
  console.log('3. Refresh page');
  
  return results;
}

// Auto-run diagnostics
emergencyDiagnostics().catch(console.error);

// Export for manual use
window.emergencyDiagnostics = emergencyDiagnostics;
