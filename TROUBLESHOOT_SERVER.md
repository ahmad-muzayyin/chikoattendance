# 🔧 Troubleshooting: Gagal Terhubung ke Server

## ❌ **Error:**
```
Gagal terhubung ke server (http://34.50.89.217/api)
```

---

## ✅ **Solutions:**

### **1. Cek Status Server (SSH)**

```bash
# SSH ke server
gcloud compute ssh chiko-attendance-vm --zone=asia-southeast2-a

# Cek PM2 status
pm2 status

# Expected output:
# ┌─────┬──────────────────┬─────────┬─────────┬──────────┐
# │ id  │ name             │ status  │ restart │ uptime   │
# ├─────┼──────────────────┼─────────┼─────────┼──────────┤
# │ 0   │ chiko-backend    │ online  │ 15      │ 2h       │
# └─────┴──────────────────┴─────────┴─────────┴──────────┘
```

---

### **2. Jika Backend Offline:**

```bash
# Restart PM2
pm2 restart chiko-backend

# Check logs
pm2 logs chiko-backend --lines 50

# If still not working, start from scratch
cd ~/chikoattendance/backend
pm2 delete chiko-backend
pm2 start dist/server.js --name chiko-backend
pm2 save
```

---

### **3. Cek Nginx:**

```bash
# Check nginx status
sudo systemctl status nginx

# If not running
sudo systemctl start nginx
sudo systemctl enable nginx

# Test nginx config
sudo nginx -t

# Reload nginx
sudo nginx -s reload
```

---

### **4. Cek Firewall:**

```bash
# Check if port 80 is open
sudo ufw status

# If firewall is active, allow HTTP
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

---

### **5. Test dari Server:**

```bash
# Test local
curl http://localhost:3000/api/branches

# Test external
curl http://34.50.89.217/api/branches

# Expected: {"message":"Access token required"}
```

---

### **6. Cek Database:**

```bash
# Check MySQL status
sudo systemctl status mysql

# If not running
sudo systemctl start mysql

# Test connection
mysql -u chikoapp -p chiko_attendance
# Enter password: chiko123
```

---

## 🔍 **Common Issues:**

| Issue | Solution |
|-------|----------|
| PM2 offline | `pm2 restart chiko-backend` |
| Nginx not running | `sudo systemctl start nginx` |
| Port blocked | `sudo ufw allow 80/tcp` |
| Database down | `sudo systemctl start mysql` |
| Wrong IP | Verify: `curl ifconfig.me` |

---

## 📱 **Test dari Mobile:**

### **Method 1: Browser Test**
1. Buka browser di HP
2. Go to: `http://34.50.89.217/api/branches`
3. Should see: `{"message":"Access token required"}`

### **Method 2: Expo App**
1. Open app
2. Try login
3. Check console logs in terminal

---

## 🚀 **Quick Fix Commands:**

```bash
# SSH to server
gcloud compute ssh chiko-attendance-vm --zone=asia-southeast2-a

# Restart everything
pm2 restart chiko-backend
sudo systemctl restart nginx
sudo systemctl restart mysql

# Check status
pm2 status
sudo systemctl status nginx
sudo systemctl status mysql

# Test API
curl http://localhost:3000/api/branches
curl http://34.50.89.217/api/branches
```

---

## ✅ **Success Indicators:**

- ✅ PM2 status: `online`
- ✅ Nginx status: `active (running)`
- ✅ MySQL status: `active (running)`
- ✅ `curl http://34.50.89.217/api/branches` returns JSON
- ✅ Mobile app can login

---

## 📞 **Need Help?**

1. Check PM2 logs: `pm2 logs chiko-backend`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Check system logs: `sudo journalctl -xe`

---

**Most Common Fix**: Just restart PM2!

```bash
pm2 restart chiko-backend
```
