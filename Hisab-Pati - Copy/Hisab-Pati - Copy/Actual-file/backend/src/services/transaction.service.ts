import { transactionRepository } from '../repositories/transaction.repository.js';

export class TransactionService {
    async createTransaction(companyId: string, data: any) {
        // Generate voucher number if not provided
        if (!data.voucherNo) {
            data.voucherNo = `VOU-${Date.now()}`;
        }

        // Basic Validation: Total Debits == Total Credits
        const totalDebit = data.entries.reduce((sum: number, e: any) => sum + (e.debit || 0), 0);
        const totalCredit = data.entries.reduce((sum: number, e: any) => sum + (e.credit || 0), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new Error('Transaction out of balance: Debits must equal Credits');
        }

        return transactionRepository.createWithEntries({
            ...data,
            companyId
        });
    }

    async getTransactions(companyId: string) {
        return transactionRepository.findByCompany(companyId);
    }
}

export const transactionService = new TransactionService();
