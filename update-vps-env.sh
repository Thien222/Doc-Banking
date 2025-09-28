#!/bin/bash

echo "🔧 Updating VPS environment variables..."

# Cập nhật MONGODB_URI để trỏ đến đúng database
cat > /var/www/docbanking/server/.env << EOF
# Database
MONGODB_URI=mongodb://127.0.0.1:27017/hoso_db
DB_NAME=hoso_db

# JWT
JWT_SECRET=your-jwt-secret-key-here

# Email (tắt tạm thời để tránh lỗi)
DISABLE_EMAIL=true

# Firebase (optional - SSO)
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
EOF

echo "✅ Updated VPS .env file with correct database connection"
echo "📋 Current .env contents:"
cat /var/www/docbanking/server/.env
