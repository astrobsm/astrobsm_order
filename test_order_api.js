// Simple order test that we can run in browser console or directly
async function testOrderAPI() {
    console.log('🔧 Testing order API endpoints...');
    
    // First, test if products exist
    console.log('1. Checking if products exist...');
    try {
        const productsResponse = await fetch('/api/products');
        const products = await productsResponse.json();
        console.log('✅ Products loaded:', products.length);
        console.log('📦 First few products:', products.slice(0, 3).map(p => p.name));
        
        if (products.length === 0) {
            console.log('❌ No products found! Cannot test order creation.');
            return;
        }
        
        // Use the first product for testing
        const testProduct = products[0];
        console.log('🎯 Using test product:', testProduct.name);
        
        // Now test order creation
        console.log('2. Testing order creation...');
        
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
                    product_name: testProduct.name,
                    quantity: 1
                }
            ]
        };
        
        console.log('📤 Submitting order:', testOrder);
        
        const orderResponse = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testOrder)
        });
        
        console.log('📥 Order response status:', orderResponse.status, orderResponse.statusText);
        
        const orderResult = await orderResponse.json();
        console.log('📥 Order result:', orderResult);
        
        if (orderResponse.ok) {
            console.log('✅ Order created successfully!');
        } else {
            console.log('❌ Order creation failed:', orderResult.error || orderResult.details);
            if (orderResult.issues) {
                console.log('📋 Issues:', orderResult.issues);
            }
        }
        
    } catch (error) {
        console.error('💥 Test failed:', error);
    }
}

// Auto-run if this is in browser
if (typeof window !== 'undefined') {
    testOrderAPI();
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testOrderAPI };
}