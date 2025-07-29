const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const AWS = require('aws-sdk');
const cron = require('node-cron');
const logger = require('../utils/logger').logger;

const execAsync = promisify(exec);

class BackupService {
  constructor() {
    this.backupDir = process.env.BACKUP_DIR || path.join(__dirname, '../../backups');
    this.dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'anlagen_management',
      username: process.env.DB_USER || 'ams_user',
      password: process.env.DB_PASSWORD
    };
    
    this.s3Config = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'eu-central-1',
      bucket: process.env.BACKUP_S3_BUCKET
    };
    
    this.retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS) || 30;
    this.s3 = null;
    
    this.initializeAWS();
    this.ensureBackupDirectory();
    this.setupScheduledBackups();
  }

  async initializeAWS() {
    if (this.s3Config.accessKeyId && this.s3Config.secretAccessKey && this.s3Config.bucket) {
      try {
        this.s3 = new AWS.S3({
          accessKeyId: this.s3Config.accessKeyId,
          secretAccessKey: this.s3Config.secretAccessKey,
          region: this.s3Config.region
        });
        
        // Test S3-Verbindung
        await this.s3.headBucket({ Bucket: this.s3Config.bucket }).promise();
        logger.info('S3 backup storage initialized');
      } catch (error) {
        logger.warn('S3 backup storage not available:', error.message);
        this.s3 = null;
      }
    }
  }

  async ensureBackupDirectory() {
    try {
      await fs.access(this.backupDir);
    } catch {
      await fs.mkdir(this.backupDir, { recursive: true });
      logger.info(`Created backup directory: ${this.backupDir}`);
    }
  }

  // Datenbank-Backup erstellen
  async createDatabaseBackup(type = 'full') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${this.dbConfig.database}_${type}_${timestamp}.sql`;
    const filepath = path.join(this.backupDir, filename);
    
    try {
      logger.info(`Starting ${type} database backup: ${filename}`);
      const startTime = Date.now();
      
      // pg_dump Command zusammenstellen
      let pgDumpCmd = `pg_dump`;
      
      // Connection-Parameter
      pgDumpCmd += ` -h ${this.dbConfig.host}`;
      pgDumpCmd += ` -p ${this.dbConfig.port}`;
      pgDumpCmd += ` -U ${this.dbConfig.username}`;
      pgDumpCmd += ` -d ${this.dbConfig.database}`;
      
      // Backup-Typ-spezifische Optionen
      switch (type) {
        case 'schema':
          pgDumpCmd += ` --schema-only`;
          break;
        case 'data':
          pgDumpCmd += ` --data-only`;
          break;
        case 'full':
        default:
          pgDumpCmd += ` --verbose --clean --if-exists`;
          break;
      }
      
      // Kompression und Output
      pgDumpCmd += ` --format=custom --compress=9`;
      pgDumpCmd += ` --file="${filepath}"`;
      
      // Umgebungsvariable für Passwort
      const env = { ...process.env, PGPASSWORD: this.dbConfig.password };
      
      // Backup ausführen
      const { stdout, stderr } = await execAsync(pgDumpCmd, { env });
      
      const duration = Date.now() - startTime;
      const stats = await fs.stat(filepath);
      
      logger.info(`Database backup completed: ${filename} (${this.formatBytes(stats.size)}, ${duration}ms)`);
      
      // Backup-Metadaten
      const backupInfo = {
        filename,
        filepath,
        type,
        size: stats.size,
        duration,
        timestamp: new Date().toISOString(),
        database: this.dbConfig.database,
        checksum: await this.calculateChecksum(filepath)
      };
      
      // Metadaten-Datei erstellen
      const metaPath = filepath.replace('.sql', '.meta.json');
      await fs.writeFile(metaPath, JSON.stringify(backupInfo, null, 2));
      
      // S3-Upload falls konfiguriert
      if (this.s3) {
        await this.uploadToS3(filepath, filename);
        await this.uploadToS3(metaPath, filename.replace('.sql', '.meta.json'));
      }
      
      return backupInfo;
      
    } catch (error) {
      logger.error(`Database backup failed: ${error.message}`);
      
      // Cleanup bei Fehler
      try {
        await fs.unlink(filepath);
      } catch {}
      
      throw error;
    }
  }

  // File-System-Backup (Uploads, Logs, etc.)
  async createFileSystemBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `filesystem_backup_${timestamp}.tar.gz`;
    const filepath = path.join(this.backupDir, filename);
    
    try {
      logger.info(`Starting filesystem backup: ${filename}`);
      const startTime = Date.now();
      
      // Zu sichernde Verzeichnisse
      const backupPaths = [
        process.env.UPLOAD_DIR || './uploads',
        process.env.LOG_DIR || './logs',
        './config'
      ].filter(p => {
        try {
          require('fs').accessSync(p);
          return true;
        } catch {
          return false;
        }
      });
      
      if (backupPaths.length === 0) {
        logger.warn('No filesystem paths found for backup');
        return null;
      }
      
      // tar-Command erstellen
      const tarCmd = `tar -czf "${filepath}" ${backupPaths.join(' ')}`;
      
      const { stdout, stderr } = await execAsync(tarCmd);
      
      const duration = Date.now() - startTime;
      const stats = await fs.stat(filepath);
      
      logger.info(`Filesystem backup completed: ${filename} (${this.formatBytes(stats.size)}, ${duration}ms)`);
      
      const backupInfo = {
        filename,
        filepath,
        type: 'filesystem',
        size: stats.size,
        duration,
        timestamp: new Date().toISOString(),
        paths: backupPaths,
        checksum: await this.calculateChecksum(filepath)
      };
      
      // S3-Upload
      if (this.s3) {
        await this.uploadToS3(filepath, filename);
      }
      
      return backupInfo;
      
    } catch (error) {
      logger.error(`Filesystem backup failed: ${error.message}`);
      throw error;
    }
  }

  // S3-Upload
  async uploadToS3(filepath, key) {
    if (!this.s3) return false;
    
    try {
      const fileContent = await fs.readFile(filepath);
      const s3Key = `backups/${new Date().toISOString().split('T')[0]}/${key}`;
      
      const uploadParams = {
        Bucket: this.s3Config.bucket,
        Key: s3Key,
        Body: fileContent,
        ServerSideEncryption: 'AES256',
        Metadata: {
          'backup-date': new Date().toISOString(),
          'backup-type': 'automated',
          'source': 'anlagen-management-system'
        }
      };
      
      const result = await this.s3.upload(uploadParams).promise();
      logger.info(`Backup uploaded to S3: ${result.Location}`);
      
      return true;
    } catch (error) {
      logger.error(`S3 upload failed: ${error.message}`);
      return false;
    }
  }

  // Backup wiederherstellen
  async restoreDatabase(backupPath, options = {}) {
    const { 
      dropDatabase = false,
      createDatabase = false,
      verbose = true 
    } = options;
    
    try {
      logger.info(`Starting database restore from: ${backupPath}`);
      const startTime = Date.now();
      
      // Backup-Datei prüfen
      await fs.access(backupPath);
      const stats = await fs.stat(backupPath);
      logger.info(`Restore file size: ${this.formatBytes(stats.size)}`);
      
      // pg_restore Command
      let restoreCmd = `pg_restore`;
      restoreCmd += ` -h ${this.dbConfig.host}`;
      restoreCmd += ` -p ${this.dbConfig.port}`;
      restoreCmd += ` -U ${this.dbConfig.username}`;
      restoreCmd += ` -d ${this.dbConfig.database}`;
      
      if (verbose) restoreCmd += ` --verbose`;
      if (dropDatabase) restoreCmd += ` --clean`;
      if (createDatabase) restoreCmd += ` --create`;
      
      restoreCmd += ` "${backupPath}"`;
      
      const env = { ...process.env, PGPASSWORD: this.dbConfig.password };
      const { stdout, stderr } = await execAsync(restoreCmd, { env });
      
      const duration = Date.now() - startTime;
      logger.info(`Database restore completed (${duration}ms)`);
      
      return {
        success: true,
        duration,
        backupPath,
        restoredAt: new Date().toISOString()
      };
      
    } catch (error) {
      logger.error(`Database restore failed: ${error.message}`);
      throw error;
    }
  }

  // Backup-Cleanup (alte Backups löschen)
  async cleanupOldBackups() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);
      
      const files = await fs.readdir(this.backupDir);
      let deletedCount = 0;
      let freedSpace = 0;
      
      for (const file of files) {
        const filepath = path.join(this.backupDir, file);
        const stats = await fs.stat(filepath);
        
        if (stats.mtime < cutoffDate) {
          freedSpace += stats.size;
          await fs.unlink(filepath);
          deletedCount++;
          logger.info(`Deleted old backup: ${file}`);
        }
      }
      
      // S3-Cleanup
      if (this.s3) {
        await this.cleanupS3Backups(cutoffDate);
      }
      
      logger.info(`Backup cleanup completed: ${deletedCount} files deleted, ${this.formatBytes(freedSpace)} freed`);
      
      return {
        deletedFiles: deletedCount,
        freedSpace
      };
      
    } catch (error) {
      logger.error(`Backup cleanup failed: ${error.message}`);
      throw error;
    }
  }

  // S3-Backup-Cleanup
  async cleanupS3Backups(cutoffDate) {
    try {
      const listParams = {
        Bucket: this.s3Config.bucket,
        Prefix: 'backups/'
      };
      
      const objects = await this.s3.listObjectsV2(listParams).promise();
      const toDelete = objects.Contents.filter(obj => obj.LastModified < cutoffDate);
      
      if (toDelete.length > 0) {
        const deleteParams = {
          Bucket: this.s3Config.bucket,
          Delete: {
            Objects: toDelete.map(obj => ({ Key: obj.Key }))
          }
        };
        
        await this.s3.deleteObjects(deleteParams).promise();
        logger.info(`Deleted ${toDelete.length} old S3 backups`);
      }
      
    } catch (error) {
      logger.error(`S3 cleanup failed: ${error.message}`);
    }
  }

  // Backup-Liste abrufen
  async listBackups() {
    try {
      const localBackups = await this.listLocalBackups();
      const s3Backups = this.s3 ? await this.listS3Backups() : [];
      
      return {
        local: localBackups,
        s3: s3Backups,
        total: localBackups.length + s3Backups.length
      };
      
    } catch (error) {
      logger.error(`Failed to list backups: ${error.message}`);
      throw error;
    }
  }

  async listLocalBackups() {
    const files = await fs.readdir(this.backupDir);
    const backups = [];
    
    for (const file of files) {
      if (file.endsWith('.sql') || file.endsWith('.tar.gz')) {
        const filepath = path.join(this.backupDir, file);
        const stats = await fs.stat(filepath);
        
        // Metadaten-Datei suchen
        let metadata = null;
        const metaPath = filepath.replace(/\.(sql|tar\.gz)$/, '.meta.json');
        try {
          const metaContent = await fs.readFile(metaPath, 'utf8');
          metadata = JSON.parse(metaContent);
        } catch {}
        
        backups.push({
          filename: file,
          filepath,
          size: stats.size,
          created: stats.mtime,
          type: file.includes('filesystem') ? 'filesystem' : 'database',
          location: 'local',
          metadata
        });
      }
    }
    
    return backups.sort((a, b) => b.created - a.created);
  }

  async listS3Backups() {
    if (!this.s3) return [];
    
    try {
      const listParams = {
        Bucket: this.s3Config.bucket,
        Prefix: 'backups/'
      };
      
      const objects = await this.s3.listObjectsV2(listParams).promise();
      
      return objects.Contents
        .filter(obj => obj.Key.endsWith('.sql') || obj.Key.endsWith('.tar.gz'))
        .map(obj => ({
          filename: path.basename(obj.Key),
          key: obj.Key,
          size: obj.Size,
          created: obj.LastModified,
          type: obj.Key.includes('filesystem') ? 'filesystem' : 'database',
          location: 's3'
        }))
        .sort((a, b) => b.created - a.created);
        
    } catch (error) {
      logger.error(`Failed to list S3 backups: ${error.message}`);
      return [];
    }
  }

  // Backup-Validierung
  async validateBackup(backupPath) {
    try {
      const stats = await fs.stat(backupPath);
      
      // Dateigröße prüfen
      if (stats.size < 1024) { // < 1KB
        throw new Error('Backup file too small');
      }
      
      // Checksum-Validierung falls Metadaten vorhanden
      const metaPath = backupPath.replace(/\.(sql|tar\.gz)$/, '.meta.json');
      try {
        const metaContent = await fs.readFile(metaPath, 'utf8');
        const metadata = JSON.parse(metaContent);
        
        if (metadata.checksum) {
          const currentChecksum = await this.calculateChecksum(backupPath);
          if (currentChecksum !== metadata.checksum) {
            throw new Error('Backup checksum mismatch');
          }
        }
      } catch (metaError) {
        logger.warn(`No metadata file found for backup: ${backupPath}`);
      }
      
      // Für SQL-Backups: pg_restore --list testen
      if (backupPath.endsWith('.sql')) {
        const testCmd = `pg_restore --list "${backupPath}"`;
        await execAsync(testCmd);
      }
      
      return {
        valid: true,
        size: stats.size,
        lastModified: stats.mtime
      };
      
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  // Hilfsfunktionen
  async calculateChecksum(filepath) {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    const data = await fs.readFile(filepath);
    hash.update(data);
    return hash.digest('hex');
  }

  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  // Scheduled Backups einrichten
  setupScheduledBackups() {
    if (process.env.BACKUP_SCHEDULE === 'false') return;
    
    // Täglich um 2:00 Uhr - Vollbackup
    cron.schedule('0 2 * * *', async () => {
      try {
        logger.info('Starting scheduled full backup');
        await this.createDatabaseBackup('full');
        await this.createFileSystemBackup();
        await this.cleanupOldBackups();
        logger.info('Scheduled backup completed');
      } catch (error) {
        logger.error('Scheduled backup failed:', error);
      }
    });
    
    // Wöchentlich am Sonntag um 1:00 Uhr - Cleanup
    cron.schedule('0 1 * * 0', async () => {
      try {
        await this.cleanupOldBackups();
      } catch (error) {
        logger.error('Scheduled cleanup failed:', error);
      }
    });
    
    logger.info('Scheduled backups configured');
  }

  // Health-Check
  async getHealthStatus() {
    const status = {
      backupDirectory: {
        exists: false,
        writable: false,
        path: this.backupDir
      },
      database: {
        accessible: false
      },
      s3: {
        configured: !!this.s3,
        accessible: false
      }
    };
    
    try {
      // Backup-Verzeichnis prüfen
      await fs.access(this.backupDir, fs.constants.F_OK | fs.constants.W_OK);
      status.backupDirectory.exists = true;
      status.backupDirectory.writable = true;
    } catch {}
    
    try {
      // Datenbank-Verbindung testen
      const testCmd = `pg_isready -h ${this.dbConfig.host} -p ${this.dbConfig.port}`;
      await execAsync(testCmd);
      status.database.accessible = true;
    } catch {}
    
    try {
      // S3-Zugriff testen
      if (this.s3) {
        await this.s3.headBucket({ Bucket: this.s3Config.bucket }).promise();
        status.s3.accessible = true;
      }
    } catch {}
    
    return status;
  }
}

module.exports = new BackupService();