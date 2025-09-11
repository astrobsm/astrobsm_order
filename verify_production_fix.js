// Verification script to check if the schema fix worked
(async () => {
  const URL = 'https://astrobsm-order-placement-fykxb.ondigitalocean.app';
  console.log('🔍 Verifying Production Fix...');
  
  try {
    // 1. Check health
    console.log('1️⃣ Checking server health...');
    const healthResponse = await fetch(`${URL}/api/health`);
    console.log(`Health: ${healthResponse.status}`);
    
    // 2. Check products
    console.log('2️⃣ Checking products API...');
    const productsResponse = await fetch(`${URL}/api/admin/products`);
    console.log(`Products: ${productsResponse.status}`);
    if (productsResponse.status === 200) {
      const products = await productsResponse.json();
      console.log(`✅ Products available: ${products.length}`);
    }
    
    // 3. Check existing orders
    console.log('3️⃣ Checking existing orders...');
    const ordersResponse = await fetch(`${URL}/api/orders`);
    console.log(`Orders API: ${ordersResponse.status}`);
    if (ordersResponse.status === 200) {
      const orders = await ordersResponse.json();
      console.log(`📊 Current orders count: ${orders.length}`);
      if (orders.length > 0) {
        console.log('📋 First order:', orders[0]);
      }
    }
    
    // 4. Test direct order submission (bypass service worker)
    console.log('4️⃣ Testing direct order submission...');
    const testOrder = {
      customerData: { 
        name: 'Schema Fix Test', 
        phone: '1234567890', 
        delivery_address: 'Test Address' 
      },
      orderData: { 
        delivery_date: '2025-09-11', 
        preferred_delivery_method: 'pickup', 
        request_status: 'urgent' 
      },
      items: [{ 
        product_name: 'Test Product', 
        quantity: 1, 
        price: 1000 
      }],
      total: 1000
    };
    
    // Use fetch with cache: 'no-cache' to bypass service worker
    const orderResponse = await fetch(`${URL}/api/orders`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      cache: 'no-cache',
      body: JSON.stringify(testOrder)
    });
    
    console.log(`Direct order test: ${orderResponse.status}`);
    const orderResult = await orderResponse.text();
    console.log('Order result:', orderResult);
    
    if (orderResponse.status === 200 || orderResponse.status === 201) {
      console.log('🎉 SUCCESS! Orders are now working!');
      
      // Check orders again
      const newOrdersResponse = await fetch(`${URL}/api/orders`);
      const newOrders = await newOrdersResponse.json();
      console.log(`📊 Orders count after test: ${newOrders.length}`);
      
      console.log('\n✅ VERIFICATION COMPLETE:');
      console.log('• Schema fix applied successfully');
      console.log('• Order submission is working');
      console.log('• Admin panel should now show orders');
      console.log('\n🌐 Visit your app: https://astrobsm-order-placement-fykxb.ondigitalocean.app');
    } else {
      console.log('❌ Order submission still has issues');
      console.log('Response details:', orderResult);
    }
    
  } catch (error) {
    console.log('❌ Verification error:', error.message);
  }
})();
