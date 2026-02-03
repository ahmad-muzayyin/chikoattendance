# Panduan Deploy Update (Export Excel/PDF)

Berikut adalah langkah-langkah untuk mengupdate server dengan fitur baru (Export Excel/PDF dan perbaikan Lokasi).

## 1. Login ke Server via SSH
Buka terminal (CMD/PowerShell) dan login ke server Anda:
```bash
ssh username@34.126.121.250
# Masukkan password jika diminta
```
*(Ganti `username` dengan user server Anda, misal `root` atau `admin`)*

## 2. Masuk ke Folder Project Backend
Arahkan ke direktori backend aplikasi Chiko Attendance. Sesuaikan path jika berbeda.
```bash
cd /path/to/chiko-attendance/backend
# Contoh umum:
# cd /var/www/chiko-attendance/backend
# atau
# cd ~/chiko-attendance/backend
```

## 3. Ambil Update Terbaru (Git Pull)
Tarik kode terbaru yang baru saja di-upload:
```bash
git pull origin main
```

## 4. Install Library Baru
Karena ada fitur Excel & PDF, kita perlu menginstall library tambahan (`exceljs`, `pdfkit-table`) yang baru ditambahkan ke `package.json`.
```bash
npm install
# atau
# yarn install
```

## 5. Build Ulang (Jika menggunakan TypeScript / Build step)
Jika Anda menjalan server dari folder `dist` (mode produksi), lakukan build ulang:
```bash
npm run build
```

## 6. Restart Server Backend
Restart proses backend agar perubahan kode dan routing baru terbaca. Jika menggunakan `pm2`:
```bash
pm2 restart all
# Atau restart spesifik ID/Nama app backend, misal:
# pm2 restart chiko-backend
```

## 7. Cek Server Berjalan
Pastikan tidak ada error setelah restart:
```bash
pm2 logs
```

---
**Selesai!** Fitur export Excel dan PDF sekarang sudah live di server.
Untuk Aplikasi Mobile (Android), karena perubahan hanya pada logic JS (React Native) dan tidak menambha library native baru yang berat (hanya `expo-file-system` dan `sharing` yang biasanya sudah include di Expo Go / Development Build standar, tapi jika error di production APK, Anda mungkin perlu membuat **Development Build** baru atau **APK Baru**).

Namun, untuk **Export Excel/PDF**, logic utamanya ada di **Backend**, jadi update backend adalah kunci utamanya. Update mobile app diperlukan untuk memunculkan tombol downloadnya.
