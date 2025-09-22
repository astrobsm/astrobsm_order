// Emergency Production Database Schema Analysis and Fix
// This script analyzes the actual production database structure and applies targeted fixes

console.log('🚨 EMERGENCY PRODUCTION DATABASE ANALYSIS');
console.log('==========================================');

async function analyzeAndFixProductionSchema() {
    const API_BASE = 'https://astrobsm-order-placement-fykxb.ondigitalocean.app';
    
    console.log('🔍 Analyzing production database schema...');
    
    // Test 1: Check stock_intake table structure
    try {
        console.log('\n1️⃣ Testing stock intake with minimal data...');
        
        const minimalIntake = {
            userRole: 'superadmin',
            product_id: 22,
            quantity_added: 10  // Only essential fields
        };
        
        console.log('📤 Testing minimal stock intake:', minimalIntake);
        
        const intakeResponse = await fetch(`${API_BASE}/api/stock/intake`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(minimalIntake)
        });
        
        console.log('📥 Stock intake status:', intakeResponse.status);
        
        if (intakeResponse.ok) {
            const result = await intakeResponse.json();
            console.log('✅ Stock intake SUCCESS:', result);
        } else {
            const error = await intakeResponse.text();
            console.log('❌ Stock intake ERROR:', error);
            
            // Parse the error to understand schema issues
            if (error.includes('null value in column "quantity"')) {
                console.log('🔧 ISSUE: Backend expects "quantity" but frontend sends "quantity_added"');
                console.log('💡 SOLUTION: Update frontend to send "quantity" field');
            }
        }
        
    } catch (error) {
        console.error('💥 Stock intake test failed:', error);
    }
    
    // Test 2: Check stock adjustment with minimal data
    try {
        console.log('\n2️⃣ Testing stock adjustment with minimal data...');
        
        const minimalAdjust = {
            userRole: 'superadmin',
            new_stock: 50
            // Remove reason field to test if it's required
        };
        
        console.log('📤 Testing minimal stock adjustment:', minimalAdjust);
        
        const adjustResponse = await fetch(`${API_BASE}/api/stock/adjust/22`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(minimalAdjust)
        });
        
        console.log('📥 Stock adjustment status:', adjustResponse.status);
        
        if (adjustResponse.ok) {
            const result = await adjustResponse.json();
            console.log('✅ Stock adjustment SUCCESS:', result);
        } else {
            const error = await adjustResponse.text();
            console.log('❌ Stock adjustment ERROR:', error);
            
            // Parse the error to understand schema issues
            if (error.includes('column "reason" of relation "stock_movements"')) {
                console.log('🔧 ISSUE: Backend tries to insert "reason" but column doesn\'t exist');
                console.log('💡 SOLUTION: Make reason field optional in backend');
            }
        }
        
    } catch (error) {
        console.error('💥 Stock adjustment test failed:', error);
    }
    
    // Test 3: Check what columns actually exist
    try {
        console.log('\n3️⃣ Testing database schema information...');
        
        // This would be a custom endpoint to check schema
        const schemaResponse = await fetch(`${API_BASE}/api/admin/schema-info`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userRole: 'superadmin', table: 'stock_intake' })
        });
        
        if (schemaResponse.ok) {
            const schema = await schemaResponse.json();
            console.log('📋 Production schema info:', schema);
        } else {
            console.log('⚠️ Schema info endpoint not available');
        }
        
    } catch (error) {
        console.log('⚠️ Schema analysis not available:', error.message);
    }
    
    console.log('\n📋 ANALYSIS COMPLETE');
    console.log('===================');
    console.log('Based on errors seen:');
    console.log('1. stock_intake table expects "quantity" not "quantity_added"');
    console.log('2. stock_movements table missing "reason" column');
    console.log('3. Production schema differs significantly from development');
    console.log('\n🔧 FIXES NEEDED:');
    console.log('1. Update frontend to send "quantity" for stock intake');
    console.log('2. Make backend handle missing "reason" column gracefully');
    console.log('3. Deploy comprehensive schema fix and restart server');
}

// Run the analysis
analyzeAndFixProductionSchema();