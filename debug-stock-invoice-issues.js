// Debug Script for Stock Addition and Invoice Email Issues
console.log('🔍 Debugging Stock Addition and Invoice Email Issues');

// Test 1: Check superadmin authentication for stock access
async function testStockAddition() {
  console.log('\n📦 Testing Stock Addition Authentication...');
  
  // Get auth data
  const authData = localStorage.getItem('astro_auth');
  if (!authData) {
    console.log('❌ No authentication data found');
    return false;
  }
  
  const auth = JSON.parse(authData);
  console.log('🔑 Current user role:', auth.role);
  console.log('🔑 User display name:', auth.displayName);
  
  // Check if user has stock management permissions
  const stockPermissions = ['manage_stock'];
  console.log('📋 Required permissions for stock:', stockPermissions);
  
  // Test stock intake API
  const testStockData = {
    product_id: 1, // Test with first product
    quantity_added: 10,
    cost_per_unit: 25.00,
    supplier: 'Test Supplier',
    batch_number: 'TEST123',
    notes: 'Test stock addition',
    userRole: auth.role
  };
  
  try {
    console.log('📤 Sending test stock intake request...');
    console.log('🔗 API URL:', `${window.location.origin}/api/stock/intake`);
    console.log('📦 Request data:', testStockData);
    
    const response = await fetch(`${window.location.origin}/api/stock/intake`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testStockData)
    });
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', [...response.headers.entries()]);
    
    const result = await response.text();
    console.log('📥 Raw response:', result);
    
    if (response.ok) {
      const data = JSON.parse(result);
      console.log('✅ Stock addition successful:', data);
      return true;
    } else {
      console.log('❌ Stock addition failed:', result);
      
      // Try to parse error
      try {
        const errorData = JSON.parse(result);
        console.log('🔍 Error details:', errorData);
        
        if (errorData.error?.includes('Access denied')) {
          console.log('🚫 Issue: Permission denied - checking role permissions...');
          await checkRolePermissions(auth.role);
        }
      } catch (e) {
        console.log('📝 Raw error:', result);
      }
      return false;
    }
  } catch (error) {
    console.log('❌ Network/API error:', error);
    return false;
  }
}

// Test role permissions
async function checkRolePermissions(role) {
  console.log(`\n🔐 Checking permissions for role: ${role}`);
  
  try {
    // Check if we can access user roles
    const response = await fetch(`${window.location.origin}/api/users/roles`);
    if (response.ok) {
      const roles = await response.json();
      console.log('👥 Available roles:', roles);
      
      const currentRole = roles.find(r => r.role_name === role);
      if (currentRole) {
        console.log('📋 Current role permissions:', currentRole.permissions);
        console.log('🔍 Has manage_stock?', currentRole.permissions.includes('manage_stock'));
      } else {
        console.log('❌ Role not found in database');
      }
    }
  } catch (error) {
    console.log('❌ Failed to check role permissions:', error);
  }
}

// Test 2: Check email display in invoice generation
async function testInvoiceEmailDisplay() {
  console.log('\n📧 Testing Invoice Email Display...');
  
  // Get a recent order to test
  try {
    const ordersResponse = await fetch(`${window.location.origin}/api/orders`);
    if (!ordersResponse.ok) {
      console.log('❌ Failed to fetch orders');
      return false;
    }
    
    const orders = await ordersResponse.json();
    console.log('📋 Found orders:', orders.length);
    
    if (orders.length === 0) {
      console.log('⚠️ No orders found to test');
      return false;
    }
    
    // Test with first order
    const testOrder = orders[0];
    console.log('🧾 Testing with order:', testOrder.id);
    console.log('📞 Customer phone:', testOrder.phone);
    console.log('📧 Customer email:', testOrder.email);
    console.log('👤 Customer name:', testOrder.customer_name);
    
    // Check if order has customer data
    if (!testOrder.customer_name) {
      console.log('⚠️ Order missing customer name');
    }
    
    if (!testOrder.email) {
      console.log('⚠️ Order missing email - checking individual order fetch...');
      
      // Test individual order fetch
      const individualResponse = await fetch(`${window.location.origin}/api/orders/${testOrder.id}`);
      if (individualResponse.ok) {
        const detailedOrder = await individualResponse.json();
        console.log('🔍 Detailed order data:', detailedOrder);
        console.log('📧 Email in detailed order:', detailedOrder.email);
      } else {
        console.log('❌ Failed to fetch individual order');
      }
    } else {
      console.log('✅ Order has email:', testOrder.email);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Error testing invoice email:', error);
    return false;
  }
}

// Test 3: Check current form email capture
function testEmailCapture() {
  console.log('\n📝 Testing Email Capture in Form...');
  
  const emailField = document.getElementById('customerEmail');
  if (emailField) {
    console.log('✅ Email field found');
    console.log('📧 Current value:', emailField.value);
    console.log('🏷️ Field attributes:', {
      name: emailField.name,
      type: emailField.type,
      required: emailField.required,
      placeholder: emailField.placeholder
    });
    
    // Test if field is visible and interactive
    const style = window.getComputedStyle(emailField);
    console.log('👁️ Field visibility:', {
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity
    });
    
    return true;
  } else {
    console.log('❌ Email field not found');
    return false;
  }
}

// Run comprehensive test
async function runComprehensiveTest() {
  console.log('🚀 Starting Comprehensive Debug Test...\n');
  
  const results = {
    emailCapture: testEmailCapture(),
    stockAddition: await testStockAddition(),
    invoiceEmail: await testInvoiceEmailDisplay()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('✅ Email Capture Working:', results.emailCapture);
  console.log('✅ Stock Addition Working:', results.stockAddition);
  console.log('✅ Invoice Email Working:', results.invoiceEmail);
  
  if (!results.stockAddition) {
    console.log('\n🔧 Stock Addition Issues:');
    console.log('1. Check if superadmin role has "manage_stock" permission');
    console.log('2. Verify API endpoint is working');
    console.log('3. Check authentication middleware');
  }
  
  if (!results.invoiceEmail) {
    console.log('\n📧 Invoice Email Issues:');
    console.log('1. Check if orders are storing customer emails');
    console.log('2. Verify invoice generation includes email field');
    console.log('3. Check backend JOIN queries for customer data');
  }
  
  return results;
}

// Auto-run on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runComprehensiveTest);
} else {
  runComprehensiveTest();
}