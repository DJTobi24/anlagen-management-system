import { Router } from 'express';
import { authenticate, mandantAccess } from '@/middleware/auth';
import {
  getObjekte,
  getObjekt,
  createObjekt,
  updateObjekt,
  deleteObjekt
} from '@/controllers/objektController';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(mandantAccess);

// Get all Objekte
router.get('/', getObjekte);

// Get single Objekt
router.get('/:id', getObjekt);

// Create new Objekt
router.post('/', createObjekt);

// Update Objekt
router.put('/:id', updateObjekt);

// Delete Objekt
router.delete('/:id', deleteObjekt);

export default router;