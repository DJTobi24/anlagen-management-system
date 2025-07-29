import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getLiegenschaften,
  getBuildings,
  getAksTreeForBuilding,
  getAnlagenForAks,
  scanQrCode
} from '../controllers/fmDataController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all Liegenschaften
router.get('/liegenschaften', getLiegenschaften);

// Get buildings for a specific Liegenschaft
router.get('/liegenschaften/:liegenschaftId/buildings', getBuildings);

// Get AKS tree for a specific building
router.get('/buildings/:buildingId/aks-tree', getAksTreeForBuilding);

// Get anlagen for a specific AKS code in a building
router.get('/buildings/:buildingId/aks/:aksCode/anlagen', getAnlagenForAks);

// Scan QR code to find anlage
router.get('/scan/:qrCode', scanQrCode);

export default router;