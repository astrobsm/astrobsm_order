// 🔍 SIMPLE AUTH TEST - Check exact authentication response
// Run this in the browser console at: https://astrobsm-order-placement-fykxb.ondigitalocean.app/

console.log('🔍 SIMPLE AUTHENTICATION TEST');
console.log('='.repeat(40));

async function testAuth() {
  console.log('🔐 Testing sales_staff authentication...');
  
  try {
    const response = await fetch('/api/users/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role_name: 'sales_staff',
        password: 'pinkpetals'
      })
    });
    
    console.log('📡 Response Status:', response.status);
    console.log('📡 Response Status Text:', response.statusText);
    console.log('📡 Response OK:', response.ok);
    
    const data = await response.json();
    console.log('📋 Full Response Data:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('✅ Authentication successful!');
      console.log('👤 User data:', data.user);
      return { success: true, user: data.user };
    } else {
      console.log('❌ Authentication failed');
      console.log('📋 Error:', data.error);
      return { success: false, error: data.error };
    }
    
  } catch (error) {
    console.log('❌ Network/parsing error:', error.message);
    return { success: false, error: error.message };
  }
}

testAuth().then(result => {
  console.log('\n' + '='.repeat(40));
  if (result.success) {
    console.log('🎉 READY FOR FULL ORDER TEST!');
  } else {
    console.log('🔧 Need to fix authentication first');
  }
});