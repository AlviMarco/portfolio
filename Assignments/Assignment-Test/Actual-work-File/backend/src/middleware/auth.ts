import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticationError, AuthorizationError } from '../utils/errors';
import { verifyToken } from '../utils/helpers';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
    user?: any;
    token?: any;
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AuthenticationError('Authentication required');
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        if (!decoded) {
            throw new AuthenticationError('Invalid or expired token');
        }

        const user = await prisma.user.findUnique({
            where: { id: (decoded as any).id },
        });

        if (!user) {
            throw new AuthenticationError('User not found');
        }

        req.user = user;
        req.token = decoded;
        next();
    } catch (error) {
        if (error instanceof AuthenticationError) throw error;
        throw new AuthenticationError('Invalid session');
    }
};

export const requireRole = (...roles: string[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const user = req.user;
            if (!user) {
                throw new AuthenticationError('Authentication required');
            }

            const userRole = user.role || '';
            if (!roles.includes(userRole as string)) {
                throw new AuthorizationError(`Access denied. Required role: ${roles.join(' or ')}`);
            }
            next();
        } catch (error) {
            if (error instanceof AuthenticationError || error instanceof AuthorizationError) throw error;
            throw new AuthenticationError('Invalid session');
        }
    };
};
