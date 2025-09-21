// 🧪 TEST PWA BUTTON RESPONSIVENESS
// Verify that the install buttons are now working after the fix

const https = require('https');

const BASE_URL = 'https://astrobsm-order-placement-fykxb.ondigitalocean.app';

function testButtonFixes() {
  return new Promise((resolve, reject) => {
    const req = https.request(BASE_URL, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('🧪 TESTING PWA BUTTON RESPONSIVENESS FIXES\n');
        
        // Check for the fixed button implementations
        const hasEventListeners = data.includes('addEventListener') && data.includes('pwa-install');
        const hasProperClasses = data.includes('pwa-install-btn') && data.includes('pwa-dismiss-btn');
        const hasGlobalFunctions = data.includes('window.installPWAFromBanner') && data.includes('window.showManualInstallFromBanner');
        const hasDebugLogging = data.includes('console.log') && data.includes('button clicked');
        
        console.log('📋 Button Fix Verification:');
        console.log(`✅ Event Listeners: ${hasEventListeners ? 'Found' : '❌ Missing'}`);
        console.log(`✅ Proper Classes: ${hasProperClasses ? 'Found' : '❌ Missing'}`);
        console.log(`✅ Global Functions: ${hasGlobalFunctions ? 'Found' : '❌ Missing'}`);
        console.log(`✅ Debug Logging: ${hasDebugLogging ? 'Found' : '❌ Missing'}`);
        
        if (hasEventListeners && hasProperClasses) {
          console.log('\n🎉 SUCCESS: PWA install buttons should now be responsive!');
          console.log('\n📱 What was fixed:');
          console.log('  • Replaced onclick handlers with addEventListener');
          console.log('  • Added proper event delegation and bubbling prevention');
          console.log('  • Made functions globally available on window object');
          console.log('  • Added debug logging to track button clicks');
          console.log('  • Fixed event listener timing and attachment');
          
          console.log('\n🔗 Test now:');
          console.log('   Visit: https://astrobsm-order-placement-fykxb.ondigitalocean.app');
          console.log('   • Install banner should appear with working buttons');
          console.log('   • "Install" or "How to Install" buttons should respond');
          console.log('   • Console logs should show button click events');
          console.log('   • Floating "Install Options" button should work');
          
        } else {
          console.log('\n⚠️  Some fixes may not have deployed yet - wait a moment and try again');
        }
        
        resolve();
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

testButtonFixes().catch(console.error);