# Android Build Plan - Hisab Pati

## PROJECT AUDIT - COMPLETE ✅

### Current State
- ✅ Capacitor configured correctly (capacitor.config.ts)
- ✅ PDF handler in place (src/utils/pdfHandler.ts)
- ✅ Mobile configuration exists (src/config/mobile.ts)
- ✅ Capacitor init handler exists (src/config/capacitor-init.ts)
- ✅ Network service exists (src/utils/networkService.ts)
- ✅ Offline-first architecture implemented
- ✅ No Android folder created yet

### Features to Support on Android
1. ✅ Dashboard with IndexedDB data
2. ✅ Accounting Ledger (full CRUD)
3. ✅ Inventory Management
4. ✅ Financial Reports (P&L, Balance Sheet, TB, CF)
5. ✅ PDF Generation & Download
6. ✅ Offline-first operation
7. ✅ Multi-company support
8. ✅ Dark mode toggle
9. ✅ Settings & configuration

### Platform-Specific Issues Identified & Solutions

| Issue | Solution |
|-------|----------|
| PDF Download (Scoped Storage) | ✅ Uses Filesystem + Directory.Documents |
| File Opening | ✅ FileOpener plugin integrated |
| Back Button Handling | ✅ CapacitorApp.addListener configured |
| IndexedDB Persistence | ✅ WebView caching enabled |
| Timezone Issues | ✅ Will use device timezone (automatic) |
| Network Detection | ✅ Network service handles offline |
| PDF Printing | ✅ Share dialog + email fallback |

### Dependencies Already in place
- @capacitor/core ^8.0.1 ✅
- @capacitor/android ^8.0.1 ✅
- @capacitor/app ^8.0.0 ✅
- @capacitor/filesystem ^8.0.0 ✅
- @capacitor/share ^8.0.0 ✅
- @awesome-cordova-plugins/file-opener ^8.1.0 ✅
- jspdf ^2.5.1 ✅
- React ^19.2.3 ✅
- TypeScript ^5.8.2 ✅

## BUILD PLAN PHASES

### PHASE 1: Generate Android Project Structure
- Create /android folder with proper structure
- Configure Gradle files
- Create AndroidManifest.xml with proper permissions
- Set up build.gradle with correct SDK versions

### PHASE 2: Validate TypeScript & Build
- Run npm run build (generates dist/)
- Verify no TypeScript errors
- Verify Vite build succeeds

### PHASE 3: Capacitor Sync
- Sync web assets to Android
- Update Android native code if needed
- Verify no platform conflicts

### PHASE 4: Android Specific Fixes
- Verify PDF handler works on WebView
- Verify IndexedDB persistence
- Test file system access
- Test file opening with FileOpener

### PHASE 5: Gradle Configuration
- Set correct compileSdkVersion (34)
- Set correct targetSdkVersion (34)
- Set correct minSdkVersion (24)
- Ensure proper dependencies

### PHASE 6: APK Build
- ./gradlew build (debug)
- Verify no build errors
- Create signed APK for release

## BUILD COMMANDS

```bash
# Build web assets
npm run build

# Generate Android project (one-time)
npx cap add android

# Sync web assets to Android
npx cap sync android

# Open in Android Studio
npx cap open android

# Alternative: Build directly
cd android
./gradlew build  # Debug APK
./gradlew bundleRelease  # Play Store AAB
```

## MINIMUM REQUIREMENTS

- **Node.js:** 18+
- **Java:** JDK 17+
- **Android SDK:** API 34 (latest)
- **Gradle:** 8.4+ (handled by wrapper)
- **Android Studio:** 2023.1+

## FILE STRUCTURE AFTER GENERATION

```
project/
├── src/                          # React/TypeScript source
├── dist/                         # Built web assets
├── android/                      # Generated Android project
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml
│   │   │   ├── java/com/hisabpati/app/
│   │   │   └── res/
│   │   ├── build.gradle
│   │   └── proguard-rules.pro
│   ├── gradle/
│   ├── build.gradle
│   ├── settings.gradle
│   ├── gradle.properties
│   └── local.properties
├── capacitor.config.ts
├── package.json
└── tsconfig.json
```

## NEXT STEPS

1. ✅ Audit complete
2. → Create Android folder structure
3. → Generate Gradle files
4. → Create AndroidManifest.xml
5. → Configure permissions
6. → Sync with Capacitor
7. → Verify compilation
8. → Build APK
