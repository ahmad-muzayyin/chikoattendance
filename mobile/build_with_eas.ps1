# Build with EAS (NDK r28 Automatic)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Building Android AAB with NDK r28" -ForegroundColor Cyan
Write-Host "Using EAS Build (Automatic NDK Setup)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if EAS CLI is available
Write-Host "Checking EAS CLI..." -ForegroundColor Yellow
$easCheck = Get-Command eas -ErrorAction SilentlyContinue

if (-not $easCheck) {
    Write-Host "EAS CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g eas-cli
}

# Check login status
Write-Host ""
Write-Host "Checking Expo login status..." -ForegroundColor Yellow
eas whoami

# Start build
Write-Host ""
Write-Host "Starting EAS Build..." -ForegroundColor Green
Write-Host "This will:" -ForegroundColor White
Write-Host "  1. Install NDK r28 automatically" -ForegroundColor White
Write-Host "  2. Build with 16 KB page size support" -ForegroundColor White
Write-Host "  3. Generate production-ready AAB" -ForegroundColor White
Write-Host ""

eas build --platform android --profile production

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Build Complete!" -ForegroundColor Green
Write-Host "Download AAB from Expo dashboard" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
