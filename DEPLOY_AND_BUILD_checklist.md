# Panduan Build APK & Deployment (Production Ready)

Panduan ini dibuat khusus untuk deploy ke server **absensichiko-28122005** dan build APK.

## 1. Persiapan Akhir (Sebelum Push ke GitHub)

Sebelum Anda meng-upload kode ke GitHub, pastikan konfigurasi sudah diarahkan ke **ENVIRONMENT PRODUKSI**.

### A. Update `mobile/src/config/api.ts`
Buka file `mobile/src/config/api.ts` dan lakukan perubahan berikut agar aplikasi APK bisa terkoneksi ke Server Cloud (bukan localhost lagi).

1.  **Comment** bagian Development.
2.  **Un-comment** bagian Production.

```typescript
    // 1. DEVELOPMENT (Expo Go / Emulator)
    // BASE_URL: 'http://192.168.0.100:3000/api',  <-- BERIKAN KOMENTAR (//)

    // 2. PRODUCTION (VPS / Hosting)
    BASE_URL: 'http://34.50.89.217/api',  <-- HAPUS KOMENTAR (Aktifkan ini)
```

> **PENTING UNTUK GOOGLE AUTH:**
> Pastikan `GOOGLE_CLIENT_IDS.ANDROID` di file ini sudah menggunakan Client ID untuk Package Name:
> `com.chiko.attendance`
> (Bukan `host.exp.exponent` yang dipakai testing Expo Go).

---

## 2. Upload ke GitHub

Jalankan perintah berikut di terminal VS Code Anda:

```bash
git add .
git commit -m "Siap untuk produksi: Settings Page & Config API"
git push origin main
```

*(Sesuaikan nama branch jika Anda pakai 'master')*

---

## 3. Deploy Backend ke Server (VPS)

Login ke server Anda via SSH:
`ssh muzayyin_rpl@absensichiko-28122005`

Lalu update kode di server:

```bash
cd ~/chikoattendance
git pull origin main

# Update Backend
cd backend
npm install
npm run build 
pm2 restart all  # Atau nama service backend Anda
```

> **Cek Status:** Pastikan backend berjalan dengan `pm2 status`.

---

## 4. Cara Build APK (Android)

Anda bisa melakukan build APK menggunakan akun Expo (EAS Build).

### Opsi A: Build di Cloud (EAS)

Di terminal VS Code (Laptop):

```bash
cd mobile
eas build --platform android --profile preview
```

1.  Tunggu proses antrian (bisa 10-20 menit).
2.  Setelah selesai, Anda akan mendapat Link Download APK (`.apk`).
3.  Install APK tersebut di HP.
4.  **Google Login** akan berfungsi JIKA SHA-1 Fingerprint keystore build ini sudah didaftarkan di Google Cloud Console.

### Opsi B: Build Lokal (Jika sudah setup Android Studio)

Jika Anda ingin build offline (lebih cepat tapi butuh setup env):
```bash
cd mobile
npx expo prebuild
cd android
./gradlew assembleRelease
```
APK ada di: `android/app/build/outputs/apk/release/app-release.apk`

---

## 5. Troubleshooting Google Auth (Production)

Jika saat install APK, Login Google masih gagal:

1.  Buka **Google Play Console** (atau pakai command `keytool` di laptop).
2.  Cari **SHA-1 Certificate Fingerprint** dari file Keystore yang dipakai untuk build APK tersebut.
    *   (Jika pakai EAS, cek di website Expo > Project > Credentials).
3.  Masuk ke **Google Cloud Console** > **Credentials**.
4.  Pastikan SHA-1 tersebut sudah ditambahkan ke Client ID Android `com.chiko.attendance`.
