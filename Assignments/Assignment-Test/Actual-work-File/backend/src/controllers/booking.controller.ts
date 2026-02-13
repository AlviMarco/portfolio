import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ValidationError, NotFoundError, AuthorizationError, ConflictError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const bookingController = {
    async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = req.user;
            if (user.role !== 'STUDENT') {
                throw new AuthorizationError('Only students can create bookings');
            }

            const { tutorId, dateTime, duration, notes } = req.body;

            // Validation
            const errors: string[] = [];
            if (!tutorId) errors.push('tutorId is required');
            if (!dateTime) errors.push('dateTime is required');
            if (!duration) errors.push('duration is required');

            if (errors.length > 0) {
                throw new ValidationError(errors.join(', '));
            }

            const parsedDateTime = new Date(dateTime);
            if (isNaN(parsedDateTime.getTime())) {
                throw new ValidationError('Invalid dateTime format');
            }

            if (parsedDateTime <= new Date()) {
                throw new ValidationError('Booking must be in the future');
            }

            if (typeof duration !== 'number' || duration <= 0 || duration > 24) {
                throw new ValidationError('Duration must be a positive number (max 24 hours)');
            }

            // Check if tutor exists and is a tutor
            const tutor = await prisma.user.findFirst({
                where: { id: tutorId, role: 'TUTOR' },
            });
            if (!tutor) {
                throw new NotFoundError('Tutor');
            }

            // Create booking
            const booking = await prisma.booking.create({
                data: {
                    studentId: user.id,
                    tutorId,
                    dateTime: parsedDateTime,
                    duration,
                    notes,
                },
                include: {
                    student: { select: { id: true, name: true, email: true } },
                    tutor: { select: { id: true, name: true, email: true } },
                },
            });

            res.status(201).json({
                success: true,
                data: { booking },
                message: 'Booking created successfully',
            });
        } catch (error) {
            next(error);
        }
    },

    async getAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = req.user;

            let where: any = {};
            if (user.role === 'STUDENT') {
                where.studentId = user.id;
            } else if (user.role === 'TUTOR') {
                where.tutorId = user.id;
            } else {
                throw new AuthorizationError('Invalid role for accessing bookings');
            }

            const bookings = await prisma.booking.findMany({
                where,
                include: {
                    student: { select: { id: true, name: true, email: true } },
                    tutor: { select: { id: true, name: true, email: true } },
                },
                orderBy: { dateTime: 'desc' },
            });

            res.json({
                success: true,
                data: { bookings },
            });
        } catch (error) {
            next(error);
        }
    },

    async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const user = req.user;

            if (!id || typeof id !== 'string' || id.trim() === '') {
                throw new ValidationError('Invalid booking ID');
            }

            const booking = await prisma.booking.findUnique({
                where: { id },
                include: {
                    student: { select: { id: true, name: true, email: true } },
                    tutor: { select: { id: true, name: true, email: true } },
                    reviews: true,
                },
            });

            if (!booking) {
                throw new NotFoundError('Booking');
            }

            // Check authorization: only student or tutor involved can view
            if (booking.studentId !== user.id && booking.tutorId !== user.id) {
                throw new AuthorizationError('Access denied');
            }

            res.json({
                success: true,
                data: { booking },
            });
        } catch (error) {
            next(error);
        }
    },
};
