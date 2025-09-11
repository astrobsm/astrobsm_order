// SIMPLE BROWSER CONSOLE SCHEMA FIX
// 1. Go to: https://astrobsm-order-placement-fykxb.ondigitalocean.app
// 2. Open Console (F12)
// 3. Paste this code and press Enter

(async () => {
  const URL = 'https://astrobsm-order-placement-fykxb.ondigitalocean.app';
  console.log('🚀 Running Schema Fix...');
  
  try {
    // Call schema fix
    const response = await fetch(`${URL}/api/setup-schema`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ setup_key: 'astrobsm-setup-2025' })
    });
    
    const result = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Result:', result);
    
    if (response.status === 200) {
      console.log('✅ Schema Fix SUCCESS!');
      
      // Test order submission
      const testOrder = {
        customerData: { name: 'Test', phone: '123', delivery_address: 'Test' },
        orderData: { delivery_date: '2025-09-11', preferred_delivery_method: 'pickup', request_status: 'urgent' },
        items: [{ product_name: 'Test Product', quantity: 1, price: 1000 }],
        total: 1000
      };
      
      const orderResponse = await fetch(`${URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testOrder)
      });
      
      console.log(`Order test: ${orderResponse.status}`);
      if (orderResponse.status === 200) {
        console.log('🎉 ORDERS NOW WORKING!');
      }
    } else if (response.status === 404) {
      console.log('❌ Schema endpoint not deployed yet');
    }
  } catch (error) {
    console.log('Error:', error.message);
  }
})();
