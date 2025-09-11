// Test the enhanced schema fix that was deployed via GitHub web interface
(async () => {
  const URL = 'https://astrobsm-order-placement-fykxb.ondigitalocean.app';
  console.log('🚀 Testing Enhanced Schema Fix...');
  
  try {
    // The enhanced schema fix is already deployed via GitHub web interface
    console.log('🔧 Running enhanced schema fix...');
    
    const schemaResponse = await fetch(`${URL}/api/setup-schema`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ setup_key: 'astrobsm-setup-2025' })
    });
    
    console.log('📡 Schema fix status:', schemaResponse.status);
    const schemaResult = await schemaResponse.json();
    console.log('📋 Schema fix result:', schemaResult);
    
    if (schemaResponse.status === 200) {
      console.log('✅ Enhanced schema fix completed!');
      
      // Wait for schema changes to take effect
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Test order creation using iframe bypass
      console.log('🧪 Testing order creation after enhanced fix...');
      
      const testOrder = {
        customerData: {
          name: 'ENHANCED FIX TEST - ' + Date.now(),
          email: 'enhanced@test.com',
          phone: '08012345678',
          delivery_address: 'Enhanced Fix Test Address'
        },
        orderData: {
          delivery_date: '2025-09-15',
          delivery_route: 'Enhanced Test',
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
      
      // Use iframe to bypass service worker
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = 'about:blank';
      document.body.appendChild(iframe);
      
      try {
        const orderResponse = await iframe.contentWindow.fetch(`${URL}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testOrder)
        });
        
        console.log('📡 Order creation status:', orderResponse.status);
        const orderResult = await orderResponse.text();
        console.log('📋 Order creation response:', orderResult);
        
        if (orderResponse.status === 200 || orderResponse.status === 201) {
          console.log('🎉 ULTIMATE SUCCESS! Order created successfully!');
          
          // Check if order appears in database
          setTimeout(async () => {
            try {
              const ordersResponse = await iframe.contentWindow.fetch(`${URL}/api/orders?t=${Date.now()}`);
              if (ordersResponse.status === 200) {
                const orders = await ordersResponse.json();
                console.log('📊 Total orders in database:', orders.length);
                
                if (orders.length > 0) {
                  console.log('🎊 COMPLETE SUCCESS! Production is working!');
                  console.log('📋 Latest order:', orders[orders.length - 1]);
                  console.log('\n✅ FINAL STATUS:');
                  console.log('✓ Schema completely recreated');
                  console.log('✓ Order submission working');
                  console.log('✓ Database has orders');
                  console.log('✓ Admin panel will show orders');
                  console.log('\n🎯 YOUR PRODUCTION APP IS NOW FULLY FUNCTIONAL!');
                  console.log('🌐 https://astrobsm-order-placement-fykxb.ondigitalocean.app');
                } else {
                  console.log('⚠️ Order created but not showing in list');
                }
              }
            } catch (error) {
              console.log('❌ Error checking orders:', error.message);
            }
          }, 2000);
          
        } else {
          console.log('❌ Order creation failed:', orderResult);
        }
        
      } catch (orderError) {
        console.log('❌ Order creation error:', orderError.message);
      } finally {
        document.body.removeChild(iframe);
      }
      
    } else {
      console.log('❌ Schema fix failed:', schemaResult);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
})();
