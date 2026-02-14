# Panduan Lengkap SSH (Secure Shell)

Dokumen ini berisi panduan lengkap untuk mengatur SSH Key di GitHub dan cara menggunakan SSH untuk mengakses server (VPS).

## 1. Apa itu SSH?
SSH (Secure Shell) adalah protokol jaringan yang aman untuk mengakses komputer dari jarak jauh. Dalam konteks pengembangan web/aplikasi, SSH digunakan untuk:
- Mengupload kode ke GitHub tanpa memasukkan password setiap saat.
- Mengakses server (VPS) untuk deploy aplikasi.

---

## 2. Cara Mengatur SSH Key untuk GitHub (Windows)

Jika Anda ingin push kode ke GitHub tanpa password manual, ikuti langkah ini:

### Langkah 1: Cek apakah sudah punya SSH Key
Buka Terminal (PowerShell atau Git Bash) dan ketik:
```bash
ls ~/.ssh
```
Jika Anda melihat file bernama `id_rsa` dan `id_rsa.pub`, berarti Anda sudah punya key. Jika belum, buat baru.

### Langkah 2: Buat SSH Key Baru
Ketik perintah berikut di terminal (ganti email dengan email GitHub Anda):
```bash
ssh-keygen -t ed25519 -C "email_anda@example.com"
```
- Tekan **Enter** saat diminta lokasi penyimpanan (default).
- Tekan **Enter** saat diminta passphrase (kosongkan saja jika ingin login otomatis).

### Langkah 3: Ambil Public Key
Tampilkan key yang baru dibuat dengan perintah:
```bash
cat ~/.ssh/id_ed25519.pub
# Atau jika menggunakan RSA
cat ~/.ssh/id_rsa.pub
```
Salin seluruh teks yang muncul (dimulai dengan `ssh-ed25519` atau `ssh-rsa`).

### Langkah 4: Masukkan ke GitHub
1. Login ke GitHub.
2. Masuk ke **Settings** > **SSH and GPG keys**.
3. Klik **New SSH key**.
4. Beri judul (misal: "Laptop Windows Saya").
5. Paste key yang tadi disalin ke kolom "Key".
6. Klik **Add SSH key**.

### Langkah 5: Ubah Remote URL ke SSH
Agar project menggunakan SSH, ubah remote origin dari HTTPS ke SSH:
```bash
git remote set-url origin git@github.com:ahmad-muzayyin/chikoattendance.git
```

### Langkah 6: Test Koneksi
```bash
ssh -T git@github.com
```
Jika berhasil, Anda akan melihat pesan: *"Hi ahmad-muzayyin! You've successfully authenticated..."*

---

## 3. Cara Mengakses Server VPS Menggunakan SSH

Jika Anda memiliki server (misal di DigitalOcean, AWS, atau Biznet Gio), cara aksesnya adalah:

### Perintah Dasar
```bash
ssh username@ip_address_server
```
Contoh:
```bash
ssh root@103.123.45.67
```

### Menggunakan SSH Key (Tanpa Password)
1. Salin Public Key Anda ke server:
   ```bash
   # Jalankan di laptop Anda (bukan di server)
   type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh root@103.123.45.67 "cat >> .ssh/authorized_keys"
   ```
   *(Perintah di atas untuk PowerShell Windows. Jika Git Bash use `ssh-copy-id`)*

2. Login ulang:
   ```bash
   ssh root@103.123.45.67
   ```
   Sekarang Anda bisa masuk tanpa password!

## 4. Tips Keamanan SSH Server
- **Matikan Login Password**: Edit file `/etc/ssh/sshd_config` di server dan atur `PasswordAuthentication no`.
- **Gunakan Port Berbeda**: Ubah `Port 22` menjadi port lain (misal 2222) untuk menghindari brute force.
- **Fail2Ban**: Install Fail2Ban untuk memblokir IP yang mencoba login gagal berkali-kali.
