import { Router } from 'express';
import { UserController } from '@/controllers/userController';
import { authenticate, authorize, mandantAccess } from '@/middleware/auth';
import { UserRole } from '@/types';

const router = Router();

router.use(authenticate);
router.use(mandantAccess);

router.post('/', authorize(UserRole.ADMIN), UserController.createUser);
router.get('/', authorize(UserRole.ADMIN, UserRole.TECHNIKER), UserController.getUsers);
router.get('/:id', authorize(UserRole.ADMIN, UserRole.TECHNIKER), UserController.getUserById);
router.put('/:id', authorize(UserRole.ADMIN), UserController.updateUser);
router.delete('/:id', authorize(UserRole.ADMIN), UserController.deleteUser);

export default router;