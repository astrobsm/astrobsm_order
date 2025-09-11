// Automated debugging test script
// This will automatically test order submission and provide detailed feedback

console.log("🚀 AUTOMATED ORDER DEBUGGING SCRIPT");
console.log("=====================================");
console.log("This script will automatically test order submission with detailed logging");

// Function to run comprehensive order test
async function runOrderDebuggingTest() {
  try {
    // Step 1: Get available products
    console.log("📋 Step 1: Fetching available products...");
    const productsResponse = await fetch('/api/products');
    const products = await productsResponse.json();
    
    if (!products || products.length === 0) {
      console.error("❌ No products available for testing");
      return;
    }
    
    console.log(`✅ Found ${products.length} products`);
    const testProduct = products[0];
    console.log(`🧪 Testing with product: ${testProduct.name} (Price: ₦${testProduct.price})`);
    
    // Step 2: Test order submission
    console.log("\n📋 Step 2: Testing order submission...");
    
    const testOrderData = {
      customerData: {
        name: "Automated Test User",
        email: `test${Date.now()}@example.com`,
        phone: "08012345678",
        address: "123 Test Street, Enugu, Nigeria"
      },
      orderData: {
        delivery_date: "2025-09-15",
        delivery_route: "Enugu",
        preferred_delivery_method: "pickup_enugu",
        request_status: "can_wait_24hrs"
      },
      items: [
        {
          product_name: testProduct.name,
          quantity: "1"
        }
      ]
    };
    
    console.log("📤 Submitting order:", JSON.stringify(testOrderData, null, 2));
    
    const orderResponse = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testOrderData)
    });
    
    const responseText = await orderResponse.text();
    console.log(`📨 Response Status: ${orderResponse.status} ${orderResponse.statusText}`);
    console.log("📋 Response Body:", responseText);
    
    // Step 3: Analyze results
    if (orderResponse.status === 200 || orderResponse.status === 201) {
      console.log("🎉 SUCCESS! Order submission is working!");
      
      try {
        const orderData = JSON.parse(responseText);
        console.log("📋 Order Details:");
        console.log(`   - Order ID: ${orderData.order?.id}`);
        console.log(`   - Customer ID: ${orderData.customer?.id}`);
        console.log(`   - Total Amount: ₦${orderData.order?.total_amount}`);
        
        // Test admin panel
        console.log("\n📋 Step 3: Testing admin panel access...");
        const ordersResponse = await fetch('/api/orders');
        const allOrders = await ordersResponse.json();
        console.log(`✅ Admin panel working: ${allOrders.length} orders found`);
        
      } catch (e) {
        console.log("⚠️ Order created but response parsing failed:", e.message);
      }
      
    } else {
      console.error("❌ ORDER SUBMISSION FAILED");
      
      try {
        const errorData = JSON.parse(responseText);
        console.error("📋 Error Details:");
        console.error(`   - Error: ${errorData.error}`);
        console.error(`   - Details: ${errorData.details}`);
        console.error(`   - Timestamp: ${errorData.timestamp}`);
        
        // Provide specific troubleshooting based on error
        if (errorData.details) {
          console.log("\n🔧 TROUBLESHOOTING SUGGESTIONS:");
          
          if (errorData.details.includes("Product not found")) {
            console.log("   - Issue: Product name mismatch");
            console.log("   - Solution: Check exact product names in database");
          } else if (errorData.details.includes("customer")) {
            console.log("   - Issue: Customer creation/lookup problem");
            console.log("   - Solution: Check customers table schema");
          } else if (errorData.details.includes("INSERT") || errorData.details.includes("column")) {
            console.log("   - Issue: Database schema mismatch");
            console.log("   - Solution: Check table column names and constraints");
          } else if (errorData.details.includes("price") || errorData.details.includes("quantity")) {
            console.log("   - Issue: Data validation problem");
            console.log("   - Solution: Check product price format and quantity parsing");
          }
        }
        
      } catch (e) {
        console.error("❌ Error response is not JSON:", responseText);
      }
    }
    
  } catch (error) {
    console.error("❌ Test script failed:", error);
  }
}

// Step 4: Test product management button
console.log("\n📋 Step 4: Testing product management access...");
const manageBtn = document.getElementById('manageProductsBtn');
if (manageBtn) {
  console.log("✅ Product Management button found");
  console.log("💡 Test: Click 'Manage Products' and use password 'bluevelvet'");
} else {
  console.log("❌ Product Management button not found");
}

// Step 5: Test admin panel
console.log("\n📋 Step 5: Testing admin panel access...");
const adminBtn = document.getElementById('adminBtn');
if (adminBtn) {
  console.log("✅ Admin Panel button found");
  console.log("💡 Test: Click 'Admin Panel' and use password 'bluevelvet'");
} else {
  console.log("❌ Admin Panel button not found");
}

// Run the automated test
console.log("\n🚀 Starting automated order test...");
runOrderDebuggingTest();

console.log("\n=====================================");
console.log("🔍 Automated debugging script completed");
console.log("Check the logs above for detailed results");
