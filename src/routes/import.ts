import { Router } from 'express';
import { ImportController } from '@/controllers/importController';
import { authenticate, authorize, mandantAccess } from '@/middleware/auth';
import { UserRole } from '@/types';
import { generateSampleExcelRoute } from '@/utils/createSampleExcel';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get default column mapping (no auth restrictions)
router.get('/mapping/default', ImportController.getDefaultMapping);

// Download sample Excel file (no auth restrictions)
router.get('/sample/excel', async (req, res, next) => {
  try {
    const excelBuffer = await generateSampleExcelRoute();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="anlagen_import_beispiel.xlsx"');
    res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
});

// Routes that require mandant access
router.use(mandantAccess);

// Upload Excel file and start import
router.post(
  '/upload',
  authorize(UserRole.ADMIN, UserRole.TECHNIKER),
  ImportController.uploadMiddleware,
  ImportController.uploadExcel
);

// Get all import jobs for mandant
router.get(
  '/jobs',
  ImportController.getJobs
);

// Get specific import job
router.get(
  '/jobs/:id',
  ImportController.getJobById
);

// Download error report for import job
router.get(
  '/jobs/:id/report',
  ImportController.getJobReport
);

// Cancel import job
router.post(
  '/jobs/:id/cancel',
  authorize(UserRole.ADMIN, UserRole.TECHNIKER),
  ImportController.cancelJob
);

// Rollback completed import job
router.post(
  '/jobs/:id/rollback',
  authorize(UserRole.ADMIN),
  ImportController.rollbackJob
);

// Get import statistics for mandant
router.get(
  '/stats',
  ImportController.getStats
);

// Get queue statistics (admin only)
router.get(
  '/queue/stats',
  authorize(UserRole.ADMIN),
  ImportController.getQueueStats
);

export default router;