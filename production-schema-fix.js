// Production Schema Fix and Product Addition Script
// Run this in browser console to fix schema and add products

async function fixProductionSchema() {
    const password = prompt('Enter admin password:');
    if (!password) {
        console.log('Password required to proceed');
        return;
    }

    try {
        console.log('🔧 Starting production schema fix...');

        // Step 1: Check current schema
        console.log('\n📋 Checking current products table schema...');
        const schemaResponse = await fetch('/api/admin/schema-info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });

        if (!schemaResponse.ok) {
            console.error('Failed to get schema info:', await schemaResponse.text());
            return;
        }

        const schemaInfo = await schemaResponse.json();
        console.log('Current schema:', schemaInfo);

        // Step 2: Fix schema if needed
        console.log('\n🔨 Attempting to fix products table schema...');
        const fixResponse = await fetch('/api/admin/fix-schema', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });

        if (!fixResponse.ok) {
            console.error('Failed to fix schema:', await fixResponse.text());
            return;
        }

        console.log('✅ Schema fix completed');

        // Step 3: Add default products
        console.log('\n📦 Adding default products...');
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
        let errorCount = 0;

        for (const product of products) {
            try {
                const response = await fetch('/api/admin/products', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        password,
                        ...product,
                        stock_quantity: 100
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log(`✅ Added: ${product.name}`);
                    successCount++;
                } else {
                    const error = await response.text();
                    console.error(`❌ Failed to add ${product.name}:`, error);
                    errorCount++;
                }
            } catch (error) {
                console.error(`❌ Error adding ${product.name}:`, error);
                errorCount++;
            }
        }

        console.log(`\n📊 Product addition summary:`);
        console.log(`✅ Successfully added: ${successCount} products`);
        console.log(`❌ Failed: ${errorCount} products`);

        // Step 4: Verify products are loaded
        console.log('\n🔍 Verifying products are available...');
        const verifyResponse = await fetch('/api/products');
        if (verifyResponse.ok) {
            const allProducts = await verifyResponse.json();
            console.log(`📦 Total products in database: ${allProducts.length}`);
            allProducts.forEach(product => {
                console.log(`  - ${product.name}: $${product.price || 'N/A'}`);
            });
        } else {
            console.error('Failed to verify products:', await verifyResponse.text());
        }

        // Step 5: Test dropdown refresh
        console.log('\n🔄 Refreshing product dropdown...');
        if (typeof loadProducts === 'function') {
            await loadProducts();
            console.log('✅ Product dropdown refreshed');
        } else {
            console.log('⚠️ loadProducts function not available - refresh page to see products');
        }

        console.log('\n🎉 Production schema fix and product addition completed!');
        console.log('📋 You can now test the order form with the available products.');

    } catch (error) {
        console.error('❌ Critical error during schema fix:', error);
    }
}

// Auto-run the fix
fixProductionSchema();
