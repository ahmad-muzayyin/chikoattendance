# Panduan Update Aplikasi di Server (Pull & Deploy)

Dokumen ini menjelaskan cara melakukan update aplikasi (Backend/Frontend) yang sudah berjalan di server (VPS) menggunakan SSH dan Git.

## 1. Persiapan (Di Laptop/Lokal)
Sebelum melakukan pull di server, pastikan kode terbaru sudah **di-upload (push)** ke GitHub.
1. Buka terminal di project lokal.
2. Jalankan:
   ```bash
   git add .
   git commit -m "Update fitur absensi dan perbaikan bug"
   git push origin main
   ```
   *(Pastikan tidak ada error saat push)*

## 2. Masuk ke Server (SSH)
Gunakan terminal (PowerShell/CMD/Git Bash) untuk masuk ke server Anda.
```bash
ssh root@IP_ADDRESS_SERVER
# Contoh: ssh root@103.150.10.20
```
*Masukkan password jika diminta.*

## 3. Proses Pull (Update Kode)
Setelah masuk ke server, arahkan ke folder aplikasi Anda.

### Langkah 1: Masuk ke Folder Project
```bash
cd /path/to/chikoattendance
# Contoh umum: cd /var/www/chikoattendance atau cd ~/chikoattendance
```

### Langkah 2: Ambil Kode Terbaru (Pull)
Jalankan perintah ini untuk mengambil perubahan dari GitHub:
```bash
git pull origin main
```
*Jika diminta username/password dan gagal, Anda mungkin perlu menyeting SSH Key di server juga (lihat bagian bawah).*

### Langkah 3: Install Dependency (Jika Ada Perubahan Library)
Jika Anda menambahkan library baru (misal `npm install ...`), jalankan:
```bash
# Untuk Backend
cd backend
npm install
npm run build  # Wajib compile ulang TypeScript!

# Untuk Frontend (Jika ada perubahan web admin)
# cd ../frontend
# npm install
# npm run build
```

### Langkah 4: Restart Aplikasi
Agar perubahan terbaca, restart aplikasi menggunakan PM2 (Process Manager).
```bash
# Cek daftar proses yang jalan
pm2 list

# Restart semua
pm2 restart all

# Atau restart spesifik (misal hanya backend)
pm2 restart chiko-backend
```

---

## Troubleshooting (Jika Gagal Pull)
### Masalah: "Permission denied (publickey)" saat git pull
Ini berarti server Anda belum punya akses ke GitHub. Solusinya:

1. **Buat SSH Key di Server:**
   ```bash
   ssh-keygen -t ed25519 -C "server_chiko"
   cat ~/.ssh/id_ed25519.pub
   ```
2. **Copy Key tersebut.**
3. **Masukkan ke GitHub:**
   - Buka Repository ChikoAttendance di GitHub.
   - Masuk ke **Settings** > **Deploy Keys**.
   - Klik **Add deploy key**, paste key tadi, dan centang "Allow write access" (opsional).

### Masalah: Konflik (Merge Conflict)
Jika muncul pesan *error: Your local changes to the following files would be overwritten by merge*, artinya ada perubahan di server yang belum disimpan.
Solusi aman (timpa perubahan server dengan yang baru):
```bash
git reset --hard origin/main
git pull
```
