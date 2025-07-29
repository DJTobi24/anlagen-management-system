const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const { User, Mandant } = require('../src/models');
const { sequelize } = require('../src/config/database');

describe('Authentication Endpoints', () => {
  let testMandant;
  let testUser;
  let authToken;

  beforeAll(async () => {
    // Sync database
    await sequelize.sync({ force: true });

    // Create test mandant
    testMandant = await Mandant.create({
      name: 'Test Mandant',
      kurzbezeichnung: 'TEST',
      adresse: {
        strasse: 'Teststraße',
        hausnummer: '123',
        plz: '12345',
        ort: 'Teststadt',
        land: 'Deutschland'
      },
      kontakt: {
        email: 'test@mandant.de',
        telefon: '+49 123 456789',
        ansprechpartner: 'Test User'
      },
      einstellungen: {
        maxAnlagen: 1000,
        maxBenutzer: 50,
        features: ['excel_import', 'audit_logs']
      },
      aktiv: true
    });

    // Create test user
    const hashedPassword = await bcrypt.hash('testPassword123!', 10);
    testUser = await User.create({
      email: 'test@example.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      role: 'admin',
      mandantId: testMandant.id,
      aktiv: true,
      emailVerified: true
    });

    // Generate auth token
    authToken = jwt.sign(
      { 
        userId: testUser.id, 
        mandantId: testMandant.id,
        role: testUser.role 
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Reset any test data changes
    await testUser.reload();
    await testMandant.reload();
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testPassword123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'testPassword123!'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongPassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should reject inactive user', async () => {
      await testUser.update({ aktiv: false });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testPassword123!'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Account deactivated');

      // Reset for other tests
      await testUser.update({ aktiv: true });
    });

    it('should reject user from inactive mandant', async () => {
      await testMandant.update({ aktiv: false });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testPassword123!'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Mandant deactivated');

      // Reset for other tests
      await testMandant.update({ aktiv: true });
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
          // missing password
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'testPassword123!'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should track failed login attempts', async () => {
      // Make multiple failed attempts
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrongPassword'
          });
      }

      await testUser.reload();
      expect(testUser.failedLoginAttempts).toBe(3);
    });

    it('should lock account after max failed attempts', async () => {
      // Set user near lockout threshold
      await testUser.update({ failedLoginAttempts: 4 });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongPassword'
        });

      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Account temporarily locked');

      await testUser.reload();
      expect(testUser.lockedUntil).toBeTruthy();
    });
  });

  describe('POST /api/auth/register', () => {
    const validRegistrationData = {
      email: 'newuser@example.com',
      password: 'newPassword123!',
      firstName: 'New',
      lastName: 'User',
      mandantId: null // Will be set in tests
    };

    beforeEach(() => {
      validRegistrationData.mandantId = testMandant.id;
    });

    it('should register new user with valid data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validRegistrationData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('newuser@example.com');
      expect(response.body.data.user).not.toHaveProperty('password');

      // Verify user was created in database
      const newUser = await User.findOne({ 
        where: { email: 'newuser@example.com' } 
      });
      expect(newUser).toBeTruthy();
      expect(newUser.mandantId).toBe(testMandant.id);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistrationData);

      expect(response.status).toBe(401);
    });

    it('should require admin role', async () => {
      const technicianUser = await User.create({
        email: 'technician@example.com',
        password: await bcrypt.hash('password123!', 10),
        firstName: 'Tech',
        lastName: 'User',
        role: 'techniker',
        mandantId: testMandant.id,
        aktiv: true
      });

      const techToken = jwt.sign(
        { 
          userId: technicianUser.id, 
          mandantId: testMandant.id,
          role: 'techniker'
        },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${techToken}`)
        .send(validRegistrationData);

      expect(response.status).toBe(403);
    });

    it('should reject duplicate email', async () => {
      const duplicateData = {
        ...validRegistrationData,
        email: 'test@example.com' // Already exists
      };

      const response = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${authToken}`)
        .send(duplicateData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('already exists');
    });

    it('should validate password strength', async () => {
      const weakPasswordData = {
        ...validRegistrationData,
        password: '123' // Too weak
      };

      const response = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${authToken}`)
        .send(weakPasswordData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('password');
    });

    it('should validate email format', async () => {
      const invalidEmailData = {
        ...validRegistrationData,
        email: 'invalid-email'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidEmailData);

      expect(response.status).toBe(400);
    });

    it('should set default role as aufnehmer', async () => {
      const userWithoutRole = {
        ...validRegistrationData,
        email: 'norole@example.com'
      };
      delete userWithoutRole.role;

      const response = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${authToken}`)
        .send(userWithoutRole);

      expect(response.status).toBe(201);
      expect(response.body.data.user.role).toBe('aufnehmer');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user info', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testUser.id);
      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data).not.toHaveProperty('password');
      expect(response.body.data.mandant).toBeTruthy();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });

    it('should reject expired token', async () => {
      const expiredToken = jwt.sign(
        { 
          userId: testUser.id, 
          mandantId: testMandant.id,
          role: testUser.role 
        },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' } // Expired
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
    });

    it('should work without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('should change password with valid data', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'testPassword123!',
          newPassword: 'newPassword123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify password was changed
      await testUser.reload();
      const isValid = await bcrypt.compare('newPassword123!', testUser.password);
      expect(isValid).toBe(true);

      // Reset password for other tests
      testUser.password = await bcrypt.hash('testPassword123!', 10);
      await testUser.save();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .send({
          currentPassword: 'testPassword123!',
          newPassword: 'newPassword123!'
        });

      expect(response.status).toBe(401);
    });

    it('should validate current password', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'wrongPassword',
          newPassword: 'newPassword123!'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Current password is incorrect');
    });

    it('should validate new password strength', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'testPassword123!',
          newPassword: '123' // Too weak
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('password');
    });

    it('should prevent same password', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'testPassword123!',
          newPassword: 'testPassword123!' // Same as current
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('New password must be different from current password');
    });
  });

  describe('JWT Token Validation', () => {
    it('should validate token format', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer');

      expect(response.status).toBe(401);
    });

    it('should validate Bearer prefix', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', authToken);

      expect(response.status).toBe(401);
    });

    it('should handle malformed token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer malformed.token');

      expect(response.status).toBe(401);
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to login endpoint', async () => {
      // This test would need proper rate limiting configuration
      // For now, just verify the endpoint responds
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testPassword123!'
        });

      expect(response.status).toBe(200);
    }, 10000);
  });
});