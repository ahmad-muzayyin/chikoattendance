# 16 KB Page Size Configuration Changes

## Summary of All Changes Made

This document lists every change made to achieve Google Play 16 KB page size compliance.

---

## File 1: `android/build.gradle`

### Changes:
1. Added explicit AGP version: `8.8.0`
2. Added explicit Kotlin version: `1.9.25`
3. Added NDK override block

### Full Modified Section:
```gradle
buildscript {
  repositories {
    google()
    mavenCentral()
  }
  dependencies {
        classpath 'com.google.gms:google-services:4.4.1'
    classpath('com.android.tools.build:gradle:8.8.0')  // ← ADDED VERSION
    classpath('com.facebook.react:react-native-gradle-plugin')
    classpath('org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.25')  // ← ADDED VERSION
  }
}

allprojects {
  repositories {
    google()
    mavenCentral()
    maven { url 'https://www.jitpack.io' }
  }
}

// ← ADDED THIS ENTIRE BLOCK
// Override NDK Version for 16 KB page size support
ext {
    ndkVersion = "27.0.12077973"
}

apply plugin: "expo-root-project"
apply plugin: "com.facebook.react.rootproject"
```

---

## File 2: `android/gradle.properties`

### Changes:
1. Added `android.ndkVersion` property
2. Added `android.experimental.enablePageSizeSupport` flag

### Added Lines (at end of file):
```properties
android.ndkVersion=27.0.12077973

# Enable 16 KB page size support (required for Google Play - Android 15+)
android.experimental.enablePageSizeSupport=true
```

---

## File 3: `android/app/build.gradle`

### Changes:
1. Added NDK ABI filters in `defaultConfig`

### Modified Section:
```gradle
android {
    ndkVersion rootProject.ext.ndkVersion

    buildToolsVersion rootProject.ext.buildToolsVersion
    compileSdk rootProject.ext.compileSdkVersion

    namespace 'id.chiko.absensi'
    defaultConfig {
        applicationId 'id.chiko.absensi'
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 5
        versionName "1.0.0"

        buildConfigField "String", "REACT_NATIVE_RELEASE_LEVEL", "\"${findProperty('reactNativeReleaseLevel') ?: 'stable'}\""
        
        // ← ADDED THIS ENTIRE BLOCK
        // Enable 16 KB page size support (Google Play requirement for Android 15+)
        ndk {
            abiFilters "armeabi-v7a", "arm64-v8a", "x86", "x86_64"
        }
    }
    // ... rest of file
}
```

---

## File 4: `app.json`

### Changes:
1. Updated NDK version in expo-build-properties

### Modified Section:
```json
{
  "expo": {
    "plugins": [
      "expo-font",
      "expo-notifications",
      [
        "expo-build-properties",
        {
          "android": {
            "usesCleartextTraffic": true,
            "newArchEnabled": false,
            "compileSdkVersion": 35,
            "targetSdkVersion": 35,
            "buildToolsVersion": "35.0.0",
            "ndkVersion": "27.0.12077973",  // ← CHANGED FROM 26.1.10909125
            "packagingOptions": {
              "jniLibs": {
                "useLegacyPackaging": false
              }
            }
          }
        }
      ],
      // ... rest of plugins
    ]
  }
}
```

---

## File 5: `package.json`

### Changes:
1. Removed `expo-face-detector` dependency

### Removed Line:
```json
// REMOVED THIS LINE:
"expo-face-detector": "^13.0.2",
```

### Reason:
- Not compatible with 16 KB page size
- App already has fallback logic
- Can be re-added when Expo releases compatible version

---

## Configuration Summary Table

| Setting | Old Value | New Value | File |
|---------|-----------|-----------|------|
| Android Gradle Plugin | (unversioned) | 8.8.0 | android/build.gradle |
| Kotlin Plugin | (unversioned) | 1.9.25 | android/build.gradle |
| NDK Version | 26.1.10909125 | 27.0.12077973 | android/build.gradle |
| NDK Version | 26.1.10909125 | 27.0.12077973 | android/gradle.properties |
| NDK Version | 26.1.10909125 | 27.0.12077973 | app.json |
| 16 KB Support Flag | (not set) | true | android/gradle.properties |
| NDK ABI Filters | (not set) | all 4 ABIs | android/app/build.gradle |
| expo-face-detector | ^13.0.2 | (removed) | package.json |

---

## Verification Commands

After applying these changes, verify with:

```bash
# Check NDK version in gradle.properties
cat android/gradle.properties | Select-String "ndkVersion"

# Check AGP version in build.gradle
cat android/build.gradle | Select-String "gradle:8"

# Check if expo-face-detector is removed
cat package.json | Select-String "face-detector"
```

Expected output:
```
android.ndkVersion=27.0.12077973
classpath('com.android.tools.build:gradle:8.8.0')
(no output - dependency removed)
```

---

## Important Notes

### ⚠️ Expo Prebuild Warning
Running `expo prebuild --clean` will **RESET** these changes in:
- `android/build.gradle`
- `android/gradle.properties`
- `android/app/build.gradle`

You will need to **re-apply** the changes after running prebuild.

### ✅ Safe to Modify
These files are **NOT** reset by prebuild:
- `app.json` - Changes persist
- `package.json` - Changes persist

### 🔄 Workflow
Recommended workflow:
1. Modify `app.json` and `package.json`
2. Run `expo prebuild --clean`
3. Re-apply changes to `android/build.gradle`, `android/gradle.properties`, `android/app/build.gradle`
4. Build AAB

---

## Testing Checklist

After applying all changes:

- [ ] All 5 files modified correctly
- [ ] NDK version is 27.0.12077973 in all locations
- [ ] AGP version is 8.8.0
- [ ] Kotlin version is 1.9.25
- [ ] 16 KB support flag is enabled
- [ ] NDK ABI filters are set
- [ ] expo-face-detector is removed
- [ ] `npm install` completed successfully
- [ ] `expo prebuild` completed successfully
- [ ] Re-applied native Android changes after prebuild
- [ ] Build command runs without errors
- [ ] AAB generated successfully
- [ ] No 16 KB warnings in Google Play Console

---

**Configuration Version:** 1.0
**Last Updated:** 2026-02-16
**Compliance Target:** Google Play 16 KB Page Size (Android 15+)
