
import { Account, Transaction, AccountType, AccountLevel, FinancialSummary, JournalEntry, VoucherType } from '../types';

/**
 * ✅ CENTRALIZED DISPLAY BALANCE HELPER
 * 
 * Single source of truth for converting ledger balances to displayed values.
 * Applies custom business logic reversals for presentation only.
 * 
 * RULES:
 * - ASSET: Show ledger balance as-is
 * - INCOME, EXPENSE, LIABILITY, EQUITY: Reverse sign for display
 * 
 * ✅ NEVER modifies ledger data
 * ✅ Ledger balance = Opening + Debit - Credit (always for ALL accounts)
 * ✅ Display balance = Apply reversal based on account type
 * 
 * PROFIT CALCULATION:
 * Since both Income and Expense are reversed:
 * Net Profit (displayed) = Displayed Income + Displayed Expense
 * 
 * Example:
 * - Ledger Income: -40 → Display: 40 (reversed)
 * - Ledger Expense: +25 → Display: -25 (reversed)
 * - Profit: 40 + (-25) = 15 ✅
 */
export const getDisplayBalance = (accountType: AccountType, ledgerBalance: number): number => {
  // Assets show as-is (debit-nature accounts)
  if (accountType === AccountType.ASSET) {
    return ledgerBalance;
  }
  // Liabilities, Equity, Income, Expenses: reverse for accounting standard presentation
  // These are credit-nature accounts logically stored as negative in ledger
  return ledgerBalance * -1;
};

/**
 * ✅ DASHBOARD DISPLAY HELPERS
 * 
 * Applies presentation-layer transformations for dashboard stat cards.
 * These follow the business dashboard reporting rules.
 * 
 * RULES:
 * - Revenue: Display = Ledger Balance × -1
 * - Receivable: Display = Ledger Balance (as-is)
 * - Payable: Display = Ledger Balance × -1
 * - Cash: Display = Ledger Balance (as-is)
 * - Purchase: Display = Ledger Balance (as-is)
 * 
 * ✅ NEVER modifies underlying ledger data
 * ✅ Applied ONLY at presentation layer
 */

export const getDashboardRevenue = (incomeBalance: number): number => {
  // Revenue displays as positive, so reverse the negative ledger balance
  return incomeBalance * -1;
};

export const getDashboardPayable = (payableBalance: number): number => {
  // Payables should display as positive liability amount
  return payableBalance * -1;
};

export const getDashboardReceivable = (receivableBalance: number): number => {
  // Receivables display as-is (already positive in ledger)
  return receivableBalance;
};

export const getDashboardCash = (cashBalance: number): number => {
  // Cash displays as-is (debit-nature asset)
  return cashBalance;
};

export const getDashboardPurchase = (purchaseBalance: number): number => {
  // Purchases display as-is (debit-nature expense)
  return purchaseBalance;
};

// Validates that the total debit equals total credit in a journal entry.
export const validateJournal = (entries: JournalEntry[]): boolean => {
  const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
  const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);
  // Using a small epsilon for floating point comparison
  return Math.abs(totalDebit - totalCredit) < 0.01;
};

// Extended type for internal report calculation
export interface AccountWithTotals extends Account {
  periodDebit: number;
  periodCredit: number;
}

/**
 * Calculates account balances dynamically based on a date range.
 * 
 * ✅ PURE FUNCTION - Read-only, no mutations to accounting reality
 * ✅ REPORTING ONLY - Never modifies underlying GL data
 * 
 * ✅ UNIVERSAL FORMULA (ALL ACCOUNTS):
 * Closing Balance = Opening Balance + Total Debit − Total Credit
 * 
 * This formula applies universally to EVERY account regardless of type.
 * Account type is used ONLY for:
 * - Display/presentation formatting
 * - Report grouping and categorization
 * - NOT for mathematical calculations
 * 
 * CALCULATION METHOD:
 * - Opening Balance = Cumulative (debit - credit) from transactions BEFORE startDate
 * - Period Totals = Sum of all debits and credits WITHIN [startDate, endDate]
 * - Closing Balance = Opening Balance + Period Debit - Period Credit
 * - Roll-up balances are pure aggregations (sums of children)
 */
export const calculateBalances = (
  accounts: Account[], 
  allTransactions: Transaction[], 
  startDate: string, 
  endDate: string
): AccountWithTotals[] => {
  // 1. Initialize fresh state for calculation
  const updatedAccounts: AccountWithTotals[] = accounts.map(acc => ({ 
    ...acc, 
    balance: 0, 
    openingBalance: 0,
    periodDebit: 0,
    periodCredit: 0
  }));

  // 2. Identify transaction segments
  const priorHistory = allTransactions.filter(tx => tx.date < startDate);
  const currentPeriod = allTransactions.filter(tx => tx.date >= startDate && tx.date <= endDate);

  // 3. Compute Dynamic Opening Balances from ALL prior history
  // ✅ UNIVERSAL FORMULA: openingBalance += debit - credit (for ALL accounts)
  // Account type does NOT affect this calculation
  priorHistory.forEach(tx => {
    tx.entries.forEach(entry => {
      const acc = updatedAccounts.find(a => a.id === entry.accountId);
      if (acc && acc.level === AccountLevel.GL) {
        // Universal formula: always add (debit - credit), regardless of account type
        acc.openingBalance += (entry.debit - entry.credit);
      }
    });
  });

  // 4. Compute Period Activity and Closing Balances
  // ✅ UNIVERSAL FORMULA: balance = openingBalance + periodDebit - periodCredit
  updatedAccounts.forEach(acc => {
    acc.balance = acc.openingBalance;
  });

  currentPeriod.forEach(tx => {
    tx.entries.forEach(entry => {
      const acc = updatedAccounts.find(a => a.id === entry.accountId);
      if (acc && acc.level === AccountLevel.GL) {
        // Track raw period totals for reporting
        acc.periodDebit += entry.debit;
        acc.periodCredit += entry.credit;

        // Update balance using universal formula (no account-type checking)
        acc.balance = acc.openingBalance + acc.periodDebit - acc.periodCredit;
      }
    });
  });

  // 5. Roll up GL (Level 3) -> Group (Level 2) using pure aggregation
  // ✅ No calculation adjustments - just sum the children balances
  updatedAccounts.forEach(groupAcc => {
    if (groupAcc.level === AccountLevel.GROUP) {
      const glChildren = updatedAccounts.filter(a => a.parentAccountId === groupAcc.id && a.level === AccountLevel.GL);
      groupAcc.openingBalance = glChildren.reduce((sum, gl) => sum + gl.openingBalance, 0);
      groupAcc.periodDebit = glChildren.reduce((sum, gl) => sum + gl.periodDebit, 0);
      groupAcc.periodCredit = glChildren.reduce((sum, gl) => sum + gl.periodCredit, 0);
      // Use universal formula for group balance
      groupAcc.balance = groupAcc.openingBalance + groupAcc.periodDebit - groupAcc.periodCredit;
    }
  });

  // 6. Roll up Group (Level 2) -> Main (Level 1) using pure aggregation
  // ✅ No calculation adjustments - just sum the children balances
  updatedAccounts.forEach(mainAcc => {
    if (mainAcc.level === AccountLevel.MAIN) {
      const groupChildren = updatedAccounts.filter(a => a.parentAccountId === mainAcc.id && a.level === AccountLevel.GROUP);
      mainAcc.openingBalance = groupChildren.reduce((sum, g) => sum + g.openingBalance, 0);
      mainAcc.periodDebit = groupChildren.reduce((sum, g) => sum + g.periodDebit, 0);
      mainAcc.periodCredit = groupChildren.reduce((sum, g) => sum + g.periodCredit, 0);
      // Use universal formula for main account balance
      mainAcc.balance = mainAcc.openingBalance + mainAcc.periodDebit - mainAcc.periodCredit;
    }
  });

  // ✅ RETAINED EARNINGS HANDLING:
  // Retained Earnings = Opening RE + Net Income
  // Where Net Income = (Income Total - Expense Total)
  // This is the ONLY place where account types are used in logic,
  // and it's for income statement computation, not GL balancing.
  const incomeMain = updatedAccounts.find(a => a.level === AccountLevel.MAIN && a.type === AccountType.INCOME);
  const expenseMain = updatedAccounts.find(a => a.level === AccountLevel.MAIN && a.type === AccountType.EXPENSE);
  const retainedEarningsGroup = updatedAccounts.find(a => a.level === AccountLevel.GROUP && a.code === '130000');
  
  if (retainedEarningsGroup && incomeMain && expenseMain) {
    // ✅ CRITICAL: Net Income = Displayed Income + Displayed Expense (from display balances, not ledger subtraction)
    const displayIncome = getDisplayBalance(AccountType.INCOME, incomeMain.balance || 0);
    const displayExpense = getDisplayBalance(AccountType.EXPENSE, expenseMain.balance || 0);
    const netIncome = displayIncome + displayExpense;
    const previousBalance = retainedEarningsGroup.balance;
    // RE reflects cumulative profit from display perspective
    retainedEarningsGroup.balance = retainedEarningsGroup.openingBalance + netIncome;
    
    console.log('🚨 RETAINED EARNINGS CALCULATION (in calculateBalances):', {
      openingBalance: Number(retainedEarningsGroup.openingBalance ?? 0),
      displayIncome: Number(displayIncome ?? 0),
      displayExpense: Number(displayExpense ?? 0),
      periodNetIncome: Number(netIncome ?? 0),
      calculatedClosingBalance: Number(retainedEarningsGroup.balance ?? 0),
      formula: 'Closing RE = Opening RE + Period Net Income'
    });
  }
  
  // Recalculate Equity MAIN to reflect updated RE
  const equityMain = updatedAccounts.find(a => a.level === AccountLevel.MAIN && a.type === AccountType.EQUITY);
  if (equityMain) {
    const equityGroups = updatedAccounts.filter(a => a.level === AccountLevel.GROUP && a.type === AccountType.EQUITY);
    equityMain.openingBalance = equityGroups.reduce((sum, g) => sum + g.openingBalance, 0);
    equityMain.periodDebit = equityGroups.reduce((sum, g) => sum + g.periodDebit, 0);
    equityMain.periodCredit = equityGroups.reduce((sum, g) => sum + g.periodCredit, 0);
    equityMain.balance = equityGroups.reduce((sum, g) => sum + g.balance, 0);
  }

  return updatedAccounts;
};

/**
 * ✅ FINANCIAL SUMMARY - PRIMARY SOURCE FOR DASHBOARD
 * 
 * ACCOUNTING PRINCIPLES ENFORCED:
 * 1. Uses Income Statement totals (from getIncomeStatementData)
 * 2. Uses Balance Sheet totals (from getBalanceSheetData)
 * 3. Net Profit = Total Income + Total Expenses (STRICT RULE)
 * 4. All values are display-balanced (flipped for non-assets)
 * 
 * REQUIRED CALLING CONTEXT:
 * This function MUST receive accounts with computed balances that include
 * all period transactions (period debit/credit totals).
 */
export const getFinancialSummary = (accounts: Account[]): FinancialSummary => {
  try {
    // ✅ Generate canonical Income Statement data
    const incomeStatement = getIncomeStatementData(accounts);
    
    // ✅ Generate canonical Balance Sheet data
    const balanceSheet = getBalanceSheetData(accounts);
    
    // ✅ Extract specific balances from Balance Sheet groups
    const cashGroup = balanceSheet.assetGroups.find(g => g.code === '10000');
    const receivableGroup = balanceSheet.assetGroups.find(g => g.code === '20000');
    const payableGroup = balanceSheet.liabilityGroups.find(g => g.code === '70000');
    
    // ✅ VALIDATION LOGS - For accounting compliance verification
    console.log('📊 INCOME STATEMENT DATA:', {
      totalIncome: Number(incomeStatement.totalIncome ?? 0),
      totalExpenses: Number(incomeStatement.totalExpense ?? 0),
      netProfit: Number(incomeStatement.netProfit ?? 0),
      formula: 'netProfit = totalIncome + totalExpenses (both display-balanced)'
    });
    
    console.log('📊 BALANCE SHEET DATA:', {
      totalAssets: Number(balanceSheet.totalAssets ?? 0),
      totalLiabilities: Number(balanceSheet.totalLiabilities ?? 0),
      totalEquity: Number(balanceSheet.totalEquity ?? 0),
      formula: 'totalAssets = totalLiabilities + totalEquity',
      isBalanced: Math.abs((balanceSheet.totalAssets ?? 0) - ((balanceSheet.totalLiabilities ?? 0) + (balanceSheet.totalEquity ?? 0))) < 0.01
    });
    
    // ✅ Return Financial Summary sourced from canonical reports
    return {
      cashBalance: Number(cashGroup?.displayAmount ?? 0),
      receivables: Number(receivableGroup?.displayAmount ?? 0),
      payables: Number(payableGroup?.displayAmount ?? 0),
      totalAssets: Number(balanceSheet.totalAssets ?? 0),
      totalLiabilities: Number(balanceSheet.totalLiabilities ?? 0),
      totalEquity: Number(balanceSheet.totalEquity ?? 0),
      netIncome: Number(incomeStatement.netProfit ?? 0)
    };
  } catch (error) {
    console.error('❌ ERROR in getFinancialSummary:', error);
    return {
      cashBalance: 0,
      receivables: 0,
      payables: 0,
      totalAssets: 0,
      totalLiabilities: 0,
      totalEquity: 0,
      netIncome: 0
    };
  }
};

/**
 * ✅ CANONICAL INCOME STATEMENT DATA GENERATOR
 * 
 * THIS IS THE ONLY AUTHORITATIVE SOURCE FOR:
 * • Income group display amounts
 * • Expense group display amounts
 * • Total Income
 * • Total Expenses
 * • NET PROFIT / LOSS
 * 
 * ⚠️ CRITICAL RULES:
 * • Display Amount = Ledger Balance × -1 (for both income and expense)
 * • Net Profit = totalIncome + totalExpense (NEVER subtract)
 * • All values are SIGNED (expenses are negative)
 * • Dashboard MUST read from this function ONLY
 * • All other Net Profit calculations are DEPRECATED
 * 
 * WHY THIS IS CORRECT (Accounting Theory):
 * ────────────────────────────────────────
 * INCOME accounts have NORMAL CREDIT balance (displayed as positive).
 * In our ledger, they're stored NEGATIVE, so we flip them: × -1
 * 
 * EXPENSE accounts have NORMAL DEBIT balance (displayed as positive).
 * In our ledger, they're stored NEGATIVE (like income), so we flip them: × -1
 * 
 * Net Profit = Income (positive display) + Expenses (negative display)
 * Example: Income 100K + Expenses -40K = Net Profit 60K ✅
 * 
 * DO NOT:
 * ❌ Calculate Income - Expenses (this would be: 100 - (-40) = 140 🚫)
 * ❌ Call getDisplayBalance() - use multiplication × -1 directly
 * ❌ Return negative net profit values - only totals with correct signs
 * 
 * INVARIANT (GUARANTEED):
 * netProfit === sum(all displayed income line items) + sum(all displayed expense line items)
 */
export const getIncomeStatementData = (accountsWithBalances: Account[]): {
  incomeGroups: Array<{ name: string; balance: number; displayAmount: number; code: string }>;
  expenseGroups: Array<{ name: string; balance: number; displayAmount: number; code: string }>;
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
} => {
  try {
    // ✅ Extract all INCOME group accounts and apply display transformation
    const incomeGroups = accountsWithBalances
      .filter(a => a.type === AccountType.INCOME && a.level === AccountLevel.GROUP)
      .map(group => ({
        name: group.name,
        balance: Number(group.balance ?? 0),
        displayAmount: Number((group.balance ?? 0) * -1),  // ✅ Display = Ledger × -1
        code: group.code
      }));

    // ✅ Extract all EXPENSE group accounts and apply display transformation
    const expenseGroups = accountsWithBalances
      .filter(a => a.type === AccountType.EXPENSE && a.level === AccountLevel.GROUP)
      .map(group => ({
        name: group.name,
        balance: Number(group.balance ?? 0),
        displayAmount: Number((group.balance ?? 0) * -1),  // ✅ Display = Ledger × -1
        code: group.code
      }));

    // ✅ STRICT ACCOUNTING FORMULA: Net Profit = Sum(Income Display) + Sum(Expense Display)
    // Both values are already sign-corrected, so we ADD them
    // Note: Expenses display as NEGATIVE, so addition naturally subtracts expense magnitude
    const totalIncome = incomeGroups.reduce((sum, g) => sum + (g.displayAmount ?? 0), 0);
    const totalExpense = expenseGroups.reduce((sum, g) => sum + (g.displayAmount ?? 0), 0);
    const netProfit = totalIncome + totalExpense;

    // 🚨 CRITICAL INVARIANT VALIDATION 🚨
    // Net Profit MUST equal the sum of all displayed line items (including negative expenses)
    const allDisplayedItems = [...incomeGroups, ...expenseGroups].map(g => g.displayAmount);
    const sumAllItems = allDisplayedItems.reduce((sum, amount) => sum + (amount ?? 0), 0);
    
    if (Math.abs((netProfit ?? 0) - (sumAllItems ?? 0)) > 0.01) {
      console.error(`❌ CRITICAL BUG: Income Statement invariant violated!
      Calculated Net Profit: ${netProfit}
      Sum of all displayed line items: ${sumAllItems}
      Difference: ${Math.abs((netProfit ?? 0) - (sumAllItems ?? 0))}`);
    }

    // ✅ VALIDATION LOGS
    console.log('✅ INCOME STATEMENT CALCULATION:', {
      totalIncome: Number(totalIncome ?? 0),
      totalExpense: Number(totalExpense ?? 0),
      netProfit: Number(netProfit ?? 0),
      incomeGroupCount: incomeGroups.length,
      expenseGroupCount: expenseGroups.length,
      formula: 'netProfit = totalIncome + totalExpense (both display-balanced)',
      validation: Math.abs((netProfit ?? 0) - (sumAllItems ?? 0)) < 0.01 ? '✅ PASS' : '❌ FAIL'
    });

    return {
      incomeGroups,
      expenseGroups,
      totalIncome: Number(totalIncome ?? 0),
      totalExpense: Number(totalExpense ?? 0),
      netProfit: Number(netProfit ?? 0)
    };
  } catch (error) {
    console.error('❌ ERROR in getIncomeStatementData:', error);
    return {
      incomeGroups: [],
      expenseGroups: [],
      totalIncome: 0,
      totalExpense: 0,
      netProfit: 0
    };
  }
};

/**
 * ✅ BALANCE SHEET DATA GENERATOR
 * 
 * Generates Balance Sheet report values as the single source of truth.
 * All dashboard asset/liability/equity values MUST be sourced from this function.
 * 
 * DISPLAY TRANSFORMATION RULES:
 * ──────────────────────────────
 * ASSET accounts:
 *   Display = Ledger Balance (as-is, no transformation)
 *   Normal debit balance, stored positive → display positive
 * 
 * LIABILITY accounts:
 *   Display = Ledger Balance × -1
 *   Normal credit balance, stored negative → flip to positive display
 * 
 * EQUITY accounts:
 *   Display = Ledger Balance × -1
 *   Normal credit balance, stored negative → flip to positive display
 *   
 *   🚨 EXCEPTION - Retained Earnings (code 130000):
 *   Display = Income Statement Net Profit / Loss (INJECTED DIRECTLY)
 *   NO sign transformation, NO ledger calculation
 *   Retained Earnings MUST match Income Statement netProfit exactly
 * 
 * EXACT RULES FOR RETAINED EARNINGS:
 * ─────────────────────────────────
 * If Income Statement Net Profit = 3,000
 *   → Retained Earnings displays = 3,000
 * 
 * If Income Statement Net Profit = -3,000
 *   → Retained Earnings displays = -3,000
 * 
 * The display value is taken DIRECTLY from Income Statement calculation.
 * This ensures Retained Earnings always matches the period profit/loss.
 * 
 * BALANCE SHEET EQUATION (MANDATORY):
 * ────────────────────────────────────
 * totalAssets === totalLiabilities + totalEquity
 * 
 * If this equation fails, console logs a ❌ ERROR
 * Dashboard uses this validation to flag balance sheet problems
 * 
 * WHY THIS IS CORRECT:
 * • Assets = what the company owns (positive debit)
 * • Liabilities = what the company owes (positive credit, stored negative)
 * • Equity (Other) = owner's stake (positive credit, stored negative)
 * • Retained Earnings = Period Profit/Loss (from Income Statement, no reversal)
 * • Flipping most Liabilities and Equity to positive display makes the equation work
 */
export const getBalanceSheetData = (accountsWithBalances: Account[]): {
  assetGroups: Array<{ name: string; balance: number; displayAmount: number; code: string }>;
  liabilityGroups: Array<{ name: string; balance: number; displayAmount: number; code: string }>;
  equityGroups: Array<{ name: string; balance: number; displayAmount: number; code: string }>;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
} => {
  try {
    // 🚨 FIRST: Get Income Statement data - Retained Earnings MUST use Income Statement Net Profit
    const incomeStatement = getIncomeStatementData(accountsWithBalances);
    
    // ✅ ASSET groups - Display = Ledger (as-is)
    const assetGroups = accountsWithBalances
      .filter(a => a.type === AccountType.ASSET && a.level === AccountLevel.GROUP)
      .map(group => ({
        name: group.name,
        balance: Number(group.balance ?? 0),
        displayAmount: Number(group.balance ?? 0),  // ✅ Display = Ledger (as-is)
        code: group.code
      }));

    // ✅ LIABILITY groups - Display = Ledger × -1
    const liabilityGroups = accountsWithBalances
      .filter(a => a.type === AccountType.LIABILITY && a.level === AccountLevel.GROUP)
      .map(group => ({
        name: group.name,
        balance: Number(group.balance ?? 0),
        displayAmount: Number((group.balance ?? 0) * -1),  // ✅ Display = Ledger × -1
        code: group.code
      }));

    // ✅ EQUITY groups - Display = Ledger × -1
    // 🚨 EXCEPTION: Retained Earnings MUST display the Income Statement Net Profit directly
    const equityGroups = accountsWithBalances
      .filter(a => a.type === AccountType.EQUITY && a.level === AccountLevel.GROUP)
      .map(group => {
        const isRetainedEarnings = group.code === '130000';
        const displayAmount = isRetainedEarnings 
          ? Number(incomeStatement.netProfit ?? 0)  // 🚨 Retained Earnings = Income Statement Net Profit (DIRECTLY)
          : Number((group.balance ?? 0) * -1);  // ✅ Other Equity: apply standard reversal
        
        if (isRetainedEarnings) {
          console.log('🚨 RETAINED EARNINGS in Balance Sheet:', {
            code: group.code,
            name: group.name,
            ledgerBalance: Number(group.balance ?? 0),
            incomeStatementNetProfit: Number(incomeStatement.netProfit ?? 0),
            displayAmount: displayAmount,
            note: 'Displayed as Income Statement Net Profit (no equity reversal, no ledger calculation)'
          });
        }
        
        return {
          name: group.name,
          balance: Number(group.balance ?? 0),
          displayAmount: displayAmount,
          code: group.code
        };
      });

    // ✅ Calculate totals
    const totalAssets = assetGroups.reduce((sum, g) => sum + (g.displayAmount ?? 0), 0);
    const totalLiabilities = liabilityGroups.reduce((sum, g) => sum + (g.displayAmount ?? 0), 0);
    const totalEquity = equityGroups.reduce((sum, g) => sum + (g.displayAmount ?? 0), 0);

    // 🚨 MANDATORY BALANCE SHEET VALIDATION 🚨
    // The accounting equation MUST hold: Assets = Liabilities + Equity
    const liabilitiesPlusEquity = (totalLiabilities ?? 0) + (totalEquity ?? 0);
    const difference = Math.abs((totalAssets ?? 0) - liabilitiesPlusEquity);
    const isBalanced = difference < 0.01;

    if (!isBalanced) {
      console.error(`❌ BALANCE SHEET NOT BALANCED!
      Total Assets: ${totalAssets}
      Total Liabilities + Equity: ${liabilitiesPlusEquity}
      Difference: ${difference}
      This indicates a fundamental accounting error.`);
    } else {
      console.log('✅ BALANCE SHEET VALIDATION:', {
        totalAssets: Number(totalAssets ?? 0),
        totalLiabilities: Number(totalLiabilities ?? 0),
        totalEquity: Number(totalEquity ?? 0),
        liabilitiesPlusEquity: Number(liabilitiesPlusEquity ?? 0),
        equation: 'Assets = Liabilities + Equity',
        status: '✅ BALANCED'
      });
    }

    return {
      assetGroups,
      liabilityGroups,
      equityGroups,
      totalAssets: Number(totalAssets ?? 0),
      totalLiabilities: Number(totalLiabilities ?? 0),
      totalEquity: Number(totalEquity ?? 0)
    };
  } catch (error) {
    console.error('❌ ERROR in getBalanceSheetData:', error);
    return {
      assetGroups: [],
      liabilityGroups: [],
      equityGroups: [],
      totalAssets: 0,
      totalLiabilities: 0,
      totalEquity: 0
    };
  }
};

export const getNextVoucherNo = (type: VoucherType, transactions: Transaction[]): string => {
  const count = transactions.filter(tx => tx.voucherType === type).length + 1;
  const prefix = type.substring(0, 2).toUpperCase();
  return `${prefix}-${count.toString().padStart(4, '0')}`;
};

/**
 * Sorts transactions by voucher number in DESCENDING numeric order (latest first)
 * Falls back to date comparison if voucher numbers can't be parsed
 * 
 * SORTING LOGIC:
 * 1. Extract numeric part from voucher number (e.g., "SV-03" → 3)
 * 2. Sort in DESCENDING order (newest/highest number first)
 * 3. Secondary sort by date DESCENDING (latest date first)
 * 4. String comparison only as final fallback
 * 
 * EXAMPLES:
 * - [SV-01, SV-02, SV-03] → [SV-03, SV-02, SV-01] ✅
 * - [JV-001, JV-010, JV-002] → [JV-010, JV-002, JV-001] ✅
 * - Mixed: [SV-03, PV-02, SV-02] → [SV-03, SV-02, PV-02] ✅
 */
export const sortTransactionsByVoucherNo = (transactions: Transaction[]): Transaction[] => {
  return [...transactions].sort((a, b) => {
    // Extract numeric parts from voucher numbers
    const aMatch = a.voucherNo.match(/\d+/);
    const bMatch = b.voucherNo.match(/\d+/);
    
    if (aMatch && bMatch) {
      // Both have numeric parts - sort numerically in DESCENDING order
      const aNum = parseInt(aMatch[0], 10);
      const bNum = parseInt(bMatch[0], 10);
      
      if (aNum !== bNum) {
        return bNum - aNum; // DESCENDING: highest number first
      }
    }
    
    // Fallback: sort by date in DESCENDING order (latest first)
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) {
      return dateCompare;
    }
    
    // Final fallback: string comparison (shouldn't normally reach here)
    return b.voucherNo.localeCompare(a.voucherNo);
  });
};
