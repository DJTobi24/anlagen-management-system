/**
 * @swagger
 * /import/upload:
 *   post:
 *     summary: Excel-Datei für Import hochladen
 *     tags: [Import]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - columnMapping
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Excel-Datei (.xlsx oder .xls)
 *               columnMapping:
 *                 type: object
 *                 description: Mapping der Excel-Spalten zu Datenfeldern
 *                 properties:
 *                   tNummer:
 *                     type: string
 *                     default: T-Nummer
 *                   aksCode:
 *                     type: string
 *                     default: AKS-Code
 *                   name:
 *                     type: string
 *                     default: Anlagenname
 *                   objektName:
 *                     type: string
 *                     default: Objekt
 *                   liegenschaftName:
 *                     type: string
 *                     default: Liegenschaft
 *                   status:
 *                     type: string
 *                     default: Status
 *                   zustandsBewertung:
 *                     type: string
 *                     default: Zustandsbewertung
 *     responses:
 *       200:
 *         description: Import gestartet
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobId:
 *                   type: string
 *                   format: uuid
 *                   description: Job-ID für Status-Abfragen
 *                 validation:
 *                   type: object
 *                   properties:
 *                     isValid:
 *                       type: boolean
 *                     totalRows:
 *                       type: integer
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           row:
 *                             type: integer
 *                           message:
 *                             type: string
 *       400:
 *         description: Ungültige Datei oder Validierungsfehler
 *       403:
 *         description: Keine Berechtigung
 * 
 * /import/jobs:
 *   get:
 *     summary: Import-Jobs abrufen
 *     tags: [Import]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Liste der Import-Jobs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ImportJob'
 *                 total:
 *                   type: integer
 * 
 * /import/jobs/{jobId}:
 *   get:
 *     summary: Status eines Import-Jobs abrufen
 *     tags: [Import]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Job-Status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ImportJob'
 *       404:
 *         description: Job nicht gefunden
 * 
 * /import/jobs/{jobId}/cancel:
 *   post:
 *     summary: Import-Job abbrechen
 *     tags: [Import]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Job abgebrochen
 *       400:
 *         description: Job kann nicht abgebrochen werden
 *       404:
 *         description: Job nicht gefunden
 * 
 * /import/jobs/{jobId}/rollback:
 *   post:
 *     summary: Import rückgängig machen
 *     tags: [Import]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Import rückgängig gemacht
 *       400:
 *         description: Rollback nicht möglich
 *       403:
 *         description: Keine Berechtigung (nur Admin)
 *       404:
 *         description: Job nicht gefunden
 * 
 * /import/jobs/{jobId}/errors:
 *   get:
 *     summary: Fehlerbericht als Excel herunterladen
 *     tags: [Import]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Excel-Datei mit Fehlerbericht
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Keine Fehler vorhanden
 *       404:
 *         description: Job nicht gefunden
 * 
 * /import/template:
 *   get:
 *     summary: Import-Vorlage herunterladen
 *     tags: [Import]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Excel-Vorlage
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 * 
 * /import/stats:
 *   get:
 *     summary: Import-Statistiken abrufen
 *     tags: [Import]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Import-Statistiken
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalJobs:
 *                   type: integer
 *                 pendingJobs:
 *                   type: integer
 *                 processingJobs:
 *                   type: integer
 *                 completedJobs:
 *                   type: integer
 *                 failedJobs:
 *                   type: integer
 */