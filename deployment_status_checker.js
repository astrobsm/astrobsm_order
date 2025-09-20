// Production Deployment Status Checker
// Copy and paste this into browser console to check if deployment is complete

console.log('🔄 Checking production deployment status...');

async function checkDeploymentStatus() {
    try {
        // Check server timestamp to see if it's been redeployed
        const response = await fetch('/api/users');
        const data = await response.json();
        
        console.log('📊 Server response:', response.status, response.statusText);
        
        if (response.ok) {
            console.log('✅ Server is responding normally');
            console.log('📋 Database connection working');
            console.log('🎯 Ready for testing!');
            
            // Try a quick order validation test
            const testResponse = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}) // Empty body to trigger validation
            });
            
            const testResult = await testResponse.json();
            console.log('📥 Order endpoint test:', testResponse.status);
            console.log('📋 Response:', testResult);
            
            if (testResponse.status === 400 && testResult.error?.includes('Missing required fields')) {
                console.log('✅ Order endpoint validation working - deployment is complete!');
                console.log('🚀 Ready to test full order submission');
            } else if (testResponse.status === 500) {
                console.log('⚠️ Still getting 500 errors - deployment may be in progress');
                console.log('🕐 Wait a few minutes and try again');
            }
            
        } else {
            console.log('❌ Server issues detected');
        }
        
    } catch (error) {
        console.error('💥 Deployment check failed:', error);
        console.log('🕐 Server may still be redeploying...');
    }
}

checkDeploymentStatus();

console.log(`
🔍 Deployment Status Checker

Run this periodically until you see:
✅ Order endpoint validation working - deployment is complete!

Then run the full production tests.
`);