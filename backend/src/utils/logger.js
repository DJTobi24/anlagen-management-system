const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Logs-Verzeichnis erstellen falls nicht vorhanden
const logsDir = process.env.LOG_DIR || path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom Log-Format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.metadata({
    fillExcept: ['message', 'level', 'timestamp', 'label']
  }),
  winston.format.json()
);

// Console-Format für Development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = ` ${JSON.stringify(meta)}`;
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Transport-Konfiguration
const transports = [];

// Console-Transport (immer aktiv)
transports.push(
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
    level: process.env.LOG_LEVEL || 'info'
  })
);

// File-Transports für Production
if (process.env.NODE_ENV === 'production') {
  // Alle Logs
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: logFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      level: 'info'
    })
  );

  // Error-Logs separat
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      format: logFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
      level: 'error'
    })
  );

  // Debug-Logs separat (nur wenn Debug aktiviert)
  if (process.env.LOG_LEVEL === 'debug') {
    transports.push(
      new winston.transports.File({
        filename: path.join(logsDir, 'debug.log'),
        format: logFormat,
        maxsize: 5 * 1024 * 1024, // 5MB
        maxFiles: 3,
        level: 'debug'
      })
    );
  }

  // Audit-Logs für sicherheitskritische Aktionen
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'audit.log'),
      format: logFormat,
      maxsize: 20 * 1024 * 1024, // 20MB
      maxFiles: 10,
      level: 'warn'
    })
  );
}

// HTTP-Transport für externe Log-Services (optional)
if (process.env.LOG_HTTP_URL) {
  transports.push(
    new winston.transports.Http({
      host: process.env.LOG_HTTP_HOST || 'localhost',
      port: process.env.LOG_HTTP_PORT || 80,
      path: process.env.LOG_HTTP_PATH || '/logs',
      level: 'error'
    })
  );
}

// Logger erstellen
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'anlagen-management-system',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  transports,
  // Unhandled Exceptions und Rejections loggen
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'rejections.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5
    })
  ],
  exitOnError: false
});

// Request-Logger für Express
const requestLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'anlagen-management-system',
    type: 'request'
  },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'requests.log'),
      maxsize: 20 * 1024 * 1024, // 20MB
      maxFiles: 5
    })
  ]
});

// Security-Logger für sicherheitskritische Events
const securityLogger = winston.createLogger({
  level: 'warn',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'anlagen-management-system',
    type: 'security'
  },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'security.log'),
      maxsize: 50 * 1024 * 1024, // 50MB
      maxFiles: 10
    })
  ]
});

// Performance-Logger
const performanceLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'anlagen-management-system',
    type: 'performance'
  },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'performance.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 3
    })
  ]
});

// Helper-Funktionen für strukturiertes Logging
const logHelpers = {
  // Request-Logging
  logRequest: (req, res, responseTime) => {
    const logData = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: res.get('Content-Length'),
      userId: req.user?.id,
      mandantId: req.user?.mandantId
    };

    if (res.statusCode >= 400) {
      logger.warn('HTTP Request Error', logData);
    } else {
      requestLogger.info('HTTP Request', logData);
    }
  },

  // Security-Events
  logSecurityEvent: (type, details, req = null) => {
    const logData = {
      securityEventType: type,
      details,
      timestamp: new Date().toISOString(),
      ip: req?.ip,
      userAgent: req?.get('User-Agent'),
      userId: req?.user?.id,
      mandantId: req?.user?.mandantId
    };

    securityLogger.warn('Security Event', logData);
    logger.warn(`Security Event: ${type}`, logData);
  },

  // Performance-Monitoring
  logPerformance: (operation, duration, details = {}) => {
    const logData = {
      operation,
      duration: `${duration}ms`,
      ...details,
      timestamp: new Date().toISOString()
    };

    performanceLogger.info('Performance Metric', logData);

    // Warnung bei langsamen Operationen
    if (duration > 1000) {
      logger.warn(`Slow operation detected: ${operation} (${duration}ms)`, logData);
    }
  },

  // Database-Query-Logging
  logQuery: (query, duration, params = null) => {
    const logData = {
      query: query.substring(0, 500), // Erste 500 Zeichen
      duration: `${duration}ms`,
      params: params ? JSON.stringify(params).substring(0, 200) : null,
      timestamp: new Date().toISOString()
    };

    if (duration > 500) {
      logger.warn('Slow Database Query', logData);
    } else {
      logger.debug('Database Query', logData);
    }
  },

  // Error-Logging mit Stack-Trace
  logError: (error, context = {}) => {
    const logData = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      context,
      timestamp: new Date().toISOString()
    };

    logger.error('Application Error', logData);
  },

  // Business-Logic-Events
  logBusinessEvent: (event, data, userId = null, mandantId = null) => {
    const logData = {
      businessEvent: event,
      data,
      userId,
      mandantId,
      timestamp: new Date().toISOString()
    };

    logger.info('Business Event', logData);
  },

  // Audit-Trail für DSGVO-Compliance
  logAudit: (action, entityType, entityId, changes, userId, mandantId) => {
    const logData = {
      auditAction: action,
      entityType,
      entityId,
      changes,
      userId,
      mandantId,
      timestamp: new Date().toISOString()
    };

    securityLogger.warn('Audit Trail', logData);
    logger.info('Audit Trail', logData);
  }
};

// Express-Middleware für Request-Logging
const createRequestLogger = () => {
  return (req, res, next) => {
    const startTime = Date.now();

    // Response-Hook
    const originalSend = res.send;
    res.send = function(data) {
      const responseTime = Date.now() - startTime;
      logHelpers.logRequest(req, res, responseTime);
      return originalSend.call(this, data);
    };

    next();
  };
};

// Error-Handler-Middleware
const createErrorLogger = () => {
  return (error, req, res, next) => {
    logHelpers.logError(error, {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      mandantId: req.user?.mandantId
    });

    next(error);
  };
};

// Graceful Shutdown
const gracefulShutdown = () => {
  logger.info('Shutting down logger...');
  
  // Alle Transports schließen
  logger.transports.forEach(transport => {
    if (transport.close) {
      transport.close();
    }
  });

  requestLogger.transports.forEach(transport => {
    if (transport.close) {
      transport.close();
    }
  });

  securityLogger.transports.forEach(transport => {
    if (transport.close) {
      transport.close();
    }
  });

  performanceLogger.transports.forEach(transport => {
    if (transport.close) {
      transport.close();
    }
  });
};

// Process-Event-Handler
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Log-Rotation-Cleanup (täglich)
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 Tage
    const now = Date.now();

    try {
      const files = fs.readdirSync(logsDir);
      files.forEach(file => {
        const filePath = path.join(logsDir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          logger.info(`Deleted old log file: ${file}`);
        }
      });
    } catch (error) {
      logger.error('Log cleanup failed:', error);
    }
  }, 24 * 60 * 60 * 1000); // Täglich
}

module.exports = {
  logger,
  requestLogger,
  securityLogger,
  performanceLogger,
  logHelpers,
  createRequestLogger,
  createErrorLogger,
  gracefulShutdown
};