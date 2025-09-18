import { Router } from 'express';
import { UserManagementController } from '@/controllers/userManagementController';
import { authenticate } from '@/middleware/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// User management routes
router.get('/users', UserManagementController.getAllUsers);
router.get('/users/:id', UserManagementController.getUserById);
router.post('/users', UserManagementController.createUser);
router.put('/users/:id', UserManagementController.updateUser);
router.delete('/users/:id', UserManagementController.deleteUser);
router.post('/users/:id/change-password', UserManagementController.changePassword);
router.post('/users/reset-password', UserManagementController.resetPassword);

// Mandanten management routes (system admin only)
router.get('/mandanten', UserManagementController.getAllMandanten);
router.get('/mandanten/:id', UserManagementController.getMandantById);
router.post('/mandanten', UserManagementController.createMandant);
router.put('/mandanten/:id', UserManagementController.updateMandant);
router.delete('/mandanten/:id', UserManagementController.deleteMandant);

// Statistics
router.get('/statistics', UserManagementController.getUserStatistics);

export default router;