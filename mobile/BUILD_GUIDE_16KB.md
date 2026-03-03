# Quick Build Guide - 16 KB Compliant AAB

## Method 1: EAS Build (RECOMMENDED - Easiest)

```bash
# Install EAS CLI if not already installed
npm install -g eas-cli

# Login to Expo account
eas login

# Build for Android (Cloud Build - Handles NDK automatically)
eas build --platform android --profile production

# Or build locally with EAS (requires Docker)
eas build --platform android --profile production --local
```

**Advantages:**
- ✅ Automatically installs NDK r27
- ✅ Handles all native dependencies
- ✅ Guaranteed 16 KB compliance
- ✅ No local Android SDK setup needed

---

## Method 2: Local Gradle Build

### Prerequisites:
1. Android Studio installed
2. NDK r27 (27.0.12077973) installed via SDK Manager

### Steps:

```bash
# 1. Navigate to project
cd "d:\AHMAD MUZAYYIN\ChikoAttendance\mobile"

# 2. Clean previous builds
cd android
.\gradlew clean

# 3. Build release AAB
.\gradlew bundleRelease

# 4. Find your AAB at:
# android\app\build\outputs\bundle\release\app-release.aab
```

### If NDK r27 Not Installed:

1. Open Android Studio
2. Tools → SDK Manager
3. SDK Tools tab
4. Check "Show Package Details"
5. Find "NDK (Side by side)"
6. Check version **27.0.12077973**
7. Click "Apply" to install

---

## Method 3: Expo Build (Alternative)

```bash
# Build with Expo (uses EAS under the hood)
npx expo build:android --type app-bundle
```

---

## After Building - Verification

### 1. Check AAB File
```bash
# AAB should be at one of these locations:
# EAS Build: Downloads from Expo dashboard
# Local Build: android\app\build\outputs\bundle\release\app-release.aab
```

### 2. Upload to Google Play Console
1. Go to Google Play Console
2. Select your app
3. Go to "Internal testing" or "Closed testing"
4. Create new release
5. Upload the AAB
6. **Check for warnings** - should see "✓ Supports 16 KB page sizes"

### 3. Test on Android 15 Device
```bash
# Create Android 15 emulator with 16 KB pages
# In Android Studio:
# Tools → Device Manager → Create Device
# Select: Pixel 8 or newer
# System Image: Android 15 (API 35)
# Advanced Settings → Boot option → Enable "16KB page size"
```

---

## Troubleshooting

### Build Fails with "NDK not found"
**Solution:** Install NDK r27 via Android Studio SDK Manager

### Build Fails with Kotlin/AGP errors
**Solution:** Run `expo prebuild --clean` then re-apply 16 KB configuration

### Google Play shows 16 KB warning
**Solution:** Verify NDK version in build:
```bash
# Check gradle.properties
cat android\gradle.properties | Select-String "ndkVersion"
# Should show: android.ndkVersion=27.0.12077973
```

### App crashes on Android 15
**Solution:** Check native dependencies - all should be 16 KB compatible

---

## Quick Checklist

Before uploading to Google Play:

- [ ] Built with NDK r27 or newer
- [ ] AGP 8.8.0 or newer
- [ ] Target SDK 35 (Android 15)
- [ ] Compile SDK 35
- [ ] No 4 KB-only native libraries
- [ ] Tested on Android 15 emulator
- [ ] No crashes on launch
- [ ] All features working

---

## Emergency Rollback

If you need to revert changes:

```bash
# 1. Restore package.json (add back expo-face-detector if needed)
# 2. Run:
git checkout android/build.gradle
git checkout android/gradle.properties
git checkout android/app/build.gradle
git checkout app.json

# 3. Rebuild:
npx expo prebuild --clean
```

---

## Support Resources

- [Google Play 16 KB Page Size Guide](https://developer.android.com/guide/practices/page-sizes)
- [React Native Android Build Guide](https://reactnative.dev/docs/signed-apk-android)
- [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [NDK Downloads](https://developer.android.com/ndk/downloads)

---

**Last Updated:** 2026-02-16
**Configuration Status:** ✅ Ready for 16 KB Compliance
**Next Step:** Build AAB using Method 1 (EAS) or Method 2 (Local)
