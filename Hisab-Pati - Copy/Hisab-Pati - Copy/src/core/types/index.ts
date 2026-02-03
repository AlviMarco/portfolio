/**
 * CENTRALIZED TYPES MODULE
 * 
 * All application types consolidated in a single, organized location.
 * Prevents circular imports and provides single source of truth.
 */

// ============================================================================
// ACCOUNT TYPES
// ============================================================================

export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export enum AccountLevel {
  MAIN = 1,
  GROUP = 2,
  GL = 3
}

export interface Account {
  id: string;
  userId: string;
  companyId?: string;
  name: string;
  type: AccountType;
  level: AccountLevel;
  parentAccountId?: string;
  balance: number;
  openingBalance: number;
  code: string;
  isSystem?: boolean;
  isInventoryGL?: boolean;
  isCOGSGL?: boolean;
  isLocked?: boolean;
}

// ============================================================================
// COMPANY TYPES
// ============================================================================

export interface Company {
  id: string;
  userId: string;
  name: string;
  address: string;
  financialYear: {
    startDate: string;
    endDate: string;
  };
  isActive: boolean;
  createdAt: string;
  isDeleted: boolean;
  deletedAt: string | null;
}

// ============================================================================
// JOURNAL & TRANSACTION TYPES
// ============================================================================

export interface JournalEntry {
  accountId: string;
  debit: number;
  credit: number;
}

export type VoucherType = 'SALES' | 'PURCHASE' | 'RECEIPT' | 'PAYMENT' | 'JOURNAL';

export interface ItemLine {
  id?: string;
  subLedgerId: string;
  inventoryGLAccountId: string;
  itemName: string;
  quantity: number;
  rate: number;
}

export interface Transaction {
  id: string;
  userId: string;
  companyId?: string;
  voucherNo: string;
  date: string;
  description: string;
  entries: JournalEntry[];
  voucherType: VoucherType;
  reference?: string;
  itemLines?: ItemLine[];
}

// ============================================================================
// INVENTORY TYPES
// ============================================================================

export interface InventorySubLedger {
  id: string;
  userId: string;
  companyId?: string;
  inventoryGLAccountId: string;
  itemName: string;
  itemCode?: string;
  quantity: number;
  rate: number;
  valuationMethod?: 'FIFO' | 'WEIGHTED_AVERAGE' | 'MOVING_AVERAGE';
}

export interface InventoryMovement {
  id: string;
  userId: string;
  companyId?: string;
  subLedgerId: string;
  voucherId: string;
  movementType: 'IN' | 'OUT';
  quantity: number;
  rate: number;
  amount: number;
  date: string;
  reference?: string;
  cosAmount?: number;
}

export interface InventoryReport {
  subLedgerId: string;
  itemName: string;
  openingQuantity: number;
  openingValue: number;
  debitQuantity: number;
  debitAmount: number;
  creditQuantity: number;
  creditAmount: number;
  closingQuantity: number;
  closingValue: number;
}

// ============================================================================
// REPORTING TYPES
// ============================================================================

export interface FinancialSummary {
  cashBalance: number;
  receivables: number;
  payables: number;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  netIncome: number;
}

export interface AccountWithTotals extends Account {
  periodDebit: number;
  periodCredit: number;
}

// ============================================================================
// USER & AUTHENTICATION TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  photoUrl?: string;
  companyId?: string;
}

// ============================================================================
// BACKUP & RESTORE TYPES
// ============================================================================

export interface BackupData {
  version: string;
  timestamp: string;
  companyName: string;
  companyAddress: string;
  accounts: Account[];
  transactions: Transaction[];
  inventorySubLedgers: InventorySubLedger[];
  inventoryMovements: InventoryMovement[];
}

export interface DriveBackupFile {
  id: string;
  name: string;
  createdTime: string;
  companyName: string;
}

// ============================================================================
// SETTINGS & CONFIGURATION TYPES
// ============================================================================

export interface CompanySettings {
  name: string;
  address: string;
}

export interface BackupSettings {
  autoBackupEnabled: boolean;
  backupFrequency: 'Daily' | 'Weekly' | 'Monthly';
  lastBackupTime: string | null;
}

export interface AppSettings {
  darkMode: boolean;
  privateMode: boolean;
  company: CompanySettings;
  backup: BackupSettings;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export type ViewType = 
  | 'AUTH'
  | 'ONBOARDING'
  | 'DASHBOARD'
  | 'TRANSACTIONS'
  | 'CHART'
  | 'LEDGER'
  | 'REPORTS'
  | 'INVENTORY'
  | 'ADD_TRANSACTION'
  | 'SETTINGS'
  | 'BACKUP_RESTORE'
  | 'SUPPORT'
  | 'DEVELOPER_INFO'
  | 'DATE_CONFIG';

export interface ReportRange {
  start: string;
  end: string;
}

export type ReportTab = 'PL' | 'BS' | 'TB' | 'CF';

// ============================================================================
// FORM STATE TYPES
// ============================================================================

export interface NewTransactionForm {
  date: string;
  description: string;
  voucherType: VoucherType;
  voucherNo: string;
  debitAccount: string;
  creditAccount: string;
  amount: string;
}

export interface NewSubLedgerForm {
  itemName: string;
  itemCode: string;
  quantity: string;
  rate: string;
}

export interface VoucherItem {
  subLedgerId: string;
  quantity: string;
  rate: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface BackupHistoryEntry {
  timestamp: string;
  fileName: string;
  status: 'success' | 'failed';
}

export interface DashboardStat {
  label: string;
  amount: number;
  trend: 'up' | 'down';
  percentage: number;
}

export interface CashFlowData {
  openingCash: number;
  inflows: number;
  outflows: number;
  closingCash: number;
}
