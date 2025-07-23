const Redis = require('redis');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.defaultTTL = process.env.CACHE_TTL || 3600; // 1 Stunde
  }

  async connect() {
    try {
      if (process.env.REDIS_URL) {
        this.client = Redis.createClient({
          url: process.env.REDIS_URL,
          retry_strategy: (options) => {
            if (options.error && options.error.code === 'ECONNREFUSED') {
              logger.error('Redis server connection refused');
              return new Error('Redis server connection refused');
            }
            if (options.total_retry_time > 1000 * 60 * 60) {
              return new Error('Redis retry time exhausted');
            }
            if (options.attempt > 10) {
              return undefined;
            }
            return Math.min(options.attempt * 100, 3000);
          }
        });

        this.client.on('error', (error) => {
          logger.error('Redis Client Error:', error);
          this.isConnected = false;
        });

        this.client.on('connect', () => {
          logger.info('Redis Client Connected');
          this.isConnected = true;
        });

        this.client.on('ready', () => {
          logger.info('Redis Client Ready');
          this.isConnected = true;
        });

        this.client.on('end', () => {
          logger.info('Redis Client Disconnected');
          this.isConnected = false;
        });

        await this.client.connect();
        logger.info('Cache service initialized');
      } else {
        logger.warn('Redis URL not configured, cache disabled');
      }
    } catch (error) {
      logger.error('Failed to initialize cache service:', error);
      this.isConnected = false;
    }
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
      logger.info('Cache service disconnected');
    }
  }

  // Basis-Cache-Operationen
  async get(key) {
    if (!this.isConnected) return null;

    try {
      const value = await this.client.get(key);
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    if (!this.isConnected) return false;

    try {
      const serialized = JSON.stringify(value);
      await this.client.setEx(key, ttl, serialized);
      return true;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected) return false;

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  async exists(key) {
    if (!this.isConnected) return false;

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  // Pattern-basierte Löschung
  async deletePattern(pattern) {
    if (!this.isConnected) return false;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      logger.error(`Cache delete pattern error for ${pattern}:`, error);
      return false;
    }
  }

  // Mandanten-spezifische Cache-Operationen
  getMandantKey(mandantId, key) {
    return `mandant:${mandantId}:${key}`;
  }

  async getMandantCache(mandantId, key) {
    return this.get(this.getMandantKey(mandantId, key));
  }

  async setMandantCache(mandantId, key, value, ttl = this.defaultTTL) {
    return this.set(this.getMandantKey(mandantId, key), value, ttl);
  }

  async delMandantCache(mandantId, key) {
    return this.del(this.getMandantKey(mandantId, key));
  }

  async clearMandantCache(mandantId) {
    return this.deletePattern(`mandant:${mandantId}:*`);
  }

  // Anlagen-Cache-Operationen
  async getAnlage(mandantId, anlageId) {
    return this.getMandantCache(mandantId, `anlage:${anlageId}`);
  }

  async setAnlage(mandantId, anlage, ttl = 1800) { // 30 Minuten
    return this.setMandantCache(mandantId, `anlage:${anlage.id}`, anlage, ttl);
  }

  async delAnlage(mandantId, anlageId) {
    return this.delMandantCache(mandantId, `anlage:${anlageId}`);
  }

  async getAnlagenList(mandantId, filters = {}) {
    const filterKey = Object.keys(filters).sort().map(k => `${k}:${filters[k]}`).join('|');
    return this.getMandantCache(mandantId, `anlagen:list:${filterKey}`);
  }

  async setAnlagenList(mandantId, anlagen, filters = {}, ttl = 600) { // 10 Minuten
    const filterKey = Object.keys(filters).sort().map(k => `${k}:${filters[k]}`).join('|');
    return this.setMandantCache(mandantId, `anlagen:list:${filterKey}`, anlagen, ttl);
  }

  // AKS-Code-Cache
  async getAksCode(mandantId, aksCode) {
    return this.getMandantCache(mandantId, `aks:${aksCode}`);
  }

  async setAksCode(mandantId, aksCodeData, ttl = 3600) { // 1 Stunde
    return this.setMandantCache(mandantId, `aks:${aksCodeData.code}`, aksCodeData, ttl);
  }

  async getAksCodesList(mandantId) {
    return this.getMandantCache(mandantId, 'aks:list');
  }

  async setAksCodesList(mandantId, aksCodes, ttl = 3600) {
    return this.setMandantCache(mandantId, 'aks:list', aksCodes, ttl);
  }

  // Benutzer-Cache
  async getUser(userId) {
    return this.get(`user:${userId}`);
  }

  async setUser(user, ttl = 3600) {
    return this.set(`user:${user.id}`, user, ttl);
  }

  async delUser(userId) {
    return this.del(`user:${userId}`);
  }

  // Session-Cache
  async getSession(sessionId) {
    return this.get(`session:${sessionId}`);
  }

  async setSession(sessionId, sessionData, ttl = 86400) { // 24 Stunden
    return this.set(`session:${sessionId}`, sessionData, ttl);
  }

  async delSession(sessionId) {
    return this.del(`session:${sessionId}`);
  }

  // Cache-Statistiken
  async getStats() {
    if (!this.isConnected) return null;

    try {
      const info = await this.client.info('memory');
      const keyspace = await this.client.info('keyspace');
      
      return {
        connected: this.isConnected,
        memory: info,
        keyspace: keyspace,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Cache stats error:', error);
      return null;
    }
  }

  // Cache-Invalidierung bei Änderungen
  async invalidateAnlagenCache(mandantId, anlageId = null) {
    await this.deletePattern(this.getMandantKey(mandantId, 'anlagen:list:*'));
    
    if (anlageId) {
      await this.delAnlage(mandantId, anlageId);
    }
  }

  async invalidateAksCache(mandantId) {
    await this.deletePattern(this.getMandantKey(mandantId, 'aks:*'));
  }

  async invalidateUserCache(userId) {
    await this.delUser(userId);
  }

  // Health Check
  async healthCheck() {
    if (!this.isConnected) {
      return { status: 'disconnected', error: 'Redis not connected' };
    }

    try {
      const start = Date.now();
      await this.client.ping();
      const responseTime = Date.now() - start;
      
      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        connected: this.isConnected
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        connected: false
      };
    }
  }
}

// Singleton-Instance
const cacheService = new CacheService();

module.exports = cacheService;