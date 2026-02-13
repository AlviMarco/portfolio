import { jsPDF } from 'jspdf';
import { Transaction, Account, VoucherType } from '../core/types';
import { ItemTableService } from './itemTable.service';

export interface VoucherPrintConfig {
    companyName: string;
    companyAddress: string;
}

export class VoucherPrintService {
    static generateVoucherPDF(voucher: Transaction, accounts: Account[], config: VoucherPrintConfig): jsPDF {
        const doc = new jsPDF('p', 'mm', 'a4');
        let y = 15;

        // Header
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text(config.companyName, 105, y, { align: 'center' });
        y += 7;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(config.companyAddress, 105, y, { align: 'center' });
        y += 10;

        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`${voucher.voucherType} VOUCHER`, 105, y, { align: 'center' });
        y += 8;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Voucher No: ${voucher.voucherNo}`, 15, y);
        doc.text(`Date: ${voucher.date}`, 195, y, { align: 'right' });
        y += 10;

        // Item Table
        if (voucher.itemLines && voucher.itemLines.length > 0) {
            y = ItemTableService.drawItemTableInPDF(doc, voucher.itemLines, y);
            y += 5;
        }

        // Accounting Table
        doc.setFont(undefined, 'bold');
        doc.text('Accounting Details:', 15, y);
        y += 5;

        const colWidths = [100, 40, 40];
        const headers = ['Account', 'Debit', 'Credit'];
        doc.rect(15, y, 180, 7);
        doc.text(headers[0], 17, y + 5);
        doc.text(headers[1], 153, y + 5, { align: 'right' });
        doc.text(headers[2], 193, y + 5, { align: 'right' });
        y += 7;

        doc.setFont(undefined, 'normal');
        voucher.entries.forEach(entry => {
            const account = accounts.find(a => a.id === entry.accountId);
            const accName = account ? `${account.code} - ${account.name}` : 'Unknown Account';
            doc.rect(15, y, 180, 6);
            doc.text(accName, 17, y + 4.5);
            if (entry.debit > 0) doc.text(entry.debit.toFixed(2), 153, y + 4.5, { align: 'right' });
            if (entry.credit > 0) doc.text(entry.credit.toFixed(2), 193, y + 4.5, { align: 'right' });
            y += 6;
        });

        const totalDebit = voucher.entries.reduce((s, e) => s + e.debit, 0);
        const totalCredit = voucher.entries.reduce((s, e) => s + e.credit, 0);
        doc.setFont(undefined, 'bold');
        doc.rect(15, y, 180, 7);
        doc.text('TOTAL', 17, y + 5);
        doc.text(totalDebit.toFixed(2), 153, y + 5, { align: 'right' });
        doc.text(totalCredit.toFixed(2), 193, y + 5, { align: 'right' });

        return doc;
    }
}
