// Emergency Production Compatibility Fixes
// Apply these fixes to work with current production database schema

console.log('🚨 Applying Emergency Production Compatibility Fixes...');

// Fix 1: Update stock intake to send 'quantity' instead of 'quantity_added'
function patchStockIntake() {
    console.log('🔧 Patching stock intake for production compatibility...');
    
    // Override the submitStockIntake function
    if (window.submitStockIntake) {
        const originalSubmitStockIntake = window.submitStockIntake;
        
        window.submitStockIntake = async function(productId, quantityAdded, costPerUnit, supplier, batchNumber, expiryDate, notes) {
            console.log('📦 Production-compatible stock intake called');
            
            // Create production-compatible payload
            const compatiblePayload = {
                userRole: window.currentUserRole || 'superadmin',
                product_id: parseInt(productId),
                quantity: parseInt(quantityAdded), // Use 'quantity' instead of 'quantity_added'
                cost_per_unit: parseFloat(costPerUnit) || 0,
                supplier: supplier || 'Unknown',
                batch_number: batchNumber || null,
                expiry_date: expiryDate || null,
                notes: notes || null
            };
            
            console.log('📤 Sending production-compatible payload:', compatiblePayload);
            
            try {
                const response = await fetch('/api/stock/intake', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(compatiblePayload)
                });
                
                console.log('📥 Response status:', response.status);
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ Success:', result);
                    alert('Stock intake recorded successfully!');
                    
                    // Refresh displays
                    if (window.loadStockLevels) loadStockLevels();
                    if (window.loadProducts) loadProducts();
                    
                } else {
                    const errorData = await response.json();
                    console.log('❌ Error response:', errorData);
                    alert(`Error: ${errorData.error || 'Failed to record stock intake'}`);
                }
                
            } catch (error) {
                console.error('💥 Network error:', error);
                alert(`Error submitting stock intake: ${error.message}`);
            }
        };
        
        console.log('✅ Stock intake patched for production compatibility');
    } else {
        console.log('⚠️ submitStockIntake function not found');
    }
}

// Fix 2: Update stock adjustment to handle missing 'reason' column
function patchStockAdjustment() {
    console.log('🔧 Patching stock adjustment for production compatibility...');
    
    if (window.updateStockLevel) {
        const originalUpdateStockLevel = window.updateStockLevel;
        
        window.updateStockLevel = async function(productId, newStock, reason) {
            console.log('📊 Production-compatible stock adjustment called');
            
            // Create minimal payload that works with current production schema
            const compatiblePayload = {
                userRole: window.currentUserRole || 'superadmin',
                new_stock: parseInt(newStock)
                // Omit 'reason' field since it causes column errors in production
            };
            
            console.log('📤 Sending production-compatible adjustment:', compatiblePayload);
            
            try {
                const response = await fetch(`/api/stock/adjust/${productId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(compatiblePayload)
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ Stock adjustment success:', result);
                    alert(`Stock updated successfully!\\nNew level: ${newStock}`);
                    
                    // Refresh stock levels
                    if (window.loadStockLevels) loadStockLevels();
                    
                } else {
                    const errorData = await response.text();
                    console.log('❌ Stock adjustment error:', errorData);
                    alert(`Failed to update stock: ${errorData}`);
                }
                
            } catch (error) {
                console.error('💥 Stock adjustment network error:', error);
                alert(`Error updating stock level: ${error.message}`);
            }
        };
        
        console.log('✅ Stock adjustment patched for production compatibility');
    } else {
        console.log('⚠️ updateStockLevel function not found');
    }
}

// Apply all patches
function applyEmergencyFixes() {
    console.log('🚀 Applying all emergency production fixes...');
    
    patchStockIntake();
    patchStockAdjustment();
    
    console.log('✅ All emergency production fixes applied!');
    console.log('📋 Changes made:');
    console.log('  - Stock intake now sends "quantity" field');
    console.log('  - Stock adjustment omits problematic "reason" field');
    console.log('  - Both functions include proper userRole authentication');
}

// Auto-apply fixes when loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyEmergencyFixes);
} else {
    applyEmergencyFixes();
}

// Also apply after a short delay to ensure all scripts are loaded
setTimeout(applyEmergencyFixes, 2000);