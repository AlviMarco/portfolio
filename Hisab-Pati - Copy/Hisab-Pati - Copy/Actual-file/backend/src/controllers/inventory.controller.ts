import type { Response } from 'express';
import { inventoryService } from '../services/inventory.service.js';
import type { AuthRequest } from '../middlewares/auth.middleware.js';

export class InventoryController {
    async getItems(req: AuthRequest, res: Response) {
        try {
            const { companyId } = req.params;
            const items = await inventoryService.getItems(companyId as string);
            res.json(items);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async getLowStock(req: AuthRequest, res: Response) {
        try {
            const { companyId } = req.params;
            const items = await inventoryService.getLowStock(companyId as string);
            res.json(items);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async createItem(req: AuthRequest, res: Response) {
        try {
            const { companyId } = req.params;
            const item = await inventoryService.createItem(companyId as string, req.body);
            res.status(201).json(item);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
}

export const inventoryController = new InventoryController();
