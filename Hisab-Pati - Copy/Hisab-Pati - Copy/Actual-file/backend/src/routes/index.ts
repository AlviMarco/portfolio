import { Router } from 'express';
import accountRoutes from './account.routes.js';
import transactionRoutes from './transaction.routes.js';
import inventoryRoutes from './inventory.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import companyRoutes from './company.routes.js';

const router = Router();

router.use('/accounts', accountRoutes);
router.use('/transactions', transactionRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/companies', companyRoutes);

export default router;
