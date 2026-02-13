# 🎯 QUICK START GUIDE

**For**: New developers joining the project  
**Time**: 10 minutes to understand the structure

---

## 📱 What is Hisab-Pati?

A professional **accounting and inventory management app** for mobile and web.

### Key Capabilities:
- 📊 **Accounting**: Double-entry journal system
- 📦 **Inventory**: Stock tracking with Weighted Average Cost
- 💾 **Multi-Company**: Manage multiple businesses
- 📈 **Reports**: P&L, Balance Sheet, Cash Flow
- ☁️ **Backup**: Google Drive integration
- 🤖 **AI**: Financial advice from Gemini

---

## 🗂️ Folder Map (5-Second Version)

```
src/
├── core/               ← Business logic (no UI)
│   ├── engine/         ← Calculations
│   ├── database/       ← Data storage
│   └── types/          ← Data structures
│
├── features/           ← Features (domain modules)
│   ├── accounting/     ← Accounts & transactions
│   ├── inventory/      ← Stock management
│   ├── reports/        ← Financial reports
│   ├── backup/         ← Backup & restore
│   ├── settings/       ← Preferences
│   ├── company/        ← Multi-company
│   └── ai/             ← AI insights
│
├── screens/            ← Full-page views
├── components/         ← Reusable UI parts
├── hooks/              ← Shared custom hooks
├── utils/              ← Helper functions
├── config/             ← Configuration
└── styles/             ← Global CSS

docs/                  ← Documentation (this folder)
__tests__/             ← Tests
```

---

## 🔄 How Code Flows

### **Data Journey** (Example: Create Transaction)

```
1. User on TransactionsScreen
           ↓
2. Fills TransactionForm
           ↓
3. Form calls: handleAddTransaction()
           ↓
4. Calls service: accounting.createTransaction()
           ↓
5. Service validates & processes
           ↓
6. Saves to database via core/database
           ↓
7. Database stores in IndexedDB
           ↓
8. Hook re-fetches data
           ↓
9. Component re-renders with new data
           ↓
10. User sees new transaction
```

### **Dependency Direction** (Always DOWN)

```
🖥️ SCREENS
    ↓
🧩 COMPONENTS
    ↓
🪝 HOOKS & FEATURES
    ↓
⚙️ SERVICES
    ↓
🔧 CORE (Engine, Database, Types)
    ↓
💾 IndexedDB (Offline Storage)
```

**Rule**: Never import UP. Always import DOWN.

---

## 📂 What Goes Where?

### I need to add a NEW CALCULATION...
→ `src/core/engine/accounting.engine.ts` or `inventory.engine.ts`

### I need to add a NEW BUTTON...
→ `src/components/shared/Button.tsx` or `src/components/forms/*`

### I need to add a NEW SCREEN...
→ `src/screens/MyScreen.tsx`

### I need to add a NEW FEATURE...
→ `src/features/myFeature/`
   - Create `services/`
   - Create `hooks/`
   - Create `index.ts`

### I need to fix ACCOUNTING LOGIC...
→ `src/features/accounting/services/`

### I need to add a UTILITY...
→ `src/utils/my-utility.ts`

### I need to add a TYPE...
→ `src/core/types/accounting.types.ts` (or appropriate file)

### I need to add a TEST...
→ `__tests__/unit/` (unit) or `integration/` (workflow)

---

## 🚀 Common Tasks

### Task 1: Add a New Account Type

**Files to modify**:
1. `src/core/types/accounting.types.ts` - Add type definition
2. `src/features/accounting/services/accounting.service.ts` - Add create function
3. `src/screens/SettingsScreen.tsx` - Add UI for new type

**Example**:
```typescript
// 1. Define type
export enum AccountType {
  ASSET = 'ASSET',
  NEW_TYPE = 'NEW_TYPE'  // ADD
}

// 2. Create service
export function createAccount(data: AccountData) {
  // validate
  // save to database
}

// 3. Add UI
<button onClick={() => createAccountOfNewType()}>
  Create New Type
</button>
```

### Task 2: Add a New Financial Report

**Files to create/modify**:
1. `src/features/reports/services/report-generator.service.ts` - Add generator function
2. `src/components/reports/MyReportView.tsx` - Add display component
3. `src/screens/ReportsScreen.tsx` - Add to tab

**Example**:
```typescript
// 1. Generate report
export function generateMyReport(accounts, period) {
  // calculate from accounts
  return reportData;
}

// 2. Display report
const MyReportView = ({ data }) => <div>{/* render */}</div>;

// 3. Add to ReportsScreen
{reportTab === 'MY_REPORT' && <MyReportView data={myReport} />}
```

### Task 3: Add a New Setting

**Files to modify**:
1. `src/features/settings/services/settings.service.ts` - Add getter/setter
2. `src/screens/SettingsScreen.tsx` - Add UI
3. `src/core/types/ui.types.ts` - Add type if needed

**Example**:
```typescript
// 1. Settings service
export function getSetting(key: string) {
  return localStorage.getItem(`regal_${key}`);
}

// 2. SettingsScreen UI
<input 
  value={mySetting}
  onChange={(v) => saveSetting('my_setting', v)}
/>

// 3. Use in any screen
const mySetting = getSetting('my_setting');
```

---

## 🧠 Architecture Principles

### 1. **One Responsibility**
Each file has ONE job. Not two, not "mostly one" - exactly one.

❌ BAD:
```typescript
// This file does UI + calculation + database
function createAndDisplayAccount() {
  // validate
  alert('Success!');
  // calculate
  // save to db
  // update UI
}
```

✅ GOOD:
```typescript
// Service: only does calculation
function validateAccount(data) { /* validate */ }

// Hook: only manages state
function useAccounts() { /* state */ }

// Component: only displays
function AccountForm({ onSubmit }) { /* render */ }
```

### 2. **No Circular Dependencies**
Never import from parent folders.

❌ BAD:
```typescript
// In src/features/accounting/
import { something } from '../../services';  // ← going up
```

✅ GOOD:
```typescript
// Use relative paths DOWN or absolute paths
import { something } from '@services/accounting';
```

### 3. **Types First**
Define data structure before using it.

✅ GOOD:
```typescript
// Define
export interface Account {
  id: string;
  name: string;
}

// Use
const account: Account = { id: '1', name: 'Cash' };
```

### 4. **Stateless Services**
Services don't manage state. That's what hooks do.

❌ BAD:
```typescript
// Service with state
let cache = [];
export function getAccounts() {
  return cache;  // ← Wrong! Services shouldn't cache
}
```

✅ GOOD:
```typescript
// Service: pure function
export function getAccounts(db) {
  return db.query('accounts');
}

// Hook: manages state
export function useAccounts() {
  const [accounts, setAccounts] = useState([]);
  // cache here
}
```

### 5. **Import What You Need**
Don't import entire modules if you need one function.

❌ BAD:
```typescript
import * as accounting from '@features/accounting';  // ← lazy

accounting.validateJournal();
```

✅ GOOD:
```typescript
import { validateJournal } from '@features/accounting';  // ← explicit

validateJournal();
```

---

## 🧪 Testing Approach

### Unit Tests
Test individual functions in isolation.

```typescript
// __tests__/unit/accounting.test.ts
import { calculateBalance } from '@core/engine';

export const testBalance = () => {
  const accounts = [
    { id: '1', balance: 100 },
    { id: '2', balance: 50 }
  ];
  
  const total = calculateBalance(accounts);
  
  return {
    passed: total === 150,
    message: 'Balance calculation works'
  };
};
```

### Integration Tests
Test feature workflows.

```typescript
// __tests__/integration/sales-workflow.test.ts
export const testCompleteSale = () => {
  // 1. Create item
  // 2. Create sale
  // 3. Verify inventory updated
  // 4. Verify accounts updated
  // 5. Verify COGS calculated
};
```

### Manual Testing
Test UI interactions.

```bash
npm run dev
# Click through screens
# Verify: forms work, data saves, reports generate
```

---

## 🐛 Debugging Tips

### "Can't find module X"
```
Check:
1. Does file exist at path?
2. Does it have index.ts exporting X?
3. Is path alias correct in tsconfig.json?
```

### "Component not updating"
```
Check:
1. Is state in correct component?
2. Are dependencies correct in useEffect?
3. Is component reading from hook?
```

### "Data not saving"
```
Check:
1. Is database initialized?
2. Is user logged in?
3. Are permissions correct?
4. Check browser DevTools → Application → IndexedDB
```

### "Imports show red in VS Code"
```
Fix:
1. Reload VS Code: Cmd+Shift+P → Reload Window
2. Or restart language server: Cmd+Shift+P → TypeScript: Restart Server
3. Or check tsconfig.json paths
```

---

## 📚 Documentation Map

| Document | Purpose | Read When |
|----------|---------|-----------|
| ARCHITECTURE.md | Full architecture guide | Learning the structure |
| FEATURES.md | What each feature does | Understanding capabilities |
| IMPLEMENTATION_GUIDE.md | How to refactor the code | Setting up the project |
| QUICK_START.md | This file | Getting started |

---

## 🎯 Your First Task (Example)

**Task**: Add a new account field "VAT_ID"

### Step 1: Add Type
```typescript
// src/core/types/accounting.types.ts
export interface Account {
  id: string;
  name: string;
  vatId?: string;  // ← ADD THIS
}
```

### Step 2: Update Service
```typescript
// src/features/accounting/services/accounting.service.ts
export function createAccount(data: AccountData) {
  return {
    ...data,
    vatId: data.vatId || ''  // ← ADD
  };
}
```

### Step 3: Update Form
```typescript
// src/components/forms/AccountForm.tsx
<input
  name="vatId"
  placeholder="VAT ID"
  value={formData.vatId}
  onChange={(e) => setFormData({...formData, vatId: e.target.value})}
/>
```

### Step 4: Test
```bash
npm run build
npm run dev
# Create account with VAT_ID
# Verify it saves and displays
```

Done! 🎉

---

## ✅ Checklist for New Developers

- [ ] Read ARCHITECTURE.md
- [ ] Read FEATURES.md
- [ ] Understand folder structure
- [ ] Run `npm run dev` successfully
- [ ] Create a test account manually
- [ ] Create a test transaction manually
- [ ] Generate a test report
- [ ] Understand how data flows
- [ ] Ask questions in team chat
- [ ] Make your first code change

---

## 🚀 Quick Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview build locally

# Mobile
npm run mobile:build     # Build for mobile
npm run mobile:sync      # Sync with Capacitor
npm run mobile:android   # Open in Android Studio
npm run mobile:ios       # Open in Xcode

# Testing
npm test                 # Run tests
npx ts-node __tests__/runner.ts  # Run specific tests

# Other
npm run type-check       # Check TypeScript (if script exists)
npm run lint             # Lint code (if configured)
```

---

## 💡 Pro Tips

1. **Use aliases in imports**
   ```typescript
   // Instead of:
   import x from '../../../features/...'
   
   // Use:
   import x from '@features/...'
   ```

2. **Keep files small**
   - Screen: 500-1000 lines
   - Hook: 100-300 lines
   - Service: 200-500 lines
   - If larger, split into multiple files

3. **Test as you code**
   - Write service function
   - Test in dev tools
   - Add to hook
   - Test with component

4. **Name consistently**
   - Screens: `PascalCaseScreen.tsx`
   - Components: `PascalCase.tsx`
   - Hooks: `useHookName.ts`
   - Services: `service-name.service.ts`
   - Utilities: `utility-name.ts`

5. **Document complex logic**
   ```typescript
   /**
    * Calculates Weighted Average Cost for inventory.
    * 
    * Example:
    * - Initial: 0 units
    * - Buy 10 @ $100 = WAC $100
    * - Buy 20 @ $80 = WAC $86.67
    * - Sell 15 = COGS $1,300.05
    */
   export function calculateWAC(movements) {
     // implementation
   }
   ```

---

## 📞 Getting Help

1. **Question about structure?** → Read ARCHITECTURE.md
2. **Question about a feature?** → Read FEATURES.md
3. **Question about implementation?** → Read IMPLEMENTATION_GUIDE.md
4. **Question about code?** → Look for comments in code
5. **Still stuck?** → Ask team members

---

## 🎓 Learning Path

### Week 1: Understand the Architecture
- [ ] Read architecture docs
- [ ] Explore folder structure
- [ ] Understand dependency flow
- [ ] Learn feature concept

### Week 2: Work with Existing Code
- [ ] Make small bug fix
- [ ] Add small feature
- [ ] Write test
- [ ] Run build

### Week 3: Own a Feature
- [ ] Add new capability
- [ ] Write documentation
- [ ] Review code with team
- [ ] Deploy to production

---

**Welcome to Hisab-Pati! 🎉**

You now understand the project structure and are ready to contribute.

**Next Steps**:
1. Setup your local environment
2. Run `npm install && npm run dev`
3. Explore the app manually
4. Make your first code change
5. Create a pull request

Happy coding! 🚀
