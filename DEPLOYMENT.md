# Digital Ocean Deployment Guide for ASTRO-BSM Order Application

## Prerequisites

1. **Digital Ocean Droplet** (Ubuntu 20.04 LTS or later)
2. **Domain name** (optional, but recommended)
3. **SSL Certificate** (Let's Encrypt recommended)

## Step 1: Create Digital Ocean Droplet

1. Create a new droplet with at least:
   - **2GB RAM**
   - **1 CPU**
   - **25GB SSD**
   - **Ubuntu 20.04 LTS**

2. Add your SSH key for secure access

## Step 2: Initial Server Setup

```bash
# Connect to your droplet
ssh root@your_droplet_ip

# Update system packages
apt update && apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PostgreSQL
apt install postgresql postgresql-contrib -y

# Install Nginx
apt install nginx -y

# Install PM2 for process management
npm install -g pm2

# Install Git
apt install git -y
```

## Step 3: Setup PostgreSQL Database

```bash
# Switch to postgres user
sudo -i -u postgres

# Create database and user
createdb astrobsm_orders
createuser --interactive --pwprompt astrobsm_user

# Grant privileges
psql -c "GRANT ALL PRIVILEGES ON DATABASE astrobsm_orders TO astrobsm_user;"

# Exit postgres user
exit
```

## Step 4: Clone and Setup Application

```bash
# Create application directory
mkdir -p /var/www
cd /var/www

# Clone the repository
git clone https://github.com/astrobsm/astrobsm_order.git
cd astrobsm_order

# Install dependencies
npm install --production

# Copy environment file and configure
cp .env.example .env
nano .env
```

Configure your `.env` file:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=astrobsm_orders
DB_USER=astrobsm_user
DB_PASSWORD=your_secure_password

# Application Configuration
PORT=3000
NODE_ENV=production

# Security
SESSION_SECRET=your_very_secure_session_secret_here
```

## Step 5: Initialize Database

```bash
# Run database setup
node server/database/setup.js
```

## Step 6: Configure Nginx

Create Nginx configuration:
```bash
nano /etc/nginx/sites-available/astrobsm_order
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your_domain.com www.your_domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
ln -s /etc/nginx/sites-available/astrobsm_order /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

## Step 7: Setup SSL with Let's Encrypt

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d your_domain.com -d www.your_domain.com

# Auto-renewal setup
systemctl enable certbot.timer
```

## Step 8: Start Application with PM2

```bash
cd /var/www/astrobsm_order

# Start application
pm2 start server/server.js --name "astrobsm-order"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

# Check status
pm2 status
```

## Step 9: Configure Firewall

```bash
# Enable UFW
ufw enable

# Allow SSH
ufw allow ssh

# Allow HTTP and HTTPS
ufw allow 'Nginx Full'

# Check status
ufw status
```

## Step 10: Monitoring and Logs

```bash
# View application logs
pm2 logs astrobsm-order

# Monitor processes
pm2 monit

# Restart application
pm2 restart astrobsm-order

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## Environment Variables for Production

Ensure your `.env` file has these production-ready values:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=astrobsm_orders
DB_USER=astrobsm_user
DB_PASSWORD=your_secure_password
PORT=3000
NODE_ENV=production
SESSION_SECRET=your_very_secure_session_secret_minimum_32_characters
```

## Application Access

- **Admin Panel**: Access with password `roseball`
- **Price Editing**: Extra password `redvelvet`
- **Payment Details**: Integrated BONNESANTE MEDICALS account information

## Backup Strategy

```bash
# Database backup
pg_dump -U astrobsm_user -h localhost astrobsm_orders > backup_$(date +%Y%m%d).sql

# Application backup
tar -czf astrobsm_backup_$(date +%Y%m%d).tar.gz /var/www/astrobsm_order
```

## Troubleshooting

1. **Check application status**: `pm2 status`
2. **View logs**: `pm2 logs astrobsm-order`
3. **Restart application**: `pm2 restart astrobsm-order`
4. **Check Nginx**: `nginx -t && systemctl status nginx`
5. **Database connection**: Check `.env` credentials

## Performance Optimization

1. **Enable Gzip in Nginx**
2. **Setup database connection pooling**
3. **Configure PM2 cluster mode** (if needed)
4. **Monitor with PM2 Plus** (optional)

## Security Considerations

1. Regular security updates
2. Database backups
3. SSL certificate renewal
4. Monitor access logs
5. Use strong passwords for admin access

Your application should now be live and accessible at your domain!
