/**
 * @swagger
 * /fm-data/liegenschaften:
 *   get:
 *     summary: Liegenschaften für FM-Datenaufnahme
 *     tags: [FM-Datenaufnahme]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste der Liegenschaften mit Zählern
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   name:
 *                     type: string
 *                   building_count:
 *                     type: integer
 *                   anlage_count:
 *                     type: integer
 * 
 * /fm-data/liegenschaften/{liegenschaftId}/buildings:
 *   get:
 *     summary: Gebäude einer Liegenschaft für FM-Datenaufnahme
 *     tags: [FM-Datenaufnahme]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: liegenschaftId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Liste der Gebäude
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   name:
 *                     type: string
 *                   floor:
 *                     type: string
 *                   room:
 *                     type: string
 *                   anlage_count:
 *                     type: integer
 * 
 * /fm-data/buildings/{buildingId}/aks-tree:
 *   get:
 *     summary: AKS-Baum für ein Gebäude
 *     tags: [FM-Datenaufnahme]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: buildingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: AKS-Hierarchie mit Anlagenzählern
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   code:
 *                     type: string
 *                   bezeichnung:
 *                     type: string
 *                   ebene:
 *                     type: integer
 *                   anlage_count:
 *                     type: integer
 *                   children:
 *                     type: array
 *                     items:
 *                       type: object
 * 
 * /fm-data/buildings/{buildingId}/aks/{aksCode}/anlagen:
 *   get:
 *     summary: Anlagen eines AKS-Codes in einem Gebäude
 *     tags: [FM-Datenaufnahme]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: buildingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: aksCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Liste der Anlagen
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   t_nummer:
 *                     type: string
 *                   name:
 *                     type: string
 *                   status:
 *                     type: string
 *                   zustands_bewertung:
 *                     type: integer
 *                   letzte_wartung:
 *                     type: string
 *                     format: date
 *                   naechste_wartung:
 *                     type: string
 *                     format: date
 * 
 * /fm-data/anlagen/{anlageId}/quick-update:
 *   patch:
 *     summary: Schnellaktualisierung einer Anlage
 *     tags: [FM-Datenaufnahme]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: anlageId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [aktiv, inaktiv, wartung, defekt]
 *               zustands_bewertung:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               notes:
 *                 type: string
 *                 description: Notizen zur Aktualisierung
 *     responses:
 *       200:
 *         description: Anlage aktualisiert
 *       404:
 *         description: Anlage nicht gefunden
 * 
 * /fm-data/scan/{qrCode}:
 *   get:
 *     summary: Anlage per QR-Code finden
 *     tags: [FM-Datenaufnahme]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: qrCode
 *         required: true
 *         schema:
 *           type: string
 *         description: Gescannter QR-Code
 *     responses:
 *       200:
 *         description: Anlageninformationen
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 anlage:
 *                   $ref: '#/components/schemas/Anlage'
 *                 objekt:
 *                   $ref: '#/components/schemas/Objekt'
 *                 liegenschaft:
 *                   $ref: '#/components/schemas/Liegenschaft'
 *       404:
 *         description: Anlage nicht gefunden
 */