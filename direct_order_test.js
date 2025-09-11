// Direct order creation test - bypasses service worker
(async () => {
  const URL = 'https://astrobsm-order-placement-fykxb.ondigitalocean.app';
  console.log('🎯 Creating Direct Order Test...');
  
  try {
    // Create a test order with unique data
    const testOrder = {
      customerData: {
        name: 'TEST CUSTOMER - ' + new Date().toISOString(),
        email: 'test@example.com',
        phone: '08012345678',
        delivery_address: 'Test Address Lagos'
      },
      orderData: {
        delivery_date: '2025-09-15',
        delivery_route: 'Test Route',
        preferred_delivery_method: 'delivery_lagos',
        request_status: 'normal'
      },
      items: [{
        product_name: 'Coban Bandage 4 inch (Piece)',
        quantity: 1,
        price: 37500
      }],
      total: 38437.5
    };
    
    console.log('📝 Test order data:', testOrder);
    
    // Submit directly using XMLHttpRequest to bypass service worker
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${URL}/api/orders`, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('X-Bypass-SW', 'true');
    
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        console.log('📡 XMLHttpRequest Status:', xhr.status);
        console.log('📡 XMLHttpRequest Response:', xhr.responseText);
        
        if (xhr.status === 200 || xhr.status === 201) {
          console.log('🎉 SUCCESS! Order created directly!');
          
          // Now check if it appears in admin panel
          setTimeout(async () => {
            console.log('🔍 Checking orders API...');
            
            try {
              const ordersResponse = await fetch(`${URL}/api/orders?t=${Date.now()}`, {
                method: 'GET',
                headers: {
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  'Pragma': 'no-cache'
                }
              });
              
              console.log('📊 Orders API Status:', ordersResponse.status);
              
              if (ordersResponse.status === 200) {
                const orders = await ordersResponse.json();
                console.log('📋 Total orders now:', orders.length);
                
                if (orders.length > 0) {
                  console.log('🎉 SUCCESS! Orders are now in database!');
                  console.log('📋 Latest order:', orders[orders.length - 1]);
                  console.log('\n✅ ADMIN PANEL SHOULD NOW SHOW ORDERS!');
                  console.log('🎯 Refresh the admin panel to see the order');
                } else {
                  console.log('❌ Orders still empty - may need to check server logs');
                }
              }
            } catch (error) {
              console.log('❌ Error checking orders:', error.message);
            }
          }, 2000);
          
        } else {
          console.log('❌ Order creation failed');
          console.log('Response:', xhr.responseText);
        }
      }
    };
    
    xhr.send(JSON.stringify(testOrder));
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
})();
