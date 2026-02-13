import { BaseRepository } from './base.repository.js';
import type { Account } from '@prisma/client';

export class AccountRepository extends BaseRepository<Account> {
    constructor() {
        super('account');
    }

    async findByCompany(companyId: string) {
        return this.model.findMany({
            where: { companyId },
            include: { subAccounts: true },
            orderBy: { code: 'asc' }
        });
    }

    async findByCode(companyId: string, code: string) {
        return this.model.findUnique({
            where: {
                companyId_code: { companyId, code }
            }
        });
    }
}

export const accountRepository = new AccountRepository();
