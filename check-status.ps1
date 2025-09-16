# Simple Deployment Check
Write-Host "Checking deployment status..." -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "https://astrobsm-order-placement-fykxb.ondigitalocean.app/api/stock/alerts?acknowledged=false" -UseBasicParsing
    Write-Host "SUCCESS: Stock alerts working! Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Deployment is complete - refresh your browser!" -ForegroundColor Green
} catch {
    Write-Host "Still deploying... Status: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "Try again in 2 minutes." -ForegroundColor Yellow
}