# 📱 Chiko Attendance System

**Chiko Attendance** adalah aplikasi sistem absensi mobile berbasis lokasi (GPS) dan biometrik wajah (Selfie) yang dirancang untuk manajemen karyawan multi-outlet. Aplikasi ini memastikan kehadiran yang akurat, real-time, dan meminimalkan kecurangan melalui validasi server-side yang ketat.

![Tech Stack](https://img.shields.io/badge/Stack-React%20Native%20%7C%20Node.js%20%7C%20Express%20%7C%20MySQL-blue)

---

## 🚀 Fitur Utama

### 1. Absensi & Validasi
- **📍 Geolocation Check:** Absensi hanya dapat dilakukan jika karyawan berada dalam radius yang ditentukan (default 100m) dari Outlet/Cabang.
- **📸 Selfie Verification:** Wajib mengambil foto selfie saat Check-In.
- **🛡️ Anti-Fraud Validation:**
  - Karyawan hanya bisa Check-In 1x dan Check-Out 1x per hari.
  - Tidak bisa Check-Out jika belum melakukan Check-In.
  - Sinkronisasi Waktu Server (WIB/Asia-Jakarta) anti-manipulasi jam lokal HP.

### 2. Manajemen Karyawan & Role
Aplikasi mendukung 3 Role utama:
- **👑 OWNER:**
  - Monitoring kehadiran seluruh karyawan di semua cabang secara Real-Time.
  - Melihat Rekap Bulanan dan Detail Harian.
  - Mengelola Data Cabang dan User.
  - Menerima notifikasi keterlambatan/awal pulang.
- **👔 KEPALA TOKO (HEAD):**
  - Mengelola operasional cabang sendiri.
  - **Fitur Khusus:** Peringatan otomatis jika durasi kerja kurang dari 8 jam.
- **👤 KARYAWAN:**
  - Absensi Harian.
  - Mengajukan Izin/Sakit.
  - Melihat Riwayat Kehadiran & Poin Pelanggaran.

### 3. Otomatisasi (Scheduler)
Backend dilengkapi dengan **Daily Scheduler** (Cron Job) yang berjalan otomatis setiap pukul **23:55 WIB**:
- Mendeteksi karyawan yang tidak absen tanpa keterangan.
- Otomatis menandai status **ALPHA**.
- Memberikan **Sanksi Poin Peanggaran** (Default: 20 Poin).
- Mengirim Notifikasi ke karyawan terkait.

### 4. Poin & Sanksi
- Sistem poin pelanggaran otomatis untuk Keterlambatan dan Alpha.
- Leaderboard karyawan paling rajin vs paling sering melanggar.

---

## 🛠️ Teknologi yang Digunakan

### Mobile App (Frontend)
- **Framework:** React Native (Expo SDK 52)
- **Language:** TypeScript
- **UI Library:** React Native Paper
- **Maps:** Expo Location & Google Maps Logic
- **State Management:** React Hooks
- **Storage:** Expo Secure Store (Token Caching)

### Backend (API)
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MySQL
- **ORM:** Sequelize
- **Auth:** JWT (JSON Web Token)
- **Scheduler:** Check-in/out logic & node-cron
- **Timezone:** Dikonfigurasi paksa ke `Asia/Jakarta`

---

## ⚙️ Instalasi & Menjalankan Project

### Prasyarat
- Node.js (v18+)
- MySQL Database
- Expo Go (untuk testing di HP)

### 1. Setup Backend
```bash
# Masuk ke folder backend
cd backend

# Install dependencies
npm install

# Setup Environment Variable
# Buat file .env dan isi konfigurasi DB & JWT
cp .env.example .env

# Jalankan Server (Development)
npm run dev

# Build & Run (Production/VPS)
npm run build
npm start
# Atau menggunakan PM2
pm2 start dist/server.js --name "chiko-backend"
```

**Konfigurasi .env Backend:**
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASS=password
DB_NAME=chiko_attendance
JWT_SECRET=rahasia_super_aman
TZ='Asia/Jakarta'
```

### 2. Setup Mobile (Frontend)
```bash
# Masuk ke folder mobile
cd mobile

# Install dependencies
npm install

# Konfigurasi API Endpoint
# Edit file src/config/api.ts atau gunakan .env
# EXPO_PUBLIC_API_URL=http://ip-vps-anda:3000/api

# Jalankan Expo
npx expo start -c
```

---

## 📝 Catatan Penting untuk Developer

1. **Sinkronisasi Waktu:**
   Seluruh logika waktu di Backend (`attendanceController.ts`, `adminController.ts`) telah dikunci menggunakan timezone `Asia/Jakarta`. Frontend hanya bertugas menampilkan string waktu yang dikirim Backend untuk menghindari perbedaan jam antara device User dan Owner.

2. **Logika Check-Out (Fix):**
   Pada menu Monitoring Owner, sistem akan selalu mengambil data Check-Out **Terakhir** (Latest) hari itu, bukan Check-Out pertama, untuk mengakomodasi update data jika terjadi kesalahan sistem sebelumnya.

3. **Deploy di VPS (Ubuntu):**
   Pastikan menggunakan `pm2` agar server backend tetap hidup (auto-restart).
   ```bash
   pm2 restart 0  # Restart server ID 0
   pm2 logs 0     # Cek log server
   ```

---

## ©️ License
Proyek Internal - Chiko Attendance (2025/2026).
