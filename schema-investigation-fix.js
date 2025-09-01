// Production Database Schema Investigation and Direct Fix
// Run this in browser console to understand and fix the actual schema

(async function investigateAndFixSchema() {
    const password = prompt('Enter admin password (default: admin123):');
    if (!password) {
        console.log('Password required to proceed');
        return;
    }

    try {
        console.log('🔍 Investigating actual database schema...');

        // Step 1: Get detailed schema info
        const schemaResponse = await fetch('/api/admin/schema-info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });

        if (schemaResponse.ok) {
            const schemaInfo = await schemaResponse.json();
            console.log('📋 Full schema details:');
            console.log('Table exists:', schemaInfo.tableExists);
            console.log('Columns:', schemaInfo.columns);
            
            // Analyze the schema
            const columns = schemaInfo.columns || [];
            const columnNames = columns.map(col => col.column_name);
            const requiredColumns = columns.filter(col => col.is_nullable === 'NO').map(col => col.column_name);
            
            console.log('📊 Column analysis:');
            console.log('All columns:', columnNames);
            console.log('Required (NOT NULL) columns:', requiredColumns);
            
            // Check if there's a product_id column that shouldn't be there
            const hasProductId = columnNames.includes('product_id');
            const hasId = columnNames.includes('id');
            
            console.log('🔍 Key column analysis:');
            console.log('Has product_id column:', hasProductId);
            console.log('Has id column:', hasId);
            
            if (hasProductId && hasId) {
                console.log('⚠️ ISSUE FOUND: Both product_id and id columns exist!');
                console.log('This suggests the schema has an extra product_id column causing conflicts.');
                
                // Try to fix the schema by removing the problematic column
                console.log('🔧 Attempting to fix schema by removing extra product_id column...');
                
                try {
                    // First, let's see what data is in the table
                    const dataCheck = await fetch(`/api/admin/raw-query`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            password, 
                            query: 'SELECT * FROM products LIMIT 5' 
                        })
                    });
                    
                    if (dataCheck.ok) {
                        const data = await dataCheck.json();
                        console.log('📋 Current table data:', data);
                    }
                } catch (error) {
                    console.log('Could not check existing data:', error.message);
                }
                
                // Try to drop the problematic column
                const fixQuery = 'ALTER TABLE products DROP COLUMN IF EXISTS product_id';
                const fixResponse = await fetch(`/api/admin/raw-query`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password, query: fixQuery })
                });
                
                if (fixResponse.ok) {
                    console.log('✅ Successfully removed problematic product_id column');
                } else {
                    console.log('❌ Could not remove product_id column:', await fixResponse.text());
                }
            }
        }

        // Step 2: Try a simple direct INSERT to test the actual schema
        console.log('\n🧪 Testing direct database insertion...');
        
        const testProduct = {
            name: 'TEST_PRODUCT_' + Date.now(),
            description: 'Test product for schema validation',
            price: 10.00,
            stock_quantity: 1
        };
        
        // Try various insertion strategies
        const insertStrategies = [
            // Strategy 1: Full data
            {
                name: 'Full Data Insert',
                data: testProduct
            },
            // Strategy 2: Minimal data (just name)
            {
                name: 'Minimal Data Insert',
                data: { name: testProduct.name }
            },
            // Strategy 3: Name and description only
            {
                name: 'Name + Description Insert',
                data: { name: testProduct.name, description: testProduct.description }
            }
        ];
        
        let successfulStrategy = null;
        
        for (const strategy of insertStrategies) {
            console.log(`\n🔬 Testing strategy: ${strategy.name}`);
            console.log('Data:', strategy.data);
            
            try {
                const response = await fetch('/api/admin/products', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        password,
                        ...strategy.data
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log(`✅ SUCCESS with strategy: ${strategy.name}`);
                    console.log('Result:', result);
                    successfulStrategy = strategy;
                    break;
                } else {
                    const error = await response.text();
                    console.log(`❌ FAILED with strategy: ${strategy.name}`);
                    console.log('Error:', error);
                }
            } catch (error) {
                console.log(`❌ ERROR with strategy: ${strategy.name}:`, error);
            }
        }
        
        if (successfulStrategy) {
            console.log(`\n🎯 Found working strategy: ${successfulStrategy.name}`);
            console.log('Now adding all products with this strategy...');
            
            // Add all products using the successful strategy
            const products = [
                { name: 'Wound-Care Honey Gauze Big (CTN)', description: 'Large wound care gauze with honey - carton', price: 150.00 },
                { name: 'Wound-Care Honey Gauze Big (Packets)', description: 'Large wound care gauze with honey - individual packets', price: 25.00 },
                { name: 'Wound-Care Honey Gauze Small (CTN)', description: 'Small wound care gauze with honey - carton', price: 120.00 },
                { name: 'Wound-Care Honey Gauze Small (Packets)', description: 'Small wound care gauze with honey - individual packets', price: 20.00 },
                { name: 'Hera Wound-Gel 100g (CTN)', description: 'Hera wound healing gel 100g - carton', price: 200.00 },
                { name: 'Hera Wound-Gel 100g (Tubes)', description: 'Hera wound healing gel 100g - individual tubes', price: 35.00 },
                { name: 'Hera Wound-Gel 40g (CTN)', description: 'Hera wound healing gel 40g - carton', price: 160.00 },
                { name: 'Hera Wound-Gel 40g (Tubes)', description: 'Hera wound healing gel 40g - individual tubes', price: 28.00 },
                { name: 'Coban Bandage 6inc (PCS)', description: 'Coban self-adherent bandage 6 inch', price: 15.00 },
                { name: 'Coban Bandage 4inc (PCS)', description: 'Coban self-adherent bandage 4 inch', price: 12.00 },
                { name: 'Silicone Scar Sheet (Packet)', description: 'Silicone scar reduction sheet', price: 45.00 },
                { name: 'Opsite (PCS)', description: 'Opsite transparent adhesive film', price: 18.00 },
                { name: 'Wound-Clex Solution 500ml (CTN)', description: 'Wound cleaning solution 500ml - carton', price: 180.00 },
                { name: 'Wound-Clex Solution 500ml (Bottles)', description: 'Wound cleaning solution 500ml - individual bottles', price: 30.00 },
                { name: 'Sterile Dressing Packs (PCS)', description: 'Sterile wound dressing pack', price: 22.00 }
            ];
            
            let successCount = 0;
            
            for (const product of products) {
                // Use only the data fields that worked
                let productData;
                if (successfulStrategy.name === 'Minimal Data Insert') {
                    productData = { name: product.name };
                } else if (successfulStrategy.name === 'Name + Description Insert') {
                    productData = { name: product.name, description: product.description };
                } else {
                    productData = product;
                }
                
                try {
                    const response = await fetch('/api/admin/products', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            password,
                            ...productData
                        })
                    });
                    
                    if (response.ok) {
                        console.log(`✅ Added: ${product.name}`);
                        successCount++;
                    } else {
                        const error = await response.text();
                        console.log(`❌ Failed: ${product.name} - ${error}`);
                    }
                } catch (error) {
                    console.log(`❌ Error: ${product.name} - ${error}`);
                }
            }
            
            console.log(`\n📊 Final results: ${successCount}/15 products added successfully`);
        } else {
            console.log('\n❌ No working strategy found. Manual database intervention required.');
            console.log('🔧 Suggested actions:');
            console.log('1. Check if the database needs to be recreated');
            console.log('2. Run the setup script on the server');
            console.log('3. Check for conflicting columns in the schema');
        }

        // Step 3: Verify final state
        console.log('\n🔍 Final verification...');
        const verifyResponse = await fetch('/api/products');
        if (verifyResponse.ok) {
            const allProducts = await verifyResponse.json();
            console.log(`📦 Total products now in database: ${allProducts.length}`);
            if (allProducts.length > 0) {
                allProducts.forEach(product => {
                    console.log(`  - ${product.name}: $${product.price || 'N/A'}`);
                });
            }
        }
        
        // Refresh the UI
        if (typeof loadProducts === 'function') {
            await loadProducts();
            console.log('✅ UI refreshed');
        }

    } catch (error) {
        console.error('❌ Critical error during investigation:', error);
    }
})();
