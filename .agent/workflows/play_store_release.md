---
description: Panduan build dan rilis aplikasi ke Google Play Store
---

# 🚀 Build & Upload ke Play Store

Workflow ini akan memandu Anda untuk membuat file AAB (Android App Bundle) yang siap diupload ke Google Play Store.

## 1. Persiapan Build

Pastikan konfigurasi di `app.json` sudah benar (Versi, Permissions).
*Sudah dikonfigurasi otomatis oleh Agent: Versi 1.1.0*

## 2. Jalankan Build

Jalankan perintah berikut di terminal folder `mobile`:

```bash
cd mobile
eas build --platform android --profile production
```

> **Catatan:**
> - Jika diminta login, login dengan akun Expo Anda.
> - Proses build dilakukan di cloud Expo dan memakan waktu 15-30 menit.
> - Setelah selesai, Anda akan mendapatkan link download file `.aab`.

## 3. Upload ke Google Play Console

1. Buka [Google Play Console](https://play.google.com/console)
2. Pilih Aplikasi Anda
3. Masuk ke menu **Testing > Internal testing** (untuk tes awal) atau **Production**
4. Klik **Create new release**
5. Upload file `.aab` yang baru didownload
6. Isi Release Notes
7. Review & Release!

## ✅ Checklist Release 1.1.0

- [x] Fitur Foto Absensi (Check-in & Check-out separate)
- [x] Notifikasi Checkout berbasis Shift
- [x] Statistik Karyawan di Dashboard Owner
- [x] Perbaikan Indikator Status (Alpha, Telat, dll)
