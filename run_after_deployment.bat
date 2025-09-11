@echo off
echo ===========================================
echo ASTRO-BSM Schema Fix - After DO Deployment
echo ===========================================
echo.
echo 1. First verify the schema endpoint is deployed:
echo.
curl -X POST "https://astrobsm-order-placement-fykxb.ondigitalocean.app/api/setup-schema" -H "Content-Type: application/json" -d "{\"setup_key\":\"test\"}" 2>nul
echo.
echo Expected: 401 Unauthorized (NOT 404 Route not found)
echo.
echo 2. If you see 401, run the schema fix:
echo.
node run_schema_fix.js
echo.
echo 3. Then test if it worked:
echo.
node test_order_fixed.js
echo.
echo ===========================================
pause
