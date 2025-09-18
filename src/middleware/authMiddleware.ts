import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import redis from '../config/redis';
import pool from '../config/database';
import rateLimit from 'express-rate-limit';
import { createHash } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: any;
      mandantId?: number;
      sessionId?: string;
    }
  }
}

// ==================== Basic Auth Middleware ====================

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token fehlt' });
      return;
    }
    
    const token = authHeader.substring(7);
    
    try {
      // Verify JWT
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // Check if token is blacklisted
      const blacklisted = await redis.get(`blacklist:${token}`);
      if (blacklisted) {
        res.status(401).json({ error: 'Token ungültig' });
        return;
      }
      
      // Get user details
      const userResult = await pool.query(
        'SELECT u.*, m.id as mandant_id FROM users u LEFT JOIN mandanten m ON u.mandant_id = m.id WHERE u.id = $1',
        [decoded.userId]
      );
      
      if (userResult.rows.length === 0) {
        res.status(401).json({ error: 'Benutzer nicht aktiv' });
        return;
      }
      
      const user = userResult.rows[0];
      
      // Attach user to request
      req.user = user;
      req.mandantId = user.mandant_id;
      
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        res.status(401).json({ error: 'Token abgelaufen' });
      } else {
        res.status(401).json({ error: 'Token ungültig' });
      }
    }
  } catch (error) {
    res.status(500).json({ error: 'Authentifizierung fehlgeschlagen' });
  }
};

// ==================== Permission Middleware ====================

export const requirePermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Nicht authentifiziert' });
      return;
    }
    
    // Simple role-based check
    if (req.user.role === 'admin' || req.user.role === 'manager') {
      next();
      return;
    }
    
    res.status(403).json({ error: 'Keine Berechtigung' });
  };
};

export const requireRole = (roleName: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Nicht authentifiziert' });
      return;
    }
    
    if (req.user.role !== roleName) {
      res.status(403).json({ error: 'Rolle erforderlich: ' + roleName });
      return;
    }
    
    next();
  };
};

// ==================== Tenant Isolation ====================

export const requireTenantAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Nicht authentifiziert' });
    return;
  }
  
  // Admins can access all tenants
  if (req.user.role === 'admin') {
    next();
    return;
  }
  
  // Check if resource belongs to user's mandant
  const resourceMandantId = req.params.mandantId || req.body.mandant_id || req.query.mandant_id;
  
  if (resourceMandantId && parseInt(resourceMandantId) !== req.user.mandant_id) {
    res.status(403).json({ error: 'Kein Zugriff auf diesen Mandanten' });
    return;
  }
  
  next();
};

// ==================== Rate Limiting ====================

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Zu viele Anmeldeversuche. Bitte versuchen Sie es in 15 Minuten erneut.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use email + IP for rate limiting
    const email = req.body.email || 'unknown';
    const ip = req.ip;
    return `${email}:${ip}`;
  },
  handler: async (req, res) => {
    res.status(429).json({
      error: 'Zu viele Anmeldeversuche. Bitte versuchen Sie es in 15 Minuten erneut.'
    });
  }
});

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: 'Zu viele Anfragen.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for certain endpoints
    return req.path.startsWith('/api/health');
  }
});

export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Zu viele Passwort-Reset-Anfragen.',
  keyGenerator: (req) => {
    return req.body.email || req.ip;
  }
});

// ==================== Session Validation ====================

export const validateSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    next();
    return;
  }
  
  try {
    // Get session from token
    const token = req.headers.authorization?.substring(7);
    if (!token) {
      next();
      return;
    }
    
    const decoded = jwt.decode(token) as any;
    const sessionId = decoded.sessionId;
    
    if (!sessionId) {
      next();
      return;
    }
    
    // Check if session is still valid
    const session = await redis.get(`session:${sessionId}`);
    if (!session) {
      res.status(401).json({ error: 'Session abgelaufen' });
      return;
    }
    
    const sessionData = JSON.parse(session);
    
    // Check device fingerprint if available
    if (req.headers['x-device-fingerprint'] && sessionData.deviceFingerprint) {
      if (req.headers['x-device-fingerprint'] !== sessionData.deviceFingerprint) {
        // Potential session hijacking
        console.error('Session hijacking attempt detected:', {
          userId: req.user.id,
          sessionId,
          reason: 'device_fingerprint_mismatch'
        });
        
        res.status(401).json({ error: 'Session ungültig' });
        return;
      }
    }
    
    // Update session activity
    sessionData.lastActivity = new Date();
    await redis.setEx(
      `session:${sessionId}`,
      900, // 15 minutes
      JSON.stringify(sessionData)
    );
    
    req.sessionId = sessionId;
    next();
  } catch (error) {
    next();
  }
};

// ==================== Security Headers ====================

export const securityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  
  // Remove sensitive headers
  res.removeHeader('X-Powered-By');
  
  next();
};

// ==================== Request ID ====================

export const requestId = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = req.headers['x-request-id'] as string || 
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', requestId);
  next();
};

// ==================== Audit Logging ====================

export const auditLog = (action: string, resourceType?: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Log request
    const startTime = Date.now();
    
    // Capture original send
    const originalSend = res.send;
    res.send = function(data: any) {
      res.send = originalSend;
      
      // Log response
      const duration = Date.now() - startTime;
      const success = res.statusCode < 400;
      
      console.log('Audit log:', {
        userId: req.user?.id,
        mandantId: req.mandantId,
        action,
        resourceType,
        resourceId: req.params.id,
        method: req.method,
        path: req.path,
        duration,
        statusCode: res.statusCode,
        success
      });
      
      return res.send(data);
    };
    
    next();
  };
};

// ==================== IP Whitelisting ====================

export const ipWhitelist = (allowedIps: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIp = req.ip || req.connection.remoteAddress;
    
    if (!clientIp || !allowedIps.includes(clientIp)) {
      res.status(403).json({ error: 'Zugriff verweigert' });
      return;
    }
    
    next();
  };
};

// ==================== CORS Configuration ====================

export const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS nicht erlaubt'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Fingerprint', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID']
};

// ==================== Input Sanitization ====================

export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Basic XSS prevention
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.replace(/[<>]/g, '');
    } else if (Array.isArray(obj)) {
      return obj.map(sanitize);
    } else if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };
  
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  
  next();
};

// ==================== API Key Authentication ====================

export const authenticateApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    next();
    return;
  }
  
  try {
    const keyHash = createHash('sha256').update(apiKey).digest('hex');
    
    // Check cache first
    const cached = await redis.get(`api_key:${keyHash}`);
    if (cached) {
      const data = JSON.parse(cached);
      req.user = data.user;
      req.mandantId = data.mandantId;
      next();
      return;
    }
    
    // Look up API key in database
    const result = await pool.query(`
      SELECT ak.*, u.*, t.slug as tenant_slug
      FROM api_keys ak
      JOIN users u ON ak.user_id = u.id
      JOIN tenants t ON u.tenant_id = t.id
      WHERE ak.key_hash = $1 
        AND ak.is_active = true
        AND (ak.expires_at IS NULL OR ak.expires_at > CURRENT_TIMESTAMP)
        AND u.deleted_at IS NULL
        AND u.deactivated_at IS NULL
    `, [keyHash]);
    
    if (result.rows.length === 0) {
      res.status(401).json({ error: 'API-Key ungültig' });
      return;
    }
    
    const apiKeyData = result.rows[0];
    
    // Update last used
    await pool.query(
      'UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = $1',
      [apiKeyData.id]
    );
    
    // Get user data
    const userResult = await pool.query(
      'SELECT u.*, m.id as mandant_id FROM users u LEFT JOIN mandanten m ON u.mandant_id = m.id WHERE u.id = $1',
      [apiKeyData.user_id]
    );
    
    const user = userResult.rows[0];
    
    // Cache for 5 minutes
    await redis.setEx(
      `api_key:${keyHash}`,
      300,
      JSON.stringify({
        user,
        mandantId: user.mandant_id
      })
    );
    
    req.user = user;
    req.mandantId = user.mandant_id;
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'API-Key-Authentifizierung fehlgeschlagen' });
  }
};