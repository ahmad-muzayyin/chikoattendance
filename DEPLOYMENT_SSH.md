# 🖥️ Deployment ChikoAttendance via SSH-in-Browser (Google Cloud Console)

## 📋 Persiapan Awal

### 1. Buat VM Instance di Compute Engine
1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Pilih/Buat Project "ChikoAttendance"
3. Menu: **Compute Engine** → **VM Instances** → **CREATE INSTANCE**
4. Konfigurasi:
   - **Name**: `chiko-server`
   - **Region**: `asia-southeast2 (Jakarta)` (terdekat dengan Indonesia)
   - **Zone**: `asia-southeast2-a`
   - **Machine type**: `e2-micro` (2 vCPU, 1 GB memory) - Free tier eligible
   - **Boot disk**: 
     - OS: **Ubuntu 22.04 LTS**
     - Size: **20 GB** (cukup untuk aplikasi kecil)
   - **Firewall**: 
     - ✅ Allow HTTP traffic
     - ✅ Allow HTTPS traffic
5. Klik **CREATE**

### 2. Setup Firewall Rules
```bash
# Di Cloud Console → VPC Network → Firewall → CREATE FIREWALL RULE
Name: allow-nodejs
Targets: All instances in the network
Source IP ranges: 0.0.0.0/0
Protocols and ports: tcp:3000
```

---

## 🚀 Deployment Step-by-Step via SSH-in-Browser

### Step 1: Buka SSH Terminal
1. Di halaman **VM Instances**, klik tombol **SSH** di samping instance `chiko-server`
2. Browser akan membuka terminal SSH

### Step 2: Update System & Install Dependencies
```bash
# Update package list
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version

# Install Git
sudo apt install -y git

# Install MySQL Server
sudo apt install -y mysql-server

# Install PM2 (Process Manager untuk keep app running)
sudo npm install -g pm2
```

### Step 3: Setup MySQL Database
```bash
# Start MySQL service
sudo systemctl start mysql
sudo systemctl enable mysql

# Secure MySQL installation
sudo mysql_secure_installation
# Jawab:
# - Set root password: YES → masukkan password (misal: ChikoPass123!)
# - Remove anonymous users: YES
# - Disallow root login remotely: YES
# - Remove test database: YES
# - Reload privilege tables: YES

# Login ke MySQL
sudo mysql -u root -p
# Masukkan password yang tadi dibuat
```

### Step 4: Buat Database
```sql
-- Di MySQL prompt:
CREATE DATABASE chiko_attendance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Buat user untuk aplikasi (lebih aman daripada pakai root)
CREATE USER 'chikoapp'@'localhost' IDENTIFIED BY 'ChikoAppPass123!';
GRANT ALL PRIVILEGES ON chiko_attendance.* TO 'chikoapp'@'localhost';
FLUSH PRIVILEGES;

-- Cek database
SHOW DATABASES;

-- Keluar dari MySQL
EXIT;
```

### Step 5: Clone Repository
```bash
# Buat folder untuk aplikasi
cd ~
mkdir apps
cd apps

# Clone repository (ganti dengan repo Anda)
# Option A: Jika sudah di GitHub
git clone https://github.com/YOUR_USERNAME/ChikoAttendance.git
cd ChikoAttendance

# Option B: Upload manual via SCP atau SFTP
# Atau bisa zip file lokal, upload ke Google Cloud Storage, lalu download
```

### Step 6: Upload Kode (Jika Belum di GitHub)

#### Cara 1: Via GitHub (Recommended)
```bash
# Di komputer lokal Anda:
cd "d:\AHMAD MUZAYYIN\ChikoAttendance"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ChikoAttendance.git
git push -u origin main

# Lalu di VM, clone seperti di Step 5
```

#### Cara 2: Via Google Cloud Storage
```bash
# Di komputer lokal:
# 1. Zip folder backend
# 2. Upload ke Cloud Console → Cloud Storage → CREATE BUCKET
# 3. Upload file zip

# Di VM SSH:
# Install gsutil (sudah terinstall di VM GCP)
gsutil cp gs://YOUR_BUCKET_NAME/backend.zip ~/apps/
unzip backend.zip
cd backend
```

#### Cara 3: Via Direct Copy-Paste (untuk file kecil)
```bash
# Buat file manual
mkdir -p ~/apps/ChikoAttendance/backend
cd ~/apps/ChikoAttendance/backend

# Copy paste package.json
nano package.json
# Paste isi file, Ctrl+X, Y, Enter

# Ulangi untuk file penting lainnya
```

### Step 7: Setup Backend
```bash
cd ~/apps/ChikoAttendance/backend

# Install dependencies
npm install

# Buat file .env
nano .env
```

Isi file `.env`:
```env
# Database
DB_HOST=localhost
DB_USER=chikoapp
DB_PASSWORD=ChikoAppPass123!
DB_NAME=chiko_attendance

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Server
PORT=3000
NODE_ENV=production
```
**Save**: `Ctrl+X` → `Y` → `Enter`

### Step 8: Build & Run Database Migration
```bash
# Build TypeScript
npm run build

# Run database sync (buat tabel)
node dist/syncDb.js

# Atau jika ada migration script:
npm run migrate
```

### Step 9: Start Backend dengan PM2
```bash
# Start aplikasi
pm2 start dist/server.js --name chiko-backend

# Setup auto-restart on reboot
pm2 startup
# Copy-paste command yang muncul, lalu jalankan

pm2 save

# Cek status
pm2 status
pm2 logs chiko-backend

# Monitoring
pm2 monit
```

### Step 10: Setup Nginx sebagai Reverse Proxy (Optional tapi Recommended)
```bash
# Install Nginx
sudo apt install -y nginx

# Buat konfigurasi
sudo nano /etc/nginx/sites-available/chiko
```

Isi konfigurasi:
```nginx
server {
    listen 80;
    server_name YOUR_VM_EXTERNAL_IP;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/chiko /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test konfigurasi
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Step 11: Test Backend
```bash
# Get VM External IP
curl ifconfig.me

# Test API
curl http://YOUR_VM_EXTERNAL_IP/
# atau
curl http://YOUR_VM_EXTERNAL_IP:3000/
```

### Step 12: Setup SSL dengan Let's Encrypt (Optional - untuk HTTPS)
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Dapatkan SSL certificate (ganti dengan domain Anda)
sudo certbot --nginx -d api.chikoattendance.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## 📱 Update Mobile App

### Edit API URL di Mobile
```bash
# Di komputer lokal, edit file:
# mobile/src/config/api.ts

export const API_CONFIG = {
  BASE_URL: 'http://YOUR_VM_EXTERNAL_IP', // atau https://api.yourdomain.com
};

# Rebuild mobile app
cd mobile
eas build --platform android
```

---

## 🔧 Maintenance Commands

### Melihat Logs
```bash
# PM2 logs
pm2 logs chiko-backend

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u nginx -f
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
cd ~/apps/ChikoAttendance/backend

# Pull latest code
git pull origin main

# Install new dependencies
npm install

# Rebuild
npm run build

# Restart
pm2 restart chiko-backend
```

### Backup Database
```bash
# Backup
mysqldump -u chikoapp -p chiko_attendance > backup_$(date +%Y%m%d).sql

# Restore
mysql -u chikoapp -p chiko_attendance < backup_20251228.sql
```

---

## 💰 Estimasi Biaya GCP VM

### e2-micro (Free Tier)
- **Specs**: 2 vCPU, 1 GB RAM
- **Cost**: **GRATIS** (1 instance per bulan di us-central1, us-west1, us-east1)
- **Di asia-southeast2**: ~$7-10/bulan

### e2-small (Recommended untuk Production)
- **Specs**: 2 vCPU, 2 GB RAM
- **Cost**: ~$15-20/bulan

### Tambahan:
- **Persistent Disk**: ~$2/bulan (20 GB)
- **Network Egress**: ~$1-5/bulan (tergantung traffic)
- **Total**: ~$10-30/bulan

---

## 🛡️ Security Best Practices

### 1. Firewall
```bash
# Hanya allow port yang diperlukan
sudo ufw enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw status
```

### 2. Disable Root Login
```bash
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart sshd
```

### 3. Setup Automatic Updates
```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 4. Monitor Resources
```bash
# Install htop
sudo apt install -y htop

# Monitor
htop

# Check disk usage
df -h

# Check memory
free -h
```

---

## 🚨 Troubleshooting

### Backend tidak jalan
```bash
pm2 logs chiko-backend
# Cek error di logs

# Restart
pm2 restart chiko-backend
```

### Database connection error
```bash
# Cek MySQL running
sudo systemctl status mysql

# Test connection
mysql -u chikoapp -p chiko_attendance

# Cek .env file
cat .env
```

### Port 3000 sudah dipakai
```bash
# Cek port
sudo lsof -i :3000

# Kill process
sudo kill -9 PID
```

### Nginx error
```bash
# Test config
sudo nginx -t

# Cek logs
sudo tail -f /var/log/nginx/error.log
```

---

## 📞 Quick Reference

### Start/Stop Services
```bash
# Backend
pm2 start chiko-backend
pm2 stop chiko-backend
pm2 restart chiko-backend

# Nginx
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx

# MySQL
sudo systemctl start mysql
sudo systemctl stop mysql
sudo systemctl restart mysql
```

### Monitoring
```bash
pm2 monit              # PM2 monitoring
htop                   # System resources
pm2 logs               # Application logs
sudo tail -f /var/log/nginx/access.log  # Nginx access log
```

---

**Selamat! Backend Anda sudah running di Google Cloud! 🎉**
