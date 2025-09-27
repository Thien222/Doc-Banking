#!/bin/bash

# Deploy script for docbanking.xyz
echo "🚀 Starting deployment..."

# Update code
echo "📥 Pulling latest code..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
cd server && npm install --production
cd ../client && npm install --production

# Build client
echo "🏗️ Building React app..."
npm run build

# Restart services
echo "🔄 Restarting services..."
pm2 restart ecosystem.config.js

echo "✅ Deployment complete!"
echo "🌐 App running at: https://docbanking.xyz"
