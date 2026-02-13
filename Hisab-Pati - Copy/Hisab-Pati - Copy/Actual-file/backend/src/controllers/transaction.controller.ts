import type { Response } from 'express';
import { transactionService } from '../services/transaction.service.js';
import type { AuthRequest } from '../middlewares/auth.middleware.js';

export class TransactionController {
    async createTransaction(req: AuthRequest, res: Response) {
        try {
            const { companyId } = req.params;
            const transaction = await transactionService.createTransaction(companyId as string, req.body);
            res.status(201).json(transaction);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async getTransactions(req: AuthRequest, res: Response) {
        try {
            const { companyId } = req.params;
            const transactions = await transactionService.getTransactions(companyId as string);
            res.json(transactions);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

export const transactionController = new TransactionController();
