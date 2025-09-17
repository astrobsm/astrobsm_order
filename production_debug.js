// Production Authentication Debugging Script
// Run this in the browser console on https://astrobsm-order-placement-fykxb.ondigitalocean.app

console.log('🔧 Starting production authentication debug...');

// Test authentication with different roles
async function testAuthentication() {
    const testCases = [
        {
            name: 'Customer Role (no password)',
            role: 'customer',
            password: null
        },
        {
            name: 'Sales Staff Role',
            role: 'sales_staff',
            password: 'pinkpetals'
        },
        {
            name: 'Superadmin Role',
            role: 'superadmin',
            password: 'natiss2024'
        }
    ];
    
    for (const testCase of testCases) {
        console.log(`\n🧪 Testing: ${testCase.name}`);
        
        try {
            const requestBody = {
                role_name: testCase.role
            };
            
            if (testCase.password) {
                requestBody.password = testCase.password;
            }
            
            console.log('📤 Request:', requestBody);
            
            const response = await fetch('/api/users/authenticate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            console.log(`📥 Response status: ${response.status} ${response.statusText}`);
            
            const result = await response.json();
            console.log('📥 Response body:', result);
            
            if (response.ok && result.success) {
                console.log(`✅ ${testCase.name} authentication successful`);
                
                // Store session data for further testing
                if (testCase.role === 'superadmin') {
                    window.debugAuthData = {
                        userRole: result.sessionData.role,
                        sessionData: result.sessionData
                    };
                    console.log('💾 Superadmin session data stored in window.debugAuthData');
                }
            } else {
                console.log(`❌ ${testCase.name} authentication failed`);
            }
            
        } catch (error) {
            console.error(`💥 ${testCase.name} authentication error:`, error);
        }
    }
}

// Test product management API with authentication
async function testProductManagement() {
    console.log('\n🛠️ Testing product management API...');
    
    if (!window.debugAuthData) {
        console.log('❌ No authentication data available. Run testAuthentication() first.');
        return;
    }
    
    try {
        console.log('📤 Testing product fetch with authentication...');
        
        const response = await fetch('/api/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'list',
                userRole: window.debugAuthData.userRole
            })
        });
        
        console.log(`📥 Product API response: ${response.status} ${response.statusText}`);
        
        const result = await response.json();
        console.log('📥 Product API response body:', result);
        
        if (response.ok) {
            console.log('✅ Product management API accessible');
        } else {
            console.log('❌ Product management API access denied');
        }
        
    } catch (error) {
        console.error('💥 Product management API error:', error);
    }
}

// Test order submission
async function testOrderSubmission() {
    console.log('\n🛒 Testing order submission...');
    
    const testOrder = {
        customerName: 'Test Customer',
        customerPhone: '1234567890',
        customerEmail: 'test@example.com',
        items: [
            {
                productId: 1,
                productName: 'Test Product',
                quantity: 1,
                price: 100.00
            }
        ],
        totalAmount: 100.00,
        paymentMethod: 'cash'
    };
    
    try {
        console.log('📤 Submitting test order...');
        
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testOrder)
        });
        
        console.log(`📥 Order submission response: ${response.status} ${response.statusText}`);
        
        const result = await response.json();
        console.log('📥 Order submission response body:', result);
        
        if (response.ok) {
            console.log('✅ Order submission successful');
        } else {
            console.log('❌ Order submission failed');
        }
        
    } catch (error) {
        console.error('💥 Order submission error:', error);
    }
}

// Check database connectivity
async function testDatabaseConnection() {
    console.log('\n🗄️ Testing database connectivity...');
    
    try {
        const response = await fetch('/api/users', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`📥 Database test response: ${response.status} ${response.statusText}`);
        
        const result = await response.json();
        console.log('📥 Database test response body:', result);
        
        if (response.ok && result.success) {
            console.log('✅ Database connection working');
            console.log(`📊 Found ${result.roles?.length || 0} roles in database`);
        } else {
            console.log('❌ Database connection issues');
        }
        
    } catch (error) {
        console.error('💥 Database connection error:', error);
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Starting comprehensive production authentication tests...\n');
    
    await testDatabaseConnection();
    await testAuthentication();
    await testProductManagement();
    await testOrderSubmission();
    
    console.log('\n🏁 All tests completed. Check results above.');
}

// Make functions available globally
window.testAuthentication = testAuthentication;
window.testProductManagement = testProductManagement;
window.testOrderSubmission = testOrderSubmission;
window.testDatabaseConnection = testDatabaseConnection;
window.runAllTests = runAllTests;

console.log(`
🔧 Production Authentication Debug Tools Loaded!

Available commands:
• runAllTests() - Run all authentication and API tests
• testAuthentication() - Test login for all roles  
• testProductManagement() - Test product API access
• testOrderSubmission() - Test order creation
• testDatabaseConnection() - Check database connectivity

To start debugging, run: runAllTests()
`);