# IMMEDIATE FIX: Apply Through GitHub Web Interface

## Step 1: Go to GitHub Repository
1. Open https://github.com/astrobsm/astrobsm_order
2. Switch to branch: `production-deploy-clean`

## Step 2: Edit the Critical File
1. Navigate to: `server/models/Order.js`
2. Click the pencil icon (Edit this file)
3. Find line 30 (around line 30)

## Step 3: Make the Fix
**Find this line:**
```javascript
        const unitPrice = parseFloat(product.price) || 0;
```

**Replace it with:**
```javascript
        const unitPrice = parseFloat(product.unit_price) || 0;
```

## Step 4: Commit the Change
1. Scroll to bottom of the page
2. Commit message: `CRITICAL FIX: Order submission 500 error - Fix product.price to product.unit_price`
3. Click "Commit changes"

## Step 5: Verify Deployment
- Digital Ocean will automatically deploy this change
- Wait 2-3 minutes for deployment
- Test order submission again

## Why This Fixes It:
The production database uses column name `unit_price` but the code was looking for `price`, causing:
- `parseFloat(undefined)` returns `NaN`
- Order creation fails
- 500 Internal Server Error

This single line change will immediately resolve the order submission issue.
