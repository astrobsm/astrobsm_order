// 🔍 DIRECT TEST - Check if simplified PWA script is deployed

const https = require('https');

const BASE_URL = 'https://astrobsm-order-placement-fykxb.ondigitalocean.app';

function testSimplifiedScript() {
  return new Promise((resolve, reject) => {
    const req = https.request(BASE_URL, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('🔍 CHECKING SIMPLIFIED PWA SCRIPT DEPLOYMENT\n');
        
        // Check for simplified script
        const hasSimplifiedScript = data.includes('pwa-install-simple.js');
        const hasOldScripts = data.includes('pwa-install-diagnostic.js') || data.includes('pwa-install-banner.js');
        
        console.log('📋 Script Check:');
        console.log(`✅ Simplified Script: ${hasSimplifiedScript ? 'Found' : '❌ Missing'}`);
        console.log(`🔄 Old Scripts: ${hasOldScripts ? '⚠️ Still present' : 'Removed'}`);
        
        if (hasSimplifiedScript && !hasOldScripts) {
          console.log('\n🎉 SUCCESS: Simplified PWA script is deployed!');
          console.log('\n📱 The new system:');
          console.log('  • Single, simple script with guaranteed event listeners');
          console.log('  • Direct addEventListener attachment (no onclick issues)');
          console.log('  • Console logging for all button clicks');
          console.log('  • Fallback manual instructions for all browsers');
          console.log('  • Clean, responsive UI with working dismiss functionality');
          
          console.log('\n🔗 Test now:');
          console.log('   Visit: https://astrobsm-order-placement-fykxb.ondigitalocean.app');
          console.log('   • Blue install banner should appear at top');
          console.log('   • "Install Now" or "How to Install" button should work');
          console.log('   • Check browser console for "Install button clicked!" messages');
          console.log('   • Dismiss (×) button should work and remember for 7 days');
          
        } else if (hasSimplifiedScript && hasOldScripts) {
          console.log('\n⚠️  Both old and new scripts present - may cause conflicts');
          console.log('   Wait for full deployment or clear browser cache');
        } else {
          console.log('\n❌ Simplified script not deployed yet');
        }
        
        resolve();
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

testSimplifiedScript().catch(console.error);