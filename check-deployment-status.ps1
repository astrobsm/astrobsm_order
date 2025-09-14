# PowerShell Deployment Status Checker for ASTRO-BSM Stock Management
# Run this script to check if your DigitalOcean deployment is complete

Write-Host "🔍 Checking ASTRO-BSM deployment status..." -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Gray

# Test Products API (should always work)
Write-Host "📦 Testing Products API..." -ForegroundColor Yellow
try {
    $products = Invoke-RestMethod -Uri "https://astrobsm-order-placement-fykxb.ondigitalocean.app/api/products" -Method GET -TimeoutSec 10
    Write-Host "✅ Products API: Working (Found $($products.Count) products)" -ForegroundColor Green
    $products_working = $true
} catch {
    Write-Host "❌ Products API: Failed - $($_.Exception.Message)" -ForegroundColor Red
    $products_working = $false
}

# Test Stock Levels API (new feature)
Write-Host "📊 Testing Stock Levels API..." -ForegroundColor Yellow
try {
    $stock_levels = Invoke-RestMethod -Uri "https://astrobsm-order-placement-fykxb.ondigitalocean.app/api/stock/levels" -Method GET -TimeoutSec 10
    Write-Host "✅ Stock Levels API: Working (Found $($stock_levels.Count) stock records)" -ForegroundColor Green
    $stock_levels_working = $true
} catch {
    Write-Host "❌ Stock Levels API: Failed - Deployment still in progress" -ForegroundColor Red
    $stock_levels_working = $false
}

# Test Stock Alerts API (new feature)
Write-Host "🚨 Testing Stock Alerts API..." -ForegroundColor Yellow
try {
    $stock_alerts = Invoke-RestMethod -Uri "https://astrobsm-order-placement-fykxb.ondigitalocean.app/api/stock/alerts?acknowledged=false" -Method GET -TimeoutSec 10
    Write-Host "✅ Stock Alerts API: Working (Found $($stock_alerts.Count) alerts)" -ForegroundColor Green
    $stock_alerts_working = $true
} catch {
    Write-Host "❌ Stock Alerts API: Failed - Deployment still in progress" -ForegroundColor Red
    $stock_alerts_working = $false
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Gray

# Overall Status
if ($stock_levels_working -and $stock_alerts_working) {
    Write-Host "🎉 DEPLOYMENT COMPLETE! All stock management features are working." -ForegroundColor Green -BackgroundColor Black
    Write-Host ""
    Write-Host "✅ Your app now has:" -ForegroundColor Green
    Write-Host "  - Real-time stock tracking" -ForegroundColor White
    Write-Host "  - Automatic stock deduction on orders" -ForegroundColor White
    Write-Host "  - Low stock alerts and notifications" -ForegroundColor White
    Write-Host "  - Complete stock management admin panel" -ForegroundColor White
    Write-Host ""
    Write-Host "🌐 Test your app: https://astrobsm-order-placement-fykxb.ondigitalocean.app" -ForegroundColor Cyan
} else {
    Write-Host "⏳ DEPLOYMENT IN PROGRESS..." -ForegroundColor Yellow -BackgroundColor Black
    Write-Host "   Expected completion time: 5-10 minutes from last commit" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🔄 Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Wait 2-3 more minutes" -ForegroundColor White
    Write-Host "  2. Run this script again: ./check-deployment-status.ps1" -ForegroundColor White
    Write-Host "  3. Or refresh your app in the browser" -ForegroundColor White
}

Write-Host ""