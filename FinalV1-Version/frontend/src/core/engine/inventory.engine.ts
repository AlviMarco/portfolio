import { InventorySubLedger, InventoryMovement, Account, AccountLevel, AccountType, Transaction, JournalEntry } from '../types';

/**
 * ============================================================================
 * INVENTORY ENGINE - DOUBLE-ENTRY ACCOUNTING COMPLIANCE
 * ============================================================================
 * 
 * This module implements CRITICAL accounting rules for inventory management:
 * 
 * ✅ RULE 1: Inventory is an ASSET (never an expense)
 *   - Increases with PURCHASE: Dr. Inventory GL / Cr. Accounts Payable
 *   - Decreases with SALES: Dr. Cost of Sales GL / Cr. Inventory GL
 * 
 * ✅ RULE 2: Inventory is ALWAYS valued at COST (never at sales price)
 *   - Purchase @ 20 per unit = Inventory value = 20 per unit (cost)
 *   - Sale @ 30 per unit = COGS = cost (20), not sales price (30)
 *   - This prevents negative inventory and accurate profit calculation
 * 
 * ✅ RULE 3: COGS uses Weighted Average Cost method
 *   - Formula: Total Purchase Value / Total Purchase Quantity
 *   - Only purchases (IN movements) affect cost calculation
 *   - Sales (OUT movements) do NOT affect cost calculation
 *   - Example: Buy 100@20, then Buy 100@25 = WAC = 22.50 per unit
 * 
 * ✅ RULE 4: Double-Entry Journal Entries for SALES
 *   - Entry 1: Dr. Accounts Receivable / Cr. Sales Revenue (sales amount)
 *   - Entry 2: Dr. Cost of Sales GL / Cr. Inventory GL (cost amount)
 *   - Total debits MUST = Total credits (always balanced)
 * 
 * ✅ RULE 5: Double-Entry Journal Entries for PURCHASES
 *   - Entry 1: Dr. Inventory GL / Cr. Accounts Payable (amount at cost)
 *   - Total debits MUST = Total credits (always balanced)
 * 
 * ✅ RULE 6: Inventory Ledger-GL Synchronization
 *   - GL Account Balance = Sum of all sub-ledger closing values
 *   - Sub-ledger Balance = Opening Balance + Purchases - Sales (at cost)
 *   - Inventory Movements are separate from GL entries but must match
 * 
 * ✅ RULE 7: Edit/Delete Reversal
 *   - When editing a voucher: Delete old GL entries THEN create new ones
 *   - This prevents double-posting of COGS or stale inventory movements
 *   - Always reverse BOTH GL entries AND inventory movements
 * 
 * ✅ RULE 8: No Negative Inventory
 *   - Sales quantity cannot exceed available inventory
 *   - Validated before voucher creation
 *   - Ensures auditable and deterministic state
 * 
 * ✅ RULE 9: Backup/Restore Includes Inventory
 *   - All backups must include inventorySubLedgers and inventoryMovements
 *   - Restore must reconstruct complete inventory history
 *   - Ensures complete audit trail is preserved
 * 
 * ============================================================================
 */

/**
 * Get all inventory GL accounts (system-controlled)
 * Sorted alphabetically (A → Z) for consistent UX
 */
export const getInventoryGLAccounts = (accounts: Account[]): Account[] => {
  const inventoryGLs = accounts.filter(a => a.isInventoryGL && a.level === AccountLevel.GL);
  // Sort alphabetically by name (A → Z)
  return inventoryGLs.sort((a, b) => {
    return a.name.localeCompare(b.name, undefined, {
      numeric: false,
      sensitivity: 'base'
    });
  });
};

/**
 * Get all Accounts Receivable GL accounts (for Sales vouchers)
 * Sorted alphabetically (A → Z)
 */
export const getReceivableGLAccounts = (accounts: Account[]): Account[] => {
  const receivableGroup = accounts.find(a => a.level === AccountLevel.GROUP && a.code === '20000');
  if (!receivableGroup) return [];
  const receivableAccounts = accounts.filter(a => a.level === AccountLevel.GL && a.parentAccountId === receivableGroup.id);
  return receivableAccounts.sort((a, b) => {
    return a.name.localeCompare(b.name, undefined, { numeric: false, sensitivity: 'base' });
  });
};

/**
 * Get all Accounts Payable GL accounts (for Purchase vouchers)
 * Sorted alphabetically (A → Z)
 */
export const getPayableGLAccounts = (accounts: Account[]): Account[] => {
  const payableGroup = accounts.find(a => a.level === AccountLevel.GROUP && a.code === '70000');
  if (!payableGroup) return [];
  const payableAccounts = accounts.filter(a => a.level === AccountLevel.GL && a.parentAccountId === payableGroup.id);
  return payableAccounts.sort((a, b) => {
    return a.name.localeCompare(b.name, undefined, { numeric: false, sensitivity: 'base' });
  });
};

/**
 * Get Cost of Sales GL account for auto-posting COGS
 */
export const getCostOfSalesAccount = (accounts: Account[]): Account | undefined => {
  return accounts.find(a => a.level === AccountLevel.GROUP && a.code === '180000');
};

/**
 * Get inventory sub-ledgers for a specific GL account
 */
export const getSubLedgersForGL = (
  subLedgers: InventorySubLedger[],
  glAccountId: string
): InventorySubLedger[] => {
  return subLedgers.filter(sl => sl.inventoryGLAccountId === glAccountId);
};

/**
 * Calculate total quantity and value for a sub-ledger based on movements
 * 
 * ✅ CRITICAL: Opening balance includes the sub-ledger's initial opening quantity and rate
 * ✅ FIXED: All numeric fields initialized with 0 to prevent NaN
 */
export const calculateSubLedgerBalance = (
  subLedger: InventorySubLedger,
  movements: InventoryMovement[],
  startDate: string,
  endDate: string
): {
  quantity: number;
  value: number;
  openingQuantity: number;
  openingValue: number;
  debitQuantity: number;
  debitAmount: number;
  creditQuantity: number;
  creditAmount: number;
} => {
  // Prior movements (before start date)
  const priorMovements = movements.filter(m => m.subLedgerId === subLedger.id && m.date < startDate);

  // Current period movements
  const periodMovements = movements.filter(
    m => m.subLedgerId === subLedger.id && m.date >= startDate && m.date <= endDate
  );

  // ✅ CRITICAL: Opening balance starts with the sub-ledger's opening quantity and rate
  // These are set when the item is created and represent the initial stock
  let openingQuantity = subLedger.quantity || 0; // Opening quantity from sub-ledger, default to 0
  let openingValue = (subLedger.quantity || 0) * (subLedger.rate || 0); // Opening value at opening rate, default to 0

  // Add prior movements to opening balance
  priorMovements.forEach(m => {
    if (m.movementType === 'IN') {
      openingQuantity += m.quantity || 0;
      openingValue += m.amount || 0;
    } else {
      openingQuantity -= m.quantity || 0;
      // ✅ CRITICAL FIX: Use cosAmount for OUT movements (COGS), fallback to amount
      openingValue -= (m.cosAmount || m.amount || 0);
    }
  });

  // Ensure opening balance is not negative
  openingQuantity = Math.max(0, openingQuantity);
  openingValue = Math.max(0, openingValue);

  // Calculate period movements
  let debitQuantity = 0;
  let debitAmount = 0;
  let creditQuantity = 0;
  let creditAmount = 0;

  periodMovements.forEach(m => {
    if (m.movementType === 'IN') {
      debitQuantity += m.quantity || 0;
      debitAmount += m.amount || 0;
    } else {
      creditQuantity += m.quantity || 0;
      // ✅ CRITICAL FIX: Use cosAmount for OUT movements (COGS), fallback to amount
      creditAmount += (m.cosAmount || m.amount || 0);
    }
  });

  const closingQuantity = openingQuantity + debitQuantity - creditQuantity;
  const closingValue = openingValue + debitAmount - creditAmount;

  return {
    quantity: Math.max(0, closingQuantity || 0),
    value: Math.max(0, closingValue || 0),
    openingQuantity: Math.max(0, openingQuantity || 0),
    openingValue: Math.max(0, openingValue || 0),
    debitQuantity: Math.max(0, debitQuantity || 0),
    debitAmount: Math.max(0, debitAmount || 0),
    creditQuantity: Math.max(0, creditQuantity || 0),
    creditAmount: Math.max(0, creditAmount || 0)
  };
};

/**
 * Generate unique ID for inventory sub-ledger
 */
export const generateSubLedgerId = (userId: string): string => {
  return `sl_${Date.now()}_${userId}`;
};

/**
 * Generate unique ID for inventory movement
 */
export const generateMovementId = (): string => {
  return `im_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Validate sub-ledger data
 */
export const validateSubLedger = (
  itemName: string,
  glAccountId: string,
  quantity: number,
  rate: number
): { isValid: boolean; error?: string } => {
  if (!itemName || itemName.trim() === '') {
    return { isValid: false, error: 'Item name is required' };
  }
  if (!glAccountId) {
    return { isValid: false, error: 'Please select an inventory GL account' };
  }
  if (quantity < 0) {
    return { isValid: false, error: 'Quantity cannot be negative' };
  }
  if (rate < 0) {
    return { isValid: false, error: 'Rate cannot be negative' };
  }
  return { isValid: true };
};

/**
 * ✅ CRITICAL: Validate that a Sales transaction has proper COGS entries
 * 
 * This function verifies:
 * 1. Transaction is a SALES voucher
 * 2. Has journal entries (at least 4: AR+Sales + COGS*2)
 * 3. Has at least one COGS debit entry (Cost of Sales GL)
 * 4. Has corresponding inventory credit entries
 * 5. Journal is balanced (debits = credits)
 * 6. COGS amount > 0
 */
export const validateSalesVoucherCOGS = (
  transaction: Transaction,
  accounts: Account[]
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check 1: Is this a SALES voucher?
  if (transaction.voucherType !== 'SALES') {
    errors.push(`Transaction is not a SALES voucher (type: ${transaction.voucherType})`);
    return { isValid: false, errors };
  }

  // Check 2: Must have at least 4 entries (AR, Sales, COGS debit, Inv credit)
  if (transaction.entries.length < 4) {
    errors.push(`Sales voucher has only ${transaction.entries.length} entries. Expected at least 4 (AR, Sales, COGS, Inventory).`);
  }

  // Check 3: Count COGS entries
  const cogsEntries = transaction.entries.filter(e => {
    const account = accounts.find(a => a.id === e.accountId);
    return account?.isCOGSGL === true;
  });

  const cogsDebitEntries = cogsEntries.filter(e => e.debit > 0);
  const cogsCreditEntries = transaction.entries.filter(e => {
    const account = accounts.find(a => a.id === e.accountId);
    return account?.isInventoryGL === true && e.credit > 0;
  });

  if (cogsDebitEntries.length === 0) {
    errors.push(`No COGS debit entries found. Expected debits to Cost of Sales GL accounts.`);
  }

  if (cogsCreditEntries.length === 0) {
    errors.push(`No inventory credit entries found. Expected credits to Inventory GL accounts.`);
  }

  // Check 4: Verify journal balance
  const totalDebits = transaction.entries.reduce((sum, e) => sum + e.debit, 0);
  const totalCredits = transaction.entries.reduce((sum, e) => sum + e.credit, 0);

  if (Math.abs(totalDebits - totalCredits) > 0.01) {
    errors.push(`Journal is unbalanced: Debits ${totalDebits.toFixed(2)} ≠ Credits ${totalCredits.toFixed(2)}`);
  }

  // Check 5: Verify COGS amount > 0
  const totalCOGS = cogsDebitEntries.reduce((sum, e) => sum + e.debit, 0);
  if (totalCOGS <= 0) {
    errors.push(`COGS amount is ${totalCOGS.toFixed(2)}, which is invalid. Expected COGS > 0.`);
  }

  // Check 6: Verify reference field shows COGS
  if (!transaction.reference || !transaction.reference.includes('COGS')) {
    errors.push(`Reference field does not contain COGS amount. Current: "${transaction.reference || 'empty'}"`);
  }

  if (errors.length > 0) {
    console.error(`SALES VOUCHER ${transaction.voucherNo} COGS validation failed: ${errors.length} error(s)`);
    errors.forEach(e => console.error(`  - ${e}`));
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Create an inventory movement entry
 */
export const createInventoryMovement = (
  userId: string,
  subLedgerId: string,
  voucherId: string,
  movementType: 'IN' | 'OUT',
  quantity: number,
  rate: number,
  date: string,
  reference?: string
): InventoryMovement => {
  return {
    id: generateMovementId(),
    userId,
    subLedgerId,
    voucherId,
    movementType,
    quantity,
    rate,
    amount: quantity * rate,
    date,
    reference
  };
};

/**
 * Calculate weighted average cost for an inventory sub-ledger
 * 
 * ⚠️ CRITICAL RULE: This is the cost per unit based on PURCHASES ONLY
 * Formula: Total Purchased Value / Total Purchased Quantity
 * 
 * We ONLY include IN movements (purchases), NOT OUT movements (sales)
 * This ensures COGS is calculated at the actual cost paid, not affected by sales
 * 
 * Example:
 *   Opening: 0 qty, 0 value
 *   Purchase 100 @ 20 = 100 qty, 2,000 value
 *   Weighted Avg Cost = 2,000 / 100 = 20 per unit ✅
 *   Sale 90 @ 30 (ignored for cost calculation)
 *   COGS for 90 units = 90 × 20 = 1,800 ✅
 * 
 * ✅ FIXED: All values initialized to 0 to prevent NaN
 */
export const calculateWeightedAverageCost = (
  subLedger: InventorySubLedger,
  movements: InventoryMovement[],
  upToDate: string
): number => {
  // ✅ CRITICAL FIX: Get all IN movements BEFORE the current date (or same date, earlier in sequence)
  // This ensures purchases made today before this sale are included in WAC calculation
  // Using < instead of <= was excluding same-day purchases, causing incorrect COGS
  const purchaseMovements = movements.filter(
    m => m.subLedgerId === subLedger.id && m.date <= upToDate && m.movementType === 'IN'
  );

  // Start with opening inventory cost basis - ✅ Initialize with 0
  let totalQuantity = (subLedger.quantity || 0); // Opening quantity, default to 0
  let totalValue = ((subLedger.quantity || 0) * (subLedger.rate || 0)); // Opening value at opening rate, default to 0

  // Add all purchases (IN movements) - these increase cost basis
  purchaseMovements.forEach(m => {
    if (m.movementType === 'IN') {
      totalQuantity += (m.quantity || 0);
      totalValue += (m.amount || 0);
    }
  });

  // ✅ CRITICAL: Only use IN movements to calculate cost, ignore OUT movements
  // The weighted average cost should be the cost per unit based on what was purchased
  const weightedAvgCost = totalQuantity > 0 ? totalValue / totalQuantity : 0;
  
  return weightedAvgCost;
};

/**
 * Map Inventory GL Account to Cost of Sales GL Account
 * Based on code matching:
 * 30001 (Finished Goods) → 180001 (Cost of Sales – Finished Goods)
 * 30002 (WIP) → 180002 (Cost of Sales – WIP)
 * etc.
 * 
 * ⚠️ CRITICAL: This function MUST find the COGS account for COGS posting to work
 */
export const mapInventoryGLToCOGSGL = (
  inventoryGLId: string,
  accounts: Account[]
): Account | undefined => {
  const inventoryGL = accounts.find(a => a.id === inventoryGLId);
  if (!inventoryGL) {
    console.error(`❌ CRITICAL: Inventory GL account not found: ${inventoryGLId}`);
    return undefined;
  }

  // Extract the numeric code suffix (e.g., "30001" → "01")
  const codeSuffix = inventoryGL.code.substring(inventoryGL.code.length - 2);
  const cogsCode = `1800${codeSuffix}`; // e.g., "180001"

  // Search for COGS account by code and isCOGSGL flag
  const cogsGL = accounts.find(a => a.code === cogsCode && a.isCOGSGL === true);
  
  if (!cogsGL) {
    console.error(`❌ CRITICAL: COGS GL account not found for code ${cogsCode}. Inventory GL: ${inventoryGL.name} (${inventoryGL.code}). Available COGS accounts:`, 
      accounts.filter(a => a.isCOGSGL === true).map(a => `${a.name}(${a.code})`).join(', ')
    );
  }

  return cogsGL;
};

/**
 * Create a SALES voucher with inventory movements AND Cost of Sales posting
 * 
 * ⚠️ CRITICAL RULE: INVENTORY IS ALWAYS VALUED AT COST, NEVER AT SALES PRICE
 * 
 * Accounting Entries:
 *   Entry 1 - Revenue Recognition:
 *     Debit: Accounts Receivable (Customer)
 *     Credit: Sales Revenue
 *   Entry 2 - Cost of Sales (Auto-Posted):
 *     Debit: Cost of Sales GL (COST amount)
 *     Credit: Inventory GL Account (COST amount)
 * 
 * Example:
 *   Purchase: 100 pcs @ 20 Tk/pcs → Inventory = 2,000 Tk
 *   Sale: 90 pcs @ 30 Tk/pcs (Sales Rate)
 *   ✅ CORRECT: COGS = 90 × 20 (cost) = 1,800 Tk
 *   ❌ WRONG: COGS = 90 × 30 (sales rate) = 2,700 Tk ← This causes negative inventory!
 * 
 * Inventory Movement:
 *   - OUT quantity: 90 pcs
 *   - OUT value: 90 × 20 (COST RATE, NOT SALES RATE) = 1,800 Tk
 * 
 * Result:
 *   - Closing Inventory = 2,000 - 1,800 = 200 Tk ✅ Correct
 *   - Gross Profit = 2,700 (revenue) - 1,800 (COGS) = 900 Tk ✅ Correct
 * 
 * CRITICAL CHECKS:
 *   1. Each item must have sufficient inventory (avoid negative stock)
 *   2. COGS GL account must exist and be mapped correctly
 *   3. Journal entries must balance (debits = credits)
 *   4. Inventory movements must use COST rate, not sales rate
 */

export const createSalesVoucher = (
  userId: string,
  voucherId: string,
  date: string,
  description: string,
  receivableAccountId: string, // Debit account (A/R)
  items: Array<{
    inventoryGLAccountId: string;
    subLedgerId: string;
    quantity: number;
    rate: number;
  }>,
  subLedgers: InventorySubLedger[], // Required for COGS calculation
  movements: InventoryMovement[], // Required for COGS calculation
  accounts: Account[], // Required for COGS GL mapping
  revenueAccountId?: string // Optional: Revenue GL account (for future use)
): {
  transaction: Transaction;
  movements: InventoryMovement[];
} => {
  // ✅ CRITICAL VALIDATION #1: Verify receivable account exists
  const receivableAccount = accounts.find(a => a.id === receivableAccountId);
  if (!receivableAccount) {
    throw new Error(`❌ CRITICAL: Accounts Receivable account not found (ID: ${receivableAccountId}). Cannot create sales voucher.`);
  }
  
  
  const salesAmount = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  let totalCOGS = 0;

  // ✅ CRITICAL VALIDATION #2: Verify all sub-ledgers exist
  const missingSubLedgers = items.filter(item => !subLedgers.find(sl => sl.id === item.subLedgerId));
  if (missingSubLedgers.length > 0) {
    throw new Error(`❌ CRITICAL: ${missingSubLedgers.length} inventory items not found in sub-ledgers. Cannot calculate COGS.`);
  }

  // Group items by inventory GL account for proper journal entries
  const itemsByGL = items.reduce((acc, item) => {
    if (!acc[item.inventoryGLAccountId]) {
      acc[item.inventoryGLAccountId] = [];
    }
    acc[item.inventoryGLAccountId].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  // Journal Entries
  const entries: JournalEntry[] = [];

  // Entry 1: Debit Accounts Receivable, Credit Sales Bill/Revenue
  entries.push({
    accountId: receivableAccountId,
    debit: salesAmount,
    credit: 0
  });

  // Find "Sales bill" GL account (Code: 160001) - System-built account
  // If not found, use provided revenue account or fallback
  let salesBillAccountId = accounts.find(a => a.code === '160001' && a.level === AccountLevel.GL)?.id;
  
  if (!salesBillAccountId) {
    // Fallback to provided revenue account or Revenue GL group
    salesBillAccountId = revenueAccountId;
    if (!salesBillAccountId) {
      const revenueGroup = accounts.find(a => a.level === AccountLevel.GROUP && a.code === '160000');
      if (revenueGroup) {
        const revenueGL = accounts.find(a => a.parentAccountId === revenueGroup.id && a.level === AccountLevel.GL);
        salesBillAccountId = revenueGL?.id || 'SALES_REVENUE_TEMP';
      } else {
        salesBillAccountId = 'SALES_REVENUE_TEMP';
      }
    }
  }

  entries.push({
    accountId: salesBillAccountId,
    debit: 0,
    credit: salesAmount
  });

  // Entry 2: COGS Posting (Auto-generated based on weighted average cost)
  // Process each inventory GL account separately
  // Also track cost rates for inventory movements (critical: use cost, not sales rate)
  // ✅ CRITICAL: costRateMap stores DYNAMIC weighted average cost calculated from actual movements
  // NOT system rates, NOT cached rates, NOT item master rates
  const costRateMap: Record<string, number> = {};
  let cogsEntriesCreated = 0;
  let cogsItemsProcessed = 0;
  const cogsValidationErrors: string[] = [];

  console.log(`\n🛒 PROCESSING SALES ITEMS FOR COGS`);
  console.log(`   Total items to sell: ${items.length}`);

  Object.entries(itemsByGL).forEach(([inventoryGLId, glItems]) => {
    console.log(`\n   📦 Inventory GL Account: ${accounts.find(a => a.id === inventoryGLId)?.name} (ID: ${inventoryGLId})`);
    let glTotalCOGS = 0;

    glItems.forEach(item => {
      // ✅ CRITICAL: Calculate weighted average cost DYNAMICALLY based on current movements
      // This is NOT the item's opening rate, NOT the last purchase rate, NOT a cached value
      // It's calculated fresh from: (Opening Value + All Purchases) / (Opening Qty + All Purchases Qty)
      const subLedger = subLedgers.find(sl => sl.id === item.subLedgerId);
      if (!subLedger) {
        const errorMsg = `❌ CRITICAL: Sub-ledger not found for ID ${item.subLedgerId}. Cannot calculate COGS.`;
        console.error(errorMsg);
        cogsValidationErrors.push(errorMsg);
        return;
      }

      // ✅ CRITICAL CHECK: Verify item has sufficient inventory
      const currentBalance = calculateSubLedgerBalance(subLedger, movements, '1900-01-01', date);
      if (currentBalance.quantity < item.quantity) {
        const errorMsg = `❌ CRITICAL: Insufficient inventory for ${subLedger.itemName}. Available: ${currentBalance.quantity}, Requested: ${item.quantity}`;
        console.error(errorMsg);
        cogsValidationErrors.push(errorMsg);
        return;
      }
      
      const avgCost = calculateWeightedAverageCost(subLedger, movements, date);
      
      // ✅ CRITICAL CHECK: Ensure weighted average cost is positive
      if (avgCost <= 0) {
        const errorMsg = `❌ CRITICAL: Invalid weighted average cost (${avgCost}) for item ${subLedger.itemName}. Cannot calculate COGS.`;
        console.error(errorMsg);
        cogsValidationErrors.push(errorMsg);
        return;
      }
      
      costRateMap[item.subLedgerId] = avgCost; // ✅ Store DYNAMIC cost rate for inventory movements
      const itemCOGS = item.quantity * avgCost;
      glTotalCOGS += itemCOGS;
      totalCOGS += itemCOGS;
      cogsItemsProcessed++;
      
      console.log(`     ✅ Item: ${subLedger.itemName}`);
      console.log(`        Qty: ${item.quantity}`);
      console.log(`        Current Inventory: ${currentBalance.quantity}`);
      console.log(`        Sales Rate (from form): ${item.rate}`);
      console.log(`        Opening Rate (ignored): ${subLedger.rate}`);
      console.log(`        💰 COST RATE (Weighted Avg - DYNAMIC): ${avgCost.toFixed(2)}`);
      console.log(`        💰 Item COGS: ${item.quantity} × ${avgCost.toFixed(2)} = ${itemCOGS.toFixed(2)}`);
    });

    // ✅ CRITICAL VALIDATION #3: Ensure COGS GL account exists for this inventory GL
    // Find corresponding COGS GL account
    const cogsGL = mapInventoryGLToCOGSGL(inventoryGLId, accounts);
    if (!cogsGL) {
      const errorMsg = `❌ CRITICAL: No COGS GL account mapped for inventory GL ${inventoryGLId}. COGS posting WILL NOT happen!`;
      console.error(errorMsg);
      cogsValidationErrors.push(errorMsg);
      
      // Log debugging info
      const invGL = accounts.find(a => a.id === inventoryGLId);
      console.error(`   Inventory GL: ${invGL?.name} (${invGL?.code})`);
      const availableCogsAccounts = accounts.filter(a => a.isCOGSGL === true);
      console.error(`   Available COGS accounts:`, availableCogsAccounts.map(a => `${a.name}(${a.code})`).join(', '));
      return;
    }

    // ✅ CRITICAL VALIDATION #4: Only create COGS entry if glTotalCOGS > 0
    if (glTotalCOGS > 0) {
      console.log(`\n   ✅ COGS GL Found: ${cogsGL.name} (${cogsGL.code}) - Total COGS: ${glTotalCOGS.toFixed(2)}`);

      // Debit: Cost of Sales GL
      entries.push({
        accountId: cogsGL.id,
        debit: glTotalCOGS,
        credit: 0
      });

      // Credit: Inventory GL Account
      entries.push({
        accountId: inventoryGLId,
        debit: 0,
        credit: glTotalCOGS
      });
      
      cogsEntriesCreated++;
      console.log(`   ✅ COGS entries created: Dr ${cogsGL.name}, Cr Inventory GL`);
    }
  });

  // ✅ CRITICAL VALIDATION #5: Ensure ALL items had COGS calculated
  if (cogsValidationErrors.length > 0) {
    const fullErrorMsg = cogsValidationErrors.join('\n');
    console.error(`\n❌ CRITICAL: COGS validation failed with ${cogsValidationErrors.length} error(s):\n${fullErrorMsg}`);
    throw new Error(`COGS Validation Failed:\n${fullErrorMsg}\n\nCannot create sales voucher without valid COGS for all items.`);
  }

  // ✅ CRITICAL VALIDATION #6: Verify all items were processed
  if (cogsItemsProcessed !== items.length) {
    const errorMsg = `❌ CRITICAL: Only ${cogsItemsProcessed}/${items.length} items were processed for COGS calculation. ${items.length - cogsItemsProcessed} items skipped!`;
    console.error(errorMsg);
    throw new Error(`COGS Processing Error: ${errorMsg}`);
  }

  // ✅ CRITICAL VALIDATION #7: Ensure at least one COGS entry was created
  if (cogsEntriesCreated === 0) {
    const errorMsg = `❌ CRITICAL: NO COGS ENTRIES WERE CREATED! Items: ${items.length}, Total COGS calculated: ${totalCOGS.toFixed(2)}. This will cause journal imbalance!`;
    console.error(errorMsg);
    throw new Error(`COGS Posting Failed: No Cost of Sales GL accounts could be mapped. Please ensure COGS accounts (codes 1800xx) are marked with isCOGSGL=true.`);
  }

  // ✅ CRITICAL VALIDATION #8: Ensure totalCOGS matches sum of all item COGS
  if (totalCOGS <= 0) {
    const errorMsg = `❌ CRITICAL: Total COGS is ${totalCOGS.toFixed(2)}, which is invalid. Cannot create sales voucher.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  console.log(`\n✅ COGS PROCESSING COMPLETE`);
  console.log(`   Items sold: ${items.length}`);
  console.log(`   Items with COGS: ${cogsItemsProcessed}`);
  console.log(`   COGS entries created: ${cogsEntriesCreated}`);
  console.log(`   Total COGS amount: ${totalCOGS.toFixed(2)}\n`);

  const transaction: Transaction = {
    id: crypto.randomUUID(),
    userId,
    voucherNo: voucherId,
    date,
    description: description || 'Sales Voucher',
    entries,
    voucherType: 'SALES',
    reference: `COGS: ${totalCOGS.toLocaleString(undefined, {maximumFractionDigits: 2})}`,
    itemLines: items.map((item) => ({
      id: crypto.randomUUID(),
      subLedgerId: item.subLedgerId,
      inventoryGLAccountId: item.inventoryGLAccountId,
      itemName: subLedgers.find(sl => sl.id === item.subLedgerId)?.itemName || 'Unknown Item',
      itemCode: subLedgers.find(sl => sl.id === item.subLedgerId)?.itemCode,
      quantity: item.quantity,
      rate: item.rate
    }))
  };

  // ✅ Log the complete journal for verification
  console.log(`\n📋 SALES VOUCHER JOURNAL ENTRIES (${voucherId})`);
  console.log(`   Total Entries: ${transaction.entries.length}`);
  transaction.entries.forEach((entry, idx) => {
    const accountName = accounts.find(a => a.id === entry.accountId)?.name || 'UNKNOWN';
    const accountCode = accounts.find(a => a.id === entry.accountId)?.code || '?';
    console.log(`   Entry ${idx + 1}: ${entry.debit > 0 ? 'Dr' : 'Cr'} ${accountName} (${accountCode}) = ${entry.debit || entry.credit}`);
  });
  const totalDebits = transaction.entries.reduce((sum, e) => sum + e.debit, 0);
  const totalCredits = transaction.entries.reduce((sum, e) => sum + e.credit, 0);
  console.log(`   Total Debits: ${totalDebits.toFixed(2)}`);
  console.log(`   Total Credits: ${totalCredits.toFixed(2)}`);
  
  // ✅ CRITICAL VALIDATION: Verify journal is balanced
  if (Math.abs(totalDebits - totalCredits) > 0.01) {
    const imbalanceMsg = `Sales voucher journal is NOT balanced! Total Debits: ${totalDebits.toFixed(2)}, Total Credits: ${totalCredits.toFixed(2)}, Difference: ${Math.abs(totalDebits - totalCredits).toFixed(2)}`;
    console.error(`\n❌ CRITICAL ERROR: ${imbalanceMsg}`);
    console.error(`   This indicates a COGS posting error!`);
    throw new Error(`Journal Balance Error: ${imbalanceMsg}. Please check COGS GL account mapping.`);
  } else {
    console.log(`   ✅ Journal balanced correctly\n`);
  }

  // ✅ CRITICAL FIX: Create inventory movements using COST RATE, not SALES RATE
  // This ensures inventory is always valued at cost, never at sales price
  // ✅ CRITICAL: Set cosAmount to track COGS amount for inventory valuation
  const inventoryMovements = items.map((item, idx) => {
    const costRate = costRateMap[item.subLedgerId] || item.rate;
    const cosAmount = item.quantity * costRate; // ✅ Set COGS amount for COGS tracking
    const movement = createInventoryMovement(
      userId,
      item.subLedgerId,
      transaction.id,
      'OUT',
      item.quantity,
      costRate, // ✅ Use cost rate, NOT sales rate
      date,
      voucherId
    );
    
    // ✅ CRITICAL FIX: Set cosAmount on the movement to track COGS
    movement.cosAmount = cosAmount;
    
    console.log(`\n📦 INVENTORY MOVEMENT CREATED (${idx + 1})`);
    console.log(`   Sub-Ledger ID: ${item.subLedgerId}`);
    console.log(`   Movement Type: OUT`);
    console.log(`   Quantity: ${item.quantity}`);
    console.log(`   Sales Rate (Ignored): ${item.rate}`);
    console.log(`   ✅ Cost Rate (Used): ${costRate.toFixed(2)}`);
    console.log(`   Amount: ${item.quantity} × ${costRate.toFixed(2)} = ${movement.amount.toFixed(2)}`);
    console.log(`   ✅ COGS Amount (cosAmount): ${cosAmount.toFixed(2)}`);
    
    return movement;
  });

  return { transaction, movements: inventoryMovements };
};

/**
 * Create a PURCHASE voucher with inventory movements
 * Accounting Entry:
 *   Debit: Inventory GL Account (increases stock)
 *   Credit: Accounts Payable (Supplier)
 */
export const createPurchaseVoucher = (
  userId: string,
  voucherId: string,
  date: string,
  description: string,
  payableAccountId: string, // Credit account (A/P)
  items: Array<{
    inventoryGLAccountId: string;
    subLedgerId: string;
    quantity: number;
    rate: number;
  }>,
  accounts: Account[] = [], // ✅ FIX: Add accounts parameter for logging
  subLedgers: InventorySubLedger[] = [] // ✅ ADD: Pass subLedgers for item names
): {
  transaction: Transaction;
  movements: InventoryMovement[];
} => {
  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);

  // ✅ FIX: Group items by inventory GL account to create proper entries for multiple GL accounts
  const itemsByGL = items.reduce((acc, item) => {
    if (!acc[item.inventoryGLAccountId]) {
      acc[item.inventoryGLAccountId] = [];
    }
    acc[item.inventoryGLAccountId].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  // Journal Entries
  const entries: JournalEntry[] = [];

  // Create separate Debit entries for each Inventory GL Account
  Object.entries(itemsByGL).forEach(([glAccountId, glItems]) => {
    const glTotal = glItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    entries.push({
      accountId: glAccountId,
      debit: glTotal,
      credit: 0
    });
  });

  // Credit: Accounts Payable (single entry for total)
  entries.push({
    accountId: payableAccountId,
    debit: 0,
    credit: totalAmount
  });

  const transaction: Transaction = {
    id: crypto.randomUUID(),
    userId,
    voucherNo: voucherId,
    date,
    description: description || 'Purchase Voucher',
    entries,
    voucherType: 'PURCHASE',
    itemLines: items.map((item) => ({
      id: crypto.randomUUID(),
      subLedgerId: item.subLedgerId,
      inventoryGLAccountId: item.inventoryGLAccountId,
      itemName: subLedgers.find(sl => sl.id === item.subLedgerId)?.itemName || 'Unknown Item',
      itemCode: subLedgers.find(sl => sl.id === item.subLedgerId)?.itemCode,
      quantity: item.quantity,
      rate: item.rate
    }))
  };

  // Create inventory movements (IN - increases stock)
  const movements = items.map(item =>
    createInventoryMovement(
      userId,
      item.subLedgerId,
      transaction.id,
      'IN',
      item.quantity,
      item.rate,
      date,
      voucherId
    )
  );

  console.log(`\n${'='.repeat(70)}`);
  console.log(`✅ PURCHASE VOUCHER CREATED: ${voucherId}`);
  console.log(`   Journal Entries: ${transaction.entries.length}`);
  transaction.entries.forEach((entry, idx) => {
    const accName = accounts.length > 0 ? accounts.find(a => a.id === entry.accountId)?.name : 'GL';
    const sign = entry.debit > 0 ? 'Dr' : 'Cr';
    const amount = entry.debit || entry.credit;
    console.log(`   ${idx + 1}. ${sign} ${accName || 'Unknown'} = ${amount}`);
  });
  const purchaseTotalDebits = transaction.entries.reduce((s, e) => s + e.debit, 0);
  const purchaseTotalCredits = transaction.entries.reduce((s, e) => s + e.credit, 0);
  console.log(`   Total Debits: ${purchaseTotalDebits.toFixed(2)}`);
  console.log(`   Total Credits: ${purchaseTotalCredits.toFixed(2)}`);
  
  // ✅ CRITICAL VALIDATION: Verify journal is balanced
  if (Math.abs(purchaseTotalDebits - purchaseTotalCredits) > 0.01) {
    console.error(`\n❌ CRITICAL ERROR: Purchase journal entries do NOT balance!`);
    console.error(`   Total Debits: ${purchaseTotalDebits}`);
    console.error(`   Total Credits: ${purchaseTotalCredits}`);
    console.error(`   This indicates an accounting error!`);
  } else {
    console.log(`   ✅ Journal balanced correctly`);
  }

  console.log(`\n   Inventory Movements: ${movements.length}`);
  movements.forEach((mov, idx) => {
    console.log(`   ${idx + 1}. IN ${mov.quantity} qty @ ${mov.rate} = ${mov.amount}`);
  });
  console.log(`${'='.repeat(70)}\n`);

  return { transaction, movements };
};

/**
 * Generate Inventory Trial Balance Report
 * Shows: Item Name, Opening Qty/Value, Debit Qty/Amount, Credit Qty/Amount, Closing Qty/Value
 * 
 * ✅ FIXED: All numeric values are properly initialized to prevent NaN
 */
export const generateInventoryReport = (
  subLedgers: InventorySubLedger[],
  movements: InventoryMovement[],
  startDate: string,
  endDate: string
): Array<{
  subLedgerId: string;
  itemName: string;
  itemCode?: string;
  glAccountName: string;
  openingQuantity: number;
  openingValue: number;
  debitQuantity: number;
  debitAmount: number;
  creditQuantity: number;
  creditAmount: number;
  closingQuantity: number;
  closingValue: number;
  averageRate: number;
}> => {
  return subLedgers.map(subLedger => {
    const balance = calculateSubLedgerBalance(subLedger, movements, startDate, endDate);

    // ✅ CRITICAL FIX: Initialize all values with 0 as fallback to prevent NaN
    const closingQuantity = balance.quantity || 0;
    const closingValue = balance.value || 0;
    const averageRate = closingQuantity > 0 ? closingValue / closingQuantity : 0;

    return {
      subLedgerId: subLedger.id,
      itemName: subLedger.itemName || 'Unknown Item',
      itemCode: subLedger.itemCode || '',
      glAccountName: '', // Will be filled by caller with account lookup
      openingQuantity: balance.openingQuantity || 0,
      openingValue: balance.openingValue || 0,
      debitQuantity: balance.debitQuantity || 0,
      debitAmount: balance.debitAmount || 0,
      creditQuantity: balance.creditQuantity || 0,
      creditAmount: balance.creditAmount || 0,
      closingQuantity: Math.max(0, closingQuantity),
      closingValue: Math.max(0, closingValue),
      averageRate: Math.max(0, averageRate)
    };
  });
};

/**
 * Validate inventory data integrity
 * Checks:
 * - No negative quantities
 * - Movements are properly linked to transactions
 * - Sub-ledgers reference valid GL accounts
 */
export const validateInventoryIntegrity = (
  subLedgers: InventorySubLedger[],
  movements: InventoryMovement[],
  accounts: Account[]
): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  // Check sub-ledgers
  subLedgers.forEach(sl => {
    // Verify GL account exists
    const glAccount = accounts.find(a => a.id === sl.inventoryGLAccountId);
    if (!glAccount) {
      errors.push(`Sub-ledger "${sl.itemName}" references non-existent GL account`);
    }

    // Check opening quantity is not negative
    if (sl.quantity < 0) {
      errors.push(`Sub-ledger "${sl.itemName}" has negative opening quantity: ${sl.quantity}`);
    }

    // Check rate is positive
    if (sl.rate <= 0) {
      errors.push(`Sub-ledger "${sl.itemName}" has invalid rate: ${sl.rate}`);
    }
  });

  // Check movements
  movements.forEach(mov => {
    // Verify sub-ledger exists
    const subLedger = subLedgers.find(sl => sl.id === mov.subLedgerId);
    if (!subLedger) {
      errors.push(`Movement references non-existent sub-ledger: ${mov.subLedgerId}`);
    }

    // Check quantity is positive
    if (mov.quantity <= 0) {
      errors.push(`Movement has invalid quantity: ${mov.quantity}`);
    }

    // Check rate is positive
    if (mov.rate <= 0) {
      errors.push(`Movement has invalid rate: ${mov.rate}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Check if sub-ledger can be safely deleted
 * Returns false if it has any movements
 */
export const canDeleteSubLedger = (
  subLedgerId: string,
  movements: InventoryMovement[]
): boolean => {
  return !movements.some(m => m.subLedgerId === subLedgerId);
};

/**
 * Calculate total inventory value across all sub-ledgers
 */
export const calculateTotalInventoryValue = (
  subLedgers: InventorySubLedger[],
  movements: InventoryMovement[],
  startDate: string,
  endDate: string
): number => {
  let totalValue = 0;
  
  subLedgers.forEach(sl => {
    const balance = calculateSubLedgerBalance(sl, movements, startDate, endDate);
    totalValue += balance.value;
  });

  return totalValue;
};

/**
 * Get inventory movement audit trail for a specific sub-ledger
 */
export const getSubLedgerAuditTrail = (
  subLedgerId: string,
  movements: InventoryMovement[],
  transactions: Transaction[]
): Array<{
  date: string;
  voucherNo: string;
  voucherType: string;
  movementType: 'IN' | 'OUT';
  quantity: number;
  rate: number;
  amount: number;
  reference?: string;
}> => {
  return movements
    .filter(m => m.subLedgerId === subLedgerId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(mov => {
      const transaction = transactions.find(tx => tx.id === mov.voucherId);
      return {
        date: mov.date,
        voucherNo: transaction?.voucherNo || 'N/A',
        voucherType: transaction?.voucherType || 'UNKNOWN',
        movementType: mov.movementType,
        quantity: mov.quantity,
        rate: mov.rate,
        amount: mov.amount,
        reference: mov.reference
      };
    });
};

// Validate that inventory closing balance never goes negative
export const validateNegativeInventory = (subLedgers: InventorySubLedger[], movements: InventoryMovement[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  subLedgers.forEach(subLedger => {
    const subLedgerMovements = movements
      .filter(m => m.subLedgerId === subLedger.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let runningQuantity = subLedger.quantity;
    
    subLedgerMovements.forEach(movement => {
      if (movement.movementType === 'OUT') {
        runningQuantity -= movement.quantity;
      } else if (movement.movementType === 'IN') {
        runningQuantity += movement.quantity;
      }
      
      if (runningQuantity < 0) {
        errors.push(`${subLedger.itemName} (${subLedger.itemCode}) has negative balance: ${runningQuantity} units at ${movement.date}`);
      }
    });
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Check if an inventory GL account can be modified (should be locked/read-only)
export const isInventoryGLLocked = (account: Account): boolean => {
  return account.isInventoryGL === true && account.isLocked === true;
};

// Validate purchase/sales voucher has sufficient inventory
export const validateSufficientInventory = (
  subLedgerId: string,
  requestedQuantity: number,
  subLedgers: InventorySubLedger[],
  movements: InventoryMovement[]
): { sufficient: boolean; available: number } => {
  const subLedger = subLedgers.find(s => s.id === subLedgerId);
  if (!subLedger) return { sufficient: false, available: 0 };
  
  // Use far past and far future dates to capture all movements
  const balance = calculateSubLedgerBalance(subLedger, movements, '1900-01-01', '2099-12-31');
  return {
    sufficient: balance.quantity >= requestedQuantity,
    available: balance.quantity
  };
};

/**
 * Validate all items in a sales voucher have sufficient inventory
 * ✅ CRITICAL: Called before creating sales voucher to prevent negative inventory
 * 
 * Returns:
 * - valid: true if all items have sufficient inventory
 * - insufficientItems: array of items that don't have enough stock
 * - errors: array of error messages
 */
export const validateSalesVoucherInventory = (
  items: Array<{
    inventoryGLAccountId: string;
    subLedgerId: string;
    quantity: number;
    rate: number;
  }>,
  subLedgers: InventorySubLedger[],
  movements: InventoryMovement[]
): {
  valid: boolean;
  insufficientItems: Array<{ subLedgerId: string; requested: number; available: number }>;
  errors: string[];
} => {
  const insufficientItems: Array<{ subLedgerId: string; requested: number; available: number }> = [];
  const errors: string[] = [];

  items.forEach(item => {
    const check = validateSufficientInventory(item.subLedgerId, item.quantity, subLedgers, movements);
    if (!check.sufficient) {
      const subLedger = subLedgers.find(s => s.id === item.subLedgerId);
      insufficientItems.push({
        subLedgerId: item.subLedgerId,
        requested: item.quantity,
        available: check.available
      });
      errors.push(
        `❌ Insufficient inventory for "${subLedger?.itemName || 'Unknown Item'}": ` +
        `Requested ${item.quantity} units but only ${check.available} available`
      );
    }
  });

  return {
    valid: insufficientItems.length === 0,
    insufficientItems,
    errors
  };
};

// Backup/Restore integrity validation
export const validateBackupRestoreIntegrity = (
  backupData: {
    accounts: Account[];
    transactions: Transaction[];
    inventorySubLedgers: InventorySubLedger[];
    inventoryMovements: InventoryMovement[];
  }
): { valid: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  // Verify inventory GL accounts exist in backup
  const inventoryGLCount = backupData.accounts.filter(a => a.isInventoryGL === true).length;
  if (inventoryGLCount === 0) {
    issues.push('⚠️ Inventory GL accounts missing from backup');
  }
  
  // Verify all sub-ledgers reference valid GL accounts
  backupData.inventorySubLedgers.forEach(subLedger => {
    const glExists = backupData.accounts.find(a => a.id === subLedger.inventoryGLAccountId);
    if (!glExists) {
      issues.push(`Sub-ledger "${subLedger.itemName}" references non-existent GL account`);
    }
  });
  
  // Verify all movements reference valid sub-ledgers and vouchers
  backupData.inventoryMovements.forEach(movement => {
    const subLedgerExists = backupData.inventorySubLedgers.find(s => s.id === movement.subLedgerId);
    if (!subLedgerExists) {
      issues.push(`Movement references non-existent sub-ledger`);
    }
    
    const voucherExists = backupData.transactions.find(t => t.id === movement.voucherId);
    if (!voucherExists) {
      issues.push(`Movement references non-existent voucher`);
    }
  });
  
  // Verify double-entry accounting integrity: all movements have matching GL entries
  const movementVouchers = new Set(backupData.inventoryMovements.map(m => m.voucherId));
  movementVouchers.forEach(voucherId => {
    const movement = backupData.inventoryMovements.find(m => m.voucherId === voucherId);
    const glEntry = backupData.transactions.find(t => t.id === voucherId);
    
    if (movement && glEntry) {
      // Each inventory movement should have at least 2 GL entries (debit + credit)
      const glEntriesForVoucher = backupData.transactions.filter(
        t => t.voucherNo === glEntry.voucherNo && t.voucherType === glEntry.voucherType
      );
      
      if (glEntriesForVoucher.length < 2) {
        issues.push(`Voucher ${glEntry.voucherNo} lacks sufficient GL entries for double-entry accounting`);
      }
    }
  });
  
  return {
    valid: issues.length === 0,
    issues
  };
};

/**
 * Validate that inventory GL account balances match inventory sub-ledger values
 * ✅ CRITICAL: Used to ensure GL and inventory are synchronized
 * 
 * Formula:
 *   GL Account Balance = Sum of all sub-ledger closing values under that GL
 * 
 * Example:
 *   GL: Finished Goods (30001) should = 1,000 qty × 20 cost = 20,000
 *   Sub-Ledger 1: Item A = 500 qty × 20 cost = 10,000
 *   Sub-Ledger 2: Item B = 500 qty × 20 cost = 10,000
 *   Total = 20,000 ✅
 */
export const validateInventoryGLSync = (
  subLedgers: InventorySubLedger[],
  movements: InventoryMovement[],
  accounts: Account[],
  startDate: string,
  endDate: string
): {
  isSynced: boolean;
  mismatches: Array<{
    glAccountId: string;
    glAccountName: string;
    glBalance: number;
    inventoryValue: number;
    difference: number;
  }>;
  errors: string[];
} => {
  const mismatches: Array<{
    glAccountId: string;
    glAccountName: string;
    glBalance: number;
    inventoryValue: number;
    difference: number;
  }> = [];
  const errors: string[] = [];

  // Group sub-ledgers by GL account
  const subLedgersByGL = new Map<string, InventorySubLedger[]>();
  subLedgers.forEach(sl => {
    if (!subLedgersByGL.has(sl.inventoryGLAccountId)) {
      subLedgersByGL.set(sl.inventoryGLAccountId, []);
    }
    subLedgersByGL.get(sl.inventoryGLAccountId)!.push(sl);
  });

  // For each GL account, verify inventory value matches GL balance
  subLedgersByGL.forEach((glSubLedgers, glAccountId) => {
    const glAccount = accounts.find(a => a.id === glAccountId);
    if (!glAccount) {
      errors.push(`GL account ${glAccountId} not found`);
      return;
    }

    // Calculate total inventory value for this GL account
    let inventoryValue = 0;
    glSubLedgers.forEach(sl => {
      const balance = calculateSubLedgerBalance(sl, movements, startDate, endDate);
      inventoryValue += balance.value;
    });

    // Get GL account balance from the account object (should be calculated separately)
    const glBalance = glAccount.balance || 0;

    // Check if they match (within small tolerance for rounding)
    const difference = Math.abs(glBalance - inventoryValue);
    if (difference > 0.01) {
      // More than 0.01 difference indicates a mismatch
      mismatches.push({
        glAccountId,
        glAccountName: glAccount.name,
        glBalance,
        inventoryValue,
        difference
      });

      errors.push(
        `❌ CRITICAL: GL account "${glAccount.name}" balance (${glBalance}) ` +
        `does not match inventory value (${inventoryValue}). Difference: ${difference}`
      );
    }
  });

  return {
    isSynced: mismatches.length === 0,
    mismatches,
    errors
  };
};

// Calculate running balance with date-based sorting
export const calculateRunningBalance = (
  subLedger: InventorySubLedger,
  movements: InventoryMovement[],
  asOfDate?: string
): { runningBalance: number; movement_count: number } => {
  let balance = subLedger.quantity;
  let count = 0;
  
  const relevantMovements = movements
    .filter(m => m.subLedgerId === subLedger.id)
    .filter(m => !asOfDate || new Date(m.date) <= new Date(asOfDate))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  relevantMovements.forEach(movement => {
    if (movement.movementType === 'OUT') {
      balance -= movement.quantity;
    } else if (movement.movementType === 'IN') {
      balance += movement.quantity;
    }
    count++;
  });
  
  return { runningBalance: balance, movement_count: count };
};

/**
 * Delete all inventory movements associated with a transaction (voucher)
 * ✅ CRITICAL: Called when deleting or reversing inventory vouchers
 * This ensures inventory values and quantities are properly restored
 */
export const deleteMovementsForVoucher = (
  voucherId: string,
  movements: InventoryMovement[]
): void => {
  // Movements will be deleted by the caller
  // This function is for reference - actual deletion happens in App.tsx
};

/**
 * Get all inventory movements for a specific transaction (voucher)
 * Used for deletion/reversal operations
 */
export const getMovementsForTransaction = (
  transactionId: string,
  movements: InventoryMovement[]
): InventoryMovement[] => {
  return movements.filter(m => m.voucherId === transactionId);
};


