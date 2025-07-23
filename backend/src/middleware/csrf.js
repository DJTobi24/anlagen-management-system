const csrf = require('csurf');
const logger = require('../utils/logger');

// CSRF-Token-Speicher (in Production sollte Redis verwendet werden)
const tokenStore = new Map();

// CSRF-Schutz-Konfiguration
const csrfOptions = {
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 1000 // 1 Stunde
  },
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
  value: req => {
    return req.body._csrf || 
           req.query._csrf || 
           req.headers['x-csrf-token'] ||
           req.headers['x-xsrf-token'];
  }
};

// CSRF-Middleware erstellen
const csrfProtection = csrf(csrfOptions);

// Custom CSRF-Implementierung für APIs
const apiCSRFProtection = (req, res, next) => {
  // GET-Requests sind von CSRF ausgenommen
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Health-Check ausschließen
  if (req.path === '/api/health' || req.path === '/health') {
    return next();
  }

  const token = req.headers['x-csrf-token'] || 
                req.headers['x-xsrf-token'] ||
                req.body._csrf;

  if (!token) {
    logger.warn(`CSRF token missing for ${req.method} ${req.path} from IP: ${req.ip}`);
    return res.status(403).json({
      error: 'CSRF token missing',
      message: 'CSRF token required for this request'
    });
  }

  // Token validieren
  const sessionId = req.sessionID || req.headers['x-session-id'];
  const storedToken = tokenStore.get(sessionId);

  if (!storedToken || storedToken !== token) {
    logger.warn(`Invalid CSRF token for ${req.method} ${req.path} from IP: ${req.ip}`);
    return res.status(403).json({
      error: 'Invalid CSRF token',
      message: 'CSRF token validation failed'
    });
  }

  next();
};

// CSRF-Token generieren
const generateCSRFToken = (req, res, next) => {
  try {
    const token = require('crypto').randomBytes(32).toString('hex');
    const sessionId = req.sessionID || req.headers['x-session-id'] || req.ip;
    
    tokenStore.set(sessionId, token);
    
    // Token in Response-Header setzen
    res.set('X-CSRF-Token', token);
    
    // Token auch im Request verfügbar machen
    req.csrfToken = () => token;
    
    next();
  } catch (error) {
    logger.error('CSRF token generation failed:', error);
    next(error);
  }
};

// CSRF-Token-Endpunkt
const getCSRFToken = (req, res) => {
  try {
    const token = require('crypto').randomBytes(32).toString('hex');
    const sessionId = req.sessionID || req.headers['x-session-id'] || req.ip;
    
    tokenStore.set(sessionId, token);
    
    res.json({
      csrfToken: token,
      expires: Date.now() + (60 * 60 * 1000) // 1 Stunde
    });
  } catch (error) {
    logger.error('CSRF token endpoint error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate CSRF token'
    });
  }
};

// Token-Cleanup (alte Tokens entfernen)
const cleanupTokens = () => {
  const now = Date.now();
  const maxAge = 60 * 60 * 1000; // 1 Stunde
  
  for (const [sessionId, tokenData] of tokenStore.entries()) {
    if (typeof tokenData === 'object' && tokenData.timestamp) {
      if (now - tokenData.timestamp > maxAge) {
        tokenStore.delete(sessionId);
      }
    }
  }
};

// Periodische Token-Cleanup (alle 15 Minuten)
setInterval(cleanupTokens, 15 * 60 * 1000);

// Double Submit Cookie Pattern für SPA
const doubleSubmitCookie = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const cookieToken = req.cookies._csrf;
  const headerToken = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];

  if (!cookieToken || !headerToken) {
    logger.warn(`Double submit CSRF tokens missing for ${req.method} ${req.path}`);
    return res.status(403).json({
      error: 'CSRF protection',
      message: 'Double submit tokens required'
    });
  }

  if (cookieToken !== headerToken) {
    logger.warn(`Double submit CSRF tokens mismatch for ${req.method} ${req.path}`);
    return res.status(403).json({
      error: 'CSRF protection',
      message: 'Token mismatch detected'
    });
  }

  next();
};

// SameSite Cookie CSRF-Schutz
const sameSiteProtection = (req, res, next) => {
  // Prüfen ob Request von derselben Site kommt
  const origin = req.get('Origin');
  const referer = req.get('Referer');
  const host = req.get('Host');

  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    if (origin) {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        logger.warn(`Cross-origin request blocked: ${origin} -> ${host}`);
        return res.status(403).json({
          error: 'Cross-origin request blocked',
          message: 'Request must originate from same site'
        });
      }
    } else if (referer) {
      const refererHost = new URL(referer).host;
      if (refererHost !== host) {
        logger.warn(`Cross-origin request blocked via referer: ${referer} -> ${host}`);
        return res.status(403).json({
          error: 'Cross-origin request blocked',
          message: 'Request must originate from same site'
        });
      }
    } else {
      // Kein Origin/Referer Header - verdächtig
      logger.warn(`Suspicious request without Origin/Referer headers from IP: ${req.ip}`);
      return res.status(403).json({
        error: 'Missing origin information',
        message: 'Request must include origin information'
      });
    }
  }

  next();
};

// CSRF-Status prüfen
const getCSRFStatus = (req, res) => {
  const sessionId = req.sessionID || req.headers['x-session-id'] || req.ip;
  const hasToken = tokenStore.has(sessionId);
  
  res.json({
    protected: true,
    hasToken,
    tokenCount: tokenStore.size,
    sessionId: sessionId.substring(0, 8) + '...' // Teilweise Session-ID für Debugging
  });
};

module.exports = {
  // Standard CSRF-Schutz
  csrfProtection,
  
  // API-spezifischer CSRF-Schutz
  apiCSRFProtection,
  
  // Token-Generierung
  generateCSRFToken,
  
  // CSRF-Token-Endpunkt
  getCSRFToken,
  
  // Double Submit Cookie Pattern
  doubleSubmitCookie,
  
  // SameSite-Schutz
  sameSiteProtection,
  
  // Status-Endpunkt
  getCSRFStatus,
  
  // Token-Cleanup
  cleanupTokens,
  
  // Middleware für verschiedene Strategien
  applyCSRFProtection: (app, strategy = 'double-submit') => {
    switch (strategy) {
      case 'standard':
        app.use(csrfProtection);
        break;
        
      case 'api':
        app.use('/api', generateCSRFToken);
        app.use('/api', apiCSRFProtection);
        break;
        
      case 'double-submit':
        app.use(doubleSubmitCookie);
        break;
        
      case 'same-site':
        app.use(sameSiteProtection);
        break;
        
      case 'hybrid':
        // Kombination aus verschiedenen Strategien
        app.use(generateCSRFToken);
        app.use(sameSiteProtection);
        app.use('/api', apiCSRFProtection);
        break;
        
      default:
        logger.warn(`Unknown CSRF strategy: ${strategy}, using default`);
        app.use(csrfProtection);
    }
    
    // CSRF-Token-Endpunkte registrieren
    app.get('/api/csrf-token', getCSRFToken);
    app.get('/api/csrf-status', getCSRFStatus);
    
    logger.info(`CSRF protection applied with strategy: ${strategy}`);
  }
};