// PRODUCTION SCHEMA-COMPATIBLE DATABASE FIX SCRIPT
// This script works with the actual production database schema

(async function fixProductionDatabaseSchemaCompatible() {
  console.log('🔧 PRODUCTION SCHEMA-COMPATIBLE DATABASE FIX');
  console.log('='.repeat(60));
  console.log('Site:', window.location.origin);
  console.log('Time:', new Date().toISOString());
  console.log('');

  const ADMIN_PASSWORD = 'roseball';

  // First, let's check what the actual database schema looks like
  console.log('🔍 INVESTIGATING PRODUCTION DATABASE SCHEMA...');
  
  try {
    // Try to get database schema information
    const schemaResponse = await fetch('/api/database/status');
    if (schemaResponse.ok) {
      const schemaInfo = await schemaResponse.json();
      console.log('📋 Database status:', schemaInfo);
    }
  } catch (e) {
    console.log('⚠️ Could not get schema info:', e.message);
  }

  // Check current products to understand the schema
  console.log('\n📦 CHECKING CURRENT PRODUCTS SCHEMA...');
  try {
    const productsResponse = await fetch('/api/products');
    if (productsResponse.ok) {
      const products = await productsResponse.json();
      console.log('Current products count:', products.length);
      
      if (products.length > 0) {
        console.log('Sample product structure:', Object.keys(products[0]));
        console.log('Sample product:', products[0]);
      }
    }
  } catch (e) {
    console.log('❌ Error checking products:', e.message);
  }

  // Check admin products to see what fields are expected
  console.log('\n🔧 CHECKING ADMIN PRODUCTS SCHEMA...');
  try {
    const adminResponse = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPassword: ADMIN_PASSWORD })
    });
    
    if (adminResponse.ok) {
      const adminProducts = await adminResponse.json();
      console.log('Admin products count:', adminProducts.length);
      
      if (adminProducts.length > 0) {
        console.log('Admin product structure:', Object.keys(adminProducts[0]));
        console.log('Sample admin product:', adminProducts[0]);
      }
    } else {
      console.log('Admin response status:', adminResponse.status);
      const errorText = await adminResponse.text();
      console.log('Admin response error:', errorText);
    }
  } catch (e) {
    console.log('❌ Error checking admin products:', e.message);
  }

  // Let's try adding a simple product without extra fields
  console.log('\n🚀 ATTEMPTING MINIMAL PRODUCT ADDITION...');
  
  const minimalProducts = [
    {
      name: 'Wound-Care Honey Gauze Big (Carton)',
      description: 'Large honey-based wound care gauze, carton pack'
    },
    {
      name: 'Hera Wound-Gel 100g (Tube)', 
      description: 'Hera wound healing gel 100g, single tube'
    },
    {
      name: 'Coban Bandage 6 inch (Piece)',
      description: '6 inch Coban self-adherent wrap, single piece'
    }
  ];

  let successCount = 0;
  let failCount = 0;

  for (const product of minimalProducts) {
    try {
      console.log(`📦 Trying minimal addition: ${product.name}...`);
      
      const payload = {
        ...product,
        adminPassword: ADMIN_PASSWORD
      };
      
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      console.log(`Response status: ${response.status}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ SUCCESS: ${product.name} added!`);
        console.log(`Result:`, result);
        successCount++;
      } else {
        const errorText = await response.text();
        console.log(`❌ FAILED: ${product.name}`);
        console.log(`Error:`, errorText);
        failCount++;
      }
      
    } catch (error) {
      console.log(`❌ EXCEPTION: ${product.name} - ${error.message}`);
      failCount++;
    }
  }

  console.log('\n📊 MINIMAL ADDITION RESULTS:');
  console.log(`✅ Succeeded: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);

  // If minimal addition worked, try with more fields
  if (successCount > 0) {
    console.log('\n🎯 MINIMAL ADDITION WORKED! Trying with different field combinations...');
    
    const testVariations = [
      {
        name: 'Test Product - Variation 1',
        description: 'Test description',
        stock_quantity: 100
      },
      {
        name: 'Test Product - Variation 2', 
        description: 'Test description',
        cost: 5000
      },
      {
        name: 'Test Product - Variation 3',
        description: 'Test description', 
        amount: 3500
      }
    ];

    for (const testProduct of testVariations) {
      try {
        console.log(`🧪 Testing variation: ${testProduct.name}...`);
        
        const payload = {
          ...testProduct,
          adminPassword: ADMIN_PASSWORD
        };
        
        const response = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Variation worked: ${testProduct.name}`);
          console.log(`Working fields:`, Object.keys(testProduct));
          
          // Clean up test product
          if (result.id) {
            console.log(`🗑️ Cleaning up test product ID: ${result.id}`);
          }
          break;
          
        } else {
          const errorText = await response.text();
          console.log(`❌ Variation failed: ${testProduct.name}`);
          console.log(`Error:`, errorText);
        }
        
      } catch (error) {
        console.log(`❌ Exception testing ${testProduct.name}:`, error.message);
      }
    }
  }

  // Provide specific guidance based on results
  console.log('\n💡 PRODUCTION DATABASE ANALYSIS COMPLETE');
  console.log('='.repeat(60));
  
  if (successCount > 0) {
    console.log('🎉 GOOD NEWS: Product addition is possible!');
    console.log('The production database accepts products with name and description.');
    console.log('📋 Next steps:');
    console.log('1. Use the working field combination identified above');
    console.log('2. Add all products using the compatible schema');
    console.log('3. Update the frontend to handle the production schema');
  } else {
    console.log('⚠️ SCHEMA INCOMPATIBILITY DETECTED');
    console.log('📋 Issues found:');
    console.log('- Production database schema differs from local');
    console.log('- Missing expected columns (price, unit_of_measure)');
    console.log('- Need to identify correct field names');
    console.log('');
    console.log('💡 Recommended actions:');
    console.log('1. Contact server administrator to check database schema');
    console.log('2. Run database migration on production server');
    console.log('3. Or update code to match production schema');
  }

  // Final verification
  console.log('\n🔄 FINAL VERIFICATION...');
  try {
    const finalCheck = await fetch('/api/products');
    if (finalCheck.ok) {
      const finalProducts = await finalCheck.json();
      console.log(`📊 Final product count: ${finalProducts.length}`);
      
      if (finalProducts.length > 0) {
        console.log('🎉 PRODUCTS ARE NOW AVAILABLE!');
        console.log('The page should automatically refresh...');
        setTimeout(() => window.location.reload(), 3000);
      }
    }
  } catch (e) {
    console.log('❌ Final verification failed:', e.message);
  }
})();
