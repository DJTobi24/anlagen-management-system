import { Router } from 'express';
import { AksController } from '@/controllers/aksController';
import { authenticate, authorize } from '@/middleware/auth';
import { UserRole } from '@/types';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all AKS codes (basic endpoint)
router.get('/', AksController.searchAksCodes);

// Public endpoints (all authenticated users)
router.get('/categories', AksController.getAksCategories);
router.get('/field-types', AksController.getFieldTypes);
router.get('/data-types', AksController.getDataTypes);

// Search and view AKS codes (all authenticated users)
router.get('/search', AksController.searchAksCodes);
router.get('/tree', AksController.getAksTree);
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

router.delete(
  '/codes/:id',
  authorize(UserRole.ADMIN),
  AksController.deleteAksCode
);

router.patch(
  '/codes/:id/toggle',
  authorize(UserRole.ADMIN),
  AksController.toggleAksCodeStatus
);

// Bulk operations
router.post(
  '/codes/bulk/delete',
  authorize(UserRole.ADMIN),
  AksController.bulkDeleteAksCodes
);

router.post(
  '/codes/bulk/toggle',
  authorize(UserRole.ADMIN),
  AksController.bulkToggleAksCodesStatus
);

router.post(
  '/codes/bulk/update',
  authorize(UserRole.ADMIN),
  AksController.bulkUpdateAksCodes
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

// Import AKS from Excel (admin only) - for field mappings
router.post(
  '/import',
  authorize(UserRole.ADMIN),
  AksController.uploadMiddleware,
  AksController.importAksFromExcel
);

// Download import template for field mappings
router.get(
  '/import/template',
  authorize(UserRole.ADMIN),
  AksController.downloadImportTemplate
);

// Import AKS codes from Excel (admin only)
router.post(
  '/codes/import',
  authorize(UserRole.ADMIN),
  AksController.uploadMiddleware,
  AksController.importAksFromExcel
);

// Download AKS codes import template
router.get(
  '/codes/import/template',
  authorize(UserRole.ADMIN),
  AksController.downloadAksImportTemplate
);

// Download error report
router.post(
  '/import/error-report',
  authorize(UserRole.ADMIN),
  AksController.downloadAksErrorReport
);

export default router;