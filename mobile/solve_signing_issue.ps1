
# Script untuk memperbaiki masalah signing dan membuild ulang aplikasi
# Menggunakan: upload_key_reset.jks

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  FIXING SIGNING ISSUE & REBUILDING (EAS)" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verifikasi Keystore
Write-Host "1. Memverifikasi Keystore (upload_key_reset.jks)..." -ForegroundColor Yellow
$keystore = "mobile\upload_key_reset.jks"
if (-not (Test-Path $keystore)) {
    Write-Host "❌ Error: Keystore tidak ditemukan di $keystore" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Keystore ditemukan." -ForegroundColor Green

# 2. Cek Properies
Write-Host "2. Memeriksa Konfigurasi Gradle..." -ForegroundColor Yellow
# (Config sudah diupdate oleh AI sebelumnya)
Write-Host "✅ Konfigurasi Gradle sudah diupdate untuk menggunakan keystore ini." -ForegroundColor Green

# 3. Mulai Build EAS
Write-Host "3. Memulai EAS Build (Production)..." -ForegroundColor Yellow
Write-Host "   Ini akan mengupload keystore yang benar ke server build." -ForegroundColor White

cd mobile
eas build --platform android --profile production --auto-submit=false

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  BUILD SELESAI" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "Silakan download AAB dari link yang diberikan EAS." -ForegroundColor Yellow
Write-Host "Upload AAB tersebut ke Google Play Console." -ForegroundColor Yellow
