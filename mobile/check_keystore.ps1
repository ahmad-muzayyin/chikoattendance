
# Script untuk memeriksa SHA1 Keystore
# Usage: ./check_keystore.ps1

$javaPath = "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe"
$keystorePath = "mobile\production.jks"
$expectedSHA1 = "F8:E2:B7:00:AE:A5:0A:80:3D:A5:E0:3A:DE:BC:10:06:FD:52:21:C7"

Write-Host "Checking keystore: $keystorePath" -ForegroundColor Cyan
Write-Host "Expected SHA1: $expectedSHA1" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $javaPath)) {
    Write-Host "Error: Keytool not found at $javaPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $keystorePath)) {
    Write-Host "Error: Keystore not found at $keystorePath" -ForegroundColor Red
    # Try absolute path
    $keystorePath = "production.jks"
    if (-not (Test-Path $keystorePath)) {
        Write-Host "Checking in current directory..."
        exit 1
    }
}

Write-Host "Silakan masukkan password keystore saat diminta (ketjka command keytool berjalan)..." -ForegroundColor Yellow
Write-Host "Jika keystore baru dibuat, password mungkin sama dengan yang Anda set (atau 'android' jika debug)." -ForegroundColor Yellow
Write-Host ""

# Run keytool and capture output
# Note: User needs to input password interacting with the script if run in terminal.
# But here we run it via command.
& $javaPath -list -v -keystore $keystorePath | Out-String -Stream | ForEach-Object {
    Write-Host $_
    if ($_ -match "Certificate fingerprint \(SHA1\): (.*)") {
        $foundSHA1 = $matches[1]
        Write-Host ""
        Write-Host "🔍 Found SHA1: $foundSHA1" -ForegroundColor Yellow
        
        if ($foundSHA1 -eq $expectedSHA1) {
            Write-Host "✅ MATCH! Keystore ini BENAR." -ForegroundColor Green
        }
        else {
            Write-Host "❌ MISMATCH! Keystore ini SALAH." -ForegroundColor Red
            Write-Host "Keystore ini memiliki SHA1 yang berbeda dengan yang diharapkan Play Store."
            Write-Host "Solusi: Gunakan keystore lama yang benar, atau lakukan Reset Upload Key di Play Console."
        }
    }
}
