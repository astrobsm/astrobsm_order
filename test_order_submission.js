// Test Order Submission Script
const API_BASE_URL = 'http://localhost:3000/api';

async function testOrderSubmission() {
    console.log('🧪 Testing order submission...');
    
    const testOrder = {
        customerData: {
            name: 'Test Customer',
            email: 'test@example.com',
            phone: '08012345678',
            delivery_address: 'Test Address, Enugu'
        },
        orderData: {
            delivery_date: '2025-09-20',
            delivery_route: 'enugu_metro',
            preferred_delivery_method: 'delivery_enugu',
            request_status: 'pending'
        },
        items: [
            {
                product_name: 'Paracetamol 500mg Tablets',
                quantity: 2
            }
        ]
    };
    
    try {
        console.log('📤 Submitting test order:', testOrder);
        
        const response = await fetch(`${API_BASE_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testOrder)
        });
        
        console.log(`📥 Response status: ${response.status} ${response.statusText}`);
        
        const result = await response.json();
        console.log('📥 Response body:', result);
        
        if (response.ok) {
            console.log('✅ Order submission successful!');
        } else {
            console.log('❌ Order submission failed:', result.error || result.details);
        }
        
    } catch (error) {
        console.error('💥 Order submission error:', error);
    }
}

// Run the test
testOrderSubmission();