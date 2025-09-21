// 🔍 DIAGNOSE PWA INSTALL FAILURE
// Check why browser install methods aren't working

const https = require('https');

const BASE_URL = 'https://astrobsm-order-placement-fykxb.ondigitalocean.app';

function checkPWAResource(path) {
  return new Promise((resolve) => {
    const req = https.request(BASE_URL + path, (res) => {
      resolve({
        path: path,
        status: res.statusCode,
        contentType: res.headers['content-type'],
        exists: res.statusCode === 200
      });
    });
    req.on('error', () => resolve({ path: path, exists: false, error: true }));
    req.end();
  });
}

async function diagnosePWAIssues() {
  console.log('🔍 DIAGNOSING PWA INSTALL ISSUES\n');
  
  // Check critical PWA resources
  const resources = [
    '/manifest.json',
    '/icon-192.png', 
    '/icon-512.png',
    '/sw-enhanced.js',
    '/sw.js'
  ];
  
  console.log('📋 Checking PWA Resources:');
  
  for (const resource of resources) {
    const result = await checkPWAResource(resource);
    const status = result.exists ? '✅' : '❌';
    console.log(`${status} ${resource}: ${result.exists ? `${result.status} (${result.contentType})` : 'Not found'}`);
  }
  
  // Check main page for PWA meta tags
  console.log('\n📄 Checking PWA Configuration:');
  
  try {
    const pageResult = await new Promise((resolve, reject) => {
      const req = https.request(BASE_URL, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      });
      req.on('error', reject);
      req.end();
    });
    
    const hasManifest = pageResult.includes('rel="manifest"');
    const hasServiceWorker = pageResult.includes('serviceWorker.register');
    const hasViewport = pageResult.includes('viewport');
    const hasThemeColor = pageResult.includes('theme-color');
    const hasAppleIcons = pageResult.includes('apple-touch-icon');
    
    console.log(`✅ Manifest linked: ${hasManifest ? 'Yes' : '❌ No'}`);
    console.log(`✅ Service Worker: ${hasServiceWorker ? 'Yes' : '❌ No'}`);
    console.log(`✅ Viewport meta: ${hasViewport ? 'Yes' : '❌ No'}`);
    console.log(`✅ Theme color: ${hasThemeColor ? 'Yes' : '❌ No'}`);
    console.log(`✅ Apple icons: ${hasAppleIcons ? 'Yes' : '❌ No'}`);
    
    console.log('\n🎯 LIKELY ISSUES:');
    
    if (!hasManifest) {
      console.log('❌ Manifest not linked - browsers can\'t detect PWA');
    }
    
    if (!hasServiceWorker) {
      console.log('❌ Service Worker not registered - required for PWA');
    }
    
    console.log('\n💡 WHY BROWSER INSTALL ISN\'T WORKING:');
    console.log('1. 📱 Chrome/Edge: Need manifest + service worker + user engagement');
    console.log('2. 🦊 Firefox: Limited PWA install support');
    console.log('3. 🍎 Safari: Only "Add to Home Screen" from share menu');
    console.log('4. 🔒 Already installed: Browser won\'t show install again');
    console.log('5. ⏰ Timing: Browser may delay install prompt');
    
    console.log('\n🔧 SOLUTIONS:');
    console.log('1. 📱 For Chrome/Edge:');
    console.log('   • Look for install icon (⬇️) in address bar');
    console.log('   • Menu → "Install ASTRO-BSM..."');
    console.log('   • May need to interact with site first');
    
    console.log('2. 🍎 For iOS Safari:');
    console.log('   • Tap Share button');
    console.log('   • Select "Add to Home Screen"');
    console.log('   • This is the ONLY way on iOS');
    
    console.log('3. 🦊 For Firefox:');
    console.log('   • Look for install icon in address bar');
    console.log('   • Menu → "Install this site as an app"');
    
    console.log('4. 🔄 If still issues:');
    console.log('   • Try incognito/private mode');
    console.log('   • Clear browser data for the site');
    console.log('   • Try different browser');
    
  } catch (error) {
    console.error('💥 Error checking page:', error.message);
  }
}

diagnosePWAIssues().catch(console.error);