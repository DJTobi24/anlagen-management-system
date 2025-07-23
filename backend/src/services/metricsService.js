const promClient = require('prom-client');
const logger = require('../utils/logger').logger;

class MetricsService {
  constructor() {
    this.register = promClient.register;
    this.initialized = false;
    this.metrics = {};
    
    // Basis-Metriken sammeln
    promClient.collectDefaultMetrics({
      register: this.register,
      prefix: 'ams_',
      gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5]
    });
  }

  initialize() {
    if (this.initialized) return;

    try {
      this.setupCustomMetrics();
      this.initialized = true;
      logger.info('Metrics service initialized');
    } catch (error) {
      logger.error('Failed to initialize metrics service:', error);
    }
  }

  setupCustomMetrics() {
    // HTTP-Request-Metriken
    this.metrics.httpRequestsTotal = new promClient.Counter({
      name: 'ams_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code']
    });

    this.metrics.httpRequestDuration = new promClient.Histogram({
      name: 'ams_http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10, 30]
    });

    // Database-Metriken
    this.metrics.dbQueryDuration = new promClient.Histogram({
      name: 'ams_db_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5]
    });

    this.metrics.dbConnectionsActive = new promClient.Gauge({
      name: 'ams_db_connections_active',
      help: 'Number of active database connections'
    });

    this.metrics.dbQueryErrors = new promClient.Counter({
      name: 'ams_db_query_errors_total',
      help: 'Total number of database query errors',
      labelNames: ['operation', 'error_type']
    });

    // Business-Metriken
    this.metrics.usersTotal = new promClient.Gauge({
      name: 'ams_users_total',
      help: 'Total number of users',
      labelNames: ['role', 'status']
    });

    this.metrics.anlagenTotal = new promClient.Gauge({
      name: 'ams_anlagen_total',
      help: 'Total number of anlagen',
      labelNames: ['status', 'mandant']
    });

    this.metrics.loginAttempts = new promClient.Counter({
      name: 'ams_login_attempts_total',
      help: 'Total number of login attempts',
      labelNames: ['status', 'method']
    });

    this.metrics.qrScansTotal = new promClient.Counter({
      name: 'ams_qr_scans_total',
      help: 'Total number of QR code scans',
      labelNames: ['result', 'mandant']
    });

    // Import/Export-Metriken
    this.metrics.excelImportsTotal = new promClient.Counter({
      name: 'ams_excel_imports_total',
      help: 'Total number of Excel imports',
      labelNames: ['status', 'mandant']
    });

    this.metrics.excelImportDuration = new promClient.Histogram({
      name: 'ams_excel_import_duration_seconds',
      help: 'Duration of Excel imports in seconds',
      labelNames: ['status', 'mandant'],
      buckets: [1, 5, 10, 30, 60, 180, 300, 600]
    });

    this.metrics.excelImportRecords = new promClient.Histogram({
      name: 'ams_excel_import_records',
      help: 'Number of records processed in Excel imports',
      labelNames: ['status', 'mandant'],
      buckets: [10, 50, 100, 500, 1000, 5000, 10000, 50000]
    });

    // Cache-Metriken
    this.metrics.cacheHits = new promClient.Counter({
      name: 'ams_cache_hits_total',
      help: 'Total number of cache hits',
      labelNames: ['cache_type']
    });

    this.metrics.cacheMisses = new promClient.Counter({
      name: 'ams_cache_misses_total',
      help: 'Total number of cache misses',
      labelNames: ['cache_type']
    });

    this.metrics.cacheSize = new promClient.Gauge({
      name: 'ams_cache_size_bytes',
      help: 'Size of cache in bytes',
      labelNames: ['cache_type']
    });

    // Error-Metriken
    this.metrics.errorsTotal = new promClient.Counter({
      name: 'ams_errors_total',
      help: 'Total number of errors',
      labelNames: ['type', 'severity']
    });

    this.metrics.securityEvents = new promClient.Counter({
      name: 'ams_security_events_total',
      help: 'Total number of security events',
      labelNames: ['event_type', 'severity']
    });

    // Performance-Metriken
    this.metrics.memoryUsage = new promClient.Gauge({
      name: 'ams_memory_usage_bytes',
      help: 'Memory usage in bytes',
      labelNames: ['type']
    });

    this.metrics.eventLoopLag = new promClient.Gauge({
      name: 'ams_event_loop_lag_seconds',
      help: 'Event loop lag in seconds'
    });

    // Worker-Thread-Metriken
    this.metrics.workerThreadsActive = new promClient.Gauge({
      name: 'ams_worker_threads_active',
      help: 'Number of active worker threads',
      labelNames: ['type']
    });

    this.metrics.jobQueueSize = new promClient.Gauge({
      name: 'ams_job_queue_size',
      help: 'Size of job queue',
      labelNames: ['queue_type']
    });

    // Registriere alle Metriken
    Object.values(this.metrics).forEach(metric => {
      this.register.registerMetric(metric);
    });
  }

  // HTTP-Request-Tracking
  trackHTTPRequest(method, route, statusCode, duration) {
    if (!this.initialized) return;

    const labels = { method, route, status_code: statusCode };
    this.metrics.httpRequestsTotal.inc(labels);
    this.metrics.httpRequestDuration.observe(labels, duration / 1000);
  }

  // Database-Query-Tracking
  trackDBQuery(operation, table, duration, error = null) {
    if (!this.initialized) return;

    const durationSeconds = duration / 1000;
    this.metrics.dbQueryDuration.observe({ operation, table }, durationSeconds);

    if (error) {
      this.metrics.dbQueryErrors.inc({
        operation,
        error_type: error.name || 'Unknown'
      });
    }
  }

  // Business-Metriken aktualisieren
  updateBusinessMetrics(type, data) {
    if (!this.initialized) return;

    switch (type) {
      case 'users':
        this.metrics.usersTotal.set(
          { role: data.role, status: data.status },
          data.count
        );
        break;

      case 'anlagen':
        this.metrics.anlagenTotal.set(
          { status: data.status, mandant: data.mandant },
          data.count
        );
        break;

      case 'login':
        this.metrics.loginAttempts.inc({
          status: data.success ? 'success' : 'failure',
          method: data.method || 'password'
        });
        break;

      case 'qr_scan':
        this.metrics.qrScansTotal.inc({
          result: data.found ? 'found' : 'not_found',
          mandant: data.mandant
        });
        break;

      case 'excel_import':
        this.metrics.excelImportsTotal.inc({
          status: data.status,
          mandant: data.mandant
        });
        
        if (data.duration) {
          this.metrics.excelImportDuration.observe(
            { status: data.status, mandant: data.mandant },
            data.duration / 1000
          );
        }
        
        if (data.recordCount) {
          this.metrics.excelImportRecords.observe(
            { status: data.status, mandant: data.mandant },
            data.recordCount
          );
        }
        break;
    }
  }

  // Cache-Metriken
  trackCacheOperation(type, operation, size = null) {
    if (!this.initialized) return;

    if (operation === 'hit') {
      this.metrics.cacheHits.inc({ cache_type: type });
    } else if (operation === 'miss') {
      this.metrics.cacheMisses.inc({ cache_type: type });
    }

    if (size !== null) {
      this.metrics.cacheSize.set({ cache_type: type }, size);
    }
  }

  // Error-Tracking
  trackError(error, type = 'application') {
    if (!this.initialized) return;

    const severity = this.getErrorSeverity(error);
    this.metrics.errorsTotal.inc({ type, severity });
  }

  // Security-Event-Tracking
  trackSecurityEvent(eventType, severity = 'medium') {
    if (!this.initialized) return;

    this.metrics.securityEvents.inc({
      event_type: eventType,
      severity
    });
  }

  // System-Metriken aktualisieren
  updateSystemMetrics() {
    if (!this.initialized) return;

    try {
      const memUsage = process.memoryUsage();
      this.metrics.memoryUsage.set({ type: 'rss' }, memUsage.rss);
      this.metrics.memoryUsage.set({ type: 'heap_used' }, memUsage.heapUsed);
      this.metrics.memoryUsage.set({ type: 'heap_total' }, memUsage.heapTotal);
      this.metrics.memoryUsage.set({ type: 'external' }, memUsage.external);

      // Event Loop Lag messen
      const start = process.hrtime.bigint();
      setImmediate(() => {
        const lag = Number(process.hrtime.bigint() - start) / 1e9;
        this.metrics.eventLoopLag.set(lag);
      });
    } catch (error) {
      logger.error('Failed to update system metrics:', error);
    }
  }

  // Worker-Thread-Metriken
  updateWorkerMetrics(type, activeCount, queueSize = null) {
    if (!this.initialized) return;

    this.metrics.workerThreadsActive.set({ type }, activeCount);
    
    if (queueSize !== null) {
      this.metrics.jobQueueSize.set({ queue_type: type }, queueSize);
    }
  }

  // Database-Connection-Metriken
  updateDBConnectionMetrics(activeConnections) {
    if (!this.initialized) return;

    this.metrics.dbConnectionsActive.set(activeConnections);
  }

  // Error-Severity bestimmen
  getErrorSeverity(error) {
    if (error.statusCode) {
      if (error.statusCode >= 500) return 'critical';
      if (error.statusCode >= 400) return 'warning';
      return 'info';
    }

    if (error.name === 'ValidationError') return 'warning';
    if (error.name === 'UnauthorizedError') return 'warning';
    if (error.name === 'DatabaseError') return 'critical';

    return 'error';
  }

  // Express-Middleware für HTTP-Metriken
  createHTTPMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();

      // Response-Hook
      const originalSend = res.send;
      res.send = function(data) {
        const duration = Date.now() - startTime;
        const route = req.route?.path || req.path || 'unknown';
        
        metricsService.trackHTTPRequest(
          req.method,
          route,
          res.statusCode,
          duration
        );

        return originalSend.call(this, data);
      };

      next();
    };
  }

  // Metriken-Endpunkt für Prometheus
  getMetrics() {
    return this.register.metrics();
  }

  // Metriken-Summary für Dashboard
  async getMetricsSummary() {
    if (!this.initialized) return null;

    try {
      const metrics = await this.register.getMetricsAsJSON();
      
      const summary = {
        timestamp: new Date().toISOString(),
        http: {
          totalRequests: this.getMetricValue(metrics, 'ams_http_requests_total'),
          averageResponseTime: this.getMetricValue(metrics, 'ams_http_request_duration_seconds')
        },
        database: {
          averageQueryTime: this.getMetricValue(metrics, 'ams_db_query_duration_seconds'),
          activeConnections: this.getMetricValue(metrics, 'ams_db_connections_active'),
          queryErrors: this.getMetricValue(metrics, 'ams_db_query_errors_total')
        },
        business: {
          totalUsers: this.getMetricValue(metrics, 'ams_users_total'),
          totalAnlagen: this.getMetricValue(metrics, 'ams_anlagen_total'),
          loginAttempts: this.getMetricValue(metrics, 'ams_login_attempts_total')
        },
        system: {
          memoryUsage: this.getMetricValue(metrics, 'ams_memory_usage_bytes'),
          eventLoopLag: this.getMetricValue(metrics, 'ams_event_loop_lag_seconds')
        },
        errors: {
          totalErrors: this.getMetricValue(metrics, 'ams_errors_total'),
          securityEvents: this.getMetricValue(metrics, 'ams_security_events_total')
        }
      };

      return summary;
    } catch (error) {
      logger.error('Failed to generate metrics summary:', error);
      return null;
    }
  }

  // Hilfsfunktion zum Extrahieren von Metrik-Werten
  getMetricValue(metrics, metricName) {
    const metric = metrics.find(m => m.name === metricName);
    if (!metric) return 0;

    if (metric.type === 'counter' || metric.type === 'gauge') {
      return metric.values.reduce((sum, v) => sum + v.value, 0);
    }

    if (metric.type === 'histogram') {
      const count = metric.values.find(v => v.metricName?.includes('_count'))?.value || 0;
      const sum = metric.values.find(v => v.metricName?.includes('_sum'))?.value || 0;
      return count > 0 ? sum / count : 0;
    }

    return 0;
  }

  // Health-Check
  getHealthStatus() {
    return {
      initialized: this.initialized,
      metricsCount: Object.keys(this.metrics).length,
      registeredMetrics: this.register.getSingleMetricAsString('ams_http_requests_total') ? 'OK' : 'ERROR'
    };
  }

  // Graceful Shutdown
  shutdown() {
    this.register.clear();
    this.initialized = false;
    logger.info('Metrics service shut down');
  }
}

// Singleton-Instance
const metricsService = new MetricsService();

// System-Metriken regelmäßig aktualisieren
if (process.env.ENABLE_METRICS === 'true') {
  metricsService.initialize();
  
  // System-Metriken alle 30 Sekunden aktualisieren
  setInterval(() => {
    metricsService.updateSystemMetrics();
  }, 30000);
}

module.exports = metricsService;