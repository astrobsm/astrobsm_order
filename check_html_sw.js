// 🔍 CHECK HTML DEPLOYMENT STATUS
// Verify if the service worker script is actually in the deployed HTML

const https = require('https');

const BASE_URL = 'https://astrobsm-order-placement-fykxb.ondigitalocean.app';

function checkHTMLForSW() {
  return new Promise((resolve, reject) => {
    const req = https.request(BASE_URL, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('🔍 CHECKING HTML DEPLOYMENT STATUS\n');
        
        // Check for service worker script
        const hasSWScript = data.includes('sw-register.js');
        const hasSWInline = data.includes('serviceWorker.register');
        const hasManifest = data.includes('manifest.json');
        
        console.log('📋 Service Worker in HTML:');
        console.log(`✅ SW Script Reference: ${hasSWScript ? 'Found' : '❌ Missing'}`);
        console.log(`✅ Inline SW Code: ${hasSWInline ? 'Found' : '❌ Missing'}`);
        console.log(`✅ Manifest Link: ${hasManifest ? 'Found' : '❌ Missing'}`);
        
        // Look for script tags in head
        const headSection = data.match(/<head[^>]*>[\s\S]*?<\/head>/i);
        if (headSection) {
          const scripts = headSection[0].match(/<script[^>]*src="[^"]*"[^>]*>/gi) || [];
          console.log('\n📋 Scripts in Head:');
          scripts.forEach(script => {
            console.log(`  ${script}`);
          });
        }
        
        if (hasSWScript) {
          console.log('\n🎉 SUCCESS: Service worker script is in HTML!');
          console.log('💡 The issue might be:');
          console.log('  • Service worker file not loading (check network tab)');
          console.log('  • JavaScript error preventing registration');
          console.log('  • Browser cache preventing update');
          console.log('\n🔧 Try these:');
          console.log('  1. Hard refresh (Ctrl+F5 or Cmd+Shift+R)');
          console.log('  2. Clear site data in browser settings');
          console.log('  3. Try incognito/private mode');
          console.log('  4. Check browser console for errors');
        } else {
          console.log('\n❌ DEPLOYMENT ISSUE: Service worker script not in HTML');
          console.log('💡 The deployment may not have completed yet');
          console.log('🔄 Wait 2-3 more minutes and try again');
        }
        
        resolve();
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

checkHTMLForSW().catch(console.error);