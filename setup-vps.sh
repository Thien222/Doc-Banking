#!/bin/bash

# VPS Setup Script for docbanking.xyz
echo "🔧 Setting up VPS for docbanking.xyz..."

# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PM2 globally
npm install -g pm2

# Install Nginx
apt install -y nginx

# Install Certbot for SSL
apt install -y certbot python3-certbot-nginx

# Create app directory
mkdir -p /var/www/docbanking
cd /var/www/docbanking

# Clone repository (replace with your GitHub repo)
# git clone https://github.com/yourusername/docbanking.git .
# For now, we'll create the directory structure manually

# Install dependencies
cd server && npm install --production
cd ../client && npm install --production && npm run build

# Setup PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Configure Nginx
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
echo "🌐 Next: Point domain to VPS IP and run SSL setup"
