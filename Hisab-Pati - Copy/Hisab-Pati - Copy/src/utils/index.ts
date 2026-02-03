/**
 * UTILITY FUNCTIONS
 * 
 * Common helper functions used throughout the application.
 * - Formatting and display
 * - Validation helpers
 * - Conversion utilities
 */

import { Account, AccountType, AccountLevel } from '../core/types';

// ============================================================================
// DATE UTILITIES
// ============================================================================

/**
 * Formats a date string to long readable format.
 */
export const formatDateLong = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Formats a date string to short format (YYYY-MM-DD).
 */
export const formatDateShort = (dateStr: string): string => {
  return dateStr;
};

/**
 * Formats a timestamp to readable format with time.
 */
export const formatDateTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Gets number of days between two dates.
 */
export const getDaysBetween = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Checks if a date is within a range.
 */
export const isDateInRange = (date: string, startDate: string, endDate: string): boolean => {
  return date >= startDate && date <= endDate;
};

// ============================================================================
// NUMBER FORMATTING
// ============================================================================

/**
 * Formats a number as currency with 2 decimal places.
 */
export const formatCurrency = (amount: number): string => {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

/**
 * Formats a number with thousands separator.
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

/**
 * Parses a currency string to number.
 */
export const parseCurrency = (str: string): number => {
  return parseFloat(str.replace(/[^\d.-]/g, ''));
};

/**
 * Rounds a number to specified decimal places.
 */
export const roundTo = (num: number, decimals: number = 2): number => {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

/**
 * Formats a percentage.
 */
export const formatPercentage = (value: number, decimals: number = 2): string => {
  return `${roundTo(value * 100, decimals)}%`;
};

// ============================================================================
// STRING UTILITIES
// ============================================================================

/**
 * Converts string to title case.
 */
export const toTitleCase = (str: string): string => {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
};

/**
 * Converts string to sentence case.
 */
export const toSentenceCase = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Truncates string to specified length with ellipsis.
 */
export const truncateString = (str: string, maxLength: number = 50): string => {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
};

/**
 * Sanitizes string for display (removes special characters).
 */
export const sanitizeString = (str: string): string => {
  return str.replace(/[<>]/g, '').trim();
};

/**
 * Generates a random ID.
 */
export const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// ============================================================================
// ACCOUNT UTILITIES
// ============================================================================

/**
 * Gets display name for account type.
 */
export const getAccountTypeLabel = (type: AccountType): string => {
  const labels: Record<AccountType, string> = {
    [AccountType.ASSET]: 'Asset',
    [AccountType.LIABILITY]: 'Liability',
    [AccountType.EQUITY]: 'Equity',
    [AccountType.INCOME]: 'Income',
    [AccountType.EXPENSE]: 'Expense'
  };
  return labels[type];
};

/**
 * Gets CSS color for account type.
 */
export const getAccountTypeColor = (type: AccountType): string => {
  const colors: Record<AccountType, string> = {
    [AccountType.ASSET]: 'bg-blue-100 text-blue-800',
    [AccountType.LIABILITY]: 'bg-red-100 text-red-800',
    [AccountType.EQUITY]: 'bg-purple-100 text-purple-800',
    [AccountType.INCOME]: 'bg-green-100 text-green-800',
    [AccountType.EXPENSE]: 'bg-orange-100 text-orange-800'
  };
  return colors[type];
};

/**
 * Gets sign multiplier for account type (for balance calculation).
 */
export const getAccountTypeSign = (type: AccountType): 1 | -1 => {
  // Assets and Expenses increase with debit (positive)
  // Liabilities, Equity, Income increase with credit (positive as shown)
  return type === AccountType.ASSET || type === AccountType.EXPENSE ? 1 : 1;
};

/**
 * Generates next GL account code based on parent group code and existing GL accounts.
 * Uses NUMERIC addition, not string concatenation.
 * Example: Group 70000 → GL accounts 70001, 70002, 70003, etc.
 */
export const generateNextGLAccountCode = (groupCode: string, existingGLCodes: string[]): string => {
  // Parse group code as numeric value
  const groupNumeric = parseInt(groupCode, 10);
  if (isNaN(groupNumeric)) {
    throw new Error(`Invalid group code: ${groupCode}`);
  }
  
  // Find the highest GL code in this group
  // GL codes under a group should:
  // 1. Be numeric and convertible to integers
  // 2. Be greater than the group code value
  // 3. Be within the same group range (differ by < 1000)
  const groupPrefix = groupCode; // e.g., "10000"
  const groupLength = groupPrefix.length;
  
  const glCodesInGroup = existingGLCodes
    .filter(code => {
      // Must be numeric
      const codeNum = parseInt(code, 10);
      if (isNaN(codeNum)) return false;
      
      // Must be greater than group code
      if (codeNum <= groupNumeric) return false;
      
      // Must be within same group range (< group code + 1000)
      // Example: group 10000, valid range 10001-10999
      if (codeNum >= groupNumeric + 1000) return false;
      
      return true;
    })
    .map(code => parseInt(code, 10))
    .filter(num => !isNaN(num));
  
  // Find the maximum numeric value, or use the group code as base
  const maxCode = glCodesInGroup.length > 0 ? Math.max(...glCodesInGroup) : groupNumeric;
  const nextNumericCode = maxCode + 1;
  
  // Validate that next code doesn't exceed group range
  if (nextNumericCode >= groupNumeric + 1000) {
    throw new Error(`GL group ${groupCode} has reached maximum accounts (999 GL accounts per group)`);
  }
  
  // Convert back to string, preserving format
  return nextNumericCode.toString();
};

/**
 * Checks if account can have GL children.
 */
export const canHaveGLChildren = (level: AccountLevel): boolean => {
  return level === AccountLevel.GROUP;
};

/**
 * Checks if account can be deleted.
 */
export const canDeleteAccount = (account: Account): boolean => {
  return !account.isSystem && !account.isLocked;
};

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validates email format.
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates amount is positive number.
 */
export const isValidAmount = (amount: any): boolean => {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
};

/**
 * Validates date format (YYYY-MM-DD).
 */
export const isValidDateFormat = (dateStr: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) return false;
  
  const date = new Date(dateStr + 'T00:00:00');
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Validates account code format.
 */
export const isValidAccountCode = (code: string): boolean => {
  return code.length > 0 && code.length <= 10;
};

/**
 * Validates account name.
 */
export const isValidAccountName = (name: string): boolean => {
  return name.trim().length > 0 && name.length <= 100;
};

// ============================================================================
// ARRAY UTILITIES
// ============================================================================

/**
 * Groups array items by a property.
 */
export const groupBy = <T>(
  array: T[],
  key: keyof T
): Record<string | number, T[]> => {
  return array.reduce((result, item) => {
    const groupKey = item[key] as unknown as string | number;
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string | number, T[]>);
};

/**
 * Finds duplicate items in array.
 */
export const findDuplicates = <T>(
  array: T[],
  key: keyof T
): T[] => {
  const seen = new Set();
  const duplicates: T[] = [];
  
  for (const item of array) {
    const value = item[key];
    if (seen.has(value)) {
      if (!duplicates.some(d => d[key] === value)) {
        duplicates.push(item);
      }
    }
    seen.add(value);
  }
  
  return duplicates;
};

/**
 * Removes duplicate items from array.
 */
export const removeDuplicates = <T>(
  array: T[],
  key: keyof T
): T[] => {
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
};

/**
 * Flattens a nested array.
 */
export const flattenArray = <T>(array: (T | T[])[]): T[] => {
  const result: T[] = [];
  for (const item of array) {
    if (Array.isArray(item)) {
      result.push(...(item as T[]));
    } else {
      result.push(item as T);
    }
  }
  return result;
};

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Gets user-friendly error message.
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
};

/**
 * Logs error with context.
 */
export const logError = (context: string, error: unknown): void => {
  console.error(`[${context}]`, getErrorMessage(error));
};

/**
 * Retries an async function with exponential backoff.
 */
export const retryAsync = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  throw new Error('Max retries exceeded');
};
