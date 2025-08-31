# ASTRO-BSM Digital Ocean Deployment Fix

## Current Issues with Deployed App:
1. Health endpoint returning 404
2. No products loading in the form
3. API endpoints not functioning properly

## Quick Fix for Digital Ocean:

### 1. Update your Digital Ocean App Platform Configuration:

**Build Command (Critical Update):**
```bash
npm install && npm run init
```

**Environment Variables (Verify these are set correctly):**
```
NODE_ENV=production
PORT=8080
DB_HOST=your-database-host.db.ondigitalocean.com
DB_PORT=25060
DB_USER=your-database-username
DB_PASSWORD=YOUR_SECURE_DATABASE_PASSWORD
DB_NAME=defaultdb
DB_SSL=true
ADMIN_PRICE_PASSWORD=YOUR_ADMIN_PASSWORD_HERE
SESSION_SECRET=YOUR_SUPER_SECRET_SESSION_KEY_CHANGE_THIS
```

### 2. Database Connection Test:
The app needs to properly initialize the database. In your DO console, run:
```bash
npm run init
```

### 3. Manual Database Setup (if init fails):
If the build command fails to initialize the database, manually run these in DO console:
```bash
npm run create-db
npm run setup-db
```

### 4. Restart the Application:
After making changes, restart your DO app to ensure all changes take effect.

## Why the App Isn't Working:
1. **Database not initialized** - The products table is likely empty
2. **Port mismatch** - App might be running on wrong port
3. **Missing health endpoint** - Need to ensure health checks pass

## Expected Results After Fix:
- Health endpoint: https://astrobsm-orderform-l4b35.ondigitalocean.app/health
- Products will load in the dropdown
- Order submission will work
- Admin panel will be accessible

## Test After Deployment:
1. Check health: https://astrobsm-orderform-l4b35.ondigitalocean.app/health
2. Verify products load in the form
3. Try submitting a test order
4. Test admin functionality
