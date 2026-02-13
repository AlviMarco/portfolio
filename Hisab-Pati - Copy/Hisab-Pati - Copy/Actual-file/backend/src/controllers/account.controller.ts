import type { Request, Response } from 'express';
import { accountService } from '../services/account.service.js';
import type { AuthRequest } from '../middlewares/auth.middleware.js';

export class AccountController {
    async getChartOfAccounts(req: AuthRequest, res: Response) {
        try {
            const { companyId } = req.params;
            const accounts = await accountService.getChartOfAccounts(companyId as string);
            res.json(accounts);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

export const accountController = new AccountController();
