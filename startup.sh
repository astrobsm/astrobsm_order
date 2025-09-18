#!/bin/bash
# startup.sh - Run this as part of app startup to fix authentication

echo "🚀 ASTRO-BSM App Platform Startup"
echo "================================="

# Install dependencies
npm install --production

# Run authentication fix on startup (only if needed)
echo "🔐 Checking authentication setup..."
if node -e "
const fs = require('fs');
const flagFile = '.auth_fixed';
if (!fs.existsSync(flagFile)) {
    console.log('Running authentication fix...');
    require('./production_server_fix.js').fixProductionAuthentication()
        .then(() => {
            fs.writeFileSync(flagFile, 'Auth fixed on ' + new Date().toISOString());
            console.log('✅ Authentication fix completed');
            process.exit(0);
        })
        .catch(err => {
            console.error('❌ Auth fix failed:', err);
            process.exit(1);
        });
} else {
    console.log('✅ Authentication already fixed');
    process.exit(0);
}
"; then
    echo "✅ Authentication setup complete"
else
    echo "⚠️ Authentication fix may have failed"
fi

# Start the application
echo "🚀 Starting server..."
exec npm start