#!/bin/bash

# Auto Setup VPS Script for DocBanking
echo "🚀 Starting automatic VPS setup..."

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PM2 globally
echo "📦 Installing PM2..."
npm install -g pm2

# Install Nginx
echo "📦 Installing Nginx..."
apt install -y nginx

# Install Certbot for SSL
echo "📦 Installing Certbot..."
apt install -y certbot python3-certbot-nginx

# Create app directory
echo "📁 Creating app directory..."
mkdir -p /var/www/docbanking
cd /var/www/docbanking

# Clone repository
echo "📥 Cloning repository..."
git clone https://github.com/Thien222/Doc-Banking.git .

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server && npm install --production

# Install client dependencies and build
echo "📦 Installing client dependencies and building..."
cd ../client && npm install --production && npm run build

# Go back to root directory
cd /var/www/docbanking

# Setup PM2
echo "🔄 Setting up PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Configure Nginx
echo "🌐 Configuring Nginx..."
cat > /etc/nginx/sites-available/docbanking.xyz << 'EOF'
server {
    listen 80;
    server_name docbanking.xyz www.docbanking.xyz;

    # Client (React)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API (Node.js)
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/docbanking.xyz /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo "✅ VPS setup complete!"
echo "🌐 Your app is running at: http://160.191.87.226"
echo "📋 Next steps:"
echo "1. Buy domain docbanking.xyz"
echo "2. Point domain to 160.191.87.226"
echo "3. Run SSL setup: certbot --nginx -d docbanking.xyz"
echo "4. Update environment variables in /var/www/docbanking/server/.env"
