const pool = require('./server/database/db');
const Customer = require('./server/models/Customer');
const Order = require('./server/models/Order');

async function testOrderCreation() {
    try {
        console.log('🧪 Testing order creation with exact browser data...');
        
        // Test customer creation
        const customerData = {
            name: 'Test Customer',
            phone: '1234567890',
            delivery_address: 'Test Address'
        };
        
        console.log('👤 Creating customer...');
        const customer = await Customer.create(customerData);
        console.log('✅ Customer created:', customer.id);
        
        // Test order creation with exact items from browser
        const orderData = {
            customer_id: customer.id,
            delivery_date: '2025-09-10',
            preferred_delivery_method: 'pickup',
            request_status: 'urgent',
            items: [
                { product_name: 'Silicone Scar Sheet (Packet)', quantity: 10 },
                { product_name: 'Hera Wound-Gel 40g (Carton)', quantity: 3 }
            ]
        };
        
        console.log('📝 Creating order...');
        const order = await Order.create(orderData);
        console.log('✅ Order created successfully:', order.id);
        console.log('💰 Order total:', order.total_amount);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('📋 Stack:', error.stack);
    } finally {
        process.exit(0);
    }
}

testOrderCreation();
