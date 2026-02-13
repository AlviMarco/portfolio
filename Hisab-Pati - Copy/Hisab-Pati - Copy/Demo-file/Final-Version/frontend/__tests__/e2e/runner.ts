/**
 * MASTER TEST RUNNER
 * 
 * Executes all automated tests for the accounting system.
 * This is the entry point for QA automation.
 */

import { runAccountingTests } from './accounting.test';
import { runInventoryTests } from './inventory.test';

/**
 * Main test execution
 */
export const runAllTests = () => {
  console.log('\n\n');
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(78) + '║');
  console.log('║' + '  🔍 RTS SMART ACCOUNTING - COMPREHENSIVE AUTOMATED TEST SUITE'.padEnd(78) + '║');
  console.log('║' + '  Version 1.0 | QA Automation Engineer'.padEnd(78) + '║');
  console.log('║' + '  Date: January 17, 2026'.padEnd(78) + '║');
  console.log('║' + ' '.repeat(78) + '║');
  console.log('╚' + '═'.repeat(78) + '╝\n');

  // Run accounting tests
  const accountingResults = runAccountingTests();

  // Run inventory tests
  const inventoryResults = runInventoryTests();

  // Generate summary report
  console.log('\n' + '═'.repeat(80));
  console.log('📋 COMPREHENSIVE TEST REPORT');
  console.log('═'.repeat(80) + '\n');

  const accountingStatus = accountingResults.allPassed ? '✅ PASSED' : '❌ FAILED';
  const inventoryStatus = inventoryResults.allPassed ? '✅ PASSED' : '❌ FAILED';
  const overallStatus = accountingResults.allPassed && inventoryResults.allPassed ? '✅ PASSED' : '❌ FAILED';

  console.log(`📊 ACCOUNTING TESTS:        ${accountingStatus} (${accountingResults.totalPassed}/${accountingResults.totalTests})`);
  console.log(`📊 INVENTORY TESTS:         ${inventoryStatus} (${inventoryResults.totalPassed}/${inventoryResults.totalTests})`);
  console.log(`\n🎯 OVERALL STATUS:          ${overallStatus}`);
  console.log(`\n📈 TOTAL PASSED:            ${accountingResults.totalPassed + inventoryResults.totalPassed}/${accountingResults.totalTests + inventoryResults.totalTests} tests`);

  // Detailed breakdown
  console.log('\n' + '─'.repeat(80));
  console.log('📋 ACCOUNTING TESTS BREAKDOWN');
  console.log('─'.repeat(80));
  accountingResults.details.forEach(detail => {
    const status = detail.passed ? '✅' : '❌';
    console.log(`${status} ${detail.testGroup}: ${detail.passCount}/${detail.totalCount}`);
  });

  console.log('\n' + '─'.repeat(80));
  console.log('📋 INVENTORY TESTS BREAKDOWN');
  console.log('─'.repeat(80));
  inventoryResults.details.forEach(detail => {
    const status = detail.passed ? '✅' : '❌';
    console.log(`${status} ${detail.testGroup}: ${detail.passCount}/${detail.totalCount}`);
  });

  // Final verdict
  console.log('\n' + '═'.repeat(80));
  console.log('🎬 FINAL VERDICT');
  console.log('═'.repeat(80));

  if (accountingResults.allPassed && inventoryResults.allPassed) {
    console.log(`
✅ ✅ ✅ ALL CRITICAL TESTS PASSED ✅ ✅ ✅

RESULTS:
  ✔ Accounting Integrity:    VERIFIED
  ✔ Journal Balance Rules:    VERIFIED
  ✔ Account Type Logic:       VERIFIED
  ✔ Trial Balance:            VERIFIED
  ✔ Weighted Average Cost:    VERIFIED
  ✔ COGS Calculation:         VERIFIED
  ✔ Inventory Quantity:       VERIFIED
  ✔ Inventory Value:          VERIFIED
  ✔ GL Synchronization:       VERIFIED
  ✔ Negative Inventory Check: VERIFIED

STATUS: ✅ SYSTEM IS PRODUCTION-READY FOR ACCOUNTING OPERATIONS
    `);
  } else {
    console.log(`
❌ SOME TESTS FAILED

Please review the test output above to identify and fix issues.
Do NOT deploy with failing tests.
    `);
  }

  console.log('═'.repeat(80) + '\n');

  return {
    accounting: accountingResults,
    inventory: inventoryResults,
    allPassed: accountingResults.allPassed && inventoryResults.allPassed
  };
};

// Auto-run when this module is executed
if (typeof window === 'undefined') {
  // Running in Node.js (test environment)
  runAllTests();
}
