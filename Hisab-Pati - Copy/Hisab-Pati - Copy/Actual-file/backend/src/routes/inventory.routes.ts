import { Router } from 'express';
import { inventoryController } from '../controllers/inventory.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/:companyId', authMiddleware as any, inventoryController.getItems);
router.get('/:companyId/low-stock', authMiddleware as any, inventoryController.getLowStock);
router.post('/:companyId', authMiddleware as any, inventoryController.createItem);

export default router;
