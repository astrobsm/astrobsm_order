// Browser Console Debug Script
// Run this in your browser's console to check what's happening

console.log("🔍 ASTRO-BSM Order Debugging Script");

// Test 1: Check if we can reach the products API
console.log("📋 Testing products API...");
fetch('/api/products')
  .then(response => {
    console.log("Products API Status:", response.status);
    return response.json();
  })
  .then(data => {
    console.log("Products data:", data);
    
    // Test 2: Check product structure
    if (data && data.length > 0) {
      console.log("🔍 First product structure:");
      console.log(JSON.stringify(data[0], null, 2));
      
      // Check if products have 'price' or 'unit_price'
      const firstProduct = data[0];
      console.log("Has 'price' property:", 'price' in firstProduct);
      console.log("Has 'unit_price' property:", 'unit_price' in firstProduct);
      
      if ('price' in firstProduct) {
        console.log("❌ Products still use 'price' - backend fix may not be deployed");
      } else if ('unit_price' in firstProduct) {
        console.log("✅ Products use 'unit_price' - backend should be fixed");
      }
    }
  })
  .catch(error => {
    console.error("❌ Products API failed:", error);
  });

// Test 3: Try a minimal order submission to see the exact error
console.log("🧪 Testing minimal order submission...");

const testOrderData = {
  customerData: {
    name: "Debug Test",
    email: "debug@test.com", 
    phone: "1234567890",
    address: "Test Address"
  },
  orderData: {
    delivery_date: "2025-09-15",
    delivery_route: "Enugu", 
    preferred_delivery_method: "pickup_enugu",
    request_status: "can_wait_24hrs"
  },
  items: [
    {
      product_name: "Medical Gloves",
      quantity: "1"
    }
  ]
};

fetch('/api/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(testOrderData)
})
.then(response => {
  console.log("Order submission status:", response.status);
  return response.text(); // Use text() instead of json() in case response isn't valid JSON
})
.then(data => {
  console.log("Order submission response:", data);
  try {
    const jsonData = JSON.parse(data);
    console.log("Parsed response:", jsonData);
  } catch (e) {
    console.log("Response is not JSON:", data);
  }
})
.catch(error => {
  console.error("❌ Order submission failed:", error);
});

console.log("🔍 Debug script completed. Check the logs above for details.");
