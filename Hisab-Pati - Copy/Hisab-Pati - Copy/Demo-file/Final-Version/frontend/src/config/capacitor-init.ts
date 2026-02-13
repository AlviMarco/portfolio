import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

/**
 * Initialize Capacitor app lifecycle handlers
 * Call this in your main App component on mount
 */

export const initializeCapacitor = () => {
  if (!Capacitor.isNativePlatform()) {
    console.log('Running as web app');
    return;
  }

  console.log('Initializing Capacitor for native app');

  // Handle app pause/resume
  CapacitorApp.addListener('pause', () => {
    console.log('App paused - save state if needed');
    // Save any unsaved data
  });

  CapacitorApp.addListener('resume', () => {
    console.log('App resumed');
    // Refresh data if needed
  });

  // Handle back button (Android)
  CapacitorApp.addListener('backButton', ({ canGoBack }) => {
    if (!canGoBack) {
      // Show exit confirmation or exit app
      CapacitorApp.exitApp();
    } else {
      // Let browser handle back
      window.history.back();
    }
  });

  // Handle app termination
  CapacitorApp.addListener('appRestoredResult', (result) => {
    console.log('App restored:', result);
  });
};

/**
 * Check if the app is running on mobile
 */
export const isNativeApp = () => {
  return Capacitor.isNativePlatform();
};

/**
 * Get the current platform (ios or android)
 */
export const getPlatform = () => {
  return Capacitor.getPlatform();
};

/**
 * Safe exit the app
 */
export const exitApp = async () => {
  if (Capacitor.isNativePlatform()) {
    await CapacitorApp.exitApp();
  } else {
    window.close();
  }
};
