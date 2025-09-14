# QUICK FIX FOR PRODUCTION STOCK MANAGEMENT ISSUES

## The Problem
Your DigitalOcean server is showing 500 errors for:
- `/api/stock/levels` 
- `/api/stock/alerts`

This is because the stock management database tables don't exist on production.

## Quick Fix (SSH into your DigitalOcean server and run):

### Option 1: Automated Script
```bash
# Download and run the fix script
cd /var/www/your-app-directory
git pull origin production-deploy-clean
chmod +x fix-production-stock.sh
./fix-production-stock.sh
```

### Option 2: Manual Commands
```bash
# Navigate to your app directory
cd /var/www/your-app-directory

# Pull latest changes
git pull origin production-deploy-clean

# Create stock tables
node server/database/production-stock-setup.js

# Restart application (choose one):
pm2 restart all                          # If using PM2
# OR
sudo systemctl restart your-app-service  # If using systemd
# OR
pkill node && nohup node server/server.js > server.log 2>&1 &  # If running directly
```

### Option 3: One-Liner (if you're in a hurry)
```bash
cd /var/www/your-app-directory && git pull origin production-deploy-clean && node server/database/production-stock-setup.js && pm2 restart all
```

## Verification
After running the fix, test these URLs:
- `https://astrobsm-order-placement-fykxb.ondigitalocean.app/api/stock/levels`
- `https://astrobsm-order-placement-fykxb.ondigitalocean.app/api/stock/alerts?acknowledged=false`

Both should return JSON data instead of 500 errors.

## What This Fix Does
1. ✅ Creates missing database tables:
   - `stock_inventory` (current stock levels)
   - `stock_movements` (audit trail)
   - `stock_intake` (supplier receipts) 
   - `low_stock_alerts` (notification system)

2. ✅ Initializes stock data for all 24+ products

3. ✅ Sets up proper indexes and relationships

4. ✅ Enables real-time stock management and notifications

## Expected Results
- ✅ Admin panel stock management works
- ✅ Real-time stock notifications appear
- ✅ Order processing deducts stock automatically
- ✅ No more 500 errors in browser console

The stock management system will be fully functional after running this fix!