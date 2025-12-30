# 📱 Build APK - ChikoAttendance

## 🔍 **Current Issue**
- **Expo SDK**: 52.0.0
- **Problem**: Kotlin version incompatibility
- **Error**: Compose Compiler requires Kotlin 1.9.25, but project uses 1.9.24

---

## ✅ **Solution: Disable New Architecture**

### **Step 1: Update app.json**

Edit `mobile/app.json`, ubah line 32:

```json
{
  "expo": {
    ...
    "newArchEnabled": false,  // ← Ubah dari true ke false
    ...
  }
}
```

---

## 🚀 **Build APK Commands**

### **Method 1: EAS Build (Recommended)**

```powershell
# Navigate to mobile folder
cd "d:\AHMAD MUZAYYIN\ChikoAttendance\mobile"

# Login to EAS (jika belum)
eas login

# Build APK
eas build --platform android --profile preview --clear-cache

# Check build status
eas build:list

# Download APK setelah selesai
# Link download akan muncul di terminal atau cek di:
# https://expo.dev/accounts/[your-account]/projects/chiko-attendance/builds
```

---

### **Method 2: Local Build (Jika punya Android Studio)**

```powershell
# Generate Android project
npx expo prebuild --platform android --clean

# Build dengan Gradle
cd android
.\gradlew assembleRelease

# APK location:
# android/app/build/outputs/apk/release/app-release.apk
```

---

## 📋 **Pre-Build Checklist**

- [ ] `newArchEnabled: false` di app.json
- [ ] API_CONFIG.BASE_URL sudah production URL
- [ ] Icon & splash screen sudah benar
- [ ] Package name: `com.chiko.attendance`
- [ ] Version: `1.0.0`

---

## 🔧 **If Build Still Fails**

### **Option A: Downgrade to Expo SDK 51**

```powershell
cd "d:\AHMAD MUZAYYIN\ChikoAttendance\mobile"

# Backup
copy package.json package.json.backup

# Downgrade
npx expo install expo@~51.0.0

# Fix dependencies
npx expo install --fix

# Rebuild
eas build --platform android --profile preview --clear-cache
```

### **Option B: Update Kotlin Version**

Create `android/build.gradle` (if using local build):

```gradle
buildscript {
    ext {
        kotlinVersion = '1.9.25'  // Update version
    }
}
```

---

## 📊 **Build Profiles (eas.json)**

### **Preview (APK for Testing)**
```json
"preview": {
  "distribution": "internal",
  "android": {
    "gradleCommand": ":app:assembleRelease",
    "buildType": "apk"
  }
}
```

### **Production (AAB for Play Store)**
```json
"production": {
  "autoIncrement": true,
  "android": {
    "buildType": "app-bundle"
  }
}
```

---

## 🎯 **Expected Build Time**

- **EAS Build**: 10-15 minutes
- **Local Build**: 5-10 minutes (first time longer)

---

## ✅ **After Build Success**

1. Download APK
2. Transfer ke HP Android
3. Install APK
4. Test semua fitur:
   - Login
   - Check-in/Check-out
   - Camera
   - GPS
   - Notifications

---

## 🔐 **Signing (For Production)**

Jika mau upload ke Play Store:

```powershell
# Generate keystore
keytool -genkeypair -v -keystore chiko-attendance.jks -keyalg RSA -keysize 2048 -validity 10000 -alias chiko-attendance

# Add to eas.json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

---

## 📞 **Quick Commands**

```powershell
# Check EAS CLI version
eas --version

# Login
eas login

# Build preview APK
eas build -p android --profile preview

# Build production AAB
eas build -p android --profile production

# List builds
eas build:list

# Cancel build
eas build:cancel
```

---

## 🐛 **Common Errors & Solutions**

### **Error: "Kotlin version mismatch"**
**Solution**: Set `newArchEnabled: false` in app.json

### **Error: "Build failed: Gradle"**
**Solution**: Clear cache and rebuild
```powershell
eas build --platform android --profile preview --clear-cache
```

### **Error: "No EAS project found"**
**Solution**: Run `eas build:configure`

---

## 📝 **Notes**

- **Development**: Use Expo Go
- **Testing**: Use Preview APK
- **Production**: Use Production AAB for Play Store

**Current Status**: Ready to build after disabling newArchEnabled

---

**Last Updated**: 29 Desember 2025, 04:45 WIB
