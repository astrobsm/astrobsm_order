// Final test script - run after hard refresh
(async () => {
  const URL = 'https://astrobsm-order-placement-fykxb.ondigitalocean.app';
  console.log('🎯 Final Production Test (Post-Refresh)...');
  
  try {
    // Check if service worker is truly gone
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log('Service workers found:', registrations.length);
      if (registrations.length > 0) {
        console.log('⚠️ Service worker still present - please do a hard refresh (Ctrl+Shift+R)');
        return;
      }
    }
    
    console.log('✅ No service worker detected');
    
    // Test direct order submission
    console.log('🧪 Testing direct order submission...');
    const testOrder = {
      customerData: { 
        name: 'Final Test Customer', 
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
    
    const orderResponse = await fetch(`${URL}/api/orders`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testOrder)
    });
    
    console.log(`🎯 Order submission status: ${orderResponse.status}`);
    const orderResult = await orderResponse.text();
    console.log('📝 Order result:', orderResult);
    
    if (orderResponse.status === 200 || orderResponse.status === 201) {
      console.log('🎉 SUCCESS! Orders are working!');
      
      // Check orders count
      const ordersResponse = await fetch(`${URL}/api/orders`);
      const orders = await ordersResponse.json();
      console.log(`📊 Total orders: ${orders.length}`);
      
      if (orders.length > 0) {
        console.log('📋 Latest order:', orders[orders.length - 1]);
      }
      
      console.log('\n✅ PRODUCTION IS WORKING:');
      console.log('✓ Schema fix applied');
      console.log('✓ Order submission working');
      console.log('✓ Admin panel should show orders');
      console.log('\n🎯 Test the admin panel now!');
      
    } else if (orderResponse.status === 202) {
      console.log('❌ Service worker still intercepting - need hard refresh');
      console.log('Press Ctrl+Shift+R to do a hard refresh, then run this script again');
      
    } else {
      console.log('❌ Unexpected response:', orderResult);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
})();
