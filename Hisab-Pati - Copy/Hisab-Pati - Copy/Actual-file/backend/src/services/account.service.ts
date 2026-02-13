import { accountRepository } from '../repositories/account.repository.js';
import { AccountType } from '@prisma/client';

export class AccountService {
    async getDefaultAccounts(companyId: string) {
        return [
            { code: '1', name: 'Assets', type: 'ASSET', level: 'MAIN', isSystem: true },
            { code: '101', name: 'Current Assets', type: 'ASSET', level: 'GROUP', parentCode: '1' },
            { code: '10101', name: 'Cash in Hand', type: 'ASSET', level: 'GL', parentCode: '101' },
            { code: '10102', name: 'Bank Account', type: 'ASSET', level: 'GL', parentCode: '101' },
            { code: '102', name: 'Fixed Assets', type: 'ASSET', level: 'GROUP', parentCode: '1' },
            { code: '103', name: 'Inventory', type: 'ASSET', level: 'GROUP', parentCode: '1', isInventoryGL: true },

            { code: '2', name: 'Liabilities', type: 'LIABILITY', level: 'MAIN', isSystem: true },
            { code: '201', name: 'Current Liabilities', type: 'LIABILITY', level: 'GROUP', parentCode: '2' },
            { code: '20101', name: 'Accounts Payable', type: 'LIABILITY', level: 'GL', parentCode: '201' },

            { code: '3', name: 'Equity', type: 'EQUITY', level: 'MAIN', isSystem: true },
            { code: '301', name: 'Owner Capital', type: 'EQUITY', level: 'GROUP', parentCode: '3' },

            { code: '4', name: 'Income', type: 'INCOME', level: 'MAIN', isSystem: true },
            { code: '401', name: 'Sales Revenue', type: 'INCOME', level: 'GROUP', parentCode: '4' },

            { code: '5', name: 'Expenses', type: 'EXPENSE', level: 'MAIN', isSystem: true },
            { code: '501', name: 'Cost of Goods Sold', type: 'EXPENSE', level: 'GROUP', parentCode: '5', isCOGSGL: true },
            { code: '502', name: 'Operating Expenses', type: 'EXPENSE', level: 'GROUP', parentCode: '5' },
        ];
    }

    async seedDefaultAccounts(companyId: string) {
        const defaultAccounts = await this.getDefaultAccounts(companyId);
        const accountMap = new Map<string, string>();

        for (const acc of defaultAccounts) {
            const { parentCode, ...accData } = acc as any;
            const parentId = parentCode ? accountMap.get(parentCode) : null;

            const createdAcc = await accountRepository.create({
                ...accData,
                companyId,
                parentAccountId: parentId,
            });
            accountMap.set(acc.code, createdAcc.id);
        }
    }

    async getChartOfAccounts(companyId: string) {
        return accountRepository.findByCompany(companyId);
    }
}

export const accountService = new AccountService();
