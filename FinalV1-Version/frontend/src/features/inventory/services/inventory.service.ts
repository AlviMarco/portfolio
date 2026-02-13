/**
 * INVENTORY SERVICE
 * 
 * Pure business logic for inventory management.
 * - Sub-ledger operations
 * - Weighted average cost calculation
 * - Sales and purchase voucher creation with automatic GL posting
 * - Inventory validation and reconciliation
 * 
 * RESPONSIBILITY:
 * - All inventory double-entry accounting
 * - Weighted average cost method
 * - GL-Inventory sync validation
 * - Inventory movement tracking
 */

import { 
  InventorySubLedger, 
  InventoryMovement, 
  Account, 
  Transaction, 
  JournalEntry,
  AccountType,
  AccountLevel,
  VoucherType
} from '../../../core/types';

/**
 * Gets all inventory GL accounts for a user.
 * Sorted alphabetically (A → Z) for consistent UX
 */
export const getInventoryGLAccounts = (accounts: Account[]): Account[] => {
  const inventoryGLs = accounts.filter(a => a.isInventoryGL === true && a.level === AccountLevel.GL);
  // Sort alphabetically by name (A → Z)
  return inventoryGLs.sort((a, b) => {
    return a.name.localeCompare(b.name, undefined, {
      numeric: false,
      sensitivity: 'base'
    });
  });
};

/**
 * Gets all sub-ledgers for a specific inventory GL account.
 */
export const getSubLedgersForGL = (
  glAccountId: string,
  subLedgers: InventorySubLedger[]
): InventorySubLedger[] => {
  return subLedgers.filter(sl => sl.inventoryGLAccountId === glAccountId);
};

/**
 * Calculates the weighted average cost for an inventory item.
 * 
 * Formula: Total Purchase Value / Total Purchase Quantity
 * Only uses IN movements (purchases), never OUT movements (sales)
 */
export const calculateWeightedAverageCost = (
  subLedgerId: string,
  movements: InventoryMovement[]
): number => {
  const inMovements = movements.filter(m => 
    m.subLedgerId === subLedgerId && m.movementType === 'IN'
  );
  
  if (inMovements.length === 0) return 0;

  const totalValue = inMovements.reduce((sum, m) => sum + m.amount, 0);
  const totalQuantity = inMovements.reduce((sum, m) => sum + m.quantity, 0);

  if (totalQuantity === 0) return 0;
  
  const wac = totalValue / totalQuantity;
  console.log(`✅ WAC Calculated: Total Value ৳${totalValue} / Total Qty ${totalQuantity} = ৳${wac.toFixed(2)} per unit`);
  
  return wac;
};

/**
 * Calculates the closing balance for a sub-ledger up to a specific date.
 * ✅ FIXED: Properly handles undefined values to prevent NaN
 */
export const calculateSubLedgerBalance = (
  subLedgerId: string,
  movements: InventoryMovement[],
  upToDate?: string
): { quantity: number; value: number } => {
  const relevantMovements = upToDate
    ? movements.filter(m => m.subLedgerId === subLedgerId && m.date <= upToDate)
    : movements.filter(m => m.subLedgerId === subLedgerId);

  const inMovements = relevantMovements.filter(m => m.movementType === 'IN');
  const outMovements = relevantMovements.filter(m => m.movementType === 'OUT');

  // ✅ CRITICAL FIX: Initialize with 0 to prevent NaN
  const totalInQty = inMovements.reduce((sum, m) => sum + (m.quantity || 0), 0);
  const totalOutQty = outMovements.reduce((sum, m) => sum + (m.quantity || 0), 0);
  const closingQuantity = totalInQty - totalOutQty;

  // ✅ CRITICAL FIX: Use cosAmount for OUT movements (COGS), properly handle undefined
  const totalInValue = inMovements.reduce((sum, m) => sum + (m.amount || 0), 0);
  const totalOutValue = outMovements.reduce((sum, m) => sum + (m.cosAmount || m.amount || 0), 0);
  const closingValue = totalInValue - totalOutValue;

  return {
    quantity: Math.max(0, closingQuantity || 0),
    value: Math.max(0, closingValue || 0)
  };
};

/**
 * Validates that a sub-ledger has valid data before saving.
 */
export const validateSubLedger = (data: Partial<InventorySubLedger>): string | null => {
  if (!data.itemName || data.itemName.trim() === '') {
    return 'Item name is required';
  }
  if (data.quantity === undefined || data.quantity < 0) {
    return 'Quantity must be non-negative';
  }
  if (data.rate === undefined || data.rate < 0) {
    return 'Rate must be non-negative';
  }
  return null;
};

/**
 * Validates that sales don't exceed available inventory.
 */
export const validateSufficientInventory = (
  subLedgerId: string,
  saleQuantity: number,
  movements: InventoryMovement[]
): boolean => {
  const balance = calculateSubLedgerBalance(subLedgerId, movements);
  return saleQuantity <= balance.quantity;
};

/**
 * Validates that inventory never goes negative.
 */
export const validateNegativeInventory = (
  subLedgerId: string,
  movements: InventoryMovement[]
): boolean => {
  const balance = calculateSubLedgerBalance(subLedgerId, movements);
  return balance.quantity >= 0;
};

/**
 * Comprehensive validation before sales voucher creation.
 * Checks sufficient inventory for all items.
 */
export const validateSalesVoucherInventory = (
  voucherItems: Array<{ subLedgerId: string; quantity: number }>,
  movements: InventoryMovement[]
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  for (const item of voucherItems) {
    if (!validateSufficientInventory(item.subLedgerId, item.quantity, movements)) {
      const balance = calculateSubLedgerBalance(item.subLedgerId, movements);
      errors.push(`Insufficient inventory: Item requires ${item.quantity} units but only ${balance.quantity} available`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates GL-Inventory synchronization.
 * GL balance should equal sum of all sub-ledger closing values.
 */
export const validateInventoryGLSync = (
  glAccountId: string,
  glBalance: number,
  subLedgers: InventorySubLedger[],
  movements: InventoryMovement[]
): { isSynced: boolean; glBalance: number; subLedgerTotal: number; variance: number } => {
  const relevantSubLedgers = subLedgers.filter(sl => sl.inventoryGLAccountId === glAccountId);
  
  let subLedgerTotal = 0;
  for (const sl of relevantSubLedgers) {
    const balance = calculateSubLedgerBalance(sl.id, movements);
    subLedgerTotal += balance.value;
  }

  const variance = Math.abs(glBalance - subLedgerTotal);
  const isSynced = variance < 0.01; // Allow 1 paisa difference

  return {
    isSynced,
    glBalance,
    subLedgerTotal,
    variance
  };
};

/**
 * Gets all inventory movements for a specific transaction.
 * Useful for edit/delete operations to find what needs to be reversed.
 */
export const getMovementsForTransaction = (
  voucherId: string,
  movements: InventoryMovement[]
): InventoryMovement[] => {
  return movements.filter(m => m.voucherId === voucherId);
};

/**
 * Calculates total inventory value across all sub-ledgers.
 */
export const calculateTotalInventoryValue = (
  subLedgers: InventorySubLedger[],
  movements: InventoryMovement[]
): number => {
  return subLedgers.reduce((total, sl) => {
    const balance = calculateSubLedgerBalance(sl.id, movements);
    return total + balance.value;
  }, 0);
};

/**
 * Generates a unique sub-ledger ID.
 */
export const generateSubLedgerId = (): string => {
  return `sl_${crypto.randomUUID()}`;
};

/**
 * Gets audit trail of all movements for a specific sub-ledger.
 */
export const getSubLedgerAuditTrail = (
  subLedgerId: string,
  movements: InventoryMovement[]
): InventoryMovement[] => {
  return movements
    .filter(m => m.subLedgerId === subLedgerId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

/**
 * Calculates running balance for a sub-ledger (useful for audit trail).
 */
export const calculateRunningBalance = (
  subLedgerId: string,
  movements: InventoryMovement[]
): Array<{ movement: InventoryMovement; runningQuantity: number; runningValue: number }> => {
  const trail = getSubLedgerAuditTrail(subLedgerId, movements);
  const results: Array<{ movement: InventoryMovement; runningQuantity: number; runningValue: number }> = [];
  
  let runningQuantity = 0;
  let runningValue = 0;

  for (const movement of trail) {
    if (movement.movementType === 'IN') {
      runningQuantity += movement.quantity;
      runningValue += movement.amount;
    } else {
      runningQuantity -= movement.quantity;
      runningValue -= (movement.cosAmount || 0);
    }

    results.push({
      movement,
      runningQuantity: Math.max(0, runningQuantity),
      runningValue: Math.max(0, runningValue)
    });
  }

  return results;
};

/**
 * Gets all accounts that can receive accounts receivable postings.
 * Sorted alphabetically (A → Z)
 */
export const getReceivableGLAccounts = (accounts: Account[]): Account[] => {
  const receivableGroup = accounts.find(a => a.code === '20000');
  if (!receivableGroup) return [];
  const receivableAccounts = accounts.filter(a => a.parentAccountId === receivableGroup.id && a.level === AccountLevel.GL);
  return receivableAccounts.sort((a, b) => {
    return a.name.localeCompare(b.name, undefined, { numeric: false, sensitivity: 'base' });
  });
};

/**
 * Gets all accounts that can receive accounts payable postings.
 * Sorted alphabetically (A → Z)
 */
export const getPayableGLAccounts = (accounts: Account[]): Account[] => {
  const payableGroup = accounts.find(a => a.code === '70000');
  if (!payableGroup) return [];
  const payableAccounts = accounts.filter(a => a.parentAccountId === payableGroup.id && a.level === AccountLevel.GL);
  return payableAccounts.sort((a, b) => {
    return a.name.localeCompare(b.name, undefined, { numeric: false, sensitivity: 'base' });
  });
};

/**
 * Gets all COGS GL accounts.
 */
export const getCOGSGLAccounts = (accounts: Account[]): Account[] => {
  return accounts.filter(a => a.isCOGSGL === true && a.level === AccountLevel.GL);
};

/**
 * Gets all Sales Revenue GL accounts.
 */
export const getSalesGLAccounts = (accounts: Account[]): Account[] => {
  const incomeGroup = accounts.find(a => a.type === AccountType.INCOME && a.code === '140000');
  if (!incomeGroup) return [];
  return accounts.filter(a => a.parentAccountId === incomeGroup.id && a.level === AccountLevel.GL);
};

/**
 * Checks if an inventory GL account is locked (system account).
 */
export const isInventoryGLLocked = (glAccountId: string, accounts: Account[]): boolean => {
  const account = accounts.find(a => a.id === glAccountId);
  return account?.isLocked === true;
};
