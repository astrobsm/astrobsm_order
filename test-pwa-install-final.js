// Final PWA Install Test with Company Logo Icons
console.log('🚀 Testing PWA Install with Company Logo Icons');

// Check if icons exist and are accessible
const iconTests = [
    { path: '/icon-192.png', size: '192x192' },
    { path: '/icon-512.png', size: '512x512' }
];

async function testIconsExist() {
    console.log('📱 Testing icon accessibility...');
    
    for (const icon of iconTests) {
        try {
            const response = await fetch(icon.path);
            if (response.ok) {
                console.log(`✅ Icon ${icon.size}: Available at ${icon.path}`);
            } else {
                console.log(`❌ Icon ${icon.size}: Not found at ${icon.path} (${response.status})`);
            }
        } catch (error) {
            console.log(`❌ Icon ${icon.size}: Error accessing ${icon.path} - ${error.message}`);
        }
    }
}

// Test manifest validity
async function testManifest() {
    console.log('\n📋 Testing manifest...');
    
    try {
        const response = await fetch('/manifest.json');
        if (response.ok) {
            const manifest = await response.json();
            console.log('✅ Manifest loaded successfully');
            console.log('📱 App name:', manifest.name);
            console.log('🎨 Theme color:', manifest.theme_color);
            console.log('🖼️ Icons found:', manifest.icons?.length || 0);
            
            if (manifest.icons) {
                manifest.icons.forEach((icon, index) => {
                    console.log(`   Icon ${index + 1}: ${icon.sizes} at ${icon.src}`);
                });
            }
        } else {
            console.log('❌ Manifest not accessible:', response.status);
        }
    } catch (error) {
        console.log('❌ Manifest error:', error.message);
    }
}

// Test service worker
async function testServiceWorker() {
    console.log('\n🔧 Testing service worker...');
    
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                console.log('✅ Service worker registered');
                console.log('📍 Scope:', registration.scope);
                console.log('🔄 State:', registration.active?.state || 'Unknown');
            } else {
                console.log('❌ No service worker registration found');
            }
        } catch (error) {
            console.log('❌ Service worker error:', error.message);
        }
    } else {
        console.log('❌ Service workers not supported');
    }
}

// Test PWA installability
async function testInstallPrompt() {
    console.log('\n📲 Testing PWA install prompt...');
    
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('✅ PWA is already installed and running in standalone mode');
        return;
    }
    
    // Check for manual install capability
    if ('beforeinstallprompt' in window || window.beforeinstallprompt) {
        console.log('✅ Install prompt capability available');
    } else {
        console.log('⚠️ Install prompt not yet available (may appear after interaction)');
    }
    
    // Test if install button exists and works
    const installButton = document.querySelector('#install-app, .install-btn, button[onclick*="install"]');
    if (installButton) {
        console.log('✅ Install button found:', installButton.textContent?.trim() || 'Unknown text');
        console.log('🔗 Button attributes:', installButton.outerHTML);
    } else {
        console.log('⚠️ No install button found in DOM');
    }
}

// Run all tests
async function runAllTests() {
    console.log('🏁 Starting comprehensive PWA install test...\n');
    
    await testIconsExist();
    await testManifest();
    await testServiceWorker();
    await testInstallPrompt();
    
    console.log('\n✨ Test complete! Check browser DevTools > Application > Manifest for visual verification.');
    console.log('📖 To test install prompt: Try refreshing the page and interacting with the install button.');
    console.log('🎯 Company logo should now appear as the app icon in install dialogs and app launcher.');
}

// Auto-run tests when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAllTests);
} else {
    runAllTests();
}