import { BaseRepository } from './base.repository.js';
import type { Company } from '@prisma/client';

export class CompanyRepository extends BaseRepository<Company> {
    constructor() {
        super('company');
    }

    async findByUser(userId: string) {
        return this.model.findMany({
            where: { userId, isActive: true }
        });
    }
}

export const companyRepository = new CompanyRepository();
