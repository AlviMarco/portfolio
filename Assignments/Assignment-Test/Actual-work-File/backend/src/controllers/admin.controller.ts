import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ValidationError, NotFoundError, AuthorizationError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const adminController = {
    async getUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { role, status, page = '1', limit = '10' } = req.query;

            const pageNum = parseInt(page as string, 10);
            const limitNum = parseInt(limit as string, 10);
            const skip = (pageNum - 1) * limitNum;

            let where: any = {};
            if (role) {
                where.role = role;
            }
            if (status) {
                where.status = status;
            }

            const users = await prisma.user.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    status: true,
                    createdAt: true,
                },
            });

            const total = await prisma.user.count({ where });

            res.json({
                success: true,
                data: { users, total, page: pageNum, limit: limitNum },
            });
        } catch (error) {
            next(error);
        }
    },

    async updateUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const { role, status } = req.body;

            if (!id || typeof id !== 'string' || id.trim() === '') {
                throw new ValidationError('Invalid user ID');
            }

            const user = await prisma.user.update({
                where: { id },
                data: {
                    ...(role && { role }),
                    ...(status && { status }),
                },
            });

            res.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        status: user.status,
                    },
                },
                message: 'User updated successfully',
            });
        } catch (error) {
            next(error);
        }
    },

    async getBookings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { status, page = '1', limit = '10' } = req.query;

            const pageNum = parseInt(page as string, 10);
            const limitNum = parseInt(limit as string, 10);
            const skip = (pageNum - 1) * limitNum;

            let where: any = {};
            if (status) {
                where.status = status;
            }

            const bookings = await prisma.booking.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
                include: {
                    student: { select: { id: true, name: true, email: true } },
                    tutor: { select: { id: true, name: true, email: true } },
                },
            });

            const total = await prisma.booking.count({ where });

            res.json({
                success: true,
                data: { bookings, total, page: pageNum, limit: limitNum },
            });
        } catch (error) {
            next(error);
        }
    },

    async getCategories(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const categories = await prisma.category.findMany({
                orderBy: { name: 'asc' },
            });

            res.json({
                success: true,
                data: { categories },
            });
        } catch (error) {
            next(error);
        }
    },

    async createCategory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
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
