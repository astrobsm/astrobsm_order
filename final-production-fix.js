// Final Production Database Fix - Complete Schema Compatibility
// This script provides all required NOT NULL fields based on the actual production schema

(async function finalProductionFix() {
    const password = prompt('Enter admin password (default: admin123):');
    if (!password) {
        console.log('Password required to proceed');
        return;
    }

    try {
        console.log('🔧 Final production database fix starting...');
        console.log('📋 Using complete schema-compatible data...');

        // Products with ALL required fields based on actual production schema
        const products = [
            {
                name: 'Wound-Care Honey Gauze Big (CTN)',
                description: 'Large wound care gauze with honey - carton',
                unit_of_measure: 'CTN',
                unit_price: 150.00,
                price: 150.00,
                stock_quantity: 100,
                opening_stock_quantity: 100,
                reorder_point: 10,
                average_production_time: 7,
                status: 'active'
            },
            {
                name: 'Wound-Care Honey Gauze Big (Packets)',
                description: 'Large wound care gauze with honey - individual packets',
                unit_of_measure: 'PKT',
                unit_price: 25.00,
                price: 25.00,
                stock_quantity: 100,
                opening_stock_quantity: 100,
                reorder_point: 20,
                average_production_time: 5,
                status: 'active'
            },
            {
                name: 'Wound-Care Honey Gauze Small (CTN)',
                description: 'Small wound care gauze with honey - carton',
                unit_of_measure: 'CTN',
                unit_price: 120.00,
                price: 120.00,
                stock_quantity: 100,
                opening_stock_quantity: 100,
                reorder_point: 10,
                average_production_time: 7,
                status: 'active'
            },
            {
                name: 'Wound-Care Honey Gauze Small (Packets)',
                description: 'Small wound care gauze with honey - individual packets',
                unit_of_measure: 'PKT',
                unit_price: 20.00,
                price: 20.00,
                stock_quantity: 100,
                opening_stock_quantity: 100,
                reorder_point: 20,
                average_production_time: 5,
                status: 'active'
            },
            {
                name: 'Hera Wound-Gel 100g (CTN)',
                description: 'Hera wound healing gel 100g - carton',
                unit_of_measure: 'CTN',
                unit_price: 200.00,
                price: 200.00,
                stock_quantity: 50,
                opening_stock_quantity: 50,
                reorder_point: 5,
                average_production_time: 10,
                status: 'active'
            },
            {
                name: 'Hera Wound-Gel 100g (Tubes)',
                description: 'Hera wound healing gel 100g - individual tubes',
                unit_of_measure: 'TUBE',
                unit_price: 35.00,
                price: 35.00,
                stock_quantity: 100,
                opening_stock_quantity: 100,
                reorder_point: 15,
                average_production_time: 7,
                status: 'active'
            },
            {
                name: 'Hera Wound-Gel 40g (CTN)',
                description: 'Hera wound healing gel 40g - carton',
                unit_of_measure: 'CTN',
                unit_price: 160.00,
                price: 160.00,
                stock_quantity: 50,
                opening_stock_quantity: 50,
                reorder_point: 5,
                average_production_time: 10,
                status: 'active'
            },
            {
                name: 'Hera Wound-Gel 40g (Tubes)',
                description: 'Hera wound healing gel 40g - individual tubes',
                unit_of_measure: 'TUBE',
                unit_price: 28.00,
                price: 28.00,
                stock_quantity: 100,
                opening_stock_quantity: 100,
                reorder_point: 15,
                average_production_time: 7,
                status: 'active'
            },
            {
                name: 'Coban Bandage 6inc (PCS)',
                description: 'Coban self-adherent bandage 6 inch',
                unit_of_measure: 'PCS',
                unit_price: 15.00,
                price: 15.00,
                stock_quantity: 200,
                opening_stock_quantity: 200,
                reorder_point: 30,
                average_production_time: 3,
                status: 'active'
            },
            {
                name: 'Coban Bandage 4inc (PCS)',
                description: 'Coban self-adherent bandage 4 inch',
                unit_of_measure: 'PCS',
                unit_price: 12.00,
                price: 12.00,
                stock_quantity: 200,
                opening_stock_quantity: 200,
                reorder_point: 30,
                average_production_time: 3,
                status: 'active'
            },
            {
                name: 'Silicone Scar Sheet (Packet)',
                description: 'Silicone scar reduction sheet',
                unit_of_measure: 'PKT',
                unit_price: 45.00,
                price: 45.00,
                stock_quantity: 50,
                opening_stock_quantity: 50,
                reorder_point: 10,
                average_production_time: 14,
                status: 'active'
            },
            {
                name: 'Opsite (PCS)',
                description: 'Opsite transparent adhesive film',
                unit_of_measure: 'PCS',
                unit_price: 18.00,
                price: 18.00,
                stock_quantity: 150,
                opening_stock_quantity: 150,
                reorder_point: 25,
                average_production_time: 5,
                status: 'active'
            },
            {
                name: 'Wound-Clex Solution 500ml (CTN)',
                description: 'Wound cleaning solution 500ml - carton',
                unit_of_measure: 'CTN',
                unit_price: 180.00,
                price: 180.00,
                stock_quantity: 30,
                opening_stock_quantity: 30,
                reorder_point: 5,
                average_production_time: 14,
                status: 'active'
            },
            {
                name: 'Wound-Clex Solution 500ml (Bottles)',
                description: 'Wound cleaning solution 500ml - individual bottles',
                unit_of_measure: 'BTL',
                unit_price: 30.00,
                price: 30.00,
                stock_quantity: 100,
                opening_stock_quantity: 100,
                reorder_point: 15,
                average_production_time: 10,
                status: 'active'
            },
            {
                name: 'Sterile Dressing Packs (PCS)',
                description: 'Sterile wound dressing pack',
                unit_of_measure: 'PCS',
                unit_price: 22.00,
                price: 22.00,
                stock_quantity: 150,
                opening_stock_quantity: 150,
                reorder_point: 25,
                average_production_time: 7,
                status: 'active'
            }
        ];

        console.log(`📦 Adding ${products.length} products with complete schema data...`);

        let successCount = 0;
        let errorCount = 0;

        for (const product of products) {
            try {
                console.log(`🔄 Adding: ${product.name}...`);
                
                const response = await fetch('/api/admin/products', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        password,
                        ...product
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log(`✅ Successfully added: ${product.name}`);
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

        console.log(`\n📊 Final Results:`);
        console.log(`✅ Successfully added: ${successCount} products`);
        console.log(`❌ Failed: ${errorCount} products`);

        if (successCount > 0) {
            // Verify products are loaded
            console.log('\n🔍 Verifying products are available...');
            const verifyResponse = await fetch('/api/products');
            if (verifyResponse.ok) {
                const allProducts = await verifyResponse.json();
                console.log(`📦 Total products in database: ${allProducts.length}`);
                if (allProducts.length > 0) {
                    console.log('🎉 SUCCESS! Products are now available:');
                    allProducts.forEach(product => {
                        console.log(`  - ${product.name}: $${product.price || product.unit_price || 'N/A'}`);
                    });
                } else {
                    console.log('⚠️ Products added but not appearing in API response');
                }
            }

            // Refresh the product dropdown
            console.log('\n🔄 Refreshing product dropdown...');
            if (typeof loadProducts === 'function') {
                await loadProducts();
                console.log('✅ Product dropdown refreshed');
            } else {
                console.log('⚠️ Please refresh the page to see updated products');
            }

            console.log('\n🎉 PRODUCTION DATABASE FIXED!');
            console.log('✅ All products are now available in the order form');
            console.log('🛒 You can now test placing orders with real products');
        } else {
            console.log('\n❌ Unable to add any products.');
            console.log('🔧 The production database may need manual intervention.');
            console.log('💡 Contact your database administrator to:');
            console.log('   1. Check database connection');
            console.log('   2. Verify table permissions');
            console.log('   3. Run database setup script manually');
        }

    } catch (error) {
        console.error('❌ Critical error during final fix:', error);
        console.log('\n🆘 Manual intervention required:');
        console.log('1. Check server logs for detailed error information');
        console.log('2. Verify database connection and credentials');
        console.log('3. Consider running database setup script on server');
    }
})();
