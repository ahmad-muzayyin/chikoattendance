# PANDUAN INSTALL NDK r28 (28.0.12674087)

## ⚠️ SDKMANAGER TIDAK DITEMUKAN

Android SDK Command Line Tools tidak terinstall di sistem Anda.

---

## ✅ SOLUSI 1: INSTALL VIA ANDROID STUDIO (TERMUDAH)

### Langkah-langkah:

1. **Buka Android Studio**
   - Jika belum punya, download dari: https://developer.android.com/studio

2. **Buka SDK Manager**
   - Klik: `Tools` → `SDK Manager`
   - Atau: `File` → `Settings` → `Appearance & Behavior` → `System Settings` → `Android SDK`

3. **Pilih Tab "SDK Tools"**
   - Klik tab `SDK Tools` (di sebelah tab `SDK Platforms`)

4. **Centang "Show Package Details"**
   - Di pojok kanan bawah, centang checkbox `Show Package Details`

5. **Cari "NDK (Side by side)"**
   - Scroll ke bawah sampai ketemu `NDK (Side by side)`
   - Expand dengan klik tanda panah

6. **Pilih Versi 28.0.12674087**
   - Centang checkbox untuk versi: `28.0.12674087`
   - Pastikan HANYA versi ini yang dicentang

7. **Klik "Apply"**
   - Klik tombol `Apply` di pojok kanan bawah
   - Klik `OK` untuk konfirmasi download
   - Tunggu sampai download dan instalasi selesai (~500MB - 1GB)

8. **Verifikasi**
   - Setelah selesai, NDK r28 akan ada di:
   - `C:\Users\[USERNAME]\AppData\Local\Android\Sdk\ndk\28.0.12674087`

---

## ✅ SOLUSI 2: GUNAKAN EAS BUILD (TIDAK PERLU INSTALL NDK)

Jika Anda tidak ingin install NDK r28 secara manual, gunakan EAS Build yang akan menginstall NDK r28 otomatis di cloud:

```powershell
.\fix_and_build.ps1
```

atau

```bash
npx eas-cli build --platform android --profile production
```

### Keuntungan EAS Build:
- ✅ NDK r28 otomatis terinstall
- ✅ Tidak perlu download ~1GB NDK
- ✅ Tidak perlu install Android Studio
- ✅ Build di cloud, tidak pakai resource lokal
- ✅ Dijamin 16 KB compliant

---

## 📊 PERBANDINGAN

| Aspek | Install NDK Manual | EAS Build |
|-------|-------------------|-----------|
| Waktu Setup | ~30-60 menit | ~5 menit |
| Download Size | ~1GB | 0 (cloud) |
| Perlu Android Studio | Ya | Tidak |
| Build Time | Lokal (~10 menit) | Cloud (~15 menit) |
| Resource Lokal | Tinggi | Rendah |
| Kompleksitas | Sedang | Mudah |

---

## 🎯 REKOMENDASI

**Untuk kemudahan dan kecepatan, gunakan EAS Build (Solusi 2)**

Jika tetap ingin build lokal, ikuti Solusi 1 untuk install NDK r28 via Android Studio.

---

## 📝 SETELAH INSTALL NDK r28

Jika Anda sudah install NDK r28 via Android Studio:

1. **Verifikasi instalasi:**
   ```powershell
   # Cek apakah folder ini ada:
   Test-Path "$env:LOCALAPPDATA\Android\Sdk\ndk\28.0.12674087"
   ```

2. **Build AAB:**
   ```powershell
   cd android
   .\gradlew clean
   .\gradlew bundleRelease
   ```

3. **AAB akan ada di:**
   ```
   android\app\build\outputs\bundle\release\app-release.aab
   ```

---

**Tanggal:** 2026-02-16 19:15
**Status:** Menunggu instalasi NDK r28
**Rekomendasi:** Gunakan EAS Build untuk kemudahan
