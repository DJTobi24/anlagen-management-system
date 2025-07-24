/**
 * @swagger
 * /objekte:
 *   get:
 *     summary: Alle Objekte abrufen
 *     tags: [Objekte]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: liegenschaft_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter nach Liegenschaft
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Suche nach Name
 *       - in: query
 *         name: floor
 *         schema:
 *           type: string
 *         description: Filter nach Etage
 *     responses:
 *       200:
 *         description: Liste der Objekte
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Objekt'
 * 
 *   post:
 *     summary: Neues Objekt erstellen
 *     tags: [Objekte]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - liegenschaft_id
 *             properties:
 *               liegenschaft_id:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *                 example: Gebäude A
 *               floor:
 *                 type: string
 *                 example: EG, 1. OG
 *               room:
 *                 type: string
 *                 example: 101
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Objekt erstellt
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Objekt'
 *       400:
 *         description: Ungültige Eingabedaten
 *       403:
 *         description: Keine Berechtigung
 * 
 * /objekte/{id}:
 *   get:
 *     summary: Objekt nach ID abrufen
 *     tags: [Objekte]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Objektinformationen
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Objekt'
 *       404:
 *         description: Objekt nicht gefunden
 * 
 *   put:
 *     summary: Objekt aktualisieren
 *     tags: [Objekte]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               name:
 *                 type: string
 *               liegenschaft_id:
 *                 type: string
 *                 format: uuid
 *               floor:
 *                 type: string
 *               room:
 *                 type: string
 *               description:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Objekt aktualisiert
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Objekt'
 *       404:
 *         description: Objekt nicht gefunden
 *       403:
 *         description: Keine Berechtigung
 * 
 *   delete:
 *     summary: Objekt löschen
 *     tags: [Objekte]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Objekt gelöscht
 *       400:
 *         description: Objekt kann nicht gelöscht werden (Anlagen vorhanden)
 *       404:
 *         description: Objekt nicht gefunden
 *       403:
 *         description: Keine Berechtigung (nur Admin)
 * 
 * /objekte/{id}/anlagen:
 *   get:
 *     summary: Alle Anlagen eines Objekts abrufen
 *     tags: [Objekte]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Objekt-ID
 *     responses:
 *       200:
 *         description: Liste der Anlagen
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Anlage'
 *       404:
 *         description: Objekt nicht gefunden
 */