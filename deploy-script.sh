#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# 1. Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# 2. Install/update dependencies
echo "📦 Installing dependencies..."
cd server && npm install
cd ../client && npm install

# 3. Build client
echo "🏗️ Building client..."
npm run build

# 4. Restart services
echo "♻️ Restarting services..."
cd ..
pm2 restart docbanking-server --update-env
pm2 restart docbanking-client

# 5. Check status
echo "✅ Checking status..."
pm2 status

# 6. Test endpoints
echo "🧪 Testing endpoints..."
sleep 5
curl -f http://localhost:3001/hoso > /dev/null && echo "✅ Backend OK" || echo "❌ Backend failed"
curl -f http://localhost:3000 > /dev/null && echo "✅ Frontend OK" || echo "❌ Frontend failed"

echo "🎉 Deployment completed!"
