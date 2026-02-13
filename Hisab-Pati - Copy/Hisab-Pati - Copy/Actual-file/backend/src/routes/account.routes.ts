import { Router } from 'express';
import { accountController } from '../controllers/account.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/:companyId', authMiddleware as any, accountController.getChartOfAccounts);

export default router;
