// 🔍 PRODUCTION ENDPOINT CHECK - Verify Available APIs
// Run this in the browser console at: https://astrobsm-order-placement-fykxb.ondigitalocean.app/

console.log('🔍 PRODUCTION ENDPOINT CHECK');
console.log('='.repeat(50));

async function checkEndpoints() {
  const endpoints = [
    { name: 'Health Check', url: '/api/health', method: 'GET' },
    { name: 'Products', url: '/api/products', method: 'GET' },
    { name: 'User Roles', url: '/api/users/public/roles', method: 'GET' },
    { name: 'Orders', url: '/api/orders', method: 'GET' },
    { name: 'Users Management', url: '/api/users', method: 'GET' }
  ];

  console.log('🚀 Testing available endpoints...\n');
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, { method: endpoint.method });
      console.log(`${response.ok ? '✅' : '❌'} ${endpoint.name}: ${response.status} ${response.statusText}`);
      
      if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
        try {
          const data = await response.json();
          console.log(`   📋 Sample data: ${JSON.stringify(data).substring(0, 100)}...`);
        } catch (e) {
          console.log('   📋 Data: (non-JSON response)');
        }
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ERROR - ${error.message}`);
    }
  }
  
  console.log('\n🔐 Testing Authentication...');
  try {
    const authResponse = await fetch('/api/users/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role_name: 'sales_staff',
        password: 'unicorn'
      })
    });
    
    console.log(`${authResponse.ok ? '✅' : '❌'} Authentication: ${authResponse.status} ${authResponse.statusText}`);
    
    if (authResponse.headers.get('content-type')?.includes('application/json')) {
      const authData = await authResponse.json();
      console.log(`   📋 Auth result: ${JSON.stringify(authData, null, 2)}`);
      
      if (authResponse.ok && authData.success) {
        console.log('🎉 Authentication successful! Ready for order testing.');
        return { authWorking: true, user: authData.user };
      }
    }
  } catch (error) {
    console.log(`❌ Authentication: ERROR - ${error.message}`);
  }
  
  return { authWorking: false };
}

checkEndpoints().then(result => {
  console.log('\n' + '='.repeat(50));
  if (result.authWorking) {
    console.log('🚀 System Ready - All endpoints working!');
    console.log('✅ You can now run the full order test script.');
  } else {
    console.log('⚠️ Some issues detected - check the results above.');
  }
});