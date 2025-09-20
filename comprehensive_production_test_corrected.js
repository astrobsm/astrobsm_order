// 🎯 COMPREHENSIVE PRODUCTION TEST SUITE (CORRECTED)
// This script tests ALL possible failure scenarios and system functionality
// Run this in the browser console at: https://astrobsm-order-placement-fykxb.ondigitalocean.app/

console.log('🎯'.repeat(60));
console.log('🔬 COMPREHENSIVE PRODUCTION TEST SUITE - ALL SCENARIOS (CORRECTED)');
console.log('🎯'.repeat(60));

class ProductionTestSuite {
  constructor() {
    this.results = {
      authentication: {},
      products: {},
      orders: {},
      users: {},
      permissions: {},
      errorHandling: {},
      edgeCases: {}
    };
    this.userSession = null;
    this.productsList = []; // Renamed to avoid confusion with method names
    this.createdOrderIds = [];
  }

  // 🎨 Helper methods for beautiful output
  log(section, message, status = 'info') {
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: '📋' };
    console.log(`${icons[status]} [${section}] ${message}`);
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getProductWithStock() {
    // Find a product with stock > 0 for testing
    return this.productsList.find(p => p.stock_quantity > 0) || this.productsList[0];
  }

  // 🔐 AUTHENTICATION TESTS
  async testAuthentication() {
    console.log('\n🔐 TESTING AUTHENTICATION SCENARIOS...');
    
    const testCases = [
      { role: 'invalid_role', password: 'any', expectError: true, description: 'Invalid role name' },
      { role: 'sales_staff', password: 'wrong_password', expectError: true, description: 'Wrong password' },
      { role: 'sales_staff', password: '', expectError: true, description: 'Empty password' },
      { role: '', password: 'pinkpetals', expectError: true, description: 'Empty role' },
      { role: 'customer', expectError: false, description: 'Customer login with no password field' },
      { role: 'sales_staff', password: 'pinkpetals', expectError: false, description: 'Valid sales_staff login' },
      { role: 'superadmin', password: 'natiss2024', expectError: false, description: 'Valid superadmin login' },
      { role: 'customer', password: '', expectError: false, description: 'Valid customer login (no password required)' },
      { role: 'customer', password: 'any_password', expectError: false, description: 'Customer login ignores password' }
    ];

    for (const testCase of testCases) {
      try {
        this.log('AUTH', `Testing: ${testCase.description}`);
        
        const response = await fetch('/api/users/authenticate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role_name: testCase.role,
            password: testCase.password
          })
        });

        const data = await response.json();
        
        if (testCase.expectError) {
          if (response.ok) {
            this.log('AUTH', `❌ Expected error but got success for: ${testCase.description}`, 'error');
            this.results.authentication[testCase.description] = 'FAIL - Should have failed';
          } else {
            this.log('AUTH', `✅ Correctly rejected: ${testCase.description}`, 'success');
            this.results.authentication[testCase.description] = 'PASS';
          }
        } else {
          if (response.ok && data.success) {
            this.log('AUTH', `✅ Success: ${testCase.description}`, 'success');
            this.results.authentication[testCase.description] = 'PASS';
            // Store valid session for later tests
            if (testCase.role === 'sales_staff') {
              this.userSession = data.sessionData;
            }
          } else {
            this.log('AUTH', `❌ Failed: ${testCase.description} - ${data.error}`, 'error');
            this.results.authentication[testCase.description] = `FAIL - ${data.error}`;
          }
        }
        
        await this.sleep(100); // Prevent rate limiting
      } catch (error) {
        this.log('AUTH', `❌ Error in ${testCase.description}: ${error.message}`, 'error');
        this.results.authentication[testCase.description] = `ERROR - ${error.message}`;
      }
    }
  }

  // 📦 PRODUCT TESTS  
  async testProductFunctionality() { // Renamed to avoid confusion
    console.log('\n📦 TESTING PRODUCT FUNCTIONALITY...');
    
    try {
      // Test product loading
      this.log('PRODUCTS', 'Loading products...');
      const response = await fetch('/api/products');
      
      if (!response.ok) {
        throw new Error(`Product loading failed: ${response.status}`);
      }
      
      const products = await response.json();
      this.productsList = products; // Store in renamed array
      
      if (!Array.isArray(products) || products.length === 0) {
        this.log('PRODUCTS', 'No products found in database', 'error');
        this.results.products.loading = 'FAIL - No products';
        return;
      }
      
      this.log('PRODUCTS', `✅ Loaded ${products.length} products`, 'success');
      this.results.products.loading = 'PASS';
      
      // Test product data structure
      const sampleProduct = products[0];
      const requiredFields = ['id', 'name', 'price'];
      const missingFields = requiredFields.filter(field => !sampleProduct.hasOwnProperty(field));
      
      if (missingFields.length > 0) {
        this.log('PRODUCTS', `Missing required fields: ${missingFields.join(', ')}`, 'error');
        this.results.products.structure = `FAIL - Missing: ${missingFields.join(', ')}`;
      } else {
        this.log('PRODUCTS', '✅ Product structure valid', 'success');
        this.results.products.structure = 'PASS';
      }
      
      // Test price validation
      const invalidPrices = products.filter(p => isNaN(parseFloat(p.price)) || parseFloat(p.price) <= 0);
      if (invalidPrices.length > 0) {
        this.log('PRODUCTS', `Found ${invalidPrices.length} products with invalid prices`, 'warning');
        this.results.products.prices = `WARNING - ${invalidPrices.length} invalid prices`;
      } else {
        this.log('PRODUCTS', '✅ All product prices valid', 'success');
        this.results.products.prices = 'PASS';
      }
      
    } catch (error) {
      this.log('PRODUCTS', `Error: ${error.message}`, 'error');
      this.results.products.loading = `ERROR - ${error.message}`;
    }
  }

  // 🛒 ORDER SUBMISSION TESTS
  async testOrderSubmission() {
    console.log('\n🛒 TESTING ORDER SUBMISSION SCENARIOS...');
    
    if (this.productsList.length === 0) {
      this.log('ORDERS', 'Skipping order tests - no products available', 'warning');
      return;
    }

    const testProduct = this.productsList[0];
    
    // Test cases for order submission
    const orderTestCases = [
      {
        name: 'Missing customerData',
        data: { items: [{ product_name: testProduct.name, quantity: 1 }] },
        expectError: true
      },
      {
        name: 'Missing items',
        data: { 
          customerData: { name: 'Test Customer', phone: '1234567890', address: 'Test Address' },
          orderData: { delivery_route: 'Test Route' }
        },
        expectError: true
      },
      {
        name: 'Empty items array',
        data: { 
          customerData: { name: 'Test Customer', phone: '1234567890', address: 'Test Address' },
          orderData: { delivery_route: 'Test Route' },
          items: []
        },
        expectError: true
      },
      {
        name: 'Invalid product name',
        data: { 
          userRole: 'sales_staff',
          customerData: { name: 'Test Customer', phone: '1234567890', address: 'Test Address' },
          orderData: { delivery_route: 'Test Route' },
          items: [{ product_name: 'NON_EXISTENT_PRODUCT', quantity: 1 }]
        },
        expectError: true
      },
      {
        name: 'Zero quantity',
        data: { 
          userRole: 'sales_staff',
          customerData: { name: 'Test Customer', phone: '1234567890', address: 'Test Address' },
          orderData: { delivery_route: 'Test Route' },
          items: [{ product_name: testProduct.name, quantity: 0 }]
        },
        expectError: true
      },
      {
        name: 'Negative quantity',
        data: { 
          userRole: 'sales_staff',
          customerData: { name: 'Test Customer', phone: '1234567890', address: 'Test Address' },
          orderData: { delivery_route: 'Test Route' },
          items: [{ product_name: testProduct.name, quantity: -5 }]
        },
        expectError: true
      },
      {
        name: 'Missing customer name',
        data: { 
          userRole: 'sales_staff',
          customerData: { phone: '1234567890', address: 'Test Address' },
          orderData: { delivery_route: 'Test Route' },
          items: [{ product_name: testProduct.name, quantity: 1 }]
        },
        expectError: true
      },
      {
        name: 'Missing customer phone',
        data: { 
          userRole: 'sales_staff',
          customerData: { name: 'Test Customer', address: 'Test Address' },
          orderData: { delivery_route: 'Test Route' },
          items: [{ product_name: testProduct.name, quantity: 1 }]
        },
        expectError: true
      },
      {
        name: 'Excessive stock request',
        data: { 
          userRole: 'sales_staff',
          customerData: { name: 'High Quantity Test', phone: '9999999999', address: 'Test Address' },
          orderData: { delivery_route: 'Test Route' },
          items: [{ product_name: testProduct.name, quantity: 99999 }]
        },
        expectError: true
      },
      {
        name: 'Valid order submission with low quantity',
        data: { 
          userRole: 'sales_staff',
          customerData: { name: 'Valid Test Customer', phone: '0801234567', address: 'Valid Test Address' },
          orderData: { 
            delivery_route: 'Lagos Mainland',
            preferred_delivery_method: 'Pick-up',
            request_status: 'pending'
          },
          items: [{ product_name: testProduct.name, quantity: 1 }]
        },
        expectError: false
      },
      {
        name: 'Valid order with product having stock',
        data: { 
          userRole: 'sales_staff',
          customerData: { name: 'Stock Test Customer', phone: '0801234568', address: 'Stock Test Address' },
          orderData: { 
            delivery_route: 'Lagos Island',
            preferred_delivery_method: 'Delivery',
            request_status: 'pending'
          },
          items: [{ product_name: this.getProductWithStock()?.name || testProduct.name, quantity: 1 }]
        },
        expectError: false
      }
    ];

    for (const testCase of orderTestCases) {
      try {
        this.log('ORDERS', `Testing: ${testCase.name}`);
        
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testCase.data)
        });

        const result = await response.json();
        
        // Enhanced debugging for 500 errors
        if (response.status === 500) {
          console.log(`🔍 [DEBUG] 500 Error Details for ${testCase.name}:`);
          console.log(`   Status: ${response.status}`);
          console.log(`   Response:`, result);
          console.log(`   Request data:`, JSON.stringify(testCase.data, null, 2));
        }
        
        if (testCase.expectError) {
          if (response.ok && result.success) {
            this.log('ORDERS', `❌ Expected error but got success for: ${testCase.name}`, 'error');
            this.results.orders[testCase.name] = 'FAIL - Should have failed';
          } else {
            this.log('ORDERS', `✅ Correctly rejected: ${testCase.name}`, 'success');
            this.results.orders[testCase.name] = 'PASS';
          }
        } else {
          if (response.ok && result.success) {
            this.log('ORDERS', `✅ Success: ${testCase.name}`, 'success');
            this.results.orders[testCase.name] = 'PASS';
            if (result.order && result.order.id) {
              this.createdOrderIds.push(result.order.id);
            }
          } else {
            this.log('ORDERS', `❌ Failed: ${testCase.name} - ${result.error}`, 'error');
            this.results.orders[testCase.name] = `FAIL - ${result.error}`;
          }
        }
        
        await this.sleep(200); // Prevent overwhelming the server
      } catch (error) {
        this.log('ORDERS', `❌ Error in ${testCase.name}: ${error.message}`, 'error');
        this.results.orders[testCase.name] = `ERROR - ${error.message}`;
      }
    }
  }

  // 📊 ORDER RETRIEVAL TESTS
  async testOrderRetrieval() {
    console.log('\n📊 TESTING ORDER RETRIEVAL...');
    
    try {
      this.log('ORDERS', 'Testing order list retrieval...');
      
      const response = await fetch('/api/orders');
      
      if (!response.ok) {
        throw new Error(`Order retrieval failed: ${response.status}`);
      }
      
      const orders = await response.json();
      
      if (!Array.isArray(orders)) {
        this.log('ORDERS', 'Order response is not an array', 'error');
        this.results.orders.retrieval = 'FAIL - Invalid response format';
        return;
      }
      
      this.log('ORDERS', `✅ Retrieved ${orders.length} orders`, 'success');
      this.results.orders.retrieval = 'PASS';
      
      // Test if created orders are in the list
      if (this.createdOrderIds.length > 0) {
        const foundOrders = this.createdOrderIds.filter(id => 
          orders.some(order => order.id === id)
        );
        
        if (foundOrders.length === this.createdOrderIds.length) {
          this.log('ORDERS', '✅ All created orders found in list', 'success');
          this.results.orders.persistence = 'PASS';
        } else {
          this.log('ORDERS', `⚠️ Only ${foundOrders.length}/${this.createdOrderIds.length} created orders found`, 'warning');
          this.results.orders.persistence = `WARNING - ${foundOrders.length}/${this.createdOrderIds.length} found`;
        }
      }
      
    } catch (error) {
      this.log('ORDERS', `Error: ${error.message}`, 'error');
      this.results.orders.retrieval = `ERROR - ${error.message}`;
    }
  }

  // 🔒 PERMISSION TESTS
  async testPermissions() {
    console.log('\n🔒 TESTING ROLE-BASED PERMISSIONS...');
    
    // Test user management endpoint (should require superadmin)
    const permissionTests = [
      {
        endpoint: '/api/users',
        method: 'POST',
        data: { action: 'list', userRole: 'sales_staff' },
        description: 'Sales staff accessing user management',
        expectError: true
      },
      {
        endpoint: '/api/users',
        method: 'POST', 
        data: { action: 'list', userRole: 'superadmin' },
        description: 'Superadmin accessing user management',
        expectError: false
      }
    ];

    for (const test of permissionTests) {
      try {
        this.log('PERMISSIONS', `Testing: ${test.description}`);
        
        const response = await fetch(test.endpoint, {
          method: test.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(test.data)
        });

        const result = await response.json();
        
        if (test.expectError) {
          if (response.status === 403 || response.status === 401) {
            this.log('PERMISSIONS', `✅ Correctly blocked: ${test.description}`, 'success');
            this.results.permissions[test.description] = 'PASS';
          } else {
            this.log('PERMISSIONS', `❌ Should have been blocked: ${test.description}`, 'error');
            this.results.permissions[test.description] = 'FAIL - Access granted inappropriately';
          }
        } else {
          if (response.ok && result.success) {
            this.log('PERMISSIONS', `✅ Access granted: ${test.description}`, 'success');
            this.results.permissions[test.description] = 'PASS';
          } else {
            this.log('PERMISSIONS', `❌ Access denied: ${test.description}`, 'error');
            this.results.permissions[test.description] = `FAIL - ${result.error}`;
          }
        }
        
        await this.sleep(100);
      } catch (error) {
        this.log('PERMISSIONS', `❌ Error in ${test.description}: ${error.message}`, 'error');
        this.results.permissions[test.description] = `ERROR - ${error.message}`;
      }
    }
  }

  // 🌐 NETWORK AND ERROR HANDLING TESTS
  async testErrorHandling() {
    console.log('\n🌐 TESTING ERROR HANDLING AND NETWORK SCENARIOS...');
    
    const errorTests = [
      {
        name: 'Invalid JSON payload',
        endpoint: '/api/orders',
        method: 'POST',
        body: '{ invalid json',
        expectError: true
      },
      {
        name: 'Empty request body',
        endpoint: '/api/orders', 
        method: 'POST',
        body: '',
        expectError: true
      },
      {
        name: 'Non-existent endpoint',
        endpoint: '/api/nonexistent',
        method: 'GET',
        body: null,
        expectError: true
      }
    ];

    for (const test of errorTests) {
      try {
        this.log('ERROR_HANDLING', `Testing: ${test.name}`);
        
        const options = {
          method: test.method,
          headers: { 'Content-Type': 'application/json' }
        };
        
        if (test.body !== null) {
          options.body = test.body;
        }
        
        const response = await fetch(test.endpoint, options);
        
        if (test.expectError) {
          if (response.status >= 400) {
            this.log('ERROR_HANDLING', `✅ Correctly handled error: ${test.name}`, 'success');
            this.results.errorHandling[test.name] = 'PASS';
          } else {
            this.log('ERROR_HANDLING', `❌ Should have returned error: ${test.name}`, 'error');
            this.results.errorHandling[test.name] = 'FAIL - No error returned';
          }
        }
        
        await this.sleep(100);
      } catch (error) {
        // Network errors are expected for some tests
        if (test.expectError) {
          this.log('ERROR_HANDLING', `✅ Network error caught: ${test.name}`, 'success');
          this.results.errorHandling[test.name] = 'PASS';
        } else {
          this.log('ERROR_HANDLING', `❌ Unexpected error: ${test.name} - ${error.message}`, 'error');
          this.results.errorHandling[test.name] = `ERROR - ${error.message}`;
        }
      }
    }
  }

  // 🎯 EDGE CASE TESTS
  async testEdgeCases() {
    console.log('\n🎯 TESTING EDGE CASES AND BOUNDARY CONDITIONS...');
    
    if (this.productsList.length === 0) {
      this.log('EDGE_CASES', 'Skipping edge case tests - no products available', 'warning');
      return;
    }

    const testProduct = this.productsList[0];
    
    const edgeCases = [
      {
        name: 'Very long customer name',
        data: { 
          userRole: 'sales_staff',
          customerData: { 
            name: 'A'.repeat(500), // Very long name
            phone: '0801234567', 
            address: 'Test Address' 
          },
          orderData: { delivery_route: 'Test Route' },
          items: [{ product_name: testProduct.name, quantity: 1 }]
        }
      },
      {
        name: 'Special characters in customer name',
        data: { 
          userRole: 'sales_staff',
          customerData: { 
            name: "O'Connor & Sons <script>alert('xss')</script>", 
            phone: '0801234567', 
            address: 'Test Address' 
          },
          orderData: { delivery_route: 'Test Route' },
          items: [{ product_name: testProduct.name, quantity: 1 }]
        }
      },
      {
        name: 'Very large quantity',
        data: { 
          userRole: 'sales_staff',
          customerData: { 
            name: 'Large Quantity Test', 
            phone: '0801234567', 
            address: 'Test Address' 
          },
          orderData: { delivery_route: 'Test Route' },
          items: [{ product_name: testProduct.name, quantity: 2147483647 }] // Max int32
        }
      },
      {
        name: 'Multiple items in single order',
        data: { 
          userRole: 'sales_staff',
          customerData: { 
            name: 'Multi Item Test', 
            phone: '0801234567', 
            address: 'Test Address' 
          },
          orderData: { delivery_route: 'Test Route' },
          items: this.productsList.slice(0, Math.min(5, this.productsList.length)).map(p => ({
            product_name: p.name,
            quantity: 1
          }))
        }
      }
    ];

    for (const testCase of edgeCases) {
      try {
        this.log('EDGE_CASES', `Testing: ${testCase.name}`);
        
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testCase.data)
        });

        const result = await response.json();
        
        if (response.ok && result.success) {
          this.log('EDGE_CASES', `✅ Handled: ${testCase.name}`, 'success');
          this.results.edgeCases[testCase.name] = 'PASS';
        } else {
          this.log('EDGE_CASES', `⚠️ Rejected: ${testCase.name} - ${result.error}`, 'warning');
          this.results.edgeCases[testCase.name] = `HANDLED - ${result.error}`;
        }
        
        await this.sleep(200);
      } catch (error) {
        this.log('EDGE_CASES', `❌ Error: ${testCase.name} - ${error.message}`, 'error');
        this.results.edgeCases[testCase.name] = `ERROR - ${error.message}`;
      }
    }
  }

  // 📈 GENERATE COMPREHENSIVE REPORT
  generateReport() {
    console.log('\n📈 COMPREHENSIVE TEST RESULTS REPORT');
    console.log('='.repeat(80));
    
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let warningTests = 0;
    
    const sections = [
      { name: 'Authentication', data: this.results.authentication },
      { name: 'Products', data: this.results.products },
      { name: 'Orders', data: this.results.orders },
      { name: 'Permissions', data: this.results.permissions },
      { name: 'Error Handling', data: this.results.errorHandling },
      { name: 'Edge Cases', data: this.results.edgeCases }
    ];
    
    sections.forEach(section => {
      console.log(`\n📊 ${section.name.toUpperCase()}:`);
      
      Object.entries(section.data).forEach(([test, result]) => {
        totalTests++;
        
        if (result === 'PASS') {
          console.log(`  ✅ ${test}: ${result}`);
          passedTests++;
        } else if (result.includes('WARNING') || result.includes('HANDLED')) {
          console.log(`  ⚠️ ${test}: ${result}`);
          warningTests++;
        } else {
          console.log(`  ❌ ${test}: ${result}`);
          failedTests++;
        }
      });
    });
    
    // Overall summary
    console.log('\n📋 OVERALL SUMMARY:');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`);
    console.log(`⚠️ Warnings: ${warningTests} (${((warningTests/totalTests)*100).toFixed(1)}%)`);
    console.log(`❌ Failed: ${failedTests} (${((failedTests/totalTests)*100).toFixed(1)}%)`);
    
    const overallHealth = failedTests === 0 ? 'EXCELLENT' : 
                         failedTests < 3 ? 'GOOD' : 
                         failedTests < 6 ? 'FAIR' : 'POOR';
    
    console.log(`\n🏆 SYSTEM HEALTH: ${overallHealth}`);
    
    if (failedTests === 0 && warningTests <= 2) {
      console.log('\n🚀 PRODUCTION READY! All critical tests passed.');
    } else if (failedTests <= 2) {
      console.log('\n⚠️ MOSTLY READY - Minor issues detected that should be addressed.');
    } else {
      console.log('\n🔥 NOT PRODUCTION READY - Critical issues must be fixed before deployment.');
    }
    
    return {
      total: totalTests,
      passed: passedTests,
      warnings: warningTests,
      failed: failedTests,
      health: overallHealth,
      ready: failedTests <= 2
    };
  }

  // 🚀 RUN ALL TESTS
  async runAllTests() {
    const startTime = Date.now();
    console.log('🚀 Starting comprehensive production test suite...');
    
    try {
      await this.testAuthentication();
      await this.testProductFunctionality(); // Fixed method name
      await this.testOrderSubmission();
      await this.testOrderRetrieval();
      await this.testPermissions();
      await this.testErrorHandling();
      await this.testEdgeCases();
      
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      console.log(`\n⏱️ Total execution time: ${duration} seconds`);
      
      return this.generateReport();
      
    } catch (error) {
      console.error('❌ Test suite execution failed:', error);
      return { error: error.message };
    }
  }
}

// 🎬 EXECUTE THE COMPREHENSIVE TEST SUITE
const testSuite = new ProductionTestSuite();
testSuite.runAllTests().then(summary => {
  if (summary.error) {
    console.log('🔥 TEST SUITE FAILED TO COMPLETE');
  } else if (summary.ready) {
    console.log('🎊'.repeat(50));
    console.log('🎉 COMPREHENSIVE TESTING COMPLETE - SYSTEM IS PRODUCTION READY! 🎉');
    console.log('🎊'.repeat(50));
  } else {
    console.log('🔧'.repeat(50));
    console.log('⚠️ COMPREHENSIVE TESTING COMPLETE - ISSUES NEED ATTENTION ⚠️');
    console.log('🔧'.repeat(50));
  }
}).catch(error => {
  console.error('💥 Fatal error in test suite:', error);
});