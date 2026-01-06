---
description: Panduan Publikasi Aplikasi Chiko Attendance (Android APK & Backend)
---

# Panduan Publikasi Chiko Attendance (Production Ready)

Panduan ini menjelaskan cara membuild aplikasi mobile menjadi APK Android (Production) dan menyiapkan Backend agar bisa diakses secara publik, serta konfigurasi Google Login yang benar untuk versi Production.

## Tahap 1: Persiapan Google Cloud (Production)

Saat aplikasi sudah di-build menjadi APK, kita TIDAK LAGI menggunakan Client ID tipe Web maupun Proxy `auth.expo.io`. Kita akan menggunakan Client ID tipe **Android**.

1. **Dapatkan SHA-1 Keystore Production/Upload Key**
   - Jika menggunakan EAS Build (Disarankan): Expo akan mengelola keystore. Anda bisa melihat SHA-1 nanti setelah setup EAS.
   - Jika build manual lokal: Gunakan keystore release Anda.

2. **Buat/Edit Client ID Android di Google Cloud**
   - Buka Google Cloud Console > Credentials.
   - Buat Client ID baru > Tipe **Android**.
   - Masukkan Package name: `com.chiko.attendance`.
   - Masukkan SHA-1 Certificate Fingerprint (Disediakan oleh EAS Build nanti).
   - Simpan Client ID ini.

3. **Update `api.ts` untuk Production**
   - Di file `mobile/src/config/api.ts`, pastikan bagian `ANDROID` diisi dengan Client ID Android yang baru dibuat.
   - Bagian `WEB` tetap biarkan untuk backup/dev.

## Tahap 2: Build APK Android dengan EAS Build

Kita akan menggunakan layanan **EAS Build** dari Expo untuk membuat APK.

1. **Install EAS CLI** (Jika belum)
   ```powershell
   npm install -g eas-cli
   ```

2. **Login ke EAS**
   ```powershell
   eas login
   ```

3. **Konfigurasi Project**
   ```powershell
   eas build:configure
   ```
   - Pilih `Android`.
   - Ini akan membuat file `eas.json`.

4. **Edit `eas.json`**
   Tambahkan konfigurasi untuk build APK (preview/production):
   ```json
   {
     "build": {
       "preview": {
         "android": {
           "buildType": "apk"
         }
       },
       "production": {
         "android": {
           "buildType": "app-bundle"
         }
       }
     }
   }
   ```
   - Gunakan profile `preview` jika ingin file `.apk` yang bisa langsung diinstal di HP.
   - Gunakan profile `production` (AAB) jika ingin upload ke Play Store.

5. **Jalankan Build**
   ```powershell
   eas build -p android --profile preview
   ```
   - Tunggu proses antrean dan build di server Expo selesai.
   - Di akhir proses, Expo akan menampilkan **SH-1 Fingerprint** yang digunakan untuk signing. **COPY SHA-1 INI**.

6. **Daftarkan SHA-1 ke Google Cloud**
   - Kembali ke Google Cloud Console > Client ID Android Anda.
   - Masukkan SHA-1 yang didapat dari EAS Build tadi.
   - Tanpa langkah ini, Login Google di APK akan GAGAL (Error 10/12500).

## Tahap 3: Publikasi Backend (VPS/Hosting)

Backend Node.js harus online 24 jam agar APK bisa mengakses data. Laptop lokal tidak cukup.

1. **Sewa VPS (Virtual Private Server)**
   - Rekomendasi: DigitalOcean, Linode, atau IDCloudHost (Indonesia).
   - OS: Ubuntu 20.04/22.04.

2. **Setup Server**
   - Install Node.js, NPM, dan MySQL di server.
   - Clone repository backend chiko ke server.
   - Restore database `chiko_attendance.sql` ke MySQL server.

3. **Konfigurasi Environment Server (`.env`)**
   - Buat file `.env` di server.
   - Ganti `DB_HOST` dengan `localhost` (karena DB di server yang sama).
   - Ganti `GOOGLE_CLIENT_ID` dengan Web Client ID (untuk verifikasi token backend, sama seperti dev).

4. **Jalankan dengan PM2**
   - Gunakan `pm2` agar backend tetap jalan walau terminal ditutup.
   - `npm install -g pm2`
   - `pm2 start src/server.ts --name "chiko-backend" --interpreter ./node_modules/.bin/ts-node`

5. **Update URL di Mobile App**
   - Edit `mobile/src/config/api.ts`.
   - Ganti `BASE_URL` dari `http://192.168.x.x:3000/api` menjadi `http://IP_PUBLIC_VPS:3000/api` atau domain Anda (misal `https://api.chiko.com/api`).
   - Lakukan `eas build` ulang setelah mengganti URL ini.

## Tahap 4: Finalisasi Google Auth (Kode Mobile)

Agar kode mobile otomatis memilih strategi yang tepat (Proxy saat Development, Native saat Production):

1. **Pastikan Kode menggunakan `androidClientId`**
   Di `SecuritySettingsScreen` dan `LoginScreen`, pastikan hook `useAuthRequest` terisi lengkap:
   ```typescript
   const [request, response, promptAsync] = Google.useAuthRequest({
       androidClientId: 'CLIENT_ID_ANDROID_YANG_BARU', // Dipakai saat APK jadi
       webClientId: 'CLIENT_ID_WEB_DEV', // Dipakai saat Expo Go
       // redirectUri tidak perlu di-hardcode untuk native, biarkan library mengurusnya
   });
   ```

2. **Hapus/Kondisikan `redirectUri` Proxy**
   - Proxy `auth.expo.io` HANYA untuk development.
   - APK Production tidak butuh proxy.
   - Sebaiknya hapus properti `redirectUri` manual, atau buat logika:
     ```typescript
     redirectUri: makeRedirectUri({
        // Biarkan kosong agar auto-detect native scheme
     })
     ```
     *Catatan: Saat ini kode kita di-hardcode ke Proxy untuk memfixkan Dev. Nanti sebelum build production, hardcode ini sebaiknya dihapus.*

---
**Simpan panduan ini untuk referensi saat Anda siap melakukan deploy production.**
