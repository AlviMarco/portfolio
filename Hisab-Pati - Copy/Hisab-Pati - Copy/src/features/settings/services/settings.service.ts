/**
 * SETTINGS SERVICE
 * 
 * Manages application settings and preferences.
 * - Company information
 * - User preferences
 * - Backup settings
 * - Display settings
 * 
 * RESPONSIBILITY:
 * - All settings persistence to localStorage
 * - Settings validation
 * - Default settings initialization
 */

import { AppSettings, CompanySettings, BackupSettings } from '../../../core/types';

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEYS = {
  COMPANY_NAME: 'regal_company_name',
  COMPANY_ADDRESS: 'regal_company_address',
  DARK_MODE: 'regal_dark_mode',
  AUTO_BACKUP: 'regal_auto_backup',
  BACKUP_FREQ: 'regal_backup_freq',
  LAST_BACKUP_TIME: 'regal_last_backup_time_formatted',
  BACKUP_HISTORY: 'regal_backup_history',
  REPORT_START: 'regal_report_start',
  REPORT_END: 'regal_report_end',
  PLAN_TYPE: 'regal_plan_type',  // ✅ Plan type (BASIC | MODERATE)
  ACTIVE_COMPANY_ID: 'regal_active_company_id'  // ✅ NEW: Track active company per user
};

const DEFAULT_SETTINGS: AppSettings = {
  darkMode: false,
  privateMode: false,
  company: {
    name: 'Organization',
    address: 'Dhaka, Bangladesh'
  },
  backup: {
    autoBackupEnabled: false,
    backupFrequency: 'Daily',
    lastBackupTime: null
  }
};

// ============================================================================
// COMPANY SETTINGS
// ============================================================================

/**
 * Gets current company settings from localStorage.
 */
export const getCompanySettings = (): CompanySettings => {
  return {
    name: localStorage.getItem(STORAGE_KEYS.COMPANY_NAME) || DEFAULT_SETTINGS.company.name,
    address: localStorage.getItem(STORAGE_KEYS.COMPANY_ADDRESS) || DEFAULT_SETTINGS.company.address
  };
};

/**
 * Saves company settings to localStorage.
 */
export const saveCompanySettings = (settings: Partial<CompanySettings>): void => {
  if (settings.name !== undefined) {
    localStorage.setItem(STORAGE_KEYS.COMPANY_NAME, settings.name);
  }
  if (settings.address !== undefined) {
    localStorage.setItem(STORAGE_KEYS.COMPANY_ADDRESS, settings.address);
  }
};

/**
 * Validates company settings.
 */
export const validateCompanySettings = (settings: Partial<CompanySettings>): string | null => {
  if (settings.name !== undefined && settings.name.trim() === '') {
    return 'Company name cannot be empty';
  }
  if (settings.address !== undefined && settings.address.trim() === '') {
    return 'Company address cannot be empty';
  }
  return null;
};

// ============================================================================
// BACKUP SETTINGS
// ============================================================================

/**
 * Gets current backup settings from localStorage.
 */
export const getBackupSettings = (): BackupSettings => {
  return {
    autoBackupEnabled: localStorage.getItem(STORAGE_KEYS.AUTO_BACKUP) === 'true',
    backupFrequency: (localStorage.getItem(STORAGE_KEYS.BACKUP_FREQ) || 'Daily') as 'Daily' | 'Weekly' | 'Monthly',
    lastBackupTime: localStorage.getItem(STORAGE_KEYS.LAST_BACKUP_TIME)
  };
};

/**
 * Saves backup settings to localStorage.
 */
export const saveBackupSettings = (settings: Partial<BackupSettings>): void => {
  if (settings.autoBackupEnabled !== undefined) {
    localStorage.setItem(STORAGE_KEYS.AUTO_BACKUP, settings.autoBackupEnabled.toString());
  }
  if (settings.backupFrequency !== undefined) {
    localStorage.setItem(STORAGE_KEYS.BACKUP_FREQ, settings.backupFrequency);
  }
  if (settings.lastBackupTime !== undefined) {
    localStorage.setItem(STORAGE_KEYS.LAST_BACKUP_TIME, settings.lastBackupTime || '');
  }
};

/**
 * Gets backup history from localStorage.
 */
export const getBackupHistory = (): Array<{ timestamp: string; fileName: string; status: 'success' | 'failed' }> => {
  const stored = localStorage.getItem(STORAGE_KEYS.BACKUP_HISTORY);
  return stored ? JSON.parse(stored) : [];
};

/**
 * Adds an entry to backup history.
 */
export const addBackupHistoryEntry = (
  timestamp: string,
  fileName: string,
  status: 'success' | 'failed'
): void => {
  const history = getBackupHistory();
  history.push({ timestamp, fileName, status });
  // Keep only last 50 backups
  if (history.length > 50) {
    history.splice(0, history.length - 50);
  }
  localStorage.setItem(STORAGE_KEYS.BACKUP_HISTORY, JSON.stringify(history));
};

/**
 * Clears backup history.
 */
export const clearBackupHistory = (): void => {
  localStorage.removeItem(STORAGE_KEYS.BACKUP_HISTORY);
};

// ============================================================================
// DISPLAY SETTINGS
// ============================================================================

/**
 * Gets dark mode preference from localStorage.
 */
export const isDarkModeEnabled = (): boolean => {
  return localStorage.getItem(STORAGE_KEYS.DARK_MODE) === 'true';
};

/**
 * Saves dark mode preference to localStorage.
 */
export const setDarkMode = (enabled: boolean): void => {
  localStorage.setItem(STORAGE_KEYS.DARK_MODE, enabled.toString());
};

// ============================================================================
// REPORT SETTINGS
// ============================================================================

/**
 * Gets report date range from localStorage.
 */
export const getReportDateRange = (): { start: string; end: string } => {
  const currentYear = new Date().getFullYear();
  return {
    start: localStorage.getItem(STORAGE_KEYS.REPORT_START) || `${currentYear}-01-01`,
    end: localStorage.getItem(STORAGE_KEYS.REPORT_END) || `${currentYear}-12-31`
  };
};

/**
 * Saves report date range to localStorage.
 */
export const setReportDateRange = (start: string, end: string): void => {
  localStorage.setItem(STORAGE_KEYS.REPORT_START, start);
  localStorage.setItem(STORAGE_KEYS.REPORT_END, end);
};

/**
 * Validates report date range.
 */
export const validateReportDateRange = (start: string, end: string): string | null => {
  if (!start || !end) {
    return 'Both start and end dates are required';
  }
  if (start > end) {
    return 'Start date cannot be after end date';
  }
  return null;
};

// ============================================================================
// FULL SETTINGS MANAGEMENT
// ============================================================================

/**
 * Gets all application settings.
 */
export const getAllSettings = (): AppSettings => {
  return {
    darkMode: isDarkModeEnabled(),
    privateMode: false, // Not persisted yet
    company: getCompanySettings(),
    backup: getBackupSettings()
  };
};

/**
 * Resets all settings to defaults.
 */
export const resetAllSettings = (): void => {
  // Clear all storage keys
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};

/**
 * Exports current settings as JSON (useful for debugging).
 */
export const exportSettingsAsJSON = (): string => {
  const settings = getAllSettings();
  return JSON.stringify(settings, null, 2);
};

/**
 * Imports settings from JSON string.
 */
export const importSettingsFromJSON = (jsonStr: string): { success: boolean; error?: string } => {
  try {
    const data = JSON.parse(jsonStr);
    
    if (data.company) {
      saveCompanySettings(data.company);
    }
    if (data.backup) {
      saveBackupSettings(data.backup);
    }
    if (data.darkMode !== undefined) {
      setDarkMode(data.darkMode);
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Invalid settings JSON format' };
  }
};
// ============================================================================
// PLAN TYPE MANAGEMENT (NEW)
// ============================================================================

/**
 * Gets current plan type from localStorage.
 * Default: MODERATE (with inventory)
 * 
 * ✅ MODERATE: Full inventory system enabled
 * 🔵 BASIC: Inventory system disabled
 */
export const getPlanType = (): 'BASIC' | 'MODERATE' => {
  const stored = localStorage.getItem(STORAGE_KEYS.PLAN_TYPE);
  return (stored as 'BASIC' | 'MODERATE') || 'MODERATE';  // Default to MODERATE for backward compatibility
};

/**
 * Sets the plan type in localStorage.
 */
export const setPlanType = (planType: 'BASIC' | 'MODERATE'): void => {
  localStorage.setItem(STORAGE_KEYS.PLAN_TYPE, planType);
  console.log(`✅ Plan Type Changed: ${planType} Plan`);
};

/**
 * Checks if inventory is enabled (only in MODERATE plan).
 */
export const isInventoryEnabled = (): boolean => {
  return getPlanType() === 'MODERATE';
};

/**
 * Gets plan type label for UI display.
 */
export const getPlanTypeLabel = (): string => {
  const planType = getPlanType();
  if (planType === 'BASIC') {
    return 'Basic Plan (Without Inventory)';
  }
  return 'Moderate Plan (With Inventory)';
};

// ============================================================================
// ACTIVE COMPANY MANAGEMENT (NEW - MULTI-COMPANY SUPPORT)
// ============================================================================

/**
 * Gets the currently active company ID for this user.
 * This ID should be used to scope all data queries.
 */
export const getActiveCompanyId = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_COMPANY_ID);
};

/**
 * Sets the active company ID for this user.
 * All subsequent data operations will be scoped to this company.
 */
export const setActiveCompanyId = (companyId: string): void => {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_COMPANY_ID, companyId);
  console.log(`✅ Active Company Changed: ${companyId}`);
};

/**
 * Clears the active company ID (for logout/company deletion).
 */
export const clearActiveCompanyId = (): void => {
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_COMPANY_ID);
  console.log('🏢 Active Company Cleared');
};