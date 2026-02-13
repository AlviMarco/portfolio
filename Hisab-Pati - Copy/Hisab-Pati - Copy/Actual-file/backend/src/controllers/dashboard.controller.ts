import type { Response } from 'express';
import { dashboardService } from '../services/dashboard.service.js';
import type { AuthRequest } from '../middlewares/auth.middleware.js';

export class DashboardController {
    async getDashboardData(req: AuthRequest, res: Response) {
        try {
            const companyId = (req.params.companyId || req.query.companyId) as string;

            if (!companyId) {
                return res.status(400).json({ error: 'Company ID is required' });
            }

            const data = await dashboardService.getDashboardData(companyId);
            res.json(data);
        } catch (error: any) {
            console.error('Error fetching dashboard data:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

export const dashboardController = new DashboardController();
