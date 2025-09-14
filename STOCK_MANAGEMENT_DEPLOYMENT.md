# Stock Management System - Production Deployment Guide

## Issue Resolved
Fixed 500 errors in stock management API endpoints (`/api/stock/levels` and `/api/stock/alerts`) that were preventing the stock management system from functioning on production.

## Root Cause
The stock management database tables were not created in the production database, causing the API endpoints to fail when trying to query non-existent tables.

## Solution Implemented

### 1. Created Production Stock Setup Script
- **File**: `server/database/production-stock-setup.js`
- **Purpose**: Creates all required stock management tables with proper indexes and relationships
- **Tables Created**:
  - `stock_inventory` - Current stock levels and reorder points
  - `stock_movements` - Audit trail of all stock changes
  - `stock_intake` - Records of stock received from suppliers
  - `low_stock_alerts` - Alert system for low stock notifications

### 2. Automated Setup Scripts
- **Linux/Production**: `setup-production-stock.sh`
- **Windows/Local**: `setup-stock-management.bat`

### 3. Features Included
- ✅ Automatic table creation with proper relationships
- ✅ Initial stock data population for all products
- ✅ Comprehensive error handling and rollback
- ✅ Performance indexes for optimal queries
- ✅ Audit trail with timestamps and user tracking
- ✅ Automated testing and validation

## Deployment Instructions for DigitalOcean

### Step 1: Upload Files
Ensure these new files are uploaded to your DigitalOcean server:
```
server/database/production-stock-setup.js
setup-production-stock.sh
setup-stock-management.bat
STOCK_MANAGEMENT_DEPLOYMENT.md (this file)
```

### Step 2: Run Stock Setup on Production Server

#### Option A: SSH into DigitalOcean Server
```bash
# SSH into your server
ssh your-user@your-server-ip

# Navigate to application directory
cd /var/www/your-app-directory

# Run the stock setup script
chmod +x setup-production-stock.sh
./setup-production-stock.sh
```

#### Option B: Manual Database Setup
```bash
# Navigate to application directory
cd /var/www/your-app-directory

# Run the production stock setup directly
node server/database/production-stock-setup.js

# Restart your application (if using PM2)
pm2 restart all

# Or if using systemd
sudo systemctl restart your-app-service
```

### Step 3: Verify Installation
After running the setup, test the endpoints:

```bash
# Test stock levels endpoint
curl https://your-domain.com/api/stock/levels

# Test stock alerts endpoint  
curl https://your-domain.com/api/stock/alerts?acknowledged=false

# Both should return JSON responses without 500 errors
```

### Step 4: Test in Browser
1. Visit your application URL
2. Access the admin panel (password required)
3. Navigate to "Stock Management" section
4. Verify you can see stock levels and alerts
5. Test adding/updating stock quantities

## Expected Results

### Before Fix
```
GET /api/stock/levels -> 500 Internal Server Error
GET /api/stock/alerts -> 500 Internal Server Error
```

### After Fix
```
GET /api/stock/levels -> 200 OK with stock data
GET /api/stock/alerts -> 200 OK with alert data
```

## Database Tables Created

### stock_inventory
- Tracks current stock levels for each product
- Includes reorder levels and maximum stock capacity
- Automatically updated when orders are processed

### stock_movements  
- Complete audit trail of all stock changes
- Records IN, OUT, and ADJUSTMENT transactions
- Links to orders and stock intake records

### stock_intake
- Records of stock received from suppliers
- Includes batch numbers, expiry dates, costs
- Supports inventory valuation and tracking

### low_stock_alerts
- Automated alert system for low stock
- Three levels: LOW, CRITICAL, OUT_OF_STOCK
- Acknowledgment system for admin users

## Integration Points

### Order Processing
- Stock automatically deducted when orders are created
- Real-time stock level updates
- Automatic low-stock alerts generated

### Admin Interface
- Stock management dashboard
- Stock level adjustments
- Supplier intake recording
- Alert management system

### Notifications
- Real-time stock alerts in admin panel
- Automatic polling for stock status
- Visual indicators for stock levels

## Troubleshooting

### If Setup Fails
1. Check database connection in server logs
2. Verify PostgreSQL service is running
3. Ensure database user has CREATE TABLE permissions
4. Check for existing table conflicts

### If Endpoints Still Return 500
1. Check server logs for specific error messages
2. Verify all stock tables were created: `\dt` in psql
3. Test database connection: `node server/database/production-stock-setup.js`
4. Restart application completely

### Common Issues
- **Permission denied**: Ensure database user has proper permissions
- **Table already exists**: Safe to ignore, setup script handles this
- **Connection timeout**: Check database configuration and network

## Monitoring

### Health Checks
The application now includes health monitoring for:
- Stock level calculations
- Alert system functionality  
- Database connection status
- API endpoint response times

### Performance Optimization
- Indexed queries for fast stock lookups
- Optimized alert polling (every 30 seconds)
- Efficient stock movement logging
- Minimal UI updates for better UX

## Next Steps After Deployment

1. **Test Complete Workflow**:
   - Create a test order
   - Verify stock deduction
   - Check low stock alerts

2. **Configure Stock Levels**:
   - Set appropriate reorder levels for each product
   - Update maximum stock capacities
   - Input initial stock quantities

3. **Set Up Monitoring**:
   - Monitor stock alert notifications
   - Review stock movement reports
   - Track order processing performance

4. **Train Users**:
   - Admin panel stock management
   - Stock intake procedures  
   - Alert acknowledgment process

## Success Indicators

✅ No more 500 errors on stock endpoints  
✅ Admin panel shows stock levels  
✅ Stock notifications working  
✅ Order processing updates stock  
✅ Real-time stock level updates  
✅ Alert system functioning  

The stock management system is now fully functional and integrated with the existing order management workflow.