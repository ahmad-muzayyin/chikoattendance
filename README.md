# ChikoAttendance - Sistem Absensi Mobile

## 📱 Deskripsi
ChikoAttendance adalah aplikasi absensi mobile modern dengan desain profesional dan minimalis, didominasi warna **Merah Maroon (#ec1616)** yang elegan. Aplikasi ini dirancang untuk memudahkan karyawan dan pemilik usaha (Owner/Kepala Toko) dalam memantau kehadiran, keterlambatan, dan perizinan secara real-time dengan sistem hierarki yang jelas.

## 🎯 Hierarki & Role Management

### **Role Pengguna**
1. **OWNER** (Pemilik Usaha)
   - Akses penuh ke semua cabang dan karyawan
   - Dapat mengelola semua user (OWNER, HEAD, EMPLOYEE)
   - Menerima notifikasi dari HEAD
   - Dashboard global monitoring

2. **HEAD** (Kepala Toko/Cabang)
   - Mengelola karyawan di cabang sendiri
   - Dapat menambah/edit/hapus EMPLOYEE di cabangnya
   - **TIDAK DAPAT** mengelola user OWNER
   - Menerima notifikasi dari EMPLOYEE
   - Tab khusus "Tim" untuk manajemen staf

3. **EMPLOYEE** (Karyawan)
   - Absensi check-in/check-out
   - Pengajuan izin/sakit
   - Melihat riwayat dan poin sendiri
   - Notifikasi untuk diri sendiri

### **Sistem Notifikasi Hierarki**
```
EMPLOYEE → HEAD (Kepala Toko) → OWNER
```
- Notifikasi izin dari EMPLOYEE dikirim ke HEAD cabang tersebut
- Jika tidak ada HEAD, notifikasi langsung ke OWNER
- Notifikasi dari HEAD dikirim ke OWNER

## 🚀 Fitur Utama

### 1. **Absensi & Check-In**
- **Geofencing**: Karyawan hanya bisa absen dalam radius 50m dari lokasi cabang
- **Validasi Perangkat**: Memastikan karyawan absen menggunakan perangkat mobile yang valid
- **Deteksi Keterlambatan**:
  - Telat > 1 Jam: Otomatis dianggap **Setengah Hari**
  - Telat ≤ 1 Jam: Tercatat sebagai keterlambatan biasa
- **Sanksi Keterlambatan**:
  - Jika karyawan terlambat lebih dari **5 kali** dalam sebulan, sistem otomatis memberikan **Peringatan Pemotongan Gaji (Rp 50.000)** saat Check-In
  - Sanksi tercatat di sistem dan mempengaruhi rekap bulanan

### 2. **Check-Out & Lembur**
- **Lembur Otomatis**: Jika karyawan melakukan Check-Out lebih dari **3 jam** setelah jam pulang, sistem otomatis mencatatnya sebagai **Lembur (Overtime)**
- **Rekap Jam Kerja**: Menghitung total jam kerja harian secara otomatis

### 3. **Perizinan (Izin/Sakit)**
- **Pengajuan Izin**:
  - Karyawan memilih tanggal via Kalender
  - Mengisi jenis izin (Izin/Sakit) dan alasan detail
  - **Push Notification**: Notifikasi real-time terkirim ke HP Kepala Toko (atau Owner jika tidak ada HEAD)
- **Pembatalan Izin**:
  - Karyawan dapat membatalkan izin yang sudah diajukan
  - Pembatalan juga mengirim notifikasi pembatalan ke atasan

### 4. **Manajemen Staf (Khusus HEAD)**
- **Tab "Tim"**: Bottom navigation khusus untuk Kepala Toko
- **Tambah Karyawan**: 
  - Otomatis assign ke cabang HEAD
  - Set posisi (Koki, Kasir, Pelayan, Barista, Helper, Admin, Supervisor, atau custom)
  - Tidak bisa membuat user OWNER
- **Edit Karyawan**: 
  - Hanya karyawan di cabang sendiri
  - Tidak bisa edit user OWNER
- **Hapus Karyawan**: 
  - Hanya karyawan di cabang sendiri
  - Tidak bisa hapus user OWNER
- **Filter Otomatis**: Hanya menampilkan karyawan di cabang HEAD (OWNER tidak muncul)

### 5. **Sistem Notifikasi**
- **Real-time Push Notifications** menggunakan Expo Notifications
- **Notifikasi Tersimpan**: Semua notifikasi tersimpan di database
- **Badge Counter**: Menampilkan jumlah notifikasi belum dibaca
- **Hapus Notifikasi**: User dapat menghapus notifikasi individual
- **Mark as Read**: Tandai notifikasi sudah dibaca

### 6. **Dashboard Karyawan**
- Statistik Real-time bulan ini:
  - **Hadir (Hijau)**: Total kehadiran tepat waktu
  - **Telat (Kuning)**: Frekuensi keterlambatan
  - **Izin (Biru)**: Total hari izin/sakit
  - **Alpha (Merah)**: Ketidakhadiran tanpa keterangan
- **Visualisasi Modern**: Menggunakan grafik dan *glassmorphism card*
- **Live Clock & Greeting**: Penunjuk waktu server yang akurat

### 7. **Owner Mode (Pemilik)**
- **Monitoring Global**: Melihat seluruh cabang dan karyawan
- **Rekap Otomatis**: Laporan terpusat mengenai kehadiran semua pegawai
- **Push Notifications**: Menerima update instan tentang aktivitas dari HEAD
- **User Management**: Kelola semua user termasuk OWNER dan HEAD

## 🛠️ Teknologi

### Mobile (Frontend)
- **React Native** dengan **Expo SDK 52**
- **Expo Notifications** (Push Notif)
- **React Native Paper** (Modern UI Kit)
- **Axios** (API Networking)
- **Expo Secure Store** (Token Storage)
- **React Navigation** (Bottom Tabs & Stack Navigation)

### Backend
- **Express.js** (Node.js framework)
- **TypeScript** (Type Safety)
- **Sequelize** (ORM MySQL)
- **Expo Server SDK** (Push Notification Service)
- **JWT** (Keamanan Autentikasi)
- **MySQL** (Database Relasional)
- **bcrypt** (Password Hashing)

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Deskripsi | Role |
|--------|----------|-----------|------|
| POST | `/auth/login` | Login User (JWT) | All |
| GET | `/auth/me` | Get Current User Info | All |
| POST | `/auth/push-token` | Register Token Push Notif | All |
| PUT | `/auth/profile` | Update Profile | All |

### Attendance
| Method | Endpoint | Deskripsi | Role |
|--------|----------|-----------|------|
| POST | `/attendance/checkin` | Absen Masuk (Auto logic telat/sanksi) | EMPLOYEE, HEAD |
| POST | `/attendance/checkout` | Absen Pulang (Auto logic lembur) | EMPLOYEE, HEAD |
| POST | `/attendance/permit` | Pengajuan Izin (Notif ke Superior) | EMPLOYEE, HEAD |
| DELETE | `/attendance/permit/:date` | Pembatalan Izin (Notif ke Superior) | EMPLOYEE, HEAD |
| GET | `/attendance/calendar` | Riwayat Absensi (Hadir/Izin/Sakit/Alpha) | All |
| GET | `/attendance/stats` | Statistik Dashboard User | All |
| GET | `/attendance/recap` | Rekap Bulanan | All |

### Admin & User Management
| Method | Endpoint | Deskripsi | Role |
|--------|----------|-----------|------|
| GET | `/admin/employees` | Daftar Karyawan (Filtered by Role) | OWNER, HEAD |
| POST | `/admin/users` | Tambah User Baru | OWNER, HEAD |
| PUT | `/admin/users/:id` | Update User | OWNER, HEAD |
| DELETE | `/admin/users/:id` | Hapus User | OWNER, HEAD |
| GET | `/admin/monitoring` | Daily Monitoring | OWNER |
| GET | `/admin/attendance/:userId` | Employee Attendance Detail | OWNER |
| POST | `/admin/punishment` | Add Punishment | OWNER |

### Notifications
| Method | Endpoint | Deskripsi | Role |
|--------|----------|-----------|------|
| GET | `/notifications` | Get All Notifications | All |
| PUT | `/notifications/:id/read` | Mark as Read | All |
| PUT | `/notifications/read-all` | Mark All as Read | All |
| DELETE | `/notifications/:id` | Delete Notification | All |

### Branches
| Method | Endpoint | Deskripsi | Role |
|--------|----------|-----------|------|
| GET | `/branches` | Get All Branches | All |
| POST | `/branches` | Create Branch | OWNER |
| PUT | `/branches/:id` | Update Branch | OWNER |
| DELETE | `/branches/:id` | Delete Branch | OWNER |

### Settings
| Method | Endpoint | Deskripsi | Role |
|--------|----------|-----------|------|
| GET | `/admin/settings` | Get Settings | OWNER, HEAD |
| PUT | `/admin/settings` | Update Settings | OWNER, HEAD |

## 🗄️ Database Schema

### Users
- `id`, `name`, `email`, `passwordHash`, `role`, `branchId`, `position`, `profile_picture`, `pushToken`

### Branches
- `id`, `name`, `address`, `latitude`, `longitude`, `radius`, `checkInTime`, `checkOutTime`

### Attendance
- `id`, `userId`, `branchId`, `type`, `timestamp`, `latitude`, `longitude`, `isLate`, `overtimeHours`, `notes`

### Permits
- `id`, `userId`, `date`, `type`, `reason`, `status`

### Punishments
- `id`, `userId`, `points`, `reason`, `date`

### Notifications
- `id`, `userId`, `title`, `body`, `data`, `isRead`, `createdAt`

## ⚙️ Setup & Installation

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env dengan konfigurasi database Anda
npm run dev
```

### Mobile Setup
```bash
cd mobile
npm install
npx expo start
```

### Environment Variables (.env)
```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=chiko_attendance

# JWT
JWT_SECRET=your_secret_key

# Server
PORT=3000
```

## 📱 Panduan Penggunaan

### Untuk Karyawan (EMPLOYEE)
1. **Absensi**: Buka app → Tap tombol kamera → Scan QR Code cabang
2. **Izin**: Buka Kalender → Pilih tanggal → Ajukan Izin → Isi alasan
3. **Riwayat**: Lihat di tab Riwayat atau Kalender

### Untuk Kepala Toko (HEAD)
1. **Manajemen Tim**: Buka tab "Tim" → Lihat daftar karyawan cabang
2. **Tambah Karyawan**: Tap tombol "+" → Isi data → Pilih posisi → Simpan
3. **Edit Karyawan**: Tap ikon pensil → Edit data → Simpan
4. **Hapus Karyawan**: Tap ikon sampah → Konfirmasi
5. **Notifikasi**: Terima notifikasi izin dari karyawan di tab Notifikasi

### Untuk Owner (OWNER)
1. **Monitoring**: Lihat semua cabang dan karyawan
2. **User Management**: Kelola semua user termasuk HEAD
3. **Laporan**: Akses rekap lengkap semua cabang
4. **Notifikasi**: Terima notifikasi dari HEAD

## 🔒 Keamanan & Best Practices

### Implementasi Keamanan
- ✅ **JWT Authentication**: Semua endpoint dilindungi JWT
- ✅ **Role-Based Access Control (RBAC)**: Setiap endpoint memvalidasi role user
- ✅ **Password Hashing**: Menggunakan bcrypt dengan salt rounds 10
- ✅ **Branch Scoping**: HEAD hanya bisa akses data cabang sendiri
- ✅ **Hierarchy Protection**: HEAD tidak bisa mengelola OWNER
- ✅ **Input Validation**: Validasi data di backend
- ✅ **Geofencing**: Validasi lokasi saat absensi

### Rekomendasi Production
1. **Database**: 
   - Gunakan connection pooling
   - Backup otomatis harian
   - Index pada kolom yang sering di-query (userId, branchId, date)

2. **API**:
   - Rate limiting untuk mencegah abuse
   - CORS configuration yang proper
   - HTTPS only
   - Environment variables untuk sensitive data

3. **Mobile**:
   - Build production dengan `eas build`
   - Implementasi error boundary
   - Offline mode dengan local storage
   - Analytics tracking (Firebase/Sentry)

4. **Monitoring**:
   - Log semua error ke monitoring service
   - Track API performance
   - Monitor push notification delivery rate

## 🚀 Deployment ke Google Cloud Platform (GCP)

### Persiapan
1. **Buat Project GCP**
   - Buka [Google Cloud Console](https://console.cloud.google.com/)
   - Klik "New Project" → Beri nama "ChikoAttendance"
   - Aktifkan billing (diperlukan untuk Cloud Run & Cloud SQL)

2. **Install Google Cloud SDK**
   ```bash
   # Download dari https://cloud.google.com/sdk/docs/install
   gcloud init
   gcloud auth login
   ```

### Option 1: Deploy Backend ke Cloud Run (Recommended)

#### Step 1: Buat Dockerfile
Buat file `Dockerfile` di folder `backend/`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 8080
CMD ["node", "dist/server.js"]
```

#### Step 2: Build & Deploy
```bash
cd backend

# Set project ID
gcloud config set project YOUR_PROJECT_ID

# Build container image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/chiko-backend

# Deploy ke Cloud Run
gcloud run deploy chiko-backend \
  --image gcr.io/YOUR_PROJECT_ID/chiko-backend \
  --platform managed \
  --region asia-southeast2 \
  --allow-unauthenticated \
  --set-env-vars "DB_HOST=YOUR_CLOUD_SQL_IP,DB_USER=root,DB_PASSWORD=YOUR_PASSWORD,DB_NAME=chiko_attendance,JWT_SECRET=YOUR_SECRET"
```

#### Step 3: Setup Cloud SQL (MySQL)
```bash
# Buat Cloud SQL instance
gcloud sql instances create chiko-db \
  --database-version=MYSQL_8_0 \
  --tier=db-f1-micro \
  --region=asia-southeast2

# Set root password
gcloud sql users set-password root \
  --host=% \
  --instance=chiko-db \
  --password=YOUR_STRONG_PASSWORD

# Buat database
gcloud sql databases create chiko_attendance --instance=chiko-db

# Get connection name
gcloud sql instances describe chiko-db --format="value(connectionName)"
```

#### Step 4: Connect Cloud Run ke Cloud SQL
```bash
gcloud run services update chiko-backend \
  --add-cloudsql-instances=YOUR_PROJECT_ID:asia-southeast2:chiko-db \
  --set-env-vars "DB_HOST=/cloudsql/YOUR_PROJECT_ID:asia-southeast2:chiko-db"
```

### Option 2: Deploy ke App Engine

#### Step 1: Buat app.yaml
Buat file `app.yaml` di folder `backend/`:
```yaml
runtime: nodejs18

env_variables:
  DB_HOST: "YOUR_CLOUD_SQL_IP"
  DB_USER: "root"
  DB_PASSWORD: "YOUR_PASSWORD"
  DB_NAME: "chiko_attendance"
  JWT_SECRET: "YOUR_SECRET"

automatic_scaling:
  min_instances: 1
  max_instances: 10
```

#### Step 2: Deploy
```bash
cd backend
gcloud app deploy
```

### Setup Database Migration
```bash
# SSH ke Cloud SQL
gcloud sql connect chiko-db --user=root

# Atau gunakan Cloud SQL Proxy
cloud_sql_proxy -instances=YOUR_PROJECT_ID:asia-southeast2:chiko-db=tcp:3306

# Run migrations
npm run migrate
```

### Setup Custom Domain (Optional)
```bash
# Map domain ke Cloud Run
gcloud run domain-mappings create \
  --service=chiko-backend \
  --domain=api.chikoattendance.com \
  --region=asia-southeast2
```

### Monitoring & Logging
```bash
# View logs
gcloud run logs read chiko-backend --region=asia-southeast2

# Setup monitoring alerts
# Buka Cloud Console → Monitoring → Alerting
```

### Estimasi Biaya GCP (Per Bulan)
- **Cloud Run**: ~$5-20 (tergantung traffic)
- **Cloud SQL (db-f1-micro)**: ~$10-15
- **Cloud Storage**: ~$1-5
- **Total**: ~$16-40/bulan untuk usage ringan-menengah

### Tips Production
1. **Security**:
   - Gunakan Secret Manager untuk credentials
   - Enable Cloud Armor untuk DDoS protection
   - Setup VPC untuk isolasi network

2. **Performance**:
   - Enable Cloud CDN untuk static assets
   - Gunakan Cloud Memorystore (Redis) untuk caching
   - Setup Cloud Load Balancing

3. **Backup**:
   - Enable automated backups di Cloud SQL
   - Export database ke Cloud Storage secara berkala

4. **CI/CD**:
   - Setup Cloud Build untuk auto-deploy
   - Gunakan GitHub Actions + GCP integration

### Mobile App Distribution
1. **Build Production APK/IPA**:
   ```bash
   cd mobile
   eas build --platform android
   eas build --platform ios
   ```

2. **Publish**:
   - Android: Upload ke Google Play Console
   - iOS: Upload ke App Store Connect

3. **Update API URL**:
   - Edit `mobile/src/config/api.ts`
   - Ganti `BASE_URL` dengan URL Cloud Run Anda

---

## 📞 Support & Maintenance

### Troubleshooting
- **Error 403**: Pastikan role user sesuai dengan endpoint yang diakses
- **Notifikasi tidak masuk**: Cek pushToken sudah teregister
- **Geofencing gagal**: Pastikan GPS aktif dan permission granted
- **Database error**: Cek koneksi dan credentials

### Future Improvements
- [ ] Laporan PDF export
- [ ] Integrasi payroll
- [ ] Face recognition untuk absensi
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Offline mode dengan sync
- [ ] Analytics dashboard

---

**Dikembangkan dengan ❤️ oleh Tim ChikoAttendance**  
**Last Updated: Desember 2025**  
**Version: 2.0.0**
