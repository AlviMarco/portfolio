import { prisma } from '../config/prisma.js';
import { AccountType, MovementType } from '@prisma/client';

export class DashboardRepository {
    async getStats(companyId: string) {
        // 1. Total Revenue (Income accounts balance)
        const revenueResult = await prisma.account.aggregate({
            where: {
                companyId,
                type: AccountType.INCOME
            },
            _sum: {
                balance: true
            }
        });

        // 2. Cash in Hand (Asset accounts with 'Cash' or 'Bank' in name)
        const cashResult = await prisma.account.aggregate({
            where: {
                companyId,
                type: AccountType.ASSET,
                OR: [
                    { name: { contains: 'Cash', mode: 'insensitive' } },
                    { name: { contains: 'Bank', mode: 'insensitive' } }
                ]
            },
            _sum: {
                balance: true
            }
        });

        // 3. Inventory Value (Asset accounts marked as isInventoryGL)
        const inventoryValueResult = await prisma.account.aggregate({
            where: {
                companyId,
                type: AccountType.ASSET,
                isInventoryGL: true
            },
            _sum: {
                balance: true
            }
        });

        // 4. Outstanding Debt (Liability accounts balance)
        const debtResult = await prisma.account.aggregate({
            where: {
                companyId,
                type: AccountType.LIABILITY
            },
            _sum: {
                balance: true
            }
        });

        return {
            totalRevenue: revenueResult._sum.balance || 0,
            cashInHand: cashResult._sum.balance || 0,
            inventoryValue: inventoryValueResult._sum.balance || 0,
            outstandingDebt: debtResult._sum.balance || 0
        };
    }

    async getRecentTransactions(companyId: string, limit: number = 5) {
        return prisma.transaction.findMany({
            where: { companyId },
            take: limit,
            orderBy: { date: 'desc' },
            include: {
                entries: {
                    include: {
                        account: true
                    }
                }
            }
        });
    }

    async getLowStockItems(companyId: string, threshold: number = 10) {
        return prisma.inventoryItem.findMany({
            where: {
                companyId,
                quantity: {
                    lt: threshold
                }
            },
            orderBy: {
                quantity: 'asc'
            }
        });
    }
}

export const dashboardRepository = new DashboardRepository();
