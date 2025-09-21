// 🧪 TEST PWA INSTALL FEATURES
// Quick test to verify the enhanced install experience is deployed

const https = require('https');

const BASE_URL = 'https://astrobsm-order-placement-fykxb.ondigitalocean.app';

function testPWAFeatures() {
  return new Promise((resolve, reject) => {
    const req = https.request(BASE_URL, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('🧪 TESTING PWA INSTALL FEATURES\n');
        
        // Check if PWA scripts are included
        const hasDiagnostic = data.includes('pwa-install-diagnostic.js');
        const hasBanner = data.includes('pwa-install-banner.js');
        const hasManifest = data.includes('manifest.json');
        const hasServiceWorker = data.includes('sw-enhanced.js') || data.includes('serviceWorker');
        
        console.log('📋 PWA Features Check:');
        console.log(`✅ Manifest: ${hasManifest ? 'Found' : '❌ Missing'}`);
        console.log(`✅ Install Diagnostic: ${hasDiagnostic ? 'Found' : '❌ Missing'}`);
        console.log(`✅ Install Banner: ${hasBanner ? 'Found' : '❌ Missing'}`);
        console.log(`✅ Service Worker: ${hasServiceWorker ? 'Found' : '❌ Missing'}`);
        
        if (hasDiagnostic && hasBanner && hasManifest) {
          console.log('\n🎉 SUCCESS: Enhanced PWA install features deployed!');
          console.log('\n📱 What to expect:');
          console.log('  • Install diagnostic runs automatically');
          console.log('  • Enhanced install banner appears (if not installed)');
          console.log('  • Multiple install methods available');
          console.log('  • Better user experience for installation');
          console.log('\n🔗 Visit the app to see the install prompt:');
          console.log('   https://astrobsm-order-placement-fykxb.ondigitalocean.app');
          console.log('\n💡 Try:');
          console.log('  1. Visit in Chrome/Edge (look for install icon in address bar)');
          console.log('  2. Wait for automatic install banner');
          console.log('  3. Open console and run: triggerInstallPrompt()');
          console.log('  4. Use browser menu → Install options');
        } else {
          console.log('\n⚠️  Some PWA features may be missing - check deployment');
        }
        
        resolve();
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

testPWAFeatures().catch(console.error);