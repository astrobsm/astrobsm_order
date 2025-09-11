@echo off
echo =========================================
echo ASTRO-BSM Schema Fix - Step by Step
echo =========================================
echo.
echo Step 1: Verify Digital Ocean deployment is complete
echo   - Go to: https://cloud.digitalocean.com/apps
echo   - Check deployment status
echo.
echo Step 2: Test if schema endpoint is deployed
curl -X POST "https://astrobsm-order-placement-fykxb.ondigitalocean.app/api/setup-schema" -H "Content-Type: application/json" -d "{\"setup_key\":\"test\"}" 2>nul
echo.
echo Step 3: Run the schema fix
echo.
node run_schema_fix.js
echo.
echo Step 4: Test if orders work
echo.
node test_order_fixed.js
echo.
echo =========================================
echo Schema fix process complete!
echo =========================================
pause
