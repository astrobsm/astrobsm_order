// 🔍 DATABASE ORDERS CHECK
// Direct database query to check if orders exist

const https = require('https');

const BASE_URL = 'https://astrobsm-order-placement-fykxb.ondigitalocean.app';

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function checkDatabaseOrders() {
  console.log('🔍 CHECKING DATABASE FOR ORDERS...\n');

  try {
    // Test with a real product first to create an order
    console.log('📦 Getting products list...');
    const productsResult = await makeRequest('/api/products');
    
    if (productsResult.status === 200 && Array.isArray(productsResult.data) && productsResult.data.length > 0) {
      const testProduct = productsResult.data[0];
      console.log(`✅ Using real product: ${testProduct.name}`);
      
      // Create order with real product
      console.log('\n🛒 Creating test order with real product...');
      const orderPayload = {
        customerData: { 
          name: 'Database Test Customer', 
          phone: '0800000001', 
          address: 'Database Test Address' 
        },
        orderData: { 
          delivery_route: 'Lagos Island',
          preferred_delivery_method: 'Pick-up',
          request_status: 'pending'
        },
        items: [{ 
          product_name: testProduct.name, 
          quantity: 1 
        }]
      };

      const createResult = await makeRequest('/api/orders', {
        method: 'POST',
        body: orderPayload
      });

      console.log(`📊 Create Order Status: ${createResult.status}`);
      
      if (createResult.status === 200 || createResult.status === 201) {
        console.log('✅ Test order created successfully!');
        console.log('📋 Order details:', JSON.stringify(createResult.data, null, 2));
        
        // Wait a moment and check orders again
        setTimeout(async () => {
          console.log('\n🔄 Checking orders after creation...');
          const ordersCheck = await makeRequest('/api/orders');
          
          if (ordersCheck.status === 200) {
            console.log(`📊 Orders now available: ${Array.isArray(ordersCheck.data) ? ordersCheck.data.length : 'Invalid response'}`);
            
            if (Array.isArray(ordersCheck.data) && ordersCheck.data.length > 0) {
              console.log('🎉 SUCCESS! Orders are now showing up');
              console.log('📋 Latest order:', JSON.stringify(ordersCheck.data[0], null, 2));
            }
          }
        }, 3000);
        
      } else {
        console.log('❌ Order creation failed');
        console.log('📋 Error:', JSON.stringify(createResult.data, null, 2));
      }
    } else {
      console.log('❌ Could not get products for testing');
    }

  } catch (error) {
    console.error('💥 Database check failed:', error.message);
  }
}

checkDatabaseOrders();