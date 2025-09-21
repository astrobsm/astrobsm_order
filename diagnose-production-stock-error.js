// Production Stock Error Diagnostic
// This script helps diagnose the specific 500 error you're experiencing

console.log('🔍 Diagnosing Stock Adjustment 500 Error');
console.log('==========================================');

// Test the specific failing endpoint
async function diagnoseStockError() {
    const API_BASE = 'https://astrobsm-order-placement-fykxb.ondigitalocean.app';
    
    try {
        console.log('🧪 Testing stock adjustment endpoint that failed...');
        
        // Test the endpoint that was failing: /api/stock/adjust/11
        const testPayload = {
            userRole: 'superadmin',
            new_stock: 50,
            reason: 'Diagnostic test adjustment'
        };
        
        console.log('📤 Sending test request to /api/stock/adjust/11');
        console.log('📋 Payload:', testPayload);
        
        const response = await fetch(`${API_BASE}/api/stock/adjust/11`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testPayload)
        });
        
        console.log('📥 Response status:', response.status);
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Success:', result);
        } else {
            const errorText = await response.text();
            console.log('❌ Error response:', errorText);
            
            if (response.status === 500) {
                console.log('\n💡 This is likely a database schema issue');
                console.log('🔧 Recommended actions:');
                console.log('1. Restart your production server to apply stock schema fixes');
                console.log('2. Check server logs for database errors');
                console.log('3. Verify database connectivity');
            }
        }
        
    } catch (error) {
        console.error('❌ Network or request error:', error);
        console.log('\n💡 This suggests a server connectivity issue');
        console.log('🔧 Check if your production server is running');
    }
}

// Also test a simple API endpoint to verify server status
async function testServerHealth() {
    const API_BASE = 'https://astrobsm-order-placement-fykxb.ondigitalocean.app';
    
    try {
        console.log('\n🏥 Testing server health...');
        const response = await fetch(`${API_BASE}/api/products`);
        
        if (response.ok) {
            const products = await response.json();
            console.log('✅ Server is responding, products loaded:', products.length || 'unknown count');
        } else {
            console.log('⚠️ Server responding but with error:', response.status);
        }
        
    } catch (error) {
        console.log('❌ Server health check failed:', error.message);
    }
}

// Run diagnostics
async function runDiagnostics() {
    await testServerHealth();
    await diagnoseStockError();
}

runDiagnostics();