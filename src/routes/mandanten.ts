import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import { UserRole } from '@/types';

const router = Router();

router.use(authenticate);

router.get('/', authorize(UserRole.ADMIN), (_req, res) => {
  res.json({ message: 'Mandanten endpoints - to be implemented' });
});

export default router;