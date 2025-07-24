/**
 * @swagger
 * /liegenschaften:
 *   get:
 *     summary: Alle Liegenschaften abrufen
 *     tags: [Liegenschaften]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Suche nach Name oder Adresse
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Nur aktive Liegenschaften
 *     responses:
 *       200:
 *         description: Liste der Liegenschaften
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Liegenschaft'
 * 
 *   post:
 *     summary: Neue Liegenschaft erstellen
 *     tags: [Liegenschaften]
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
 *               - address
 *             properties:
 *               name:
 *                 type: string
 *                 example: Hauptgebäude München
 *               address:
 *                 type: string
 *                 example: Musterstraße 123, 80333 München
 *               description:
 *                 type: string
 *                 example: Verwaltungsgebäude mit Technikzentrale
 *     responses:
 *       201:
 *         description: Liegenschaft erstellt
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Liegenschaft'
 *       400:
 *         description: Ungültige Eingabedaten
 *       403:
 *         description: Keine Berechtigung
 * 
 * /liegenschaften/{id}:
 *   get:
 *     summary: Liegenschaft nach ID abrufen
 *     tags: [Liegenschaften]
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
 *         description: Liegenschaftsinformationen
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Liegenschaft'
 *       404:
 *         description: Liegenschaft nicht gefunden
 * 
 *   put:
 *     summary: Liegenschaft aktualisieren
 *     tags: [Liegenschaften]
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
 *               address:
 *                 type: string
 *               description:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Liegenschaft aktualisiert
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Liegenschaft'
 *       404:
 *         description: Liegenschaft nicht gefunden
 *       403:
 *         description: Keine Berechtigung
 * 
 *   delete:
 *     summary: Liegenschaft löschen
 *     tags: [Liegenschaften]
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
 *         description: Liegenschaft gelöscht
 *       400:
 *         description: Liegenschaft kann nicht gelöscht werden (Objekte vorhanden)
 *       404:
 *         description: Liegenschaft nicht gefunden
 *       403:
 *         description: Keine Berechtigung (nur Admin)
 * 
 * /liegenschaften/{id}/objekte:
 *   get:
 *     summary: Alle Objekte einer Liegenschaft abrufen
 *     tags: [Liegenschaften]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Liegenschaft-ID
 *     responses:
 *       200:
 *         description: Liste der Objekte
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Objekt'
 *       404:
 *         description: Liegenschaft nicht gefunden
 * 
 * /liegenschaften/statistics:
 *   get:
 *     summary: Statistiken über alle Liegenschaften
 *     tags: [Liegenschaften]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liegenschaftsstatistiken
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_liegenschaften:
 *                   type: integer
 *                 total_objekte:
 *                   type: integer
 *                 total_anlagen:
 *                   type: integer
 *                 liegenschaften_by_status:
 *                   type: object
 *                   properties:
 *                     active:
 *                       type: integer
 *                     inactive:
 *                       type: integer
 */