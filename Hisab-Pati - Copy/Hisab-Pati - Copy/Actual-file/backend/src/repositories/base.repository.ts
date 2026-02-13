import { prisma } from '../config/prisma.js';

export abstract class BaseRepository<T> {
    protected model: any;

    constructor(modelName: string) {
        this.model = (prisma as any)[modelName];
    }

    async findAll(where: object = {}): Promise<T[]> {
        return this.model.findMany({ where });
    }

    async findById(id: string): Promise<T | null> {
        return this.model.findUnique({ where: { id } });
    }

    async create(data: any): Promise<T> {
        return this.model.create({ data });
    }

    async update(id: string, data: any): Promise<T> {
        return this.model.update({ where: { id }, data });
    }

    async delete(id: string): Promise<T> {
        return this.model.delete({ where: { id } });
    }
}
