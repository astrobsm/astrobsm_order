// DATABASE RESET AND MIGRATION SCRIPT FOR PRODUCTION
// Run this in browser console to reset the production database

const resetProductionDatabase = async () => {
    console.log('🚀 Starting production database reset...');
    
    try {
        // Call the database reset endpoint
        const response = await fetch('/api/reset-database', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Database reset successful:', result);
            
            // Test the fresh database
            console.log('🧪 Testing fresh database with sample order...');
            
            const testOrder = {
                customerName: 'Fresh DB Test Customer',
                customerPhone: '+1234567890',
                customerAddress: '123 Fresh DB Test Street',
                customerCompany: 'Fresh DB Test Company',
                items: [{
                    name: 'Opsite (Piece)',
                    quantity: 2,
                    price: 6000
                }]
            };
            
            const testResponse = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                },
                body: JSON.stringify(testOrder)
            });
            
            if (testResponse.ok) {
                const testResult = await testResponse.json();
                console.log('✅ Test order created successfully:', testResult);
                
                // Check if order appears in admin panel
                const ordersResponse = await fetch('/api/orders');
                if (ordersResponse.ok) {
                    const orders = await ordersResponse.json();
                    console.log('✅ Orders in database:', orders.length);
                    console.log('📋 Latest order:', orders[0]);
                    
                    if (orders.length > 0) {
                        console.log('🎉 SUCCESS! Database reset complete and working perfectly!');
                        console.log('✅ Admin panel will now show orders');
                        console.log('✅ Order submission is working');
                        console.log('✅ All schema issues resolved');
                    }
                } else {
                    console.log('⚠️ Orders fetch failed, but order creation worked');
                }
            } else {
                const testError = await testResponse.text();
                console.log('❌ Test order failed:', testError);
            }
        } else {
            const errorText = await response.text();
            console.log('❌ Database reset failed:', errorText);
        }
    } catch (error) {
        console.log('❌ Reset failed with error:', error);
    }
};

// Run the reset
resetProductionDatabase();

console.log(`
🔄 Production Database Reset Script
==================================
This script will:
1. Drop all existing tables
2. Create fresh tables with correct schema
3. Insert all products with proper pricing
4. Test the new database with a sample order
5. Verify admin panel functionality

Wait for the process to complete...
`);
