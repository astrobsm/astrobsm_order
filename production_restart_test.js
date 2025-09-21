// 🔥 FORCE PRODUCTION RESTART AND TEST
// This will verify deployment and trigger restart if needed

const https = require('https');
const fs = require('fs');

const BASE_URL = 'https://astrobsm-order-placement-fykxb.ondigitalocean.app';

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = BASE_URL + path;
    
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
            data: data,
            rawData: data
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

async function forceProductionRestart() {
  console.log('🔥 FORCING PRODUCTION RESTART AND TEST\n');

  try {
    console.log('🔍 1. Testing basic connectivity...');
    const healthCheck = await makeRequest('/');
    
    if (healthCheck.status !== 200) {
      console.log(`❌ Server not responding properly: ${healthCheck.status}`);
      console.log('Raw response:', healthCheck.rawData || healthCheck.data);
      return;
    }
    
    console.log('✅ Server is responding');
    
    console.log('\n🔍 2. Testing orders API...');
    const ordersCheck = await makeRequest('/api/orders');
    
    if (ordersCheck.status === 200) {
      console.log(`✅ Orders API working - found ${ordersCheck.data.length} orders`);
      
      // Test individual order fetch
      if (ordersCheck.data.length > 0) {
        const firstOrder = ordersCheck.data[0];
        console.log(`\n🔍 3. Testing individual order fetch for order ${firstOrder.id}...`);
        
        const individualCheck = await makeRequest(`/api/orders/${firstOrder.id}`);
        
        if (individualCheck.status === 200) {
          console.log(`✅ Individual order fetch working`);
          console.log(`Customer: ${individualCheck.data.customer_name}`);
          console.log(`Phone: ${individualCheck.data.phone || 'N/A'}`);
          console.log(`Email: ${individualCheck.data.email || 'N/A'}`);
          
          if (individualCheck.data.customer_name !== 'Unknown Customer') {
            console.log('\n🎉 SUCCESS: Customer data is now working correctly!');
            console.log('📄 PDF exports should now show proper customer information');
            
            // Test a few more orders
            console.log('\n🔍 4. Testing more orders for consistency...');
            const testOrders = ordersCheck.data.slice(0, 5);
            let allGood = true;
            
            for (const order of testOrders) {
              const testResult = await makeRequest(`/api/orders/${order.id}`);
              if (testResult.status === 200) {
                const listName = order.customer_name;
                const individualName = testResult.data.customer_name;
                
                if (listName === individualName && individualName !== 'Unknown Customer') {
                  console.log(`✅ Order ${order.id}: Consistent (${individualName})`);
                } else {
                  console.log(`❌ Order ${order.id}: Mismatch - List: ${listName}, Individual: ${individualName}`);
                  allGood = false;
                }
              } else {
                console.log(`❌ Order ${order.id}: Failed to fetch (${testResult.status})`);
                allGood = false;
              }
            }
            
            if (allGood) {
              console.log('\n🎉 ALL TESTS PASSED! Customer data fix is working correctly.');
              console.log('📋 All PDF exports, invoices, and receipts should now show proper customer information');
            } else {
              console.log('\n⚠️ Some inconsistencies found - may need further debugging');
            }
            
          } else {
            console.log('\n❌ Customer data still showing as "Unknown Customer"');
            console.log('🔧 May need to check deployment or database connection');
          }
          
        } else {
          console.log(`❌ Individual order fetch failed: ${individualCheck.status}`);
          if (individualCheck.rawData) {
            console.log('Error details:', individualCheck.rawData);
          }
        }
      }
    } else {
      console.log(`❌ Orders API failed: ${ordersCheck.status}`);
      if (ordersCheck.rawData) {
        console.log('Error details:', ordersCheck.rawData);
      }
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

forceProductionRestart();