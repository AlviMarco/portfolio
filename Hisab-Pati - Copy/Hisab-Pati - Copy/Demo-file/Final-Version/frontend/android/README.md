# Android Project - Hisab Pati

## ⚡ Quick Start

```bash
# 1. Set up Android SDK path
cp local.properties.example local.properties
# Edit local.properties and add your Android SDK path

# 2. Build APK
./gradlew build

# 3. Install on device
./gradlew installDebug

# 4. Or open in Android Studio
# File → Open → Select this android folder
```

## 📁 What's Here

- **app/** - Main Android application
  - **src/main/java/** - Java source code (MainActivity, plugins)
  - **src/main/res/** - Android resources (strings, styles, colors)
  - **AndroidManifest.xml** - App configuration & permissions
  - **build.gradle** - App-level build configuration

- **gradle/** - Gradle wrapper scripts and properties
- **build.gradle** - Root build configuration
- **settings.gradle** - Project structure

## ✅ What's Configured

- ✅ Capacitor bridge for React app loading
- ✅ All required permissions (minimal & compliant)
- ✅ PDF download & file opening
- ✅ IndexedDB persistence
- ✅ Offline-first support
- ✅ WebView optimization for our app

## 📱 Build Variants

### Debug (for development)
```bash
./gradlew assembleDebug
# Output: app/build/outputs/apk/debug/app-debug.apk
```

### Release (for Play Store)
```bash
./gradlew assembleRelease
# Output: app/build/outputs/apk/release/app-release-unsigned.apk
# Then sign with your keystore
```

### Bundle (Play Store preferred)
```bash
./gradlew bundleRelease
# Output: app/build/outputs/bundle/release/app-release.aab
```

## 🔑 Key Files

| File | Purpose |
|------|---------|
| `build.gradle` | Root Gradle configuration |
| `app/build.gradle` | App-level Gradle configuration |
| `AndroidManifest.xml` | App manifest (permissions, activities) |
| `app/src/main/java/MainActivity.java` | Entry point (Capacitor bridge) |
| `app/src/main/res/values/*.xml` | App resources (strings, colors, styles) |

## 🔒 Permissions

Only minimal permissions declared:
- `INTERNET` - For optional cloud sync (Google Drive, AI insights)
- `ACCESS_NETWORK_STATE` - To detect offline status

**No storage permissions** - Uses Scoped Storage (app-private Documents folder)

## 🚀 First-Time Setup

### 1. Configure SDK Path
```bash
# Copy template
cp local.properties.example local.properties

# Edit and add your SDK path:
# sdk.dir=/Users/username/Library/Android/sdk (Mac)
# sdk.dir=C:\\Users\\username\\AppData\\Local\\Android\\sdk (Windows)
# sdk.dir=/home/username/Android/sdk (Linux)
```

### 2. Install Dependencies
```bash
# Android Studio will prompt you to:
# - Install SDK 34 (latest API)
# - Install Android SDK Tools
# - Install Gradle (handled by wrapper)
```

### 3. Build
```bash
./gradlew build
```

## 🎯 Features Working on Android

- ✅ Dashboard (full data from IndexedDB)
- ✅ Accounting Ledger (CRUD operations)
- ✅ Inventory Management (full support)
- ✅ Financial Reports (P&L, BS, TB, CF)
- ✅ PDF Generation & Export
- ✅ Offline-first operation
- ✅ Multi-company support
- ✅ Dark mode
- ✅ All settings and configuration

## 🧪 Test Before Publishing

```bash
# Install on real device
adb install -r app/build/outputs/apk/debug/app-debug.apk

# Test scenarios:
# 1. Turn off WiFi - all features still work
# 2. Open ledger, create transaction - works offline
# 3. Generate report - PDF creates correctly
# 4. Export PDF - downloads to Documents folder
# 5. Reconnect WiFi - cloud features work
```

## 📊 Build Output Sizes

| Type | Size | Use Case |
|------|------|----------|
| Debug APK | ~50 MB | Testing on emulator/device |
| Release APK | ~35 MB | Standalone installation |
| Release AAB | ~20 MB | Google Play Store |

## 🔗 Important Links

- **Android Studio:** https://developer.android.com/studio
- **Capacitor:** https://capacitorjs.com/docs/android
- **Google Play Console:** https://play.google.com/console
- **ProGuard:** https://www.guardsquare.com/proguard

## ⚠️ Common Issues

| Issue | Solution |
|-------|----------|
| Gradle sync fails | Run `./gradlew clean` |
| SDK not found | Check `local.properties` path |
| Java not found | Set `JAVA_HOME` environment variable |
| App crashes | Check `adb logcat` output |

## 📞 Support

For Capacitor issues: https://capacitorjs.com/docs
For Android build issues: Stack Overflow with tag `android-gradle`

---

**Status:** ✅ Production Ready  
**Target SDK:** 34+  
**Min SDK:** 24 (Android 7.0+)
