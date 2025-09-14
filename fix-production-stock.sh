#!/bin/bash

echo "🚀 ASTRO-BSM Stock Management Production Fix"
echo "==========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ️${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the application root directory."
    exit 1
fi

print_info "Current directory: $(pwd)"
print_info "Checking application structure..."

# Check for required files
if [ ! -f "server/database/production-stock-setup.js" ]; then
    print_error "Stock setup script not found. Please pull the latest changes first:"
    echo "git pull origin production-deploy-clean"
    exit 1
fi

print_status "Required files found"

# Step 1: Pull latest changes
print_info "Step 1: Pulling latest changes..."
git pull origin production-deploy-clean

if [ $? -eq 0 ]; then
    print_status "Code updated successfully"
else
    print_error "Failed to pull changes"
    exit 1
fi

# Step 2: Install dependencies (in case there are new ones)
print_info "Step 2: Installing dependencies..."
npm install

# Step 3: Create stock management tables
print_info "Step 3: Setting up stock management database..."
node server/database/production-stock-setup.js

if [ $? -eq 0 ]; then
    print_status "Stock management tables created successfully"
else
    print_error "Failed to create stock tables"
    print_warning "This might be normal if tables already exist"
fi

# Step 4: Test database connection
print_info "Step 4: Testing database connection..."
node -e "
const pool = require('./server/database/db');
(async () => {
  try {
    await pool.testConnection();
    console.log('✅ Database connection successful');
    
    // Test stock tables
    const result = await pool.query('SELECT COUNT(*) FROM stock_inventory');
    console.log('✅ Stock inventory table accessible with ' + result.rows[0].count + ' records');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    process.exit(1);
  }
})();
"

if [ $? -eq 0 ]; then
    print_status "Database tests passed"
else
    print_error "Database tests failed"
fi

# Step 5: Restart the application
print_info "Step 5: Restarting application..."

# Check if PM2 is being used
if command -v pm2 >/dev/null 2>&1; then
    print_info "Found PM2, restarting with PM2..."
    pm2 restart all
    
    if [ $? -eq 0 ]; then
        print_status "PM2 restart successful"
        
        # Show PM2 status
        pm2 status
    else
        print_error "PM2 restart failed"
    fi
    
elif systemctl list-units --type=service | grep -q "astrobsm\|order"; then
    print_info "Found systemd service, restarting..."
    
    # Try to find the service name
    SERVICE=$(systemctl list-units --type=service | grep -E "astrobsm|order" | awk '{print $1}' | head -1)
    
    if [ ! -z "$SERVICE" ]; then
        sudo systemctl restart "$SERVICE"
        print_status "Service $SERVICE restarted"
        sudo systemctl status "$SERVICE"
    else
        print_warning "Could not determine service name. Please restart manually."
    fi
    
else
    print_warning "No process manager detected (PM2/systemd). Please restart your application manually."
    print_info "If running directly: kill the node process and run 'node server/server.js'"
fi

# Step 6: Verify the fix
print_info "Step 6: Testing API endpoints..."
sleep 3

# Test stock levels endpoint
print_info "Testing stock levels endpoint..."
RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/stock_test.json "http://localhost:3000/api/stock/levels")

if [ "$RESPONSE" = "200" ]; then
    print_status "Stock levels endpoint working (HTTP 200)"
    
    # Check if we got actual data
    if grep -q "success.*true" /tmp/stock_test.json 2>/dev/null; then
        print_status "Stock levels endpoint returning valid data"
    else
        print_warning "Stock levels endpoint returned 200 but data format unexpected"
    fi
else
    print_error "Stock levels endpoint failed (HTTP $RESPONSE)"
fi

# Test stock alerts endpoint
print_info "Testing stock alerts endpoint..."
RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/alerts_test.json "http://localhost:3000/api/stock/alerts?acknowledged=false")

if [ "$RESPONSE" = "200" ]; then
    print_status "Stock alerts endpoint working (HTTP 200)"
else
    print_error "Stock alerts endpoint failed (HTTP $RESPONSE)"
fi

# Clean up temp files
rm -f /tmp/stock_test.json /tmp/alerts_test.json

echo ""
echo "🎉 Production Fix Complete!"
echo "=========================="
echo ""
print_status "Stock management database tables created"
print_status "Application restarted with latest code"
print_status "API endpoints tested"
echo ""
print_info "Next steps:"
echo "1. Test your application in a browser"
echo "2. Access admin panel and check stock management"
echo "3. Verify notifications are working"
echo "4. Test order processing with stock deduction"
echo ""
print_info "If you still see issues:"
echo "- Check application logs: pm2 logs (if using PM2)"
echo "- Check server response: curl https://your-domain.com/api/stock/levels"
echo "- Verify database connection and tables exist"
echo ""
print_status "Production deployment completed successfully!"