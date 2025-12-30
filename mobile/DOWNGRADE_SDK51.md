# 🔧 FIX: Downgrade to Expo SDK 51

## ❌ Current Issue:
```
Kotlin version 1.9.24 incompatible with Compose Compiler 1.5.15 (requires 1.9.25)
```

## ✅ Solution: Downgrade to Expo SDK 51

Expo SDK 51 is more stable for production builds.

### Step 1: Backup
```powershell
cd "d:\AHMAD MUZAYYIN\ChikoAttendance\mobile"
copy package.json package.json.sdk52.backup
```

### Step 2: Downgrade Expo
```powershell
npx expo install expo@~51.0.0
```

### Step 3: Fix Dependencies
```powershell
npx expo install --fix
```

### Step 4: Verify
```powershell
npx expo doctor
```

### Step 5: Build APK
```powershell
eas build --platform android --profile preview --clear-cache
```

---

## 📊 SDK Comparison:

| Feature | SDK 52 | SDK 51 |
|---------|--------|--------|
| Stability | ⚠️ New, has issues | ✅ Stable |
| Kotlin | 1.9.24 (incompatible) | 1.9.23 (compatible) |
| Build Success | ❌ Failed | ✅ Works |
| Production Ready | ⏳ Wait | ✅ Ready |

---

## 🚀 Quick Fix (All Commands):

```powershell
cd "d:\AHMAD MUZAYYIN\ChikoAttendance\mobile"
npx expo install expo@~51.0.0
npx expo install --fix
eas build --platform android --profile preview --clear-cache
```

---

**Estimated Time**: 15-20 minutes total
- Downgrade: 2-3 minutes
- Fix deps: 2-3 minutes  
- Build: 10-15 minutes
