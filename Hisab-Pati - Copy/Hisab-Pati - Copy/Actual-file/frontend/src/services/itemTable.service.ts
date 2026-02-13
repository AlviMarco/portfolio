import { ItemLine } from '../core/types';

/**
 * Item Table Rendering Service
 * Provides reusable item table rendering for PDFs
 */
export class ItemTableService {
    static getTotalAmount(items: ItemLine[]): number {
        return items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
    }

    static drawItemTableInPDF(
        doc: any,
        items: ItemLine[],
        startY: number,
        pageWidth: number = 210,
        margins: { left: number; right: number } = { left: 10, right: 10 }
    ): number {
        if (!items || items.length === 0) return startY;

        let y = startY;
        const contentWidth = pageWidth - margins.left - margins.right;

        const columns = {
            sl: { width: 10, label: 'SL' },
            item: { width: 80, label: 'Item / Description' },
            quantity: { width: 25, label: 'Qty' },
            rate: { width: 25, label: 'Rate' },
            amount: { width: 30, label: 'Amount' }
        };

        const colX = {
            sl: margins.left,
            item: margins.left + columns.sl.width,
            quantity: margins.left + columns.sl.width + columns.item.width,
            rate: margins.left + columns.sl.width + columns.item.width + columns.quantity.width,
            amount: margins.left + columns.sl.width + columns.item.width + columns.quantity.width + columns.rate.width
        };

        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.setFillColor(230, 230, 235);
        doc.rect(margins.left, y, contentWidth, 7, 'F');
        doc.rect(margins.left, y, contentWidth, 7);

        doc.text('SL', colX.sl + 2, y + 5);
        doc.text('Item / Description', colX.item + 2, y + 5);
        doc.text('Qty', colX.quantity + columns.quantity.width - 2, y + 5, { align: 'right' });
        doc.text('Rate', colX.rate + columns.rate.width - 2, y + 5, { align: 'right' });
        doc.text('Amount', colX.amount + columns.amount.width - 2, y + 5, { align: 'right' });

        y += 7;
        doc.setFont(undefined, 'normal');

        items.forEach((item, index) => {
            const rowHeight = 6;
            doc.rect(margins.left, y, contentWidth, rowHeight);
            doc.text((index + 1).toString(), colX.sl + 5, y + 4.5, { align: 'center' });
            doc.text(item.itemName, colX.item + 2, y + 4.5);
            doc.text(item.quantity.toString(), colX.quantity + columns.quantity.width - 2, y + 4.5, { align: 'right' });
            doc.text(item.rate.toFixed(2), colX.rate + columns.rate.width - 2, y + 4.5, { align: 'right' });
            doc.text((item.quantity * item.rate).toFixed(2), colX.amount + columns.amount.width - 2, y + 4.5, { align: 'right' });
            y += rowHeight;
        });

        return y;
    }
}
