
import { Account, Transaction, AccountType, AccountLevel, InventorySubLedger, InventoryMovement, Company } from '../types';
import { DB_CONFIG } from '../../../../shared/constants';

const DB_NAME = DB_CONFIG.NAME;
const DB_VERSION = DB_CONFIG.VERSION;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // ✅ Create 'companies' store if it doesn't exist
      if (!db.objectStoreNames.contains('companies')) {
        const companyStore = db.createObjectStore('companies', { keyPath: 'id' });
        companyStore.createIndex('userId', 'userId', { unique: false }); // ✅ Index for finding user's companies
        companyStore.createIndex('userIdActive', ['userId', 'isActive'], { unique: false }); // ✅ Compound index for active companies
      }

      if (!db.objectStoreNames.contains('accounts')) {
        const store = db.createObjectStore('accounts', { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: false });
        store.createIndex('userIdCompanyId', ['userId', 'companyId'], { unique: false }); // ✅ Compound index for company-scoped queries
      }

      if (!db.objectStoreNames.contains('transactions')) {
        const store = db.createObjectStore('transactions', { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: false });
        store.createIndex('userIdCompanyId', ['userId', 'companyId'], { unique: false }); // ✅ Compound index
      }

      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('inventorySubLedgers')) {
        const store = db.createObjectStore('inventorySubLedgers', { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: false });
        store.createIndex('userIdCompanyId', ['userId', 'companyId'], { unique: false }); // ✅ Compound index
        store.createIndex('inventoryGLAccountId', 'inventoryGLAccountId', { unique: false });
      }

      if (!db.objectStoreNames.contains('inventoryMovements')) {
        const store = db.createObjectStore('inventoryMovements', { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: false });
        store.createIndex('userIdCompanyId', ['userId', 'companyId'], { unique: false }); // ✅ Compound index
        store.createIndex('subLedgerId', 'subLedgerId', { unique: false });
        store.createIndex('voucherId', 'voucherId', { unique: false });
      }

      // Cleanup old stores if they exist from a higher version
      if (db.objectStoreNames.contains('support_tickets')) {
        db.deleteObjectStore('support_tickets');
      }
      if (db.objectStoreNames.contains('users')) {
        db.deleteObjectStore('users');
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const seedDefaultAccounts = (userId: string, companyId: string, db: IDBDatabase): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction('accounts', 'readwrite');
      const store = transaction.objectStore('accounts');

      const defaultAccounts: Omit<Account, 'id'>[] = [
        { userId, companyId, name: 'Assets', type: AccountType.ASSET, level: AccountLevel.MAIN, balance: 0, openingBalance: 0, code: '1', isSystem: true },
        { userId, companyId, name: 'Liability', type: AccountType.LIABILITY, level: AccountLevel.MAIN, balance: 0, openingBalance: 0, code: '2', isSystem: true },
        { userId, companyId, name: 'Equity', type: AccountType.EQUITY, level: AccountLevel.MAIN, balance: 0, openingBalance: 0, code: '3', isSystem: true },
        { userId, companyId, name: 'Income', type: AccountType.INCOME, level: AccountLevel.MAIN, balance: 0, openingBalance: 0, code: '4', isSystem: true },
        { userId, companyId, name: 'Expense', type: AccountType.EXPENSE, level: AccountLevel.MAIN, balance: 0, openingBalance: 0, code: '5', isSystem: true },

        { userId, companyId, name: 'Cash and Cash Equivalent', type: AccountType.ASSET, level: AccountLevel.GROUP, parentAccountId: 'm1_FIXED', balance: 0, openingBalance: 0, code: '10000', isSystem: true },
        { userId, companyId, name: 'Accounts Receivable', type: AccountType.ASSET, level: AccountLevel.GROUP, parentAccountId: 'm1_FIXED', balance: 0, openingBalance: 0, code: '20000', isSystem: true },
        { userId, companyId, name: 'Inventory', type: AccountType.ASSET, level: AccountLevel.GROUP, parentAccountId: 'm1_FIXED', balance: 0, openingBalance: 0, code: '30000', isSystem: true },
        { userId, companyId, name: 'Fixed Assets', type: AccountType.ASSET, level: AccountLevel.GROUP, parentAccountId: 'm1_FIXED', balance: 0, openingBalance: 0, code: '40000', isSystem: true },
        { userId, companyId, name: 'Advance Deposit and Prepayments', type: AccountType.ASSET, level: AccountLevel.GROUP, parentAccountId: 'm1_FIXED', balance: 0, openingBalance: 0, code: '50000', isSystem: true },
        { userId, companyId, name: 'Current Tax Assets', type: AccountType.ASSET, level: AccountLevel.GROUP, parentAccountId: 'm1_FIXED', balance: 0, openingBalance: 0, code: '60000', isSystem: true },

        { userId, companyId, name: 'Accounts Payable', type: AccountType.LIABILITY, level: AccountLevel.GROUP, parentAccountId: 'm2_FIXED', balance: 0, openingBalance: 0, code: '70000', isSystem: true },
        { userId, companyId, name: 'Advance Received from Customer', type: AccountType.LIABILITY, level: AccountLevel.GROUP, parentAccountId: 'm2_FIXED', balance: 0, openingBalance: 0, code: '80000', isSystem: true },
        { userId, companyId, name: 'Borrowings from Bank', type: AccountType.LIABILITY, level: AccountLevel.GROUP, parentAccountId: 'm2_FIXED', balance: 0, openingBalance: 0, code: '90000', isSystem: true },
        { userId, companyId, name: 'Current Tax Payable', type: AccountType.LIABILITY, level: AccountLevel.GROUP, parentAccountId: 'm2_FIXED', balance: 0, openingBalance: 0, code: '100000', isSystem: true },
        { userId, companyId, name: 'Provision for Expenses', type: AccountType.LIABILITY, level: AccountLevel.GROUP, parentAccountId: 'm2_FIXED', balance: 0, openingBalance: 0, code: '110000', isSystem: true },

        { userId, companyId, name: 'Share Capital', type: AccountType.EQUITY, level: AccountLevel.GROUP, parentAccountId: 'm3_FIXED', balance: 0, openingBalance: 0, code: '120000', isSystem: true },
        { userId, companyId, name: 'Retained Earnings', type: AccountType.EQUITY, level: AccountLevel.GROUP, parentAccountId: 'm3_FIXED', balance: 0, openingBalance: 0, code: '130000', isSystem: true },
        { userId, companyId, name: 'Calls in Arrear', type: AccountType.EQUITY, level: AccountLevel.GROUP, parentAccountId: 'm3_FIXED', balance: 0, openingBalance: 0, code: '140000', isSystem: true },
        { userId, companyId, name: 'Share Money Deposit', type: AccountType.EQUITY, level: AccountLevel.GROUP, parentAccountId: 'm3_FIXED', balance: 0, openingBalance: 0, code: '150000', isSystem: true },

        { userId, companyId, name: 'Revenue', type: AccountType.INCOME, level: AccountLevel.GROUP, parentAccountId: 'm4_FIXED', balance: 0, openingBalance: 0, code: '160000', isSystem: true },
        { userId, companyId, name: 'Other Income', type: AccountType.INCOME, level: AccountLevel.GROUP, parentAccountId: 'm4_FIXED', balance: 0, openingBalance: 0, code: '170000', isSystem: true },

        { userId, companyId, name: 'Cost of Sales', type: AccountType.EXPENSE, level: AccountLevel.GROUP, parentAccountId: 'm5_FIXED', balance: 0, openingBalance: 0, code: '180000', isSystem: true },
        { userId, companyId, name: 'Administrative Expenses', type: AccountType.EXPENSE, level: AccountLevel.GROUP, parentAccountId: 'm5_FIXED', balance: 0, openingBalance: 0, code: '190000', isSystem: true },
        { userId, companyId, name: 'Distribution Costs', type: AccountType.EXPENSE, level: AccountLevel.GROUP, parentAccountId: 'm5_FIXED', balance: 0, openingBalance: 0, code: '200000', isSystem: true },
        { userId, companyId, name: 'Marketing Expenses', type: AccountType.EXPENSE, level: AccountLevel.GROUP, parentAccountId: 'm5_FIXED', balance: 0, openingBalance: 0, code: '210000', isSystem: true },
        { userId, companyId, name: 'Finance Costs', type: AccountType.EXPENSE, level: AccountLevel.GROUP, parentAccountId: 'm5_FIXED', balance: 0, openingBalance: 0, code: '220000', isSystem: true },
        { userId, companyId, name: 'Income Tax Expense', type: AccountType.EXPENSE, level: AccountLevel.GROUP, parentAccountId: 'm5_FIXED', balance: 0, openingBalance: 0, code: '230000', isSystem: true },

        // System-Controlled Inventory GL Accounts
        { userId, companyId, name: 'Finished Goods', type: AccountType.ASSET, level: AccountLevel.GL, parentAccountId: 'g_30000_PLACEHOLDER', balance: 0, openingBalance: 0, code: '30001', isSystem: true, isInventoryGL: true, isLocked: true },
        { userId, companyId, name: 'Work in Progress', type: AccountType.ASSET, level: AccountLevel.GL, parentAccountId: 'g_30000_PLACEHOLDER', balance: 0, openingBalance: 0, code: '30002', isSystem: true, isInventoryGL: true, isLocked: true },
        { userId, companyId, name: 'Raw Materials', type: AccountType.ASSET, level: AccountLevel.GL, parentAccountId: 'g_30000_PLACEHOLDER', balance: 0, openingBalance: 0, code: '30003', isSystem: true, isInventoryGL: true, isLocked: true },
        { userId, companyId, name: 'Packing Materials', type: AccountType.ASSET, level: AccountLevel.GL, parentAccountId: 'g_30000_PLACEHOLDER', balance: 0, openingBalance: 0, code: '30004', isSystem: true, isInventoryGL: true, isLocked: true },
        { userId, companyId, name: 'Production Supplies & Spare Parts', type: AccountType.ASSET, level: AccountLevel.GL, parentAccountId: 'g_30000_PLACEHOLDER', balance: 0, openingBalance: 0, code: '30005', isSystem: true, isInventoryGL: true, isLocked: true },

        // System-Controlled COGS GL Accounts (Auto-Posted on Sales)
        { userId, companyId, name: 'Cost of Sales – Finished Goods', type: AccountType.EXPENSE, level: AccountLevel.GL, parentAccountId: 'g_180000_PLACEHOLDER', balance: 0, openingBalance: 0, code: '180001', isSystem: true, isLocked: true, isCOGSGL: true },
        { userId, companyId, name: 'Cost of Sales – Work in Progress', type: AccountType.EXPENSE, level: AccountLevel.GL, parentAccountId: 'g_180000_PLACEHOLDER', balance: 0, openingBalance: 0, code: '180002', isSystem: true, isLocked: true, isCOGSGL: true },
        { userId, companyId, name: 'Cost of Sales – Raw Materials', type: AccountType.EXPENSE, level: AccountLevel.GL, parentAccountId: 'g_180000_PLACEHOLDER', balance: 0, openingBalance: 0, code: '180003', isSystem: true, isLocked: true, isCOGSGL: true },
        { userId, companyId, name: 'Cost of Sales – Packing Materials', type: AccountType.EXPENSE, level: AccountLevel.GL, parentAccountId: 'g_180000_PLACEHOLDER', balance: 0, openingBalance: 0, code: '180004', isSystem: true, isLocked: true, isCOGSGL: true },
        { userId, companyId, name: 'Cost of Sales – Production Supplies', type: AccountType.EXPENSE, level: AccountLevel.GL, parentAccountId: 'g_180000_PLACEHOLDER', balance: 0, openingBalance: 0, code: '180005', isSystem: true, isLocked: true, isCOGSGL: true },

        // System-Built GL Accounts (Pre-configured)
        { userId, companyId, name: 'Petty cash', type: AccountType.ASSET, level: AccountLevel.GL, parentAccountId: 'g_10000_PLACEHOLDER', balance: 0, openingBalance: 0, code: '10001', isSystem: true },
        { userId, companyId, name: 'Cash at bank', type: AccountType.ASSET, level: AccountLevel.GL, parentAccountId: 'g_10000_PLACEHOLDER', balance: 0, openingBalance: 0, code: '10002', isSystem: true },
        { userId, companyId, name: 'Customer 01', type: AccountType.ASSET, level: AccountLevel.GL, parentAccountId: 'g_20000_PLACEHOLDER', balance: 0, openingBalance: 0, code: '20001', isSystem: true },
        { userId, companyId, name: 'Supplier 01', type: AccountType.LIABILITY, level: AccountLevel.GL, parentAccountId: 'g_70000_PLACEHOLDER', balance: 0, openingBalance: 0, code: '70001', isSystem: true },
        { userId, companyId, name: 'Sales bill', type: AccountType.INCOME, level: AccountLevel.GL, parentAccountId: 'g_160000_PLACEHOLDER', balance: 0, openingBalance: 0, code: '160001', isSystem: true },
        { userId, companyId, name: 'Bank charge', type: AccountType.EXPENSE, level: AccountLevel.GL, parentAccountId: 'g_220000_PLACEHOLDER', balance: 0, openingBalance: 0, code: '220001', isSystem: false },
      ];

      const mainIdMap: Record<string, string> = {
        '1': `m1_${userId}`,
        '2': `m2_${userId}`,
        '3': `m3_${userId}`,
        '4': `m4_${userId}`,
        '5': `m5_${userId}`
      };

      const groupIdMap: Record<string, string> = {};

      // ✅ FIX: First pass - create main and group accounts
      const accountsToSave: Account[] = [];

      for (const accData of defaultAccounts) {
        let finalId = '';
        let parentId = accData.parentAccountId;

        if (accData.level === AccountLevel.MAIN) {
          finalId = mainIdMap[accData.code];
        } else if (accData.level === AccountLevel.GROUP) {
          finalId = `g_${accData.code}_${userId}`;
          groupIdMap[accData.code] = finalId; // Store mapping for GL accounts
          if (parentId && parentId.endsWith('_FIXED')) {
            const mainCode = parentId.split('_')[0].replace('m', '');
            parentId = mainIdMap[mainCode];
          }
        } else {
          // GL Level
          finalId = `l_${accData.code}_${userId}`;
          if (parentId && parentId.includes('_PLACEHOLDER')) {
            // Extract code: g_10000_PLACEHOLDER -> 10000
            const groupCodeMatch = parentId.match(/g_(\d+)_/);
            if (groupCodeMatch) {
              const groupCode = groupCodeMatch[1];
              parentId = groupIdMap[groupCode] || `g_${groupCode}_${userId}`;
            }
          }
        }

        const account: Account = {
          ...accData,
          id: finalId,
          parentAccountId: parentId || undefined
        };
        accountsToSave.push(account);
      }

      // ✅ FIX: Save all accounts
      for (const account of accountsToSave) {
        store.put(account);
      }

      // ✅ Wait for transaction to complete
      transaction.oncomplete = () => {
        console.log(`✅ Successfully seeded ${accountsToSave.length} default accounts`);
        resolve();
      };

      transaction.onerror = () => {
        console.error('❌ Transaction error during account seeding:', transaction.error);
        reject(transaction.error);
      };
    } catch (error) {
      console.error('❌ Error seeding default accounts:', error);
      reject(error);
    }
  });
};

export const getAllForUser = <T,>(storeName: string, userId: string, db: IDBDatabase): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index('userId');
    const request = index.getAll(userId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveData = <T,>(storeName: string, data: T, db: IDBDatabase): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const deleteData = (storeName: string, id: string, db: IDBDatabase): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// ✅ NEW COMPANY-AWARE FUNCTIONS

/**
 * Get all data for a specific company
 * Uses compound index (userId, companyId) for efficient querying
 * Falls back to getAllForUser if index doesn't exist
 */
export const getAllForCompany = <T,>(
  storeName: string,
  userId: string,
  companyId: string,
  db: IDBDatabase
): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);

      // Check if the index exists
      if (!Array.from(store.indexNames).includes('userIdCompanyId')) {
        // Index doesn't exist, fallback to user filter
        console.warn(`⚠️ Index 'userIdCompanyId' not found on ${storeName}, using getAllForUser fallback`);
        getAllForUser<T>(storeName, userId, db).then(resolve).catch(reject);
        return;
      }

      const index = store.index('userIdCompanyId');
      const request = index.getAll([userId, companyId]);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } catch (error) {
      console.error(`❌ Error in getAllForCompany for ${storeName}:`, error);
      reject(error);
    }
  });
};

/**
 * Create a new company for a user
 */
export const createCompany = async (
  userId: string,
  company: Omit<Company, 'id'>,
  db: IDBDatabase
): Promise<Company> => {
  const companyId = `company_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const newCompany: Company = {
    ...company,
    id: companyId
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction('companies', 'readwrite');
    const store = transaction.objectStore('companies');
    const request = store.put(newCompany);
    request.onsuccess = () => resolve(newCompany);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Get all companies for a user
 */
export const getCompaniesForUser = (userId: string, db: IDBDatabase): Promise<Company[]> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('companies', 'readonly');
    const store = transaction.objectStore('companies');
    const index = store.index('userId');
    const request = index.getAll(userId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Get the active company for a user
 */
export const getActiveCompanyForUser = (userId: string, db: IDBDatabase): Promise<Company | undefined> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('companies', 'readonly');
    const store = transaction.objectStore('companies');
    const index = store.index('userId');
    const request = index.getAll(userId);
    request.onsuccess = () => {
      const result = request.result as Company[];
      resolve(result.length > 0 ? result[0] : undefined);
    };
    request.onerror = () => reject(request.error);
  });
};

/**
 * Switch active company for a user
 */
export const switchActiveCompany = async (
  userId: string,
  newCompanyId: string,
  db: IDBDatabase
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('companies', 'readwrite');
    const store = transaction.objectStore('companies');
    const index = store.index('userId');
    const getAllRequest = index.getAll(userId);

    getAllRequest.onsuccess = () => {
      const companies = getAllRequest.result as Company[];

      companies.forEach(company => {
        const updatedCompany = {
          ...company,
          isActive: company.id === newCompanyId
        };
        store.put(updatedCompany);
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };

    getAllRequest.onerror = () => reject(getAllRequest.error);
  });
};

/**
 * Get a single company by ID
 */
export const getCompanyById = (companyId: string, db: IDBDatabase): Promise<Company | undefined> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('companies', 'readonly');
    const store = transaction.objectStore('companies');
    const request = store.get(companyId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};
