# 📚 FEATURES DOCUMENTATION

## What are Features?

Features are **self-contained business domains** that encapsulate specific functionality.

```
📦 Feature = Services + Hooks + Types
   └─ One specific business capability
   └─ Independent from other features
   └─ Can be enabled/disabled
   └─ Easy to test
```

---

## Feature Map

```
src/features/
├── accounting/          → Manage accounts & transactions (double-entry)
├── inventory/           → Track stock & items (with WAC)
├── reports/             → Generate financial statements
├── backup/              → Local & cloud backup/restore
├── settings/            → User preferences & configuration
├── company/             → Multi-company management
└── ai/                  → AI-powered insights (Gemini)
```

---

## 🏦 ACCOUNTING FEATURE

**Purpose**: Double-entry journal system for tracking financial transactions.

### What it provides:

```typescript
// Creating an account
await createAccount({
  name: 'Cash',
  type: AccountType.ASSET,
  level: AccountLevel.GROUP,
  code: '10000'
});

// Calculating balance for a period
const balance = calculateBalance(accounts, startDate, endDate);

// Sorting accounts in hierarchy
const sorted = sortAccountsByHierarchy(accounts);
```

### Services in `src/features/accounting/services/`:

**accounting.service.ts**
- `getAccounts()` - Fetch all accounts for company
- `createAccount()` - Add new account
- `updateAccount()` - Modify account
- `deleteAccount()` - Remove account
- `calculateBalance()` - Account balance for period

**account-sorting.service.ts**
- `sortAccountsByHierarchy()` - Main > Group > GL order
- `getChildAccounts()` - Get accounts under parent
- `sortAccountsByType()` - Group by asset/liability/etc

### Hooks in `src/features/accounting/hooks/`:

**useAccounts.ts**
```typescript
const useAccounts = () => {
  return {
    accounts: Account[],
    addAccount: (data) => Promise<void>,
    updateAccount: (id, data) => Promise<void>,
    deleteAccount: (id) => Promise<void>,
    loading: boolean,
    error: string | null
  };
};
```

**useTransactions.ts**
```typescript
const useTransactions = () => {
  return {
    transactions: Transaction[],
    addTransaction: (voucher) => Promise<void>,
    updateTransaction: (id, voucher) => Promise<void>,
    deleteTransaction: (id) => Promise<void>,
    getBalance: (accountId, startDate, endDate) => number,
    loading: boolean
  };
};
```

### Used by:
- TransactionsScreen
- LedgerScreen
- ReportsScreen
- DashboardScreen

---

## 📦 INVENTORY FEATURE

**Purpose**: Track inventory items, stock movements, and calculate weighted average cost (WAC).

### What it provides:

```typescript
// Create inventory movement (IN = purchase, OUT = sale)
const movement = createInventoryMovement(
  itemId,
  'OUT',  // Sale
  quantity: 5,
  rate: 100
);

// Calculate COGS for period
const cogs = calculateCOGS(movements, periodStart, periodEnd);

// Get item summary
const report = generateInventoryReport(items, movements);
```

### Services in `src/features/inventory/services/`:

**inventory.service.ts**
- `getSubLedgers()` - All inventory items
- `createSubLedger()` - Add new item
- `updateSubLedger()` - Modify item
- `deleteSubLedger()` - Remove item
- `getInventoryMovements()` - Stock history
- `createInventoryMovement()` - Record IN/OUT
- `calculateWAC()` - Weighted average cost
- `calculateCOGS()` - Cost of goods sold

**item-table.service.ts**
- `validateSufficientInventory()` - Check stock
- `updateQuantity()` - Change item qty
- `getMovementHistory()` - Item audit trail

### Hooks in `src/features/inventory/hooks/`:

**useInventory.ts**
```typescript
const useInventory = () => {
  return {
    items: InventorySubLedger[],
    movements: InventoryMovement[],
    addItem: (itemData) => Promise<void>,
    updateItem: (itemId, data) => Promise<void>,
    deleteItem: (itemId) => Promise<void>,
    recordMovement: (itemId, type, qty, rate) => Promise<void>,
    getRunningBalance: (itemId, upToDate) => {qty, wac},
    generateReport: (startDate, endDate) => InventoryReport,
    loading: boolean
  };
};
```

### How WAC Works:

```
Example: Weighted Average Cost

Initial Stock: 0 units @ $0

Purchase 1: Buy 10 units @ $100/unit
  WAC = (10 × $100) / 10 = $100/unit

Purchase 2: Buy 20 units @ $80/unit
  Total Value = (10 × $100) + (20 × $80) = $2,600
  Total Qty = 30 units
  New WAC = $2,600 / 30 = $86.67/unit

Sale: Sell 15 units
  COGS = 15 × $86.67 = $1,300.05
  Qty Left = 15 units
  WAC remains = $86.67/unit (unchanged)
```

### Used by:
- InventoryScreen
- TransactionsScreen (for Sales/Purchase vouchers)
- ReportsScreen (Inventory report)

---

## 📊 REPORTS FEATURE

**Purpose**: Generate financial statements (P&L, Balance Sheet, Trial Balance, Cash Flow).

### What it provides:

```typescript
// Generate Profit & Loss statement
const pl = generateProfitLoss(accounts, startDate, endDate);

// Generate Balance Sheet (snapshot)
const bs = generateBalanceSheet(accounts, asOfDate);

// Generate Trial Balance (verification)
const tb = generateTrialBalance(accounts, date);

// Generate Cash Flow statement
const cf = generateCashFlow(accounts, startDate, endDate);
```

### Services in `src/features/reports/services/`:

**report-generator.service.ts**
- `generateProfitLoss()` - Income statement
- `generateBalanceSheet()` - Position statement
- `generateTrialBalance()` - Verification statement
- `generateCashFlow()` - Cash movements
- `generateInventoryReport()` - Stock summary
- `exportToPDF()` - PDF generation
- `exportToExcel()` - Excel export

### Hooks in `src/features/reports/hooks/`:

**useReports.ts**
```typescript
const useReports = () => {
  return {
    reports: {
      profitLoss: ReportData,
      balanceSheet: ReportData,
      trialBalance: ReportData,
      cashFlow: ReportData
    },
    dateRange: { start, end },
    setDateRange: (start, end) => void,
    exportAs: (format: 'PDF' | 'Excel') => void,
    loading: boolean
  };
};
```

### P&L Structure:

```
Profit & Loss (Jan 1 - Dec 31)

INCOME
  Sales                           ৳500,000
  Service Revenue                  ৳50,000
                        ──────────────────
Total Income                       ৳550,000

EXPENSES
  Cost of Goods Sold              ৳300,000
  Salaries                        ৳100,000
  Rent                             ৳20,000
  Utilities                         ৳5,000
                        ──────────────────
Total Expenses                     ৳425,000

NET PROFIT                         ৳125,000
```

### Balance Sheet Structure:

```
Balance Sheet (As of Dec 31)

ASSETS
  Current Assets
    Cash                          ৳50,000
    Accounts Receivable           ৳75,000
                        ──────────────────
  Total Current Assets           ৳125,000

  Fixed Assets
    Equipment                    ৳200,000
    Less: Depreciation           (৳20,000)
                        ──────────────────
  Total Fixed Assets             ৳180,000

TOTAL ASSETS                      ৳305,000

LIABILITIES
  Current Liabilities
    Accounts Payable              ৳50,000
                        ──────────────────
  Total Current Liabilities        ৳50,000

EQUITY
  Share Capital                  ৳200,000
  Retained Earnings               ৳55,000
                        ──────────────────
  Total Equity                   ৳255,000

TOTAL LIABILITIES + EQUITY        ৳305,000
```

### Used by:
- ReportsScreen

---

## 💾 BACKUP FEATURE

**Purpose**: Local backup and Google Drive cloud synchronization.

### What it provides:

```typescript
// Create local backup
await performLocalBackup();

// Upload to Google Drive
await uploadToGoogleDrive(backupFile);

// List cloud backups
const files = await listGoogleDriveBackups();

// Restore from backup
await restoreFromBackup(backupFile);
```

### Services in `src/features/backup/services/`:

**backup.service.ts**
- `performLocalBackup()` - Save to device storage
- `listLocalBackups()` - Get saved backups
- `deleteLocalBackup()` - Remove backup
- `restoreFromLocalBackup()` - Restore data

**google-drive.service.ts**
- `initializeGoogleDrive()` - Setup OAuth
- `uploadToGoogleDrive()` - Upload backup file
- `listGoogleDriveBackups()` - Get cloud files
- `downloadFromGoogleDrive()` - Download backup
- `deleteFromGoogleDrive()` - Remove cloud backup

### Used by:
- BackupScreen

---

## ⚙️ SETTINGS FEATURE

**Purpose**: User preferences, plan management, and configuration.

### What it provides:

```typescript
// Get current plan type
const plan = getPlanType(); // 'BASIC' or 'MODERATE'

// Switch plan
setPlanType('MODERATE');

// Get/set settings
const theme = getSetting('theme');
saveSetting('theme', 'dark');

// Get active company
const company = getActiveCompany();
setActiveCompany(companyId);
```

### Services in `src/features/settings/services/`:

**settings.service.ts**
- `getPlanType()` - Current plan (BASIC/MODERATE)
- `setPlanType()` - Change plan
- `getSetting()` - Get setting by key
- `saveSetting()` - Save setting
- `clearSettings()` - Reset all settings

### Plan Types:

**BASIC Plan**:
- Pure accounting (no inventory)
- Journal, Payment, Receipt vouchers only
- Unlimited accounts
- Financial reports

**MODERATE Plan**:
- Full accounting + inventory
- Sales, Purchase vouchers with items
- Stock tracking with WAC
- Inventory reports
- COGS auto-posting

### Used by:
- SettingsScreen
- TransactionsScreen (plan validation)
- App initialization

---

## 🏢 COMPANY FEATURE

**Purpose**: Multi-company management (multiple businesses in one app).

### What it provides:

```typescript
// Create new company
await createCompany({
  name: 'My Business',
  address: 'Dhaka, Bangladesh',
  financialYear: { startDate: '2024-01-01', endDate: '2024-12-31' }
});

// Switch active company
await switchCompany(companyId);

// List all companies
const companies = await getCompanies();
```

### Services in `src/features/company/services/`:

**company.service.ts**
- `createCompany()` - Setup new company
- `getCompanies()` - List all companies
- `switchCompany()` - Change active company
- `getActiveCompany()` - Current company
- `updateCompany()` - Modify company
- `deleteCompany()` - Remove company

### Used by:
- App header (company switcher)
- Onboarding screen
- SettingsScreen

---

## 🤖 AI FEATURE

**Purpose**: AI-powered financial insights using Google Gemini.

### What it provides:

```typescript
// Get financial advice
const advice = await getFinancialAdvice(accounts, transactions);
// Returns: "Your cash balance is low. Consider reducing expenses..."
```

### Services in `src/features/ai/services/`:

**gemini.service.ts**
- `getFinancialAdvice()` - Analyze accounts & suggest improvements
- `analyzeExpenses()` - Expense analysis
- `cashFlowAnalysis()` - Cash flow insights

### Used by:
- DashboardScreen (AI insight card)

---

## 🔄 How Features Work Together

### Example: Sales Voucher Flow

```
1. User on TransactionsScreen
   ↓
2. Fills TransactionForm (amount, accounts, items)
   ↓
3. Form calls:
   - accounting.createSalesVoucher() ← Accounting feature
   - inventory.createInventoryMovement() ← Inventory feature
   - accounting.calculateCOGS() ← Accounting + Inventory
   ↓
4. Data saved to database (core/database/)
   ↓
5. UI updates with new transaction
```

### Data Flow Between Features:

```
                    ┌─ SETTINGS ─┐
                    │ (plan type) │
                    └─────┬─────┘
                          ↓
TRANSACTIONS ← ACCOUNTING ← REPORTS
    ↓              ↓
INVENTORY ←─── INVENTORY ←─── REPORTS
    ↓              ↓
  BACKUP ←──── DATABASE ──────── AI
```

---

## 📌 Best Practices for Features

### DO:

1. **Keep features independent**
   ```typescript
   // ✅ GOOD - inventory feature handles its own logic
   export function calculateWAC(movements) {
     // Pure calculation
   }
   ```

2. **Export public API via index.ts**
   ```typescript
   // src/features/inventory/index.ts
   export * from './services';
   export * from './hooks';
   ```

3. **Use feature hooks in screens**
   ```typescript
   // ✅ GOOD
   const { items, addItem } = useInventory();
   ```

4. **Test features independently**
   ```typescript
   // Each feature can be tested in isolation
   ```

### DON'T:

1. **Don't import between features**
   ```typescript
   // ❌ BAD
   import { getAccounts } from '@features/accounting';
   // (in inventory service - creates dependency)
   ```

2. **Don't put UI logic in services**
   ```typescript
   // ❌ BAD
   export function createItem(data) {
     alert('Item created!'); // NO - service shouldn't know about alerts
   }
   ```

3. **Don't export internal functions**
   ```typescript
   // ✅ GOOD - only export what's needed
   export { useInventory };
   export { createInventoryMovement };
   // NOT private helper functions
   ```

---

## Adding a New Feature

### Step 1: Create Folder
```bash
mkdir -p src/features/myFeature/services
mkdir -p src/features/myFeature/hooks
```

### Step 2: Create Service
```typescript
// src/features/myFeature/services/myFeature.service.ts

export function doSomething(data: SomeType): ResultType {
  // business logic
  return result;
}

export async function saveSomething(data: SomeType): Promise<void> {
  // save to database
  await saveData('collection', data, db);
}
```

### Step 3: Create Hook
```typescript
// src/features/myFeature/hooks/useMyFeature.ts

export const useMyFeature = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  const add = async (data: ItemType) => {
    setLoading(true);
    try {
      await saveSomething(data);
      // refresh list
    } finally {
      setLoading(false);
    }
  };

  return { items, add, loading };
};
```

### Step 4: Create Index
```typescript
// src/features/myFeature/index.ts
export * from './services/myFeature.service';
export * from './hooks/useMyFeature';
```

### Step 5: Use in Screen
```typescript
// src/screens/MyScreen.tsx

import { useMyFeature } from '@features/myFeature';

export const MyScreen = () => {
  const { items, add } = useMyFeature();
  // use in component
};
```

---

## Testing Features

### Unit Test Example:

```typescript
// __tests__/unit/my-feature.test.ts

import { doSomething } from '@features/myFeature';

export const testMyFeature = () => {
  const input = { id: '1', name: 'Test' };
  const result = doSomething(input);
  
  return {
    passed: result.id === '1',
    message: 'Feature works correctly'
  };
};
```

---

## Summary

- ✅ Features = business domains
- ✅ Self-contained with services + hooks
- ✅ Independent and testable
- ✅ Clear public API via index.ts
- ✅ Easy to understand and maintain

Happy building! 🚀
