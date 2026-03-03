# Script untuk Cek Status AAB dan APK

$aabPath = "android\app\build\outputs\bundle\release\app-release.aab"
$apkPath = "android\app\build\outputs\apk\release\app-release.apk"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " STATUS PEMBUATAN APLIKASI ANDROID" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Cek AAB
if (Test-Path $aabPath) {
    $aabItem = Get-Item $aabPath
    Write-Host "✅ AAB BERHASIL!" -ForegroundColor Green
    Write-Host "   Path: $($aabItem.FullName)" -ForegroundColor Gray
    Write-Host "   Size: $([math]::Round($aabItem.Length / 1MB, 2)) MB" -ForegroundColor Gray
    Write-Host "   Time: $($aabItem.LastWriteTime)" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "❌ AAB belum ditemukan." -ForegroundColor Red
}

# Cek APK
if (Test-Path $apkPath) {
    $apkItem = Get-Item $apkPath
    Write-Host "✅ APK BERHASIL!" -ForegroundColor Green
    Write-Host "   Path: $($apkItem.FullName)" -ForegroundColor Gray
    Write-Host "   Size: $([math]::Round($apkItem.Length / 1MB, 2)) MB" -ForegroundColor Gray
    Write-Host "   Time: $($apkItem.LastWriteTime)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Gunakan file APK ini untuk testing dan instalasi manual." -ForegroundColor Cyan
} else {
    Write-Host "⏳ APK sedang dibuat atau belum ditemukan." -ForegroundColor Yellow
    Write-Host "   Tunggu proses 'assembleRelease' selesai..." -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
