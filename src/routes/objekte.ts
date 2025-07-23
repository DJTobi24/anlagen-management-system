import { Router } from 'express';
import { authenticate, mandantAccess } from '@/middleware/auth';

const router = Router();

router.use(authenticate);
router.use(mandantAccess);

router.get('/', (_req, res) => {
  res.json({ message: 'Objekte endpoints - to be implemented' });
});

export default router;