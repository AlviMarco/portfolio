import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  onAuthStateChanged,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from './src/config/firebase';
import { Login } from './src/components/auth/Login';
import { APP_CONFIG } from '../../shared/constants';
import {
  LayoutDashboard,
  ClipboardList,
  ListTree,
  BarChart3,
  Settings,
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  Sparkles,
  Loader2,
  CheckCircle2,
  Search,
  ChevronRight,
  ShoppingCart,
  ShoppingBag,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  Hash,
  BookText,
  ChevronLeft,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  Download,
  RefreshCw,
  Database,
  Moon,
  Sun,
  Mail,
  Phone,
  Globe,
  User as UserIcon,
  Building2,
  ExternalLink,
  HandCoins,
  Receipt,
  FolderOpen,
  ChevronDown,
  Fingerprint,
  FileSpreadsheet,
  FileJson,
  History,
  Calendar,
  Layers,
  Printer,
  Library,
  Eye,
  EyeOff,
  Upload,
  Filter,
  Coins,
  ArrowRight,
  Lock,
  CalendarDays,
  LockKeyhole,
  UnlockKeyhole,
  Save,
  TriangleAlert,
  MapPin,
  Clock,
  ChevronLeft as ChevronLeftIcon,
  CloudUpload,
  History as HistoryIcon,
  CloudDownload,
  LifeBuoy,
  MessageSquare,
  Info,
  Copy,
  Check,
  Package,
  WifiOff
} from 'lucide-react';
import { App as CapacitorApp } from '@capacitor/app';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { FileOpener } from '@awesome-cordova-plugins/file-opener';
import {
  Transaction,
  ViewType,
  AccountType,
  AccountLevel,
  JournalEntry,
  VoucherType,
  User,
  DriveBackupFile,
  InventorySubLedger,
  InventoryMovement,
  Account,
  Company
} from './src/core/types';
import {
  initDB,
  getAllForUser,
  saveData,
  deleteData,
  seedDefaultAccounts,
  getAllForCompany,
  createCompany,
  getCompaniesForUser,
  getActiveCompanyForUser,
  switchActiveCompany,
  getCompanyById
} from './src/core/database/db';
import {
  calculateBalances,
  getFinancialSummary,
  getDisplayBalance,
  validateJournal,
  getNextVoucherNo,
  sortTransactionsByVoucherNo,
  getIncomeStatementData,
  getBalanceSheetData,
  AccountWithTotals
} from './src/core/engine/accounting.engine';
import { getFinancialAdvice } from './src/features/ai/services/gemini';
import { GoogleDriveService } from './src/features/backup/services/googleDrive';
import { saveCompanySettings, getPlanType, setPlanType, isInventoryEnabled, getPlanTypeLabel, getActiveCompanyId, setActiveCompanyId, clearActiveCompanyId } from './src/features/settings/services/settings.service';
import { getInventoryGLAccounts, getSubLedgersForGL, calculateSubLedgerBalance, generateSubLedgerId, validateSubLedger, createInventoryMovement, getReceivableGLAccounts, getPayableGLAccounts, createSalesVoucher, createPurchaseVoucher, generateInventoryReport, calculateTotalInventoryValue, getSubLedgerAuditTrail, validateNegativeInventory, isInventoryGLLocked, validateSufficientInventory, validateBackupRestoreIntegrity, calculateRunningBalance, getMovementsForTransaction, validateSalesVoucherInventory, validateInventoryGLSync, validateSalesVoucherCOGS } from './src/core/engine/inventory.engine';
import { generateNextGLAccountCode } from './src/utils';
import { sortAccountsAlphabetically, getSortedGLAccounts, getSortedAccountsByType, getSortedChildAccounts, getSortedGLAccountsExcluding, getSortedGLAccountsBySearch, getSortedAccountsGroupedByParent, getSortedInventoryGLAccounts } from './src/features/accounting/services/accountSorting.service';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { VoucherPrintService, VoucherPrintConfig } from './src/features/reports/services/voucherPrint.service';
import { handlePDFDownload, PDFSaveResult } from './src/utils/pdfHandler';
import { isOnline, onNetworkChange, initializeNetworkMonitoring, getNetworkStatus } from './src/utils/networkService';

// --- Helpers ---
const formatDateLong = (dateStr: string) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

const getVoucherColor = (type: VoucherType) => {
  switch (type) {
    case 'SALES': return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800';
    case 'PURCHASE': return 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800';
    case 'RECEIPT': return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800';
    case 'PAYMENT': return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800';
    default: return 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-800 dark:border-slate-700';
  }
};

const getVoucherIcon = (type: VoucherType) => {
  switch (type) {
    case 'SALES': return <TrendingUp size={20} />;
    case 'PURCHASE': return <ShoppingCart size={20} />;
    case 'RECEIPT': return <ArrowDownLeft size={20} />;
    case 'PAYMENT': return <ArrowUpRight size={20} />;
    case 'JOURNAL': return <FileText size={20} />;
    default: return <FileText size={20} />;
  }
};

// --- Components ---

const RegalLogoIcon = ({ size = 34 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
    <rect x="22" y="55" width="12" height="25" rx="2" fill="#3B82F6" />
    <rect x="44" y="40" width="12" height="40" rx="2" fill="#3B82F6" />
    <rect x="66" y="25" width="12" height="55" rx="2" fill="#3B82F6" />
    <path d="M15 70L85 25M85 25H68M85 25V42" stroke="#60A5FA" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const StatCard: React.FC<{ title: string; amount: number; icon: React.ReactNode; colorClass: string; isPrivate: boolean }> = ({
  title, amount, icon, colorClass, isPrivate
}) => (
  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors text-left">
    <div className="flex justify-between items-start mb-2">
      <div className={`p-2 rounded-xl ${colorClass}`}>
        {icon}
      </div>
      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{title}</span>
    </div>
    <div className="text-xl font-black text-slate-800 dark:text-white transition-colors">
      {isPrivate ? '৳ ••••' : `৳${(amount ?? 0).toLocaleString()}`}
    </div>
  </div>
);

const ViewWrapper: React.FC<{ title: string; children: React.ReactNode; fabOffset?: boolean }> = ({ title, children, fabOffset = true }) => (
  <div className={`p-4 ${fabOffset ? 'pb-24' : 'pb-6'} max-w-lg mx-auto`}>
    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 transition-colors tracking-tight text-left">{title}</h2>
    {children}
  </div>
);

const NavButton: React.FC<{ active: boolean; icon: React.ReactNode; label: string; onClick: () => void }> = ({
  active, icon, label, onClick
}) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1.5 transition-all relative ${active ? 'text-blue-600 dark:text-blue-400 scale-110' : 'text-slate-300 dark:text-slate-600'}`}
  >
    {icon}
    <span className={`text-[8px] font-black uppercase tracking-[1.5px] ${active ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>{label}</span>
    {active && <div className="absolute -top-1 w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full"></div>}
  </button>
);

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const onCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={onCopy} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors">
      {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="text-slate-400" />}
    </button>
  );
};

const ActivityChart: React.FC<{ stats: { label: string; income: number; expense: number }[]; isPrivate: boolean }> = ({ stats, isPrivate }) => {
  const maxVal = Math.max(...stats.map(s => Math.max(s.income, s.expense)), 100);

  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-widest flex items-center gap-2">
          <BarChart3 size={16} className="text-blue-500" /> Activity (7d)
        </h3>
        <div className="flex gap-3 text-[9px] font-black uppercase tracking-tighter">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-slate-400">Income</span></div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div><span className="text-slate-400">Expense</span></div>
        </div>
      </div>

      <div className="flex items-end justify-between h-40 gap-1.5 px-1">
        {stats.map((day, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full">
            <div className="flex-1 w-full flex items-end justify-center gap-0.5 relative group">
              {/* Income Bar */}
              <div
                style={{ height: `${(day.income / maxVal) * 100}%` }}
                className="w-full max-w-[8px] bg-emerald-500/80 rounded-t-sm transition-all duration-500 hover:bg-emerald-500"
              >
                {!isPrivate && day.income > 0 && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    ৳{day.income.toLocaleString()}
                  </div>
                )}
              </div>
              {/* Expense Bar */}
              <div
                style={{ height: `${(day.expense / maxVal) * 100}%` }}
                className="w-full max-w-[8px] bg-rose-500/80 rounded-t-sm transition-all duration-500 hover:bg-rose-500"
              >
                {!isPrivate && day.expense > 0 && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    ৳{day.expense.toLocaleString()}
                  </div>
                )}
              </div>
            </div>
            <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 rotate-45 mt-1">{day.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  console.log('✅ App component initializing...');

  const [user, setUser] = useState<User | null>(null);

  // ✅ MULTI-COMPANY STATE
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const [showCompanySwitcher, setShowCompanySwitcher] = useState(false);
  const [newCompanyForm, setNewCompanyForm] = useState({
    name: '',
    address: '',
    financialYearStart: `${new Date().getFullYear()}-01-01`,
    financialYearEnd: `${new Date().getFullYear()}-12-31`
  });

  const [planType, setPlanTypeState] = useState<'BASIC' | 'MODERATE'>(() => getPlanType());
  const [activeView, setActiveView] = useState<ViewType>('DASHBOARD');
  const [viewHistory, setViewHistory] = useState<ViewType[]>([]);
  const [reportTab, setReportTab] = useState<'PL' | 'BS' | 'TB' | 'CF' | 'INVENTORY'>('PL');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Network State
  const [networkOnline, setNetworkOnline] = useState<boolean>(() => isOnline());

  // Inventory State
  const [inventorySubLedgers, setInventorySubLedgers] = useState<InventorySubLedger[]>([]);
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>([]);
  const [selectedInventoryGL, setSelectedInventoryGL] = useState<string | null>(null);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [editingSubLedger, setEditingSubLedger] = useState<Partial<InventorySubLedger> | null>(null);
  const [newSubLedgerData, setNewSubLedgerData] = useState({
    itemName: '',
    itemCode: '',
    quantity: '',
    rate: ''
  });

  // Backup state
  const [driveToken, setDriveToken] = useState<string | null>(null);
  const [backupFiles, setBackupFiles] = useState<DriveBackupFile[]>([]);
  const [isBackupLoading, setIsBackupLoading] = useState(false);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(() => localStorage.getItem('regal_auto_backup') === 'true');
  const [backupFrequency, setBackupFrequency] = useState(() => localStorage.getItem('regal_backup_freq') || 'Daily');
  const [backupHistory, setBackupHistory] = useState<Array<{ timestamp: string; fileName: string; status: 'success' | 'failed' }>>(() => {
    const stored = localStorage.getItem('regal_backup_history');
    return stored ? JSON.parse(stored) : [];
  });
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(() => localStorage.getItem('regal_last_backup_time_formatted') || null);
  const [isManualBackupLoading, setIsManualBackupLoading] = useState(false);
  const [showBackupHistory, setShowBackupHistory] = useState(false);

  // Support State
  const [supportCategory, setSupportCategory] = useState('General Inquiry');
  const [supportMessage, setSupportMessage] = useState('');
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);

  const [reportRange, setReportRange] = useState({
    start: localStorage.getItem('regal_report_start') || `${new Date().getFullYear()}-01-01`,
    end: localStorage.getItem('regal_report_end') || `${new Date().getFullYear()}-12-31`
  });

  const [db, setDb] = useState<IDBDatabase | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLedgerAccountId, setSelectedLedgerAccountId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [historyFilter, setHistoryFilter] = useState<VoucherType | 'ALL'>('ALL');
  const [isPrivateMode, setIsPrivateMode] = useState(false);

  const [companyAddress, setCompanyAddress] = useState(() => localStorage.getItem('regal_company_address') || 'Dhaka, Bangladesh');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('regal_dark_mode') === 'true');

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Partial<Account> | null>(null);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);

  // Delete all data state
  const [deleteConfirmStep, setDeleteConfirmStep] = useState<0 | 1 | 2 | 3>(0); // 0=closed, 1=warning, 2=checkbox, 3=code-entry
  const [deleteCheckboxConfirmed, setDeleteCheckboxConfirmed] = useState(false);
  const [deleteVerificationCode, setDeleteVerificationCode] = useState<string>('');
  const [deleteInputCode, setDeleteInputCode] = useState<string>('');

  // Auto-save company settings to localStorage whenever they change
  useEffect(() => {
    if (companyName.trim() && companyAddress.trim()) {
      saveCompanySettings({ name: companyName, address: companyAddress });
    }
  }, [companyName, companyAddress]);

  const [newTx, setNewTx] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    voucherType: 'JOURNAL' as VoucherType,
    voucherNo: '',
    debitAccount: '',
    creditAccount: '',
    amount: ''
  });

  // Inventory Voucher Items (for SALES/PURCHASE)
  const [voucherItems, setVoucherItems] = useState<Array<{
    id: string;
    subLedgerId: string;
    inventoryGLAccountId: string;
    itemName: string;
    quantity: number;
    rate: number;
  }>>([]);

  // ✅ CRITICAL: Load existing voucher data when editing (for ALL voucher types)
  useEffect(() => {
    if (!editingTransactionId) {
      // Reset when creating new
      setVoucherItems([]);
      setNewTx({
        date: new Date().toISOString().split('T')[0],
        description: '',
        voucherType: 'JOURNAL' as VoucherType,
        voucherNo: '',
        debitAccount: '',
        creditAccount: '',
        amount: ''
      });
      return;
    }

    // Load transaction for editing - MUST load ALL voucher types
    const txToEdit = transactions.find(t => t.id === editingTransactionId);
    if (!txToEdit) return;

    console.log(`📝 EDIT MODE: Loading voucher ${txToEdit.voucherNo} (${txToEdit.voucherType})`);

    // Load existing inventory movements for SALES/PURCHASE
    if (txToEdit.voucherType === 'SALES' || txToEdit.voucherType === 'PURCHASE') {
      const relatedMovements = getMovementsForTransaction(editingTransactionId, inventoryMovements);

      // Reconstruct voucherItems from movements
      const reconstructedItems = relatedMovements.map(m => {
        const subLedger = inventorySubLedgers.find(sl => sl.id === m.subLedgerId);
        return {
          id: m.id,
          subLedgerId: m.subLedgerId,
          inventoryGLAccountId: subLedger?.inventoryGLAccountId || '',
          itemName: subLedger?.name || 'Unknown Item',
          quantity: m.quantity,
          rate: m.rate
        };
      });

      setVoucherItems(reconstructedItems);
    } else {
      // Clear items for non-inventory vouchers
      setVoucherItems([]);
    }

    // Load transaction details for ALL voucher types
    // ⚠️ CRITICAL: Use the ORIGINAL voucher number (don't regenerate!)
    setNewTx({
      date: txToEdit.date,
      description: txToEdit.description,
      voucherType: txToEdit.voucherType,
      voucherNo: txToEdit.voucherNo,
      debitAccount: txToEdit.entries[0]?.accountId || '',
      creditAccount: txToEdit.entries[1]?.accountId || '',
      amount: String(txToEdit.entries[0]?.debit || txToEdit.entries[0]?.credit || '')
    });

    console.log(`✅ Form loaded with original voucher number: ${txToEdit.voucherNo}`);
  }, [editingTransactionId, transactions, inventoryMovements, inventorySubLedgers]);

  // Generic File Download Helper - Works for both web and mobile
  const downloadFile = async (content: string, filename: string, mimeType: string = 'text/plain') => {
    try {
      // Check if running on mobile
      if ((window as any).Capacitor?.isNativePlatform?.()) {
        try {
          // On mobile: Save to Documents folder
          await Filesystem.writeFile({
            path: filename,
            data: content,
            directory: Directory.Documents,
            recursive: true
          });
          alert(`✅ File saved to Documents: ${filename}`);
        } catch (error) {
          console.error('Mobile save failed:', error);
          // Fallback to web download
          const dataUrl = `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`;
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = filename;
          link.click();
        }
      } else {
        // On web: Use traditional download
        const dataUrl = `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`;
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        link.click();
      }
    } catch (error) {
      console.error('File download error:', error);
      alert('❌ Failed to save file. Please try again.');
    }
  };

  // PDF Download Helper - Uses new Scoped Storage compliant handler
  const downloadPDF = async (doc: any, filename: string) => {
    const result = await handlePDFDownload(doc, filename);

    // Show user-friendly message based on result
    if (result.success) {
      if (result.opened) {
        alert(result.message);
      } else {
        alert(`${result.message}\n\nFile: ${filename}\n\nOpen it from your Files app.`);
      }
    } else {
      alert(`❌ ${result.message}`);
    }
  };

  /**
   * Print Voucher Handler
   * Generates professional ERP-format PDF for any voucher type
   */
  const handlePrintVoucher = async (transactionId: string) => {
    try {
      const voucher = transactions.find(t => t.id === transactionId);
      if (!voucher) {
        alert('❌ Voucher not found');
        return;
      }

      // DEBUG: Check if itemLines are present
      console.log('🔍 DEBUG: Voucher being printed:', {
        id: voucher.id,
        voucherType: voucher.voucherType,
        hasItemLines: !!voucher.itemLines,
        itemLinesCount: voucher.itemLines?.length || 0,
        itemLines: voucher.itemLines
      });

      // Create print config
      const printConfig: VoucherPrintConfig = {
        companyName: companyName || 'Organization',
        companyAddress: companyAddress || 'Dhaka, Bangladesh',
        companyContact: localStorage.getItem('regal_company_contact') || undefined
      };

      // Generate PDF
      const doc = VoucherPrintService.generateVoucherPDF({
        voucher,
        accounts: accounts,
        config: printConfig
      });

      // Download/save PDF
      const filename = `${voucher.voucherType}_${voucher.voucherNo}_${new Date().toISOString().split('T')[0]}.pdf`;
      await downloadPDF(doc, filename);

      alert(`✅ ${voucher.voucherType} voucher printed successfully!`);
    } catch (error) {
      console.error('Print error:', error);
      alert(`❌ Failed to print voucher: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  /**
   * Preview Voucher PDF (for modal preview)
   * Returns data URL for preview in iframe
   */
  const getVoucherPreviewURL = (transactionId: string): string | null => {
    try {
      const voucher = transactions.find(t => t.id === transactionId);
      if (!voucher) return null;

      const printConfig: VoucherPrintConfig = {
        companyName: companyName || 'Organization',
        companyAddress: companyAddress || 'Dhaka, Bangladesh',
        companyContact: localStorage.getItem('regal_company_contact') || undefined
      };

      const doc = VoucherPrintService.generateVoucherPDF({
        voucher,
        accounts: accounts,
        config: printConfig
      });

      return doc.output('dataurlstring');
    } catch (error) {
      console.error('Preview error:', error);
      return null;
    }
  };

  /**
   * Share Voucher PDF (Mobile)
   * For WhatsApp, Email, Google Drive, etc.
   */
  const handleShareVoucher = async (transactionId: string) => {
    try {
      const voucher = transactions.find(t => t.id === transactionId);
      if (!voucher) {
        alert('❌ Voucher not found');
        return;
      }

      const printConfig: VoucherPrintConfig = {
        companyName: companyName || 'Organization',
        companyAddress: companyAddress || 'Dhaka, Bangladesh',
        companyContact: localStorage.getItem('regal_company_contact') || undefined
      };

      const doc = VoucherPrintService.generateVoucherPDF({
        voucher,
        accounts: accounts,
        config: printConfig
      });

      const pdfBlob = doc.output('blob');
      const filename = `${voucher.voucherType}_${voucher.voucherNo}.pdf`;

      // Check if on mobile with Share API
      if ((window as any).Capacitor?.isNativePlatform?.()) {
        try {
          // Save to temp file first
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(pdfBlob);
          });

          await (Filesystem as any).writeFile({
            path: filename,
            data: base64,
            directory: (Directory as any).Documents,
            recursive: true
          });

          // Share via mobile
          await (Share as any).share({
            title: `${voucher.voucherType} Voucher`,
            text: `Voucher #${voucher.voucherNo} - ${voucher.description}`,
            files: [filename],
            dialogTitle: 'Share Voucher'
          });
        } catch (error) {
          console.error('Share error:', error);
          alert('❌ Failed to share voucher');
        }
      } else {
        // Web fallback: download instead
        await downloadPDF(doc, filename);
      }
    } catch (error) {
      console.error('Share handler error:', error);
      alert('❌ Failed to share voucher');
    }
  };

  const navigateTo = (view: ViewType, replace = false) => {
    if (view === activeView) return;
    if (!replace && activeView !== 'ONBOARDING') {
      setViewHistory(prev => [...prev, activeView]);
    }
    setActiveView(view);
  };

  const handleBack = () => {
    if ((activeView === 'LEDGER' && selectedLedgerAccountId) || activeView === 'SUPPORT' || activeView === 'DEVELOPER_INFO' || activeView === 'DATE_CONFIG') {
      if (activeView === 'LEDGER' && selectedLedgerAccountId) setSelectedLedgerAccountId(null);
      else {
        const newStack = [...viewHistory];
        const prev = newStack.pop() || 'SETTINGS';
        setViewHistory(newStack);
        setActiveView(prev as ViewType);
      }
      return;
    }
    if (viewHistory.length > 0) {
      const newStack = [...viewHistory];
      const prev = newStack.pop()!;
      setViewHistory(newStack);
      setActiveView(prev);
    } else if (activeView !== 'DASHBOARD') {
      setActiveView('DASHBOARD');
      setViewHistory([]);
    }
  };

  // ============================================================================
  // MULTI-COMPANY HANDLERS
  // ============================================================================

  const handleSwitchCompany = async (companyId: string) => {
    if (!user || !db) return;
    try {
      const company = companies.find(c => c.id === companyId);
      if (!company) return;

      await switchActiveCompany(user.id, companyId, db);
      setActiveCompanyId(companyId);
      setActiveCompany(company);
      setShowCompanySwitcher(false);

      // Reload data for new company
      const companyData = await getAllForCompany<Account>('accounts', user.id, companyId, db);
      setAccounts(companyData);
      const companyTxns = await getAllForCompany<Transaction>('transactions', user.id, companyId, db);
      setTransactions(companyTxns);

      console.log(`✅ Switched to company: ${company.name}`);
    } catch (error) {
      console.error('❌ Error switching company:', error);
      alert('Failed to switch company');
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db || !newCompanyForm.name.trim()) {
      alert('❌ Please enter a company name');
      return;
    }

    try {
      setIsCreatingCompany(true);
      const companyData: Omit<Company, 'id'> = {
        userId: user.id,
        name: newCompanyForm.name,
        address: newCompanyForm.address,
        financialYear: {
          startDate: newCompanyForm.financialYearStart,
          endDate: newCompanyForm.financialYearEnd
        },
        createdAt: new Date().toISOString(),
        isActive: false,
        isDeleted: false,
        deletedAt: null
      };

      const newCompany = await createCompany(user.id, companyData, db);
      await seedDefaultAccounts(user.id, newCompany.id, db);

      const updatedCompanies = await getCompaniesForUser(user.id, db);
      setCompanies(updatedCompanies);

      setNewCompanyForm({
        name: '',
        address: '',
        financialYearStart: `${new Date().getFullYear()}-01-01`,
        financialYearEnd: `${new Date().getFullYear()}-12-31`
      });
      setIsCreatingCompany(false);
      setShowCompanySwitcher(false);

      alert(`✅ Company "${newCompany.name}" created successfully!`);
    } catch (error) {
      console.error('❌ Error creating company:', error);
      alert('Failed to create company');
      setIsCreatingCompany(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('regal_report_start', reportRange.start);
    localStorage.setItem('regal_report_end', reportRange.end);
  }, [reportRange]);

  useEffect(() => {
    localStorage.setItem('regal_auto_backup', autoBackupEnabled.toString());
    localStorage.setItem('regal_backup_freq', backupFrequency);
  }, [autoBackupEnabled, backupFrequency]);

  const filteredTransactions = useMemo(() => {
    let result = transactions.filter(tx => tx.date >= reportRange.start && tx.date <= reportRange.end);

    // Apply voucher type filter if not "ALL"
    if (historyFilter !== 'ALL') {
      result = result.filter(tx => tx.voucherType === historyFilter);
    }

    return result;
  }, [transactions, reportRange, historyFilter]);

  const accountsWithBalances = useMemo(() => {
    try {
      console.log('📊 Calculating balances for', accounts.length, 'accounts');
      const result = calculateBalances(accounts, transactions, reportRange.start, reportRange.end);
      console.log('✅ Balance calculation complete:', result.length, 'accounts');
      return result;
    } catch (error) {
      console.error('❌ ERROR in accountsWithBalances:', error);
      return [];
    }
  }, [accounts, transactions, reportRange]);

  const financialSummary = useMemo(() => {
    try {
      console.log('💰 Computing financial summary...');
      const result = getFinancialSummary(accountsWithBalances);
      console.log('✅ Financial summary computed:', result);
      return result;
    } catch (error) {
      console.error('❌ ERROR in financialSummary:', error);
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
  }, [accountsWithBalances]);

  // Dashboard Activity Stats (Last 7 Days)
  const dashboardStats = useMemo(() => {
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
            // ✅ DASHBOARD DISPLAY RULES: Apply sign transformations for presentation
            if (acc.type === AccountType.INCOME) {
              // Income: Ledger balance calculation (debit - credit), then reverse for display
              dailyIncome += (entry.debit - entry.credit) * -1;
            } else if (acc.type === AccountType.EXPENSE) {
              // Expense: Ledger balance calculation (debit - credit), then reverse for display
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
  }, [transactions, accounts]);

  // Automated Cash Flow components calculation
  const cashFlowData = useMemo(() => {
    try {
      console.log('💵 Computing cash flow data...');
      const netProfit = financialSummary.netIncome ?? 0;
      const groups = accountsWithBalances.filter(a => a.level === AccountLevel.GROUP);

      if (!Number.isFinite(netProfit)) {
        console.error('❌ Invalid netProfit:', netProfit);
        throw new Error(`Invalid netProfit: ${netProfit}`);
      }

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

      const openingCash = groups.find(g => g.code === '10000')?.openingBalance || 0;
      const closingCash = groups.find(g => g.code === '10000')?.balance || 0;

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
      console.error('❌ ERROR in cashFlowData:', error);
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
  }, [financialSummary, accountsWithBalances]);

  const ledgerEntries = useMemo(() => {
    try {
      if (!selectedLedgerAccountId) return [];
      const acc = accountsWithBalances.find(a => a.id === selectedLedgerAccountId);
      if (!acc) return [];

      let runningBalance = acc.openingBalance ?? 0;
      // ✅ UNIVERSAL FORMULA: running balance = openingBalance + debit - credit
      // (No account-type checking - same formula for ALL accounts)

      return sortTransactionsByVoucherNo(
        transactions
          .filter(tx => tx.entries.some(e => e.accountId === selectedLedgerAccountId))
          .filter(tx => tx.date >= reportRange.start && tx.date <= reportRange.end)
      ).map(tx => {
        const entry = tx.entries.find(e => e.accountId === selectedLedgerAccountId)!;
        // ✅ UNIVERSAL FORMULA: always use (debit - credit) for ALL accounts
        runningBalance += (entry.debit - entry.credit);
        return {
          ...tx,
          debit: entry.debit,
          credit: entry.credit,
          balance: runningBalance
        };
      });
    } catch (error) {
      console.error('❌ ERROR in ledgerEntries:', error);
      return [];
    }
  }, [selectedLedgerAccountId, transactions, accountsWithBalances, reportRange.start, reportRange.end]);

  useEffect(() => {
    const setup = async () => {
      try {
        // Initialize network monitoring for offline-first support
        initializeNetworkMonitoring();

        const database = await initDB();
        setDb(database);

        // Firebase Auth listener
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
          if (firebaseUser) {
            console.log('🔥 Firebase Auth: User logged in', firebaseUser.email);
            const userData: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'User',
              photoUrl: firebaseUser.photoURL || APP_CONFIG.FIREBASE.PHOTO_URL
            };
            setUser(userData);
            localStorage.setItem('regal_user_session', JSON.stringify(userData));
            await loadUserData(userData, database);

            if (activeView === 'AUTH') {
              setActiveView('DASHBOARD');
            }
          } else {
            console.log('🔥 Firebase Auth: No user found');
            setUser(null);
            localStorage.removeItem('regal_user_session');
            setActiveView('AUTH');
          }
          setIsInitializing(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Setup failed", error);
        setIsInitializing(false);
      }
    };
    setup();
  }, []);

  // Subscribe to network status changes
  useEffect(() => {
    const unsubscribe = onNetworkChange((isOnlineStatus) => {
      setNetworkOnline(isOnlineStatus);
      console.log('Network status changed:', isOnlineStatus ? 'ONLINE' : 'OFFLINE');
    });
    return unsubscribe;
  }, []);

  // Android Hardware Button Handlers
  useEffect(() => {
    const handleBackButton = () => {
      // Handle back button based on current view
      if (activeView === 'DASHBOARD') {
        // Show exit confirmation on main screens
        if (confirm('Exit RTS Smart Accounting?')) {
          CapacitorApp.exitApp();
        }
      } else if (activeView === 'ONBOARDING') {
        // Can't go back from onboarding
        if (confirm('Exit RTS Smart Accounting?')) {
          CapacitorApp.exitApp();
        }
      } else {
        // Navigate back for other views
        handleBack();
      }
    };

    const handleAppStateChange = (state: any) => {
      if (state.isActive) {
        // App coming to foreground
        console.log('App resumed');
      } else {
        // App going to background
        console.log('App paused');
      }
    };

    // Only register handlers if running on native platform
    if ((window as any).Capacitor) {
      CapacitorApp.addListener('backButton', handleBackButton);
      CapacitorApp.addListener('appStateChange', handleAppStateChange);

      // Cleanup listeners on unmount
      return () => {
        CapacitorApp.removeAllListeners();
      };
    }
  }, [activeView]);

  const loadUserData = async (userData: User, database: IDBDatabase) => {
    try {
      // ✅ NEW: Load companies for this user
      const userCompanies = await getCompaniesForUser(userData.id, database);

      let activeComp = activeCompany;

      if (userCompanies.length === 0) {
        // ✅ NEW: First time user - create default company
        console.log('🏢 First login: Creating default company...');
        const defaultCompany = await createCompany(userData.id, {
          userId: userData.id,
          name: 'My Organization',
          address: 'Dhaka, Bangladesh',
          financialYear: {
            startDate: `${new Date().getFullYear()}-01-01`,
            endDate: `${new Date().getFullYear()}-12-31`
          },
          createdAt: new Date().toISOString(),
          isActive: true,
          isDeleted: false,
          deletedAt: null
        }, database);

        setCompanies([defaultCompany]);
        setActiveCompany(defaultCompany);
        setActiveCompanyId(defaultCompany.id);
        activeComp = defaultCompany;
      } else {
        // ✅ Existing user - load companies and find active one
        setCompanies(userCompanies);

        // Check for active company in localStorage
        const savedActiveId = getActiveCompanyId();
        let activeFound = userCompanies.find(c => c.id === savedActiveId && c.isActive);

        if (!activeFound) {
          // Fallback to first active company
          activeFound = userCompanies.find(c => c.isActive);
        }

        if (!activeFound && userCompanies.length > 0) {
          // If no active company found, use first one and mark it as active
          activeFound = userCompanies[0];
          await switchActiveCompany(userData.id, activeFound.id, database);
        }

        if (activeFound) {
          setActiveCompany(activeFound);
          setActiveCompanyId(activeFound.id);
          activeComp = activeFound;
        }
      }

      // ✅ Load data for ACTIVE COMPANY ONLY
      if (!activeComp) {
        console.error('❌ No active company found');
        setIsInitializing(false);
        return;
      }

      const userAccounts = await getAllForCompany<Account>('accounts', userData.id, activeComp.id, database);
      const userTransactions = await getAllForCompany<Transaction>('transactions', userData.id, activeComp.id, database);
      const userSubLedgers = await getAllForCompany<InventorySubLedger>('inventorySubLedgers', userData.id, activeComp.id, database);
      const userMovements = await getAllForCompany<InventoryMovement>('inventoryMovements', userData.id, activeComp.id, database);

      let accountsToUse = userAccounts;

      // ✅ VERIFY accounts have proper hierarchy - if not, force reseed
      const hasMainAccounts = userAccounts.some(a => a.level === AccountLevel.MAIN);
      const hasGroupAccounts = userAccounts.some(a => a.level === AccountLevel.GROUP);
      const hasGLAccounts = userAccounts.some(a => a.level === AccountLevel.GL);

      if (userAccounts.length === 0 || !hasMainAccounts || !hasGroupAccounts || !hasGLAccounts) {
        // Either no accounts at all, or broken hierarchy - force reseed
        console.log(`📊 Reseeding accounts - Main: ${hasMainAccounts}, Group: ${hasGroupAccounts}, GL: ${hasGLAccounts}`);

        // Clear old broken accounts if they exist
        if (userAccounts.length > 0) {
          console.log('⚠️ Found broken accounts - clearing and reseeding...');
          try {
            // Delete accounts one by one instead of using cursor
            for (const account of userAccounts) {
              await deleteData('accounts', account.id, database);
            }
            console.log('✅ Cleared broken accounts');
          } catch (clearError) {
            console.error('⚠️ Error clearing accounts:', clearError);
            // Continue anyway - just try to seed
          }
        }

        // Now seed default accounts
        console.log('✅ Creating fresh default chart of accounts...');
        try {
          await seedDefaultAccounts(userData.id, activeComp.id, database);
          accountsToUse = await getAllForCompany<Account>('accounts', userData.id, activeComp.id, database);
          console.log(`✅ Seeded ${accountsToUse.length} accounts`);
        } catch (seedError) {
          console.error('❌ Error seeding accounts:', seedError);
          alert('❌ Failed to seed default accounts. Please refresh the page.');
          setIsInitializing(false);
          return;
        }
      }

      // Ensure inventory GL accounts exist (for upgrades from older versions)
      const inventoryGLAccounts = accountsToUse.filter(a => a.isInventoryGL === true);
      if (inventoryGLAccounts.length === 0) {
        console.log('⚠️ No inventory GL accounts found. Creating them...');
        const inventoryGLDefs = [
          { userId: userData.id, companyId: activeComp.id, name: 'Finished Goods', type: AccountType.ASSET, level: AccountLevel.GL, code: '30001', isInventoryGL: true, isLocked: true },
          { userId: userData.id, companyId: activeComp.id, name: 'Work in Progress', type: AccountType.ASSET, level: AccountLevel.GL, code: '30002', isInventoryGL: true, isLocked: true },
          { userId: userData.id, companyId: activeComp.id, name: 'Raw Materials', type: AccountType.ASSET, level: AccountLevel.GL, code: '30003', isInventoryGL: true, isLocked: true },
          { userId: userData.id, companyId: activeComp.id, name: 'Packing Materials', type: AccountType.ASSET, level: AccountLevel.GL, code: '30004', isInventoryGL: true, isLocked: true },
          { userId: userData.id, companyId: activeComp.id, name: 'Production Supplies & Spare Parts', type: AccountType.ASSET, level: AccountLevel.GL, code: '30005', isInventoryGL: true, isLocked: true },
        ];

        // Find the Inventory group account
        const inventoryGroup = accountsToUse.find(a => a.code === '30000');

        if (inventoryGroup) {
          for (const glDef of inventoryGLDefs) {
            const newAccount: Account = {
              id: `l_${glDef.code}_${userData.id}`,
              ...glDef,
              parentAccountId: inventoryGroup.id,
              balance: 0,
              openingBalance: 0,
              isSystem: true
            };
            await saveData('accounts', newAccount, database);
          }
        }
      }

      // ✅ CRITICAL: Ensure COGS GL accounts exist (for upgrades from older versions)
      // Check if we have all 5 COGS GL accounts with the isCOGSGL flag set
      const expectedCOGSCodes = ['180001', '180002', '180003', '180004', '180005'];
      const existingCOGSAccounts = accountsToUse.filter(a => expectedCOGSCodes.includes(a.code) && a.isCOGSGL === true);

      if (existingCOGSAccounts.length < expectedCOGSCodes.length) {
        console.log(`⚠️ COGS GL accounts incomplete. Found ${existingCOGSAccounts.length}/5. Creating missing ones...`);

        // Find or create the Cost of Sales group account
        let cogsGroup = accountsToUse.find(a => a.code === '180000');
        if (!cogsGroup) {
          console.log('⚠️ Cost of Sales group (180000) not found. Creating it...');
          const mainExpense = accountsToUse.find(a => a.level === AccountLevel.MAIN && a.code === '5');
          const newCogsGroup: Account = {
            id: `g_180000_${userData.id}`,
            userId: userData.id,
            companyId: activeComp.id,
            name: 'Cost of Sales',
            type: AccountType.EXPENSE,
            level: AccountLevel.GROUP,
            parentAccountId: mainExpense?.id || `m5_${userData.id}`,
            balance: 0,
            openingBalance: 0,
            code: '180000',
            isSystem: true
          };
          await saveData('accounts', newCogsGroup, database);
          cogsGroup = newCogsGroup;
        }

        const cogsGLDefs = [
          { code: '180001', name: 'Cost of Sales – Finished Goods' },
          { code: '180002', name: 'Cost of Sales – Work in Progress' },
          { code: '180003', name: 'Cost of Sales – Raw Materials' },
          { code: '180004', name: 'Cost of Sales – Packing Materials' },
          { code: '180005', name: 'Cost of Sales – Production Supplies' },
        ];

        if (cogsGroup) {
          for (const glDef of cogsGLDefs) {
            // Check if this account already exists with the isCOGSGL flag
            const existingAccount = accountsToUse.find(a => a.code === glDef.code && a.isCOGSGL === true);
            if (!existingAccount) {
              console.log(`✅ Creating/Fixing COGS GL account: ${glDef.name} (${glDef.code})`);
              const newAccount: Account = {
                id: `l_${glDef.code}_${userData.id}`,
                userId: userData.id,
                companyId: activeComp.id,
                name: glDef.name,
                type: AccountType.EXPENSE,
                level: AccountLevel.GL,
                parentAccountId: cogsGroup.id,
                balance: 0,
                openingBalance: 0,
                code: glDef.code,
                isSystem: true,
                isLocked: true,
                isCOGSGL: true  // ✅ CRITICAL: Must set this flag
              };
              await saveData('accounts', newAccount, database);
            }
          }
        } else {
          console.error('❌ ERROR: Cost of Sales group could not be created or found!');
        }
      } else {
        console.log(`✅ All COGS GL accounts present and correct`);
      }

      // Reload accounts after all system accounts are created
      const reloadedAccounts = await getAllForCompany<Account>('accounts', userData.id, activeComp.id, database);
      setAccounts(reloadedAccounts);

      setTransactions(userTransactions);
      setInventorySubLedgers(userSubLedgers);
      setInventoryMovements(userMovements);
      setActiveView('DASHBOARD');
      setIsInitializing(false);
    } catch (error) {
      console.error('❌ Error in loadUserData:', error);
      alert(`❌ Failed to initialize app:\n${error instanceof Error ? error.message : String(error)}\n\nPlease refresh the page and try again.`);
      setIsInitializing(false);
    }
  };

  // --- Google Drive Logic ---
  const handleAuthorizeDrive = () => {
    const client = (window as any).google?.accounts?.oauth2?.initTokenClient({
      client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: (response: any) => {
        if (response.access_token) {
          setDriveToken(response.access_token);
          loadBackupHistory(response.access_token);
        }
      },
    });
    if (client) client.requestAccessToken();
    else alert("Google identity service unavailable.");
  };

  const loadBackupHistory = async (token: string) => {
    setIsBackupLoading(true);
    try {
      const drive = new GoogleDriveService(token);
      const folderId = await drive.getOrCreateFolder();
      const files = await drive.listBackups(folderId);
      setBackupFiles(files.map(f => ({
        id: f.id,
        name: f.name,
        createdTime: f.createdTime,
        companyName: f.name.split('_')[2] || 'Unknown'
      })));
    } catch (e) {
      console.error(e);
    } finally {
      setIsBackupLoading(false);
    }
  };

  const handlePerformBackup = async () => {
    if (!driveToken || !db || !user) {
      handleAuthorizeDrive();
      return;
    }
    setIsBackupLoading(true);
    try {
      const drive = new GoogleDriveService(driveToken);
      const folderId = await drive.getOrCreateFolder();

      // ✅ FIX: Include inventory data in backup (CRITICAL for audit trail)
      const payload = {
        version: '1.4',
        timestamp: new Date().toISOString(),
        companyName,
        companyAddress,
        accounts,
        transactions,
        inventorySubLedgers,  // ✅ ADDED: Include inventory sub-ledgers
        inventoryMovements,   // ✅ ADDED: Include inventory movements for complete history
      };

      const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
      const fileName = `AccountingApp_Backup_${companyName.replace(/\s+/g, '')}_${dateStr}.json`;

      await drive.uploadBackup(fileName, folderId, JSON.stringify(payload));
      alert("Backup successfully uploaded to your Google Drive!");
      await loadBackupHistory(driveToken);
    } catch (e) {
      alert("Backup failed. Please check connection.");
    } finally {
      setIsBackupLoading(false);
    }
  };

  const handleRestoreFromDrive = async (file: DriveBackupFile) => {
    if (!driveToken || !db || !user) return;
    if (!confirm("RESTORE WARNING: This will permanently overwrite your current local company data. Continue?")) return;

    setIsBackupLoading(true);
    try {
      const drive = new GoogleDriveService(driveToken);
      const data = await drive.downloadFile(file.id);

      if (!data.accounts || !data.transactions) throw new Error("Invalid backup file structure");

      for (const acc of data.accounts) await saveData('accounts', { ...acc, userId: user.id }, db);
      for (const tx of data.transactions) await saveData('transactions', { ...tx, userId: user.id }, db);

      // ✅ FIX: Restore inventory data if present in backup (CRITICAL for data integrity)
      if (data.inventorySubLedgers && Array.isArray(data.inventorySubLedgers)) {
        for (const subLedger of data.inventorySubLedgers) {
          await saveData('inventorySubLedgers', { ...subLedger, userId: user.id }, db);
        }
      }

      if (data.inventoryMovements && Array.isArray(data.inventoryMovements)) {
        for (const movement of data.inventoryMovements) {
          await saveData('inventoryMovements', { ...movement, userId: user.id }, db);
        }
      }

      localStorage.setItem('regal_company_name', data.companyName || companyName);
      localStorage.setItem('regal_company_address', data.companyAddress || companyAddress);

      alert("Data successfully restored! Reloading...");
      window.location.reload();
    } catch (e: any) {
      alert(`Restore failed: ${e.message}`);
    } finally {
      setIsBackupLoading(false);
    }
  };

  // ✅ STEP 2: Auto-Backup Scheduling Implementation
  const handleAutoBackupToggle = (enabled: boolean) => {
    setAutoBackupEnabled(enabled);
    localStorage.setItem('regal_auto_backup', enabled ? 'true' : 'false');
    if (enabled) {
      alert(`✅ Auto-backup enabled (${backupFrequency}). Your data will be backed up automatically.`);
    } else {
      alert('❌ Auto-backup disabled. You can still perform manual backups anytime.');
    }
  };

  const handleBackupFrequencyChange = (frequency: 'Daily' | 'Weekly' | 'Monthly') => {
    setBackupFrequency(frequency);
    localStorage.setItem('regal_backup_freq', frequency);
    alert(`✅ Backup frequency changed to ${frequency}`);
  };

  // ✅ Manual backup handler
  const handleManualBackup = async () => {
    if (!driveToken || !db || !user) {
      alert('❌ Please connect Google Drive first');
      return;
    }

    setIsManualBackupLoading(true);
    try {
      const drive = new GoogleDriveService(driveToken);
      const folderId = await drive.getOrCreateFolder();

      const payload = {
        version: '1.4',
        timestamp: new Date().toISOString(),
        companyName,
        companyAddress,
        accounts,
        transactions,
        inventorySubLedgers,
        inventoryMovements,
      };

      const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
      const fileName = `AccountingApp_ManualBackup_${companyName.replace(/\s+/g, '')}_${dateStr}.json`;

      await drive.uploadBackup(fileName, folderId, JSON.stringify(payload));

      // Update last backup time
      const formattedTime = new Date().toLocaleString();
      localStorage.setItem('regal_last_backup_time', new Date().getTime().toString());
      localStorage.setItem('regal_last_backup_time_formatted', formattedTime);
      setLastBackupTime(formattedTime);

      // Add to backup history
      const newHistory = [{
        timestamp: formattedTime,
        fileName,
        status: 'success' as const
      }, ...backupHistory].slice(0, 10); // Keep last 10 backups
      setBackupHistory(newHistory);
      localStorage.setItem('regal_backup_history', JSON.stringify(newHistory));

      alert(`✅ Backup created successfully!\n\nFile: ${fileName}\nTime: ${formattedTime}`);
    } catch (error) {
      console.error('Manual backup failed:', error);
      const failedEntry = {
        timestamp: new Date().toLocaleString(),
        fileName: `AccountingApp_ManualBackup_${companyName.replace(/\s+/g, '')}_FAILED`,
        status: 'failed' as const
      };
      const newHistory = [failedEntry, ...backupHistory].slice(0, 10);
      setBackupHistory(newHistory);
      localStorage.setItem('regal_backup_history', JSON.stringify(newHistory));
      alert(`❌ Manual backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsManualBackupLoading(false);
    }
  };

  // ✅ Restore from backup handler
  const handleRestoreBackup = async () => {
    if (!driveToken || !db) {
      alert('❌ Please connect Google Drive first');
      return;
    }

    if (!window.confirm('⚠️ Are you sure you want to restore from backup? This will overwrite your current data.')) {
      return;
    }

    setIsBackupLoading(true);
    try {
      const drive = new GoogleDriveService(driveToken);
      const folderId = await drive.getOrCreateFolder();
      const backups = await drive.listBackups(folderId);

      if (backups.length === 0) {
        alert('❌ No backups found in Google Drive');
        return;
      }

      // Get the most recent backup
      const latestBackup = backups[0];
      const data = await drive.downloadFile(latestBackup.id);

      // Restore data to IndexedDB
      const companyStore = db.transaction('companies', 'readwrite').objectStore('companies');
      const accountStore = db.transaction('accounts', 'readwrite').objectStore('accounts');
      const transactionStore = db.transaction('transactions', 'readwrite').objectStore('transactions');
      const subLedgerStore = db.transaction('inventorySubLedgers', 'readwrite').objectStore('inventorySubLedgers');
      const movementStore = db.transaction('inventoryMovements', 'readwrite').objectStore('inventoryMovements');

      // Clear existing data
      companyStore.clear();
      accountStore.clear();
      transactionStore.clear();
      subLedgerStore.clear();
      movementStore.clear();

      // Add restored data
      if (data.companyName) {
        companyStore.add({ id: 1, name: data.companyName, address: data.companyAddress });
      }
      data.accounts?.forEach((acc: any) => accountStore.add(acc));
      data.transactions?.forEach((txn: any) => transactionStore.add(txn));
      data.inventorySubLedgers?.forEach((sub: any) => subLedgerStore.add(sub));
      data.inventoryMovements?.forEach((mov: any) => movementStore.add(mov));

      // Update local state
      setCompanyName(data.companyName || '');
      setCompanyAddress(data.companyAddress || '');
      setAccounts(data.accounts || []);
      setTransactions(data.transactions || []);
      setInventorySubLedgers(data.inventorySubLedgers || []);
      setInventoryMovements(data.inventoryMovements || []);

      alert(`✅ Restore completed successfully!\n\nRestored from: ${latestBackup.name}`);
    } catch (error) {
      console.error('Restore failed:', error);
      alert(`❌ Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsBackupLoading(false);
    }
  };

  // ✅ Auto-backup scheduler (runs on app load and periodically)
  useEffect(() => {
    if (!autoBackupEnabled || !driveToken || !db || !user) return;

    const checkAndPerformBackup = async () => {
      const lastBackupTime = localStorage.getItem('regal_last_backup_time');
      const now = new Date().getTime();

      // Calculate time threshold based on frequency
      let timeThreshold = 24 * 60 * 60 * 1000; // Daily: 24 hours
      if (backupFrequency === 'Weekly') timeThreshold = 7 * 24 * 60 * 60 * 1000; // Weekly: 7 days
      if (backupFrequency === 'Monthly') timeThreshold = 30 * 24 * 60 * 60 * 1000; // Monthly: 30 days

      // Perform backup if time threshold exceeded
      if (!lastBackupTime || (now - parseInt(lastBackupTime)) > timeThreshold) {
        try {
          console.log(`⏰ Auto-backup triggered (${backupFrequency} schedule)`);
          const drive = new GoogleDriveService(driveToken);
          const folderId = await drive.getOrCreateFolder();

          const payload = {
            version: '1.4',
            timestamp: new Date().toISOString(),
            companyName,
            companyAddress,
            accounts,
            transactions,
            inventorySubLedgers,
            inventoryMovements,
          };

          const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
          const fileName = `AccountingApp_AutoBackup_${companyName.replace(/\s+/g, '')}_${dateStr}.json`;

          await drive.uploadBackup(fileName, folderId, JSON.stringify(payload));
          const formattedTime = new Date().toLocaleString();
          localStorage.setItem('regal_last_backup_time', now.toString());
          localStorage.setItem('regal_last_backup_time_formatted', formattedTime);
          setLastBackupTime(formattedTime);

          // Add to backup history
          const newHistory = [{
            timestamp: formattedTime,
            fileName,
            status: 'success' as const
          }, ...backupHistory].slice(0, 10);
          setBackupHistory(newHistory);
          localStorage.setItem('regal_backup_history', JSON.stringify(newHistory));

          console.log('✅ Auto-backup completed successfully');
        } catch (error) {
          console.error('❌ Auto-backup failed:', error);
        }
      }
    };

    // Check on app load
    checkAndPerformBackup();

    // Set up periodic check (every 1 hour)
    const backupCheckInterval = setInterval(checkAndPerformBackup, 60 * 60 * 1000);

    return () => clearInterval(backupCheckInterval);
  }, [autoBackupEnabled, backupFrequency, driveToken, db, user, accounts, transactions, inventorySubLedgers, inventoryMovements, companyName, companyAddress]);



  const handleCompleteOnboarding = async () => {
    if (!db || !user || !activeCompany) return;
    setIsInitializing(true);
    try {
      await seedDefaultAccounts(user.id, activeCompany.id, db);
      await loadUserData(user, db);
    } catch (e) {
      console.error(e);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleVoucherSelect = (type: VoucherType) => {
    // ✅ CRITICAL: Don't allow changing voucher type during edit
    if (editingTransactionId) {
      alert('⚠️ Cannot change voucher type during edit. Please delete and recreate if type change needed.');
      return;
    }

    // Reset voucher items when switching types
    setVoucherItems([]);

    let debit = '';
    let credit = '';
    const glAccounts = accountsWithBalances.filter(a => a.level === AccountLevel.GL);

    switch (type) {
      case 'SALES':
        // SALES: Pre-select Accounts Receivable, reset others for inventory selection
        debit = getReceivableGLAccounts(accounts)[0]?.id || '';
        break;
      case 'PURCHASE':
        // PURCHASE: Pre-select Accounts Payable, reset others for inventory selection
        credit = getPayableGLAccounts(accounts)[0]?.id || '';
        break;
      case 'RECEIPT':
        debit = glAccounts.find(a => a.name.toLowerCase().includes('cash') || a.name.toLowerCase().includes('bank'))?.id || '';
        credit = glAccounts.find(a => a.name.toLowerCase().includes('receivable'))?.id || '';
        break;
      case 'PAYMENT':
        debit = glAccounts.find(a => a.name.toLowerCase().includes('payable') || a.name.toLowerCase().includes('expense'))?.id || '';
        credit = glAccounts.find(a => a.name.toLowerCase().includes('cash') || a.name.toLowerCase().includes('bank'))?.id || '';
        break;
    }
    setNewTx(prev => ({ ...prev, voucherType: type, voucherNo: getNextVoucherNo(type, transactions), debitAccount: debit, creditAccount: credit }));
  };

  const handleFetchAdvice = async () => {
    if (isAiLoading) return;
    setIsAiLoading(true);
    setAiInsight(null);
    try {
      const advice = await getFinancialAdvice(accountsWithBalances, transactions);
      setAiInsight(advice);
      alert(advice || "No advice generated.");
    } catch (error) {
      console.error("Gemini advice error:", error);
      alert("Could not fetch advice at this time.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const openAddAccount = () => {
    setEditingAccount({
      name: '',
      type: AccountType.ASSET,
      level: AccountLevel.GL,
      parentAccountId: '',
      code: ''
    });
    setIsAccountModalOpen(true);
  };

  /**
   * Context-aware floating Add button handler
   * Routes to appropriate action based on active screen/view
   */
  const handleFloatingAddButton = () => {
    switch (activeView) {
      // Primary transaction entry points
      case 'DASHBOARD':
      case 'TRANSACTIONS':
      case 'ADD_TRANSACTION':
        navigateTo('ADD_TRANSACTION');
        setEditingTransactionId(null);
        break;

      // Inventory management
      case 'INVENTORY':
        // Only allow adding if inventory GL is selected
        if (!selectedInventoryGL) {
          alert('⚠️ Please select an inventory category first');
          return;
        }
        setEditingSubLedger(null);
        setNewSubLedgerData({ itemName: '', itemCode: '', quantity: '', rate: '' });
        setIsInventoryModalOpen(true);
        break;

      // Ledger and Chart of Accounts management
      case 'LEDGER':
      case 'CHART':
        openAddAccount();
        break;

      // Reports and other read-only views: no action
      case 'REPORTS':
      case 'SETTINGS':
      case 'BACKUP_RESTORE':
      case 'SUPPORT':
      case 'DEVELOPER_INFO':
      case 'DATE_CONFIG':
      case 'ONBOARDING':
        // No action for read-only views
        break;
    }
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const openEditAccount = (acc: Partial<Account>) => {
    // Create a fresh copy to avoid reference issues
    setEditingAccount({
      ...acc,
      openingBalance: acc.openingBalance || 0
    });
    setIsAccountModalOpen(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user || !editingAccount) return;

    // ✅ CRITICAL: Enforce GL account hierarchy rule
    // A General Ledger account MUST have a parent Group Summary Account
    if (editingAccount.level === AccountLevel.GL) {
      if (!editingAccount.parentAccountId) {
        alert('❌ GL Account Error: You must select a Group Summary Account as parent.\n\nEvery GL account must belong to a group.\nCannot create orphan GL accounts.');
        return;
      }

      // Verify the parent exists and is actually a GROUP level account
      const parentAccount = accounts.find(a => a.id === editingAccount.parentAccountId);
      if (!parentAccount) {
        alert('❌ Parent Group Account not found. Please select a valid parent group.');
        return;
      }

      if (parentAccount.level !== AccountLevel.GROUP) {
        alert('❌ Parent must be a Group Summary Account, not a Main Account.');
        return;
      }
    }

    // ✅ Prevent editing of locked accounts (system-controlled)
    if (editingAccount.id && editingAccount.isLocked) {
      alert('❌ Cannot edit system-controlled account. Locked for integrity.');
      return;
    }

    let finalCode = editingAccount.code || '';

    // Auto-generate GL account code based on parent group ONLY for NEW accounts
    if (!editingAccount.id && editingAccount.level === AccountLevel.GL && editingAccount.parentAccountId) {
      const parentGroup = accounts.find(a => a.id === editingAccount.parentAccountId);
      if (parentGroup) {
        // Get all GL codes in this group
        const groupGLAccounts = accounts.filter(a =>
          a.level === AccountLevel.GL && a.parentAccountId === editingAccount.parentAccountId
        );
        const groupGLCodes = groupGLAccounts.map(a => a.code);
        // Use helper function for numeric code generation
        finalCode = generateNextGLAccountCode(parentGroup.code, groupGLCodes);
      }
    }

    const accountData: Account = {
      ...editingAccount as Account,
      code: finalCode,
      id: editingAccount.id || `l_${finalCode || Date.now()}_${user.id}`,
      userId: user.id,
      balance: editingAccount.balance || 0,
      openingBalance: 0,
    };
    await saveData('accounts', accountData, db);
    const updatedAccounts = await getAllForUser<Account>('accounts', user.id, db);
    setAccounts(updatedAccounts);
    setIsAccountModalOpen(false);
    setEditingAccount(null);
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user) {
      alert('❌ Database not initialized. Please refresh the app.');
      return;
    }

    // ✅ IMPROVED: Better validation messages for user
    // Handle Inventory Vouchers (SALES/PURCHASE)
    if ((newTx.voucherType === 'SALES' || newTx.voucherType === 'PURCHASE') && voucherItems.length > 0) {
      // ✅ NEW: Check plan type - SALES/PURCHASE only available in MODERATE plan
      if (planType === 'BASIC') {
        alert('❌ SALES & PURCHASE vouchers are only available in Moderate Plan (With Inventory)\n\nPlease upgrade your plan in Settings to use inventory features.');
        return;
      }

      if (!newTx.debitAccount && newTx.voucherType === 'SALES') {
        alert('❌ Please select a Customer (Accounts Receivable account) for SALES voucher');
        return;
      }
      if (!newTx.creditAccount && newTx.voucherType === 'PURCHASE') {
        alert('❌ Please select a Supplier (Accounts Payable account) for PURCHASE voucher');
        return;
      }

      // ✅ CRITICAL: Validate sufficient inventory for SALES vouchers
      if (newTx.voucherType === 'SALES') {
        const inventoryValidation = validateSalesVoucherInventory(
          voucherItems.map(item => ({
            inventoryGLAccountId: item.inventoryGLAccountId,
            subLedgerId: item.subLedgerId,
            quantity: item.quantity,
            rate: item.rate
          })),
          inventorySubLedgers,
          inventoryMovements
        );

        if (!inventoryValidation.valid) {
          const errorMessage = inventoryValidation.errors.join('\n');
          alert(`❌ Inventory Validation Failed:\n\n${errorMessage}`);
          return;
        }
      }

      // Task 9: Check for negative inventory potential
      const negativeCheck = validateNegativeInventory(inventorySubLedgers, inventoryMovements);
      if (!negativeCheck.valid) {
        console.warn('⚠️ Inventory integrity warnings:', negativeCheck.errors);
      }

      try {
        const voucherId = newTx.voucherNo || getNextVoucherNo(newTx.voucherType, transactions);

        let result;
        if (newTx.voucherType === 'SALES') {
          // Find a Revenue GL account (use first available under Revenue group)
          const revenueGroup = accounts.find(a => a.level === 3 && a.code === '160000');
          const revenueGL = revenueGroup ? accounts.find(a => a.parentAccountId === revenueGroup.id && a.level === 3) : null;

          // ✅ IMPROVED: Better error message for missing COGS accounts
          const cogsAccounts = accounts.filter(a => a.isCOGSGL === true);

          if (cogsAccounts.length === 0) {
            console.error(`❌ CRITICAL: COGS GL accounts not found!`);
            alert('❌ SYSTEM ERROR: Cost of Sales accounts not configured!\n\nPlease:\n1. Log out\n2. Log back in\n3. Try again\n\nIf issue persists, contact support with this message.');
            return;
          }

          // ✅ Validate inventory availability BEFORE calling createSalesVoucher
          let inventoryAvailable = true;
          for (const item of voucherItems) {
            const subLedger = inventorySubLedgers.find(sl => sl.id === item.subLedgerId);
            if (!subLedger) {
              console.error(`❌ Sub-ledger not found for item: ${item.subLedgerId}`);
              alert(`❌ Inventory Item Error:\n\nItem not found in system.\n\nPlease remove this item and try again.`);
              inventoryAvailable = false;
              continue;
            }

            // Calculate current inventory balance
            const currentBalance = calculateSubLedgerBalance(subLedger, inventoryMovements, '1900-01-01', newTx.date);

            // ✅ IMPROVED: Better validation for NaN values
            const availableQty = currentBalance.quantity || 0;
            const requiredQty = item.quantity || 0;

            if (isNaN(availableQty) || isNaN(requiredQty)) {
              alert(`❌ Invalid Quantity Data:\n\nItem: ${subLedger.itemName}\n\nPlease check your inventory data and try again.`);
              inventoryAvailable = false;
              continue;
            }

            if (availableQty < requiredQty) {
              inventoryAvailable = false;
              alert(`❌ INSUFFICIENT INVENTORY:\n\nItem: ${subLedger.itemName}\nRequired: ${requiredQty.toFixed(2)} units\nAvailable: ${availableQty.toFixed(2)} units\n\nPlease reduce the quantity and try again.`);
            }
          }

          if (!inventoryAvailable) {
            return;
          }


          result = createSalesVoucher(
            user.id,
            voucherId,
            newTx.date,
            newTx.description,
            newTx.debitAccount,
            voucherItems.map(item => ({
              inventoryGLAccountId: item.inventoryGLAccountId,
              subLedgerId: item.subLedgerId,
              quantity: item.quantity,
              rate: item.rate
            })),
            inventorySubLedgers,
            inventoryMovements,
            accounts,
            revenueGL?.id
          );
        } else {
          result = createPurchaseVoucher(
            user.id,
            voucherId,
            newTx.date,
            newTx.description,
            newTx.creditAccount,
            voucherItems.map(item => ({
              inventoryGLAccountId: item.inventoryGLAccountId,
              subLedgerId: item.subLedgerId,
              quantity: item.quantity,
              rate: item.rate
            })),
            accounts,
            inventorySubLedgers
          );
        }

        // Verify transaction creation
        if (editingTransactionId) {
          // Step 1: Delete the old transaction (reverses all GL entries: COGS, Revenue, A/R, A/P, Inventory GL)
          const oldTransaction = transactions.find(t => t.id === editingTransactionId);
          if (oldTransaction) {
            await deleteData('transactions', editingTransactionId, db);
          }

          // Step 2: Delete old inventory movements (these are separate from GL entries)
          const oldMovements = getMovementsForTransaction(editingTransactionId, inventoryMovements);
          for (const movement of oldMovements) {
            await deleteData('inventoryMovements', movement.id, db);
          }

          console.log(`   ✅ Old voucher completely reversed\n`);
        }

        // Save the new transaction (with new COGS entries)
        await saveData('transactions', result.transaction, db);

        // Save inventory movements
        for (const movement of result.movements) {
          await saveData('inventoryMovements', movement, db);
        }

        // Reload data
        const updatedTransactions = await getAllForUser<Transaction>('transactions', user.id, db);
        const updatedMovements = await getAllForUser<InventoryMovement>('inventoryMovements', user.id, db);
        setTransactions(updatedTransactions);
        setInventoryMovements(updatedMovements);

        alert(`✅ ${newTx.voucherType} Voucher ${editingTransactionId ? 'updated' : 'created'} successfully!\n\nVoucher #${voucherId}`);
        handleBack();
        setVoucherItems([]);
        setEditingTransactionId(null);
        setNewTx({ date: new Date().toISOString().split('T')[0], description: '', voucherType: 'JOURNAL', voucherNo: '', debitAccount: '', creditAccount: '', amount: '' });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ VOUCHER CREATION FAILED:', errorMsg);
        console.error('Full error:', error);
        alert(`❌ Could not create voucher:\n\n${errorMsg}\n\nPlease check:\n✓ All accounts are selected\n✓ Amounts are valid numbers\n✓ Inventory items have sufficient stock\n\nIf problem persists, try refreshing the app.`);
      }
      return;
    }

    // Handle Regular Journal Vouchers (JOURNAL, RECEIPT, PAYMENT)
    const amount = parseFloat(newTx.amount);

    // ✅ IMPROVED: Better NaN and validation handling
    if (isNaN(amount)) {
      alert('❌ Invalid Amount:\n\nPlease enter a valid number (e.g., 1000, 1000.50)');
      return;
    }

    if (amount <= 0) {
      alert('❌ Invalid Amount:\n\nAmount must be greater than zero');
      return;
    }

    if (!newTx.debitAccount || !newTx.creditAccount) {
      alert('❌ Incomplete Transaction:\n\nPlease select both Debit and Credit accounts');
      return;
    }

    if (newTx.debitAccount === newTx.creditAccount) {
      alert('❌ Invalid Transaction:\n\nDebit and Credit accounts cannot be the same');
      return;
    }

    const entries: JournalEntry[] = [{ accountId: newTx.debitAccount, debit: amount, credit: 0 }, { accountId: newTx.creditAccount, debit: 0, credit: amount }];
    if (!validateJournal(entries)) {
      alert('❌ Journal Balance Error:\n\nDebit total must equal Credit total');
      return;
    }

    // ✅ CRITICAL FIX for edit mode: Handle journal voucher editing
    if (editingTransactionId) {
      console.log(`\n📝 EDITING MODE: Reversing old journal voucher ${editingTransactionId}`);

      const oldTransaction = transactions.find(t => t.id === editingTransactionId);
      if (oldTransaction) {
        console.log(`   Deleting old transaction: ${oldTransaction.voucherNo}`);
        await deleteData('transactions', editingTransactionId, db);
      }

      console.log(`   ✅ Old journal voucher completely reversed\n`);
    }

    // Create new transaction with PRESERVED voucher number during edit
    const transaction: Transaction = {
      id: editingTransactionId || crypto.randomUUID(),
      userId: user.id,
      companyId: activeCompany!.id,
      voucherNo: newTx.voucherNo || getNextVoucherNo(newTx.voucherType, transactions),
      date: newTx.date,
      description: newTx.description || `${newTx.voucherType} Voucher`,
      entries,
      voucherType: newTx.voucherType,
      itemLines: (newTx.voucherType === 'SALES' || newTx.voucherType === 'PURCHASE') ? voucherItems : undefined
    };

    try {
      await saveData('transactions', transaction, db);
      const updatedTransactions = await getAllForCompany<Transaction>('transactions', user.id, activeCompany!.id, db);
      setTransactions(updatedTransactions);

      alert(`✅ ${newTx.voucherType} Voucher ${editingTransactionId ? 'updated' : 'created'} successfully!\n\nVoucher #${transaction.voucherNo}`);

      handleBack();
      setEditingTransactionId(null);
      setNewTx({ date: new Date().toISOString().split('T')[0], description: '', voucherType: 'JOURNAL', voucherNo: '', debitAccount: '', creditAccount: '', amount: '' });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Save failed:', errorMsg);
      alert(`❌ Failed to save transaction:\n\n${errorMsg}`);
    }
  };

  // Voucher Item Management (for SALES/PURCHASE)
  const addVoucherItem = (subLedgerId: string) => {
    const subLedger = inventorySubLedgers.find(sl => sl.id === subLedgerId);
    if (!subLedger) return;

    const newItem = {
      id: crypto.randomUUID(),
      subLedgerId,
      inventoryGLAccountId: subLedger.inventoryGLAccountId,
      itemName: subLedger.itemName,
      quantity: 1,
      rate: subLedger.rate
    };
    setVoucherItems([...voucherItems, newItem]);
  };

  const updateVoucherItem = (itemId: string, field: string, value: any) => {
    setVoucherItems(voucherItems.map(item =>
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  const removeVoucherItem = (itemId: string) => {
    setVoucherItems(voucherItems.filter(item => item.id !== itemId));
  };

  const getTotalVoucherAmount = () => {
    return voucherItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  };

  // Inventory Management Functions
  const handleSaveSubLedger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user) return;

    const validation = validateSubLedger(
      newSubLedgerData.itemName,
      selectedInventoryGL || '',
      parseFloat(newSubLedgerData.quantity) || 0,
      parseFloat(newSubLedgerData.rate) || 0
    );

    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    const subLedger: InventorySubLedger = {
      id: editingSubLedger?.id || generateSubLedgerId(user.id),
      userId: user.id,
      companyId: activeCompany!.id,
      inventoryGLAccountId: selectedInventoryGL!,
      itemName: newSubLedgerData.itemName,
      itemCode: newSubLedgerData.itemCode || undefined,
      quantity: parseFloat(newSubLedgerData.quantity),
      rate: parseFloat(newSubLedgerData.rate)
    };

    await saveData('inventorySubLedgers', subLedger, db);
    const updatedSubLedgers = await getAllForCompany<InventorySubLedger>('inventorySubLedgers', user.id, activeCompany!.id, db);
    setInventorySubLedgers(updatedSubLedgers);
    setIsInventoryModalOpen(false);
    setEditingSubLedger(null);
    setNewSubLedgerData({ itemName: '', itemCode: '', quantity: '', rate: '' });
    alert('✅ Sub-Ledger saved successfully');
  };

  const openEditSubLedger = (sl: InventorySubLedger) => {
    setEditingSubLedger(sl);
    setNewSubLedgerData({
      itemName: sl.itemName,
      itemCode: sl.itemCode || '',
      quantity: sl.quantity.toString(),
      rate: sl.rate.toString()
    });
    setIsInventoryModalOpen(true);
  };

  const handleDeleteSubLedger = async (subLedgerId: string) => {
    if (!db || !user) return;
    if (!confirm('Are you sure you want to delete this inventory item? This action cannot be undone.')) return;

    // Check if sub-ledger has movements
    const hasMovements = inventoryMovements.some(m => m.subLedgerId === subLedgerId);
    if (hasMovements) {
      alert('❌ Cannot delete. This item has transaction history.');
      return;
    }

    await deleteData('inventorySubLedgers', subLedgerId, db);
    const updatedSubLedgers = await getAllForUser<InventorySubLedger>('inventorySubLedgers', user.id, db);
    setInventorySubLedgers(updatedSubLedgers);
    alert('✅ Item deleted successfully');
  };

  // Local Backup Functions
  const handleLocalBackup = async () => {
    if (!user) return;
    const backupData = {
      version: '1.4',
      timestamp: new Date().toISOString(),
      companyName,
      companyAddress,
      accounts,
      transactions,
      inventorySubLedgers,
      inventoryMovements
    };
    const dataStr = JSON.stringify(backupData, null, 2);
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
    const filename = `AccountingApp_LocalBackup_${companyName.replace(/\s+/g, '')}_${dateStr}.json`;
    await downloadFile(dataStr, filename, 'application/json');
  };

  const handleLocalRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!db || !user) return;
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const backupData = JSON.parse(content);

        if (!backupData.accounts || !backupData.transactions) {
          alert('❌ Invalid backup file structure');
          return;
        }

        // Task 9: Validate backup integrity before restoring
        const integrityCheck = validateBackupRestoreIntegrity({
          accounts: backupData.accounts,
          transactions: backupData.transactions,
          inventorySubLedgers: backupData.inventorySubLedgers || [],
          inventoryMovements: backupData.inventoryMovements || []
        });

        let warningMessage = '';
        if (!integrityCheck.valid) {
          warningMessage = '\n\n⚠️ INTEGRITY WARNINGS:\n' + integrityCheck.issues.slice(0, 3).join('\n');
          if (integrityCheck.issues.length > 3) {
            warningMessage += '\n... and ' + (integrityCheck.issues.length - 3) + ' more issues';
          }
        }

        if (!confirm(`⚠️ RESTORE WARNING: This will overwrite your current data with:\n\nCompany: ${backupData.companyName}\nDate: ${new Date(backupData.timestamp).toLocaleString()}${warningMessage}\n\nContinue?`)) {
          return;
        }

        // Restore accounts and transactions
        for (const acc of backupData.accounts) {
          await saveData('accounts', { ...acc, userId: user.id }, db);
        }
        for (const tx of backupData.transactions) {
          await saveData('transactions', { ...tx, userId: user.id }, db);
        }

        // Task 9: Restore inventory data if present
        if (backupData.inventorySubLedgers) {
          for (const subLedger of backupData.inventorySubLedgers) {
            await saveData('inventorySubLedgers', { ...subLedger, userId: user.id }, db);
          }
        }
        if (backupData.inventoryMovements) {
          for (const movement of backupData.inventoryMovements) {
            await saveData('inventoryMovements', { ...movement, userId: user.id }, db);
          }
        }

        localStorage.setItem('regal_company_name', backupData.companyName || companyName);
        localStorage.setItem('regal_company_address', backupData.companyAddress || companyAddress);

        alert('✅ Data successfully restored! Reloading...');
        window.location.reload();
      } catch (error) {
        alert(`❌ Restore failed: ${(error as Error).message}`);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Delete all data handlers
  const handleInitiateDelete = () => {
    // Generate a random 4-digit code for verification
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setDeleteVerificationCode(code);
    setDeleteCheckboxConfirmed(false);
    setDeleteInputCode('');
    setDeleteConfirmStep(1);
  };

  const handleDeleteWarningConfirm = () => {
    setDeleteConfirmStep(2);
  };

  const handleDeleteCheckboxChange = (value: boolean) => {
    setDeleteCheckboxConfirmed(value);
    if (value) {
      setDeleteConfirmStep(3);
    }
  };

  const handleCompleteDelete = async () => {
    if (deleteInputCode !== deleteVerificationCode) {
      alert('❌ Verification code incorrect. Deletion cancelled.');
      setDeleteConfirmStep(0);
      setDeleteInputCode('');
      return;
    }

    try {
      if (!db || !user) return;

      // Delete only user-added accounts (keep system defaults with isSystem: true)
      const allAccounts = await getAllForUser<Account>('accounts', user.id, db);
      const userAddedCount = allAccounts.filter(acc => !acc.isSystem).length;

      for (const acc of allAccounts) {
        // Only delete non-system accounts (user-added)
        if (!acc.isSystem) {
          await deleteData('accounts', acc.id, db);
        }
      }

      // Delete all transactions
      const allTransactions = await getAllForUser<Transaction>('transactions', user.id, db);
      for (const tx of allTransactions) {
        await deleteData('transactions', tx.id, db);
      }

      // Delete all inventory movements
      const allMovements = await getAllForUser<InventoryMovement>('inventoryMovements', user.id, db);
      for (const movement of allMovements) {
        await deleteData('inventoryMovements', movement.id, db);
      }

      // Delete all inventory sub-ledgers
      const allSubLedgers = await getAllForUser<InventorySubLedger>('inventorySubLedgers', user.id, db);
      for (const subLedger of allSubLedgers) {
        await deleteData('inventorySubLedgers', subLedger.id, db);
      }

      // Clear localStorage for this user
      localStorage.removeItem('regal_company_name');
      localStorage.removeItem('regal_company_address');
      localStorage.removeItem('regal_dark_mode');
      localStorage.removeItem('regal_auto_backup');
      localStorage.removeItem('regal_backup_freq');
      localStorage.removeItem('regal_report_start');
      localStorage.removeItem('regal_report_end');

      // Reset state and reload to refresh accounts from DB
      setTransactions([]);
      setDeleteConfirmStep(0);
      setDeleteCheckboxConfirmed(false);
      setDeleteInputCode('');
      setDeleteVerificationCode('');

      alert(`✅ User data deleted successfully!\n\n${userAddedCount} custom accounts and ${allTransactions.length} transactions removed.\nDefault accounts preserved. App reloading...`);

      // Reload to refresh accounts from database
      setTimeout(() => window.location.reload(), 1000);
      setUser(null);
      setActiveView('AUTH');
      setViewHistory([]);
    } catch (error) {
      alert(`❌ Error deleting data: ${(error as Error).message}`);
      setDeleteConfirmStep(0);
    }
  };

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      try {
        await signOut(auth);
        setUser(null);
        localStorage.removeItem('regal_user_session');
        setActiveView('AUTH');
      } catch (error) {
        console.error("Sign out failed", error);
      }
    }
  };

  const handleExportLedgerPDF = async () => {
    const acc = accountsWithBalances.find(a => a.id === selectedLedgerAccountId);
    if (!acc) return;
    const doc = new jsPDF('p', 'mm', 'a4');
    const margin = 10; let y = 20; const pageWidth = doc.internal.pageSize.getWidth();
    const todayStr = formatDateLong(new Date().toISOString());

    doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.text(companyName, pageWidth / 2, y, { align: 'center' }); y += 7;
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100); doc.text(companyAddress, pageWidth / 2, y, { align: 'center' }); y += 6;
    doc.setFontSize(8); doc.text(`Print Date: ${todayStr}`, pageWidth / 2, y, { align: 'center' }); y += 6;

    doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0); doc.text(`General Ledger: ${acc.name}`, margin, y); y += 8;
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.text(`Report Period: ${formatDateLong(reportRange.start)} to ${formatDateLong(reportRange.end)}`, margin, y); y += 15;
    const cw = [25, 60, 25, 30, 30, 30]; const headers = ["Date", "Description", "Voucher", "Debit", "Credit", "Balance"]; let x = margin; headers.forEach((h, i) => { doc.text(h, x, y); x += cw[i]; }); y += 5; doc.line(margin, y, 200, y); y += 7;

    doc.setFont('helvetica', 'bold');
    doc.text("Opening Balance", margin + cw[0], y); doc.text(acc.openingBalance.toLocaleString(), margin + cw[0] + cw[1] + cw[2] + cw[3] + cw[4], y); y += 7;
    doc.setFont('helvetica', 'normal');

    ledgerEntries.forEach(entry => {
      if (y > 260) { doc.addPage(); y = 20; }
      let rowX = margin; doc.text(entry.date, rowX, y); rowX += cw[0]; doc.text(entry.description.substring(0, 35), rowX, y); rowX += cw[1]; doc.text(entry.voucherNo, rowX, y); rowX += cw[2]; doc.text(entry.debit > 0 ? entry.debit.toLocaleString() : '-', rowX, y); rowX += cw[3]; doc.text(entry.credit > 0 ? entry.credit.toLocaleString() : '-', rowX, y); rowX += cw[4]; doc.text(entry.balance.toLocaleString(), rowX, y); y += 6;
    });

    // Add closing balance line
    if (y > 260) { doc.addPage(); y = 20; }
    doc.line(margin, y, 200, y); y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text("Closing Balance", margin + cw[0], y); doc.text(acc.balance.toLocaleString(), margin + cw[0] + cw[1] + cw[2] + cw[3] + cw[4], y); y += 7;
    doc.setFont('helvetica', 'normal');

    const addFooter = (pageNo: number, totalPages: number) => {
      doc.setPage(pageNo); doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 150, 150);
      doc.text("This is system generated ledger. No signature required for this.", margin, doc.internal.pageSize.getHeight() - 10);
      doc.text(`Page ${pageNo} of ${totalPages}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
    };

    const totalPages = doc.getNumberOfPages(); for (let i = 1; i <= totalPages; i++) addFooter(i, totalPages);
    await downloadPDF(doc, `Ledger_${acc.name}.pdf`);
  };

  const handleExportAllLedgersPDF = async () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const margin = 10;
    let y = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const todayStr = formatDateLong(new Date().toISOString());
    const cw = [25, 60, 25, 30, 30, 30];
    const headers = ["Date", "Description", "Voucher", "Debit", "Credit", "Balance"];

    // Get all GL accounts sorted alphabetically (A → Z by name)
    const glAccounts = getSortedGLAccounts(accountsWithBalances);

    // Process each GL account
    glAccounts.forEach((acc, accIdx) => {
      // Reset to new page for first account or when needed
      if (accIdx > 0) {
        doc.addPage();
        y = 20;
      }

      // Header (same format as individual ledger)
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(companyName, pageWidth / 2, y, { align: 'center' });
      y += 7;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(companyAddress, pageWidth / 2, y, { align: 'center' });
      y += 6;
      doc.setFontSize(8);
      doc.text(`Print Date: ${todayStr}`, pageWidth / 2, y, { align: 'center' });
      y += 6;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(`General Ledger: ${acc.name}`, margin, y);
      y += 8;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Report Period: ${formatDateLong(reportRange.start)} to ${formatDateLong(reportRange.end)}`, margin, y);
      y += 15;

      // Table headers
      let x = margin;
      headers.forEach((h, i) => {
        doc.text(h, x, y);
        x += cw[i];
      });
      y += 5;
      doc.line(margin, y, 200, y);
      y += 7;

      // Opening balance
      doc.setFont('helvetica', 'bold');
      doc.text("Opening Balance", margin + cw[0], y);
      doc.text(acc.openingBalance.toLocaleString(), margin + cw[0] + cw[1] + cw[2] + cw[3] + cw[4], y);
      y += 7;
      doc.setFont('helvetica', 'normal');

      // Get transactions for this account
      const accountTransactions = sortTransactionsByVoucherNo(
        transactions
          .filter(tx => tx.entries.some(e => e.accountId === acc.id))
          .filter(tx => tx.date >= reportRange.start && tx.date <= reportRange.end)
      );

      // Calculate running balance
      let runningBalance = acc.openingBalance;
      // ✅ UNIVERSAL FORMULA: use (debit - credit) for ALL accounts, no type checking

      // Add transactions
      accountTransactions.forEach(tx => {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }

        const entry = tx.entries.find(e => e.accountId === acc.id)!;
        // ✅ Universal formula applies to all account types
        runningBalance += (entry.debit - entry.credit);

        let rowX = margin;
        doc.text(tx.date, rowX, y);
        rowX += cw[0];
        doc.text(tx.description.substring(0, 35), rowX, y);
        rowX += cw[1];
        doc.text(tx.voucherNo, rowX, y);
        rowX += cw[2];
        doc.text(entry.debit > 0 ? entry.debit.toLocaleString() : '-', rowX, y);
        rowX += cw[3];
        doc.text(entry.credit > 0 ? entry.credit.toLocaleString() : '-', rowX, y);
        rowX += cw[4];
        doc.text(runningBalance.toLocaleString(), rowX, y);
        y += 6;
      });

      // Add closing balance line
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      doc.line(margin, y, 200, y);
      y += 5;
      doc.setFont('helvetica', 'bold');
      doc.text("Closing Balance", margin + cw[0], y);
      doc.text(runningBalance.toLocaleString(), margin + cw[0] + cw[1] + cw[2] + cw[3] + cw[4], y);
      y += 7;
      doc.setFont('helvetica', 'normal');
    });

    // Add footers to all pages
    const addFooter = (pageNo: number, totalPages: number) => {
      doc.setPage(pageNo);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text("This is system generated ledger. No signature required for this.", margin, doc.internal.pageSize.getHeight() - 10);
      doc.text(`Page ${pageNo} of ${totalPages}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
    };

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) addFooter(i, totalPages);
    await downloadPDF(doc, `General_Ledger_${companyName.replace(/\s+/g, '')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleExportInventoryGLPDF = async (glAccountId: string) => {
    const glAccount = accounts.find(a => a.id === glAccountId);
    if (!glAccount) return;

    const doc = new jsPDF('p', 'mm', 'a4');
    const margin = 10; let y = 25; const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const todayStr = formatDateLong(new Date().toISOString());
    let pageNum = 1;

    const addHeader = () => {
      let headerY = 10;
      doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.text(companyName, pageWidth / 2, headerY, { align: 'center' }); headerY += 5;
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100); doc.text(companyAddress, pageWidth / 2, headerY, { align: 'center' }); headerY += 4;
      doc.setFontSize(7); doc.text(`Print Date: ${todayStr}`, pageWidth / 2, headerY, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.text(glAccount.name, margin, headerY + 8);
    };

    const addFooter = (pageNumber: number) => {
      doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 150, 150);
      doc.text("This is system generated ledger", margin, pageHeight - 8);
      doc.text(`Page ${pageNumber}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
    };

    addHeader();
    y = 32;
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100); doc.text(`Inventory Items as of ${todayStr}`, margin, y); y += 8;
    doc.setTextColor(0, 0, 0);

    const items = getSubLedgersForGL(inventorySubLedgers, glAccountId);
    const colWidths = [45, 18, 22, 35, 20];
    const headers = ["Item Name", "Qty", "Rate", "Value", "Item Code"];

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    let x = margin;
    headers.forEach((h, i) => {
      const isNumeric = i > 0;
      doc.text(h, x + (isNumeric ? colWidths[i] - 3 : 0), y, { align: isNumeric ? 'right' : 'left' });
      x += colWidths[i];
    });
    y += 4;
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    let totalQuantity = 0, totalValue = 0;

    items.forEach((item) => {
      if (y > pageHeight - 15) {
        addFooter(pageNum);
        doc.addPage();
        pageNum++;
        addHeader();
        y = 32;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        x = margin;
        headers.forEach((h, i) => {
          const isNumeric = i > 0;
          doc.text(h, x + (isNumeric ? colWidths[i] - 3 : 0), y, { align: isNumeric ? 'right' : 'left' });
          x += colWidths[i];
        });
        y += 4;
        doc.line(margin, y, pageWidth - margin, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
      }

      totalQuantity += item.quantity;
      totalValue += item.quantity * item.rate;

      const values = [
        item.itemName,
        item.quantity.toLocaleString(undefined, { maximumFractionDigits: 2 }),
        item.rate.toLocaleString(undefined, { maximumFractionDigits: 2 }),
        (item.quantity * item.rate).toLocaleString(undefined, { maximumFractionDigits: 2 }),
        item.itemCode || '-'
      ];

      x = margin;
      values.forEach((v, i) => {
        const isNumeric = i > 0;
        doc.text(v, x + (isNumeric ? colWidths[i] - 3 : 0), y, { align: isNumeric ? 'right' : 'left' });
        x += colWidths[i];
      });
      y += 5;
    });

    y += 2;
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text("TOTAL", margin, y);
    doc.text(totalQuantity.toLocaleString(undefined, { maximumFractionDigits: 2 }), margin + colWidths[0] + colWidths[1] - 3, y, { align: 'right' });
    doc.text(totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 }), margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] - 8, y, { align: 'right' });

    addFooter(pageNum);
    await downloadPDF(doc, `${glAccount.name.replace(/\s+/g, '_')}_Items_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleExportReportPDF = async (type: 'PL' | 'BS' | 'TB' | 'CF' | 'INVENTORY') => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const margin = 10; let y = 20; const pageWidth = doc.internal.pageSize.getWidth();
    const todayStr = formatDateLong(new Date().toISOString());

    const addFooter = (pageNo: number, totalPages: number) => {
      doc.setPage(pageNo); doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 150, 150);
      doc.text("This is system generated report. No signature required.", margin, doc.internal.pageSize.getHeight() - 10);
      doc.text(`Page ${pageNo} of ${totalPages}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
    };
    doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.text(companyName, pageWidth / 2, y, { align: 'center' }); y += 7;
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100); doc.text(companyAddress, pageWidth / 2, y, { align: 'center' }); y += 6;
    doc.setFontSize(8); doc.text(`Print Date: ${todayStr}`, pageWidth / 2, y, { align: 'center' }); y += 6;

    doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0);
    const reportTitle = type === 'PL' ? 'Income Statement' : type === 'BS' ? 'Balance Sheet' : type === 'TB' ? 'Trial Balance' : type === 'CF' ? 'Cash Flow Statement' : 'Inventory Report';
    doc.text(reportTitle, margin, y); y += 8; doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.text(`Report Period: ${formatDateLong(reportRange.start)} to ${formatDateLong(reportRange.end)}`, margin, y); y += 15;

    if (type === 'PL') {
      doc.setFont('helvetica', 'bold'); doc.text("Group Summary Account", margin, y); doc.text("Net Balance (৳)", 160, y); y += 5; doc.line(margin, y, 200, y); y += 10;

      // ✅ Use Income Statement data generator as single source of truth
      const incomeStatementData = getIncomeStatementData(accountsWithBalances);

      doc.text("INCOME", margin, y); y += 7; doc.setFont('helvetica', 'normal');
      incomeStatementData.incomeGroups.forEach(group => {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.text(group.name, margin + 5, y); doc.text(group.displayAmount.toLocaleString(), 160, y); y += 7;
      });
      if (y > 260) { doc.addPage(); y = 20; }
      y += 3; doc.setFont('helvetica', 'bold'); doc.text("Total Income", margin, y); doc.text(incomeStatementData.totalIncome.toLocaleString(), 160, y); y += 15;

      doc.text("EXPENSES", margin, y); y += 7; doc.setFont('helvetica', 'normal');
      incomeStatementData.expenseGroups.forEach(group => {
        if (y > 260) { doc.addPage(); y = 20; }
        // ✅ Display with signed value (negative for expenses) - this is critical for Net Profit calculation
        doc.text(group.name, margin + 5, y); doc.text(group.displayAmount.toLocaleString(), 160, y); y += 7;
      });
      if (y > 260) { doc.addPage(); y = 20; }
      y += 3; doc.setFont('helvetica', 'bold'); doc.text("Total Expenses", margin, y);
      // ✅ Display as signed value (should be negative)
      doc.text(incomeStatementData.totalExpense.toLocaleString(), 160, y); y += 15;

      // ✅ CRITICAL: Net Profit = Total Income + Total Expenses (direct sum with signed values)
      // Invariant: NetProfit === Sum(all displayed line items)
      doc.setFontSize(14); doc.text("Net Profit", margin, y); doc.text(incomeStatementData.netProfit.toLocaleString(), 160, y);
    } else if (type === 'BS') {
      doc.setFont('helvetica', 'bold'); doc.text("Group Summary Account", margin, y); doc.text("Net Balance (৳)", 160, y); y += 5; doc.line(margin, y, 200, y); y += 10;

      // ✅ Use Balance Sheet data generator as single source of truth
      const balanceSheetData = getBalanceSheetData(accountsWithBalances);

      doc.text("ASSETS", margin, y); y += 7; doc.setFont('helvetica', 'normal');
      balanceSheetData.assetGroups.forEach(group => {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.text(group.name, margin + 5, y); doc.text(group.displayAmount.toLocaleString(), 160, y); y += 7;
      });
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold'); doc.text("Total Assets", margin, y); doc.text(balanceSheetData.totalAssets.toLocaleString(), 160, y); y += 15;

      doc.text("LIABILITIES", margin, y); y += 7; doc.setFont('helvetica', 'normal');
      balanceSheetData.liabilityGroups.forEach(group => {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.text(group.name, margin + 5, y); doc.text(group.displayAmount.toLocaleString(), 160, y); y += 7;
      });
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold'); doc.text("Total Liabilities", margin, y); doc.text(balanceSheetData.totalLiabilities.toLocaleString(), 160, y); y += 15;

      doc.text("EQUITY", margin, y); y += 7; doc.setFont('helvetica', 'normal');
      balanceSheetData.equityGroups.forEach(group => {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.text(group.name, margin + 5, y); doc.text(group.displayAmount.toLocaleString(), 160, y); y += 7;
      });
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold'); doc.text("Total Equity", margin, y); doc.text(balanceSheetData.totalEquity.toLocaleString(), 160, y); y += 10;
      doc.line(margin, y, 200, y); y += 10; doc.text("Total Liabilities + Equity", margin, y); doc.text((balanceSheetData.totalLiabilities + balanceSheetData.totalEquity).toLocaleString(), 160, y);
    } else if (type === 'TB') {
      doc.setFont('helvetica', 'bold'); const cw = [70, 30, 30, 30, 30]; const headers = ["Account Name", "Opening", "Debit", "Credit", "Closing"]; let x = margin; headers.forEach((h, i) => { doc.text(h, x, y); x += cw[i]; }); y += 5; doc.line(margin, y, 200, y); y += 7; doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      const groupAccounts = sortAccountsAlphabetically(accountsWithBalances.filter(a => a.level === AccountLevel.GROUP));
      const pdfRows: any[] = [];
      groupAccounts.forEach(group => {
        pdfRows.push(group);
        const glAccounts = getSortedChildAccounts(accountsWithBalances, group.id).filter(a => a.level === AccountLevel.GL);
        pdfRows.push(...glAccounts);
      });

      // ✅ Calculate totals for Trial Balance PDF
      const glOnlyAccountsPDF = accountsWithBalances.filter(a => a.level === AccountLevel.GL);
      const totalDebitPDF = glOnlyAccountsPDF.reduce((sum, acc) => sum + (acc.periodDebit || 0), 0);
      const totalCreditPDF = glOnlyAccountsPDF.reduce((sum, acc) => sum + (acc.periodCredit || 0), 0);
      const isBalancedPDF = Math.abs(totalDebitPDF - totalCreditPDF) < 0.01;

      pdfRows.forEach(acc => {
        if (y > 260) {
          doc.addPage(); y = 20; doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.text(companyName, pageWidth / 2, y, { align: 'center' }); y += 8;
          doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.text(companyAddress, pageWidth / 2, y, { align: 'center' }); y += 10;
          doc.setFont('helvetica', 'bold'); let headerX = margin; headers.forEach((h, i) => { doc.text(h, headerX, y); headerX += cw[i]; }); y += 5; doc.line(margin, y, 200, y); y += 7; doc.setFont('helvetica', 'normal');
        }
        doc.setFont('helvetica', acc.level === AccountLevel.GROUP ? 'bold' : 'normal'); let rowX = margin;
        const displayName = acc.level === AccountLevel.GL ? '   ' + acc.name : acc.name;
        const rowData = [displayName.length > 35 ? displayName.substring(0, 32) + '...' : displayName, acc.openingBalance.toLocaleString(), acc.periodDebit.toLocaleString(), acc.periodCredit.toLocaleString(), acc.balance.toLocaleString()];
        rowData.forEach((val, i) => { doc.text(val.toString(), rowX, y); rowX += cw[i]; }); y += 6;
      });

      // ✅ Add totals row to Trial Balance PDF
      if (y > 250) { doc.addPage(); y = 20; }
      doc.line(margin, y, 200, y); y += 7;
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL', margin, y);
      let totalRowX = margin + cw[0];
      [0, totalDebitPDF, totalCreditPDF, 0].forEach((val, i) => {
        if (i === 1 || i === 2) { doc.text(val.toLocaleString(), totalRowX, y, { align: 'right' }); }
        totalRowX += cw[i + 1];
      });
      y += 7;
      if (!isBalancedPDF) {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
        doc.text(`⚠️ Warning: Trial Balance Not Balanced - Debit (৳${totalDebitPDF.toLocaleString()}) ≠ Credit (৳${totalCreditPDF.toLocaleString()})`, margin, y);
      }
    } else if (type === 'CF') {
      doc.setFont('helvetica', 'bold'); doc.text("Cash Flow Component", margin, y); doc.text("Amount (৳)", 160, y); y += 5; doc.line(margin, y, 200, y); y += 10;

      // Operating
      doc.text("A. Operating Activities", margin, y); y += 7; doc.setFont('helvetica', 'normal');
      if (y > 260) { doc.addPage(); y = 20; }
      doc.text("Net Profit for the Period", margin + 5, y); doc.text(cashFlowData.netProfit.toLocaleString(), 160, y); y += 7;
      cashFlowData.operatingChanges.forEach(item => {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.text(item.name, margin + 5, y); doc.text(item.change.toLocaleString(), 160, y); y += 7;
      });
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold'); doc.text("Net Cash from Operating Activities", margin, y); doc.text(cashFlowData.netOperating.toLocaleString(), 160, y); y += 12;

      // Investing
      if (y > 260) { doc.addPage(); y = 20; }
      doc.text("B. Investing Activities", margin, y); y += 7; doc.setFont('helvetica', 'normal');
      cashFlowData.investingChanges.forEach(item => {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.text(item.name, margin + 5, y); doc.text(item.change.toLocaleString(), 160, y); y += 7;
      });
      if (cashFlowData.investingChanges.length === 0) { doc.text("No investing activity", margin + 5, y); y += 7; }
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold'); doc.text("Net Cash from Investing Activities", margin, y); doc.text(cashFlowData.netInvesting.toLocaleString(), 160, y); y += 12;

      // Financing
      if (y > 260) { doc.addPage(); y = 20; }
      doc.text("C. Financing Activities", margin, y); y += 7; doc.setFont('helvetica', 'normal');
      cashFlowData.financingChanges.forEach(item => {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.text(item.name, margin + 5, y); doc.text(item.change.toLocaleString(), 160, y); y += 7;
      });
      if (cashFlowData.financingChanges.length === 0) { doc.text("No financing activity", margin + 5, y); y += 7; }
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold'); doc.text("Net Cash from Financing Activities", margin, y); doc.text(cashFlowData.netFinancing.toLocaleString(), 160, y); y += 12;

      // Reconciliation
      if (y > 260) { doc.addPage(); y = 20; }
      doc.line(margin, y, 200, y); y += 10;
      doc.text("Net Change in Cash (A+B+C)", margin, y); doc.text(cashFlowData.netChange.toLocaleString(), 160, y); y += 7;
      doc.text(`Opening Cash (${formatDateLong(reportRange.start)})`, margin, y); doc.text(cashFlowData.openingCash.toLocaleString(), 160, y); y += 7;
      doc.setFontSize(14); doc.text(`Closing Cash (${formatDateLong(reportRange.end)})`, margin, y); doc.text(cashFlowData.closingCash.toLocaleString(), 160, y);
    } else if (type === 'INVENTORY') {
      // ✅ Inventory Report PDF Export - FIXED: Proper formatting to prevent NaN
      const report = generateInventoryReport(inventorySubLedgers, inventoryMovements, reportRange.start, reportRange.end);
      if (report.length === 0) {
        doc.text("No inventory items recorded", margin, y); y += 10;
      } else {
        // ✅ Header row with all columns
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
        doc.text("Item", margin, y);
        doc.text("Open Qty", margin + 25, y);
        doc.text("Open Val", margin + 50, y);
        doc.text("Purch Qty", margin + 75, y);
        doc.text("Purch Val", margin + 100, y);
        doc.text("Sold Qty", margin + 125, y);
        doc.text("Sold Val", margin + 150, y);
        doc.text("Close Qty", margin + 175, y);
        y += 6; doc.line(margin, y, 200, y); y += 4;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7);

        let totalOpenValue = 0, totalPurchQty = 0, totalPurchVal = 0, totalSoldQty = 0, totalSoldVal = 0, totalCloseQty = 0, totalCloseVal = 0;

        report.forEach(item => {
          // ✅ CRITICAL FIX: Initialize all values with 0 to prevent NaN
          const openQty = item.openingQuantity || 0;
          const openVal = item.openingValue || 0;
          const purchQty = item.debitQuantity || 0;
          const purchVal = item.debitAmount || 0;
          const soldQty = item.creditQuantity || 0;
          const soldVal = item.creditAmount || 0;
          const closeQty = item.closingQuantity || 0;
          const closeVal = item.closingValue || 0;

          if (y > 270) {
            doc.addPage(); y = 20;
            doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
            doc.text("Item", margin, y);
            doc.text("Open Qty", margin + 25, y);
            doc.text("Open Val", margin + 50, y);
            doc.text("Purch Qty", margin + 75, y);
            doc.text("Purch Val", margin + 100, y);
            doc.text("Sold Qty", margin + 125, y);
            doc.text("Sold Val", margin + 150, y);
            doc.text("Close Qty", margin + 175, y);
            y += 6; doc.line(margin, y, 200, y); y += 4;
            doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
          }

          totalOpenValue += openVal;
          totalPurchQty += purchQty;
          totalPurchVal += purchVal;
          totalSoldQty += soldQty;
          totalSoldVal += soldVal;
          totalCloseQty += closeQty;
          totalCloseVal += closeVal;

          // ✅ Format all numeric values safely
          const itemName = (item.itemName || 'Unknown').substring(0, 15);
          doc.text(itemName, margin, y);
          doc.text(openQty.toString(), margin + 25, y, { align: 'right' });
          doc.text('৳' + Math.round(openVal).toLocaleString(), margin + 50, y, { align: 'right' });
          doc.text(purchQty.toString(), margin + 75, y, { align: 'right' });
          doc.text('৳' + Math.round(purchVal).toLocaleString(), margin + 100, y, { align: 'right' });
          doc.text(soldQty.toString(), margin + 125, y, { align: 'right' });
          doc.text('৳' + Math.round(soldVal).toLocaleString(), margin + 150, y, { align: 'right' });
          doc.text(closeQty.toString(), margin + 175, y, { align: 'right' });
          y += 4;
        });

        // ✅ Totals row with proper formatting
        if (y > 260) { doc.addPage(); y = 20; }
        y += 3; doc.setFont('helvetica', 'bold'); doc.line(margin, y, 200, y); y += 5;
        doc.text("TOTAL", margin, y);
        doc.text(totalPurchQty.toString(), margin + 75, y, { align: 'right' });
        doc.text('৳' + Math.round(totalPurchVal).toLocaleString(), margin + 100, y, { align: 'right' });
        doc.text(totalSoldQty.toString(), margin + 125, y, { align: 'right' });
        doc.text('৳' + Math.round(totalSoldVal).toLocaleString(), margin + 150, y, { align: 'right' });
        doc.text(totalCloseQty.toString(), margin + 175, y, { align: 'right' });
        y += 4;
        doc.line(margin, y, 200, y);
      }
    }
    const totalPages = doc.getNumberOfPages(); for (let i = 1; i <= totalPages; i++) addFooter(i, totalPages);
    await downloadPDF(doc, `${reportTitle}_${reportRange.start}_to_${reportRange.end}.pdf`);
  };

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;
    setIsSubmittingSupport(true);
    // Mocking a successful submission
    setTimeout(() => {
      alert("Thank you! Your request has been received. Our support team will contact you soon.");
      setSupportMessage('');
      setIsSubmittingSupport(false);
      handleBack();
    }, 1500);
  };

  if (isInitializing) return (<div className="flex h-screen items-center justify-center bg-slate-900 text-white flex-col space-y-4"><Loader2 className="animate-spin w-10 h-10 text-blue-400" /><p className="font-medium text-slate-400 uppercase tracking-widest text-[10px]">Securely Initializing...</p></div>);

  if (activeView === 'AUTH') {
    return <Login onLoginSuccess={() => setActiveView('DASHBOARD')} />;
  }

  if (activeView === 'ONBOARDING') return (<div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col p-6 max-w-lg mx-auto"><div className="flex-1 flex flex-col justify-center"><div className="flex items-center gap-4 mb-8"><div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg"><Building2 size={32} /></div><div><h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Organization Setup</h2><p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Global Ledger Initialization</p></div></div><div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-xl border dark:border-slate-700 space-y-6"><div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Company Identity</label><input type="text" placeholder="Enter Business Name" value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 p-4 rounded-2xl text-sm font-bold dark:text-white outline-none focus:border-blue-500 mb-4" /><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Company Address</label><input type="text" placeholder="Dhaka, Bangladesh" value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 p-4 rounded-2xl text-sm font-bold dark:text-white outline-none focus:border-blue-500" /></div></div></div><div className="mt-8"><button onClick={handleCompleteOnboarding} className="w-full bg-slate-900 dark:bg-blue-600 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-2">Initialize Workspace <ArrowRight size={18} /></button></div></div>);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col transition-colors">
      <header className="sticky top-0 z-20 bg-slate-900 dark:bg-black text-white px-4 py-3 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2">
          {(viewHistory.length > 0 || (activeView === 'LEDGER' && selectedLedgerAccountId) || activeView === 'SUPPORT' || activeView === 'DEVELOPER_INFO' || activeView === 'DATE_CONFIG') && (
            <button onClick={handleBack} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors text-white" aria-label="Go Back"><ChevronLeftIcon size={24} /></button>
          )}
          <RegalLogoIcon />
          <div className="ml-1 text-left"><h1 className="text-sm font-bold leading-none tracking-tight">{companyName}</h1><p className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold mt-1">{formatDateLong(reportRange.start)} to {formatDateLong(reportRange.end)}</p></div>
        </div>
        <div className="flex items-center gap-1 relative">
          {/* Network Status Indicator */}
          {!networkOnline && (
            <div className="flex items-center gap-1 px-3 py-1 bg-amber-600/20 border border-amber-600 rounded-full mr-2">
              <WifiOff size={14} className="text-amber-500" />
              <span className="text-[9px] font-bold text-amber-600 uppercase tracking-widest">Offline</span>
            </div>
          )}

          {/* Company Switcher */}
          <button onClick={() => setShowCompanySwitcher(!showCompanySwitcher)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white" title="Switch Company"><Building2 size={20} /></button>

          {showCompanySwitcher && (
            <div className="absolute right-0 top-full mt-2 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-64 z-50">
              <div className="p-4 border-b border-slate-700">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Your Companies</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {companies.length > 0 ? (
                    companies.map(company => (
                      <button
                        key={company.id}
                        onClick={() => handleSwitchCompany(company.id)}
                        className={`w-full text-left p-3 rounded-xl transition-all text-sm font-semibold ${activeCompany?.id === company.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{company.name}</span>
                          {activeCompany?.id === company.id && <CheckCircle2 size={16} />}
                        </div>
                        <div className="text-[10px] text-slate-300 mt-1">{company.address}</div>
                      </button>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400">No companies yet</div>
                  )}
                </div>
              </div>
              <div className="p-4 border-t border-slate-700">
                <button
                  onClick={() => {
                    setIsCreatingCompany(true);
                    setShowCompanySwitcher(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl text-xs font-bold uppercase transition-all"
                >
                  <Plus size={16} /> New Company
                </button>
              </div>
            </div>
          )}

          <button onClick={() => navigateTo('SETTINGS')} className={`p-2 rounded-full transition-colors ${activeView === 'SETTINGS' ? 'bg-white/20' : 'hover:bg-white/10 text-slate-400'}`}><Settings size={20} /></button>
        </div>
      </header>

      {/* Company Creation Modal */}
      {isCreatingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-white text-lg flex items-center gap-2">
                <Building2 size={20} /> Create New Company
              </h3>
            </div>
            <form onSubmit={handleCreateCompany} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider">Company Name *</label>
                <input
                  type="text"
                  placeholder="e.g., ABC Corporation"
                  value={newCompanyForm.name}
                  onChange={e => setNewCompanyForm({ ...newCompanyForm, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-2xl p-4 text-sm dark:text-white outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider">Address</label>
                <input
                  type="text"
                  placeholder="e.g., Dhaka, Bangladesh"
                  value={newCompanyForm.address}
                  onChange={e => setNewCompanyForm({ ...newCompanyForm, address: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-2xl p-4 text-sm dark:text-white outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider">FY Start Date</label>
                  <input
                    type="date"
                    value={newCompanyForm.financialYearStart}
                    onChange={e => setNewCompanyForm({ ...newCompanyForm, financialYearStart: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-2xl p-4 text-sm dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider">FY End Date</label>
                  <input
                    type="date"
                    value={newCompanyForm.financialYearEnd}
                    onChange={e => setNewCompanyForm({ ...newCompanyForm, financialYearEnd: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-2xl p-4 text-sm dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreatingCompany(false)}
                  className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white rounded-xl py-3 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCompany}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                >
                  {isCreatingCompany ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                  {isCreatingCompany ? 'Creating...' : 'Create Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAccountModalOpen && editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-sm rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-5 flex justify-between items-center border-b dark:border-slate-700"><h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">{editingAccount.id ? `Edit Account` : 'New Ledger Account'}</h3><button onClick={() => setIsAccountModalOpen(false)} className="text-slate-400"><X size={20} /></button></div>
            <form onSubmit={handleSaveAccount} className="p-5 space-y-4">
              <div className="text-left"><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Account Name</label><input type="text" readOnly={editingAccount.level === AccountLevel.MAIN} value={editingAccount.name || ''} onChange={e => setEditingAccount({ ...editingAccount, name: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-2xl p-4 text-sm dark:text-white outline-none focus:border-blue-500" /></div>
              {editingAccount.level === AccountLevel.GL && (
                <>
                  <div className="text-left"><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Group Summary Account</label><select value={editingAccount.parentAccountId || ''} onChange={e => { const parent = accounts.find(a => a.id === e.target.value); setEditingAccount({ ...editingAccount, parentAccountId: e.target.value, type: parent?.type }); }} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-2xl p-4 text-sm dark:text-white outline-none focus:border-blue-500" disabled={!!editingAccount.id}><option value="">Select a Group...</option>{sortAccountsAlphabetically(accounts.filter(a => a.level === AccountLevel.GROUP)).map(g => (<option key={g.id} value={g.id}>{g.name} ({g.code})</option>))}</select></div>
                  {editingAccount.id ? (
                    <div className="text-left"><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Account Code</label><input type="text" readOnly value={editingAccount.code || ''} className="w-full bg-slate-100 dark:bg-slate-700 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-sm dark:text-slate-300 font-bold" /></div>
                  ) : (
                    editingAccount.parentAccountId && (() => { const parent = accounts.find(a => a.id === editingAccount.parentAccountId); const groupGLs = accounts.filter(a => a.level === AccountLevel.GL && a.parentAccountId === editingAccount.parentAccountId); const groupGLCodes = groupGLs.map(a => a.code); const autoCode = generateNextGLAccountCode(parent?.code || '', groupGLCodes); return (<div className="text-left"><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Account Code (Auto-Generated)</label><input type="text" readOnly value={autoCode} className="w-full bg-slate-100 dark:bg-slate-700 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-sm dark:text-slate-300 font-bold" /></div>); })()
                  )}
                </>
              )}
              <div className="flex gap-2 pt-4">
                {editingAccount.id && editingAccount.level === AccountLevel.GL && !editingAccount.isLocked && (<button type="button" onClick={() => { if (confirm("Delete account?")) { deleteData('accounts', editingAccount.id!, db!).then(() => window.location.reload()); } }} className="p-4 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-100 transition-all"><Trash2 size={20} /></button>)}
                {editingAccount.isLocked && (<button type="button" disabled className="p-4 bg-slate-100 dark:bg-slate-700 text-slate-400 rounded-2xl cursor-not-allowed flex items-center gap-2" title="System-controlled account cannot be deleted"><Lock size={20} /></button>)}
                {editingAccount.level !== AccountLevel.MAIN && (<button type="submit" className="flex-1 bg-slate-900 dark:bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-xl">Save Changes</button>)}
              </div>
            </form>
          </div>
        </div>
      )}

      {isInventoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-sm rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-5 flex justify-between items-center border-b dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                {editingSubLedger?.id ? '✏️ Edit Item' : '➕ Add Inventory Item'}
              </h3>
              <button
                onClick={() => {
                  setIsInventoryModalOpen(false);
                  setEditingSubLedger(null);
                  setNewSubLedgerData({ itemName: '', itemCode: '', quantity: '', rate: '' });
                }}
                className="text-slate-400"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveSubLedger} className="p-5 space-y-4">
              <div className="text-left">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Item Name *</label>
                <input
                  type="text"
                  required
                  value={newSubLedgerData.itemName}
                  onChange={e => setNewSubLedgerData({ ...newSubLedgerData, itemName: e.target.value })}
                  placeholder="e.g., Widget A, Raw Cloth"
                  className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-2xl p-4 text-sm dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="text-left">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Item Code (Optional)</label>
                <input
                  type="text"
                  value={newSubLedgerData.itemCode}
                  onChange={e => setNewSubLedgerData({ ...newSubLedgerData, itemCode: e.target.value })}
                  placeholder="e.g., SKU-001"
                  className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-2xl p-4 text-sm dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="text-left">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Opening Qty</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={newSubLedgerData.quantity}
                    onChange={e => setNewSubLedgerData({ ...newSubLedgerData, quantity: e.target.value })}
                    placeholder="0"
                    className="w-full bg-slate-100 dark:bg-slate-700 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-sm dark:text-white outline-none cursor-not-allowed opacity-60"
                    disabled
                  />
                  <p className="text-[8px] text-slate-400 mt-1 italic">Managed via inventory movements</p>
                </div>
                <div className="text-left">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Unit Rate (৳) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0.01"
                    value={newSubLedgerData.rate}
                    onChange={e => setNewSubLedgerData({ ...newSubLedgerData, rate: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-2xl p-4 text-sm dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl text-[10px] text-blue-700 dark:text-blue-300 font-medium">
                💡 Opening quantity records the initial inventory. You'll update quantities via Sales/Purchase vouchers.
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsInventoryModalOpen(false);
                    setEditingSubLedger(null);
                    setNewSubLedgerData({ itemName: '', itemCode: '', quantity: '', rate: '' });
                  }}
                  className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white py-4 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-slate-900 dark:bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-xl"
                >
                  {editingSubLedger?.id ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto pb-24">
        {activeView === 'DASHBOARD' && (
          <ViewWrapper title="Business dashboard">
            <div className="grid grid-cols-2 gap-3 mb-6">
              <StatCard title="Income (Period)" amount={getIncomeStatementData(accountsWithBalances).totalIncome} icon={<TrendingUp className="text-emerald-600" size={20} />} colorClass="bg-emerald-100/50" isPrivate={isPrivateMode} />
              <StatCard title="Expenses (Period)" amount={getIncomeStatementData(accountsWithBalances).totalExpense} icon={<Receipt className="text-rose-600" size={20} />} colorClass="bg-rose-100/50" isPrivate={isPrivateMode} />
              <StatCard title="Cash Balance" amount={financialSummary.cashBalance} icon={<Wallet className="text-blue-600" size={20} />} colorClass="bg-blue-100/50" isPrivate={isPrivateMode} />
              <StatCard title="Receivable" amount={financialSummary.receivables} icon={<HandCoins className="text-indigo-600" size={20} />} colorClass="bg-indigo-100/50" isPrivate={isPrivateMode} />
              <StatCard title="Payable" amount={financialSummary.payables} icon={<ShoppingCart className="text-amber-600" size={20} />} colorClass="bg-amber-100/50" isPrivate={isPrivateMode} />
              <StatCard title="Profit (Period)" amount={financialSummary.netIncome} icon={<CheckCircle2 className="text-emerald-600" size={20} />} colorClass="bg-emerald-100/50" isPrivate={isPrivateMode} />
            </div>

            <ActivityChart stats={dashboardStats} isPrivate={isPrivateMode} />

            <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-slate-700 dark:text-slate-300">Latest Activity</h3><button onClick={() => navigateTo('TRANSACTIONS')} className="text-xs font-bold text-blue-600">Transaction history</button></div>
            <div className="space-y-3">
              {filteredTransactions.slice(-5).reverse().map(tx => (
                <div key={tx.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-sm border dark:border-slate-700"><div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${getVoucherColor(tx.voucherType)}`}>{getVoucherIcon(tx.voucherType)}</div><div className="text-left"><div className="font-bold text-sm dark:text-white">{tx.description}</div><div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{tx.voucherNo} • {tx.date}</div></div></div><div className="font-black text-sm text-slate-900 dark:text-white">{isPrivateMode ? '৳ ••••' : `৳${(tx.entries[0].debit || tx.entries[0].credit).toLocaleString()}`}</div></div>
              ))}
            </div>
          </ViewWrapper>
        )}

        {activeView === 'CHART' && (
          <ViewWrapper title="Chart of Accounts">
            <div className="flex gap-2 mb-6"><div className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Search accounts..." className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 dark:text-white rounded-2xl shadow-sm text-sm outline-none focus:ring-2 focus:ring-blue-500" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div><button onClick={openAddAccount} className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg transition-all"><Plus size={24} /></button></div>
            <div className="space-y-6 text-left">
              {accountsWithBalances.filter(a => a.level === AccountLevel.MAIN).map(main => (
                <div key={main.id}><div className="flex items-center gap-2 mb-3"><Layers size={16} className="text-blue-600" /><h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-[2px]">{main.name}</h3></div>
                  <div className="space-y-3">{accountsWithBalances.filter(g => g.level === AccountLevel.GROUP && g.parentAccountId === main.id).map(group => (
                    <div key={group.id} className="bg-white dark:bg-slate-800 rounded-[1.5rem] shadow-sm border dark:border-slate-700 overflow-hidden"><div className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors" onClick={() => toggleGroup(group.id)}><div className="flex items-center gap-3"><ChevronDown size={14} className={`text-slate-400 transition-transform ${expandedGroups.has(group.id) ? 'rotate-180' : ''}`} /><div><div className="font-bold text-sm dark:text-white flex items-center gap-2">{group.name}<button onClick={(e) => { e.stopPropagation(); openEditAccount(group); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-600 rounded text-slate-400"><Edit2 size={10} /></button></div><div className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Code: {group.code}</div></div></div><div className="text-sm font-black dark:text-white">৳{group.balance.toLocaleString()}</div></div>
                      {expandedGroups.has(group.id) && (
                        <div className="bg-slate-50 dark:bg-slate-900 divide-y dark:divide-slate-800">{getSortedChildAccounts(accountsWithBalances, group.id).filter(gl => gl.level === AccountLevel.GL && gl.name.toLowerCase().includes(searchQuery.toLowerCase())).map(gl => (<div key={gl.id} className="flex items-center justify-between p-3 px-8 cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-colors" onClick={() => openEditAccount(gl)}><div className="flex items-center gap-4"><div className="text-[10px] font-black text-slate-400 w-16">{gl.code}</div><div className="font-medium text-xs text-slate-700 dark:text-slate-300">{gl.name}</div></div><div className="text-xs font-bold text-slate-600 dark:text-slate-400">৳{gl.balance.toLocaleString()}</div></div>))}
                          <div className="p-3 px-8 text-[10px] font-bold text-blue-600 flex items-center gap-1 cursor-pointer hover:underline" onClick={() => { setEditingAccount({ name: '', type: group.type, level: AccountLevel.GL, parentAccountId: group.id, code: '' }); setIsAccountModalOpen(true); }}><Plus size={10} /> New Ledger</div>
                        </div>)}
                    </div>))}
                  </div>
                </div>))}
            </div>
          </ViewWrapper>
        )}

        {activeView === 'BACKUP_RESTORE' && (
          <ViewWrapper title="Backup & Restore">
            <div className="space-y-6 text-left">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-xl border dark:border-slate-700">
                <h3 className="font-black dark:text-white flex items-center gap-2 mb-4"><Download size={20} className="text-emerald-600" /> Local Backup</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border dark:border-slate-700">
                    <div><h4 className="font-bold text-sm dark:text-white">Download Backup</h4><p className="text-[10px] text-slate-400 font-medium">Save as JSON file to your computer</p></div>
                    <button onClick={handleLocalBackup} className="bg-emerald-600 text-white p-3 rounded-xl shadow-lg active:scale-95 transition-all"><Download size={18} /></button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border dark:border-slate-700">
                    <div><h4 className="font-bold text-sm dark:text-white">Import Backup</h4><p className="text-[10px] text-slate-400 font-medium">Restore from previously saved file</p></div>
                    <label className="bg-blue-600 text-white p-3 rounded-xl shadow-lg cursor-pointer active:scale-95 transition-all"><Upload size={18} /><input type="file" accept=".json" onChange={handleLocalRestore} className="hidden" /></label>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-xl border dark:border-slate-700">
                <h3 className="font-black dark:text-white flex items-center gap-2 mb-4"><CloudUpload size={20} className="text-blue-600" /> Google Drive Sync</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border dark:border-slate-700">
                    <div><h4 className="font-bold text-sm dark:text-white">Manual Backup</h4><p className="text-[10px] text-slate-400 font-medium">Instantly save current state to Drive</p></div>
                    <button onClick={handleManualBackup} disabled={isManualBackupLoading} className="bg-blue-600 text-white p-3 rounded-xl shadow-lg active:scale-95 disabled:opacity-50 transition-all">{isManualBackupLoading ? <Loader2 className="animate-spin" size={18} /> : <CloudUpload size={18} />}</button>
                  </div>

                  {lastBackupTime && (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                      <p className="text-[9px] text-emerald-700 dark:text-emerald-400 font-black uppercase">✅ Last Backup</p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-300 mt-1 font-bold">{lastBackupTime}</p>
                    </div>
                  )}

                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                      <div><h4 className="font-bold text-sm dark:text-white">Auto Backup</h4><p className="text-[10px] text-slate-400 font-medium">Automatic sync every {backupFrequency.toLowerCase()}</p></div>
                      <button onClick={() => handleAutoBackupToggle(!autoBackupEnabled)} className={`w-12 h-6 rounded-full relative transition-colors ${autoBackupEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}><div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${autoBackupEnabled ? 'left-7' : 'left-1'}`}></div></button>
                    </div>
                    {autoBackupEnabled && (
                      <div className="space-y-3">
                        <p className="text-[9px] text-emerald-600 font-bold uppercase">✅ Auto-backup enabled</p>
                        <div className="flex gap-2">
                          {['Daily', 'Weekly', 'Monthly'].map(freq => (
                            <button key={freq} onClick={() => handleBackupFrequencyChange(freq as 'Daily' | 'Weekly' | 'Monthly')} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${backupFrequency === freq ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-400 border dark:border-slate-700'}`}>{freq}</button>
                          ))}
                        </div>
                      </div>
                    )}
                    {!autoBackupEnabled && (
                      <p className="text-[9px] text-slate-400 font-bold uppercase">ℹ️ Enable auto-backup to protect your data</p>
                    )}
                  </div>

                  {backupHistory.length > 0 && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border dark:border-slate-700">
                      <button onClick={() => setShowBackupHistory(!showBackupHistory)} className="w-full flex items-center justify-between font-bold text-sm dark:text-white mb-3 hover:text-blue-600 dark:hover:text-blue-400 transition">
                        <span className="flex items-center gap-2"><HistoryIcon size={16} /> Backup History ({backupHistory.length})</span>
                        <span className={`transition-transform ${showBackupHistory ? 'rotate-180' : ''}`}>▼</span>
                      </button>
                      {showBackupHistory && (
                        <div className="space-y-2 mt-3 max-h-64 overflow-y-auto">
                          {backupHistory.map((backup, idx) => (
                            <div key={idx} className={`p-3 rounded-xl text-[9px] ${backup.status === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
                              <div className="flex items-center justify-between">
                                <span className={`font-black uppercase ${backup.status === 'success' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                                  {backup.status === 'success' ? '✅ Success' : '❌ Failed'}
                                </span>
                                <span className="text-slate-500 dark:text-slate-400 font-bold">{backup.timestamp}</span>
                              </div>
                              <p className="text-slate-600 dark:text-slate-400 mt-1 truncate">{backup.fileName}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-xl border dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black dark:text-white flex items-center gap-2"><HistoryIcon size={20} className="text-emerald-600" /> Restore Points</h3>
                  {driveToken && backupFiles.length > 0 && (
                    <button onClick={handleRestoreBackup} disabled={isBackupLoading} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase shadow-lg active:scale-95 disabled:opacity-50 transition-all">
                      {isBackupLoading ? <Loader2 className="inline animate-spin mr-1" size={14} /> : '↻ Restore Latest'}
                    </button>
                  )}
                </div>
                {!networkOnline ? (
                  <div className="w-full py-6 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-2xl text-center">
                    <p className="text-xs font-black uppercase text-amber-600 dark:text-amber-400">🔌 Offline Mode</p>
                    <p className="text-[10px] text-amber-600 dark:text-amber-300 mt-1">Connect to internet to access cloud backups</p>
                  </div>
                ) : !driveToken ? (
                  <button onClick={handleAuthorizeDrive} className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-[11px] font-black uppercase text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50">Authorize Google Drive to see backups</button>
                ) : isBackupLoading ? (
                  <div className="flex flex-col items-center py-8 text-slate-400"><Loader2 className="animate-spin mb-2" size={32} /><p className="text-xs font-black uppercase tracking-widest">Fetching Backups...</p></div>
                ) : backupFiles.length === 0 ? (
                  <div className="text-center py-8 text-slate-400"><TriangleAlert className="mx-auto mb-2" size={32} /><p className="text-xs font-bold">No backups found in your Drive.</p></div>
                ) : (
                  <div className="space-y-3">
                    {backupFiles.map(file => (
                      <div key={file.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border dark:border-slate-700 flex justify-between items-center group">
                        <div className="flex-1">
                          <h4 className="font-black text-xs dark:text-white truncate">{file.companyName}</h4>
                          <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{new Date(file.createdTime).toLocaleString()}</p>
                        </div>
                        <button onClick={() => handleRestoreFromDrive(file)} className="p-3 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl opacity-0 group-hover:opacity-100 transition-all"><CloudDownload size={18} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ViewWrapper>
        )}

        {activeView === 'SETTINGS' && (
          <ViewWrapper title="Workspace Settings">
            <div className="space-y-6 text-left">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-sm border dark:border-slate-700">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black dark:text-white flex items-center gap-2"><UserIcon size={20} className="text-blue-600" /> Profile</h3>
                  <button onClick={handleSignOut} className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl hover:bg-rose-100 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                    <LockKeyhole size={14} /> Sign Out
                  </button>
                </div>
                <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border dark:border-slate-700">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-200 border-2 border-white shadow-md"><img src={user?.photoUrl || APP_CONFIG.FIREBASE.PHOTO_URL} alt="Profile" className="w-full h-full object-cover" /></div>
                  <div className="flex-1">
                    <h4 className="font-black text-slate-800 dark:text-white leading-tight">{user?.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* COMPANY MANAGEMENT SECTION */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-sm border dark:border-slate-700">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black dark:text-white flex items-center gap-2">
                    <Building2 size={20} className="text-emerald-600" />
                    Companies ({companies.length})
                  </h3>
                  <button
                    onClick={() => setIsCreatingCompany(true)}
                    className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-all"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <div className="space-y-3">
                  {companies.length > 0 ? (
                    companies.map(company => (
                      <div
                        key={company.id}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${activeCompany?.id === company.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-50 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                          }`}
                        onClick={() => handleSwitchCompany(company.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-bold dark:text-white flex items-center gap-2">
                              {company.name}
                              {activeCompany?.id === company.id && <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full font-black">ACTIVE</span>}
                            </h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{company.address}</p>
                            <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-2">
                              FY: {formatDateLong(company.financialYear.startDate)} → {formatDateLong(company.financialYear.endDate)}
                            </p>
                          </div>
                          <ChevronRight size={16} className="text-slate-400 mt-1" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                      <Building2 size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-semibold">No companies yet</p>
                      <p className="text-[10px] mt-1">Create your first company to get started</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-sm border dark:border-slate-700">
                <h3 className="font-black dark:text-white mb-6 flex items-center gap-2"><Settings size={20} className="text-slate-600" /> Display & Tools</h3>
                <div className="space-y-3">
                  <button onClick={() => setIsPrivateMode(!isPrivateMode)} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between group active:scale-95 transition-all">
                    <div className="flex items-center gap-3">
                      {isPrivateMode ? <EyeOff size={18} className="text-slate-400" /> : <Eye size={18} className="text-blue-600" />}
                      <span className="text-sm font-bold dark:text-white">{isPrivateMode ? 'Show Balances' : 'Hide Balances (Private)'}</span>
                    </div>
                    <ChevronRight size={16} className="text-slate-300" />
                  </button>
                  <button onClick={handleFetchAdvice} disabled={isAiLoading || !networkOnline} title={!networkOnline ? 'Connect to internet for AI insights' : ''} className={`w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between group active:scale-95 transition-all ${!networkOnline ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <div className="flex items-center gap-3">
                      {isAiLoading ? <Loader2 size={18} className="animate-spin text-blue-400" /> : <Sparkles size={18} className={!networkOnline ? 'text-slate-400' : 'text-blue-400'} />}
                      <span className={`text-sm font-bold ${!networkOnline ? 'text-slate-400 dark:text-slate-500' : 'dark:text-white'}`}>{!networkOnline ? 'Offline - AI Insights Unavailable' : 'Get AI Insights'}</span>
                    </div>
                    <ChevronRight size={16} className="text-slate-300" />
                  </button>
                  <button onClick={() => navigateTo('DATE_CONFIG')} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between group active:scale-95 transition-all">
                    <div className="flex items-center gap-3">
                      <Clock size={18} className="text-emerald-500" />
                      <span className="text-sm font-bold dark:text-white">Active Date Range</span>
                    </div>
                    <ChevronRight size={16} className="text-slate-300" />
                  </button>
                </div>
              </div>

              {/* PLAN SELECTION SECTION */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-sm border dark:border-slate-700">
                <h3 className="font-black dark:text-white mb-6 flex items-center gap-2"><Package size={20} className="text-purple-600" /> Subscription Plan</h3>
                <div className="space-y-3">
                  {/* BASIC PLAN OPTION */}
                  <button
                    onClick={() => {
                      if (planType !== 'BASIC') {
                        const confirmed = window.confirm(
                          '⚠️ Switch to Basic Plan?\n\n' +
                          'This will disable all inventory features and remove item tracking from Sales/Purchase vouchers.\n\n' +
                          'Your accounting data will be preserved, but inventory sub-ledgers will not be visible.\n\n' +
                          'You can switch back anytime.'
                        );
                        if (confirmed) {
                          setPlanType('BASIC');
                          setPlanTypeState('BASIC');
                          saveCompanySettings({});
                          alert('✅ Switched to Basic Plan (No Inventory)');
                        }
                      }
                    }}
                    className={`w-full p-4 rounded-2xl transition-all active:scale-95 ${planType === 'BASIC'
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-600'
                      : 'bg-slate-50 dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${planType === 'BASIC'
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-slate-300 dark:border-slate-600'
                        }`}>
                        {planType === 'BASIC' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                      </div>
                      <div className="text-left flex-1">
                        <h4 className="font-black text-slate-800 dark:text-white">🔵 Basic Plan</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Pure accounting - no inventory tracking</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-semibold">✓ Journal, Payment & Receipt Vouchers</p>
                      </div>
                    </div>
                  </button>

                  {/* MODERATE PLAN OPTION */}
                  <button
                    onClick={() => {
                      if (planType !== 'MODERATE') {
                        const confirmed = window.confirm(
                          '✅ Switch to Moderate Plan?\n\n' +
                          'This will enable inventory management with automated COGS posting.\n\n' +
                          'You can track items, create Sales/Purchase vouchers with inventory, and monitor stock levels.\n\n' +
                          'Your existing data will be preserved.'
                        );
                        if (confirmed) {
                          setPlanType('MODERATE');
                          setPlanTypeState('MODERATE');
                          saveCompanySettings({});
                          alert('✅ Switched to Moderate Plan (With Inventory)');
                        }
                      }
                    }}
                    className={`w-full p-4 rounded-2xl transition-all active:scale-95 ${planType === 'MODERATE'
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-600'
                      : 'bg-slate-50 dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${planType === 'MODERATE'
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-slate-300 dark:border-slate-600'
                        }`}>
                        {planType === 'MODERATE' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                      </div>
                      <div className="text-left flex-1">
                        <h4 className="font-black text-slate-800 dark:text-white">✅ Moderate Plan</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Full accounting with inventory management</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-semibold">✓ Sales, Purchase + All Voucher Types</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-sm border dark:border-slate-700">
                <h3 className="font-black dark:text-white mb-6 flex items-center gap-2"><LifeBuoy size={20} className="text-blue-500" /> Help & Support</h3>
                <button onClick={() => navigateTo('SUPPORT')} className="w-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm flex items-center justify-center gap-2 border border-blue-100 dark:border-blue-800 mb-3"><LifeBuoy size={16} /> Get Assistance</button>
                <button onClick={() => navigateTo('DEVELOPER_INFO')} className="w-full bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm flex items-center justify-center gap-2 border border-slate-100 dark:border-slate-600"><Info size={16} /> Developer Info</button>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-sm border dark:border-slate-700">
                <h3 className="font-black dark:text-white mb-6 flex items-center gap-2"><Database size={20} className="text-emerald-600" /> Cloud Sync</h3>
                <button onClick={() => navigateTo('BACKUP_RESTORE')} className="w-full bg-slate-900 dark:bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"><Database size={16} /> Backup & Restore</button>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-sm border dark:border-slate-700">
                <h3 className="font-black dark:text-white mb-6 flex items-center gap-2"><Building2 size={20} className="text-indigo-600" /> Company Info</h3>
                <div className="space-y-4">
                  <div><label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest flex items-center gap-1"><Building2 size={10} /> Business Name</label><input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-2xl p-4 text-sm font-bold dark:text-white outline-none focus:border-blue-500" /></div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest flex items-center gap-1"><MapPin size={10} /> Address</label><input type="text" value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-2xl p-4 text-sm font-bold dark:text-white outline-none focus:border-blue-500" /></div>
                  <p className="text-[8px] text-slate-500 dark:text-slate-400 italic">💾 Auto-saved to device storage</p>
                </div>
              </div>

              {/* Delete All Data Section */}
              <div className="bg-rose-50 dark:bg-rose-950/20 p-6 rounded-[2.5rem] shadow-sm border border-rose-200 dark:border-rose-900/50">
                <h3 className="font-black text-rose-600 dark:text-rose-400 mb-4 flex items-center gap-2"><TriangleAlert size={20} /> Danger Zone</h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 mb-4 font-medium">Delete all your custom data. System defaults are preserved.</p>
                <button onClick={handleInitiateDelete} className="w-full bg-rose-600 hover:bg-rose-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-colors active:scale-95"><Trash2 size={16} /> Delete My Data</button>
              </div>

              <div className="pt-4 text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[2px]">Hisab Pati v{APP_VERSION}</p>
              </div>
            </div>
          </ViewWrapper>
        )}

        {activeView === 'DEVELOPER_INFO' && (
          <ViewWrapper title="Developer Info">
            <div className="space-y-6 text-left">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-xl border dark:border-slate-700">
                <div className="mb-8 border-b dark:border-slate-700 pb-4">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Regal Tax & Accounting Solutions BD</h3>
                  <p className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-1">Digital Support Wings</p>
                </div>

                <div className="space-y-8">
                  {[
                    { name: "Morshedul Islam Munna", title: "Managing Director", mobile: "+880 1778 698381", email: "morshedulislammunna37@gmail.com" },
                    { name: "Ribon Islam", title: "Director, Corporate Affairs Division", mobile: "+880 1305 838846", email: "ribonislam516@gmail.com" },
                    { name: "Shihabul Islam Alvi", title: "Director of IT Operations", mobile: "+880 1707 399809", email: "as.alvi.md@gmail.com" },
                    { name: "Rashedul Islam Rashed", title: "Chief Marketing Officer (CMO)", mobile: "+880 1750 691876", email: "mdrashedislam309@gmail.com" }
                  ].map((dev, idx) => (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-3xl border border-slate-100 dark:border-slate-700">
                      <h4 className="font-black text-slate-900 dark:text-white text-lg">{dev.name}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-4">{dev.title}</p>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                            <Phone size={14} className="text-blue-500" /> {dev.mobile}
                          </div>
                          <CopyButton text={dev.mobile} />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                            <Mail size={14} className="text-rose-500" /> <span className="truncate max-w-[200px]">{dev.email}</span>
                          </div>
                          <CopyButton text={dev.email} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-slate-900 dark:bg-black rounded-2xl text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[2px]">Built with Professional Precision</p>
              </div>
            </div>
          </ViewWrapper>
        )}

        {activeView === 'DATE_CONFIG' && (
          <ViewWrapper title="Report Configuration">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-xl border dark:border-slate-700 space-y-6 text-left">
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl"><CalendarDays size={24} /></div>
                <div>
                  <h3 className="font-black dark:text-white">Date Range Selection</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Set active reporting period</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest block mb-2">From Date (Opening Balance Point)</label>
                  <input type="date" value={reportRange.start} onChange={e => setReportRange(prev => ({ ...prev, start: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-2xl p-4 text-sm font-bold dark:text-white outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest block mb-2">To Date (Closing Balance Point)</label>
                  <input type="date" value={reportRange.end} onChange={e => setReportRange(prev => ({ ...prev, end: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-2xl p-4 text-sm font-bold dark:text-white outline-none focus:border-blue-500" />
                </div>
              </div>
              <button onClick={handleBack} className="w-full bg-slate-900 dark:bg-blue-600 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-2">Apply Configuration <CheckCircle2 size={18} /></button>
            </div>
          </ViewWrapper>
        )}

        {activeView === 'SUPPORT' && (
          <ViewWrapper title="Help & Support">
            <div className="space-y-6 text-left">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-xl border dark:border-slate-700">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl"><MessageSquare size={24} /></div>
                  <div>
                    <h3 className="font-black dark:text-white">Contact Us</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Describe your issue below</p>
                  </div>
                </div>
                <form onSubmit={handleSupportSubmit} className="space-y-5">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Problem Category</label>
                    <select
                      value={supportCategory}
                      onChange={e => setSupportCategory(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 p-4 rounded-2xl text-sm font-bold dark:text-white"
                    >
                      <option>General Inquiry</option>
                      <option>Technical Bug</option>
                      <option>Feature Request</option>
                      <option>Account/Login Issues</option>
                      <option>Drive Backup Issues</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Detailed Message</label>
                    <textarea
                      required
                      placeholder="Explain your issue clearly..."
                      value={supportMessage}
                      onChange={e => setSupportMessage(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 p-4 rounded-2xl text-sm font-bold dark:text-white min-h-[150px] outline-none focus:border-blue-500"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmittingSupport}
                    className="w-full bg-slate-900 dark:bg-blue-600 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-2"
                  >
                    {isSubmittingSupport ? <Loader2 className="animate-spin" size={18} /> : <>Send Message <ArrowRight size={18} /></>}
                  </button>
                </form>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border dark:border-slate-700">
                <h3 className="font-black dark:text-white flex items-center gap-2 mb-4"><Info size={20} className="text-slate-400" /> App Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Version</span>
                    <span className="text-xs font-black dark:text-white">{APP_VERSION}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Environment</span>
                    <span className="text-xs font-black dark:text-white">PWA / Offline</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Database</span>
                    <span className="text-xs font-black dark:text-white">IndexedDB (Local)</span>
                  </div>
                </div>
              </div>
            </div>
          </ViewWrapper>
        )}

        {activeView === 'TRANSACTIONS' && (
          <ViewWrapper title="Transaction history">
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">{(['ALL', 'SALES', 'PURCHASE', 'RECEIPT', 'PAYMENT', 'JOURNAL'] as const).map(type => (<button key={type} onClick={() => setHistoryFilter(type)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${historyFilter === type ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-400 border dark:border-slate-700'}`}>{type}</button>))}</div>
            <div className="space-y-4">
              {sortTransactionsByVoucherNo(filteredTransactions).map(tx => (
                <div key={tx.id} className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border dark:border-slate-700 transition-colors group relative text-left">
                  {/* Action Buttons */}
                  <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handlePrintVoucher(tx.id)} className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl" title="Print voucher">
                      <Printer size={16} />
                    </button>
                    <button onClick={() => { setEditingTransactionId(tx.id); navigateTo('ADD_TRANSACTION'); }} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={async () => { if (confirm("Delete voucher? This will reverse all inventory movements.")) { try { if (tx.voucherType === 'SALES' || tx.voucherType === 'PURCHASE') { const relatedMovements = getMovementsForTransaction(tx.id, inventoryMovements); for (const movement of relatedMovements) { await deleteData('inventoryMovements', movement.id, db!); } } await deleteData('transactions', tx.id, db!); const updatedTransactions = await getAllForUser<Transaction>('transactions', user!.id, db!); const updatedMovements = await getAllForUser<InventoryMovement>('inventoryMovements', user!.id, db!); setTransactions(updatedTransactions); setInventoryMovements(updatedMovements); alert('✅ Voucher and inventory movements deleted successfully'); } catch (error) { console.error('Delete error:', error); alert('❌ Failed to delete voucher'); } } }} className="p-2 text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl">
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Header */}
                  <div className="flex justify-between items-start mb-4 pr-16">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center ${getVoucherColor(tx.voucherType)}`}>
                        {getVoucherIcon(tx.voucherType)}
                      </div>
                      <div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{tx.voucherType} • {tx.voucherNo}</div>
                        <h4 className="font-black dark:text-white mt-0.5">{tx.description}</h4>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-lg dark:text-white leading-none">৳{(tx.entries[0].debit || tx.entries[0].credit).toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{tx.date}</div>
                    </div>
                  </div>

                  {/* Items Table (for SALES/PURCHASE) */}
                  {(tx.voucherType === 'SALES' || tx.voucherType === 'PURCHASE') && tx.itemLines && tx.itemLines.length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-3 mb-3 border border-blue-200 dark:border-blue-800">
                      <div className="text-[9px] font-black text-blue-700 dark:text-blue-300 uppercase mb-2">Items</div>
                      <div className="space-y-1">
                        {tx.itemLines.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-[10px] font-medium">
                            <span className="text-slate-700 dark:text-slate-300 truncate flex-1">{item.itemName}</span>
                            <span className="text-slate-600 dark:text-slate-400 ml-2 min-w-fit">Qty: {item.quantity.toFixed(2)}</span>
                            <span className="text-emerald-600 dark:text-emerald-400 ml-2 min-w-fit font-black">৳{(item.quantity * item.rate).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Accounting Entries */}
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-3 space-y-2">
                    {tx.entries.map((e, idx) => (
                      <div key={idx} className="flex justify-between text-[11px] font-medium">
                        <span className="text-slate-500 italic">{e.debit > 0 ? 'Dr.' : 'Cr.'} {accountsWithBalances.find(a => a.id === e.accountId)?.name}</span>
                        <span className="dark:text-white font-black">৳{(e.debit || e.credit).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ViewWrapper>
        )}

        {activeView === 'ADD_TRANSACTION' && (
          <ViewWrapper title={editingTransactionId ? "Modify Voucher" : "Create Voucher"} fabOffset={false}>
            <div className="grid grid-cols-5 gap-1.5 mb-6 bg-white dark:bg-slate-800 p-2 rounded-3xl shadow-sm border dark:border-slate-700">{(
              planType === 'MODERATE'
                ? (['SALES', 'PURCHASE', 'RECEIPT', 'PAYMENT', 'JOURNAL'] as VoucherType[])
                : (['RECEIPT', 'PAYMENT', 'JOURNAL'] as VoucherType[])
            ).map(type => (<button key={type} disabled={!!editingTransactionId} onClick={() => handleVoucherSelect(type)} className={`py-3 px-1 flex flex-col items-center gap-2 rounded-2xl transition-all ${newTx.voucherType === type ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-xl scale-105' : 'text-slate-400'}`}>{getVoucherIcon(type)}<span className="text-[7px] font-black uppercase tracking-tighter">{type}</span></button>))}</div>

            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-xl border dark:border-slate-700 space-y-5 text-left">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Posting Date</label>
                    <input type="date" required value={newTx.date} onChange={e => setNewTx(p => ({ ...p, date: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-2xl p-4 text-sm font-bold dark:text-white" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Voucher No.</label>
                    <input type="text" value={newTx.voucherNo} readOnly className="w-full bg-slate-100 dark:bg-slate-700 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-sm font-black" placeholder="Auto-gen" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                  <input type="text" placeholder="Purpose..." value={newTx.description} onChange={e => setNewTx(p => ({ ...p, description: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-2xl p-4 text-sm font-bold dark:text-white" />
                </div>

                {/* SALES Voucher - Inventory Items (MODERATE Plan Only) */}
                {newTx.voucherType === 'SALES' && planType === 'MODERATE' && (
                  <div className="space-y-4 pt-4 border-t dark:border-slate-700">
                    <h3 className="font-black text-sm text-slate-800 dark:text-white flex items-center gap-2">
                      <ShoppingCart size={16} className="text-emerald-600" /> Sales Items
                    </h3>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Customer (A/R Account)</label>
                      <select value={newTx.debitAccount} onChange={e => setNewTx(p => ({ ...p, debitAccount: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-2xl p-4 text-sm font-bold dark:text-white">
                        <option value="">Select Customer...</option>
                        {getReceivableGLAccounts(accounts).map(a => <option key={a.id} value={a.id}>{a.name} ({a.code})</option>)}
                      </select>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl space-y-3">
                      <div className="space-y-2">
                        {/* Header Row */}
                        <div className="grid grid-cols-4 gap-2 mb-3 pb-3 border-b-2 border-slate-200 dark:border-slate-700">
                          <div className="text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase">Item</div>
                          <div className="text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase">Qty</div>
                          <div className="text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase">Price</div>
                          <div className="text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase">Amount</div>
                        </div>

                        {/* Item Entry Row */}
                        <div className="grid grid-cols-4 gap-2 mb-2 pb-3 bg-white dark:bg-slate-800 p-2 rounded-xl">
                          <select
                            onChange={e => {
                              const selectedSL = inventorySubLedgers.find(sl => sl.id === e.target.value);
                              if (selectedSL) {
                                setVoucherItems([...voucherItems, {
                                  id: crypto.randomUUID(),
                                  subLedgerId: selectedSL.id,
                                  inventoryGLAccountId: selectedSL.inventoryGLAccountId,
                                  itemName: selectedSL.itemName,
                                  quantity: 1,
                                  rate: selectedSL.rate
                                }]);
                                e.target.value = '';
                              }
                            }}
                            value=""
                            className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded p-2 text-[10px] font-medium"
                          >
                            <option value="">+ Add Item</option>
                            {inventorySubLedgers.filter(sl =>
                              accounts.find(a => a.id === sl.inventoryGLAccountId)
                            ).map(sl => (
                              <option key={sl.id} value={sl.id}>{sl.itemName} (Qty: {sl.quantity})</option>
                            ))}
                          </select>
                          <div></div>
                          <div></div>
                          <div></div>
                        </div>

                        {/* Added Items Rows */}
                        {voucherItems.length === 0 ? (
                          <div className="text-center py-4 text-[10px] text-slate-400 font-medium">
                            Select an item from the dropdown above to add to voucher
                          </div>
                        ) : (
                          voucherItems.map((item, idx) => (
                            <div key={item.id} className="grid grid-cols-4 gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl items-center">
                              <div className="text-[10px] font-bold text-slate-700 dark:text-white truncate">{item.itemName}</div>
                              <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={item.quantity}
                                onChange={e => updateVoucherItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded p-2 text-[10px] font-medium"
                              />
                              <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={item.rate}
                                onChange={e => updateVoucherItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                                className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded p-2 text-[10px] font-medium"
                              />
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-emerald-600">৳{(item.quantity * item.rate).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                <button
                                  type="button"
                                  onClick={() => removeVoucherItem(item.id)}
                                  className="p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-700 dark:text-white">Total Amount:</span>
                        <span className="text-lg font-black text-emerald-600">৳{getTotalVoucherAmount().toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* PURCHASE Voucher - Inventory Items (MODERATE Plan Only) */}
                {newTx.voucherType === 'PURCHASE' && planType === 'MODERATE' && (
                  <div className="space-y-4 pt-4 border-t dark:border-slate-700">
                    <h3 className="font-black text-sm text-slate-800 dark:text-white flex items-center gap-2">
                      <ShoppingBag size={16} className="text-rose-600" /> Purchase Items
                    </h3>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Supplier (A/P Account)</label>
                      <select value={newTx.creditAccount} onChange={e => setNewTx(p => ({ ...p, creditAccount: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-2xl p-4 text-sm font-bold dark:text-white">
                        <option value="">Select Supplier...</option>
                        {getPayableGLAccounts(accounts).map(a => <option key={a.id} value={a.id}>{a.name} ({a.code})</option>)}
                      </select>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl space-y-3">
                      <div className="space-y-2">
                        {/* Header Row */}
                        <div className="grid grid-cols-4 gap-2 mb-3 pb-3 border-b-2 border-slate-200 dark:border-slate-700">
                          <div className="text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase">Item</div>
                          <div className="text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase">Qty</div>
                          <div className="text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase">Price</div>
                          <div className="text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase">Amount</div>
                        </div>

                        {/* Item Entry Row */}
                        <div className="grid grid-cols-4 gap-2 mb-2 pb-3 bg-white dark:bg-slate-800 p-2 rounded-xl">
                          <select
                            onChange={e => {
                              const selectedSL = inventorySubLedgers.find(sl => sl.id === e.target.value);
                              if (selectedSL) {
                                setVoucherItems([...voucherItems, {
                                  id: crypto.randomUUID(),
                                  subLedgerId: selectedSL.id,
                                  inventoryGLAccountId: selectedSL.inventoryGLAccountId,
                                  itemName: selectedSL.itemName,
                                  quantity: 1,
                                  rate: selectedSL.rate
                                }]);
                                e.target.value = '';
                              }
                            }}
                            value=""
                            className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded p-2 text-[10px] font-medium"
                          >
                            <option value="">+ Add Item</option>
                            {inventorySubLedgers.filter(sl =>
                              accounts.find(a => a.id === sl.inventoryGLAccountId)
                            ).map(sl => (
                              <option key={sl.id} value={sl.id}>{sl.itemName} (Qty: {sl.quantity})</option>
                            ))}
                          </select>
                          <div></div>
                          <div></div>
                          <div></div>
                        </div>

                        {/* Added Items Rows */}
                        {voucherItems.length === 0 ? (
                          <div className="text-center py-4 text-[10px] text-slate-400 font-medium">
                            Select an item from the dropdown above to add to voucher
                          </div>
                        ) : (
                          voucherItems.map((item, idx) => (
                            <div key={item.id} className="grid grid-cols-4 gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl items-center">
                              <div className="text-[10px] font-bold text-slate-700 dark:text-white truncate">{item.itemName}</div>
                              <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={item.quantity}
                                onChange={e => updateVoucherItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded p-2 text-[10px] font-medium"
                              />
                              <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={item.rate}
                                onChange={e => updateVoucherItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                                className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded p-2 text-[10px] font-medium"
                              />
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-emerald-600">৳{(item.quantity * item.rate).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                <button
                                  type="button"
                                  onClick={() => removeVoucherItem(item.id)}
                                  className="p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-700 dark:text-white">Total Amount:</span>
                        <span className="text-lg font-black text-emerald-600">৳{getTotalVoucherAmount().toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Regular Vouchers - Traditional Entry */}
                {(newTx.voucherType === 'RECEIPT' || newTx.voucherType === 'PAYMENT' || newTx.voucherType === 'JOURNAL') && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount (৳)</label>
                      <input type="number" required step="0.01" min="0.01" placeholder="0.00" value={newTx.amount} onChange={e => setNewTx(p => ({ ...p, amount: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-2xl p-4 text-sm font-black dark:text-white" />
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dr Account</label>
                        <select required value={newTx.debitAccount} onChange={e => setNewTx(p => ({ ...p, debitAccount: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-2xl p-4 text-sm font-bold dark:text-white">
                          <option value="">Select Account...</option>
                          {getSortedGLAccounts(accountsWithBalances).map(a => <option key={a.id} value={a.id}>{a.name} ({a.code})</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cr Account</label>
                        <select required value={newTx.creditAccount} onChange={e => setNewTx(p => ({ ...p, creditAccount: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-2xl p-4 text-sm font-bold dark:text-white">
                          <option value="">Select Account...</option>
                          {getSortedGLAccounts(accountsWithBalances).map(a => <option key={a.id} value={a.id}>{a.name} ({a.code})</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={handleBack} className="flex-1 bg-white dark:bg-slate-800 py-5 rounded-[2rem] font-black text-xs uppercase border">Cancel</button>
                <button type="submit" disabled={(newTx.voucherType === 'SALES' || newTx.voucherType === 'PURCHASE') ? voucherItems.length === 0 : (newTx.debitAccount === newTx.creditAccount)} className="flex-[2] bg-slate-900 dark:bg-blue-600 text-white py-5 rounded-[2rem] font-black text-xs uppercase shadow-2xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  <CheckCircle2 size={18} /> {editingTransactionId ? 'Update' : 'Confirm'}
                </button>
              </div>
            </form>
          </ViewWrapper>
        )}

        {activeView === 'LEDGER' && (
          <ViewWrapper title={selectedLedgerAccountId ? "GL Summary" : "Ledgers"}>
            {!selectedLedgerAccountId ? (
              <div className="space-y-4">
                <button onClick={handleExportAllLedgersPDF} className="w-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm flex items-center justify-center gap-2 border border-emerald-200 dark:border-emerald-900/50 mb-4">
                  <FileJson size={16} /> Export All Ledgers to PDF
                </button>
                <div className="space-y-3">
                  {getSortedGLAccounts(accountsWithBalances).map(acc => (
                    <button key={acc.id} onClick={() => setSelectedLedgerAccountId(acc.id)} className="w-full bg-white dark:bg-slate-800 p-5 rounded-3xl flex items-center justify-between shadow-sm border dark:border-slate-700 text-left">
                      <div>
                        <div className="font-black text-sm text-slate-800 dark:text-white">{acc.name}</div>
                        <div className="text-[9px] text-slate-400 font-black uppercase tracking-[1.5px] mt-1.5">{acc.type} • {acc.code}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-black dark:text-white">৳{acc.balance.toLocaleString()}</div>
                        <ChevronRight size={18} className="text-slate-200" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-left"><div className="flex justify-between items-center mb-2"><button onClick={handleBack} className="flex items-center gap-1 text-[10px] font-black text-blue-600 uppercase tracking-widest"><ChevronLeft size={16} /> Catalog</button><button onClick={handleExportLedgerPDF} className="p-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase flex items-center gap-1"><Printer size={14} /> PDF</button></div><div className="bg-white dark:bg-slate-800 p-4 rounded-2xl mb-4 text-center border dark:border-slate-700">
                <h3 className="font-black dark:text-white text-lg">{companyName}</h3>
                <p className="text-[10px] text-slate-500 font-medium">{companyAddress}</p>
                <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">Print Date: {formatDateLong(new Date().toISOString())}</p>
              </div><div className="bg-slate-900 dark:bg-blue-600 p-6 rounded-[2rem] shadow-xl text-white relative overflow-hidden"><div className="absolute top-0 right-0 p-6 opacity-10"><BookText size={100} /></div><div className="relative z-10 flex justify-between items-end"><div><h3 className="text-xl font-black">{accountsWithBalances.find(a => a.id === selectedLedgerAccountId)?.name}</h3><p className="text-[9px] text-blue-200 font-black uppercase tracking-widest mt-2">Range: {formatDateLong(reportRange.start)} to {formatDateLong(reportRange.end)}</p></div><div className="text-right"><p className="text-[9px] text-slate-400 dark:text-blue-200 font-black uppercase tracking-widest mb-1">Final Balance</p><div className="text-2xl font-black text-white">৳{accountsWithBalances.find(a => a.id === selectedLedgerAccountId)?.balance.toLocaleString()}</div></div></div></div><div className="space-y-3"><div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl text-[10px] font-black text-slate-400 uppercase border border-dashed text-center">Opening Balance (as of {formatDateLong(reportRange.start)}): ৳{accountsWithBalances.find(a => a.id === selectedLedgerAccountId)?.openingBalance.toLocaleString()}</div>{ledgerEntries.map((entry, idx) => (<div key={idx} className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border dark:border-slate-700 flex justify-between items-center"><div className="flex-1"><div className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{entry.date} • {entry.voucherNo}</div><div className="font-bold text-sm dark:text-white mt-0.5">{entry.description}</div></div><div className="text-right ml-4"><div className="flex gap-4 justify-end items-center mb-1">{entry.debit > 0 && <p className="text-xs font-black text-blue-600">Dr: {entry.debit.toLocaleString()}</p>}{entry.credit > 0 && <p className="text-xs font-black text-rose-600">Cr: {entry.credit.toLocaleString()}</p>}</div><div className="text-[10px] text-slate-500 font-bold tracking-tight">Bal: ৳{entry.balance.toLocaleString()}</div></div></div>))}{ledgerEntries.length > 0 && <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl text-[10px] font-black text-slate-400 uppercase border border-dashed text-center">Closing Balance (as of {formatDateLong(reportRange.end)}): ৳{accountsWithBalances.find(a => a.id === selectedLedgerAccountId)?.balance.toLocaleString()}</div>}</div></div>)}
          </ViewWrapper>
        )}

        {activeView === 'REPORTS' && (
          <ViewWrapper title="Reports">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-[1.5rem] mb-6 shadow-inner overflow-x-auto scrollbar-hide">
              <button onClick={() => setReportTab('PL')} className={`flex-1 min-w-[80px] py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${reportTab === 'PL' ? 'bg-white dark:bg-slate-700 shadow-lg text-slate-900 dark:text-white' : 'text-slate-500'}`}>Income</button>
              <button onClick={() => setReportTab('BS')} className={`flex-1 min-w-[80px] py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${reportTab === 'BS' ? 'bg-white dark:bg-slate-700 shadow-lg text-slate-900 dark:text-white' : 'text-slate-500'}`}>Balance</button>
              <button onClick={() => setReportTab('TB')} className={`flex-1 min-w-[80px] py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${reportTab === 'TB' ? 'bg-white dark:bg-slate-700 shadow-lg text-slate-900 dark:text-white' : 'text-slate-500'}`}>Transactions</button>
              <button onClick={() => setReportTab('CF')} className={`flex-1 min-w-[80px] py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${reportTab === 'CF' ? 'bg-white dark:bg-slate-700 shadow-lg text-slate-900 dark:text-white' : 'text-slate-500'}`}>Cash Flow</button>
              {planType === 'MODERATE' && (
                <button onClick={() => setReportTab('INVENTORY')} className={`flex-1 min-w-[80px] py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${reportTab === 'INVENTORY' ? 'bg-white dark:bg-slate-700 shadow-lg text-slate-900 dark:text-white' : 'text-slate-500'}`}>Inventory</button>
              )}
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-xl border dark:border-slate-700 text-left min-h-[400px]">
              <div className="flex justify-between items-start mb-4">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest space-y-1">
                  <div>Period: <span className="text-blue-600">{formatDateLong(reportRange.start)} to {formatDateLong(reportRange.end)}</span></div>
                  <div>Print Date: <span className="text-slate-500">{formatDateLong(new Date().toISOString())}</span></div>
                </div>
                <button onClick={() => handleExportReportPDF(reportTab)} className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl"><Printer size={16} /></button>
              </div>
              <div className="mb-6 text-center border-b dark:border-slate-700 pb-4">
                <h3 className="font-black dark:text-white text-lg">{companyName}</h3>
                <p className="text-[10px] text-slate-500 font-medium">{companyAddress}</p>
              </div>

              {(() => {
                const balanceSheetData = getBalanceSheetData(accountsWithBalances); return (
                  <>
                    {reportTab === 'PL' && (
                      <div className="space-y-6">
                        <div><h5 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3 border-b dark:border-emerald-900/30 pb-1">Revenue / Income</h5><div className="space-y-2 mb-4">{accountsWithBalances.filter(a => a.type === AccountType.INCOME && a.level === AccountLevel.GROUP).map(a => { const net = a.balance - a.openingBalance; const displayNet = getDisplayBalance(a.type, net); return (<div key={a.id} className="flex justify-between text-xs font-bold dark:text-slate-300"><span>{a.name}</span><span>৳{displayNet.toLocaleString()}</span></div>); })}</div><div className="flex justify-between font-black text-sm dark:text-white border-t pt-2"><span>Total Income</span><span className="text-emerald-600">৳{getDisplayBalance(AccountType.INCOME, (accountsWithBalances.find(a => a.level === AccountLevel.MAIN && a.type === AccountType.INCOME)?.balance || 0) - (accountsWithBalances.find(a => a.level === AccountLevel.MAIN && a.type === AccountType.INCOME)?.openingBalance || 0)).toLocaleString()}</span></div></div>
                        <div><h5 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3 border-b dark:border-rose-900/30 pb-1">Expenses</h5><div className="space-y-2 mb-4">{accountsWithBalances.filter(a => a.type === AccountType.EXPENSE && a.level === AccountLevel.GROUP).map(a => { const net = a.balance - a.openingBalance; const displayNet = getDisplayBalance(a.type, net); return (<div key={a.id} className="flex justify-between text-xs font-bold dark:text-slate-300"><span>{a.name}</span><span>৳{displayNet.toLocaleString()}</span></div>); })}</div><div className="flex justify-between font-black text-sm dark:text-white border-t pt-2"><span>Total Expenses</span><span className="text-rose-600">৳{getDisplayBalance(AccountType.EXPENSE, (accountsWithBalances.find(a => a.level === AccountLevel.MAIN && a.type === AccountType.EXPENSE)?.balance || 0) - (accountsWithBalances.find(a => a.level === AccountLevel.MAIN && a.type === AccountType.EXPENSE)?.openingBalance || 0)).toLocaleString()}</span></div></div>
                        <div className="pt-6 border-t-4 dark:border-blue-600"><div className="flex justify-between font-black text-xl dark:text-white"><span>Net Period Profit / Loss</span><span className={(financialSummary.netIncome ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}>৳{((financialSummary.netIncome) ?? 0).toLocaleString()}</span></div></div>
                      </div>
                    )}

                    {reportTab === 'BS' && (
                      <div className="space-y-8">
                        <div><h5 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3 border-b dark:border-blue-900/30 pb-1">Assets</h5><div className="space-y-2 mb-3">{balanceSheetData.assetGroups.map(a => (<div key={a.code} className="flex justify-between text-xs font-bold dark:text-slate-300"><span>{a.name}</span><span>৳{((a.displayAmount) ?? 0).toLocaleString()}</span></div>))}</div><div className="flex justify-between font-black text-sm dark:text-white border-t pt-2"><span>Total Assets</span><span>৳{((balanceSheetData.totalAssets) ?? 0).toLocaleString()}</span></div></div>
                        <div><h5 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3 border-b dark:border-amber-900/30 pb-1">Liabilities + Equity</h5><div className="space-y-2 mb-3">{balanceSheetData.liabilityGroups.map(a => (<div key={a.code} className="flex justify-between text-xs font-bold dark:text-slate-300"><span>{a.name}</span><span>৳{((a.displayAmount) ?? 0).toLocaleString()}</span></div>))}{balanceSheetData.equityGroups.map(a => (<div key={a.code} className="flex justify-between text-xs font-bold dark:text-slate-300"><span>{a.name}</span><span>৳{((a.displayAmount) ?? 0).toLocaleString()}</span></div>))}</div><div className="flex justify-between font-black text-sm dark:text-white border-t pt-2"><span>Total Liab + Equity</span><span>৳{(((balanceSheetData.totalLiabilities ?? 0) + (balanceSheetData.totalEquity ?? 0))).toLocaleString()}</span></div></div>
                      </div>
                    )}

                    {reportTab === 'TB' && (
                      <div className="overflow-x-auto pb-4"><table className="w-full text-left border-collapse min-w-[600px]"><thead><tr className="border-b dark:border-slate-700 text-[10px] font-black text-slate-400 uppercase tracking-widest"><th className="py-3 px-2">Account</th><th className="py-3 px-2 text-right">Opening</th><th className="py-3 px-2 text-right">Debit</th><th className="py-3 px-2 text-right">Credit</th><th className="py-3 px-2 text-right">Closing</th></tr></thead><tbody className="divide-y dark:divide-slate-800">{(() => {
                        const groupAccounts = sortAccountsAlphabetically(accountsWithBalances.filter(a => a.level === AccountLevel.GROUP));
                        const allRows: any[] = [];

                        groupAccounts.forEach(group => {
                          allRows.push(group);
                          const glAccounts = getSortedChildAccounts(accountsWithBalances, group.id).filter(a => a.level === AccountLevel.GL);
                          allRows.push(...glAccounts);
                        });

                        // ✅ Calculate totals from GL accounts only (not group totals)
                        const glOnlyAccounts = accountsWithBalances.filter(a => a.level === AccountLevel.GL);
                        const totalDebit = glOnlyAccounts.reduce((sum, acc) => sum + (acc.periodDebit || 0), 0);
                        const totalCredit = glOnlyAccounts.reduce((sum, acc) => sum + (acc.periodCredit || 0), 0);
                        const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

                        return (
                          <>
                            {allRows.map(acc => (
                              <tr key={acc.id} className={`text-[11px] hover:bg-slate-50 dark:hover:bg-slate-900 ${acc.level === AccountLevel.GROUP ? 'font-black bg-slate-50/50 dark:bg-slate-800/20' : 'font-medium'}`}>
                                <td className={`py-3 px-2 ${acc.level === AccountLevel.GL ? 'pl-6 text-slate-500' : 'text-slate-900 dark:text-white'}`}>{acc.name}</td>
                                <td className="py-3 px-2 text-right text-slate-400">৳{((acc.openingBalance) ?? 0).toLocaleString()}</td>
                                <td className="py-3 px-2 text-right text-emerald-600">৳{((acc.periodDebit) ?? 0).toLocaleString()}</td>
                                <td className="py-3 px-2 text-right text-rose-600">৳{((acc.periodCredit) ?? 0).toLocaleString()}</td>
                                <td className="py-3 px-2 text-right font-black dark:text-white">৳{((acc.balance) ?? 0).toLocaleString()}</td>
                              </tr>
                            ))}
                            <tr className="border-t-4 border-b-2 dark:border-slate-600 dark:border-b-slate-600 font-black bg-slate-100 dark:bg-slate-900/50">
                              <td className="py-3 px-2 text-slate-900 dark:text-white">TOTAL</td>
                              <td className="py-3 px-2 text-right text-slate-500"></td>
                              <td className={`py-3 px-2 text-right font-black text-lg ${isBalanced ? 'text-emerald-600' : 'text-rose-600'}`}>৳{((totalDebit) ?? 0).toLocaleString()}</td>
                              <td className={`py-3 px-2 text-right font-black text-lg ${isBalanced ? 'text-rose-600' : 'text-rose-600'}`}>৳{((totalCredit) ?? 0).toLocaleString()}</td>
                              <td className="py-3 px-2 text-right text-slate-500"></td>
                            </tr>
                            {!isBalanced && (
                              <tr className="bg-red-50 dark:bg-red-900/20 border-b-2 dark:border-red-900">
                                <td colSpan={5} className="py-2 px-2 text-center text-xs font-bold text-red-600">
                                  ⚠️ Trial Balance Not Balanced: Debit (৳{totalDebit.toLocaleString()}) ≠ Credit (৳{totalCredit.toLocaleString()}) | Difference: ৳{Math.abs(totalDebit - totalCredit).toLocaleString()}
                                </td>
                              </tr>
                            )}
                          </>
                        )
                      })()}</tbody></table></div>
                    )}

                    {reportTab === 'CF' && (
                      <div className="space-y-8">
                        <div>
                          <h5 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3 border-b dark:border-blue-900/30 pb-1">Operating Activities</h5>
                          <div className="space-y-2 mb-3">
                            <div className="flex justify-between text-xs font-bold dark:text-slate-300"><span>Net Profit</span><span>৳{cashFlowData.netProfit.toLocaleString()}</span></div>
                            {cashFlowData.operatingChanges.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-xs font-medium dark:text-slate-400"><span>{item.change > 0 ? 'Decrease' : 'Increase'} in {item.name}</span><span>৳{item.change.toLocaleString()}</span></div>
                            ))}
                          </div>
                          <div className="flex justify-between font-black text-sm dark:text-white border-t pt-2"><span>Net Cash from Operating</span><span>৳{cashFlowData.netOperating.toLocaleString()}</span></div>
                        </div>

                        <div>
                          <h5 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3 border-b dark:border-emerald-900/30 pb-1">Investing Activities</h5>
                          <div className="space-y-2 mb-3">
                            {cashFlowData.investingChanges.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-xs font-medium dark:text-slate-400"><span>{item.name}</span><span>৳{item.change.toLocaleString()}</span></div>
                            ))}
                            {cashFlowData.investingChanges.length === 0 && <div className="text-xs text-slate-500 italic">No investing movements</div>}
                          </div>
                          <div className="flex justify-between font-black text-sm dark:text-white border-t pt-2"><span>Net Cash from Investing</span><span>৳{cashFlowData.netInvesting.toLocaleString()}</span></div>
                        </div>

                        <div>
                          <h5 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3 border-b dark:border-amber-900/30 pb-1">Financing Activities</h5>
                          <div className="space-y-2 mb-3">
                            {cashFlowData.financingChanges.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-xs font-medium dark:text-slate-400"><span>{item.name}</span><span>৳{item.change.toLocaleString()}</span></div>
                            ))}
                            {cashFlowData.financingChanges.length === 0 && <div className="text-xs text-slate-500 italic">No financing movements</div>}
                          </div>
                          <div className="flex justify-between font-black text-sm dark:text-white border-t pt-2"><span>Net Cash from Financing</span><span>৳{cashFlowData.netFinancing.toLocaleString()}</span></div>
                        </div>

                        <div className="pt-6 border-t-4 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 p-4 rounded-2xl">
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest"><span>Net Cash Movement</span><span>৳{cashFlowData.netChange.toLocaleString()}</span></div>
                            <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest"><span>Opening Cash ({formatDateLong(reportRange.start)})</span><span>৳{cashFlowData.openingCash.toLocaleString()}</span></div>
                            <div className="flex justify-between font-black text-lg dark:text-white border-t pt-2 mt-2"><span>Closing Cash ({formatDateLong(reportRange.end)})</span><span className="text-blue-600">৳{cashFlowData.closingCash.toLocaleString()}</span></div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-8 pt-4 border-t dark:border-slate-800 text-center"><p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest italic">This is system generated report. No signature required.</p></div>
                  </>
                );
              })()}
            </div>
          </ViewWrapper>
        )}

        {activeView === 'INVENTORY' && (
          <ViewWrapper title={selectedInventoryGL ? "Inventory Items" : "Inventory Management"}>
            {!selectedInventoryGL ? (
              <div className="space-y-4">
                <p className="text-[10px] text-slate-600 dark:text-slate-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-2xl border border-blue-100 dark:border-blue-800">
                  💡 System-controlled inventory accounts. Add items under each category to track stock movements.
                </p>
                <div className="space-y-3">
                  {getInventoryGLAccounts(accounts).map(glAcc => {
                    const items = getSubLedgersForGL(inventorySubLedgers, glAcc.id);
                    return (
                      <button
                        key={glAcc.id}
                        onClick={() => setSelectedInventoryGL(glAcc.id)}
                        className="w-full bg-white dark:bg-slate-800 p-5 rounded-3xl flex items-center justify-between shadow-sm border dark:border-slate-700 text-left hover:shadow-md transition-shadow"
                      >
                        <div>
                          <div className="font-black text-sm text-slate-800 dark:text-white">{glAcc.name}</div>
                          <div className="text-[9px] text-slate-400 font-black uppercase tracking-[1.5px] mt-1.5">{items.length} Items • {glAcc.code}</div>
                        </div>
                        <ChevronRight size={18} className="text-slate-200" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-left">
                <div className="flex justify-between items-center mb-4">
                  <button
                    onClick={() => {
                      setSelectedInventoryGL(null);
                      setIsInventoryModalOpen(false);
                      setEditingSubLedger(null);
                      setNewSubLedgerData({ itemName: '', itemCode: '', quantity: '', rate: '' });
                    }}
                    className="flex items-center gap-1 text-[10px] font-black text-blue-600 uppercase tracking-widest"
                  >
                    <ChevronLeft size={16} /> Categories
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExportInventoryGLPDF(selectedInventoryGL!)}
                      className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 transition-colors"
                      title="Export as PDF"
                    >
                      <FileText size={14} />
                    </button>
                    <button
                      onClick={() => {
                        setEditingSubLedger(null);
                        setNewSubLedgerData({ itemName: '', itemCode: '', quantity: '', rate: '' });
                        setIsInventoryModalOpen(true);
                      }}
                      className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-[10px] font-black uppercase flex items-center gap-1"
                    >
                      <Plus size={14} /> Add Item
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl mb-4 text-center border dark:border-slate-700">
                  <h3 className="font-black dark:text-white text-lg">{accounts.find(a => a.id === selectedInventoryGL)?.name}</h3>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">Stock Items Tracking</p>
                </div>

                {getSubLedgersForGL(inventorySubLedgers, selectedInventoryGL!).length === 0 ? (
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl text-center border-2 border-dashed dark:border-slate-700">
                    <ShoppingBag size={24} className="text-slate-400 mx-auto mb-2" />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">No items added yet</p>
                    <p className="text-[9px] text-slate-400 mt-1">Click "Add Item" to create your first inventory item</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getSubLedgersForGL(inventorySubLedgers, selectedInventoryGL!).map(sl => {
                      const balance = calculateSubLedgerBalance(sl, inventoryMovements, reportRange.start, reportRange.end);
                      return (
                        <div key={sl.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border dark:border-slate-700 space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-bold text-sm text-slate-800 dark:text-white">{sl.itemName}</div>
                              {sl.itemCode && <div className="text-[9px] text-slate-400 font-medium mt-0.5">Code: {sl.itemCode}</div>}
                              <div className="text-[9px] text-slate-500 font-medium mt-1">Rate: ৳{sl.rate.toLocaleString()}/unit</div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => openEditSubLedger(sl)}
                                className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-bold"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteSubLedger(sl.id)}
                                className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg text-[10px] font-bold"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-slate-700/50 dark:to-slate-800 p-3 rounded-xl grid grid-cols-3 gap-2">
                            <div className="text-center">
                              <div className="text-[10px] font-black text-slate-400 uppercase">Qty</div>
                              <div className="text-lg font-black text-slate-800 dark:text-white">{balance.quantity}</div>
                            </div>
                            <div className="text-center border-x border-slate-200 dark:border-slate-700">
                              <div className="text-[10px] font-black text-slate-400 uppercase">Value</div>
                              <div className="text-sm font-bold text-slate-800 dark:text-white">৳{balance.value.toLocaleString()}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-[10px] font-black text-slate-400 uppercase">AVG</div>
                              <div className="text-sm font-bold text-slate-800 dark:text-white">৳{(balance.quantity > 0 ? balance.value / balance.quantity : 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </ViewWrapper>
        )}


      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t dark:border-slate-800 px-2 py-3 flex justify-around items-center z-40 shadow-2xl overflow-x-auto">
        <NavButton active={activeView === 'DASHBOARD'} onClick={() => navigateTo('DASHBOARD')} icon={<LayoutDashboard size={20} />} label="Home" />
        <NavButton active={activeView === 'TRANSACTIONS'} onClick={() => navigateTo('TRANSACTIONS')} icon={<ClipboardList size={20} />} label="Trail" />
        {planType === 'MODERATE' && (
          <NavButton active={activeView === 'INVENTORY'} onClick={() => { navigateTo('INVENTORY'); setSelectedInventoryGL(null); }} icon={<ShoppingCart size={20} />} label="Stock" />
        )}
        <NavButton active={activeView === 'LEDGER'} onClick={() => { navigateTo('LEDGER'); setSelectedLedgerAccountId(null); }} icon={<Library size={20} />} label="Ledger" />
        <NavButton active={activeView === 'CHART'} onClick={() => navigateTo('CHART')} icon={<ListTree size={20} />} label="Chart" />
        <NavButton active={activeView === 'REPORTS'} onClick={() => navigateTo('REPORTS')} icon={<BarChart3 size={20} />} label="Report" />
      </nav>

      {/* Delete All Data - Step 1: Warning Dialog */}
      {deleteConfirmStep === 1 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border dark:border-slate-700">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 mx-auto mb-4">
              <TriangleAlert size={24} className="text-rose-600 dark:text-rose-400" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white text-center mb-3">Delete User Data?</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-6">
              This will permanently remove:
            </p>
            <ul className="space-y-2 mb-8 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-rose-500 rounded-full"></span>
                {accounts.filter(a => !a.isSystem).length} custom accounts
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-rose-500 rounded-full"></span>
                All {transactions.length} transactions
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
                <span className="font-bold">✓ Default accounts preserved</span>
              </li>
            </ul>
            <p className="text-xs text-rose-600 dark:text-rose-400 font-bold text-center mb-6 bg-rose-50 dark:bg-rose-900/20 p-3 rounded-xl">
              ⚠️ This action CANNOT be undone!
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeleteConfirmStep(0);
                  setDeleteCheckboxConfirmed(false);
                  setDeleteInputCode('');
                }}
                className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white py-3 rounded-xl font-bold text-sm transition-colors hover:bg-slate-200 dark:hover:bg-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteWarningConfirm}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-bold text-sm transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Data - Step 2: Checkbox Confirmation */}
      {deleteConfirmStep === 2 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border dark:border-slate-700">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Confirm Deletion</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Please confirm that you understand this action is irreversible:
            </p>
            <label className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mb-6">
              <input
                type="checkbox"
                checked={deleteCheckboxConfirmed}
                onChange={(e) => handleDeleteCheckboxChange(e.target.checked)}
                className="w-5 h-5 accent-rose-600 cursor-pointer"
              />
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                I understand all my data will be permanently deleted
              </span>
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeleteConfirmStep(0);
                  setDeleteCheckboxConfirmed(false);
                  setDeleteInputCode('');
                }}
                className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white py-3 rounded-xl font-bold text-sm transition-colors hover:bg-slate-200 dark:hover:bg-slate-600"
              >
                Cancel
              </button>
              <button
                disabled={!deleteCheckboxConfirmed}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors ${deleteCheckboxConfirmed
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  }`}
              >
                Next Step
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Data - Step 3: Verification Code */}
      {deleteConfirmStep === 3 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border dark:border-slate-700">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Final Verification</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Enter the code below to complete deletion:
            </p>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 mb-6">
              <p className="text-xs text-amber-600 dark:text-amber-400 uppercase font-bold tracking-widest mb-2">Verification Code</p>
              <p className="text-2xl font-black text-amber-700 dark:text-amber-300 text-center tracking-[0.5em] font-mono">
                {deleteVerificationCode}
              </p>
            </div>
            <label className="block mb-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Enter code to confirm:</p>
              <input
                type="text"
                inputMode="numeric"
                value={deleteInputCode}
                onChange={(e) => setDeleteInputCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="0000"
                maxLength={4}
                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 text-center text-2xl font-mono font-black tracking-[0.25em] dark:text-white focus:outline-none focus:border-rose-500"
              />
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeleteConfirmStep(0);
                  setDeleteCheckboxConfirmed(false);
                  setDeleteInputCode('');
                }}
                className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white py-3 rounded-xl font-bold text-sm transition-colors hover:bg-slate-200 dark:hover:bg-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteDelete}
                disabled={deleteInputCode.length !== 4}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors ${deleteInputCode.length === 4
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  }`}
              >
                Delete All Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Add Button - Context-aware per screen */}
      {activeView !== 'ADD_TRANSACTION' && activeView !== 'SUPPORT' && activeView !== 'DEVELOPER_INFO' && activeView !== 'DATE_CONFIG' && activeView !== 'AUTH' && activeView !== 'ONBOARDING' && activeView !== 'REPORTS' && activeView !== 'SETTINGS' && activeView !== 'BACKUP_RESTORE' && (
        <button
          onClick={handleFloatingAddButton}
          className="fixed bottom-24 right-6 w-14 h-14 bg-slate-900 dark:bg-blue-600 text-white rounded-[1.5rem] shadow-2xl flex items-center justify-center active:scale-90 transition-all z-30 ring-4 ring-white dark:ring-slate-900"
          title={activeView === 'INVENTORY' ? 'Add Inventory Item' : 'Add'}
        >
          <Plus size={28} />
        </button>
      )}
    </div>
  );
};

export default App;