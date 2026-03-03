# Script untuk Install NDK r28 Otomatis
# Tanggal: 2026-02-16

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  INSTALASI NDK r28 (28.0.12674087)" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Cek ANDROID_HOME
Write-Host "Memeriksa Android SDK..." -ForegroundColor Yellow
Write-Host ""

$androidHome = $env:ANDROID_HOME
if (-not $androidHome) {
    $androidHome = $env:ANDROID_SDK_ROOT
}

if (-not $androidHome) {
    # Coba lokasi default
    $defaultPath = "$env:LOCALAPPDATA\Android\Sdk"
    if (Test-Path $defaultPath) {
        $androidHome = $defaultPath
        Write-Host "Android SDK ditemukan di: $androidHome" -ForegroundColor Green
    }
    else {
        Write-Host "Android SDK tidak ditemukan!" -ForegroundColor Red
        Write-Host ""
        Write-Host "SOLUSI:" -ForegroundColor Yellow
        Write-Host "1. Install Android Studio dari:" -ForegroundColor White
        Write-Host "   https://developer.android.com/studio" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "2. Atau gunakan EAS Build (tidak perlu install NDK):" -ForegroundColor White
        Write-Host "   .\fix_and_build.ps1" -ForegroundColor Cyan
        Write-Host ""
        exit 1
    }
}
else {
    Write-Host "Android SDK: $androidHome" -ForegroundColor Green
}

Write-Host ""

# Cek sdkmanager
$sdkmanager = Join-Path $androidHome "cmdline-tools\latest\bin\sdkmanager.bat"
if (-not (Test-Path $sdkmanager)) {
    $sdkmanager = Join-Path $androidHome "tools\bin\sdkmanager.bat"
}

if (-not (Test-Path $sdkmanager)) {
    Write-Host "sdkmanager tidak ditemukan" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "INSTALL VIA ANDROID STUDIO:" -ForegroundColor Yellow
    Write-Host "1. Buka Android Studio" -ForegroundColor White
    Write-Host "2. Tools -> SDK Manager" -ForegroundColor White
    Write-Host "3. SDK Tools tab" -ForegroundColor White
    Write-Host "4. Centang 'Show Package Details'" -ForegroundColor White
    Write-Host "5. Cari 'NDK (Side by side)'" -ForegroundColor White
    Write-Host "6. Centang versi: 28.0.12674087" -ForegroundColor White
    Write-Host "7. Klik Apply" -ForegroundColor White
    Write-Host ""
    Write-Host "ATAU gunakan EAS Build:" -ForegroundColor Yellow
    Write-Host ".\fix_and_build.ps1" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

Write-Host "sdkmanager ditemukan" -ForegroundColor Green
Write-Host ""

# Cek NDK yang sudah terinstall
Write-Host "Memeriksa NDK yang terinstall..." -ForegroundColor Yellow
$ndkPath = Join-Path $androidHome "ndk"
if (Test-Path $ndkPath) {
    $installedNdks = Get-ChildItem $ndkPath -Directory | Select-Object -ExpandProperty Name
    if ($installedNdks) {
        Write-Host "NDK terinstall:" -ForegroundColor White
        foreach ($ndk in $installedNdks) {
            Write-Host "  - $ndk" -ForegroundColor Gray
        }
    }
}
Write-Host ""

# Install NDK r28
Write-Host "Menginstall NDK r28 (28.0.12674087)..." -ForegroundColor Yellow
Write-Host "Ini akan memakan waktu beberapa menit..." -ForegroundColor Gray
Write-Host ""

try {
    # Accept licenses
    Write-Host "Menerima lisensi..." -ForegroundColor Gray
    $null = echo "y" | & $sdkmanager --licenses 2>&1
    
    # Install NDK
    Write-Host "Downloading dan installing NDK r28..." -ForegroundColor Gray
    $installOutput = & $sdkmanager "ndk;28.0.12674087" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "NDK r28 berhasil terinstall!" -ForegroundColor Green
        Write-Host ""
        
        # Verifikasi
        $ndkR28Path = Join-Path $androidHome "ndk\28.0.12674087"
        if (Test-Path $ndkR28Path) {
            Write-Host "Verifikasi: NDK r28 ditemukan di:" -ForegroundColor Green
            Write-Host "$ndkR28Path" -ForegroundColor Gray
        }
    }
    else {
        Write-Host ""
        Write-Host "Instalasi mungkin gagal" -ForegroundColor Yellow
        Write-Host "Output: $installOutput" -ForegroundColor Gray
    }
}
catch {
    Write-Host ""
    Write-Host "Error saat install: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "ALTERNATIF:" -ForegroundColor Yellow
    Write-Host "Gunakan EAS Build (tidak perlu install NDK):" -ForegroundColor White
    Write-Host ".\fix_and_build.ps1" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "INSTALASI SELESAI" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Langkah selanjutnya:" -ForegroundColor Yellow
Write-Host "1. Build AAB:" -ForegroundColor White
Write-Host "   cd android" -ForegroundColor Gray
Write-Host "   .\gradlew clean" -ForegroundColor Gray
Write-Host "   .\gradlew bundleRelease" -ForegroundColor Gray
Write-Host ""
Write-Host "2. AAB akan ada di:" -ForegroundColor White
Write-Host "   android\app\build\outputs\bundle\release\app-release.aab" -ForegroundColor Gray
Write-Host ""
