import { Router } from 'express';
import { SettingsController } from '@/controllers/settingsController';
import { authenticate } from '@/middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// User Profile & Preferences (available to all authenticated users)
router.get('/profile', SettingsController.getUserProfile);
router.put('/profile', SettingsController.updateUserProfile);
router.get('/preferences', SettingsController.getUserPreferences);
router.put('/preferences', SettingsController.updateUserPreferences);

// Current Mandant Settings
router.get('/mandant', SettingsController.getMandantSettings);
router.put('/mandant', SettingsController.updateMandantSettings);
router.post('/mandant/logo', SettingsController.uploadMandantLogo);

// Specific Mandant Settings (with mandantId parameter)
router.get('/mandant/:mandantId', SettingsController.getMandantSettings);
router.put('/mandant/:mandantId', SettingsController.updateMandantSettings);
router.post('/mandant/:mandantId/logo', SettingsController.uploadMandantLogo);

// All Mandanten Settings (System Admin only)
router.get('/mandanten', SettingsController.getAllMandantenSettings);

export default router;