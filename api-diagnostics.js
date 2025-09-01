// Production Database and API Diagnostic Script
// Run this in browser console to test and fix all API issues

async function runComprehensiveDiagnostics() {
  console.log('🔧 === COMPREHENSIVE API & DATABASE DIAGNOSTICS ===');
  
  // 1. Test Database Health
  console.log('\n1️⃣ Testing Database Health...');
  try {
    const healthResponse = await fetch('/api/database/health');
    const healthData = await healthResponse.json();
    console.log('✅ Database Health:', healthData);
  } catch (error) {
    console.error('❌ Database Health Check Failed:', error);
  }
  
  // 2. Initialize Database Tables
  console.log('\n2️⃣ Initializing Database Tables...');
  try {
    const initResponse = await fetch('/api/database/init');
    const initData = await initResponse.json();
    console.log('✅ Database Initialization:', initData);
  } catch (error) {
    console.error('❌ Database Initialization Failed:', error);
  }
  
  // 3. Test Products API
  console.log('\n3️⃣ Testing Products API...');
  try {
    const productsResponse = await fetch('/api/products');
    const productsData = await productsResponse.json();
    console.log('✅ Products API Response:', productsData);
    console.log('Products Count:', productsData.length);
    
    if (productsData.length === 0) {
      console.log('⚠️ No products found. Adding fallback products...');
      await addFallbackProducts();
    }
  } catch (error) {
    console.error('❌ Products API Failed:', error);
  }
  
  // 4. Test Admin API
  console.log('\n4️⃣ Testing Admin Product Addition...');
  try {
    const testProduct = {
      adminPassword: 'roseball',
      name: 'Test Product (Diagnostic)',
      description: 'Test product for diagnostic purposes',
      price: 1000,
      unit: 'PCS',
      stock_quantity: 100
    };
    
    const adminResponse = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testProduct)
    });
    
    if (adminResponse.ok) {
      const adminData = await adminResponse.json();
      console.log('✅ Admin API Working:', adminData);
      
      // Clean up test product
      if (adminData.id) {
        await fetch(`/api/admin/products/${adminData.id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminPassword: 'roseball' })
        });
        console.log('🗑️ Test product cleaned up');
      }
    } else {
      console.error('❌ Admin API Failed:', await adminResponse.text());
    }
  } catch (error) {
    console.error('❌ Admin API Test Failed:', error);
  }
  
  // 5. Final Products Check
  console.log('\n5️⃣ Final Products Verification...');
  try {
    const finalResponse = await fetch('/api/products');
    const finalData = await finalResponse.json();
    console.log('✅ Final Products Count:', finalData.length);
    
    if (finalData.length > 0) {
      console.log('🎉 SUCCESS! API is working correctly.');
      console.log('Sample products:', finalData.slice(0, 3));
    } else {
      console.log('⚠️ Still no products. Manual addition required.');
    }
  } catch (error) {
    console.error('❌ Final Products Check Failed:', error);
  }
  
  console.log('\n🏁 === DIAGNOSTICS COMPLETE ===');
}

// Add fallback products if database is empty
async function addFallbackProducts() {
  const products = [
    { name: "Wound-Care Honey Gauze Big (Carton)", description: "Wound-Care Honey Gauze Big - Carton (CTN)", price: 65000, unit: "CTN" },
    { name: "Wound-Care Honey Gauze Big (Packet)", description: "Wound-Care Honey Gauze Big - Packet", price: 6000, unit: "Packet" },
    { name: "Wound-Care Honey Gauze Small (Carton)", description: "Wound-Care Honey Gauze Small - Carton (CTN)", price: 61250, unit: "CTN" },
    { name: "Coban Bandage 6 inch (Piece)", description: "Coban Bandage 6 inch - Piece (PCS)", price: 4500, unit: "PCS" },
    { name: "Silicone Scar Sheet (Packet)", description: "Silicone Scar Sheet - Packet (4 PCS)", price: 10000, unit: "Packet" }
  ];
  
  let added = 0;
  for (const product of products) {
    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminPassword: 'roseball',
          ...product,
          stock_quantity: 100
        })
      });
      
      if (response.ok) {
        added++;
        console.log(`✅ Added: ${product.name}`);
      }
    } catch (error) {
      console.error(`❌ Failed to add: ${product.name}`, error);
    }
  }
  
  console.log(`📦 Added ${added} fallback products`);
}

// Auto-run diagnostics
console.log('🚀 Starting comprehensive diagnostics...');
runComprehensiveDiagnostics();

// Instructions
console.log(`
🔧 DIAGNOSTIC INSTRUCTIONS:
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. This script will auto-run
4. Check for any red ❌ errors
5. If successful, refresh the page to test calculations

If you see products loaded but calculations still don't work:
1. Select a product from dropdown
2. Enter a quantity
3. Check browser console for detailed calculation logs
4. Look for the "🧮 === STARTING CALCULATION ===" log

For manual product addition, use the production-add-products.js script.
`);
