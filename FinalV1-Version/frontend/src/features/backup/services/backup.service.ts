/**
 * BACKUP SERVICE
 * 
 * Manages backup and restore operations.
 * - Google Drive integration
 * - Local backup/restore
 * - Backup scheduling
 * - Data integrity validation
 * 
 * RESPONSIBILITY:
 * - All backup creation and storage
 * - Restore data validation
 * - Backup history management
 * - Data serialization/deserialization
 */

import {
  Account,
  Transaction,
  InventorySubLedger,
  InventoryMovement,
  BackupData,
  User
} from '../../../core/types';
import {
  addBackupHistoryEntry,
  getBackupHistory,
  saveBackupSettings
} from './settings.service';

// ============================================================================
// BACKUP DATA MANAGEMENT
// ============================================================================

/**
 * Creates backup data payload from current application state.
 */
export const createBackupPayload = (
  companyName: string,
  companyAddress: string,
  accounts: Account[],
  transactions: Transaction[],
  inventorySubLedgers: InventorySubLedger[],
  inventoryMovements: InventoryMovement[]
): BackupData => {
  return {
    version: '1.4',
    timestamp: new Date().toISOString(),
    companyName,
    companyAddress,
    accounts,
    transactions,
    inventorySubLedgers,
    inventoryMovements
  };
};

/**
 * Validates backup data integrity before restore.
 */
export const validateBackupData = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check required fields
  if (!data.version) errors.push('Missing backup version');
  if (!data.timestamp) errors.push('Missing backup timestamp');
  if (!data.companyName) errors.push('Missing company name');
  
  // Check data arrays
  if (!Array.isArray(data.accounts)) errors.push('Accounts data is missing or invalid');
  if (!Array.isArray(data.transactions)) errors.push('Transactions data is missing or invalid');
  if (!Array.isArray(data.inventorySubLedgers)) errors.push('Inventory sub-ledgers data is missing or invalid');
  if (!Array.isArray(data.inventoryMovements)) errors.push('Inventory movements data is missing or invalid');

  // Validate account structure
  if (Array.isArray(data.accounts)) {
    for (const acc of data.accounts) {
      if (!acc.id || !acc.userId || !acc.name) {
        errors.push('Invalid account structure found in backup');
        break;
      }
    }
  }

  // Validate transaction structure
  if (Array.isArray(data.transactions)) {
    for (const tx of data.transactions) {
      if (!tx.id || !tx.userId || !Array.isArray(tx.entries)) {
        errors.push('Invalid transaction structure found in backup');
        break;
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Calculates backup size in bytes.
 */
export const calculateBackupSize = (backupData: BackupData): number => {
  return new Blob([JSON.stringify(backupData)]).size;
};

/**
 * Formats backup size for display.
 */
export const formatBackupSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Extracts summary information from backup.
 */
export const getBackupSummary = (backupData: BackupData): {
  timestamp: string;
  companyName: string;
  accountCount: number;
  transactionCount: number;
  inventoryItemCount: number;
  size: string;
} => {
  return {
    timestamp: backupData.timestamp,
    companyName: backupData.companyName,
    accountCount: backupData.accounts.length,
    transactionCount: backupData.transactions.length,
    inventoryItemCount: backupData.inventorySubLedgers.length,
    size: formatBackupSize(calculateBackupSize(backupData))
  };
};

// ============================================================================
// LOCAL BACKUP OPERATIONS
// ============================================================================

/**
 * Exports backup data to JSON file (for browser download).
 */
export const exportBackupToJSON = (backupData: BackupData, fileName: string): void => {
  const dataStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Parses backup JSON file from import.
 */
export const parseBackupJSON = (jsonString: string): { success: boolean; data?: BackupData; error?: string } => {
  try {
    const data = JSON.parse(jsonString);
    const validation = validateBackupData(data);
    
    if (!validation.isValid) {
      return {
        success: false,
        error: `Invalid backup data: ${validation.errors.join(', ')}`
      };
    }
    
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to parse backup file. Is it a valid JSON file?'
    };
  }
};

// ============================================================================
// BACKUP HISTORY
// ============================================================================

/**
 * Logs backup operation to history.
 */
export const logBackupOperation = (
  fileName: string,
  success: boolean
): void => {
  const timestamp = new Date().toISOString();
  addBackupHistoryEntry(timestamp, fileName, success ? 'success' : 'failed');
};

/**
 * Gets formatted backup history for display.
 */
export const getFormattedBackupHistory = (): Array<{
  timestamp: string;
  fileName: string;
  status: 'success' | 'failed';
  displayDate: string;
  displayTime: string;
}> => {
  const history = getBackupHistory();
  
  return history.map(entry => {
    const date = new Date(entry.timestamp);
    return {
      ...entry,
      displayDate: date.toLocaleDateString(),
      displayTime: date.toLocaleTimeString()
    };
  });
};

// ============================================================================
// BACKUP SCHEDULING
// ============================================================================

/**
 * Determines if auto-backup is due based on frequency.
 */
export const isAutoBackupDue = (
  lastBackupTime: string | null,
  frequency: 'Daily' | 'Weekly' | 'Monthly'
): boolean => {
  if (!lastBackupTime) return true;
  
  const lastBackup = new Date(lastBackupTime);
  const now = new Date();
  const diffMs = now.getTime() - lastBackup.getTime();
  
  switch (frequency) {
    case 'Daily':
      return diffMs >= 24 * 60 * 60 * 1000;
    case 'Weekly':
      return diffMs >= 7 * 24 * 60 * 60 * 1000;
    case 'Monthly':
      return diffMs >= 30 * 24 * 60 * 60 * 1000;
    default:
      return false;
  }
};

/**
 * Gets human-readable time until next auto-backup.
 */
export const getTimeUntilNextBackup = (
  lastBackupTime: string | null,
  frequency: 'Daily' | 'Weekly' | 'Monthly'
): string => {
  if (!lastBackupTime) return 'Never';
  
  const lastBackup = new Date(lastBackupTime);
  let nextBackup = new Date(lastBackup);
  
  switch (frequency) {
    case 'Daily':
      nextBackup.setDate(nextBackup.getDate() + 1);
      break;
    case 'Weekly':
      nextBackup.setDate(nextBackup.getDate() + 7);
      break;
    case 'Monthly':
      nextBackup.setMonth(nextBackup.getMonth() + 1);
      break;
  }
  
  const diffMs = nextBackup.getTime() - new Date().getTime();
  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day(s)`;
  } else if (hours > 0) {
    return `${hours} hour(s)`;
  } else {
    return 'Soon';
  }
};

/**
 * Updates last backup time in settings.
 */
export const recordBackupTime = (): void => {
  const now = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  saveBackupSettings({ lastBackupTime: now });
};

// ============================================================================
// DATA MIGRATION
// ============================================================================

/**
 * Migrates backup data between versions.
 * Currently version 1.4, but this allows future version upgrades.
 */
export const migrateBackupData = (backupData: BackupData): BackupData => {
  const version = parseFloat(backupData.version);
  
  // Current version is 1.4 - add migrations here as needed for future versions
  if (version < 1.4) {
    // Ensure inventory data exists
    if (!Array.isArray(backupData.inventorySubLedgers)) {
      backupData.inventorySubLedgers = [];
    }
    if (!Array.isArray(backupData.inventoryMovements)) {
      backupData.inventoryMovements = [];
    }
  }
  
  return backupData;
};

// ============================================================================
// BACKUP FILE NAMING
// ============================================================================

/**
 * Generates standardized backup file name.
 */
export const generateBackupFileName = (
  companyName: string,
  format: 'json' | 'xlsx' = 'json'
): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
  const sanitizedName = companyName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  return `AccountingApp_Backup_${sanitizedName}_${timestamp}.${format}`;
};

/**
 * Parses backup file name to extract metadata.
 */
export const parseBackupFileName = (fileName: string): { companyName?: string; timestamp?: string } => {
  // Pattern: AccountingApp_Backup_CompanyName_YYYY-MM-DDTHH-mm
  const match = fileName.match(/AccountingApp_Backup_(.+)_(\d{4}-\d{2}-\d{2}T\d{2}-\d{2})/);
  
  if (!match) {
    return {};
  }
  
  return {
    companyName: match[1].replace(/_/g, ' '),
    timestamp: match[2].replace(/T/, ' ').replace(/-(?!.*-)/, ':')
  };
};
