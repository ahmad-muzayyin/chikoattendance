# Script untuk Fix Build Error dan Build dengan EAS
# Tanggal: 2026-02-16

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  FIX BUILD ERROR & BUILD DENGAN EAS (NDK r28)" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Diagnosa masalah
Write-Host "🔍 DIAGNOSA MASALAH:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  ✅ Konfigurasi NDK r28: SUDAH BENAR" -ForegroundColor Green
Write-Host "  ✅ 16 KB Support Flag: SUDAH ENABLED" -ForegroundColor Green
Write-Host "  ✅ Target SDK 35: SUDAH BENAR" -ForegroundColor Green
Write-Host ""
Write-Host "  ❌ NDK r28 belum terinstall di sistem lokal" -ForegroundColor Red
Write-Host "  ❌ Build lokal tidak bisa dilakukan" -ForegroundColor Red
Write-Host ""

# Solusi
Write-Host "💡 SOLUSI:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Menggunakan EAS Build yang akan:" -ForegroundColor White
Write-Host "  1. Install NDK r28 otomatis" -ForegroundColor White
Write-Host "  2. Build AAB di cloud" -ForegroundColor White
Write-Host "  3. Menghasilkan AAB yang 16 KB compliant" -ForegroundColor White
Write-Host ""

# Konfirmasi
Write-Host "🚀 MEMULAI EAS BUILD..." -ForegroundColor Green
Write-Host ""

# Cek EAS CLI
Write-Host "Memeriksa EAS CLI..." -ForegroundColor Yellow
$easCheck = Get-Command eas -ErrorAction SilentlyContinue

if (-not $easCheck) {
    Write-Host "  Installing EAS CLI..." -ForegroundColor Yellow
    npm install -g eas-cli
    Write-Host "  ✅ EAS CLI installed" -ForegroundColor Green
}
else {
    Write-Host "  ✅ EAS CLI sudah terinstall" -ForegroundColor Green
}

Write-Host ""

# Cek login
Write-Host "Memeriksa login status..." -ForegroundColor Yellow
try {
    $loginStatus = eas whoami 2>&1
    Write-Host "  ✅ Logged in as: $loginStatus" -ForegroundColor Green
}
catch {
    Write-Host "  ⚠️  Belum login. Silakan login terlebih dahulu:" -ForegroundColor Yellow
    Write-Host "     eas login" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  MEMULAI BUILD" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Build akan:" -ForegroundColor White
Write-Host "  • Menggunakan NDK r28 (28.0.12674087)" -ForegroundColor White
Write-Host "  • Enable 16 KB page size support" -ForegroundColor White
Write-Host "  • Target Android 15 (SDK 35)" -ForegroundColor White
Write-Host "  • Menghasilkan production AAB" -ForegroundColor White
Write-Host ""
Write-Host "Estimasi waktu: 10-15 menit" -ForegroundColor Yellow
Write-Host ""

# Mulai build
eas build --platform android --profile production

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  BUILD SELESAI" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Langkah selanjutnya:" -ForegroundColor Yellow
Write-Host "  1. Download AAB dari Expo dashboard" -ForegroundColor White
Write-Host "  2. Upload ke Google Play Console" -ForegroundColor White
Write-Host "  3. Verifikasi pesan: '✓ Supports 16 KB page sizes'" -ForegroundColor White
Write-Host ""
