import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hisabpati.app',
  appName: 'Hisab Pati',
  webDir: 'dist',
  
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    },
    // ✅ FILESYSTEM CONFIGURATION
    // Ensures proper file read/write access on Android
    Filesystem: {
      // Allows accessing Documents folder for PDF saves
      // No permissions required for app-private directories
    },
    
    // ✅ ANDROID SPECIFIC CONFIGURATION
    Android: {
      // Ensures app can use file permissions properly
      allowMixedContent: true
    }
  },
  
  server: {
    androidScheme: 'https',
    // Prevent CORS issues on Android
    allowNavigation: ['*']
  }
};

export default config;
