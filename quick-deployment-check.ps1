# Quick Deployment Monitor - Run this every minute until deployment is complete
Write-Host "🔍 Checking ASTRO-BSM deployment..." -ForegroundColor Cyan
Write-Host "Current time: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Gray

# Test 1: Stock Alerts API
try {
    $response = Invoke-WebRequest -Uri "https://astrobsm-order-placement-fykxb.ondigitalocean.app/api/stock/alerts?acknowledged=false" -UseBasicParsing -TimeoutSec 10
    Write-Host "✅ Stock Alerts API: Status $($response.StatusCode) - FIXED!" -ForegroundColor Green
    $stockFixed = $true
} catch {
    Write-Host "⏳ Stock Alerts API: Still returning 500 - Deployment in progress" -ForegroundColor Yellow
    $stockFixed = $false
}

# Test 2: CSP Header Check
try {
    $response = Invoke-WebRequest -Uri "https://astrobsm-order-placement-fykxb.ondigitalocean.app" -UseBasicParsing -TimeoutSec 10
    $cspHeader = $response.Content
    if ($cspHeader -like "*script-src-attr 'unsafe-inline'*") {
        Write-Host "✅ CSP Header: Fixed - 'unsafe-inline' found" -ForegroundColor Green
        $cspFixed = $true
    } else {
        Write-Host "⏳ CSP Header: Still old version - Deployment in progress" -ForegroundColor Yellow
        $cspFixed = $false
    }
} catch {
    Write-Host "⏳ CSP Header: Cannot check - Deployment in progress" -ForegroundColor Yellow
    $cspFixed = $false
}

Write-Host ""
if ($stockFixed -and $cspFixed) {
    Write-Host "🎉 DEPLOYMENT COMPLETE! All fixes are live." -ForegroundColor Green -BackgroundColor Black
    Write-Host "✅ Refresh your browser to see the fixes in action!" -ForegroundColor Green
} else {
    Write-Host "⏳ Deployment still in progress. Run this script again in 1-2 minutes." -ForegroundColor Yellow
}