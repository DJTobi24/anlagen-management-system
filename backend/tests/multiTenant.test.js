const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const { User, Mandant, Anlage, AksCode } = require('../src/models');
const { sequelize } = require('../src/config/database');

describe('Multi-Tenant Isolation', () => {
  let mandant1, mandant2;
  let user1, user2;
  let token1, token2;
  let anlage1, anlage2;
  let aksCode1, aksCode2;

  beforeAll(async () => {
    // Sync database
    await sequelize.sync({ force: true });

    // Create two test mandants
    mandant1 = await Mandant.create({
      name: 'Mandant 1',
      kurzbezeichnung: 'M1',
      adresse: {
        strasse: 'Straße 1',
        hausnummer: '1',
        plz: '11111',
        ort: 'Stadt 1',
        land: 'Deutschland'
      },
      kontakt: {
        email: 'mandant1@example.com',
        telefon: '+49 111 111111',
        ansprechpartner: 'Contact 1'
      },
      einstellungen: {
        maxAnlagen: 1000,
        maxBenutzer: 50,
        features: ['excel_import']
      },
      aktiv: true
    });

    mandant2 = await Mandant.create({
      name: 'Mandant 2',
      kurzbezeichnung: 'M2',
      adresse: {
        strasse: 'Straße 2',
        hausnummer: '2',
        plz: '22222',
        ort: 'Stadt 2',
        land: 'Deutschland'
      },
      kontakt: {
        email: 'mandant2@example.com',
        telefon: '+49 222 222222',
        ansprechpartner: 'Contact 2'
      },
      einstellungen: {
        maxAnlagen: 500,
        maxBenutzer: 25,
        features: ['basic_reporting']
      },
      aktiv: true
    });

    // Create users for each mandant
    const hashedPassword = await bcrypt.hash('password123!', 10);
    
    user1 = await User.create({
      email: 'user1@example.com',
      password: hashedPassword,
      firstName: 'User',
      lastName: 'One',
      role: 'admin',
      mandantId: mandant1.id,
      aktiv: true,
      emailVerified: true
    });

    user2 = await User.create({
      email: 'user2@example.com',
      password: hashedPassword,
      firstName: 'User',
      lastName: 'Two',
      role: 'admin',
      mandantId: mandant2.id,
      aktiv: true,
      emailVerified: true
    });

    // Generate auth tokens
    token1 = jwt.sign(
      { 
        userId: user1.id, 
        mandantId: mandant1.id,
        role: user1.role 
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    token2 = jwt.sign(
      { 
        userId: user2.id, 
        mandantId: mandant2.id,
        role: user2.role 
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Create test data for each mandant
    anlage1 = await Anlage.create({
      qrCode: 'QR001-M1',
      objektId: 'OBJ001',
      raum: 'Raum 1',
      aksCode: 'AKS001',
      bezeichnung: 'Anlage Mandant 1',
      hersteller: 'Hersteller 1',
      typ: 'Typ 1',
      seriennummer: 'SN001',
      baujahr: 2020,
      status: 'aktiv',
      mandantId: mandant1.id
    });

    anlage2 = await Anlage.create({
      qrCode: 'QR001-M2',
      objektId: 'OBJ001',
      raum: 'Raum 1',
      aksCode: 'AKS001',
      bezeichnung: 'Anlage Mandant 2',
      hersteller: 'Hersteller 2',
      typ: 'Typ 2',
      seriennummer: 'SN002',
      baujahr: 2021,
      status: 'aktiv',
      mandantId: mandant2.id
    });

    // Create AKS codes for each mandant
    aksCode1 = await AksCode.create({
      code: 'AKS001',
      bezeichnung: 'AKS für Mandant 1',
      kategorie: 'Heizung',
      pflichtfelder: ['hersteller', 'typ'],
      validierungsregeln: {
        baujahr: { min: 1990, max: 2030 }
      },
      mandantId: mandant1.id
    });

    aksCode2 = await AksCode.create({
      code: 'AKS001',
      bezeichnung: 'AKS für Mandant 2',
      kategorie: 'Lüftung',
      pflichtfelder: ['hersteller', 'seriennummer'],
      validierungsregeln: {
        baujahr: { min: 2000, max: 2030 }
      },
      mandantId: mandant2.id
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('User Data Isolation', () => {
    it('should only return users from same mandant', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe(user1.id);
      expect(response.body.data[0].mandantId).toBe(mandant1.id);
    });

    it('should not allow access to users from different mandant', async () => {
      const response = await request(app)
        .get(`/api/users/${user2.id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(404);
    });

    it('should not allow creating users for different mandant', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          email: 'newuser@example.com',
          password: 'password123!',
          firstName: 'New',
          lastName: 'User',
          mandantId: mandant2.id // Different mandant
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('access');
    });

    it('should automatically set mandantId for new users', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          email: 'autouser@example.com',
          password: 'password123!',
          firstName: 'Auto',
          lastName: 'User'
          // No mandantId specified
        });

      expect(response.status).toBe(201);
      expect(response.body.data.user.mandantId).toBe(mandant1.id);
    });
  });

  describe('Anlage Data Isolation', () => {
    it('should only return anlagen from same mandant', async () => {
      const response = await request(app)
        .get('/api/anlagen')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe(anlage1.id);
      expect(response.body.data[0].mandantId).toBe(mandant1.id);
    });

    it('should not allow access to anlagen from different mandant', async () => {
      const response = await request(app)
        .get(`/api/anlagen/${anlage2.id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(404);
    });

    it('should automatically set mandantId for new anlagen', async () => {
      const response = await request(app)
        .post('/api/anlagen')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          qrCode: 'QR-NEW-M1',
          objektId: 'OBJ-NEW',
          raum: 'Neuer Raum',
          aksCode: 'AKS001',
          bezeichnung: 'Neue Anlage',
          hersteller: 'Neuer Hersteller',
          typ: 'Neuer Typ'
          // No mandantId specified
        });

      expect(response.status).toBe(201);
      expect(response.body.data.mandantId).toBe(mandant1.id);
    });

    it('should not allow creating anlagen for different mandant', async () => {
      const response = await request(app)
        .post('/api/anlagen')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          qrCode: 'QR-HACK',
          objektId: 'OBJ-HACK',
          raum: 'Hack Raum',
          aksCode: 'AKS001',
          bezeichnung: 'Hack Anlage',
          hersteller: 'Hack Hersteller',
          typ: 'Hack Typ',
          mandantId: mandant2.id // Different mandant
        });

      expect(response.status).toBe(403);
    });

    it('should allow duplicate QR codes across different mandants', async () => {
      // Both mandants can have the same QR code
      const response1 = await request(app)
        .get('/api/anlagen')
        .set('Authorization', `Bearer ${token1}`)
        .query({ qrCode: 'QR001-M1' });

      const response2 = await request(app)
        .get('/api/anlagen')
        .set('Authorization', `Bearer ${token2}`)
        .query({ qrCode: 'QR001-M2' });

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response1.body.data).toHaveLength(1);
      expect(response2.body.data).toHaveLength(1);
      expect(response1.body.data[0].mandantId).toBe(mandant1.id);
      expect(response2.body.data[0].mandantId).toBe(mandant2.id);
    });
  });

  describe('AKS Code Isolation', () => {
    it('should only return AKS codes from same mandant', async () => {
      const response = await request(app)
        .get('/api/aks-codes')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe(aksCode1.id);
      expect(response.body.data[0].mandantId).toBe(mandant1.id);
    });

    it('should not allow access to AKS codes from different mandant', async () => {
      const response = await request(app)
        .get(`/api/aks-codes/${aksCode2.id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(404);
    });

    it('should allow same AKS code across different mandants', async () => {
      // Both mandants can have AKS001 but with different configurations
      const response1 = await request(app)
        .get('/api/aks-codes')
        .set('Authorization', `Bearer ${token1}`)
        .query({ code: 'AKS001' });

      const response2 = await request(app)
        .get('/api/aks-codes')
        .set('Authorization', `Bearer ${token2}`)
        .query({ code: 'AKS001' });

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response1.body.data[0].kategorie).toBe('Heizung');
      expect(response2.body.data[0].kategorie).toBe('Lüftung');
    });

    it('should automatically set mandantId for new AKS codes', async () => {
      const response = await request(app)
        .post('/api/aks-codes')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          code: 'AKS-NEW',
          bezeichnung: 'Neue AKS',
          kategorie: 'Test',
          pflichtfelder: ['hersteller']
          // No mandantId specified
        });

      expect(response.status).toBe(201);
      expect(response.body.data.mandantId).toBe(mandant1.id);
    });
  });

  describe('Cross-Mandant Security', () => {
    it('should prevent SQL injection to access other mandant data', async () => {
      // Try to inject SQL to access other mandant's data
      const response = await request(app)
        .get('/api/anlagen')
        .set('Authorization', `Bearer ${token1}`)
        .query({ 
          filter: `'; SELECT * FROM anlagen WHERE mandantId = ${mandant2.id}; --`
        });

      expect(response.status).toBe(200);
      // Should still only return mandant1's data
      expect(response.body.data.every(a => a.mandantId === mandant1.id)).toBe(true);
    });

    it('should validate mandantId in JWT token', async () => {
      // Create token with invalid mandantId
      const invalidToken = jwt.sign(
        { 
          userId: user1.id, 
          mandantId: 999999, // Non-existent mandant
          role: user1.role 
        },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/anlagen')
        .set('Authorization', `Bearer ${invalidToken}`);

      expect(response.status).toBe(401);
    });

    it('should validate user belongs to mandant in token', async () => {
      // Create token with mismatched user and mandant
      const mismatchedToken = jwt.sign(
        { 
          userId: user1.id, 
          mandantId: mandant2.id, // Wrong mandant for this user
          role: user1.role 
        },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/anlagen')
        .set('Authorization', `Bearer ${mismatchedToken}`);

      expect(response.status).toBe(401);
    });

    it('should not expose mandant information in error messages', async () => {
      const response = await request(app)
        .get(`/api/anlagen/${anlage2.id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Anlage not found');
      // Should not reveal that the anlage exists but belongs to different mandant
    });
  });

  describe('Search and Filtering Isolation', () => {
    it('should isolate search results by mandant', async () => {
      const response = await request(app)
        .get('/api/anlagen/search')
        .set('Authorization', `Bearer ${token1}`)
        .query({ 
          q: 'Anlage' // Should match both anlage1 and anlage2
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe(anlage1.id);
    });

    it('should isolate aggregation queries by mandant', async () => {
      const response = await request(app)
        .get('/api/anlagen/stats')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body.data.total).toBe(1); // Only anlage1
    });

    it('should isolate export operations by mandant', async () => {
      const response = await request(app)
        .get('/api/anlagen/export')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      // Response should only contain mandant1's data
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].mandantId).toBe(mandant1.id);
    });
  });

  describe('Bulk Operations Isolation', () => {
    it('should isolate bulk updates by mandant', async () => {
      // Try to update anlagen from both mandants
      const response = await request(app)
        .put('/api/anlagen/bulk')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          ids: [anlage1.id, anlage2.id], // Mix of both mandants
          updates: { status: 'wartung' }
        });

      expect(response.status).toBe(200);
      expect(response.body.data.updated).toBe(1); // Only anlage1 updated

      // Verify only anlage1 was updated
      await anlage1.reload();
      await anlage2.reload();
      expect(anlage1.status).toBe('wartung');
      expect(anlage2.status).toBe('aktiv'); // Unchanged
    });

    it('should isolate bulk deletes by mandant', async () => {
      // Create additional test data
      const extraAnlage1 = await Anlage.create({
        qrCode: 'QR-EXTRA-M1',
        objektId: 'OBJ-EXTRA',
        raum: 'Extra Raum',
        aksCode: 'AKS001',
        bezeichnung: 'Extra Anlage M1',
        hersteller: 'Extra Hersteller',
        typ: 'Extra Typ',
        mandantId: mandant1.id
      });

      const response = await request(app)
        .delete('/api/anlagen/bulk')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          ids: [extraAnlage1.id, anlage2.id] // Mix of both mandants
        });

      expect(response.status).toBe(200);
      expect(response.body.data.deleted).toBe(1); // Only extraAnlage1 deleted

      // Verify only the correct anlage was deleted
      const deletedAnlage = await Anlage.findByPk(extraAnlage1.id);
      const existingAnlage = await Anlage.findByPk(anlage2.id);
      expect(deletedAnlage).toBeNull();
      expect(existingAnlage).toBeTruthy();
    });
  });

  describe('File Upload Isolation', () => {
    it('should isolate file uploads by mandant', async () => {
      // Mock file upload
      const response = await request(app)
        .post('/api/anlagen/import')
        .set('Authorization', `Bearer ${token1}`)
        .attach('file', Buffer.from('mock excel data'), 'test.xlsx');

      expect(response.status).toBe(200);
      // Should process file only for mandant1
      expect(response.body.data.mandantId).toBe(mandant1.id);
    });
  });

  describe('Audit Log Isolation', () => {
    it('should isolate audit logs by mandant', async () => {
      // Perform some actions to generate audit logs
      await request(app)
        .post('/api/anlagen')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          qrCode: 'QR-AUDIT-M1',
          objektId: 'OBJ-AUDIT',
          raum: 'Audit Raum',
          aksCode: 'AKS001',
          bezeichnung: 'Audit Anlage',
          hersteller: 'Audit Hersteller',
          typ: 'Audit Typ'
        });

      await request(app)
        .post('/api/anlagen')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          qrCode: 'QR-AUDIT-M2',
          objektId: 'OBJ-AUDIT',
          raum: 'Audit Raum',
          aksCode: 'AKS001',
          bezeichnung: 'Audit Anlage',
          hersteller: 'Audit Hersteller',
          typ: 'Audit Typ'
        });

      // Check audit logs for each mandant
      const response1 = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${token1}`);

      const response2 = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${token2}`);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      
      // Each mandant should only see their own audit logs
      expect(response1.body.data.every(log => log.mandantId === mandant1.id)).toBe(true);
      expect(response2.body.data.every(log => log.mandantId === mandant2.id)).toBe(true);
    });
  });
});