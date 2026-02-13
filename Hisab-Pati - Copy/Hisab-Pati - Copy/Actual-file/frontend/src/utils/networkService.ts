/**
 * NETWORK SERVICE
 * 
 * Provides offline-first network detection and utilities:
 * - Real-time online/offline detection
 * - Network status monitoring
 * - Fetch with timeout guards
 * - Offline-safe error handling
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
 */
export const checkNetworkConnectivity = async (): Promise<boolean> => {
    if (networkCheckInProgress) return cachedOnlineStatus;

    networkCheckInProgress = true;
    try {
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

        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error(`Network request timeout (${timeoutMs}ms): ${url}`);
        }

        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            notifyNetworkChange(false);
            throw new Error('Network unavailable - operating in offline mode');
        }

        throw error;
    }
};

/**
 * Initialize network monitoring
 */
export const initializeNetworkMonitoring = () => {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
        console.log('🟢 Network connection restored');
        notifyNetworkChange(true);
    });

    window.addEventListener('offline', () => {
        console.log('🔴 Network connection lost');
        notifyNetworkChange(false);
    });

    console.log('📡 Network monitoring initialized');
};
