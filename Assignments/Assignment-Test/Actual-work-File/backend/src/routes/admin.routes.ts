import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Admin routes - require ADMIN role
router.use(requireAuth, requireRole('ADMIN'));

// User management
router.get('/users', adminController.getUsers);
router.patch('/users/:id', adminController.updateUser);

// Booking management
router.get('/bookings', adminController.getBookings);

// Category management
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);

export default router;
