/**
 * DATABASE SERVICE
 * 
 * Wrapper around IndexedDB operations.
 * - Database initialization
 * - CRUD operations
 * - Query functions
 * - Data migration
 * 
 * RESPONSIBILITY:
 * - All database operations
 * - Transaction management
 * - Data persistence layer
 */

import {
  Account,
  Transaction,
  InventorySubLedger,
  InventoryMovement,
  AccountType,
  AccountLevel
} from '../types';

// Database constants
const DB_NAME = 'RegalAccountingDB';
const DB_VERSION = 4;

const OBJECT_STORES = {
  ACCOUNTS: 'accounts',
  TRANSACTIONS: 'transactions',
  SETTINGS: 'settings',
  INVENTORY_SUB_LEDGERS: 'inventorySubLedgers',
  INVENTORY_MOVEMENTS: 'inventoryMovements'
};

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

/**
 * Initializes the IndexedDB database.
 */
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Accounts store
      if (!db.objectStoreNames.contains(OBJECT_STORES.ACCOUNTS)) {
        const store = db.createObjectStore(OBJECT_STORES.ACCOUNTS, { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: false });
      }

      // Transactions store
      if (!db.objectStoreNames.contains(OBJECT_STORES.TRANSACTIONS)) {
        const store = db.createObjectStore(OBJECT_STORES.TRANSACTIONS, { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: false });
      }

      // Settings store
      if (!db.objectStoreNames.contains(OBJECT_STORES.SETTINGS)) {
        db.createObjectStore(OBJECT_STORES.SETTINGS, { keyPath: 'id' });
      }

      // Inventory sub-ledgers store
      if (!db.objectStoreNames.contains(OBJECT_STORES.INVENTORY_SUB_LEDGERS)) {
        const store = db.createObjectStore(OBJECT_STORES.INVENTORY_SUB_LEDGERS, { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: false });
        store.createIndex('inventoryGLAccountId', 'inventoryGLAccountId', { unique: false });
      }

      // Inventory movements store
      if (!db.objectStoreNames.contains(OBJECT_STORES.INVENTORY_MOVEMENTS)) {
        const store = db.createObjectStore(OBJECT_STORES.INVENTORY_MOVEMENTS, { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: false });
        store.createIndex('subLedgerId', 'subLedgerId', { unique: false });
        store.createIndex('voucherId', 'voucherId', { unique: false });
      }

      // Cleanup old stores
      ['support_tickets', 'users'].forEach(storeName => {
        if (db.objectStoreNames.contains(storeName)) {
          db.deleteObjectStore(storeName);
        }
      });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Saves data to a specific object store.
 */
export const saveData = async <T extends { id: string }>(
  storeName: string,
  data: T,
  db: IDBDatabase
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/**
 * Retrieves data by ID from a specific object store.
 */
export const getData = async <T extends { id: string }>(
  storeName: string,
  id: string,
  db: IDBDatabase
): Promise<T | undefined> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Gets all data for a specific user from an object store.
 */
export const getAllForUser = async <T extends { userId?: string }>(
  storeName: string,
  userId: string,
  db: IDBDatabase
): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index('userId');
    const request = index.getAll(userId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Gets all data from a specific object store.
 */
export const getAll = async <T>(
  storeName: string,
  db: IDBDatabase
): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Deletes data by ID from a specific object store.
 */
export const deleteData = async (
  storeName: string,
  id: string,
  db: IDBDatabase
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/**
 * Clears all data from a specific object store.
 */
export const clearStore = async (
  storeName: string,
  db: IDBDatabase
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Saves multiple records in a single transaction.
 */
export const saveMultiple = async <T extends { id: string }>(
  storeName: string,
  items: T[],
  db: IDBDatabase
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    for (const item of items) {
      store.put(item);
    }

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

/**
 * Deletes multiple records by ID in a single transaction.
 */
export const deleteMultiple = async (
  storeName: string,
  ids: string[],
  db: IDBDatabase
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    for (const id of ids) {
      store.delete(id);
    }

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

// ============================================================================
// SEED DATA
// ============================================================================

/**
 * Seeds default accounts for a new user.
 */
export const seedDefaultAccounts = async (userId: string, db: IDBDatabase): Promise<void> => {
  const defaultAccounts: Omit<Account, 'id'>[] = [
    // MAIN accounts
    { userId, name: 'Assets', type: AccountType.ASSET, level: AccountLevel.MAIN, balance: 0, openingBalance: 0, code: '1', isSystem: true },
    { userId, name: 'Liability', type: AccountType.LIABILITY, level: AccountLevel.MAIN, balance: 0, openingBalance: 0, code: '2', isSystem: true },
    { userId, name: 'Equity', type: AccountType.EQUITY, level: AccountLevel.MAIN, balance: 0, openingBalance: 0, code: '3', isSystem: true },
    { userId, name: 'Income', type: AccountType.INCOME, level: AccountLevel.MAIN, balance: 0, openingBalance: 0, code: '4', isSystem: true },
    { userId, name: 'Expense', type: AccountType.EXPENSE, level: AccountLevel.MAIN, balance: 0, openingBalance: 0, code: '5', isSystem: true },

    // ASSET GROUP accounts
    { userId, name: 'Cash and Cash Equivalent', type: AccountType.ASSET, level: AccountLevel.GROUP, parentAccountId: 'm1_FIXED', balance: 0, openingBalance: 0, code: '10000', isSystem: true },
    { userId, name: 'Accounts Receivable', type: AccountType.ASSET, level: AccountLevel.GROUP, parentAccountId: 'm1_FIXED', balance: 0, openingBalance: 0, code: '20000', isSystem: true },
    { userId, name: 'Inventory', type: AccountType.ASSET, level: AccountLevel.GROUP, parentAccountId: 'm1_FIXED', balance: 0, openingBalance: 0, code: '30000', isSystem: true },
    { userId, name: 'Fixed Assets', type: AccountType.ASSET, level: AccountLevel.GROUP, parentAccountId: 'm1_FIXED', balance: 0, openingBalance: 0, code: '40000', isSystem: true },
    { userId, name: 'Advance Deposit and Prepayments', type: AccountType.ASSET, level: AccountLevel.GROUP, parentAccountId: 'm1_FIXED', balance: 0, openingBalance: 0, code: '50000', isSystem: true },
    { userId, name: 'Current Tax Assets', type: AccountType.ASSET, level: AccountLevel.GROUP, parentAccountId: 'm1_FIXED', balance: 0, openingBalance: 0, code: '60000', isSystem: true },

    // LIABILITY GROUP accounts
    { userId, name: 'Accounts Payable', type: AccountType.LIABILITY, level: AccountLevel.GROUP, parentAccountId: 'm2_FIXED', balance: 0, openingBalance: 0, code: '70000', isSystem: true },
    { userId, name: 'Advance Received from Customer', type: AccountType.LIABILITY, level: AccountLevel.GROUP, parentAccountId: 'm2_FIXED', balance: 0, openingBalance: 0, code: '80000', isSystem: true },
    { userId, name: 'Borrowings from Bank', type: AccountType.LIABILITY, level: AccountLevel.GROUP, parentAccountId: 'm2_FIXED', balance: 0, openingBalance: 0, code: '90000', isSystem: true },
    { userId, name: 'Current Tax Payable', type: AccountType.LIABILITY, level: AccountLevel.GROUP, parentAccountId: 'm2_FIXED', balance: 0, openingBalance: 0, code: '100000', isSystem: true },
    { userId, name: 'Provision for Expenses', type: AccountType.LIABILITY, level: AccountLevel.GROUP, parentAccountId: 'm2_FIXED', balance: 0, openingBalance: 0, code: '110000', isSystem: true },

    // EQUITY GROUP accounts
    { userId, name: 'Share Capital', type: AccountType.EQUITY, level: AccountLevel.GROUP, parentAccountId: 'm3_FIXED', balance: 0, openingBalance: 0, code: '120000', isSystem: true },
    { userId, name: 'Retained Earnings', type: AccountType.EQUITY, level: AccountLevel.GROUP, parentAccountId: 'm3_FIXED', balance: 0, openingBalance: 0, code: '130000', isSystem: true },

    // INCOME GROUP accounts
    { userId, name: 'Sales Revenue', type: AccountType.INCOME, level: AccountLevel.GROUP, parentAccountId: 'm4_FIXED', balance: 0, openingBalance: 0, code: '140000', isSystem: true },
    { userId, name: 'Other Income', type: AccountType.INCOME, level: AccountLevel.GROUP, parentAccountId: 'm4_FIXED', balance: 0, openingBalance: 0, code: '150000', isSystem: true },

    // EXPENSE GROUP accounts
    { userId, name: 'Cost of Sales', type: AccountType.EXPENSE, level: AccountLevel.GROUP, parentAccountId: 'm5_FIXED', balance: 0, openingBalance: 0, code: '160000', isSystem: true },
    { userId, name: 'Operating Expenses', type: AccountType.EXPENSE, level: AccountLevel.GROUP, parentAccountId: 'm5_FIXED', balance: 0, openingBalance: 0, code: '170000', isSystem: true },
  ];

  const accountsWithIds: Account[] = defaultAccounts.map(acc => ({
    ...acc,
    id: acc.code === '1' ? 'm1_FIXED' :
        acc.code === '2' ? 'm2_FIXED' :
        acc.code === '3' ? 'm3_FIXED' :
        acc.code === '4' ? 'm4_FIXED' :
        acc.code === '5' ? 'm5_FIXED' :
        `acc_${acc.code}_${userId}`,
    isLocked: true
  }));

  await saveMultiple(OBJECT_STORES.ACCOUNTS, accountsWithIds, db);
};

// ============================================================================
// QUERY HELPERS
// ============================================================================

/**
 * Counts records for a specific user in an object store.
 */
export const countForUser = async (
  storeName: string,
  userId: string,
  db: IDBDatabase
): Promise<number> => {
  const items = await getAllForUser(storeName, userId, db);
  return items.length;
};

/**
 * Checks if any data exists for a user.
 */
export const hasUserData = async (
  userId: string,
  db: IDBDatabase
): Promise<boolean> => {
  const accountCount = await countForUser(OBJECT_STORES.ACCOUNTS, userId, db);
  return accountCount > 0;
};

/**
 * Gets statistics about database usage.
 */
export const getDatabaseStats = async (
  userId: string,
  db: IDBDatabase
): Promise<{
  accountCount: number;
  transactionCount: number;
  inventoryItemCount: number;
  movementCount: number;
}> => {
  return {
    accountCount: await countForUser(OBJECT_STORES.ACCOUNTS, userId, db),
    transactionCount: await countForUser(OBJECT_STORES.TRANSACTIONS, userId, db),
    inventoryItemCount: await countForUser(OBJECT_STORES.INVENTORY_SUB_LEDGERS, userId, db),
    movementCount: await countForUser(OBJECT_STORES.INVENTORY_MOVEMENTS, userId, db),
  };
};
