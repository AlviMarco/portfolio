# 🔧 IMPLEMENTATION GUIDE: Moving to New Structure

**Status**: Ready for Implementation  
**Time Estimate**: 4-6 hours  
**Difficulty**: Medium (mostly file moves + import updates)

---

## ⚠️ CRITICAL: Do This BEFORE Moving Files

### 1. Create a Git Branch
```bash
git checkout -b refactor/project-restructure
```

### 2. Backup Current Code
```bash
# Create a backup branch
git branch backup/original-structure
```

### 3. Test Current Build
```bash
npm run build
npm run mobile:build  # If applicable
```

Ensure everything works BEFORE making changes.

---

## 📋 Phase 1: Create Directory Structure

### Status: ✅ ALREADY DONE

The new folder structure has been created:
```
✅ src/core/engine/
✅ src/core/database/
✅ src/core/types/
✅ src/features/accounting/services
✅ src/features/accounting/hooks
✅ src/features/inventory/services
✅ src/features/inventory/hooks
✅ src/features/reports/services
✅ src/features/reports/hooks
✅ src/features/backup/services
✅ src/features/settings/services
✅ src/features/company/services
✅ src/features/ai/services
✅ src/screens/
✅ src/components/shared
✅ src/components/forms
✅ src/components/reports
✅ src/hooks/
✅ src/utils/
✅ src/config/
✅ src/assets/
✅ src/styles/
✅ __tests__/unit
✅ __tests__/integration
✅ __tests__/e2e
✅ docs/
✅ public/
```

---

## 📁 Phase 2: Move Core Files

### Step 1: Move to `src/core/types/`

**From**: `src/types/index.ts` + `types.ts` (root)  
**To**: `src/core/types/index.ts`  
**Action**: MERGE into one file

```bash
# Merge both type files:
# 1. Open src/types/index.ts
# 2. Open types.ts (root)
# 3. Copy all exports into src/core/types/index.ts
# 4. Remove duplicates
# 5. Keep organized with comments
```

**New File Structure**:
```typescript
// src/core/types/index.ts

// ============================================================================
// COMPANY ENTITY
// ============================================================================
export interface Company { ... }
export type PlanType = 'BASIC' | 'MODERATE';

// ============================================================================
// ACCOUNTING TYPES
// ============================================================================
export enum AccountType { ... }
export enum AccountLevel { ... }
export interface Account { ... }
export interface JournalEntry { ... }
export interface Transaction { ... }

// ============================================================================
// INVENTORY TYPES
// ============================================================================
export interface InventorySubLedger { ... }
export interface InventoryMovement { ... }

// ... rest of types
```

### Step 2: Move to `src/core/database/`

**From**: `db.ts` (root)  
**To**: `src/core/database/db.ts`

```bash
# 1. Copy db.ts to src/core/database/db.ts
# 2. Update imports at top:

# OLD:
import { Account, Transaction, ... } from './types';

# NEW:
import { Account, Transaction, ... } from '../types';
```

**Create** `src/core/database/index.ts`:
```typescript
// src/core/database/index.ts
export * from './db';
```

### Step 3: Move to `src/core/engine/`

**From**: 
- `engine.ts` (root)
- `inventoryEngine.ts` (root)

**To**:
- `src/core/engine/accounting.engine.ts`
- `src/core/engine/inventory.engine.ts`

```bash
# 1. Copy engine.ts → src/core/engine/accounting.engine.ts
# 2. Copy inventoryEngine.ts → src/core/engine/inventory.engine.ts
# 3. Update imports:

# OLD:
import { Account, Transaction, ... } from './types';
import { initDB, ... } from './db';

# NEW:
import { Account, Transaction, ... } from '../types';
import { initDB, ... } from '../database';
```

**Create** `src/core/engine/index.ts`:
```typescript
// src/core/engine/index.ts
export * from './accounting.engine';
export * from './inventory.engine';
```

---

## 🎯 Phase 3: Move Services to Features

### Accounting Services

**From**: `src/services/accounting.service.ts`, `src/services/accountSorting.service.ts`  
**To**: `src/features/accounting/services/`

```bash
# Copy files:
cp src/services/accounting.service.ts src/features/accounting/services/
cp src/services/accountSorting.service.ts src/features/accounting/services/account-sorting.service.ts
```

**Update imports in both files**:
```typescript
# OLD:
import { Account, Transaction, ... } from '../types';
import { calculateBalances, ... } from '../engine';

# NEW:
import { Account, Transaction, ... } from '@core/types';
import { calculateBalances, ... } from '@core/engine';
```

**Create index file**:
```typescript
// src/features/accounting/services/index.ts
export * from './accounting.service';
export * from './account-sorting.service';
```

**Create feature index**:
```typescript
// src/features/accounting/index.ts
export * from './services';
// export * from './hooks'; (later)
```

### Inventory Services

**From**: `src/services/inventory.service.ts`, `src/services/itemTable.service.ts`  
**To**: `src/features/inventory/services/`

```bash
cp src/services/inventory.service.ts src/features/inventory/services/
cp src/services/itemTable.service.ts src/features/inventory/services/
```

**Update imports**:
```typescript
import { InventorySubLedger, InventoryMovement, ... } from '@core/types';
import { createInventoryMovement, ... } from '@core/engine';
```

**Create files**:
```typescript
// src/features/inventory/services/index.ts
export * from './inventory.service';
export * from './item-table.service';

// src/features/inventory/index.ts
export * from './services';
```

### Other Services

Follow same pattern for:

**Reports**:
- Move report generation logic from App.tsx → `src/features/reports/services/report-generator.service.ts`

**Backup**:
- `services/backup.service.ts` → `src/features/backup/services/`
- `services/googleDrive.service.ts` → `src/features/backup/services/`

**Settings**:
- `src/services/settings.service.ts` → `src/features/settings/services/`

**Company**:
- Move company-related functions from `db.ts` → `src/features/company/services/company.service.ts`

**AI**:
- `services/gemini.ts` → `src/features/ai/services/gemini.service.ts`

---

## 🪝 Phase 4: Create Feature Hooks

Create custom hooks for each feature (handles state management):

### Example: `src/features/accounting/hooks/useAccounts.ts`

```typescript
// src/features/accounting/hooks/useAccounts.ts
import { useState, useEffect } from 'react';
import { useDatabase } from '@hooks/useDatabase';
import { 
  getAccounts, 
  createAccount, 
  updateAccount, 
  deleteAccount 
} from '../services/accounting.service';

export const useAccounts = () => {
  const { db, user } = useDatabase();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load accounts on mount
  useEffect(() => {
    const loadAccounts = async () => {
      if (!db || !user) return;
      setLoading(true);
      try {
        const data = await getAccounts(user.id, db);
        setAccounts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    
    loadAccounts();
  }, [db, user]);

  const addAccount = async (accountData) => {
    // add logic
  };

  const updateAccountData = async (id, data) => {
    // update logic
  };

  const deleteAccountData = async (id) => {
    // delete logic
  };

  return {
    accounts,
    addAccount,
    updateAccountData,
    deleteAccountData,
    loading,
    error
  };
};
```

**Create index file**:
```typescript
// src/features/accounting/hooks/index.ts
export * from './useAccounts';
export * from './useTransactions';  // TODO: create this
```

---

## 🖼️ Phase 5: Create Screens

Extract rendering logic from App.tsx into separate screen files.

### Example: `src/screens/DashboardScreen.tsx`

```typescript
// src/screens/DashboardScreen.tsx
import React from 'react';
import { useAccounts } from '@features/accounting';
import { useInventory } from '@features/inventory';

interface DashboardScreenProps {
  onNavigate: (screen: string) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigate }) => {
  const { accounts } = useAccounts();
  const { items } = useInventory();
  
  // Dashboard rendering logic from App.tsx
  
  return (
    <div className="dashboard">
      {/* Dashboard UI */}
    </div>
  );
};
```

Do this for:
- DashboardScreen
- TransactionsScreen
- LedgerScreen
- InventoryScreen
- ReportsScreen
- BackupScreen
- SettingsScreen
- SupportScreen

**Create index**:
```typescript
// src/screens/index.ts
export * from './DashboardScreen';
export * from './TransactionsScreen';
// ... etc
```

---

## 🔧 Phase 6: Update App.tsx

Simplify App.tsx by moving logic to hooks and screens:

```typescript
// BEFORE: App.tsx with 4500+ lines of mixed concerns
const App = () => {
  // Accounts state
  const [accounts, setAccounts] = useState<Account[]>([]);
  // Transactions state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  // ... 50+ more state variables
  // ... 100+ handler functions
  // ... complex JSX with all screens
};

// AFTER: App.tsx with clean orchestration
import { DashboardScreen, TransactionsScreen, ... } from '@screens';

const App = () => {
  const { db, user } = useDatabase();
  const { company, switchCompany } = useCompany();
  const [activeView, setActiveView] = useState<ViewType>('DASHBOARD');
  
  if (isInitializing) return <LoadingScreen />;
  
  return (
    <div>
      <Header company={company} onSwitchCompany={switchCompany} />
      
      {activeView === 'DASHBOARD' && (
        <DashboardScreen onNavigate={(v) => setActiveView(v)} />
      )}
      {activeView === 'TRANSACTIONS' && (
        <TransactionsScreen onNavigate={(v) => setActiveView(v)} />
      )}
      {/* ... other screens */}
      
      <Navigation 
        active={activeView} 
        onChange={(v) => setActiveView(v)} 
      />
    </div>
  );
};
```

---

## 📝 Phase 7: Update Imports

Use find-replace to update imports across codebase:

### Setup TypeScript Aliases (Optional but Recommended)

In `tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@core/*": ["src/core/*"],
      "@features/*": ["src/features/*"],
      "@screens/*": ["src/screens/*"],
      "@components/*": ["src/components/*"],
      "@hooks/*": ["src/hooks/*"],
      "@utils/*": ["src/utils/*"],
      "@config/*": ["src/config/*"],
      "@assets/*": ["src/assets/*"],
      "@styles/*": ["src/styles/*"]
    }
  }
}
```

### Import Replacements

```bash
# Replace in all .tsx/.ts files:

# Types
OLD: import { Account, ... } from './types';
NEW: import { Account, ... } from '@core/types';

# Database
OLD: import { initDB, ... } from './db';
NEW: import { initDB, ... } from '@core/database';

# Engine
OLD: import { calculateBalance, ... } from './engine';
NEW: import { calculateBalance, ... } from '@core/engine';

# Services
OLD: import { getAccounts } from './services/accounting.service';
NEW: import { getAccounts } from '@features/accounting';

# Screens
OLD: import App from './App';
NEW: import { DashboardScreen } from '@screens';
```

---

## 🧪 Phase 8: Test

### 1. Check Build
```bash
npm run build
```

### 2. Check for Broken Imports
```bash
# TypeScript will show errors
npm run type-check  # if script exists
```

### 3. Test Core Functionality
```bash
# Start dev server
npm run dev
# Test each screen manually
```

### 4. Run Tests
```bash
npm test
# or
npx ts-node __tests__/runner.ts
```

### 5. Mobile Build
```bash
npm run mobile:build
npm run mobile:sync
```

---

## 🧹 Phase 9: Cleanup

### Delete Old Files (After Confirming Everything Works)

```bash
# Remove old root-level files
rm types.ts
rm engine.ts
rm inventoryEngine.ts
rm db.ts

# Remove old service folder (since services moved to features)
rm -rf src/services/

# Remove old hooks folder (if empty)
rm -rf src/hooks/

# Remove old types folder (since moved to core)
rm -rf src/types/

# Remove old utils folder (consolidate if needed)
# rm -rf src/utils/  (optional)

# Clean up test files (after moving)
# Keep only __tests__/runner.ts and execute-all-tests.ts
```

### Verify No Broken Imports

```bash
# Rebuild to catch any remaining import errors
npm run build

# Should show: "build completed successfully"
```

---

## ✅ Phase 10: Final Verification Checklist

- [ ] All directories created
- [ ] All files moved to correct locations
- [ ] All imports updated
- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors
- [ ] Dev server runs: `npm run dev`
- [ ] All screens render
- [ ] Mobile build succeeds: `npm run mobile:build`
- [ ] Tests pass: `npm test`
- [ ] Old files deleted
- [ ] Git diff shows only moves, no functionality changes
- [ ] Documentation updated
- [ ] Team members informed

---

## 🔄 Rollback Plan

If something breaks:

```bash
# Go back to backup branch
git checkout backup/original-structure

# Or reset this branch
git reset --hard HEAD~N  # where N = number of commits to undo
```

---

## 📊 Expected Changes

### Files Moved: ~30+
- 1 types file → core/types
- 1 database file → core/database
- 2 engine files → core/engine
- 9 service files → features/*/services
- Test files → __tests__/unit, integration, e2e

### Import Changes: ~200+
- Services imports
- Database imports
- Type imports
- Engine imports

### New Files: ~15+
- Feature index files
- Screen files
- Feature hook files
- Documentation files

### Deleted Files: ~5-8
- Old root-level files (types.ts, db.ts, engine.ts, etc.)
- Old folder structure

---

## ⏱️ Time Breakdown

| Phase | Time | Notes |
|-------|------|-------|
| Phase 1: Directories | Done | ✅ Already created |
| Phase 2: Core files | 30 min | Move & update imports |
| Phase 3: Services | 1 hour | Move to features |
| Phase 4: Hooks | 1 hour | Create feature hooks |
| Phase 5: Screens | 1.5 hours | Extract from App.tsx |
| Phase 6: App.tsx | 45 min | Simplify orchestrator |
| Phase 7: Imports | 1 hour | Find-replace updates |
| Phase 8: Testing | 45 min | Verify everything |
| Phase 9: Cleanup | 30 min | Delete old files |
| Phase 10: Verification | 30 min | Final checklist |
| **TOTAL** | **~7 hours** | Conservative estimate |

---

## 🚀 After Refactoring

Once complete, you'll have:

✅ **Professional structure** - Industry-standard architecture  
✅ **Easy onboarding** - New developers understand code quickly  
✅ **Scalability** - Add features without breaking existing code  
✅ **Maintainability** - Clear separation of concerns  
✅ **Testability** - Each module can be tested independently  
✅ **Performance** - Ready for code splitting & optimization  
✅ **Documentation** - Well-documented codebase  

---

## 📞 Troubleshooting

### Issue: "Cannot find module '@features/accounting'"
**Solution**: 
1. Check `tsconfig.json` has path aliases
2. Verify file exists at `src/features/accounting/index.ts`
3. Check `index.ts` exports the functions

### Issue: "Module not found: '../../../types'"
**Solution**:
1. Long relative paths = wrong location
2. Use alias: `@core/types` instead
3. Verify path is correct

### Issue: Build succeeds but imports show red in VS Code
**Solution**:
1. TypeScript language server cache
2. Reload VS Code window: Cmd+Shift+P → "Developer: Reload Window"
3. Restart language server: Cmd+Shift+P → "TypeScript: Restart TS Server"

### Issue: Tests fail after moving
**Solution**:
1. Update test imports to use new paths
2. Update any hardcoded paths in tests
3. Verify mocks still work

---

## 🎉 Success!

Once all phases complete, commit to git:

```bash
git add .
git commit -m "refactor: restructure project to clean architecture

- Move types to src/core/types
- Move database to src/core/database
- Move engines to src/core/engine
- Organize services into feature modules
- Extract screens from App.tsx
- Create feature hooks for state management
- Add comprehensive documentation
- Update all import paths

Closes #refactoring"
```

Then merge to main:
```bash
git checkout main
git merge refactor/project-restructure
git push origin main
```

---

**Happy refactoring!** 🎊
