import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ValidationError, NotFoundError, AuthorizationError, ConflictError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const reviewController = {
    async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const user = req.user;
            const { rating, comment } = req.body;

            // Validation
            if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
                throw new ValidationError('Rating must be a number between 1 and 5');
            }

            // Check if booking exists
            const booking = await prisma.booking.findUnique({
                where: { id },
                include: { reviews: true },
            });

            if (!booking) {
                throw new NotFoundError('Booking');
            }

            // Check if user is the student
            if (booking.studentId !== user.id) {
                throw new AuthorizationError('Only the student can review this booking');
            }

            // Check if booking is completed (dateTime is in the past)
            if (new Date(booking.dateTime) > new Date()) {
                throw new ValidationError('Cannot review a booking that has not yet occurred');
            }

            // Check if review already exists
            if (booking.reviews.length > 0) {
                throw new ConflictError('Review already exists for this booking');
            }

            // Create review
            const review = await prisma.review.create({
                data: {
                    bookingId: id,
                    reviewerId: user.id,
                    rating,
                    comment,
                },
            });

            res.status(201).json({
                success: true,
                data: { review },
                message: 'Review created successfully',
            });
        } catch (error) {
            next(error);
        }
    },
};
