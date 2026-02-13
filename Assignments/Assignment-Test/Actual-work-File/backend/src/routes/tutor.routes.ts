import { Router } from 'express';
import { tutorController } from '../controllers/tutor.controller';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', tutorController.getTutors);
router.get('/:id', tutorController.getTutorById);

// Protected tutor routes
router.put('/profile', requireAuth, requireRole('TUTOR'), tutorController.updateProfile);
router.get('/profile/me', requireAuth, requireRole('TUTOR'), tutorController.getProfile);
router.put('/availability', requireAuth, requireRole('TUTOR'), tutorController.updateAvailability);

export default router;
