import { Account, Transaction, AccountType, AccountLevel, FinancialSummary, JournalEntry, VoucherType, CashFlowData } from '../types';

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
        // RE reflects cumulative profit from display perspective
        retainedEarningsGroup.balance = retainedEarningsGroup.openingBalance + netIncome;
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
 */
export const getFinancialSummary = (accounts: Account[]): FinancialSummary => {
    try {
        const incomeStatement = getIncomeStatementData(accounts);
        const balanceSheet = getBalanceSheetData(accounts);

        const cashGroup = balanceSheet.assetGroups.find(g => g.code === '10000');
        const receivableGroup = balanceSheet.assetGroups.find(g => g.code === '20000');
        const payableGroup = balanceSheet.liabilityGroups.find(g => g.code === '70000');

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
 */
export const getIncomeStatementData = (accountsWithBalances: Account[]): {
    incomeGroups: Array<{ name: string; balance: number; displayAmount: number; code: string }>;
    expenseGroups: Array<{ name: string; balance: number; displayAmount: number; code: string }>;
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
} => {
    try {
        const incomeGroups = accountsWithBalances
            .filter(a => a.type === AccountType.INCOME && a.level === AccountLevel.GROUP)
            .map(group => ({
                name: group.name,
                balance: Number(group.balance ?? 0),
                displayAmount: Number((group.balance ?? 0) * -1),
                code: group.code
            }));

        const expenseGroups = accountsWithBalances
            .filter(a => a.type === AccountType.EXPENSE && a.level === AccountLevel.GROUP)
            .map(group => ({
                name: group.name,
                balance: Number(group.balance ?? 0),
                displayAmount: Number((group.balance ?? 0) * -1),
                code: group.code
            }));

        const totalIncome = incomeGroups.reduce((sum, g) => sum + (g.displayAmount ?? 0), 0);
        const totalExpense = expenseGroups.reduce((sum, g) => sum + (g.displayAmount ?? 0), 0);
        const netProfit = totalIncome + totalExpense;

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
        const incomeStatement = getIncomeStatementData(accountsWithBalances);

        const assetGroups = accountsWithBalances
            .filter(a => a.type === AccountType.ASSET && a.level === AccountLevel.GROUP)
            .map(group => ({
                name: group.name,
                balance: Number(group.balance ?? 0),
                displayAmount: Number(group.balance ?? 0),
                code: group.code
            }));

        const liabilityGroups = accountsWithBalances
            .filter(a => a.type === AccountType.LIABILITY && a.level === AccountLevel.GROUP)
            .map(group => ({
                name: group.name,
                balance: Number(group.balance ?? 0),
                displayAmount: Number((group.balance ?? 0) * -1),
                code: group.code
            }));

        const equityGroups = accountsWithBalances
            .filter(a => a.type === AccountType.EQUITY && a.level === AccountLevel.GROUP)
            .map(group => {
                const isRetainedEarnings = group.code === '130000';
                const displayAmount = isRetainedEarnings
                    ? Number(incomeStatement.netProfit ?? 0)
                    : Number((group.balance ?? 0) * -1);

                return {
                    name: group.name,
                    balance: Number(group.balance ?? 0),
                    displayAmount: displayAmount,
                    code: group.code
                };
            });

        const totalAssets = assetGroups.reduce((sum, g) => sum + (g.displayAmount ?? 0), 0);
        const totalLiabilities = liabilityGroups.reduce((sum, g) => sum + (g.displayAmount ?? 0), 0);
        const totalEquity = equityGroups.reduce((sum, g) => sum + (g.displayAmount ?? 0), 0);

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

export const sortTransactionsByVoucherNo = (transactions: Transaction[]): Transaction[] => {
    return [...transactions].sort((a, b) => {
        const aMatch = a.voucherNo.match(/\d+/);
        const bMatch = b.voucherNo.match(/\d+/);

        if (aMatch && bMatch) {
            const aNum = parseInt(aMatch[0], 10);
            const bNum = parseInt(bMatch[0], 10);

            if (aNum !== bNum) {
                return bNum - aNum;
            }
        }

        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) {
            return dateCompare;
        }

        return b.voucherNo.localeCompare(a.voucherNo);
    });
};

/**
 * ✅ AUTOMATED CASH FLOW COMPONENTS CALCULATION
 * 
 * Direct Method Cash Flow based on balance changes in system-defined GL groups.
 */
export const getCashFlowData = (
    accountsWithBalances: AccountWithTotals[],
    transactions: Transaction[],
    startDate: string,
    endDate: string
): CashFlowData => {
    try {
        const summary = getFinancialSummary(accountsWithBalances);
        const netProfit = summary.netIncome ?? 0;
        const groups = accountsWithBalances.filter(a => a.level === AccountLevel.GROUP);

        const getChange = (code: string) => {
            const acc = groups.find(g => g.code === code);
            return acc ? acc.balance - acc.openingBalance : 0;
        };

        // Operating
        const operatingChanges = [
            { name: 'Accounts Receivable', change: -getChange('20000') },
            { name: 'Inventory', change: -getChange('30000') },
            { name: 'Advance/Prepayments', change: -getChange('50000') },
            { name: 'Current Tax Assets', change: -getChange('60000') },
            { name: 'Accounts Payable', change: getChange('70000') },
            { name: 'Advance Received', change: getChange('80000') },
            { name: 'Tax Payable', change: getChange('100000') },
            { name: 'Provisions', change: getChange('110000') }
        ].filter(item => item.change !== 0);

        const netOperating = netProfit + operatingChanges.reduce((s, i) => s + i.change, 0);

        // Investing
        const investingChanges = [
            { name: 'Fixed Assets Purchase/Sale', change: -getChange('40000') }
        ].filter(item => item.change !== 0);
        const netInvesting = investingChanges.reduce((s, i) => s + i.change, 0);

        // Financing
        const financingChanges = [
            { name: 'Bank Borrowings', change: getChange('90000') },
            { name: 'Share Capital', change: getChange('120000') },
            { name: 'Share Money Deposit', change: getChange('150000') }
        ].filter(item => item.change !== 0);
        const netFinancing = financingChanges.reduce((s, i) => s + i.change, 0);

        const openingGroup = groups.find(g => g.code === '10000');
        const openingCash = openingGroup?.openingBalance || 0;
        const closingCash = openingGroup?.balance || 0;

        return {
            netProfit,
            operatingChanges,
            netOperating,
            investingChanges,
            netInvesting,
            financingChanges,
            netFinancing,
            openingCash,
            closingCash,
            netChange: netOperating + netInvesting + netFinancing
        };
    } catch (error) {
        console.error('❌ ERROR in getCashFlowData:', error);
        return {
            netProfit: 0,
            operatingChanges: [],
            netOperating: 0,
            investingChanges: [],
            netInvesting: 0,
            financingChanges: [],
            netFinancing: 0,
            openingCash: 0,
            closingCash: 0,
            netChange: 0
        };
    }
};

/**
 * ✅ DASHBOARD ACTIVITY CHART DATA GENERATOR
 * 
 * Calculates income and expense trends for the last 7 days.
 */
export const getDashboardStats = (
    accounts: Account[],
    transactions: Transaction[]
): { label: string; income: number; expense: number }[] => {
    const stats = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];

        let dailyIncome = 0;
        let dailyExpense = 0;

        const dayTransactions = transactions.filter(tx => tx.date === dateStr);
        dayTransactions.forEach(tx => {
            tx.entries.forEach(entry => {
                const acc = accounts.find(a => a.id === entry.accountId);
                if (acc) {
                    // Apply presentation reversals
                    if (acc.type === AccountType.INCOME) {
                        dailyIncome += (entry.debit - entry.credit) * -1;
                    } else if (acc.type === AccountType.EXPENSE) {
                        dailyExpense += (entry.debit - entry.credit) * -1;
                    }
                }
            });
        });

        stats.push({
            label: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
            income: Math.max(0, dailyIncome),
            expense: Math.max(0, dailyExpense)
        });
    }
    return stats;
};
