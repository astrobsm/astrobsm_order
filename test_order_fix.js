// 🎯 QUICK ORDER SUBMISSION TEST
// Run this in production browser console to verify the fix is working

console.log('🔍 Testing order submission fix...');

async function testOrderSubmissionFix() {
  try {
    // First, get products to use a real product name
    console.log('📦 Fetching products...');
    const productsResponse = await fetch('/api/products');
    const products = await productsResponse.json();
    
    if (!products || products.length === 0) {
      console.error('❌ No products available for testing');
      return;
    }
    
    const testProduct = products[0];
    console.log('✅ Using product:', testProduct.name);
    
    // Test order submission with the exact structure that was failing
    const orderData = {
      userRole: 'customer',
      customerData: { 
        name: 'Fix Test Customer', 
        phone: '0801234567', 
        address: 'Fix Test Address' 
      },
      orderData: { 
        delivery_route: 'Lagos Mainland',
        preferred_delivery_method: 'Pick-up',
        request_status: 'pending'
      },
      items: [{ 
        product_name: testProduct.name, 
        quantity: 1 
      }]
    };
    
    console.log('🚀 Submitting test order...');
    console.log('📋 Order data:', JSON.stringify(orderData, null, 2));
    
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    
    const result = await response.json();
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response data:', result);
    
    if (response.ok && result.success) {
      console.log('🎉 SUCCESS! Order submission fix is working!');
      console.log('✅ Order created with ID:', result.order?.id);
      return true;
    } else {
      console.log('❌ Order submission still failing:');
      console.log('   Status:', response.status);
      console.log('   Error:', result.error);
      console.log('   Details:', result.details);
      
      if (response.status === 500 && result.details?.includes('product_name')) {
        console.log('🔧 The schema fix may need more time to deploy or there might be a caching issue');
      }
      
      return false;
    }
    
  } catch (error) {
    console.error('💥 Test failed with error:', error);
    return false;
  }
}

// Run the test
testOrderSubmissionFix().then(success => {
  if (success) {
    console.log('🎊 Order submission is now working correctly!');
  } else {
    console.log('⏳ If this fails, the deployment may need a few more minutes to propagate...');
  }
});