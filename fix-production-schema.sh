#!/bin/bash
# Quick Production Stock Schema Fix
# Run this on your DigitalOcean production server

echo "🔧 ASTRO-BSM Production Stock Schema Fix"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "server/server.js" ]; then
    echo "❌ Error: Please run this script from the ASTRO-BSM project root directory"
    echo "   Current directory: $(pwd)"
    echo "   Expected files: server/server.js"
    exit 1
fi

echo "📁 Working directory: $(pwd)"
echo "🔧 Environment: ${NODE_ENV:-production}"

# Run the schema fix
echo ""
echo "🚀 Running production schema fix..."
node fix-production-stock-schema.js

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Schema fix completed successfully!"
    echo ""
    echo "🔄 Restarting application..."
    
    # Try different ways to restart the app
    if command -v pm2 >/dev/null 2>&1; then
        echo "📦 Restarting with PM2..."
        pm2 restart all
    elif [ -f "package.json" ]; then
        echo "📦 Restarting with npm..."
        npm start &
    else
        echo "🏁 Please manually restart your Node.js application"
    fi
    
    echo ""
    echo "🎉 Stock management should now work correctly!"
    echo "🧪 Test by:"
    echo "   1. Login as superadmin"
    echo "   2. Go to Admin Panel → Stock Management"
    echo "   3. Try adding stock to a product"
    
else
    echo ""
    echo "❌ Schema fix failed. Please check the error messages above."
    echo "📋 Manual steps:"
    echo "   1. Check database connection"
    echo "   2. Verify stock_intake table exists"
    echo "   3. Run: node fix-production-stock-schema.js"
    exit 1
fi