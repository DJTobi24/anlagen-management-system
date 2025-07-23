import { Router } from 'express';
import { AksController } from '@/controllers/aksController';
import { authenticate, authorize } from '@/middleware/auth';
import { UserRole } from '@/types';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Public endpoints (all authenticated users)
router.get('/categories', AksController.getAksCategories);
router.get('/field-types', AksController.getFieldTypes);
router.get('/data-types', AksController.getDataTypes);

// Search and view AKS codes (all authenticated users)
router.get('/search', AksController.searchAksCodes);
router.get('/code/:code', AksController.getAksCode);
router.get('/code/:code/mapping', AksController.getAksFieldMapping);

// Validate field values (all authenticated users)
router.post('/validate', AksController.validateAksFields);

// Admin-only endpoints for AKS management
router.post(
  '/codes',
  authorize(UserRole.ADMIN),
  AksController.createAksCode
);

router.put(
  '/codes/:id',
  authorize(UserRole.ADMIN),
  AksController.updateAksCode
);

// Field management (admin only)
router.post(
  '/codes/:codeId/fields',
  authorize(UserRole.ADMIN),
  AksController.createAksField
);

router.put(
  '/fields/:fieldId',
  authorize(UserRole.ADMIN),
  AksController.updateAksField
);

router.delete(
  '/fields/:fieldId',
  authorize(UserRole.ADMIN),
  AksController.deleteAksField
);

// Import AKS from Excel (admin only)
router.post(
  '/import',
  authorize(UserRole.ADMIN),
  AksController.uploadMiddleware,
  AksController.importAksFromExcel
);

// Download error report
router.post(
  '/import/error-report',
  authorize(UserRole.ADMIN),
  AksController.downloadAksErrorReport
);

export default router;