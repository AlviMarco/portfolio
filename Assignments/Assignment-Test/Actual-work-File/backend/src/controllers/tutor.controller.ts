import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ValidationError, NotFoundError, AuthorizationError } from '../utils/errors';
import { parsePagination } from '../utils/helpers';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const tutorController = {
    async getTutors(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { subject, rating, price } = req.query;
            const page = req.query.page as string;
            const limit = req.query.limit as string;
            const { page: pageNum, limit: limitNum } = parsePagination(page, limit);

            // Validate pagination parameters
            if (isNaN(pageNum) || pageNum < 1) {
                throw new ValidationError('Invalid page number');
            }
            if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
                throw new ValidationError('Limit must be between 1 and 100');
            }

            let where: any = { role: 'TUTOR' };

            if (subject) {
                where.tutorProfile = { subjects: { has: subject as string } };
            }

            if (price) {
                const priceNum = parseFloat(price as string);
                if (isNaN(priceNum) || priceNum < 0) {
                    throw new ValidationError('Price must be a positive number');
                }
                where.tutorProfile = { ...where.tutorProfile, hourlyRate: { lte: priceNum } };
            }

            const tutors = await prisma.user.findMany({
                where,
                include: {
                    tutorProfile: true,
                    tutorBookings: {
                        include: {
                            reviews: true
                        }
                    }
                }
            });

            const tutorsWithRating = tutors.map((tutor: any) => {
                const reviews = tutor.tutorBookings.flatMap((b: any) => b.reviews);
                const avgRating = reviews.length > 0 ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length : 0;
                return { ...tutor, averageRating: avgRating };
            });

            let filtered = tutorsWithRating;
            if (rating) {
                const ratingNum = parseFloat(rating as string);
                if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 5) {
                    throw new ValidationError('Rating must be between 0 and 5');
                }
                filtered = filtered.filter((t: any) => t.averageRating >= ratingNum);
            }

            const start = (pageNum - 1) * limitNum;
            const paginated = filtered.slice(start, start + limitNum);

            res.json({
                success: true,
                data: { tutors: paginated, total: filtered.length },
            });
        } catch (error) {
            next(error);
        }
    },

    async getTutorById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;

            if (!id || typeof id !== 'string' || id.trim() === '') {
                throw new ValidationError('Invalid tutor ID');
            }

            const tutor = await prisma.user.findFirst({
                where: { id, role: 'TUTOR' },
                include: {
                    tutorProfile: true,
                    tutorBookings: {
                        include: {
                            reviews: {
                                include: {
                                    reviewer: { select: { name: true } }
                                }
                            }
                        }
                    }
                }
            });

            if (!tutor) {
                throw new NotFoundError('Tutor');
            }

            const reviews = tutor.tutorBookings.flatMap((b: any) => b.reviews.map((r: any) => ({ ...r, bookingId: b.id })));
            const avgRating = reviews.length > 0 ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length : 0;

            res.json({
                success: true,
                data: { ...tutor, reviews, averageRating: avgRating },
            });
        } catch (error) {
            next(error);
        }
    },

    async updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { bio, subjects, hourlyRate } = req.body;
            const user = req.user;

            // Validation
            if (subjects && !Array.isArray(subjects)) {
                throw new ValidationError('Subjects must be an array');
            }

            if (hourlyRate !== undefined && (typeof hourlyRate !== 'number' || hourlyRate < 0)) {
                throw new ValidationError('Hourly rate must be a positive number');
            }

            // Check if tutor profile exists
            let tutorProfile = await prisma.tutorProfile.findUnique({
                where: { userId: user.id },
            });

            if (tutorProfile) {
                // Update existing profile
                tutorProfile = await prisma.tutorProfile.update({
                    where: { userId: user.id },
                    data: {
                        bio,
                        subjects,
                        hourlyRate,
                    },
                });
            } else {
                // Create new profile
                tutorProfile = await prisma.tutorProfile.create({
                    data: {
                        userId: user.id,
                        bio,
                        subjects,
                        hourlyRate: hourlyRate || 0,
                    },
                });
            }

            res.json({
                success: true,
                data: { tutorProfile },
                message: 'Tutor profile updated successfully',
            });
        } catch (error) {
            next(error);
        }
    },

    async getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = req.user;

            const tutorProfile = await prisma.tutorProfile.findUnique({
                where: { userId: user.id },
            });

            if (!tutorProfile) {
                throw new NotFoundError('Tutor profile');
            }

            res.json({
                success: true,
                data: { tutorProfile },
            });
        } catch (error) {
            next(error);
        }
    },

    async updateAvailability(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = req.user;
            const { availabilities } = req.body;

            if (!availabilities || !Array.isArray(availabilities)) {
                throw new ValidationError('Availabilities must be an array');
            }

            // Delete existing availabilities
            await prisma.availability.deleteMany({
                where: { tutorProfile: { userId: user.id } },
            });

            // Get or create tutor profile
            let tutorProfile = await prisma.tutorProfile.findUnique({
                where: { userId: user.id },
            });

            if (!tutorProfile) {
                tutorProfile = await prisma.tutorProfile.create({
                    data: { userId: user.id, hourlyRate: 0 },
                });
            }

            // Create new availabilities
            const newAvailabilities = await Promise.all(
                availabilities.map((a: any) =>
                    prisma.availability.create({
                        data: {
                            tutorProfileId: tutorProfile.id,
                            dayOfWeek: a.dayOfWeek,
                            startTime: a.startTime,
                            endTime: a.endTime,
                        },
                    })
                )
            );

            res.json({
                success: true,
                data: { availabilities: newAvailabilities },
                message: 'Availability updated successfully',
            });
        } catch (error) {
            next(error);
        }
    },
};
