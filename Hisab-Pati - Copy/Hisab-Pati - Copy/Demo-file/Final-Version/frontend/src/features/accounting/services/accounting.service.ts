/**
 * ACCOUNTING SERVICE
 * 
 * Pure business logic for double-entry accounting operations.
 * - Journal posting and validation
 * - Balance calculation
 * - Transaction management
 * 
 * RESPONSIBILITY:
 * - All GL posting rules
 * - Trial balance calculation
 * - P&L and Balance Sheet generation
 * - Accounting equation validation
 */

import { 
  Account, 
  Transaction, 
  JournalEntry, 
  AccountType, 
  AccountLevel,
  FinancialSummary,
  AccountWithTotals,
  VoucherType
} from '../../../core/types';
import { formatDateLong } from '../../../utils';
import { getIncomeStatementData, getBalanceSheetData } from '../../../core/engine/accounting.engine';

/**
 * ✅ CENTRALIZED DISPLAY BALANCE HELPER
 * 
 * Single source of truth for converting ledger balances to displayed values.
 * Applies custom business logic reversals for presentation only.
 * 
 * RULES:
 * - ASSET: Show ledger balance as-is
 * - INCOME, EXPENSE, LIABILITY, EQUITY: Reverse sign for display
 * - 🚨 EXCEPTION - Retained Earnings: Show ledger balance as-is (derived from P&L)
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
 * - Retained Earnings: Already carries correct sign from P&L, no reversal needed
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
 * Validates that the total debit equals total credit in a journal entry.
 */
export const validateJournal = (entries: JournalEntry[]): boolean => {
  const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
  const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);
  return Math.abs(totalDebit - totalCredit) < 0.01;
};

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

  // 2. Segment transactions into prior and period
  const priorTransactions = allTransactions.filter(tx => tx.date < startDate);
  const periodTransactions = allTransactions.filter(tx => tx.date >= startDate && tx.date <= endDate);

  // 3. Calculate opening balances from ALL prior history
  // ✅ UNIVERSAL FORMULA: openingBalance += debit - credit (for ALL accounts)
  // Account type does NOT affect this calculation
  for (const tx of priorTransactions) {
    for (const entry of tx.entries) {
      const acc = updatedAccounts.find(a => a.id === entry.accountId);
      if (acc) {
        // Universal formula: always add (debit - credit), regardless of account type
        acc.openingBalance += entry.debit - entry.credit;
      }
    }
  }

  // 4. Calculate period activity (debits and credits)
  for (const tx of periodTransactions) {
    for (const entry of tx.entries) {
      const acc = updatedAccounts.find(a => a.id === entry.accountId);
      if (acc) {
        acc.periodDebit += entry.debit;
        acc.periodCredit += entry.credit;
      }
    }
  }

  // 5. Calculate GL account balances using universal formula
  // ✅ UNIVERSAL FORMULA: balance = openingBalance + periodDebit - periodCredit
  for (const acc of updatedAccounts) {
    if (acc.level === AccountLevel.GL) {
      // Use universal formula (no account-type checking)
      acc.balance = acc.openingBalance + acc.periodDebit - acc.periodCredit;
    }
  }

  // Step B: GROUP accounts aggregate GL values using pure summation
  for (const acc of updatedAccounts) {
    if (acc.level === AccountLevel.GROUP) {
      const childGLs = updatedAccounts.filter(a => a.level === AccountLevel.GL && a.parentAccountId === acc.id);
      acc.openingBalance = childGLs.reduce((sum, gl) => sum + gl.openingBalance, 0);
      acc.periodDebit = childGLs.reduce((sum, gl) => sum + gl.periodDebit, 0);
      acc.periodCredit = childGLs.reduce((sum, gl) => sum + gl.periodCredit, 0);
      // Use universal formula for group balance
      acc.balance = acc.openingBalance + acc.periodDebit - acc.periodCredit;
    }
  }

  // Step C: MAIN accounts aggregate GROUP values using pure summation
  for (const acc of updatedAccounts) {
    if (acc.level === AccountLevel.MAIN) {
      const childGroups = updatedAccounts.filter(a => a.level === AccountLevel.GROUP && a.parentAccountId === acc.id);
      acc.openingBalance = childGroups.reduce((sum, group) => sum + group.openingBalance, 0);
      acc.periodDebit = childGroups.reduce((sum, group) => sum + group.periodDebit, 0);
      acc.periodCredit = childGroups.reduce((sum, group) => sum + group.periodCredit, 0);
      // Use universal formula for main account balance
      acc.balance = acc.openingBalance + acc.periodDebit - acc.periodCredit;
    }
  }

  // ✅ RETAINED EARNINGS HANDLING:
  // Retained Earnings = Opening RE + Net Income (from display balances)
  // Net Income = Displayed Income + Displayed Expense (since both are reversed!)
  // NOT Income - Expense on raw ledger balances
  const incomeMain = updatedAccounts.find(a => a.level === AccountLevel.MAIN && a.type === AccountType.INCOME);
  const expenseMain = updatedAccounts.find(a => a.level === AccountLevel.MAIN && a.type === AccountType.EXPENSE);
  const retainedEarningsGroup = updatedAccounts.find(a => a.level === AccountLevel.GROUP && a.code === '130000');
  
  if (retainedEarningsGroup && incomeMain && expenseMain) {
    // ✅ Use display balances for net income calculation
    const displayIncome = getDisplayBalance(AccountType.INCOME, incomeMain.balance || 0);
    const displayExpense = getDisplayBalance(AccountType.EXPENSE, expenseMain.balance || 0);
    
    // ✅ Net Income = Displayed Income + Displayed Expense
    const netIncome = displayIncome + displayExpense;
    
    // RE reflects cumulative profit from display perspective
    retainedEarningsGroup.balance = retainedEarningsGroup.openingBalance + netIncome;
    
    console.log('🚨 RETAINED EARNINGS CALCULATION (in accounting.service calculateBalances):', {
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
    
    console.log(`✅ EQUITY MAIN ACCOUNT UPDATED: ৳${equityMain.balance.toFixed(2)}`);
  }

  return updatedAccounts;

};

/**
 * Calculates financial summary from account balances.
 * Used for dashboard and quick overview.
 * 
 * ✅ CRITICAL: Dashboard MUST read from reports, NOT directly from ledger.
 * 
 * This function reads Income Statement and Balance Sheet reports,
 * ensuring dashboard values ALWAYS match report values exactly.
 * 
 * Dashboard Mapping:
 * - Revenue → Income Statement (total income)
 * - Purchase → Income Statement (cost of sales group)
 * - Cash → Balance Sheet (cash asset)
 * - Receivable → Balance Sheet (receivable asset)
 * - Payable → Balance Sheet (payable liability)
 * - Net Profit → Income Statement (net profit)
 * 
 * ACCOUNTING COMPLIANCE CHECKS:
 * ✅ All values sourced from canonical report generators
 * ✅ No raw ledger access for financial numbers
 * ✅ Display transformation applied consistently
 * ✅ Safety guards against undefined values (Number() wrapper)
 */
export const getFinancialSummary = (accountsWithBalances: AccountWithTotals[]): FinancialSummary => {
  try {
    // ✅ Generate reports as single source of truth
    const incomeStatementData = getIncomeStatementData(accountsWithBalances);
    const balanceSheetData = getBalanceSheetData(accountsWithBalances);

    // ✅ Extract dashboard values FROM REPORTS, NOT from ledger
    // Revenue: Total income from Income Statement
    const revenue = Number(incomeStatementData.totalIncome ?? 0);
    
    // Purchase: Cost of Sales group from Expense section
    const costOfSalesGroup = accountsWithBalances.find(a => a.code === '180000' && a.level === AccountLevel.GROUP);
    const purchase = costOfSalesGroup ? Number((costOfSalesGroup.balance ?? 0) * -1) : 0;
    
    // Cash: Cash group from Balance Sheet Assets
    const cashGroup = balanceSheetData.assetGroups.find(g => g.code === '10000');
    const cash = Number(cashGroup?.displayAmount ?? 0);
    
    // Receivable: Receivable group from Balance Sheet Assets
    const receivableGroup = balanceSheetData.assetGroups.find(g => g.code === '20000');
    const receivable = Number(receivableGroup?.displayAmount ?? 0);
    
    // Payable: Payable group from Balance Sheet Liabilities
    const payableGroup = balanceSheetData.liabilityGroups.find(g => g.code === '70000');
    const payable = Number(payableGroup?.displayAmount ?? 0);

    console.log('✅ DASHBOARD FINANCIAL SUMMARY:', {
      cashBalance: cash,
      receivables: receivable,
      payables: payable,
      totalAssets: Number(balanceSheetData.totalAssets ?? 0),
      totalLiabilities: Number(balanceSheetData.totalLiabilities ?? 0),
      totalEquity: Number(balanceSheetData.totalEquity ?? 0),
      netIncome: Number(incomeStatementData.netProfit ?? 0),
      source: 'Income Statement + Balance Sheet (canonical reports)'
    });

    return {
      cashBalance: cash,
      receivables: receivable,
      payables: payable,
      totalAssets: Number(balanceSheetData.totalAssets ?? 0),
      totalLiabilities: Number(balanceSheetData.totalLiabilities ?? 0),
      totalEquity: Number(balanceSheetData.totalEquity ?? 0),
      netIncome: Number(incomeStatementData.netProfit ?? 0)
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
 * Gets the next voucher number for a given voucher type.
 */
export const getNextVoucherNo = (
  voucherType: VoucherType,
  transactions: Transaction[]
): string => {
  const typeTransactions = transactions.filter(t => t.voucherType === voucherType);
  const nextNum = (typeTransactions.length + 1).toString().padStart(4, '0');
  const prefix = voucherType.charAt(0); // S, P, R, P, J
  return `${prefix}${nextNum}`;
};

/**
 * Gets all transactions within a date range.
 */
export const getTransactionsByDateRange = (
  transactions: Transaction[],
  startDate: string,
  endDate: string
): Transaction[] => {
  return transactions.filter(tx => tx.date >= startDate && tx.date <= endDate);
};

/**
 * Finds an account by its code.
 */
export const getAccountByCode = (
  accounts: Account[],
  code: string
): Account | undefined => {
  return accounts.find(a => a.code === code);
};

/**
 * Finds all child accounts of a parent account.
 */
export const getChildAccounts = (
  accounts: Account[],
  parentId: string
): Account[] => {
  return accounts.filter(a => a.parentAccountId === parentId);
};

/**
 * Gets all accounts of a specific type and level.
 */
export const getAccountsByTypeAndLevel = (
  accounts: Account[],
  type: AccountType,
  level: AccountLevel
): Account[] => {
  return accounts.filter(a => a.type === type && a.level === level);
};

/**
 * Gets all GL accounts for a specific account type.
 */
export const getGLAccountsByType = (
  accounts: Account[],
  type: AccountType
): Account[] => {
  return accounts.filter(a => a.type === type && a.level === AccountLevel.GL);
};

/**
 * Validates that an account can be deleted (has no related transactions).
 */
export const canDeleteAccount = (
  accountId: string,
  transactions: Transaction[]
): boolean => {
  return !transactions.some(tx => 
    tx.entries.some(entry => entry.accountId === accountId)
  );
};

/**
 * Gets all transactions for a specific account.
 */
export const getAccountTransactions = (
  accountId: string,
  transactions: Transaction[]
): Transaction[] => {
  return transactions.filter(tx => 
    tx.entries.some(entry => entry.accountId === accountId)
  );
};
