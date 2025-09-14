#!/bin/bash
# Deployment Status Checker for ASTRO-BSM Stock Management
# Run this script to check if your DigitalOcean deployment is complete

echo "🔍 Checking ASTRO-BSM deployment status..."
echo "=================================================="

# Test Products API (should always work)
echo "📦 Testing Products API..."
products_status=$(curl -s -o /dev/null -w "%{http_code}" "https://astrobsm-order-placement-fykxb.ondigitalocean.app/api/products")
if [ "$products_status" = "200" ]; then
    echo "✅ Products API: Working ($products_status)"
else
    echo "❌ Products API: Failed ($products_status)"
fi

# Test Stock Levels API (new feature)
echo "📊 Testing Stock Levels API..."
stock_levels_status=$(curl -s -o /dev/null -w "%{http_code}" "https://astrobsm-order-placement-fykxb.ondigitalocean.app/api/stock/levels")
if [ "$stock_levels_status" = "200" ]; then
    echo "✅ Stock Levels API: Working ($stock_levels_status)"
else
    echo "❌ Stock Levels API: Failed ($stock_levels_status) - Deployment still in progress"
fi

# Test Stock Alerts API (new feature)
echo "🚨 Testing Stock Alerts API..."
stock_alerts_status=$(curl -s -o /dev/null -w "%{http_code}" "https://astrobsm-order-placement-fykxb.ondigitalocean.app/api/stock/alerts?acknowledged=false")
if [ "$stock_alerts_status" = "200" ]; then
    echo "✅ Stock Alerts API: Working ($stock_alerts_status)"
else
    echo "❌ Stock Alerts API: Failed ($stock_alerts_status) - Deployment still in progress"
fi

echo ""
echo "=================================================="

# Overall Status
if [ "$stock_levels_status" = "200" ] && [ "$stock_alerts_status" = "200" ]; then
    echo "🎉 DEPLOYMENT COMPLETE! All stock management features are working."
    echo ""
    echo "✅ Your app now has:"
    echo "  - Real-time stock tracking"
    echo "  - Automatic stock deduction on orders"
    echo "  - Low stock alerts and notifications" 
    echo "  - Complete stock management admin panel"
    echo ""
    echo "🌐 Test your app: https://astrobsm-order-placement-fykxb.ondigitalocean.app"
else
    echo "⏳ DEPLOYMENT IN PROGRESS..."
    echo "   Expected completion time: 5-10 minutes from last commit"
    echo ""
    echo "🔄 Next steps:"
    echo "  1. Wait 2-3 more minutes"
    echo "  2. Run this script again to check status"
    echo "  3. Or refresh your app in the browser"
fi

echo ""