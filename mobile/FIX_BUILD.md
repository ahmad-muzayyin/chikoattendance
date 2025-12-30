# 🔧 Fix Build Issues - Quick Commands

## Run these commands in order:

```powershell
# 1. Install missing dependencies
npx expo install expo-font

# 2. Fix package versions
npx expo install --fix

# 3. Check if all fixed
npx expo doctor

# 4. Build APK
eas build --platform android --profile preview --clear-cache
```

## Note about Logo:
- Current logo is rectangular (12285x4220)
- Need square logo (1024x1024)
- New square logo generated: chiko_logo_square.png
- Copy to: mobile/assets/icon.png

## Manual Fix (if needed):
1. Replace mobile/assets/logo.png with square version
2. Or update app.json to use different icon file
