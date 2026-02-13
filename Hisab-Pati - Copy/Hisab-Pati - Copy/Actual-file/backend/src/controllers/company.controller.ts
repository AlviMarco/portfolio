import type { Response } from 'express';
import { companyService } from '../services/company.service.js';
import type { AuthRequest } from '../middlewares/auth.middleware.js';

export class CompanyController {
    async createCompany(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.uid;
            const company = await companyService.createCompany(userId, req.body);
            res.status(201).json(company);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async getCompanies(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.uid;
            const companies = await companyService.getCompanies(userId);
            res.json(companies);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

export const companyController = new CompanyController();
