# 🛠️ Panduan Build Release APK Secara Offline (Local Build)

Metode ini memungkinkan Anda membuat file APK (`app-release.apk`) langsung di komputer Anda tanpa menggunakan EAS Build cloud.

## 📋 Prasyarat

Pastikan lingkungan pengembangan Anda siap:
1. **Android Studio** terinstal.
2. **Android SDK** & **NDK** terkonfigurasi.
   - Versi NDK yang disarankan: `26.1.10909125` (sesuai `app.json`).
3. **Java JDK 17** (disarankan untuk React Native terbaru).

---

## 🚀 Langkah-langkah Build

### 1. Bersihkan & Generate Ulang Proyek Android

Jalankan perintah ini di terminal (`mobile/` folder):

```powershell
# Hapus folder android lama dan regenerate
npx expo prebuild --platform android --clean
```

### 2. Konfigurasi `local.properties`

Pastikan file `android/local.properties` ada dan berisi path ke SDK Anda.
Jika hilang, buat file baru di `mobile/android/local.properties` dengan isi:

```properties
sdk.dir=C\:\\Users\\MSI Indonesia\\AppData\\Local\\Android\\Sdk
```
*(Sesuaikan path jika berbeda di komputer Anda)*

### 3. Tambahkan Konfigurasi `pickFirst` (Penting!)

Jika build gagal karena konflik library C++ (`libc++_shared.so`), tambahkan ini ke `android/app/build.gradle` di dalam blok `packagingOptions { jniLibs { ... } }`:

```gradle
packagingOptions {
    jniLibs {
        // ... kode lama ...
        pickFirst 'lib/x86/libc++_shared.so'
        pickFirst 'lib/x86_64/libc++_shared.so'
        pickFirst 'lib/armeabi-v7a/libc++_shared.so'
        pickFirst 'lib/arm64-v8a/libc++_shared.so'
    }
}
```

### 4. Eksekusi Build

Jalankan perintah Gradle wrapper untuk membuat APK release:

```powershell
cd android
.\gradlew assembleRelease
```

---

## 📂 Lokasi File APK

Setelah berhasil, file APK akan berada di:
`mobile/android/app/build/outputs/apk/release/app-release.apk`

---

## ⚠️ Troubleshooting Build Error

Jika mengalami error **C++ Compilation** (`buildCMakeRelWithDebInfo failed`):
1. **NDK Version Mismatch**: Pastikan versi NDK yang terinstal di SDK Manager cocok dengan `26.1.10909125`.
2. **Long Path Issue (Windows)**: Path file terlalu panjang. Coba pindahkan proyek ke root drive (misal `D:\ChikoAttendance`).
3. **Clean Build**: Coba jalankan `.\gradlew clean` lalu build ulang.
4. **Android Studio**: Buka folder `android` di Android Studio untuk melihat log error yang lebih detail dan suggestions perbaikan otomatis.

---

## 🔐 Signing (Tanda Tangan Digital)

Build ini sekarang menggunakan **upload_key_reset.jks** yang baru dibuat.
Password keystore: `chiko123`
Key alias: `upload`
Key password: `chiko123`

Konfigurasi `build.gradle` sudah diperbarui otomatis untuk menggunakan key ini.

### PENTING: Reset Upload Key di Play Console
Karena password key lama hilang, Anda HARUS melakukan reset upload key:
1. Buka Google Play Console > Setup > App signing.
2. Pilih "Request upload key reset".
3. Pilih opsi "I lost my upload key".
4. Upload file sertifikat baru yang ada di `mobile/upload_cert.pem`.
5. Tunggu konfirmasi dari Google (biasanya 48 jam).
```
