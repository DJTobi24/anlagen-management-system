/**
 * @swagger
 * /users:
 *   get:
 *     summary: Alle Benutzer abrufen
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Suche nach Name oder Email
 *       - in: query
 *         name: rolle
 *         schema:
 *           type: string
 *           enum: [admin, techniker, leser]
 *         description: Filter nach Rolle
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Nur aktive Benutzer
 *     responses:
 *       200:
 *         description: Liste der Benutzer
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       403:
 *         description: Keine Berechtigung (nur Admin)
 * 
 *   post:
 *     summary: Neuen Benutzer erstellen
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *               - rolle
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@swm.de
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: SecurePassword123!
 *               name:
 *                 type: string
 *                 example: Max Mustermann
 *               rolle:
 *                 type: string
 *                 enum: [admin, techniker, leser]
 *               abteilung:
 *                 type: string
 *                 example: Facility Management
 *               telefon:
 *                 type: string
 *                 example: +49 89 2361-1234
 *     responses:
 *       201:
 *         description: Benutzer erstellt
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Ungültige Eingabedaten oder Email bereits vorhanden
 *       403:
 *         description: Keine Berechtigung (nur Admin)
 * 
 * /users/{id}:
 *   get:
 *     summary: Benutzer nach ID abrufen
 *     tags: [Users]
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
 *         description: Benutzerinformationen
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Benutzer nicht gefunden
 *       403:
 *         description: Keine Berechtigung
 * 
 *   put:
 *     summary: Benutzer aktualisieren
 *     tags: [Users]
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
 *               rolle:
 *                 type: string
 *                 enum: [admin, techniker, leser]
 *               abteilung:
 *                 type: string
 *               telefon:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Benutzer aktualisiert
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Benutzer nicht gefunden
 *       403:
 *         description: Keine Berechtigung (nur Admin)
 * 
 *   delete:
 *     summary: Benutzer löschen
 *     tags: [Users]
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
 *         description: Benutzer gelöscht
 *       404:
 *         description: Benutzer nicht gefunden
 *       403:
 *         description: Keine Berechtigung (nur Admin)
 * 
 * /users/{id}/reset-password:
 *   post:
 *     summary: Passwort zurücksetzen
 *     tags: [Users]
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
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Passwort zurückgesetzt
 *       404:
 *         description: Benutzer nicht gefunden
 *       403:
 *         description: Keine Berechtigung (nur Admin oder eigener Benutzer)
 * 
 * /users/statistics:
 *   get:
 *     summary: Benutzerstatistiken
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Benutzerstatistiken
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_users:
 *                   type: integer
 *                 users_by_role:
 *                   type: object
 *                   properties:
 *                     admin:
 *                       type: integer
 *                     techniker:
 *                       type: integer
 *                     leser:
 *                       type: integer
 *                 active_users:
 *                   type: integer
 *                 inactive_users:
 *                   type: integer
 *       403:
 *         description: Keine Berechtigung (nur Admin)
 */