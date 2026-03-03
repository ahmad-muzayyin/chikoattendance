
# Script to verify 16KB page size support in Android App Bundle (AAB)

$ErrorActionPreference = "Stop"

# Configuration
$AAB_PATH = "android\app\build\outputs\bundle\release\app-release.aab"
$NDK_PATH = "C:\Users\MSI Indonesia\AppData\Local\Android\Sdk\ndk\27.0.12077973"
$READELF = "$NDK_PATH\toolchains\llvm\prebuilt\windows-x86_64\bin\llvm-readelf.exe"
$TEMP_DIR = "$env:TEMP\verify_16kb_$(Get-Random)"

Write-Host "Starting verification for: $AAB_PATH" -ForegroundColor Cyan

if (-not (Test-Path $AAB_PATH)) {
    Write-Error "AAB file not found at: $AAB_PATH. Please build it first."
}

if (-not (Test-Path $READELF)) {
    Write-Error "llvm-readelf tool not found at: $READELF. Please check NDK installation."
}

# 1. Extract AAB
Write-Host "Extracting AAB to temporary directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $TEMP_DIR | Out-Null
Copy-Item -Path $AAB_PATH -Destination "$TEMP_DIR\temp_app.zip"
Expand-Archive -Path "$TEMP_DIR\temp_app.zip" -DestinationPath "$TEMP_DIR\extracted" -Force

# 2. Find .so files (arm64-v8a and x86_64 are the main concern for 16KB, but check all)
$soFiles = Get-ChildItem -Path "$TEMP_DIR\extracted" -Recurse -Filter "*.so"

if ($soFiles.Count -eq 0) {
    Write-Warning "No .so files found in the AAB. This app might not have native code."
    Remove-Item -Path $TEMP_DIR -Recurse -Force
    exit 0
}

Write-Host "Found $($soFiles.Count) native libraries. Checking alignment..." -ForegroundColor Yellow

$incompatibleFiles = @()

foreach ($file in $soFiles) {
    $arch = $file.Directory.Name
    # skip unrelated architectures if needed, but safe to check all
    
    # Run readelf -l to get program headers
    $output = & $READELF -lW $file.FullName
    
    # Parse LOAD segments
    # looking for lines like: "  LOAD           0x000000 0x0000000000000000 0x0000000000000000 0x002340 0x002340 R   0x1000"
    # The alignment is the last hex value usually.
    
    $loadSegments = $output | Select-String -Pattern "^\s*LOAD"
    
    foreach ($line in $loadSegments) {
        # Split by whitespace
        $parts = $line.ToString().Trim() -split "\s+"
        
        # In readelf -lW output: Type Offset VirtAddr PhysAddr FileSiz MemSiz Flg Align
        # Align is usually the last column.
        $alignWithHex = $parts[-1]
        
        try {
            $align = [Convert]::ToInt64($alignWithHex, 16)
            
            # Check for 16KB (0x4000 = 16384)
            if ($align -lt 16384) {
                # Only if it's not 16KB aligned
                # Note: Some segments might be 4KB aligned if they don't need 16KB (e.g. read-only?), 
                # but Android 15 requires all LOAD segments to be 16KB aligned for compatibility?
                # Actually, the requirement is that ELF segments are aligned to 16KB boundaries on disk.
                # So p_align must be >= 16384 (0x4000).
                
                $incompatibleFiles += [PSCustomObject]@{
                    File = $file.Name
                    Arch = $arch
                    Alignment = $alignWithHex
                    Path = $file.FullName
                }
                Write-Host "❌ $($file.Name) ($arch): Alignment $alignWithHex (FAIL)" -ForegroundColor Red
                break # Only need to find one bad segment per file
            }
        }
        catch {
            Write-Warning "Could not parse alignment for $($file.Name): $alignWithHex"
        }
    }
    
    if (-not ($incompatibleFiles.File -contains $file.Name)) {
        Write-Host "✅ $($file.Name) ($arch): Checked (OK)" -ForegroundColor Green
    }
}

# Cleanup
Remove-Item -Path $TEMP_DIR -Recurse -Force

# Report
Write-Host "`nVerification Summary:" -ForegroundColor Cyan
if ($incompatibleFiles.Count -eq 0) {
    Write-Host "All native libraries are 16KB page compatible! 🎉" -ForegroundColor Green
} else {
    Write-Host "Found $($incompatibleFiles.Count) incompatible libraries:" -ForegroundColor Red
    $incompatibleFiles | Format-Table -AutoSize
    Write-Host "Action Required: Rebuild these libraries with NDK r27 or newer." -ForegroundColor Red
}
