import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase.js';

export interface AuthRequest extends Request {
    user?: any;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Check for bypass in dev/mock mode
    const isMock = process.env.NEXT_PUBLIC_FORCE_MOCK === 'true' || !process.env.FIREBASE_PROJECT_ID;

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        if (isMock) {
            req.user = { uid: 'dev-user-id', email: 'dev@hisabpati.com' };
            return next();
        }
        return res.status(401).json({ error: 'Unauthorized', message: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];

    if (isMock && token === 'mock-token') {
        req.user = { uid: 'dev-user-id', email: 'dev@hisabpati.com' };
        return next();
    }

    try {
        const decodedToken = await auth.verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Error verifying Firebase token:', error);
        return res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
    }
};
