import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const categoryController = {
    async getAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const categories = await prisma.category.findMany();
            res.json({
                success: true,
                data: { categories },
            });
        } catch (error) {
            next(error);
        }
    },

    async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = req.user;
            const { name, description } = req.body;

            const category = await prisma.category.create({
                data: { name, description },
            });

            res.status(201).json({
                success: true,
                data: { category },
                message: 'Category created successfully',
            });
        } catch (error) {
            next(error);
        }
    },
};
