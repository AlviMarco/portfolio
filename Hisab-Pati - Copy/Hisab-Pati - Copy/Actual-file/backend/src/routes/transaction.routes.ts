import { Router } from 'express';
import { transactionController } from '../controllers/transaction.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/:companyId', authMiddleware as any, transactionController.createTransaction);
router.get('/:companyId', authMiddleware as any, transactionController.getTransactions);

export default router;
