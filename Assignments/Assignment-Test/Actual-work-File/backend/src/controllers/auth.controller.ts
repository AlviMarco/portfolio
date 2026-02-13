import { Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth';

export const authController = {
    async register(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email, password, name, role } = req.body;
            const result = await authService.register({ email, password, name, role });

            res.status(201).json({
                success: true,
                data: result,
                message: 'User registered successfully',
            });
        } catch (error) {
            next(error);
        }
    },

    async login(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email, password } = req.body;
            const result = await authService.login({ email, password });

            res.json({
                success: true,
                data: result,
                message: 'Login successful',
            });
        } catch (error) {
            next(error);
        }
    },

    async me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = req.user;
            const userData = await authService.getMe(user.id);

            res.json({
                success: true,
                data: { user: userData },
            });
        } catch (error) {
            next(error);
        }
    },
};
