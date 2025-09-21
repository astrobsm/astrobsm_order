// Test Stock Intake API Call
const fetch = require('node-fetch');

async function testStockIntake() {
  console.log('🔍 Testing Stock Intake API Call...');
  
  const testData = {
    product_id: 1,
    quantity_added: 10,
    cost_per_unit: 25.00,
    supplier: 'Test Supplier',
    batch_number: 'TEST123',
    notes: 'Test stock addition',
    userRole: 'superadmin' // This is key!
  };
  
  try {
    console.log('📤 Sending request to:', 'http://localhost:3000/api/stock/intake');
    console.log('📦 Request data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:3000/api/stock/intake', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📥 Response status:', response.status);
    
    const result = await response.text();
    console.log('📥 Response body:', result);
    
    if (response.ok) {
      console.log('✅ Stock intake API working correctly');
    } else {
      console.log('❌ Stock intake API failed');
      
      try {
        const errorData = JSON.parse(result);
        console.log('🔍 Error details:', errorData);
      } catch (e) {
        console.log('📝 Raw error:', result);
      }
    }
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

testStockIntake();