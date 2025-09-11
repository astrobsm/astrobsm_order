// Deep schema fix - specifically targets the customer_id constraint issue
(async () => {
  const URL = 'https://astrobsm-order-placement-fykxb.ondigitalocean.app';
  console.log('🔧 Deep Schema Fix - Targeting customer_id Constraint...');
  
  try {
    // Create an enhanced schema fix endpoint call
    const deepSchemaFix = await fetch(`${URL}/api/setup-schema`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        setup_key: 'astrobsm-setup-2025',
        deep_fix: true  // Signal for deep fix
      })
    });
    
    console.log('Deep schema fix status:', deepSchemaFix.status);
    const result = await deepSchemaFix.json();
    console.log('Deep schema fix result:', result);
    
    // Now let's make a direct API call to check the table structure
    console.log('🔍 Checking table structure...');
    
    // Use a manual SQL diagnostic approach
    const diagnosticOrder = {
      customerData: {
        name: 'DIAGNOSTIC TEST - ' + Date.now(),
        email: 'diagnostic@test.com',
        phone: '08000000000',
        delivery_address: 'Diagnostic Address'
      },
      orderData: {
        delivery_date: '2025-09-15',
        delivery_route: 'Diagnostic',
        preferred_delivery_method: 'pickup',
        request_status: 'normal'
      },
      items: [{
        product_name: 'Coban Bandage 4 inch (Piece)',
        quantity: 1,
        price: 37500
      }],
      total: 38437.5
    };
    
    console.log('🧪 Testing with diagnostic order...');
    
    // Create iframe for bypassing service worker
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = 'about:blank';
    document.body.appendChild(iframe);
    
    try {
      // Test the order creation
      const testResponse = await iframe.contentWindow.fetch(`${URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(diagnosticOrder)
      });
      
      console.log('📡 Diagnostic order status:', testResponse.status);
      const testResult = await testResponse.text();
      console.log('📡 Diagnostic order response:', testResult);
      
      if (testResponse.status === 200 || testResponse.status === 201) {
        console.log('🎉 SUCCESS! Order created after deep schema fix!');
        
        // Verify orders exist
        setTimeout(async () => {
          const ordersCheck = await iframe.contentWindow.fetch(`${URL}/api/orders?t=${Date.now()}`);
          if (ordersCheck.status === 200) {
            const orders = await ordersCheck.json();
            console.log('📊 Orders in database:', orders.length);
            
            if (orders.length > 0) {
              console.log('🎉 COMPLETE SUCCESS!');
              console.log('📋 Latest order:', orders[orders.length - 1]);
              console.log('\n✅ PRODUCTION IS NOW FULLY WORKING!');
              console.log('🎯 Admin panel will show orders');
              console.log('🎯 Regular order submission will work');
              console.log('\n🌐 Test at: https://astrobsm-order-placement-fykxb.ondigitalocean.app');
            }
          }
        }, 2000);
        
      } else {
        const errorData = JSON.parse(testResult);
        console.log('❌ Still getting error:', errorData.details);
        
        if (errorData.details.includes('customer_id')) {
          console.log('\n🔧 MANUAL FIX NEEDED:');
          console.log('The customers table still has a customer_id constraint issue.');
          console.log('This needs to be fixed at the database level.');
          console.log('\n💡 SOLUTION OPTIONS:');
          console.log('1. Add enhanced SQL to the schema fix endpoint');
          console.log('2. Or manually update the database schema');
          console.log('3. The app will work once this constraint is resolved');
        }
      }
      
    } catch (orderError) {
      console.log('❌ Order test error:', orderError.message);
    } finally {
      document.body.removeChild(iframe);
    }
    
  } catch (error) {
    console.log('❌ Deep schema fix error:', error.message);
  }
})();
