import { Router } from 'express';
import { authenticate, mandantAccess } from '@/middleware/auth';
import {
  getLiegenschaften,
  getLiegenschaft,
  createLiegenschaft,
  updateLiegenschaft,
  deleteLiegenschaft
} from '@/controllers/liegenschaftController';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(mandantAccess);

// Get all Liegenschaften
router.get('/', getLiegenschaften);

// Get single Liegenschaft
router.get('/:id', getLiegenschaft);

// Create new Liegenschaft
router.post('/', createLiegenschaft);

// Update Liegenschaft
router.put('/:id', updateLiegenschaft);

// Delete Liegenschaft
router.delete('/:id', deleteLiegenschaft);

export default router;