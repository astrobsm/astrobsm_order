# 🔧 Production Database Fix Guide

## Problem Diagnosed ✅
Your production app at `https://astrobsm-order-placement-fykxb.ondigitalocean.app` is returning 500 errors because:
- Database connection fails with `ECONNREFUSED`
- Environment variables have placeholder values (`YOUR_ACTUAL_PASSWORD`)

## Solution Steps 🚀

### 1. Get Real Database Credentials
Go to your Digital Ocean account:
1. Navigate to **Databases** → Your database cluster
2. Copy the **Connection Details**:
   - Host
   - Port  
   - Database name
   - Username
   - Password

### 2. Update Production Environment Variables
In your Digital Ocean App:
1. Go to **Apps** → Your app → **Settings** → **Environment Variables**
2. Update these variables with REAL values:
   ```
   DATABASE_URL=postgresql://username:real_password@your-host:port/database?sslmode=require
   DB_HOST=your-actual-host
   DB_PORT=25060
   DB_NAME=defaultdb
   DB_USER=doadmin
   DB_PASSWORD=your-real-password
   ```

### 3. Redeploy the App
After updating environment variables:
1. Go to **Apps** → Your app → **Deploy**
2. Click **Deploy** to restart with new credentials

### 4. Run Migration Script
Once the app is working:
```bash
node migrate_to_fresh_production.js
```

## Quick Fix Alternative 🎯
If you want to start fresh with a clean deployment:
1. Create a new Digital Ocean app
2. Follow the `DEPLOYMENT_GUIDE.md`
3. Use the migration script to populate data

## Test After Fix ✅
```bash
node verify_fresh_deployment.js
```

The browser errors will disappear once the database credentials are correctly configured!
