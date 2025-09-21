// 📄 CHECK ACTUAL HTML DEPLOYMENT
// Verify what HTML is actually being served by production

const https = require('https');

const BASE_URL = 'https://astrobsm-order-placement-fykxb.ondigitalocean.app';

function checkHTMLContent() {
  return new Promise((resolve, reject) => {
    const req = https.request(BASE_URL, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('📄 CHECKING ACTUAL HTML DEPLOYMENT\n');
        
        // Look for specific script references
        const scripts = data.match(/<script src="[^"]*"[^>]*><\/script>/g) || [];
        
        console.log('📋 Scripts found in HTML:');
        scripts.forEach(script => {
          console.log(`  ${script}`);
        });
        
        // Check for PWA-specific content
        console.log('\n🔍 PWA-specific checks:');
        console.log('- pwa-install-diagnostic.js:', data.includes('pwa-install-diagnostic.js') ? '✅' : '❌');
        console.log('- pwa-install-banner.js:', data.includes('pwa-install-banner.js') ? '✅' : '❌');
        console.log('- manifest.json:', data.includes('manifest.json') ? '✅' : '❌');
        console.log('- Service worker registration:', data.includes('serviceWorker') ? '✅' : '❌');
        
        // Check for app.js version
        const appJsMatch = data.match(/app\.js\?v=([^"]*)/);
        if (appJsMatch) {
          console.log(`- app.js version: ${appJsMatch[1]}`);
        }
        
        // Check end of HTML for our additions
        const htmlEnd = data.slice(-1000); // Last 1000 characters
        console.log('\n📝 End of HTML (last 500 chars):');
        console.log(htmlEnd.slice(-500));
        
        resolve();
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

checkHTMLContent().catch(console.error);