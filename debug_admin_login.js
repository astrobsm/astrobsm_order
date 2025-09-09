// Debug script to test admin login functionality
console.log('🔍 Testing Admin Login Debug');
console.log('============================\n');

// Test if elements exist
function checkElements() {
  console.log('Checking DOM elements...');
  
  const adminBtn = document.getElementById('adminBtn');
  const adminModal = document.getElementById('adminModal');
  const loginBtn = document.getElementById('loginBtn');
  const adminPasswordInput = document.getElementById('adminPassword');
  const passwordSection = document.getElementById('passwordSection');
  const ordersSection = document.getElementById('ordersSection');
  
  console.log('adminBtn:', adminBtn ? '✅ Found' : '❌ Missing');
  console.log('adminModal:', adminModal ? '✅ Found' : '❌ Missing');
  console.log('loginBtn:', loginBtn ? '✅ Found' : '❌ Missing');
  console.log('adminPasswordInput:', adminPasswordInput ? '✅ Found' : '❌ Missing');
  console.log('passwordSection:', passwordSection ? '✅ Found' : '❌ Missing');
  console.log('ordersSection:', ordersSection ? '✅ Found' : '❌ Missing');
  
  return { adminBtn, adminModal, loginBtn, adminPasswordInput, passwordSection, ordersSection };
}

// Test login functionality
function testLogin() {
  const elements = checkElements();
  
  if (!elements.loginBtn || !elements.adminPasswordInput) {
    console.log('\n❌ Missing required elements for login test');
    return;
  }
  
  console.log('\n🧪 Testing login functionality...');
  
  // Set test password
  elements.adminPasswordInput.value = 'roseball';
  console.log('Password set to: roseball');
  
  // Check if click event works
  try {
    elements.loginBtn.click();
    console.log('✅ Login button clicked');
    
    // Check if password section is hidden and orders section is shown
    setTimeout(() => {
      const passwordDisplay = elements.passwordSection.style.display;
      const ordersDisplay = elements.ordersSection.style.display;
      
      console.log('Password section display:', passwordDisplay);
      console.log('Orders section display:', ordersDisplay);
      
      if (passwordDisplay === 'none' && ordersDisplay === 'block') {
        console.log('✅ Login successful - UI updated correctly');
      } else {
        console.log('❌ Login failed - UI not updated');
      }
    }, 100);
    
  } catch (error) {
    console.log('❌ Error clicking login button:', error.message);
  }
}

// Wait for DOM to load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(testLogin, 500);
  });
} else {
  setTimeout(testLogin, 500);
}
