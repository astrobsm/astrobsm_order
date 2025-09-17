#!/bin/bash
# Production Authentication Fix Script for DigitalOcean
# Run this script on your production server to fix authentication

echo "🔧 ASTRO-BSM Production Authentication Fix"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "server/server.js" ]; then
    echo "❌ Error: Not in the correct project directory"
    echo "Please navigate to your ASTRO-BSM project directory first"
    exit 1
fi

echo "📍 Current directory: $(pwd)"
echo "🔍 Checking project structure..."

# Verify required files exist
if [ ! -f "production_server_fix.js" ]; then
    echo "❌ Error: production_server_fix.js not found"
    echo "Please ensure this file is in your project root directory"
    exit 1
fi

echo "✅ Project structure verified"
echo ""

# Install dependencies if needed
echo "📦 Checking dependencies..."
npm install --production

# Stop existing server process
echo "🔄 Stopping existing server processes..."
pkill -f "node.*server" || true
sleep 2

# Run the authentication fix
echo "🔐 Running authentication fix..."
echo "This will regenerate password hashes for production..."
echo ""

node production_server_fix.js

echo ""
echo "🚀 Starting server..."
nohup npm start > server.log 2>&1 &

sleep 3

# Check if server started successfully
if pgrep -f "node.*server" > /dev/null; then
    echo "✅ Server started successfully!"
    echo "📊 Server PID: $(pgrep -f 'node.*server')"
else
    echo "❌ Server failed to start"
    echo "📋 Checking logs..."
    tail -10 server.log
    exit 1
fi

echo ""
echo "🎉 Production authentication fix completed!"
echo ""
echo "📋 Summary:"
echo "  ✅ Password hashes regenerated"
echo "  ✅ Server restarted"
echo "  ✅ Authentication should now work"
echo ""
echo "🧪 Test your authentication at:"
echo "  https://astrobsm-order-placement-fykxb.ondigitalocean.app"
echo ""
echo "📝 Login credentials:"
echo "  Customer: No password required"
echo "  Sales Staff: pinkpetals"
echo "  Superadmin: natiss2024"
echo ""
echo "📊 To monitor server logs: tail -f server.log"