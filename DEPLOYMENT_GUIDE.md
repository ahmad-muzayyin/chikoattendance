# 🚀 Deployment ChikoAttendance ke VM: absensichiko-28122005

## 📋 Informasi VM
- **VM Name**: `absensichiko-28122005`
- **Project**: ChikoAttendance
- **Region**: (Sesuai pilihan Anda di GCP)

---

## 🔧 Step-by-Step Deployment

### Step 1: Buka SSH Terminal
1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Menu: **Compute Engine** → **VM Instances**
3. Cari VM **`absensichiko-28122005`**
4. Klik tombol **SSH** → Terminal akan terbuka di browser

---

### Step 2: Install Dependencies (Copy-Paste Satu Per Satu)

```bash
# Update system
sudo apt update && sudo apt upgrade -y
```

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

```bash
# Verify Node.js
node --version
npm --version
```

```bash
# Install Git, MySQL, dan tools lainnya
sudo apt install -y git mysql-server nginx
```

```bash
# Install PM2 (Process Manager)
sudo npm install -g pm2
```

---

### Step 3: Setup MySQL Database

```bash
# Start MySQL
sudo systemctl start mysql
sudo systemctl enable mysql
```

```bash
# Secure MySQL (Ikuti prompt)
sudo mysql_secure_installation
```

**Jawaban untuk prompt:**
- Set root password? **YES** → Masukkan: `ChikoPass2025!`
- Remove anonymous users? **YES**
- Disallow root login remotely? **YES**
- Remove test database? **YES**
- Reload privilege tables? **YES**

```bash
# Login ke MySQL
sudo mysql -u root -p
# Password: ChikoPass2025!
```

**Di MySQL prompt, jalankan:**
```sql
CREATE DATABASE chiko_attendance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'chikoapp'@'localhost' IDENTIFIED BY 'ChikoApp2025!';

GRANT ALL PRIVILEGES ON chiko_attendance.* TO 'chikoapp'@'localhost';

FLUSH PRIVILEGES;

SHOW DATABASES;

EXIT;
```

---

### Step 4: Upload Kode ke VM

#### Option A: Via GitHub (Recommended)

**Di komputer lokal Anda (Windows):**
```powershell
# Buka PowerShell/Command Prompt
cd "d:\AHMAD MUZAYYIN\ChikoAttendance"

# Init Git (jika belum)
git init
git add .
git commit -m "Initial deployment to absensichiko-28122005"

# Push ke GitHub (ganti dengan repo Anda)
git remote add origin https://github.com/YOUR_USERNAME/ChikoAttendance.git
git branch -M main
git push -u origin main
```

**Kembali ke SSH VM:**
```bash
# Clone repository
cd ~
git clone https://github.com/YOUR_USERNAME/ChikoAttendance.git
cd ChikoAttendance/backend
```

#### Option B: Via Google Cloud Storage (Jika tidak pakai GitHub)

**Di komputer lokal:**
1. Zip folder `backend`: Klik kanan → Send to → Compressed folder
2. Buka Cloud Console → **Cloud Storage** → **CREATE BUCKET**
3. Nama bucket: `chiko-deployment`
4. Upload file `backend.zip`

**Di SSH VM:**
```bash
# Download dari Cloud Storage
cd ~
gsutil cp gs://chiko-deployment/backend.zip ~/
unzip backend.zip
cd backend
```

#### Option C: Manual Upload (Untuk testing cepat)

**Di SSH VM:**
```bash
# Buat struktur folder
mkdir -p ~/ChikoAttendance/backend
cd ~/ChikoAttendance/backend

# Buat package.json
nano package.json
```
Paste isi `package.json` Anda, lalu **Ctrl+X** → **Y** → **Enter**

Ulangi untuk file-file penting lainnya.

---

### Step 5: Setup Backend

```bash
cd ~/ChikoAttendance/backend

# Install dependencies
npm install
```

```bash
# Buat file .env
nano .env
```

**Paste konfigurasi ini:**
```env
# Database Configuration
DB_HOST=localhost
DB_USER=chikoapp
DB_PASSWORD=ChikoApp2025!
DB_NAME=chiko_attendance

# JWT Secret (GANTI dengan random string yang kuat!)
JWT_SECRET=absensichiko_secret_key_2025_change_this_to_random_string

# Server Configuration
PORT=3000
NODE_ENV=production

# Optional: Timezone
TZ=Asia/Jakarta
```

**Save:** `Ctrl+X` → `Y` → `Enter`

---

### Step 6: Build & Initialize Database

```bash
# Build TypeScript
npm run build
```

```bash
# Initialize database (buat tabel)
node dist/syncDb.js
```

**Output yang diharapkan:**
```
✅ Database synced successfully
✅ All models synchronized
```

---

### Step 7: Start Backend dengan PM2

```bash
# Start aplikasi
pm2 start dist/server.js --name chiko-backend
```

```bash
# Setup auto-restart saat VM reboot
pm2 startup
```

Copy-paste command yang muncul (biasanya dimulai dengan `sudo env PATH=...`), lalu jalankan.

```bash
# Save PM2 configuration
pm2 save
```

```bash
# Cek status
pm2 status
```

```bash
# Lihat logs
pm2 logs chiko-backend
```

---

### Step 8: Setup Nginx Reverse Proxy

```bash
# Buat konfigurasi Nginx
sudo nano /etc/nginx/sites-available/chiko
```

**Paste konfigurasi ini:**
```nginx
server {
    listen 80;
    server_name _;

    # Increase upload size limit
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

**Save:** `Ctrl+X` → `Y` → `Enter`

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/chiko /etc/nginx/sites-enabled/
```

```bash
# Remove default site
sudo rm /etc/nginx/sites-enabled/default
```

```bash
# Test konfigurasi Nginx
sudo nginx -t
```

```bash
# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

### Step 9: Setup Firewall

```bash
# Allow HTTP, HTTPS, dan custom port
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw enable
```

Ketik **Y** untuk konfirmasi.

```bash
# Cek status firewall
sudo ufw status
```

---

### Step 10: Get External IP & Test

```bash
# Dapatkan External IP VM
curl ifconfig.me
```

**Catat IP yang muncul** (misal: `34.101.xxx.xxx`)

```bash
# Test API
curl http://localhost:3000
```

**Buka browser di komputer lokal:**
```
http://34.101.xxx.xxx
```

Jika muncul response dari API, berarti **BERHASIL!** ✅

---

## 📱 Update Mobile App

### Edit API Configuration

**Di komputer lokal, edit file:**
`mobile/src/config/api.ts`

```typescript
export const API_CONFIG = {
  BASE_URL: 'http://34.101.xxx.xxx', // Ganti dengan IP VM Anda
};

export const ENDPOINTS = {
  LOGIN: '/auth/login',
  // ... endpoints lainnya
};
```

### Rebuild Mobile App

```bash
cd mobile

# Build untuk Android
eas build --platform android

# Atau untuk testing lokal
npx expo start
```

---

## 🔧 Maintenance Commands

### Melihat Status & Logs

```bash
# Status PM2
pm2 status

# Logs real-time
pm2 logs chiko-backend

# Logs 100 baris terakhir
pm2 logs chiko-backend --lines 100

# Monitoring resources
pm2 monit
```

### Restart Services

```bash
# Restart backend
pm2 restart chiko-backend

# Restart Nginx
sudo systemctl restart nginx

# Restart MySQL
sudo systemctl restart mysql
```

### Update Aplikasi

```bash
cd ~/ChikoAttendance/backend

# Pull latest code (jika pakai Git)
git pull origin main

# Install dependencies baru
npm install

# Rebuild
npm run build

# Restart
pm2 restart chiko-backend
```

### Backup Database

```bash
# Backup
mysqldump -u chikoapp -p chiko_attendance > ~/backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
mysql -u chikoapp -p chiko_attendance < ~/backup_20251228_223000.sql
```

---

## 🛡️ Security Checklist

### 1. Change Default Passwords
```bash
# MySQL root password
sudo mysql -u root -p
ALTER USER 'root'@'localhost' IDENTIFIED BY 'NewStrongPassword123!';
FLUSH PRIVILEGES;
EXIT;
```

### 2. Setup Automatic Security Updates
```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 3. Monitor Resources
```bash
# Install monitoring tools
sudo apt install -y htop

# Check resources
htop

# Disk usage
df -h

# Memory usage
free -h
```

---

## 🚨 Troubleshooting

### Backend tidak bisa diakses

```bash
# Cek PM2 status
pm2 status

# Cek logs untuk error
pm2 logs chiko-backend --err

# Restart
pm2 restart chiko-backend
```

### Database connection error

```bash
# Cek MySQL running
sudo systemctl status mysql

# Test connection
mysql -u chikoapp -p chiko_attendance

# Cek .env
cat ~/ChikoAttendance/backend/.env
```

### Nginx error

```bash
# Test config
sudo nginx -t

# Cek error logs
sudo tail -f /var/log/nginx/error.log

# Restart
sudo systemctl restart nginx
```

### Port sudah dipakai

```bash
# Cek port 3000
sudo lsof -i :3000

# Kill process (ganti PID dengan yang muncul)
sudo kill -9 PID
```

### Out of Memory

```bash
# Cek memory
free -h

# Restart PM2
pm2 restart all

# Jika perlu, upgrade VM ke e2-small (2GB RAM)
```

---

## 📊 Monitoring & Logs

### Real-time Monitoring

```bash
# PM2 monitoring dashboard
pm2 monit

# System resources
htop

# Network connections
sudo netstat -tulpn | grep LISTEN
```

### Log Locations

```bash
# PM2 logs
~/.pm2/logs/

# Nginx access log
sudo tail -f /var/log/nginx/access.log

# Nginx error log
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u nginx -f
```

---

## 🎯 Quick Reference

### Essential Commands

```bash
# Start/Stop/Restart Backend
pm2 start chiko-backend
pm2 stop chiko-backend
pm2 restart chiko-backend
pm2 delete chiko-backend

# View logs
pm2 logs chiko-backend
pm2 logs chiko-backend --lines 50

# Save PM2 config
pm2 save

# Nginx
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo nginx -t

# MySQL
sudo systemctl start mysql
sudo systemctl stop mysql
sudo systemctl restart mysql

# Get VM IP
curl ifconfig.me
```

### File Locations

```bash
# Backend code
~/ChikoAttendance/backend/

# Environment config
~/ChikoAttendance/backend/.env

# Nginx config
/etc/nginx/sites-available/chiko

# PM2 logs
~/.pm2/logs/

# Database backups
~/backup_*.sql
```

---

## ✅ Deployment Checklist

- [ ] VM `absensichiko-28122005` sudah running
- [ ] Node.js 18.x terinstall
- [ ] MySQL database `chiko_attendance` sudah dibuat
- [ ] User MySQL `chikoapp` sudah dibuat dengan privileges
- [ ] Kode backend sudah di-upload ke VM
- [ ] File `.env` sudah dikonfigurasi dengan benar
- [ ] `npm install` berhasil
- [ ] `npm run build` berhasil
- [ ] Database sync berhasil (`node dist/syncDb.js`)
- [ ] PM2 running (`pm2 status` menunjukkan online)
- [ ] Nginx configured dan running
- [ ] Firewall rules sudah diset
- [ ] External IP sudah dicatat
- [ ] API bisa diakses dari browser
- [ ] Mobile app sudah update BASE_URL
- [ ] Testing login/register berhasil

---

## 🎉 Selamat!

Backend ChikoAttendance Anda sudah running di VM **`absensichiko-28122005`**!

**Next Steps:**
1. Test semua fitur (login, absensi, izin, notifikasi)
2. Setup SSL dengan Let's Encrypt (optional)
3. Setup domain custom (optional)
4. Monitor logs dan performance
5. Setup automated backups

**Support:**
- Jika ada error, cek `pm2 logs chiko-backend`
- Untuk troubleshooting, lihat section 🚨 Troubleshooting di atas

---

**Deployed on VM: absensichiko-28122005**  
**Last Updated: 28 Desember 2025**
