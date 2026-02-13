import jwt from 'jsonwebtoken';
import { config } from '../config';

export const generateToken = (user: { id: string; email: string; role: string }): string => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        config.jwtSecret,
        { expiresIn: '7d' }
    );
};

export const verifyToken = (token: string): any => {
    try {
        return jwt.verify(token, config.jwtSecret);
    } catch (error) {
        return null;
    }
};

export const formatResponse = <T>(success: boolean, data: T, message?: string) => {
    return {
        success,
        data,
        ...(message && { message }),
        timestamp: new Date().toISOString(),
    };
};

export const parsePagination = (page?: string | number, limit?: string | number) => {
    const pageNum = parseInt(page as string, 10) || config.defaultPage;
    const limitNum = parseInt(limit as string, 10) || config.defaultLimit;
    return {
        page: Math.max(1, pageNum),
        limit: Math.min(Math.max(1, limitNum), config.maxLimit),
        skip: (Math.max(1, pageNum) - 1) * Math.min(Math.max(1, limitNum), config.maxLimit),
    };
};
