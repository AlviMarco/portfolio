import { companyRepository } from '../repositories/company.repository.js';
import { accountService } from './account.service.js';

export class CompanyService {
    async createCompany(userId: string, data: any) {
        const company = await companyRepository.create({
            ...data,
            userId,
            financialYearStart: new Date(data.financialYearStart),
            financialYearEnd: new Date(data.financialYearEnd),
        });

        // Seed accounts for the new company
        await accountService.seedDefaultAccounts(company.id);

        return company;
    }

    async getCompanies(userId: string) {
        return companyRepository.findByUser(userId);
    }
}

export const companyService = new CompanyService();
