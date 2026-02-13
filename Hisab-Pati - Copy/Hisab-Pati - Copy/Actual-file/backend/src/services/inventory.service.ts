import { inventoryRepository } from '../repositories/inventory.repository.js';

export class InventoryService {
    async getItems(companyId: string) {
        return inventoryRepository.findByCompany(companyId);
    }

    async getLowStock(companyId: string) {
        return inventoryRepository.findLowStock(companyId);
    }

    async createItem(companyId: string, data: any) {
        return inventoryRepository.create({
            ...data,
            companyId,
            quantity: data.quantity || 0,
        });
    }
}

export const inventoryService = new InventoryService();
