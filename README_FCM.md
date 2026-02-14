# Panduan Setup Notifikasi FCM (Firebase Cloud Messaging)

Sistem sudah diupdate untuk mendukung **FCM Direct** (Rekomendasi Terbaik & Praktis).
Agar fitur ini berjalan 100%, Anda perlu menambahkan file kredensial dari Firebase.

## 1. Setup Backend
Anda perlu file **Service Account** agar server bisa mengirim pesan via FCM.

1. Buka [Firebase Console](https://console.firebase.google.com/).
2. Pilih Project Anda.
3. Masuk ke **Project Settings** > **Service accounts**.
4. Klik **Generate new private key**.
5. Simpan file JSON tersebut dengan nama: `serviceAccountKey.json`.
6. **Upload file tersebut ke folder root backend** (sejajar dengan `package.json` backend).
   - path: `backend/serviceAccountKey.json`

(Jika file ini tidak ada, backend akan otomatis fallback ke mode lama/Expo, namun fitur "High Priority" mungkin kurang optimal).

## 2. Setup Mobile App (Android)
Agar aplikasi mobile bisa menerima pesan FCM langsung:

1. Di Firebase Console, masuk ke **Project Settings** > **General**.
2. Pastikan ada aplikasi Android dengan package name: `com.chiko.attendance`.
3. Download file `google-services.json`.
4. Pada langkah **"Add Firebase SDK"** di Firebase Console, silakan klik **Next** (Lewati) karena konfigurasi SDK sudah ditangani secara otomatis oleh Expo Build Plugin.
5. **Upload file tersebut ke folder root mobile** (sejajar dengan `app.json`).
   - path: `mobile/google-services.json`

## 3. Build Ulang
Setelah menambahkan `google-services.json`, Anda harus melakukan build ulang APK agar config tersebut tertanam.
- `eas build -p android --profile production`

## Cara Kerja Sistem Baru
- **Saat Development (Expo Go):** Aplikasi akan menggunakan "Expo Push Token". Notifikasi tetap masuk via Expo Server.
- **Saat Production (APK):** Aplikasi otomatis mendeteksi konfigurasi FCM dan menggunakan "FCM Device Token". Notifikasi dikirim lansung via Google Server (Lebih Cepat & Stabil seperti WhatsApp).



```markdown
## Catatan Rilis (Changelog)
- Migrasi FCM API V1: Menggantikan API Legacy untuk keamanan dan performa lebih baik.
- Direct FCM Integration: Pengiriman notifikasi kini langsung ke Firebase tanpa perantara pihak ketiga di mode production.
- Auto-detection Logic: Sistem cerdas yang mendeteksi apakah aplikasi berjalan di Expo Go atau Standalone APK untuk menentukan jenis token yang digunakan.
- High Priority Support: Notifikasi tetap muncul meskipun aplikasi dalam keadaan background atau kill state.
```

