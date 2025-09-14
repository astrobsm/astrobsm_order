# 🚨 URGENT: Stock Management 500 Errors - Production Fix

## Current Issue
Your production server at `https://astrobsm-order-placement-fykxb.ondigitalocean.app` is showing:

```
GET /api/stock/levels 500 (Internal Server Error)
GET /api/stock/alerts?acknowledged=false 500 (Internal Server Error)
```

## ⚡ IMMEDIATE FIX (Run on DigitalOcean Server)

### SSH into your server:
```bash
ssh your-username@your-server-ip
```

### Quick One-Liner Fix:
```bash
cd /var/www/your-app-directory && git pull origin production-deploy-clean && node server/database/production-stock-setup.js && pm2 restart all
```

### OR Step-by-Step:
```bash
# 1. Navigate to app directory
cd /var/www/your-app-directory

# 2. Pull latest fixes  
git pull origin production-deploy-clean

# 3. Create stock tables
node server/database/production-stock-setup.js

# 4. Restart app (choose appropriate method):
pm2 restart all                    # If using PM2
# OR
sudo systemctl restart your-service # If using systemd
```

## 🔍 Verify the Fix

Test these URLs in your browser:
- `https://astrobsm-order-placement-fykxb.ondigitalocean.app/api/stock/levels`
- `https://astrobsm-order-placement-fykxb.ondigitalocean.app/api/stock/alerts?acknowledged=false`

**Expected Result:** JSON data instead of 500 errors

## 📊 What Gets Fixed

✅ **Database Tables Created:**
- `stock_inventory` - Product stock levels
- `stock_movements` - Stock change audit trail  
- `stock_intake` - Supplier receipts
- `low_stock_alerts` - Alert system

✅ **Features Enabled:**
- Admin panel stock management
- Real-time stock notifications
- Automatic stock deduction on orders
- Low stock alerts and warnings

✅ **API Endpoints Fixed:**
- `/api/stock/levels` ← No more 500 errors
- `/api/stock/alerts` ← No more 500 errors
- `/api/stock/intake` ← Fully functional
- `/api/stock/movements` ← Complete audit trail

## 🛠️ Troubleshooting

### If fix script fails:
```bash
# Check database connection
node -e "require('./server/database/db').testConnection().then(() => console.log('DB OK')).catch(console.error)"

# Check if tables exist
psql $DATABASE_URL -c "\dt"

# Check application logs
pm2 logs  # or check your log files
```

### If still getting 500 errors:
1. **Restart the application completely**
2. **Check firewall/port settings**
3. **Verify environment variables**
4. **Check PostgreSQL service is running**

## 📞 Support

The fix is ready and tested. Running the setup script will resolve all stock management issues immediately.

**Files Ready for Deployment:**
- ✅ `server/database/production-stock-setup.js` - Database setup
- ✅ `fix-production-stock.sh` - Automated deployment script
- ✅ All stock management code is in place

**Time to Fix:** ~2-3 minutes

Run the commands above on your DigitalOcean server to resolve the issue!