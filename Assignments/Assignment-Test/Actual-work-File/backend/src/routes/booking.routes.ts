import { Router } from 'express';
import { bookingController } from '../controllers/booking.controller';
import { reviewController } from '../controllers/review.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Booking routes
router.post('/', requireAuth, bookingController.create);
router.get('/', requireAuth, bookingController.getAll);
router.get('/:id', requireAuth, bookingController.getById);

// Review routes
router.post('/:id/reviews', requireAuth, reviewController.create);

export default router;
