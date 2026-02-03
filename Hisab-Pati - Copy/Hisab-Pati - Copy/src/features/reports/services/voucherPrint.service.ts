import { jsPDF } from 'jspdf';
import { Transaction, JournalEntry, Account, VoucherType, VoucherItemLine } from '../../../core/types';
import { ItemTableService } from '../../inventory/services/itemTable.service';

export interface VoucherPrintConfig {
  companyName: string;
  companyAddress: string;
  companyContact?: string;
}

export interface PrintVoucherParams {
  voucher: Transaction;
  accounts: Account[];
  config: VoucherPrintConfig;
}

/**
 * Professional Voucher Print Service
 * Generates audit-ready ERP format vouchers for all types (Sales, Purchase, Receipt, Payment, Journal)
 */
export class VoucherPrintService {
  private static readonly A4_WIDTH = 210; // mm
  private static readonly A4_HEIGHT = 297; // mm
  private static readonly MARGIN = 10;
  private static readonly CONTENT_WIDTH = this.A4_WIDTH - 2 * this.MARGIN;

  /**
   * Main entry point - Generate PDF for a voucher
   */
  static generateVoucherPDF(params: PrintVoucherParams): jsPDF {
    const { voucher, accounts, config } = params;

    // Validate voucher before printing
    if (!this.validateVoucher(voucher)) {
      throw new Error('Invalid voucher: Debit and Credit totals do not match');
    }

    // DEBUG: Log item table condition
    console.log('📄 PDF Generation - Item Table Check:', {
      voucherType: voucher.voucherType,
      isSalesOrPurchase: voucher.voucherType === 'SALES' || voucher.voucherType === 'PURCHASE',
      hasItemLines: !!voucher.itemLines,
      itemLinesLength: voucher.itemLines?.length || 0,
      willDrawItemTable: (voucher.voucherType === 'SALES' || voucher.voucherType === 'PURCHASE') && voucher.itemLines && voucher.itemLines.length > 0
    });

    const doc = new jsPDF('p', 'mm', 'a4');
    let y = this.MARGIN;

    // Header Section
    y = this.drawHeader(doc, config, voucher, y);

    // Party/Account Details Section
    y = this.drawPartyDetails(doc, voucher, accounts, y);

    // Item Table (for SALES and PURCHASE vouchers)
    if ((voucher.voucherType === 'SALES' || voucher.voucherType === 'PURCHASE') && voucher.itemLines && voucher.itemLines.length > 0) {
      console.log('✅ Drawing item table for', voucher.voucherType, 'voucher with', voucher.itemLines.length, 'items');
      y = this.drawItemTable(doc, voucher.itemLines, y);
    } else {
      console.log('⏭️ Skipping item table - Condition failed:',
        voucher.voucherType === 'SALES' || voucher.voucherType === 'PURCHASE' ? '✅' : '❌', 'SALES/PURCHASE',
        voucher.itemLines ? '✅' : '❌', 'hasItemLines',
        voucher.itemLines?.length || '0', 'length'
      );
    }

    // Transaction Table (Accounting Entries)
    y = this.drawTransactionTable(doc, voucher, accounts, y);

    // Totals Section
    y = this.drawTotalSection(doc, voucher, y);

    // Footer Section
    this.drawFooterSection(doc, voucher, y);

    return doc;
  }

  /**
   * Validate voucher - Ensure Debit = Credit
   */
  private static validateVoucher(voucher: Transaction): boolean {
    const totalDebit = voucher.entries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredit = voucher.entries.reduce((sum, entry) => sum + entry.credit, 0);

    // Allow small rounding differences
    return Math.abs(totalDebit - totalCredit) < 0.01;
  }

  /**
   * HEADER SECTION - Company Info, Voucher Title, Number, Date
   */
  private static drawHeader(
    doc: jsPDF,
    config: VoucherPrintConfig,
    voucher: Transaction,
    startY: number
  ): number {
    let y = startY;
    const centerX = this.A4_WIDTH / 2;

    // Company Name (Bold, larger)
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(config.companyName, centerX, y, { align: 'center' });
    y += 8;

    // Company Address
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(config.companyAddress, centerX, y, { align: 'center' });
    y += 5;

    // Company Contact (if available)
    if (config.companyContact) {
      doc.text(config.companyContact, centerX, y, { align: 'center' });
      y += 5;
    }

    // Separator line
    doc.setDrawColor(0);
    doc.line(this.MARGIN, y, this.A4_WIDTH - this.MARGIN, y);
    y += 5;

    // Voucher Title (centered, bold)
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    const voucherTitle = this.getVoucherTypeTitle(voucher.voucherType);
    doc.text(voucherTitle, centerX, y, { align: 'center' });
    y += 8;

    // Voucher Details in two columns
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');

    const leftX = this.MARGIN;
    const rightX = centerX + 15;

    // Left column
    doc.text(`Voucher No: ${voucher.voucherNo}`, leftX, y);
    y += 5;
    doc.text(`Date: ${this.formatDate(voucher.date)}`, leftX, y);
    y += 5;

    // Right column (at same height as left)
    doc.text(`Reference: ${voucher.reference || 'N/A'}`, rightX, y - 10);

    y += 5;

    // Separator line
    doc.setDrawColor(200);
    doc.line(this.MARGIN, y, this.A4_WIDTH - this.MARGIN, y);
    y += 5;

    return y;
  }

  /**
   * PARTY/ACCOUNT DETAILS SECTION
   * Shows customer/supplier/party information
   */
  private static drawPartyDetails(
    doc: jsPDF,
    voucher: Transaction,
    accounts: Account[],
    startY: number
  ): number {
    let y = startY;

    // Get party account (first debit or credit account based on voucher type)
    const partyAccountId = this.getPartyAccountId(voucher);
    const partyAccount = accounts.find(a => a.id === partyAccountId);

    if (partyAccount) {
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('Party / Account Details:', this.MARGIN, y);
      y += 5;

      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text(`Party Name: ${partyAccount.name}`, this.MARGIN + 2, y);
      y += 4;
      doc.text(`Ledger Account: ${partyAccount.code} - ${partyAccount.name}`, this.MARGIN + 2, y);
      y += 4;

      // Payment mode for receipt/payment vouchers
      if (['RECEIPT', 'PAYMENT'].includes(voucher.voucherType)) {
        doc.text(`Voucher Type: ${this.getVoucherTypeTitle(voucher.voucherType)}`, this.MARGIN + 2, y);
        y += 4;
      }

      y += 2;
    }

    return y;
  }

  /**
   * TRANSACTION TABLE SECTION
   * Displays debits, credits with proper fixed-width column layout
   * 
   * Column Layout (Fixed Width):
   * SL (10mm) | Account/Description (90mm) | Debit (30mm) | Credit (30mm)
   * Total width: 160mm = 190mm content width
   */
  private static drawTransactionTable(
    doc: jsPDF,
    voucher: Transaction,
    accounts: Account[],
    startY: number
  ): number {
    let y = startY;

    // Fixed column definitions (in mm)
    const columns = {
      sl: { width: 10, label: 'SL' },
      account: { width: 90, label: 'Account / Description' },
      debit: { width: 30, label: 'Debit' },
      credit: { width: 30, label: 'Credit' }
    };

    // Calculate absolute X positions for each column
    const colX = {
      sl: this.MARGIN,
      account: this.MARGIN + columns.sl.width,
      debit: this.MARGIN + columns.sl.width + columns.account.width,
      credit: this.MARGIN + columns.sl.width + columns.account.width + columns.debit.width
    };

    // Table header
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.setFillColor(220, 220, 220); // Light gray background
    doc.setDrawColor(100);

    // Draw header row with borders
    const headerHeight = 6;
    doc.rect(this.MARGIN, y, this.CONTENT_WIDTH, headerHeight, 'F');
    doc.rect(this.MARGIN, y, this.CONTENT_WIDTH, headerHeight); // Border

    // Header text
    const headerY = y + 3.5;
    doc.text('SL', colX.sl + 2, headerY);
    doc.text(columns.account.label, colX.account + 2, headerY);
    doc.text(columns.debit.label, colX.debit + columns.debit.width - 2, headerY, { align: 'right' });
    doc.text(columns.credit.label, colX.credit + columns.credit.width - 2, headerY, { align: 'right' });

    y += headerHeight;

    // Table rows
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    const lineHeight = 4;
    const rowPadding = 1;
    let slNo = 1;

    voucher.entries.forEach((entry) => {
      const account = accounts.find(a => a.id === entry.accountId);
      if (!account) return;

      const accountName = `${account.code} - ${account.name}`;

      // Split account text to fit in account column width
      const maxWidth = columns.account.width - 4; // Account column width minus padding
      const accountLines = doc.splitTextToSize(accountName, maxWidth);

      // Calculate row height based on wrapped text
      const rowHeight = Math.max(5, accountLines.length * lineHeight + 2 * rowPadding);

      // Check if we need a new page
      if (y + rowHeight > this.A4_HEIGHT - 40) {
        doc.addPage();
        y = this.MARGIN;
      }

      // Draw row background (alternating, optional)
      if (slNo % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(this.MARGIN, y, this.CONTENT_WIDTH, rowHeight, 'F');
      }

      // Draw row borders
      doc.setDrawColor(200);
      doc.line(colX.sl, y + rowHeight, colX.credit + columns.credit.width, y + rowHeight); // Bottom border

      // Column vertical borders
      doc.line(colX.account, y, colX.account, y + rowHeight); // Account column left
      doc.line(colX.debit, y, colX.debit, y + rowHeight); // Debit column left
      doc.line(colX.credit, y, colX.credit, y + rowHeight); // Credit column left

      // Draw cell content
      const contentY = y + rowPadding + 3;

      // SL cell (center aligned)
      doc.text(slNo.toString(), colX.sl + columns.sl.width / 2, contentY, { align: 'center' });

      // Account cell (left aligned, wrapped text)
      doc.text(accountLines, colX.account + 2, contentY);

      // Debit cell (right aligned, fixed precision)
      const debitText = entry.debit > 0 ? entry.debit.toFixed(2) : '';
      doc.text(debitText, colX.debit + columns.debit.width - 2, contentY, { align: 'right' });

      // Credit cell (right aligned, fixed precision)
      const creditText = entry.credit > 0 ? entry.credit.toFixed(2) : '';
      doc.text(creditText, colX.credit + columns.credit.width - 2, contentY, { align: 'right' });

      // Move to next row
      y += rowHeight;
      slNo++;
    });

    // Table border (outer frame)
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(this.MARGIN, startY, this.CONTENT_WIDTH, y - startY);

    y += 2;
    return y;
  }

  /**
   * TOTAL SECTION - Sum of Debit and Credit with proper alignment
   */
  private static drawTotalSection(
    doc: jsPDF,
    voucher: Transaction,
    startY: number
  ): number {
    let y = startY;

    const totalDebit = voucher.entries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredit = voucher.entries.reduce((sum, entry) => sum + entry.credit, 0);

    // Use same column layout as transaction table
    const columns = {
      sl: { width: 10 },
      account: { width: 90 },
      debit: { width: 30 },
      credit: { width: 30 }
    };

    // Calculate absolute X positions (same as table)
    const colX = {
      sl: this.MARGIN,
      account: this.MARGIN + columns.sl.width,
      debit: this.MARGIN + columns.sl.width + columns.account.width,
      credit: this.MARGIN + columns.sl.width + columns.account.width + columns.debit.width
    };

    // Total row styling
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setFillColor(240, 240, 240);
    doc.setDrawColor(0);
    const totalRowHeight = 6;

    // Draw total row background
    doc.rect(this.MARGIN, y, this.CONTENT_WIDTH, totalRowHeight, 'F');
    doc.rect(this.MARGIN, y, this.CONTENT_WIDTH, totalRowHeight); // Border

    // Column separators in total row
    doc.line(colX.account, y, colX.account, y + totalRowHeight); // Account column left
    doc.line(colX.debit, y, colX.debit, y + totalRowHeight); // Debit column left
    doc.line(colX.credit, y, colX.credit, y + totalRowHeight); // Credit column left

    // Total row content
    const contentY = y + 4;
    doc.text('TOTAL:', colX.account + 2, contentY);
    doc.text(totalDebit.toFixed(2), colX.debit + columns.debit.width - 2, contentY, { align: 'right' });
    doc.text(totalCredit.toFixed(2), colX.credit + columns.credit.width - 2, contentY, { align: 'right' });

    y += totalRowHeight + 3;

    // Validation status indicator
    const match = Math.abs(totalDebit - totalCredit) < 0.01;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    const statusText = match ? '✓ Balanced' : '✗ Unbalanced';
    const statusColor = match ? [0, 128, 0] : [255, 0, 0];
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.text(statusText, colX.account + 2, y);
    doc.setTextColor(0, 0, 0);

    y += 5;
    return y;
  }

  /**
   * FOOTER SECTION - Narration, Signatures, Print Date
   */
  private static drawFooterSection(
    doc: jsPDF,
    voucher: Transaction,
    startY: number
  ): void {
    let y = startY;

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');

    // Narration / Remarks
    if (voucher.description) {
      doc.setFont(undefined, 'bold');
      doc.text('Narration:', this.MARGIN, y);
      y += 4;

      doc.setFont(undefined, 'normal');
      const narrationLines = doc.splitTextToSize(voucher.description, this.CONTENT_WIDTH);
      doc.text(narrationLines, this.MARGIN + 2, y);
      y += narrationLines.length * 4 + 3;
    }

    // Signature section
    doc.setFont(undefined, 'bold');
    doc.text('Authorizations:', this.MARGIN, y);
    y += 5;

    const signatureX = [this.MARGIN, this.MARGIN + 60, this.MARGIN + 120];
    const signatureLabels = ['Prepared By', 'Checked By', 'Approved By'];

    signatureLabels.forEach((label, index) => {
      const x = signatureX[index];

      // Signature line
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      doc.line(x, y + 12, x + 35, y + 12);
      doc.text(label, x, y + 15, { align: 'center' });
    });

    y += 20;

    // Print Date and Time
    doc.setFontSize(8);
    const printDateTime = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    doc.text(`Printed on: ${printDateTime}`, this.MARGIN, y);

    // Footer line
    const bottomY = this.A4_HEIGHT - 5;
    doc.setDrawColor(200);
    doc.line(this.MARGIN, bottomY, this.A4_WIDTH - this.MARGIN, bottomY);

    // Audit notice
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text('This is a computer-generated document. For audit compliance, ensure accuracy before printing.', 
      this.A4_WIDTH / 2, this.A4_HEIGHT - 2, { align: 'center' });
    doc.setTextColor(0, 0, 0);
  }

  /**
   * Helper: Get user-friendly voucher type title
   */
  private static getVoucherTypeTitle(type: VoucherType): string {
    const titles: Record<VoucherType, string> = {
      SALES: 'SALES VOUCHER',
      PURCHASE: 'PURCHASE VOUCHER',
      RECEIPT: 'RECEIPT VOUCHER',
      PAYMENT: 'PAYMENT VOUCHER',
      JOURNAL: 'JOURNAL VOUCHER'
    };
    return titles[type] || 'VOUCHER';
  }

  /**
   * Helper: Format date for display
   */
  private static formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  /**
   * ITEM TABLE SECTION - For SALES and PURCHASE vouchers
   * Displays items with quantity, rate, and amount
   */
  private static drawItemTable(
    doc: jsPDF,
    items: VoucherItemLine[],
    startY: number
  ): number {
    if (!items || items.length === 0) {
      return startY;
    }

    let y = startY;

    // Item table header
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Items Sold/Purchased:', this.MARGIN, y);
    y += 6;

    // Use ItemTableService to draw the item table
    y = ItemTableService.drawItemTableInPDF(
      doc,
      items,
      y,
      this.A4_WIDTH,
      { left: this.MARGIN, right: this.MARGIN }
    );

    y += 3;
    return y;
  }

  /**
   * Helper: Get party account ID based on voucher type
   * Sales/Purchase: Customer/Supplier (first debit/credit)
   * Receipt/Payment: Bank/Cash account
   * Journal: First account
   */
  private static getPartyAccountId(voucher: Transaction): string | undefined {
    if (voucher.entries.length === 0) return undefined;

    // For most vouchers, use the first entry's account
    // This typically represents the party
    return voucher.entries[0].accountId;
  }
}

/**
 * Export helper function for use in React components
 */
export async function printVoucher(
  doc: jsPDF,
  filename: string,
  onMobile: boolean = false
): Promise<void> {
  if (onMobile) {
    // Mobile: Convert to blob and trigger download via Capacitor
    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // Web: Open in new window for printing
    const pdfDataUrl = doc.output('dataurlstring');
    const printWindow = window.open(pdfDataUrl);
    if (printWindow) {
      printWindow.print();
    }
  }
}

/**
 * Generate PDF blob for sharing (mobile WhatsApp, Email, etc.)
 */
export function getPDFBlob(doc: jsPDF): Blob {
  return doc.output('blob');
}

/**
 * Generate PDF data URL for preview
 */
export function getPDFDataURL(doc: jsPDF): string {
  return doc.output('dataurlstring');
}
