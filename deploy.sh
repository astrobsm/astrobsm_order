#!/bin/bash

# Production Deployment Script
# This script handles the complete deployment process including migrations

set -e  # Exit on any error

echo "🚀 Starting Production Deployment"
echo "=================================="

# Configuration
REPO_URL="https://github.com/astrobsm/astrobsm_order.git"
BRANCH="production-ready"
APP_DIR="/var/www/astrobsm_order"
SERVICE_NAME="astrobsm-order"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Step 1: Update code from repository
log_info "Updating code from repository..."
cd "$APP_DIR"

# Backup current version
if [ -d "backup" ]; then
    rm -rf backup
fi
cp -r . backup

# Pull latest changes
git fetch origin
git reset --hard origin/$BRANCH
log_success "Code updated successfully"

# Step 2: Install/update dependencies
log_info "Installing dependencies..."
npm ci --production
log_success "Dependencies installed"

# Step 3: Run database migrations
log_info "Running database migrations..."
NODE_ENV=production node deploy-migration.js

if [ $? -eq 0 ]; then
    log_success "Database migrations completed"
else
    log_error "Database migrations failed"
    exit 1
fi

# Step 4: Run health checks
log_info "Running pre-deployment health checks..."

# Check if required files exist
required_files=("server/app.js" "server/database/db.js" "deploy-migration.js")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        log_error "Required file missing: $file"
        exit 1
    fi
done

# Check if database connection works
NODE_ENV=production node -e "
const pool = require('./server/database/db');
pool.query('SELECT 1').then(() => {
    console.log('✅ Database connection OK');
    process.exit(0);
}).catch(err => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
});
"

if [ $? -ne 0 ]; then
    log_error "Database health check failed"
    exit 1
fi

log_success "Health checks passed"

# Step 5: Restart the application service
log_info "Restarting application service..."

# Stop the service
sudo systemctl stop $SERVICE_NAME 2>/dev/null || true

# Wait a moment
sleep 2

# Start the service
sudo systemctl start $SERVICE_NAME

# Check if service started successfully
sleep 5
if sudo systemctl is-active --quiet $SERVICE_NAME; then
    log_success "Service restarted successfully"
else
    log_error "Service failed to start"
    
    # Show service logs for debugging
    log_info "Service logs:"
    sudo journalctl -u $SERVICE_NAME --lines=10 --no-pager
    exit 1
fi

# Step 6: Final health check
log_info "Running post-deployment health check..."

# Wait for service to be fully ready
sleep 10

# Check if application responds
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")

if [ "$response" = "200" ]; then
    log_success "Application is responding correctly"
elif [ "$response" = "000" ]; then
    log_warning "Health endpoint not available, checking basic connectivity..."
    # Try basic port check
    if nc -z localhost 3000 2>/dev/null; then
        log_success "Application is running on port 3000"
    else
        log_error "Application is not responding"
        exit 1
    fi
else
    log_error "Application health check failed (HTTP $response)"
    exit 1
fi

# Step 7: Clean up
log_info "Cleaning up..."
rm -rf backup
log_success "Cleanup completed"

echo ""
echo "🎉 Deployment completed successfully!"
echo "=================================="
echo "Service: $SERVICE_NAME"
echo "Status: $(sudo systemctl is-active $SERVICE_NAME)"
echo "Port: 3000"
echo "Time: $(date)"
echo ""
log_info "You can check the application at your domain/IP address"
log_info "View logs with: sudo journalctl -u $SERVICE_NAME -f"
