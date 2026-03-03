# Script untuk Cek Status Build & File AAB
# Gunakan script ini jika build masih berjalan di background

$aabPath = "android\app\build\outputs\bundle\release\app-release.aab"

Write-Host "Memeriksa status build AAB..." -ForegroundColor Yellow

if (Test-Path $aabPath) {
    $item = Get-Item $aabPath
    Write-Host ""
    Write-Host "✅ BUILD BERHASIL!" -ForegroundColor Green
    Write-Host "File AAB ditemukan:" -ForegroundColor White
    Write-Host "Path: $($item.FullName)" -ForegroundColor Gray
    Write-Host "Size: $([math]::Round($item.Length / 1MB, 2)) MB" -ForegroundColor Gray
    Write-Host "Time: $($item.LastWriteTime)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Silakan upload file ini ke Google Play Console." -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "⏳ Build belum selesai atau gagal." -ForegroundColor Yellow
    Write-Host "Silakan tunggu beberapa saat lagi." -ForegroundColor White
    Write-Host "Cek terminal tempat build dijalankan untuk error." -ForegroundColor Gray
    Write-Host ""
    Write-Host "Jika gagal, coba jalankan ulang:" -ForegroundColor Yellow
    Write-Host "cd android" -ForegroundColor White
    Write-Host ".\gradlew bundleRelease" -ForegroundColor White
}
