package com.hisabpati.app;

import com.getcapacitor.CapacitorPlugin;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Hisab Pati Capacitor Configuration
 * Initializes Capacitor plugins for Android
 * 
 * This class ensures all necessary Capacitor features are loaded:
 * - WebView bridge communication
 * - File system access (PDF saving)
 * - File opening (PDF viewer)
 * - Network access
 */
@CapacitorPlugin(
    name = "HisabPati",
    requestCodes = {
        // Request codes for permissions if needed
    }
)
public class HisabPatiPlugin extends CapacitorPlugin {
    // Plugin implementation handled by Capacitor core
}
