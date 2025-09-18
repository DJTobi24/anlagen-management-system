import { Router } from 'express';
import { authenticate } from '@/middleware/authMiddleware';
import * as mfaController from '@/controllers/mfaController';
import { AuthRequest } from '@/types';

const router = Router();

// MFA Routes
router.get('/status', authenticate, mfaController.getMfaStatus);
router.post('/setup', authenticate, mfaController.setupMfa);
router.post('/verify-setup', authenticate, mfaController.verifyMfaSetup);
router.post('/disable', authenticate, mfaController.disableMfa);

export default router;