// Production Stock Fix Verification and Restart Helper
// Run this script on your production server to ensure all stock fixes are applied

console.log('🔧 Production Stock Fix Verification');
console.log('=====================================');

async function verifyAndApplyFixes() {
    try {
        // Check if the comprehensive fix exists
        const fs = require('fs');
        const path = require('path');
        
        const fixPath = path.join(__dirname, 'fix-comprehensive-stock-schema.js');
        if (fs.existsSync(fixPath)) {
            console.log('✅ Comprehensive stock fix found');
            
            // Import and run the fix
            const { fixAllStockSchemaIssues } = require('./fix-comprehensive-stock-schema.js');
            console.log('🔧 Running comprehensive stock schema fix...');
            await fixAllStockSchemaIssues();
            console.log('✅ Stock schema fix completed');
            
        } else {
            console.log('❌ Comprehensive stock fix not found');
            console.log('💡 Please ensure fix-comprehensive-stock-schema.js is deployed');
        }
        
        // Provide restart instructions
        console.log('\n📋 Next Steps:');
        console.log('1. Restart your production server/app');
        console.log('2. The server will automatically run stock schema fixes on startup');
        console.log('3. Test stock adjustment functionality');
        console.log('4. Stock intake and adjustment should work without 500 errors');
        
    } catch (error) {
        console.error('❌ Error during fix verification:', error);
        console.log('\n🔧 Manual Fix Steps:');
        console.log('1. Ensure your production database is accessible');
        console.log('2. Restart your production server');
        console.log('3. Check server logs for stock schema fix messages');
    }
}

// Check if running directly
if (require.main === module) {
    verifyAndApplyFixes();
}

module.exports = { verifyAndApplyFixes };