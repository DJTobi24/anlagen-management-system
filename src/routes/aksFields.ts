import { Router } from 'express';
import aksFieldController from '../controllers/aksFieldController';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

// Middleware für alle Routen
router.use(authenticate as any);

// Field definitions
router.get('/fields', aksFieldController.getAllFields.bind(aksFieldController));
router.get('/fields/:aksCode', aksFieldController.getFieldsByAksCode.bind(aksFieldController));
router.post('/fields', aksFieldController.upsertFieldDefinition.bind(aksFieldController));
router.put('/fields/:id', aksFieldController.upsertFieldDefinition.bind(aksFieldController));
router.delete('/fields/:id', aksFieldController.deleteFieldDefinition.bind(aksFieldController));

// Bulk operations
router.post('/fields/bulk', aksFieldController.bulkUpdateFields.bind(aksFieldController));
router.post('/fields/copy', aksFieldController.copyFieldDefinitions.bind(aksFieldController));

// Anlage field values
router.get('/anlage/:anlageId/values', aksFieldController.getAnlageFieldValues.bind(aksFieldController));
router.post('/anlage/:anlageId/values', aksFieldController.saveAnlageFieldValues.bind(aksFieldController));
router.post('/anlage/:anlageId/validate', aksFieldController.validateAnlageFields.bind(aksFieldController));

// Statistics
router.get('/statistics', aksFieldController.getFieldStatistics.bind(aksFieldController));

export default router;