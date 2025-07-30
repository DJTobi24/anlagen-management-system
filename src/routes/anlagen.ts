import { Router } from 'express';
import { AnlageController } from '@/controllers/anlageController';
import { authenticate, authorize, mandantAccess } from '@/middleware/auth';
import { UserRole } from '@/types';

const router = Router();

router.use(authenticate);
router.use(mandantAccess);

// Create anlage
router.post('/', authorize(UserRole.ADMIN, UserRole.TECHNIKER), AnlageController.createAnlage);

// Specific routes first (before the generic /:id route)
router.get('/search', AnlageController.searchAnlagen);
router.get('/statistics', AnlageController.getStatistics);
router.get('/wartung/faellig', AnlageController.getWarungenFaellig);
router.get('/qr/:qrCode', AnlageController.getAnlageByQrCode);

// List all anlagen
router.get('/', AnlageController.getAnlagen);

// Generic routes with ID parameter (must be last)
router.get('/:id', AnlageController.getAnlageById);
router.get('/:id/history', AnlageController.getAnlageHistory);
router.put('/:id', authorize(UserRole.ADMIN, UserRole.TECHNIKER), AnlageController.updateAnlage);
router.delete('/:id', authorize(UserRole.ADMIN), AnlageController.deleteAnlage);

export default router;