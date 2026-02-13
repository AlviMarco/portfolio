/**
 * BALANCE PRESENTATION LOGIC VALIDATION TEST
 * 
 * Validates the display balance reversal logic and profit calculation
 * according to the custom business requirement:
 * 
 * For display purposes only (P&L, Balance Sheet, Dashboard, PDFs):
 * - ASSET: Show as-is
 * - INCOME, EXPENSE, LIABILITY, EQUITY: Reverse sign
 * 
 * Profit calculation: Net Profit = Displayed Income + Displayed Expense
 * (NOT Income - Expense, since both are reversed)
 */

import { AccountType } from '../types';

/**
 * ✅ CENTRALIZED DISPLAY BALANCE HELPER
 * (Should be imported from engine.ts or accounting.service.ts)
 */
const getDisplayBalance = (accountType: AccountType, ledgerBalance: number): number => {
  if (accountType === AccountType.ASSET) {
    return ledgerBalance;
  }
  return ledgerBalance * -1;
};

// ============================================================================
// TEST SCENARIOS FROM REQUIREMENTS
// ============================================================================

export const testBalancePresentationLogic = (): {
  passed: boolean;
  tests: Array<{ name: string; passed: boolean; details: string }>;
} => {
  const results: Array<{ name: string; passed: boolean; details: string }> = [];

  // =========================================================================
  // SCENARIO 1: P&L Display with Income and Expense Reversal
  // =========================================================================
  // Ledger:
  // - Sales (Income): -40 (negative in ledger, stored as debit = 0, credit = 40)
  // - Expense: +25 (positive in ledger, stored as debit = 25, credit = 0)
  // 
  // Expected Display:
  // - Sales: 40 (reversed from -40)
  // - Expense: -25 (reversed from +25)
  // - Profit: 40 + (-25) = 15 ✅

  const ledgerIncome = -40;
  const ledgerExpense = 25;

  const displayIncome = getDisplayBalance(AccountType.INCOME, ledgerIncome);
  const displayExpense = getDisplayBalance(AccountType.EXPENSE, ledgerExpense);
  const netProfitDisplayed = displayIncome + displayExpense;

  results.push({
    name: 'TEST 1.1: Income display reversal',
    passed: displayIncome === 40,
    details: `Ledger Income: ${ledgerIncome} → Display: ${displayIncome} (expected: 40)`
  });

  results.push({
    name: 'TEST 1.2: Expense display reversal',
    passed: displayExpense === -25,
    details: `Ledger Expense: ${ledgerExpense} → Display: ${displayExpense} (expected: -25)`
  });

  results.push({
    name: 'TEST 1.3: Profit calculation (displayed)',
    passed: netProfitDisplayed === 15,
    details: `Displayed Income (${displayIncome}) + Displayed Expense (${displayExpense}) = ${netProfitDisplayed} (expected: 15)`
  });

  // =========================================================================
  // SCENARIO 2: Balance Sheet with Liability Display Reversal
  // =========================================================================
  // Ledger:
  // - Accounts Payable: -10,000 (negative in ledger = credit balance)
  // 
  // Expected Display:
  // - Accounts Payable: 10,000 (reversed for display)

  const ledgerPayable = -10000;
  const displayPayable = getDisplayBalance(AccountType.LIABILITY, ledgerPayable);

  results.push({
    name: 'TEST 2.1: Liability display reversal',
    passed: displayPayable === 10000,
    details: `Ledger Payable: ${ledgerPayable} → Display: ${displayPayable} (expected: 10,000)`
  });

  // =========================================================================
  // SCENARIO 3: Asset Display (No Reversal)
  // =========================================================================
  // Ledger:
  // - Cash: 50,000 (positive in ledger)
  // 
  // Expected Display:
  // - Cash: 50,000 (no reversal for assets)

  const ledgerCash = 50000;
  const displayCash = getDisplayBalance(AccountType.ASSET, ledgerCash);

  results.push({
    name: 'TEST 3.1: Asset display (no reversal)',
    passed: displayCash === 50000,
    details: `Ledger Cash: ${ledgerCash} → Display: ${displayCash} (expected: 50,000)`
  });

  // =========================================================================
  // SCENARIO 4: Equity Display Reversal
  // =========================================================================
  // Ledger:
  // - Share Capital: -100,000 (negative in ledger = credit balance)
  // 
  // Expected Display:
  // - Share Capital: 100,000 (reversed for display)

  const ledgerEquity = -100000;
  const displayEquity = getDisplayBalance(AccountType.EQUITY, ledgerEquity);

  results.push({
    name: 'TEST 4.1: Equity display reversal',
    passed: displayEquity === 100000,
    details: `Ledger Equity: ${ledgerEquity} → Display: ${displayEquity} (expected: 100,000)`
  });

  // =========================================================================
  // SCENARIO 5: Complex P&L (Multiple Income and Expense Accounts)
  // =========================================================================
  // Ledger:
  // - Sales: -50,000
  // - Interest Income: -5,000
  // - Salaries: +30,000
  // - Rent: +10,000
  // 
  // Expected Display:
  // - Total Income: 50,000 + 5,000 = 55,000
  // - Total Expense: -30,000 + (-10,000) = -40,000
  // - Net Profit: 55,000 + (-40,000) = 15,000

  const ledgerSales = -50000;
  const ledgerInterest = -5000;
  const ledgerSalaries = 30000;
  const ledgerRent = 10000;

  const displaySales = getDisplayBalance(AccountType.INCOME, ledgerSales);
  const displayInterest = getDisplayBalance(AccountType.INCOME, ledgerInterest);
  const displaySalaries = getDisplayBalance(AccountType.EXPENSE, ledgerSalaries);
  const displayRent = getDisplayBalance(AccountType.EXPENSE, ledgerRent);

  const totalDisplayIncome = displaySales + displayInterest;
  const totalDisplayExpense = displaySalaries + displayRent;
  const netProfitComplex = totalDisplayIncome + totalDisplayExpense;

  results.push({
    name: 'TEST 5.1: Multiple income accounts',
    passed: totalDisplayIncome === 55000,
    details: `Sales (${displaySales}) + Interest (${displayInterest}) = ${totalDisplayIncome} (expected: 55,000)`
  });

  results.push({
    name: 'TEST 5.2: Multiple expense accounts',
    passed: totalDisplayExpense === -40000,
    details: `Salaries (${displaySalaries}) + Rent (${displayRent}) = ${totalDisplayExpense} (expected: -40,000)`
  });

  results.push({
    name: 'TEST 5.3: Complex P&L profit',
    passed: netProfitComplex === 15000,
    details: `Income (${totalDisplayIncome}) + Expense (${totalDisplayExpense}) = ${netProfitComplex} (expected: 15,000)`
  });

  // =========================================================================
  // SCENARIO 6: Negative Profit (Loss)
  // =========================================================================
  // Ledger:
  // - Sales: -30,000
  // - Expenses: +50,000
  // 
  // Expected Display:
  // - Income: 30,000
  // - Expenses: -50,000
  // - Net Loss: 30,000 + (-50,000) = -20,000

  const ledgerSalesLoss = -30000;
  const ledgerExpensesLoss = 50000;

  const displayIncomeLoss = getDisplayBalance(AccountType.INCOME, ledgerSalesLoss);
  const displayExpenseLoss = getDisplayBalance(AccountType.EXPENSE, ledgerExpensesLoss);
  const netLoss = displayIncomeLoss + displayExpenseLoss;

  results.push({
    name: 'TEST 6.1: Loss scenario (negative profit)',
    passed: netLoss === -20000,
    details: `Income (${displayIncomeLoss}) + Expense (${displayExpenseLoss}) = ${netLoss} (expected: -20,000 loss)`
  });

  // =========================================================================
  // SCENARIO 7: Zero Profit
  // =========================================================================
  // Ledger:
  // - Sales: -40,000
  // - Expenses: +40,000
  // 
  // Expected Display:
  // - Income: 40,000
  // - Expenses: -40,000
  // - Net Profit: 0

  const ledgerSalesZero = -40000;
  const ledgerExpensesZero = 40000;

  const displayIncomeZero = getDisplayBalance(AccountType.INCOME, ledgerSalesZero);
  const displayExpenseZero = getDisplayBalance(AccountType.EXPENSE, ledgerExpensesZero);
  const netZero = displayIncomeZero + displayExpenseZero;

  results.push({
    name: 'TEST 7.1: Break-even scenario (zero profit)',
    passed: netZero === 0,
    details: `Income (${displayIncomeZero}) + Expense (${displayExpenseZero}) = ${netZero} (expected: 0)`
  });

  // =========================================================================
  // SCENARIO 8: Balance Sheet Equation Validation
  // =========================================================================
  // Display Balance Sheet should satisfy: Assets = Liabilities + Equity
  // Ledger:
  // - Assets: +100,000
  // - Liabilities: -50,000
  // - Equity: -50,000
  // 
  // Expected Display:
  // - Assets: 100,000
  // - Liabilities: 50,000
  // - Equity: 50,000
  // - Equation: 100,000 = 50,000 + 50,000 ✅

  const ledgerAssets = 100000;
  const ledgerLiabilities = -50000;
  const ledgerEquityBS = -50000;

  const displayAssets = getDisplayBalance(AccountType.ASSET, ledgerAssets);
  const displayLiabilities = getDisplayBalance(AccountType.LIABILITY, ledgerLiabilities);
  const displayEquityBS = getDisplayBalance(AccountType.EQUITY, ledgerEquityBS);

  const balanceSheetBalanced = displayAssets === (displayLiabilities + displayEquityBS);

  results.push({
    name: 'TEST 8.1: Balance Sheet equation',
    passed: balanceSheetBalanced,
    details: `Assets (${displayAssets}) = Liabilities (${displayLiabilities}) + Equity (${displayEquityBS})? ${balanceSheetBalanced}`
  });

  // =========================================================================
  // SUMMARY
  // =========================================================================
  const passed = results.every(r => r.passed);

  return {
    passed,
    tests: results
  };
};

// ============================================================================
// RUN TESTS
// ============================================================================

if (require.main === module) {
  const result = testBalancePresentationLogic();
  
  console.log('\n' + '='.repeat(80));
  console.log('BALANCE PRESENTATION LOGIC TESTS');
  console.log('='.repeat(80) + '\n');

  result.tests.forEach((test, idx) => {
    const status = test.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} | Test ${idx + 1}: ${test.name}`);
    console.log(`       ${test.details}\n`);
  });

  console.log('='.repeat(80));
  const totalTests = result.tests.length;
  const passedTests = result.tests.filter(t => t.passed).length;
  console.log(`SUMMARY: ${passedTests}/${totalTests} tests passed`);
  console.log(`Overall: ${result.passed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  console.log('='.repeat(80) + '\n');

  process.exit(result.passed ? 0 : 1);
}

export default testBalancePresentationLogic;
