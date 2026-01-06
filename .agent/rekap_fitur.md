---
description: Rekapitulasi Fitur Lengkap Aplikasi Chiko Attendance
---

# Rekapitulasi Fitur Aplikasi Chiko Attendance

Dokumen ini merangkum seluruh fitur yang telah dibangun dan berfungsi dalam aplikasi Chiko Attendance (Mobile & Backend).

## 1. Autentikasi & Keamanan (Modul Auth)
- **Login Email/Password**: Login standar menggunakan kredensial yang tersimpan di database.
- **Login Google (OAuth)**: Integrasi native dengan Google Sign-In untuk kemudahan akses (dikhususkan untuk Owner/Admin).
- **Auto-Login**: Aplikasi mengingat sesi pengguna menggunakan SecureStore.
- **Biometric Lock (Fingerprint/FaceID)**: Fitur keamanan tambahan saat membuka aplikasi kembali tanpa perlu input password.
- **App Lock (PIN)**: Alternatif keamanan jika perangkat tidak mendukung biometrik.
- **Session Timeout & Refresh**: Token JWT untuk keamanan API.

## 2. Manajemen Pengguna (Modul User)
- **Multi-Role System**:
  - **Owner**: Akses penuh ke semua cabang dan laporan.
  - **Head (Kepala Toko)**: Manajemen karyawan di cabang masing-masing.
  - **Employee (Karyawan)**: Hanya bisa absen dan melihat riwayat pribadi.
- **CRUD Karyawan**: Tambah, Edit, Hapus data karyawan.
- **Custom Position**: Fleksibilitas menentukan jabatan karyawan (Koki, Kasir, dll) termasuk input manual.
- **Shift Assignment**: Mengatur jadwal shift kerja karyawan.

## 3. Manajemen Cabang (Modul Branch)
- **CRUD Cabang**: Menambah dan mengedit lokasi/cabang baru.
- **Geofencing**: Menentukan lokasi koordinat (Latitude/Longitude) dan radius toleransi absensi untuk setiap cabang.
- **Manajemen Jadwal Operasional**: Jam buka dan tutup toko per cabang.

## 4. Absensi & Kehadiran (Modul Attendance)
- **Check-In/Check-Out**: Pencatatan waktu masuk dan pulang real-time.
- **Validasi Lokasi (GPS)**: Karyawan hanya bisa absen jika berada dalam radius cabang (Geofencing).
- **Validasi Jaringan (WiFi)**: Opsi untuk membatasi absensi hanya via WiFi toko tertentu (Opsional).
- **Deteksi Keterlambatan**: Otomatis menandai "Telat" jika check-in melewati jam shift.
- **Selfie Absensi**: Bukti foto saat melakukan absensi (opsional, disiapkan di UI).
- **Riwayat Absensi**: Karyawan dapat melihat log kehadiran bulanan mereka.

## 5. Sistem Poin & Pelanggaran (Modul Points)
- **Sistem Pelanggaran**: Mencatat pelanggaran karyawan (misal: merokok di area dilarang, telat parah).
- **Sistem Reward**: Memberikan poin penghargaan untuk kinerja baik.
- **Reset Poin**: Mekanisme reset poin bulanan/tahunan.
- **Threshold**: Notifikasi atau sanksi otomatis jika poin pelanggaran mencapai batas tertentu.

## 6. Laporan & Rekapitulasi (Modul Report)
- **Dashboard Eksekutif**: Ringkasan data (Total Hadir, Telat, Izin) di halaman utama.
- **Laporan Harian (Real-time)**: Memantau siapa yang sedang bekerja *saat ini*.
- **Laporan Bulanan**: Rekapitulasi gaji (berdasarkan kehadiran), total jam kerja, dan denda keterlambatan.
- **Detail Karyawan**: Melihat performa individu secara mendetail.
- **Export Data**: (Disiapkan di Backend) Kemampuan untuk menarik data ke format Excel/PDF.

## 7. Notifikasi (Modul Notification)
- **Push Notification**: Pemberitahuan realtime ke HP karyawan (Check-in sukses, Pengumuman, Peringatan terlambat).
- **In-App Notification**: List notifikasi yang bisa dibaca ulang di dalam aplikasi.

## 8. UI/UX Modern
- **Splash Screen Branding**: Tampilan awal profesional dengan logo dan watermark.
- **Dark/Light Mode**: (Disiapkan di struktur tema).
- **Loading Animations**: Feedback visual saat aplikasi memproses data.
- **Responsive Design**: Tampilan menyesuaikan berbagai ukuran layar HP.

## 9. Infrastruktur Teknis
- **Backend**: Node.js + Express + TypeScript.
- **Database**: MySQL dengan Sequelize ORM.
- **Mobile**: React Native (Expo).
- **API**: RESTful API standar industri.
- **Deployment**: Workflow siap untuk build APK (Android) dan deploy VPS.
