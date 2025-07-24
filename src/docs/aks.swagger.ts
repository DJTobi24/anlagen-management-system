/**
 * @swagger
 * /aks:
 *   get:
 *     summary: AKS-Hierarchie abrufen
 *     tags: [AKS]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Suche nach Code oder Bezeichnung
 *       - in: query
 *         name: ebene
 *         schema:
 *           type: integer
 *         description: Filter nach Hierarchieebene
 *       - in: query
 *         name: parent_code
 *         schema:
 *           type: string
 *         description: Nur Unterelemente eines bestimmten Codes
 *     responses:
 *       200:
 *         description: AKS-Hierarchie
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AksCode'
 * 
 * /aks/tree:
 *   get:
 *     summary: AKS als Baumstruktur abrufen
 *     tags: [AKS]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AKS-Baum
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AksCode'
 * 
 * /aks/{code}:
 *   get:
 *     summary: Einzelnen AKS-Code abrufen
 *     tags: [AKS]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: AKS-Code
 *     responses:
 *       200:
 *         description: AKS-Code Details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AksCode'
 *       404:
 *         description: AKS-Code nicht gefunden
 * 
 *   put:
 *     summary: AKS-Code aktualisieren
 *     tags: [AKS]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bezeichnung:
 *                 type: string
 *               beschreibung:
 *                 type: string
 *               kategorie:
 *                 type: string
 *               wartung_intervall_monate:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 120
 *     responses:
 *       200:
 *         description: AKS-Code aktualisiert
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AksCode'
 *       403:
 *         description: Keine Berechtigung (nur Admin)
 *       404:
 *         description: AKS-Code nicht gefunden
 * 
 * /aks/import:
 *   post:
 *     summary: AKS-Daten aus Excel importieren
 *     tags: [AKS]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Excel-Datei mit AKS-Daten
 *               update_existing:
 *                 type: boolean
 *                 default: false
 *                 description: Bestehende AKS-Codes aktualisieren
 *     responses:
 *       200:
 *         description: Import erfolgreich
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 imported:
 *                   type: integer
 *                   description: Anzahl importierter Codes
 *                 updated:
 *                   type: integer
 *                   description: Anzahl aktualisierter Codes
 *                 skipped:
 *                   type: integer
 *                   description: Anzahl übersprungener Codes
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       row:
 *                         type: integer
 *                       message:
 *                         type: string
 *       400:
 *         description: Ungültige Datei
 *       403:
 *         description: Keine Berechtigung (nur Admin)
 * 
 * /aks/statistics:
 *   get:
 *     summary: AKS-Statistiken abrufen
 *     tags: [AKS]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AKS-Statistiken
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_codes:
 *                   type: integer
 *                 codes_by_level:
 *                   type: object
 *                   additionalProperties:
 *                     type: integer
 *                 codes_by_category:
 *                   type: object
 *                   additionalProperties:
 *                     type: integer
 *                 anlagen_by_aks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       code:
 *                         type: string
 *                       bezeichnung:
 *                         type: string
 *                       count:
 *                         type: integer
 */