import { Router } from 'express';
import { AnlageController } from '@/controllers/anlageController';
import { authenticate, authorize, mandantAccess } from '@/middleware/auth';
import { UserRole } from '@/types';

const router = Router();

router.use(authenticate);
router.use(mandantAccess);

router.post('/', authorize(UserRole.ADMIN, UserRole.TECHNIKER), AnlageController.createAnlage);
router.get('/search', AnlageController.searchAnlagen);
router.get('/', AnlageController.getAnlagen);
router.get('/qr/:qrCode', AnlageController.getAnlageByQrCode);
router.get('/:id', AnlageController.getAnlageById);
router.put('/:id', authorize(UserRole.ADMIN, UserRole.TECHNIKER), AnlageController.updateAnlage);
router.delete('/:id', authorize(UserRole.ADMIN), AnlageController.deleteAnlage);

export default router;