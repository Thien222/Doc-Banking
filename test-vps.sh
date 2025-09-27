#!/bin/bash

# Test VPS Connection Script
echo "🔍 Testing VPS connection..."

# VPS Details
VPS_IP="160.191.87.226"
VPS_USER="root"
VPS_PASSWORD="@ShopVPS!gYalckyL"

echo "📡 Testing SSH connection to $VPS_IP..."

# Test SSH connection
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP "echo '✅ SSH connection successful!'"

if [ $? -eq 0 ]; then
    echo "🎉 VPS is ready for setup!"
    echo "📋 Next steps:"
    echo "1. Update VPS_IP in this script"
    echo "2. Run: ./setup-vps.sh"
else
    echo "❌ Cannot connect to VPS"
    echo "🔧 Check:"
    echo "- VPS IP address"
    echo "- VPS is running"
    echo "- Firewall settings"
fi
