const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const cors = require('cors');
const hpp = require('hpp');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const logger = require('../utils/logger');

// CORS-Konfiguration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'https://localhost:3000',
      'http://127.0.0.1:3000'
    ].filter(Boolean);

    // In Development alle Origins erlauben
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200, // IE11 Support
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-CSRF-Token'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

// Rate Limiting - Allgemein
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 100, // 100 Requests pro IP
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  },
  skip: (req) => {
    // Health-Checks von Rate Limiting ausschließen
    return req.path === '/api/health' || req.path === '/health';
  }
});

// Rate Limiting - Auth-Endpunkte (strenger)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 5, // 5 Login-Versuche pro IP
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'Account temporarily locked. Please try again later.',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});

// Rate Limiting - API-Endpunkte
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 1000, // 1000 API-Calls pro IP
  message: {
    error: 'API rate limit exceeded',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Slow Down Middleware für progressive Verlangsamung
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  delayAfter: 50, // Nach 50 Requests Verlangsamung beginnen
  delayMs: 500, // 500ms Delay pro Request hinzufügen
  maxDelayMs: 20000, // Maximum 20 Sekunden Delay
  skipFailedRequests: true,
  skipSuccessfulRequests: false,
  onLimitReached: (req, res, options) => {
    logger.warn(`Speed limit reached for IP: ${req.ip}`);
  }
});

// Helmet-Konfiguration für Security Headers
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Für inline Scripts (nur in Development)
        process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : null,
        'https://cdn.jsdelivr.net',
        'https://unpkg.com'
      ].filter(Boolean),
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Für Tailwind CSS
        'https://fonts.googleapis.com',
        'https://cdn.jsdelivr.net'
      ],
      fontSrc: [
        "'self'",
        'https://fonts.gstatic.com',
        'data:'
      ],
      imgSrc: [
        "'self'",
        'data:',
        'blob:',
        'https:',
        // QR-Code Scanner braucht Kamera-Access
        'camera:'
      ],
      connectSrc: [
        "'self'",
        process.env.REACT_APP_API_URL || 'http://localhost:5000',
        'wss://',
        'ws://'
      ],
      mediaSrc: ["'self'", 'blob:', 'data:'],
      objectSrc: ["'none'"],
      baseSrc: ["'self'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false, // Für SharedArrayBuffer-Kompatibilität
  hsts: {
    maxAge: 31536000, // 1 Jahr
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permittedCrossDomainPolicies: false,
  hidePoweredBy: true
};

// SQL-Injection-Schutz für Sequelize
const sqlInjectionProtection = (req, res, next) => {
  const suspiciousPatterns = [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi,
    /('|(\\)|(;)|(\-\-)|(\#))/g,
    /(script|javascript|vbscript|onload|onerror|onclick)/gi
  ];

  const checkObject = (obj, path = '') => {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (typeof value === 'string') {
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(value)) {
            logger.warn(`Potential SQL injection detected at ${currentPath}: ${value}`);
            return res.status(400).json({
              error: 'Invalid input detected',
              message: 'Request contains potentially malicious content'
            });
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        const result = checkObject(value, currentPath);
        if (result) return result;
      }
    }
  };

  // Body, Query und Params prüfen
  if (req.body) checkObject(req.body, 'body');
  if (req.query) checkObject(req.query, 'query');
  if (req.params) checkObject(req.params, 'params');

  next();
};

// Brute Force Protection für spezifische Endpunkte
const createBruteForceProtection = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = `${req.ip}-${req.path}`;
    const now = Date.now();
    const userAttempts = attempts.get(key) || { count: 0, resetTime: now + windowMs };

    // Reset wenn Zeitfenster abgelaufen
    if (now > userAttempts.resetTime) {
      userAttempts.count = 0;
      userAttempts.resetTime = now + windowMs;
    }

    // Prüfen ob Limit erreicht
    if (userAttempts.count >= maxAttempts) {
      const remainingTime = Math.ceil((userAttempts.resetTime - now) / 1000);
      logger.warn(`Brute force protection triggered for ${key}`);
      
      return res.status(429).json({
        error: 'Too many attempts',
        message: `Too many failed attempts. Please try again in ${remainingTime} seconds.`,
        retryAfter: remainingTime
      });
    }

    // Bei fehlgeschlagenen Requests Counter erhöhen
    const originalSend = res.send;
    res.send = function(data) {
      if (res.statusCode >= 400) {
        userAttempts.count++;
        attempts.set(key, userAttempts);
      } else if (res.statusCode < 300) {
        // Bei erfolgreichen Requests Counter zurücksetzen
        attempts.delete(key);
      }
      return originalSend.call(this, data);
    };

    next();
  };
};

// Content-Type Validation
const validateContentType = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('Content-Type');
    
    if (!contentType) {
      return res.status(400).json({
        error: 'Content-Type header required'
      });
    }

    const allowedTypes = [
      'application/json',
      'multipart/form-data',
      'application/x-www-form-urlencoded'
    ];

    const isAllowed = allowedTypes.some(type => 
      contentType.toLowerCase().includes(type)
    );

    if (!isAllowed) {
      logger.warn(`Invalid Content-Type: ${contentType} from IP: ${req.ip}`);
      return res.status(415).json({
        error: 'Unsupported Media Type',
        allowedTypes
      });
    }
  }
  
  next();
};

// Request Size Limiting
const requestSizeLimit = (limit = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('Content-Length') || '0');
    const maxSize = parseInt(limit) || 10 * 1024 * 1024;

    if (contentLength > maxSize) {
      logger.warn(`Request too large: ${contentLength} bytes from IP: ${req.ip}`);
      return res.status(413).json({
        error: 'Request Entity Too Large',
        maxSize: `${Math.round(maxSize / (1024 * 1024))}MB`
      });
    }

    next();
  };
};

// Security Middleware Export
module.exports = {
  // Basis-Security-Middleware
  applySecurity: (app) => {
    // Helmet für Security Headers
    app.use(helmet(helmetConfig));
    
    // CORS
    app.use(cors(corsOptions));
    
    // Request Size Limiting
    app.use(requestSizeLimit('50mb')); // Größer für Excel-Uploads
    
    // Content-Type Validation
    app.use(validateContentType);
    
    // XSS Protection
    app.use(xss());
    
    // NoSQL/MongoDB Injection Protection
    app.use(mongoSanitize());
    
    // HTTP Parameter Pollution Protection
    app.use(hpp({
      whitelist: ['sort', 'filter', 'page', 'limit'] // Erlaubte mehrfache Parameter
    }));
    
    // SQL Injection Protection
    app.use(sqlInjectionProtection);
    
    logger.info('Security middleware applied');
  },

  // Rate Limiters
  generalLimiter,
  authLimiter,
  apiLimiter,
  speedLimiter,
  
  // Spezielle Protections
  bruteForceProtection: createBruteForceProtection,
  
  // CORS Options
  corsOptions,
  
  // Security Headers Check
  securityHeadersCheck: (req, res, next) => {
    // Zusätzliche Security Headers setzen
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'X-Permitted-Cross-Domain-Policies': 'none'
    });
    
    next();
  },

  // IP Whitelist für Admin-Funktionen
  createIPWhitelist: (allowedIPs = []) => {
    return (req, res, next) => {
      if (allowedIPs.length === 0) return next();
      
      const clientIP = req.ip || req.connection.remoteAddress;
      const isAllowed = allowedIPs.some(ip => {
        if (ip.includes('/')) {
          // CIDR-Notation Support
          const [network, prefixLength] = ip.split('/');
          // Vereinfachte CIDR-Prüfung (für Production sollte eine Library verwendet werden)
          return clientIP.startsWith(network.split('.').slice(0, Math.floor(prefixLength / 8)).join('.'));
        }
        return clientIP === ip;
      });

      if (!isAllowed) {
        logger.warn(`IP ${clientIP} not in whitelist`);
        return res.status(403).json({
          error: 'Access denied',
          message: 'Your IP address is not authorized to access this resource'
        });
      }

      next();
    };
  }
};