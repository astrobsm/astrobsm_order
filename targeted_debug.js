// Alternative debugging approach - test specific potential issues
console.log("🔍 TARGETED ISSUE DEBUGGING");
console.log("=========================");

// Test potential issue 1: Customer creation
console.log("📋 Test 1: Try minimal order to isolate the issue...");

// Minimal order test
const minimalOrder = {
  customerData: {
    name: "Test",
    email: "test@test.com",
    phone: "123",
    address: "Test"
  },
  orderData: {
    delivery_date: "2025-09-15",
    delivery_route: "Enugu",
    preferred_delivery_method: "pickup_enugu", 
    request_status: "can_wait_24hrs"
  },
  items: [
    {
      product_name: "Coban Bandage 4 inch (Carton)",
      quantity: "1"
    }
  ]
};

fetch('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(minimalOrder)
})
.then(async response => {
  console.log("📨 Status:", response.status);
  const text = await response.text();
  console.log("📋 Response:", text);
  
  // If still getting 500, try to get more info
  if (response.status === 500) {
    console.log("❌ Still getting 500 error");
    console.log("🔍 Possible issues:");
    console.log("   1. Customer table missing columns");
    console.log("   2. Order table missing columns"); 
    console.log("   3. Database connection issues");
    console.log("   4. Product lookup failing");
    console.log("   5. Transaction rollback issue");
  }
})
.catch(error => {
  console.error("❌ Request failed:", error);
});

// Test potential issue 2: Database schema mismatch
console.log("\n📋 Test 2: Checking customers endpoint...");
fetch('/api/customers')
  .then(response => {
    console.log("📨 Customers API status:", response.status);
    if (response.ok) {
      return response.json();
    }
    throw new Error(`HTTP ${response.status}`);
  })
  .then(customers => {
    console.log("✅ Customers API working, count:", customers.length);
  })
  .catch(error => {
    console.log("❌ Customers API failed:", error.message);
    console.log("💡 This might indicate database schema issues");
  });

// Test potential issue 3: Check if the problem is in the frontend form data
console.log("\n📋 Test 3: Checking if the issue might be form data format...");

// Get actual form data like the frontend would send it
const formData = new FormData();
const form = document.querySelector('#orderForm');
if (form) {
  console.log("📝 Found order form, checking how it sends data...");
  
  // Check what the actual form submission looks like
  const customerName = document.querySelector('input[name="customerName"]');
  const customerEmail = document.querySelector('input[name="customerEmail"]');
  
  if (customerName && customerEmail) {
    console.log("✅ Form fields found");
    console.log("📝 Customer name field exists:", !!customerName);
    console.log("📝 Customer email field exists:", !!customerEmail);
  } else {
    console.log("❌ Form fields missing - this could be the issue!");
  }
} else {
  console.log("❌ Order form not found");
}

console.log("\n=========================");
console.log("🔍 Targeted debugging completed");
