#!/bin/bash

# ASTRO-BSM Order System - Digital Ocean Deployment Script
# Run this script on your Digital Ocean droplet

echo "🚀 Starting ASTRO-BSM Order System Deployment..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
echo "🟢 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
echo "🐘 Installing PostgreSQL..."
sudo apt install postgresql postgresql-contrib -y

# Install PM2 for process management
echo "⚙️ Installing PM2..."
sudo npm install -g pm2

# Clone repository
echo "📥 Cloning repository..."
git clone https://github.com/astrobsm/astrobsm_order.git
cd astrobsm_order

# Install dependencies
echo "📚 Installing dependencies..."
npm install

# Setup PostgreSQL database
echo "🗄️ Setting up database..."
sudo -u postgres psql << EOF
CREATE DATABASE astrobsm_orders;
CREATE USER astrobsm_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE astrobsm_orders TO astrobsm_user;
\q
EOF

# Create environment file
echo "🔧 Creating environment configuration..."
cat > .env << EOF
# Database Configuration
DB_USER=astrobsm_user
DB_HOST=localhost
DB_NAME=astrobsm_orders
DB_PASSWORD=your_secure_password_here
DB_PORT=5432

# Server Configuration
PORT=3000
NODE_ENV=production
EOF

echo "⚠️ IMPORTANT: Edit the .env file and update the DB_PASSWORD"
echo "Command: nano .env"

# Initialize database
echo "🏗️ Initializing database..."
npm run init

# Start application with PM2
echo "🚀 Starting application..."
pm2 start server/server.js --name "astrobsm-order"

# Setup PM2 to start on boot
echo "🔄 Setting up auto-restart..."
pm2 startup
pm2 save

# Install and configure Nginx (optional)
echo "🌐 Would you like to install Nginx for reverse proxy? (y/n)"
read -r install_nginx

if [[ $install_nginx =~ ^[Yy]$ ]]; then
    echo "📦 Installing Nginx..."
    sudo apt install nginx -y
    
    # Create Nginx configuration
    sudo tee /etc/nginx/sites-available/astrobsm-order > /dev/null << EOF
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
    
    # Enable the site
    sudo ln -s /etc/nginx/sites-available/astrobsm-order /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    
    echo "✅ Nginx configured! Update server_name in /etc/nginx/sites-available/astrobsm-order"
fi

# Setup firewall
echo "🔒 Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

echo "🎉 Deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file: nano .env"
echo "2. Update database password in .env"
echo "3. If using Nginx, update domain in: /etc/nginx/sites-available/astrobsm-order"
echo "4. Test application: curl http://localhost:3000"
echo ""
echo "🔧 Useful commands:"
echo "- Check application status: pm2 status"
echo "- View logs: pm2 logs astrobsm-order"
echo "- Restart application: pm2 restart astrobsm-order"
echo "- Check Nginx status: sudo systemctl status nginx"
echo ""
echo "🌐 Access your application at: http://your-server-ip"
if [[ $install_nginx =~ ^[Yy]$ ]]; then
    echo "   (or your domain if Nginx is configured)"
fi
echo ""
echo "👤 Admin Panel Access:"
echo "   Password: roseball"
echo "   Price Edit Password: redvelvet"
