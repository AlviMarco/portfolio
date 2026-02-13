import { Router } from 'express';
import { companyController } from '../controllers/company.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/', authMiddleware as any, companyController.createCompany);
router.get('/active', authMiddleware as any, companyController.getCompanies);
router.get('/', authMiddleware as any, companyController.getCompanies);

export default router;
