const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');

class ImageService {
  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || './uploads';
    this.maxFileSize = parseInt(process.env.UPLOAD_MAX_SIZE) || 10 * 1024 * 1024; // 10MB
    
    // Bildgrößen für verschiedene Verwendungszwecke
    this.sizes = {
      thumbnail: { width: 150, height: 150 },
      small: { width: 300, height: 300 },
      medium: { width: 800, height: 600 },
      large: { width: 1200, height: 900 }
    };
    
    // Unterstützte Bildformate
    this.supportedFormats = ['jpeg', 'jpg', 'png', 'webp'];
  }

  async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  // Bildvalidierung
  validateImage(file) {
    const errors = [];
    
    if (!file) {
      errors.push('No file provided');
      return errors;
    }
    
    // Dateigröße prüfen
    if (file.size > this.maxFileSize) {
      errors.push(`File size exceeds maximum of ${this.maxFileSize / (1024 * 1024)}MB`);
    }
    
    // MIME-Type prüfen
    if (!file.mimetype.startsWith('image/')) {
      errors.push('File is not an image');
    }
    
    // Dateiendung prüfen
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    if (!this.supportedFormats.includes(ext)) {
      errors.push(`Unsupported format. Supported: ${this.supportedFormats.join(', ')}`);
    }
    
    return errors;
  }

  // Eindeutigen Dateinamen generieren
  generateFilename(originalName, size = null, suffix = null) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(originalName).toLowerCase();
    const name = path.basename(originalName, ext);
    
    let filename = `${name}_${timestamp}_${random}`;
    
    if (size) {
      filename += `_${size}`;
    }
    
    if (suffix) {
      filename += `_${suffix}`;
    }
    
    return `${filename}${ext}`;
  }

  // Bild in verschiedenen Größen verarbeiten
  async processImage(file, options = {}) {
    try {
      await this.ensureUploadDir();
      
      const validationErrors = this.validateImage(file);
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }
      
      const results = {};
      const originalFilename = this.generateFilename(file.originalname);
      
      // Original-Metadaten lesen
      const image = sharp(file.buffer);
      const metadata = await image.metadata();
      
      // Basis-Informationen
      results.original = {
        filename: originalFilename,
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: file.size,
        path: path.join(this.uploadDir, originalFilename)
      };
      
      // Original optimiert speichern
      await image
        .jpeg({ quality: 90, progressive: true })
        .png({ quality: 90, compressionLevel: 6 })
        .webp({ quality: 90 })
        .toFile(results.original.path);
      
      // Verschiedene Größen generieren
      if (options.generateSizes !== false) {
        for (const [sizeKey, dimensions] of Object.entries(this.sizes)) {
          const sizeFilename = this.generateFilename(file.originalname, sizeKey);
          const sizePath = path.join(this.uploadDir, sizeFilename);
          
          await image
            .resize(dimensions.width, dimensions.height, {
              fit: 'inside',
              withoutEnlargement: true
            })
            .jpeg({ quality: 85 })
            .png({ quality: 85 })
            .webp({ quality: 85 })
            .toFile(sizePath);
          
          results[sizeKey] = {
            filename: sizeFilename,
            width: dimensions.width,
            height: dimensions.height,
            path: sizePath
          };
        }
      }
      
      // WebP-Version generieren für moderne Browser
      if (options.generateWebp !== false) {
        const webpFilename = this.generateFilename(file.originalname, null, 'webp').replace(/\.[^.]+$/, '.webp');
        const webpPath = path.join(this.uploadDir, webpFilename);
        
        await image
          .webp({ quality: 80 })
          .toFile(webpPath);
        
        results.webp = {
          filename: webpFilename,
          path: webpPath,
          format: 'webp'
        };
      }
      
      logger.info(`Image processed successfully: ${file.originalname}`);
      return results;
      
    } catch (error) {
      logger.error('Image processing failed:', error);
      throw error;
    }
  }

  // Bild löschen (alle Größen)
  async deleteImage(imageData) {
    try {
      const filesToDelete = [];
      
      // Alle Größen sammeln
      for (const [key, data] of Object.entries(imageData)) {
        if (data && data.path) {
          filesToDelete.push(data.path);
        }
      }
      
      // Dateien löschen
      for (const filePath of filesToDelete) {
        try {
          await fs.unlink(filePath);
          logger.info(`Deleted image file: ${filePath}`);
        } catch (error) {
          if (error.code !== 'ENOENT') {
            logger.error(`Failed to delete image file ${filePath}:`, error);
          }
        }
      }
      
      return true;
    } catch (error) {
      logger.error('Failed to delete image:', error);
      return false;
    }
  }

  // Bild optimieren (bestehende Datei)
  async optimizeExistingImage(filePath, outputPath = null) {
    try {
      outputPath = outputPath || filePath;
      
      const image = sharp(filePath);
      const metadata = await image.metadata();
      
      let pipeline = image;
      
      // Format-spezifische Optimierung
      switch (metadata.format) {
        case 'jpeg':
          pipeline = pipeline.jpeg({ quality: 85, progressive: true });
          break;
        case 'png':
          pipeline = pipeline.png({ quality: 85, compressionLevel: 6 });
          break;
        case 'webp':
          pipeline = pipeline.webp({ quality: 85 });
          break;
      }
      
      await pipeline.toFile(outputPath);
      
      logger.info(`Image optimized: ${filePath}`);
      return true;
    } catch (error) {
      logger.error('Image optimization failed:', error);
      return false;
    }
  }

  // Bildinfo abrufen
  async getImageInfo(filePath) {
    try {
      const image = sharp(filePath);
      const metadata = await image.metadata();
      const stats = await fs.stat(filePath);
      
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: stats.size,
        density: metadata.density,
        channels: metadata.channels,
        depth: metadata.depth,
        hasAlpha: metadata.hasAlpha,
        orientation: metadata.orientation,
        created: stats.birthtime,
        modified: stats.mtime
      };
    } catch (error) {
      logger.error('Failed to get image info:', error);
      return null;
    }
  }

  // Batch-Verarbeitung für Excel-Import
  async processBatch(files, options = {}) {
    const results = [];
    const errors = [];
    
    for (let i = 0; i < files.length; i++) {
      try {
        const result = await this.processImage(files[i], options);
        results.push({
          index: i,
          originalName: files[i].originalname,
          success: true,
          data: result
        });
      } catch (error) {
        errors.push({
          index: i,
          originalName: files[i].originalname,
          success: false,
          error: error.message
        });
      }
    }
    
    return {
      processed: results.length,
      errors: errors.length,
      results,
      errors
    };
  }

  // Cleanup-Routine für alte Dateien
  async cleanupOldFiles(maxAgeHours = 24) {
    try {
      const files = await fs.readdir(this.uploadDir);
      const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
      
      let deletedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(this.uploadDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.birthtime.getTime() < cutoffTime) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }
      
      logger.info(`Cleaned up ${deletedCount} old image files`);
      return deletedCount;
    } catch (error) {
      logger.error('Image cleanup failed:', error);
      return 0;
    }
  }

  // Storage-Statistiken
  async getStorageStats() {
    try {
      const files = await fs.readdir(this.uploadDir);
      let totalSize = 0;
      let totalFiles = files.length;
      
      for (const file of files) {
        const filePath = path.join(this.uploadDir, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }
      
      return {
        totalFiles,
        totalSize,
        totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
        averageFileSize: totalFiles > 0 ? Math.round(totalSize / totalFiles) : 0
      };
    } catch (error) {
      logger.error('Failed to get storage stats:', error);
      return null;
    }
  }
}

module.exports = new ImageService();