/**
 * NETWORK SERVICE
 * 
 * Provides offline-first network detection and utilities:
 * - Real-time online/offline detection
 * - Network status monitoring
 * - Fetch with timeout guards
 * - Offline-safe error handling
 * 
 * Usage:
 *   import { isOnline, onNetworkChange, fetchWithTimeout } from './networkService';
 *   
 *   // Check current network status
 *   if (isOnline()) { ... }
 *   
 *   // Listen for changes
 *   onNetworkChange((online) => { ... });
 *   
 *   // Fetch with timeout
 *   const data = await fetchWithTimeout(url, options, 5000);
 */

export type NetworkStatusCallback = (isOnline: boolean) => void;

let networkCallbacks: NetworkStatusCallback[] = [];
let cachedOnlineStatus = typeof navigator !== 'undefined' ? navigator.onLine : true;
let networkCheckInProgress = false;

/**
 * Get current network status
 * @returns true if online, false if offline
 */
export const isOnline = (): boolean => {
  return cachedOnlineStatus;
};

/**
 * Register callback for network status changes
 * @param callback - Called with (isOnline) whenever network status changes
 * @returns Cleanup function to unsubscribe
 */
export const onNetworkChange = (callback: NetworkStatusCallback): (() => void) => {
  networkCallbacks.push(callback);
  
  // Return cleanup function
  return () => {
    networkCallbacks = networkCallbacks.filter(cb => cb !== callback);
  };
};

/**
 * Notify all listeners of network status change
 */
const notifyNetworkChange = (newStatus: boolean) => {
  if (newStatus === cachedOnlineStatus) return; // No change
  
  cachedOnlineStatus = newStatus;
  console.log(`📡 Network status changed: ${newStatus ? '🟢 ONLINE' : '🔴 OFFLINE'}`);
  
  networkCallbacks.forEach(callback => {
    try {
      callback(newStatus);
    } catch (error) {
      console.error('❌ Error in network callback:', error);
    }
  });
};

/**
 * Check actual network connectivity with HTTP request
 * (More reliable than navigator.onLine alone)
 */
export const checkNetworkConnectivity = async (): Promise<boolean> => {
  if (networkCheckInProgress) return cachedOnlineStatus;
  
  networkCheckInProgress = true;
  try {
    // Try a minimal HEAD request to Google (universal, fast)
    const response = await fetch('https://www.google.com/', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store'
    });
    
    networkCheckInProgress = false;
    notifyNetworkChange(true);
    return true;
  } catch (error) {
    networkCheckInProgress = false;
    notifyNetworkChange(false);
    return false;
  }
};

/**
 * Fetch with timeout guard
 * Prevents hanging indefinitely on slow/offline networks
 * 
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param timeoutMs - Timeout in milliseconds (default: 10000)
 * @returns Promise that rejects if timeout exceeded
 */
export const fetchWithTimeout = async (
  url: string,
  options?: RequestInit,
  timeoutMs: number = 10000
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Check if it was a timeout (AbortError)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Network request timeout (${timeoutMs}ms): ${url}`);
    }
    
    // Check if we're actually offline
    if (!navigator.onLine) {
      notifyNetworkChange(false);
      throw new Error('Network unavailable - operating in offline mode');
    }
    
    throw error;
  }
};

/**
 * Guard: Ensures operation only runs if online
 * @param fn - Async function to run
 * @param errorMessage - Custom error message if offline
 * @returns Result or throws offline error
 */
export const requireOnline = async <T,>(
  fn: () => Promise<T>,
  errorMessage: string = 'This feature requires an active internet connection'
): Promise<T> => {
  if (!isOnline()) {
    throw new Error(errorMessage);
  }
  
  try {
    return await fn();
  } catch (error) {
    // If fetch fails, we're likely offline now
    if (error instanceof TypeError || (error instanceof Error && error.message.includes('timeout'))) {
      notifyNetworkChange(false);
      throw new Error('Lost internet connection during operation');
    }
    throw error;
  }
};

/**
 * Initialize network monitoring
 * Call once at app startup
 */
export const initializeNetworkMonitoring = () => {
  if (typeof window === 'undefined') return;
  
  // Listen for online/offline events
  window.addEventListener('online', () => {
    console.log('🟢 Network connection restored');
    notifyNetworkChange(true);
  });
  
  window.addEventListener('offline', () => {
    console.log('🔴 Network connection lost');
    notifyNetworkChange(false);
  });
  
  // Periodic connectivity check (every 30 seconds if offline)
  let checkInterval: NodeJS.Timeout | null = null;
  
  const startPeriodicCheck = () => {
    if (checkInterval) return;
    checkInterval = setInterval(() => {
      if (!isOnline()) {
        checkNetworkConnectivity().catch(() => {
          // Already handled in checkNetworkConnectivity
        });
      }
    }, 30000);
  };
  
  const stopPeriodicCheck = () => {
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }
  };
  
  // Start periodic check if we're currently offline
  if (!isOnline()) {
    startPeriodicCheck();
  }
  
  // Listen for status changes to start/stop periodic check
  onNetworkChange((online) => {
    if (online) {
      stopPeriodicCheck();
    } else {
      startPeriodicCheck();
    }
  });
  
  console.log('📡 Network monitoring initialized');
};

/**
 * Get detailed network status info
 */
export const getNetworkStatus = () => {
  return {
    isOnline: isOnline(),
    type: (navigator as any).connection?.effectiveType || 'unknown',
    downlink: (navigator as any).connection?.downlink || 'unknown',
    roundTripTime: (navigator as any).connection?.rtt || 'unknown',
    saveData: (navigator as any).connection?.saveData || false
  };
};
