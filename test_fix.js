// Test the fix after applying it to production

console.log("🧪 Testing order submission after fix...");

const testOrderData = {
  customerData: {
    name: "Test User After Fix",
    email: "testfix@example.com", 
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
  console.log("✅ Order submission status:", response.status);
  if (response.status === 201 || response.status === 200) {
    console.log("🎉 SUCCESS! Order submission is now working!");
  } else {
    console.log("❌ Still getting error status:", response.status);
  }
  return response.json();
})
.then(data => {
  console.log("📋 Response data:", data);
})
.catch(error => {
  console.error("❌ Request failed:", error);
});
