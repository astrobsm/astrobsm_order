// Quick Price Update Script
// Run this in browser console to quickly update product prices

(async function quickPriceUpdate() {
    try {
        console.log('💰 Quick Price Update Tool Started...');
        
        // First, get all current products
        const response = await fetch('/api/products');
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }
        
        const products = await response.json();
        console.log(`📦 Found ${products.length} products to potentially update:`);
        
        // Display current products with their prices
        products.forEach((product, index) => {
            console.log(`${index + 1}. ${product.name}: $${product.price || product.unit_price || 'N/A'}`);
        });
        
        console.log('\n💡 To update a specific product price, use:');
        console.log('updateProductPrice(productName, newPrice)');
        console.log('\nExample:');
        console.log('updateProductPrice("Wound-Care Honey Gauze Big (CTN)", 200.00)');
        
        // Global function for easy price updates
        window.updateProductPrice = async function(productName, newPrice) {
            try {
                // Find the product
                const product = products.find(p => p.name === productName);
                if (!product) {
                    console.error(`❌ Product "${productName}" not found`);
                    console.log('Available products:');
                    products.forEach(p => console.log(`  - ${p.name}`));
                    return;
                }
                
                console.log(`🔄 Updating ${productName} from $${product.price} to $${newPrice}...`);
                
                const updateResponse = await fetch(`/api/admin/products/${product.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: product.name,
                        price: newPrice,
                        description: product.description,
                        unit_of_measure: product.unit_of_measure,
                        unit_price: newPrice,
                        stock_quantity: product.stock_quantity,
                        opening_stock_quantity: product.opening_stock_quantity,
                        reorder_point: product.reorder_point,
                        average_production_time: product.average_production_time,
                        status: product.status
                    })
                });
                
                if (updateResponse.ok) {
                    console.log(`✅ Successfully updated ${productName} to $${newPrice}`);
                    
                    // Refresh products if loadProducts function is available
                    if (typeof loadProducts === 'function') {
                        await loadProducts();
                        console.log('🔄 Product dropdown refreshed');
                    }
                    
                    // Refresh admin panel if available
                    if (typeof loadProductsForManagement === 'function') {
                        await loadProductsForManagement();
                        console.log('🔄 Admin panel refreshed');
                    }
                } else {
                    const error = await updateResponse.text();
                    console.error(`❌ Failed to update ${productName}:`, error);
                }
                
            } catch (error) {
                console.error(`❌ Error updating ${productName}:`, error);
            }
        };
        
        // Bulk update function
        window.bulkUpdatePrices = async function(priceUpdates) {
            console.log('🔄 Starting bulk price update...');
            
            for (const update of priceUpdates) {
                await updateProductPrice(update.name, update.price);
                // Small delay to avoid overwhelming the server
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            console.log('✅ Bulk price update completed!');
        };
        
        console.log('\n📋 Available functions:');
        console.log('• updateProductPrice(name, price) - Update single product');
        console.log('• bulkUpdatePrices([{name, price}, ...]) - Update multiple products');
        
        console.log('\n🚀 Quick update examples:');
        console.log('updateProductPrice("Wound-Care Honey Gauze Big (CTN)", 250.00);');
        console.log('updateProductPrice("Hera Wound-Gel 100g (CTN)", 300.00);');
        
        console.log('\n📦 Bulk update example:');
        console.log(`bulkUpdatePrices([
    {name: "Wound-Care Honey Gauze Big (CTN)", price: 250.00},
    {name: "Wound-Care Honey Gauze Big (Packets)", price: 40.00},
    {name: "Hera Wound-Gel 100g (CTN)", price: 300.00}
]);`);
        
    } catch (error) {
        console.error('❌ Error initializing price update tool:', error);
    }
})();
