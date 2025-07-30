import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';
import {
  getDatenaufnahmen,
  getMeineAuftraege,
  getDatenaufnahme,
  createDatenaufnahme,
  updateDatenaufnahme,
  updateAnlagenConfig,
  markAnlageBearbeitet,
  addAnlageToDatenaufnahme,
  deleteDatenaufnahme,
  getDatenaufnahmeFortschritt
} from '../controllers/datenaufnahmeController';

const router = Router();

// Alle Routen benötigen Authentifizierung
router.use(authenticate);

// GET /api/v1/datenaufnahme/meine-auftraege - Meine Aufträge abrufen (für Mitarbeiter)
router.get('/meine-auftraege', getMeineAuftraege);

// GET /api/v1/datenaufnahme - Alle Datenaufnahmen abrufen
router.get('/', getDatenaufnahmen);

// GET /api/v1/datenaufnahme/:id - Einzelne Datenaufnahme abrufen
router.get('/:id', getDatenaufnahme);

// GET /api/v1/datenaufnahme/:id/fortschritt - Fortschritt abrufen
router.get('/:id/fortschritt', getDatenaufnahmeFortschritt);

// POST /api/v1/datenaufnahme - Neue Datenaufnahme erstellen (Admin/Supervisor)
router.post('/', authorize(UserRole.ADMIN, UserRole.SUPERVISOR), createDatenaufnahme);

// PUT /api/v1/datenaufnahme/:id - Datenaufnahme aktualisieren (Admin/Ersteller)
router.put('/:id', updateDatenaufnahme);

// PUT /api/v1/datenaufnahme/:id/anlagen-config - Anlagen-Konfiguration aktualisieren
router.put('/:id/anlagen-config', authorize(UserRole.ADMIN, UserRole.SUPERVISOR), updateAnlagenConfig);

// POST /api/v1/datenaufnahme/:aufnahmeId/anlagen/:anlageId/bearbeitet - Anlage als bearbeitet markieren
router.post('/:aufnahmeId/anlagen/:anlageId/bearbeitet', markAnlageBearbeitet);

// POST /api/v1/datenaufnahme/:aufnahmeId/anlagen/:anlageId/hinzufuegen - Anlage zu Datenaufnahme hinzufügen
router.post('/:aufnahmeId/anlagen/:anlageId/hinzufuegen', addAnlageToDatenaufnahme);

// DELETE /api/v1/datenaufnahme/:id - Datenaufnahme löschen (Admin)
router.delete('/:id', authorize(UserRole.ADMIN), deleteDatenaufnahme);

export default router;