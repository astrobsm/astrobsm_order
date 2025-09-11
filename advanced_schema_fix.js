// Advanced schema fix - handles the customer_id constraint issue
(async () => {
  const URL = 'https://astrobsm-order-placement-fykxb.ondigitalocean.app';
  console.log('🔧 Advanced Schema Fix for customer_id Issue...');
  
  try {
    // Run the enhanced schema fix
    const schemaResponse = await fetch(`${URL}/api/setup-schema`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ setup_key: 'astrobsm-setup-2025' })
    });
    
    console.log('Schema fix status:', schemaResponse.status);
    const schemaResult = await schemaResponse.json();
    console.log('Schema fix result:', schemaResult);
    
    if (schemaResponse.status === 200) {
      console.log('✅ Basic schema fix completed');
      
      // Now test order creation with iframe method (bypasses SW)
      console.log('🧪 Testing order creation after schema fix...');
      
      const testOrder = {
        customerData: {
          name: 'Schema Fix Test Customer',
          email: 'test@astrobsm.com',
          phone: '08012345678',
          delivery_address: 'Schema Fix Test Address'
        },
        orderData: {
          delivery_date: '2025-09-15',
          delivery_route: 'Schema Test',
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
        console.log('📡 Order creation response:', orderResult);
        
        if (orderResponse.status === 200 || orderResponse.status === 201) {
          console.log('🎉 SUCCESS! Order created successfully!');
          
          // Check orders in database
          setTimeout(async () => {
            try {
              const ordersResponse = await iframe.contentWindow.fetch(`${URL}/api/orders?t=${Date.now()}`);
              if (ordersResponse.status === 200) {
                const orders = await ordersResponse.json();
                console.log('📊 Total orders in database:', orders.length);
                
                if (orders.length > 0) {
                  console.log('🎉 ULTIMATE SUCCESS! Database has orders!');
                  console.log('📋 Latest order:', orders[orders.length - 1]);
                  console.log('\n✅ ADMIN PANEL WILL NOW WORK!');
                  console.log('🔄 Refresh and check admin panel');
                } else {
                  console.log('⚠️ Order created but not showing in list - check server logs');
                }
              }
            } catch (error) {
              console.log('❌ Error checking orders:', error.message);
            }
          }, 2000);
          
        } else if (orderResponse.status === 500) {
          const errorData = JSON.parse(orderResult);
          console.log('❌ Server error:', errorData.details);
          
          if (errorData.details.includes('customer_id')) {
            console.log('🔧 Still have customer_id constraint issue - need deeper fix');
            console.log('📝 The customers table structure needs manual correction');
          }
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
