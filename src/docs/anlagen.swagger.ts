/**
 * @swagger
 * /anlagen:
 *   get:
 *     summary: Alle Anlagen abrufen
 *     tags: [Anlagen]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Seitennummer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Anzahl pro Seite
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Suchbegriff (Name, T-Nummer, AKS-Code)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [aktiv, inaktiv, wartung, defekt]
 *         description: Filter nach Status
 *       - in: query
 *         name: aks_code
 *         schema:
 *           type: string
 *         description: Filter nach AKS-Code
 *       - in: query
 *         name: objekt_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter nach Objekt
 *     responses:
 *       200:
 *         description: Liste der Anlagen
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Anlage'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     limit:
 *                       type: integer
 * 
 *   post:
 *     summary: Neue Anlage erstellen
 *     tags: [Anlagen]
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
 *               - aks_code
 *               - objekt_id
 *             properties:
 *               objekt_id:
 *                 type: string
 *                 format: uuid
 *               t_nummer:
 *                 type: string
 *               aks_code:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               hersteller:
 *                 type: string
 *               modell:
 *                 type: string
 *               seriennummer:
 *                 type: string
 *               baujahr:
 *                 type: integer
 *               anschaffungswert:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [aktiv, inaktiv, wartung, defekt]
 *               zustands_bewertung:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *     responses:
 *       201:
 *         description: Anlage erfolgreich erstellt
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Anlage'
 *       400:
 *         description: Ungültige Eingabedaten
 *       403:
 *         description: Keine Berechtigung
 * 
 * /anlagen/{id}:
 *   get:
 *     summary: Anlage nach ID abrufen
 *     tags: [Anlagen]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Anlagen-ID
 *     responses:
 *       200:
 *         description: Anlageninformationen
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Anlage'
 *       404:
 *         description: Anlage nicht gefunden
 * 
 *   put:
 *     summary: Anlage aktualisieren
 *     tags: [Anlagen]
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
 *             $ref: '#/components/schemas/Anlage'
 *     responses:
 *       200:
 *         description: Anlage aktualisiert
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Anlage'
 *       404:
 *         description: Anlage nicht gefunden
 *       403:
 *         description: Keine Berechtigung
 * 
 *   delete:
 *     summary: Anlage löschen
 *     tags: [Anlagen]
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
 *         description: Anlage gelöscht
 *       404:
 *         description: Anlage nicht gefunden
 *       403:
 *         description: Keine Berechtigung (nur Admin)
 * 
 * /anlagen/{id}/qrcode:
 *   get:
 *     summary: QR-Code für Anlage generieren
 *     tags: [Anlagen]
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
 *         description: QR-Code als Bild
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Anlage nicht gefunden
 * 
 * /anlagen/bulk-update:
 *   post:
 *     summary: Mehrere Anlagen gleichzeitig aktualisieren
 *     tags: [Anlagen]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               updates:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     enum: [aktiv, inaktiv, wartung, defekt]
 *                   wartungsintervall_monate:
 *                     type: integer
 *     responses:
 *       200:
 *         description: Anlagen aktualisiert
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 updated:
 *                   type: integer
 *                   description: Anzahl aktualisierter Anlagen
 *       403:
 *         description: Keine Berechtigung
 */