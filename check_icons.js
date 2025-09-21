// 🔍 CHECK ICON ACCESSIBILITY
// Verify icons are accessible at the correct paths

const https = require('https');

const BASE_URL = 'https://astrobsm-order-placement-fykxb.ondigitalocean.app';

function checkFile(path) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    const req = https.request(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          path,
          status: res.statusCode,
          accessible: res.statusCode === 200,
          size: data.length
        });
      });
    });
    
    req.on('error', () => {
      resolve({ path, status: 0, accessible: false });
    });
    req.end();
  });
}

async function checkIcons() {
  console.log('🔍 CHECKING ICON ACCESSIBILITY\n');
  
  const icons = [
    '/icon-192.png',
    '/icon-512.png'
  ];
  
  let allAccessible = true;
  
  for (const icon of icons) {
    const result = await checkFile(icon);
    const status = result.accessible ? '✅' : '❌';
    console.log(`${status} ${icon}`);
    console.log(`   Status: ${result.status}`);
    if (result.accessible) {
      console.log(`   Size: ${result.size} bytes`);
    } else {
      allAccessible = false;
    }
    console.log('');
  }
  
  if (allAccessible) {
    console.log('🎉 ALL ICONS ARE ACCESSIBLE!');
    console.log('\n💡 PWA should work now. The issue was likely:');
    console.log('  • Browser cache preventing updates');
    console.log('  • Service worker not registered yet');
    console.log('\n🔧 To test PWA install:');
    console.log('  1. Open in Chrome/Edge');
    console.log('  2. Hard refresh (Ctrl+F5)');
    console.log('  3. Look for install icon in address bar');
    console.log('  4. Or try Settings > Install App');
    console.log('\n🚀 In mobile browser:');
    console.log('  1. Open site in Chrome/Safari');
    console.log('  2. Look for "Add to Home Screen" option');
  } else {
    console.log('❌ Some icons are missing - PWA install will not work');
  }
}

checkIcons().catch(console.error);