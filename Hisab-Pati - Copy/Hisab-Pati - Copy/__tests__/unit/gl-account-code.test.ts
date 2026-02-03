/**
 * GL ACCOUNT CODE GENERATION - UNIT TESTS
 * 
 * Validates the fix for GL account code generation bug
 * Tests numeric addition instead of string concatenation
 */

import { generateNextGLAccountCode } from '../src/utils/index';

// ============================================================================
// TEST SUITE
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  error?: string;
}

const results: TestResult[] = [];

/**
 * Test Helper: Assert code generation
 */
function testCodeGeneration(
  testName: string,
  groupCode: string,
  existingCodes: string[],
  expectedCode: string
): void {
  try {
    const actualCode = generateNextGLAccountCode(groupCode, existingCodes);
    const passed = actualCode === expectedCode;
    
    results.push({
      name: testName,
      passed,
      expected: expectedCode,
      actual: actualCode,
      error: passed ? undefined : `Expected ${expectedCode} but got ${actualCode}`
    });
  } catch (error: any) {
    results.push({
      name: testName,
      passed: false,
      expected: expectedCode,
      actual: 'ERROR',
      error: error.message
    });
  }
}

// ============================================================================
// TEST CASES
// ============================================================================

// Test 1: Basic GL account creation under Accounts Payable
testCodeGeneration(
  'Test 1: First GL account under Accounts Payable (70000)',
  '70000',
  [],
  '70001'
);

// Test 2: Second GL account under Accounts Payable
testCodeGeneration(
  'Test 2: Second GL account under Accounts Payable (70000)',
  '70000',
  ['70001'],
  '70002'
);

// Test 3: Third GL account under Accounts Payable
testCodeGeneration(
  'Test 3: Third GL account under Accounts Payable (70000)',
  '70000',
  ['70001', '70002'],
  '70003'
);

// Test 4: GL accounts under Accounts Receivable
testCodeGeneration(
  'Test 4: First GL account under Accounts Receivable (20000)',
  '20000',
  [],
  '20001'
);

// Test 5: Multiple GL accounts under Accounts Receivable
testCodeGeneration(
  'Test 5: Fifth GL account under Accounts Receivable (20000)',
  '20000',
  ['20001', '20002', '20003', '20004'],
  '20005'
);

// Test 6: GL accounts under Assets
testCodeGeneration(
  'Test 6: First GL account under Assets (10000)',
  '10000',
  [],
  '10001'
);

// Test 7: GL accounts under Inventory with system accounts
testCodeGeneration(
  'Test 7: Custom GL account under Inventory (30000)',
  '30000',
  ['30001', '30002', '30003', '30004', '30005'],
  '30006'
);

// Test 8: GL accounts under Operating Expenses (5-digit group)
testCodeGeneration(
  'Test 8: First GL account under Operating Expenses (170000)',
  '170000',
  [],
  '170001'
);

// Test 9: GL accounts under Income Tax (5-digit group)
testCodeGeneration(
  'Test 9: Multiple GL accounts under Income Tax (230000)',
  '230000',
  ['230001', '230002'],
  '230003'
);

// Test 10: Large sequence number
testCodeGeneration(
  'Test 10: Tenth GL account under group',
  '10000',
  ['10001', '10002', '10003', '10004', '10005', '10006', '10007', '10008', '10009'],
  '10010'
);

// Test 11: Non-contiguous codes should still work
testCodeGeneration(
  'Test 11: Non-contiguous codes (find max + 1)',
  '70000',
  ['70001', '70003', '70005'],
  '70006'
);

// Test 12: Unrelated codes should be ignored
testCodeGeneration(
  'Test 12: Ignore codes from other groups',
  '20000',
  ['20001', '70001', '70002', '70003', '20002'],
  '20003'
);

// Test 13: Error case - Invalid group code
function testErrorCase(testName: string, groupCode: string, existingCodes: string[]): void {
  try {
    const result = generateNextGLAccountCode(groupCode, existingCodes);
    results.push({
      name: testName,
      passed: false,
      expected: 'ERROR',
      actual: result,
      error: `Expected error but got code: ${result}`
    });
  } catch (error: any) {
    results.push({
      name: testName,
      passed: true,
      expected: 'ERROR',
      actual: 'ERROR (Caught)',
      error: `Correctly caught: ${error.message}`
    });
  }
}

testErrorCase('Test 13: Invalid group code (non-numeric)', 'ABC', []);

// ============================================================================
// REGRESSION TESTS (Verify BUG is FIXED)
// ============================================================================

function testBugNotReoccurring(): void {
  console.log('\n' + '='.repeat(70));
  console.log('REGRESSION TEST: Verify Original Bug is Fixed');
  console.log('='.repeat(70));
  
  const bugResult = generateNextGLAccountCode('70000', []);
  const buggyResult = '700001';
  
  if (bugResult === buggyResult) {
    console.error('❌ BUG DETECTED: Still using string concatenation!');
    console.error(`   Expected: 70001`);
    console.error(`   Got: ${bugResult}`);
    results.push({
      name: 'CRITICAL: Bug not fixed',
      passed: false,
      expected: '70001',
      actual: bugResult,
      error: 'String concatenation still present'
    });
  } else {
    console.log('✅ Bug is FIXED: Using numeric addition');
    console.log(`   Group Code: 70000`);
    console.log(`   First GL Account: ${bugResult} (correct!)`);
    results.push({
      name: 'CRITICAL: Bug is fixed',
      passed: true,
      expected: '70001',
      actual: bugResult
    });
  }
}

testBugNotReoccurring();

// ============================================================================
// RESULTS SUMMARY
// ============================================================================

function printResults(): void {
  console.log('\n' + '='.repeat(70));
  console.log('TEST RESULTS SUMMARY');
  console.log('='.repeat(70));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  
  console.log(`\nTotal Tests: ${total}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);
  
  // Print detailed results
  results.forEach((result, index) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${index + 1}. ${status} - ${result.name}`);
    if (!result.passed) {
      console.log(`   Expected: ${result.expected}`);
      console.log(`   Actual: ${result.actual}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    }
  });
  
  // Final verdict
  console.log('\n' + '='.repeat(70));
  if (failed === 0) {
    console.log('✅ ALL TESTS PASSED - GL Account Code Generation is FIXED!');
    console.log('='.repeat(70));
    console.log('\nValidation Checklist:');
    console.log('  ✅ No string concatenation for GL codes');
    console.log('  ✅ Numeric addition working correctly');
    console.log('  ✅ All group account types supported');
    console.log('  ✅ Edge cases handled');
    console.log('  ✅ Error handling in place');
    console.log('\nReady for production deployment!');
  } else {
    console.log(`❌ ${failed} TEST(S) FAILED - Review errors above`);
    console.log('='.repeat(70));
  }
  console.log('\n');
}

printResults();

// ============================================================================
// EXPORT FOR AUTOMATION
// ============================================================================

export { results, testCodeGeneration, testErrorCase };