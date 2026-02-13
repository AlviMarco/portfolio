import { BaseRepository } from './base.repository.js';
import type { InventoryItem } from '@prisma/client';

export class InventoryRepository extends BaseRepository<InventoryItem> {
    constructor() {
        super('inventoryItem');
    }

    async findByCompany(companyId: string) {
        return this.model.findMany({
            where: { companyId },
            include: {
                movements: true
            },
            orderBy: { name: 'asc' }
        });
    }

    async findLowStock(companyId: string) {
        return this.model.findMany({
            where: {
                companyId,
                quantity: {
                    lte: 5 // Default low stock threshold, can be customized per item
                }
            }
        });
    }
}

export const inventoryRepository = new InventoryRepository();
