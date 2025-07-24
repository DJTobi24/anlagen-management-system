/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Benutzer anmelden
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@swm.de
 *               password:
 *                 type: string
 *                 format: password
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Erfolgreich angemeldet
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT Token für weitere Anfragen
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Ungültige Anmeldedaten
 *       500:
 *         description: Serverfehler
 * 
 * /auth/me:
 *   get:
 *     summary: Aktuellen Benutzer abrufen
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Benutzerinformationen
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Nicht authentifiziert
 * 
 * /auth/logout:
 *   post:
 *     summary: Benutzer abmelden
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Erfolgreich abgemeldet
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Erfolgreich abgemeldet
 *       401:
 *         description: Nicht authentifiziert
 * 
 * /auth/refresh:
 *   post:
 *     summary: Token erneuern
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Neuer Token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Neuer JWT Token
 *       401:
 *         description: Token ungültig oder abgelaufen
 */