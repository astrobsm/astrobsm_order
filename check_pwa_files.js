// 🔍 CHECK SERVICE WORKER FILES
// Verify all PWA files are accessible in production

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
          size: data.length,
          content: data.slice(0, 200) + (data.length > 200 ? '...' : '')
        });
      });
    });
    
    req.on('error', () => {
      resolve({ path, status: 0, accessible: false });
    });
    req.end();
  });
}

async function checkAllFiles() {
  console.log('🔍 CHECKING PWA FILES ACCESSIBILITY\n');
  
  const files = [
    '/sw-register.js',
    '/sw.js',
    '/sw-enhanced.js',
    '/manifest.json',
    '/pwa-install-simple.js',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
  ];
  
  for (const file of files) {
    const result = await checkFile(file);
    const status = result.accessible ? '✅' : '❌';
    console.log(`${status} ${file}`);
    console.log(`   Status: ${result.status}`);
    if (result.accessible) {
      console.log(`   Size: ${result.size} bytes`);
      if (file.endsWith('.js')) {
        console.log(`   Preview: ${result.content.replace(/\n/g, ' ')}`);
      }
    }
    console.log('');
  }
  
  console.log('💡 If all files are accessible but PWA still not working:');
  console.log('  1. Clear browser cache completely');
  console.log('  2. Try in incognito mode');
  console.log('  3. Check browser console for JavaScript errors');
  console.log('  4. Verify HTTPS is working (required for PWA)');
}

checkAllFiles().catch(console.error);