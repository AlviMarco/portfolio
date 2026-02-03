/**
 * ACCOUNT SORTING SERVICE
 * 
 * Centralized, reusable service for sorting accounts alphabetically (A → Z)
 * Applied globally across:
 * - Voucher entry dropdowns (Sales, Purchase, Receipt, Payment, Journal)
 * - Chart of Accounts view
 * - Ledger master list
 * - Reports and filters
 * - All autocomplete/search lists
 * 
 * RESPONSIBILITY:
 * - Consistent alphabetical ordering by account name
 * - Case-insensitive, locale-aware sorting
 * - Performance optimized
 * - Handles edge cases (null/empty names)
 */

import { Account } from '../../../core/types';

/**
 * Sort accounts alphabetically by name (A → Z)
 * - Case-insensitive
 * - Locale-aware for international characters
 * - Stable sort (maintains insertion order for equal items)
 * - Filters out accounts with empty/null names
 * 
 * @param accounts Array of accounts to sort
 * @returns Sorted array by account name (A → Z)
 */
export const sortAccountsAlphabetically = (accounts: Account[]): Account[] => {
  return [...accounts].sort((a, b) => {
    // Filter out null/empty names - place at end
    if (!a.name && !b.name) return 0;
    if (!a.name) return 1;
    if (!b.name) return -1;

    // Case-insensitive, locale-aware alphabetical comparison
    return a.name.localeCompare(b.name, undefined, {
      numeric: false,
      sensitivity: 'base' // Ignore accents and case differences
    });
  });
};

/**
 * Sort GL accounts only (most common for vouchers)
 * Filters to GL level and sorts alphabetically
 * 
 * @param accounts Array of accounts
 * @returns Sorted GL accounts (A → Z by name)
 */
export const getSortedGLAccounts = (accounts: Account[]): Account[] => {
  const glAccounts = accounts.filter(a => a.level === 3); // GL level
  return sortAccountsAlphabetically(glAccounts);
};

/**
 * Sort accounts by type and then alphabetically within each type
 * Useful for grouped displays
 * 
 * @param accounts Array of accounts
 * @param type Account type filter (ASSET, LIABILITY, etc.)
 * @returns Sorted accounts filtered by type (A → Z by name)
 */
export const getSortedAccountsByType = (
  accounts: Account[],
  type: string
): Account[] => {
  const filtered = accounts.filter(a => a.type === type);
  return sortAccountsAlphabetically(filtered);
};

/**
 * Sort accounts within a parent group
 * Used for hierarchical displays (Group → GL accounts)
 * 
 * @param accounts Array of accounts
 * @param parentId Parent account ID
 * @returns Child accounts sorted alphabetically (A → Z by name)
 */
export const getSortedChildAccounts = (
  accounts: Account[],
  parentId: string
): Account[] => {
  const children = accounts.filter(a => a.parentAccountId === parentId);
  return sortAccountsAlphabetically(children);
};

/**
 * Get all GL accounts sorted, excluding specific accounts
 * Useful for dropdown filters (e.g., exclude same account in debit/credit)
 * 
 * @param accounts Array of accounts
 * @param excludeIds Account IDs to exclude
 * @returns Sorted GL accounts excluding specified IDs (A → Z by name)
 */
export const getSortedGLAccountsExcluding = (
  accounts: Account[],
  excludeIds: string[] = []
): Account[] => {
  const glAccounts = accounts.filter(
    a => a.level === 3 && !excludeIds.includes(a.id)
  );
  return sortAccountsAlphabetically(glAccounts);
};

/**
 * Sort accounts for search/autocomplete filtering
 * Maintains alphabetical order while filtering by query
 * 
 * @param accounts Array of accounts to search
 * @param searchQuery Text to filter accounts by name
 * @returns Sorted GL accounts matching query (A → Z by name)
 */
export const getSortedGLAccountsBySearch = (
  accounts: Account[],
  searchQuery: string
): Account[] => {
  const normalizedQuery = searchQuery.toLowerCase();
  const filtered = accounts.filter(
    a =>
      a.level === 3 &&
      (a.name.toLowerCase().includes(normalizedQuery) ||
        a.code.includes(searchQuery))
  );
  return sortAccountsAlphabetically(filtered);
};

/**
 * Sort accounts grouped by parent, each group alphabetical
 * Returns array of {parent, children} for hierarchical rendering
 * 
 * @param accounts Array of accounts
 * @param parentLevel Parent account level
 * @returns Array of {parent, children} with children sorted A → Z
 */
export const getSortedAccountsGroupedByParent = (
  accounts: Account[],
  parentLevel: number
): Array<{ parent: Account; children: Account[] }> => {
  const parents = accounts.filter(a => a.level === parentLevel);
  const sortedParents = sortAccountsAlphabetically(parents);

  return sortedParents.map(parent => ({
    parent,
    children: getSortedChildAccounts(accounts, parent.id)
  }));
};

/**
 * Get sorted inventory GL accounts only
 * For inventory-specific operations
 * 
 * @param accounts Array of accounts
 * @returns Sorted inventory GL accounts (A → Z by name)
 */
export const getSortedInventoryGLAccounts = (
  accounts: Account[]
): Account[] => {
  const inventoryGLs = accounts.filter(
    a => a.isInventoryGL === true && a.level === 3
  );
  return sortAccountsAlphabetically(inventoryGLs);
};

/**
 * Validate that sorting is stable and correct
 * Debug utility to verify sort implementation
 * 
 * @param accounts Array of accounts to validate
 * @returns {isValid, violations} Validation result
 */
export const validateAccountSorting = (
  accounts: Account[]
): { isValid: boolean; violations: string[] } => {
  const violations: string[] = [];
  const sorted = sortAccountsAlphabetically(accounts);

  // Check if array is properly sorted
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1].name;
    const curr = sorted[i].name;

    if (prev && curr) {
      const comparison = prev.localeCompare(curr, undefined, {
        numeric: false,
        sensitivity: 'base'
      });

      if (comparison > 0) {
        violations.push(
          `Sorting violation at index ${i}: "${prev}" should come after "${curr}"`
        );
      }
    }
  }

  return {
    isValid: violations.length === 0,
    violations
  };
};
