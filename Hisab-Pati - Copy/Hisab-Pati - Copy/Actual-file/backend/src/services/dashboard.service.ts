import { dashboardRepository } from '../repositories/dashboard.repository.js';

export class DashboardService {
    async getDashboardData(companyId: string) {
        const [stats, recentTransactions, lowStockItems] = await Promise.all([
            dashboardRepository.getStats(companyId),
            dashboardRepository.getRecentTransactions(companyId),
            dashboardRepository.getLowStockItems(companyId)
        ]);

        return {
            stats,
            recentTransactions,
            lowStockItems
        };
    }
}

export const dashboardService = new DashboardService();
