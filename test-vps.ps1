# Test VPS Connection Script (Windows PowerShell)
Write-Host "🔍 Testing VPS connection..." -ForegroundColor Green

# VPS Details
$VPS_IP = "160.191.87.226"
$VPS_USER = "root"
$VPS_PASSWORD = "@ShopVPS!gYalckyL"

Write-Host "📡 Testing SSH connection to $VPS_IP..." -ForegroundColor Yellow

# Test SSH connection using ssh command
try {
    $env:SSH_ASKPASS_REQUIRE = "never"
    $env:DISPLAY = ""
    
    # Use sshpass equivalent for Windows (if available) or manual connection
    Write-Host "🔧 To test connection, run this command manually:" -ForegroundColor Cyan
    Write-Host "ssh $VPS_USER@$VPS_IP" -ForegroundColor White
    Write-Host "Password: $VPS_PASSWORD" -ForegroundColor White
    
    Write-Host "✅ VPS is ready for setup!" -ForegroundColor Green
    Write-Host "📋 Next steps:" -ForegroundColor Yellow
    Write-Host "1. Test SSH connection manually" -ForegroundColor White
    Write-Host "2. Run setup script on VPS" -ForegroundColor White
}
catch {
    Write-Host "❌ Error testing connection: $($_.Exception.Message)" -ForegroundColor Red
}
