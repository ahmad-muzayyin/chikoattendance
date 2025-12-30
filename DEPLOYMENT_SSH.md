# � Deployment SSH Commands - Update Backend

## ✅ Current Status
- SSH: Connected ✅
- PM2: Running ✅
- Backend: Online ✅

---

## 📝 Step-by-Step Update adminController.ts

### Step 1: Navigate to Backend Directory
```bash
cd chikoattendance/backend/src/controllers
```

### Step 2: Backup Current File
```bash
cp adminController.ts adminController.ts.backup
ls -lh adminController.ts*
```

### Step 3: Edit File with nano
```bash
nano adminController.ts
```

### Step 4: Find and Replace Code

**Press `Ctrl+W` to search, type:** `Tidak dapat mengedit user dari cabang lain`

**Find this code (around line 261-271):**
```typescript
        // Security for HEAD
        const authReq = req as any;
        if (authReq.user && authReq.user.role === 'HEAD') {
            // HEAD cannot edit OWNER users
            if (user.role === 'OWNER') {
                return res.status(403).json({ message: 'Anda tidak dapat mengedit user dengan role OWNER.' });
            }
            if (user.branchId !== authReq.user.branchId) {
                return res.status(403).json({ message: 'Tidak dapat mengedit user dari cabang lain.' });
            }
        }
```

**Replace with:**
```typescript
        // Security for HEAD
        const authReq = req as any;
        if (authReq.user && authReq.user.role === 'HEAD') {
            // HEAD cannot edit OWNER users
            if (user.role === 'OWNER') {
                return res.status(403).json({ message: 'Anda tidak dapat mengedit user dengan role OWNER.' });
            }
            // HEAD can only edit users in their branch
            if (user.branchId !== authReq.user.branchId) {
                return res.status(403).json({ message: 'Tidak dapat mengedit user dari cabang lain.' });
            }
            // HEAD cannot change user to different branch
            if (branchId && branchId !== authReq.user.branchId) {
                return res.status(403).json({ message: 'Anda tidak dapat memindahkan user ke cabang lain.' });
            }
            // Force branchId to HEAD's branch
            branchId = authReq.user.branchId;
        }
```

### Step 5: Save and Exit
- Press `Ctrl+O` (save)
- Press `Enter` (confirm)
- Press `Ctrl+X` (exit)

### Step 6: Verify Changes
```bash
grep "Force branchId" adminController.ts
```

**Expected output:**
```
            // Force branchId to HEAD's branch
```

### Step 7: Navigate to Backend Root
```bash
cd ~/chikoattendance/backend
```

### Step 8: Restart PM2
```bash
pm2 restart chiko-backend
```

### Step 9: Check Status
```bash
pm2 status
pm2 logs chiko-backend --lines 20
```

### Step 10: Test API
```bash
curl http://localhost:5000/api/health
```

---

## � Quick Commands (Copy-Paste)

```bash
# Navigate
cd ~/chikoattendance/backend/src/controllers

# Backup
cp adminController.ts adminController.ts.backup

# Edit
nano adminController.ts

# After editing, verify
grep "Force branchId" adminController.ts

# Restart
cd ~/chikoattendance/backend
pm2 restart chiko-backend
pm2 logs chiko-backend --lines 20
```

---

## ⚠️ If Rollback Needed

```bash
cd ~/chikoattendance/backend/src/controllers
cp adminController.ts.backup adminController.ts
cd ~/chikoattendance/backend
pm2 restart chiko-backend
```

---

## ✅ Success Indicators

1. ✅ Grep shows: `Force branchId to HEAD's branch`
2. ✅ PM2 status: `online`
3. ✅ No errors in logs
4. ✅ API responds: `{"status":"ok"}`

---

**Current Session:**
- User: muzayyin_rpl
- Server: absensichiko-28122005
- PM2 Status: Online (4 restarts)
- Memory: 97.9mb
