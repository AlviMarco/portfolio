import { VoucherItemLine } from '../../../core/types';

/**
 * Item Table Rendering Service
 * Provides reusable item table rendering for views and PDFs
 * Supports Sales and Purchase vouchers with item-wise breakdown
 */
export class ItemTableService {
  /**
   * Calculate total amount for all items
   */
  static getTotalAmount(items: VoucherItemLine[]): number {
    return items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  }

  /**
   * Calculate total quantity for all items
   */
  static getTotalQuantity(items: VoucherItemLine[]): number {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }

  /**
   * Format item line for display (quantity × rate = amount)
   */
  static formatItemLine(item: VoucherItemLine): { quantity: string; rate: string; amount: string } {
    return {
      quantity: item.quantity.toLocaleString(undefined, { maximumFractionDigits: 2 }),
      rate: item.rate.toLocaleString(undefined, { maximumFractionDigits: 2 }),
      amount: (item.quantity * item.rate).toLocaleString(undefined, { maximumFractionDigits: 2 })
    };
  }

  /**
   * Validate items list
   */
  static validateItems(items: VoucherItemLine[]): { valid: boolean; error?: string } {
    if (!items || items.length === 0) {
      return { valid: false, error: 'At least one item required' };
    }

    for (const item of items) {
      if (!item.itemName) {
        return { valid: false, error: 'Item name is required' };
      }
      if (!item.subLedgerId) {
        return { valid: false, error: 'Sub-ledger ID is required' };
      }
      if (item.quantity <= 0) {
        return { valid: false, error: `Quantity must be > 0 for ${item.itemName}` };
      }
      if (item.rate < 0) {
        return { valid: false, error: `Rate cannot be negative for ${item.itemName}` };
      }
    }

    return { valid: true };
  }

  /**
   * Draw item table in PDF
   * Returns the Y position after the table
   */
  static drawItemTableInPDF(
    doc: any, // jsPDF instance
    items: VoucherItemLine[],
    startY: number,
    pageWidth: number = 210,
    margins: { left: number; right: number } = { left: 10, right: 10 }
  ): number {
    if (!items || items.length === 0) {
      return startY; // No items, return same Y position
    }

    let y = startY;
    const contentWidth = pageWidth - margins.left - margins.right;

    // Table column definitions (in mm)
    const columns = {
      sl: { width: 8, label: 'SL' },
      item: { width: 70, label: 'Item / Description' },
      quantity: { width: 25, label: 'Qty' },
      rate: { width: 28, label: 'Rate' },
      amount: { width: 29, label: 'Amount' }
    };

    // Calculate absolute X positions
    const colX = {
      sl: margins.left,
      item: margins.left + columns.sl.width,
      quantity: margins.left + columns.sl.width + columns.item.width,
      rate: margins.left + columns.sl.width + columns.item.width + columns.quantity.width,
      amount: margins.left + columns.sl.width + columns.item.width + columns.quantity.width + columns.rate.width
    };

    // Header styling
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.setFillColor(200, 200, 220); // Light blue background
    doc.setDrawColor(100);

    // Draw header row
    const headerHeight = 6;
    doc.rect(margins.left, y, contentWidth, headerHeight, 'F');
    doc.rect(margins.left, y, contentWidth, headerHeight); // Border

    const headerY = y + 3.5;
    doc.text('SL', colX.sl + 1, headerY);
    doc.text(columns.item.label, colX.item + 1, headerY);
    doc.text(columns.quantity.label, colX.quantity + columns.quantity.width - 2, headerY, { align: 'right' });
    doc.text(columns.rate.label, colX.rate + columns.rate.width - 2, headerY, { align: 'right' });
    doc.text(columns.amount.label, colX.amount + columns.amount.width - 2, headerY, { align: 'right' });

    y += headerHeight;

    // Data rows
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    const lineHeight = 4;
    const rowPadding = 1;
    let slNo = 1;

    items.forEach((item) => {
      // Split item name to fit in item column
      const maxWidth = columns.item.width - 2;
      const itemLines = doc.splitTextToSize(item.itemName, maxWidth);
      const rowHeight = Math.max(5, itemLines.length * lineHeight + 2 * rowPadding);

      // Check if we need a new page (leave 40mm for footer)
      if (y + rowHeight > 297 - 40) {
        doc.addPage();
        y = 10; // Reset to top margin on new page
      }

      // Row background (alternating)
      if (slNo % 2 === 0) {
        doc.setFillColor(245, 245, 250);
        doc.rect(margins.left, y, contentWidth, rowHeight, 'F');
      }

      // Row bottom border
      doc.setDrawColor(200);
      doc.line(margins.left, y + rowHeight, pageWidth - margins.right, y + rowHeight);

      // Column separators
      doc.line(colX.item, y, colX.item, y + rowHeight);
      doc.line(colX.quantity, y, colX.quantity, y + rowHeight);
      doc.line(colX.rate, y, colX.rate, y + rowHeight);
      doc.line(colX.amount, y, colX.amount, y + rowHeight);

      // Content
      const contentY = y + rowPadding + 2.5;

      // SL
      doc.text(slNo.toString(), colX.sl + 1, contentY);

      // Item name (wrapped)
      doc.text(itemLines, colX.item + 1, contentY);

      // Quantity (right-aligned)
      const qtyText = item.quantity.toFixed(2);
      doc.text(qtyText, colX.quantity + columns.quantity.width - 1, contentY, { align: 'right' });

      // Rate (right-aligned)
      const rateText = item.rate.toFixed(2);
      doc.text(rateText, colX.rate + columns.rate.width - 1, contentY, { align: 'right' });

      // Amount (right-aligned)
      const amountText = (item.quantity * item.rate).toFixed(2);
      doc.text(amountText, colX.amount + columns.amount.width - 1, contentY, { align: 'right' });

      y += rowHeight;
      slNo++;
    });

    // Total row
    const totalAmount = this.getTotalAmount(items);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.setFillColor(230, 230, 240);

    const totalRowHeight = 6;
    doc.rect(margins.left, y, contentWidth, totalRowHeight, 'F');
    doc.rect(margins.left, y, contentWidth, totalRowHeight); // Border

    // Column separators in total row
    doc.line(colX.item, y, colX.item, y + totalRowHeight);
    doc.line(colX.quantity, y, colX.quantity, y + totalRowHeight);
    doc.line(colX.rate, y, colX.rate, y + totalRowHeight);
    doc.line(colX.amount, y, colX.amount, y + totalRowHeight);

    // Total row content
    const totalY = y + 4;
    doc.text('TOTAL', colX.item + 1, totalY);
    doc.text(totalAmount.toFixed(2), colX.amount + columns.amount.width - 1, totalY, { align: 'right' });

    y += totalRowHeight + 2;

    // Outer border
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(margins.left, startY, contentWidth, y - startY);

    return y + 3; // Return Y position after table
  }
}
