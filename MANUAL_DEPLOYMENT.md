# Digital Ocean Manual Deployment - Schema Fix

## Problem
- GitHub blocks pushes due to secret scanning
- `schema-fix` branch exists locally but not on GitHub
- Need to deploy schema fix endpoint manually

## Solution: Update Digital Ocean App Spec

### Step 1: Go to Digital Ocean Dashboard
1. Visit: https://cloud.digitalocean.com/apps
2. Click on your app: `astrobsm-order-placement-fykxb`
3. Go to **Settings** → **App Spec**

### Step 2: Edit App Spec to Use Latest Code
1. Click **Edit** on the App Spec
2. Find the `source` section
3. Change the branch from `master` to `production-ready` (if not already)
4. Click **Save** to trigger redeploy

### Step 3: Alternative - Force Redeploy
If changing branch doesn't work:
1. Go to **Deployments** tab
2. Click **Create Deployment**
3. This forces a fresh deployment

### Step 4: Verify Schema Endpoint
After deployment (2-3 minutes), test:
```
curl -X POST https://astrobsm-order-placement-fykxb.ondigitalocean.app/api/setup-schema
```

Should return 401 Unauthorized (not 404)

### Step 5: Run Schema Fix
```cmd
cd "C:\Users\USER\Documents\ASTROBSM ORDER FORM"
node run_schema_fix.js
```

## Current Status
- ✅ Schema fix code ready locally
- ✅ Server.js has schema fix endpoint
- ❌ Can't push to GitHub (secret scanning)
- ⏳ Need manual Digital Ocean deployment

## Next Action
**Go to Digital Ocean dashboard and trigger deployment manually!**
