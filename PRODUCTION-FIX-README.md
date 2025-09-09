# Production Deployment Instructions

## 🚨 Critical Production Fix for Order Submission Errors

The production database needs to be updated to fix the 500 errors. Here are the steps:

### Option 1: Automatic Fix (Recommended)
Run this command on the production server:
```bash
node production-db-fix.js
```

### Option 2: Manual Database Update
If you need to run the database setup manually:
```bash
npm run setup-db
```

### What This Fixes:
1. ✅ **Missing Descriptions**: Adds required descriptions to all products
2. ✅ **Product Name Matching**: Updates products to match frontend dropdown exactly
3. ✅ **Correct Prices**: Sets proper Nigerian Naira prices (e.g., ₦6000 for Opsite)
4. ✅ **Unit of Measure**: Extracts and sets proper units from product names

### Expected Result:
- **Before**: `POST /api/orders` returns 500 error "Failed to create order"
- **After**: Order submissions work perfectly with no product matching errors

### Products Updated:
- Opsite (Piece) - ₦6,000
- Skin Staples (Piece) - ₦4,000
- Wound-Care Honey Gauze products
- All 24 products perfectly synchronized

### Verification:
After running the fix, test order submission with any product from the dropdown - it should succeed without errors.

---
*This fix resolves the production database schema issues and ensures perfect product name matching between frontend and database.*
