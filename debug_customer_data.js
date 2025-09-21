// 🔍 DEBUG CUSTOMER DATA FOR ORDER 63
// Check what customer data exists for order 63 in the database

const https = require('https');

const BASE_URL = 'https://astrobsm-order-placement-fykxb.ondigitalocean.app';

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = BASE_URL + path;
    console.log(`🔗 Making request to: ${path}`);
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(url, requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed
          });
        } catch (parseError) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function debugCustomerData() {
  console.log('🔍 DEBUGGING CUSTOMER DATA FOR ORDER 63\n');

  try {
    // First check order 63 specifically
    console.log('📋 Fetching order 63 details...');
    const orderResult = await makeRequest('/api/orders/63');
    
    console.log(`📊 Order 63 Status: ${orderResult.status}`);
    
    if (orderResult.status === 200) {
      const orderData = orderResult.data;
      console.log('\n📋 ORDER 63 DATA:');
      console.log(`Order ID: ${orderData.id}`);
      console.log(`Customer ID: ${orderData.customer_id || 'N/A'}`);
      console.log(`Customer Name: ${orderData.customer_name || 'N/A'}`);
      console.log(`Phone: ${orderData.phone || 'N/A'}`);
      console.log(`Email: ${orderData.email || 'N/A'}`);
      console.log(`Address: ${orderData.address || 'N/A'}`);
      console.log(`Delivery Address: ${orderData.delivery_address || 'N/A'}`);
      console.log(`Created At: ${orderData.created_at || 'N/A'}`);
      console.log(`Items Count: ${orderData.items ? orderData.items.length : 0}`);
      
      if (orderData.items && orderData.items.length > 0) {
        console.log('\n📦 ITEMS:');
        orderData.items.forEach((item, index) => {
          console.log(`${index + 1}. ${item.product_name} x${item.quantity}`);
        });
      }
      
      // Analyze the issue
      console.log('\n🔍 ANALYSIS:');
      if (!orderData.customer_name || orderData.customer_name === 'Unknown Customer') {
        console.log('❌ ISSUE: Customer name is missing or set to "Unknown Customer"');
        
        if (orderData.customer_id) {
          console.log(`📋 Customer ID exists (${orderData.customer_id}), but customer data not joined properly`);
        } else {
          console.log('❌ Customer ID is missing - order may not be linked to a customer');
        }
      } else {
        console.log('✅ Customer name is available');
      }
      
    } else {
      console.log('❌ Failed to fetch order 63');
      console.log('Response:', JSON.stringify(orderResult.data, null, 2));
    }
    
    // Also check a few other recent orders to see if this is a pattern
    console.log('\n📋 Checking other recent orders for comparison...');
    const ordersResult = await makeRequest('/api/orders');
    
    if (ordersResult.status === 200 && Array.isArray(ordersResult.data)) {
      const recentOrders = ordersResult.data.slice(0, 5);
      console.log(`\n📊 RECENT ORDERS ANALYSIS (${recentOrders.length} orders):`);
      
      recentOrders.forEach(order => {
        const hasCustomerData = order.customer_name && order.customer_name !== 'Unknown Customer';
        console.log(`Order ${order.id}: ${hasCustomerData ? '✅' : '❌'} Customer: ${order.customer_name || 'N/A'} | Phone: ${order.phone || 'N/A'}`);
      });
      
      const ordersWithCustomerData = recentOrders.filter(order => 
        order.customer_name && order.customer_name !== 'Unknown Customer'
      );
      
      console.log(`\n📊 SUMMARY: ${ordersWithCustomerData.length}/${recentOrders.length} orders have proper customer data`);
      
      if (ordersWithCustomerData.length === 0) {
        console.log('🚨 MAJOR ISSUE: No orders have customer data - database JOIN problem');
      } else if (ordersWithCustomerData.length < recentOrders.length) {
        console.log('⚠️ PARTIAL ISSUE: Some orders missing customer data - inconsistent database state');
      } else {
        console.log('✅ Customer data looks good across orders');
      }
    }

  } catch (error) {
    console.error('💥 Debug failed:', error.message);
  }
}

debugCustomerData();