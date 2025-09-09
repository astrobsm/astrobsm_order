const axios = require('axios');

async function testOrderSubmission() {
  try {
    console.log('🧪 Testing order submission with valid product names...');
    
    const orderData = {
      customer: {
        name: "John Doe",
        email: "john@example.com",
        phone: "1234567890",
        address: "123 Test Street",
        city: "Test City",
        state: "Test State"
      },
      items: [
        {
          product_name: "Opsite - Piece (PCS)", // Exact name from database
          quantity: 1,
          unit_price: 6000.00
        }
      ],
      total_amount: 6000.00,
      delivery_date: "2025-01-15",
      payment_method: "Bank Transfer",
      preferred_delivery_method: "pickup",
      request_status: "can_wait_24hrs"
    };

    console.log('📤 Sending order:', JSON.stringify(orderData, null, 2));
    
    const response = await axios.post('http://localhost:3000/api/orders', orderData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Order submitted successfully!');
    console.log('📥 Response:', response.data);
    
  } catch (error) {
    console.error('❌ Order submission failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testOrderSubmission();
