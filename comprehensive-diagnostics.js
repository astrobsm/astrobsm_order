// Comprehensive diagnostics script - Run this in browser console
// This will test database, products API, and product addition

async function runComprehensiveDiagnostics() {
  console.log('🔍 Starting comprehensive diagnostics...\n');
  
  try {
    // Test 1: Database Health Check
    console.log('1️⃣ Testing database health...');
    const dbHealthResponse = await fetch('/api/db-test/test');
    const dbHealth = await dbHealthResponse.json();
    console.log('Database Health:', dbHealth);
    
    if (!dbHealth.success) {
      console.error('❌ Database health check failed:', dbHealth.error);
      return;
    }
    
    console.log('✅ Database is healthy');
    console.log(`📋 Products table exists: ${dbHealth.products_table_exists}`);
    console.log(`📦 Existing products: ${dbHealth.existing_products_count}`);
    console.log('📋 Table columns:', dbHealth.table_columns.map(col => `${col.column_name} (${col.data_type})`).join(', '));
    
    // Test 2: Products API
    console.log('\n2️⃣ Testing products API...');
    const productsResponse = await fetch('/api/products');
    const products = await productsResponse.json();
    console.log('Products API Response:', products);
    
    if (!productsResponse.ok) {
      console.error('❌ Products API failed');
      return;
    }
    
    console.log(`✅ Products API working - Found ${products.length} products`);
    
    // Test 3: Try creating a test product
    console.log('\n3️⃣ Testing product creation...');
    const testProductResponse = await fetch('/api/db-test/create-test-product', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        adminPassword: 'roseball'
      })
    });
    
    const testProductResult = await testProductResponse.json();
    console.log('Test Product Creation:', testProductResult);
    
    if (!testProductResponse.ok) {
      console.error('❌ Test product creation failed:', testProductResult.error);
    } else {
      console.log('✅ Test product created successfully');
    }
    
    // Test 4: Check if products now appear in dropdown
    console.log('\n4️⃣ Testing product dropdown after creation...');
    const updatedProductsResponse = await fetch('/api/products');
    const updatedProducts = await updatedProductsResponse.json();
    console.log(`Products after test creation: ${updatedProducts.length} products`);
    
    // Test 5: Admin products API
    console.log('\n5️⃣ Testing admin products API...');
    const adminProductsResponse = await fetch('/api/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        adminPassword: 'roseball'
      })
    });
    
    if (adminProductsResponse.ok) {
      const adminProducts = await adminProductsResponse.json();
      console.log(`Admin Products API: ${adminProducts.length} products`);
    } else {
      console.error('❌ Admin products API failed');
    }
    
    // Test 6: Try adding a product through admin API
    console.log('\n6️⃣ Testing admin product addition...');
    const addProductResponse = await fetch('/api/admin/products/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        adminPassword: 'roseball',
        name: `Diagnostic Test Product ${Date.now()}`,
        price: 50,
        unit_of_measure: 'pieces'
      })
    });
    
    const addProductResult = await addProductResponse.json();
    console.log('Admin Product Addition:', addProductResult);
    
    if (!addProductResponse.ok) {
      console.error('❌ Admin product addition failed:', addProductResult.error);
      
      // Try without unit_of_measure
      console.log('\n6️⃣b Testing admin product addition without unit_of_measure...');
      const addProductResponse2 = await fetch('/api/admin/products/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          adminPassword: 'roseball',
          name: `Diagnostic Test Product Simple ${Date.now()}`,
          price: 50
        })
      });
      
      const addProductResult2 = await addProductResponse2.json();
      console.log('Admin Product Addition (Simple):', addProductResult2);
      
      if (!addProductResponse2.ok) {
        console.error('❌ Even simple admin product addition failed:', addProductResult2.error);
      } else {
        console.log('✅ Simple admin product addition worked');
      }
    } else {
      console.log('✅ Admin product addition worked');
    }
    
    // Final products check
    console.log('\n7️⃣ Final products check...');
    const finalProductsResponse = await fetch('/api/products');
    const finalProducts = await finalProductsResponse.json();
    console.log(`Final product count: ${finalProducts.length}`);
    
    // Test frontend product loading
    console.log('\n8️⃣ Testing frontend product loading...');
    if (typeof loadProducts === 'function') {
      await loadProducts();
      console.log('✅ Frontend loadProducts() completed');
    } else {
      console.log('⚠️ loadProducts() function not available - page may need refresh');
    }
    
    console.log('\n🎉 Comprehensive diagnostics completed!');
    
  } catch (error) {
    console.error('💥 Diagnostics failed:', error);
  }
}

// Auto-run diagnostics
runComprehensiveDiagnostics();
