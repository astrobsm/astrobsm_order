// Comprehensive debug script to identify the remaining issue
console.log("🔍 COMPREHENSIVE ORDER DEBUG SCRIPT");
console.log("==================================");

// Test 1: Verify the fix is deployed
console.log("📋 Step 1: Testing products API...");
fetch('/api/products')
  .then(response => response.json())
  .then(data => {
    console.log("✅ Products loaded:", data.length, "products");
    if (data.length > 0) {
      console.log("📝 Sample product:", data[0]);
    }
  })
  .catch(error => console.error("❌ Products API failed:", error));

// Test 2: Check if specific product exists
console.log("\n📋 Step 2: Testing specific product lookup...");
fetch('/api/products')
  .then(response => response.json())
  .then(products => {
    const medicalGloves = products.find(p => p.name.toLowerCase().includes('gloves') || p.name.toLowerCase().includes('medical'));
    if (medicalGloves) {
      console.log("✅ Found medical product:", medicalGloves.name);
      console.log("💰 Price:", medicalGloves.price);
      
      // Test 3: Try order with this exact product name
      testOrderWithProduct(medicalGloves.name);
    } else {
      console.log("❌ No medical gloves found. Available products:");
      products.forEach(p => console.log(`  - ${p.name}`));
      
      // Try with first available product
      if (products.length > 0) {
        console.log(`\n🧪 Testing with first available product: ${products[0].name}`);
        testOrderWithProduct(products[0].name);
      }
    }
  })
  .catch(error => console.error("❌ Product lookup failed:", error));

// Function to test order submission
function testOrderWithProduct(productName) {
  console.log(`\n📋 Step 3: Testing order with product: ${productName}`);
  
  const testOrder = {
    customerData: {
      name: "Debug Test User",
      email: "debug@test.com",
      phone: "1234567890",
      address: "123 Test Street, Test City"
    },
    orderData: {
      delivery_date: "2025-09-15",
      delivery_route: "Enugu",
      preferred_delivery_method: "pickup_enugu",
      request_status: "can_wait_24hrs"
    },
    items: [
      {
        product_name: productName,
        quantity: "1"
      }
    ]
  };
  
  console.log("📤 Sending order:", JSON.stringify(testOrder, null, 2));
  
  fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(testOrder)
  })
  .then(response => {
    console.log(`📨 Response Status: ${response.status} ${response.statusText}`);
    return response.text();
  })
  .then(text => {
    console.log("📋 Raw response:", text);
    try {
      const jsonData = JSON.parse(text);
      if (jsonData.error) {
        console.error("❌ Server Error:", jsonData.error);
        if (jsonData.details) {
          console.error("📋 Error Details:", jsonData.details);
        }
      } else {
        console.log("🎉 SUCCESS! Order created:", jsonData);
      }
    } catch (e) {
      console.error("❌ Response is not valid JSON:", text);
    }
  })
  .catch(error => {
    console.error("❌ Network error:", error);
  });
}

// Test 4: Check server health
console.log("\n📋 Step 4: Testing server health...");
fetch('/api/health')
  .then(response => response.json())
  .then(data => {
    console.log("✅ Server health:", data);
  })
  .catch(error => console.error("❌ Health check failed:", error));

console.log("\n🔍 Debug script completed. Check results above.");
console.log("==================================");
