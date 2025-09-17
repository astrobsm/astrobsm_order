// Quick Production Authentication Fix
// Run this with: node quick_production_fix.js

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 ASTRO-BSM Quick Production Authentication Fix');
console.log('==============================================\n');

async function runProductionFix() {
    try {
        // Verify we're in the right directory
        if (!fs.existsSync('server/server.js')) {
            console.log('❌ Error: Not in the correct project directory');
            console.log('Please navigate to your ASTRO-BSM project directory first');
            process.exit(1);
        }

        console.log('📍 Current directory:', process.cwd());
        console.log('✅ Project structure verified\n');

        // Stop existing server processes
        console.log('🔄 Stopping existing server processes...');
        try {
            execSync('pkill -f "node.*server"', { stdio: 'pipe' });
        } catch (error) {
            // It's okay if no processes were found
        }
        
        // Wait a moment for processes to stop
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Run the authentication fix
        console.log('🔐 Running authentication fix...');
        console.log('This will regenerate password hashes for production...\n');
        
        // Import and run the fix
        const { fixProductionAuthentication } = require('./production_server_fix.js');
        await fixProductionAuthentication();

        console.log('\n🚀 Authentication fix completed successfully!');
        
        // Start the server
        console.log('🚀 Starting server...');
        const serverProcess = execSync('nohup npm start > server.log 2>&1 & echo $!', { 
            encoding: 'utf8',
            stdio: 'pipe'
        });
        
        const pid = serverProcess.trim();
        console.log(`✅ Server started with PID: ${pid}`);

        // Wait and check if server is still running
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        try {
            execSync(`kill -0 ${pid}`, { stdio: 'pipe' });
            console.log('✅ Server is running successfully!\n');
        } catch (error) {
            console.log('❌ Server may have failed to start');
            console.log('📋 Checking logs...');
            if (fs.existsSync('server.log')) {
                const logs = fs.readFileSync('server.log', 'utf8');
                console.log(logs.split('\n').slice(-10).join('\n'));
            }
            process.exit(1);
        }

        console.log('🎉 Production authentication fix completed!\n');
        console.log('📋 Summary:');
        console.log('  ✅ Password hashes regenerated');
        console.log('  ✅ Server restarted');
        console.log('  ✅ Authentication should now work\n');
        console.log('🧪 Test your authentication at:');
        console.log('  https://astrobsm-order-placement-fykxb.ondigitalocean.app\n');
        console.log('📝 Login credentials:');
        console.log('  Customer: No password required');
        console.log('  Sales Staff: pinkpetals');
        console.log('  Superadmin: natiss2024\n');
        console.log('📊 To monitor server logs: tail -f server.log');

    } catch (error) {
        console.error('💥 Error during production fix:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    runProductionFix();
}