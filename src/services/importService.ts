import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { Express } from 'express';
import { 
  ImportJob, 
  ImportJobData, 
  ExcelColumnMapping, 
  ImportValidationResult,
  ImportStats,
  RollbackData
} from '@/types/import';
import { ExcelParser } from './excelParser';
import { importQueueService } from './importQueue';
import { createError } from '@/middleware/errorHandler';
import pool from '@/config/database';

export class ImportService {
  private static readonly UPLOAD_DIR = path.join(process.cwd(), 'uploads');
  private static readonly ALLOWED_EXTENSIONS = ['.xlsx', '.xls'];
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  static async initializeUploadDirectory(): Promise<void> {
    if (!fs.existsSync(this.UPLOAD_DIR)) {
      fs.mkdirSync(this.UPLOAD_DIR, { recursive: true });
    }
  }

  static async validateAndStartImport(
    mandantId: string,
    userId: string,
    file: Express.Multer.File,
    columnMapping: ExcelColumnMapping
  ): Promise<{ jobId: string; validation: ImportValidationResult }> {
    // Validate file
    await this.validateUploadedFile(file);

    // Save file to disk
    const fileName = `${uuidv4()}_${Date.now()}${path.extname(file.originalname)}`;
    const filePath = path.join(this.UPLOAD_DIR, fileName);
    
    fs.writeFileSync(filePath, file.buffer);

    try {
      // Validate Excel structure and content
      const validation = await ExcelParser.validateExcelStructure(filePath, columnMapping);
      
      if (!validation.isValid) {
        // Clean up file on validation failure
        fs.unlinkSync(filePath);
        throw createError(`Excel validation failed: ${validation.errors.map(e => e.message).join(', ')}`, 400);
      }

      // Create job ID
      const jobId = uuidv4();

      // Prepare job data
      const jobData: ImportJobData = {
        jobId,
        mandantId,
        userId,
        filePath,
        fileName: file.originalname,
        columnMapping,
        batchSize: 100 // Default batch size
      };

      // Add job to queue
      await importQueueService.addImportJob(jobData);

      return {
        jobId,
        validation
      };

    } catch (error) {
      // Clean up file on error
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw error;
    }
  }

  static async getJob(jobId: string, mandantId: string): Promise<ImportJob> {
    const job = await importQueueService.getJob(jobId);
    
    if (!job) {
      throw createError('Import job not found', 404);
    }

    if (job.mandantId !== mandantId) {
      throw createError('Access denied to this import job', 403);
    }

    return job;
  }

  static async getJobsByMandant(
    mandantId: string,
    limit = 50,
    offset = 0
  ): Promise<{ jobs: ImportJob[]; total: number }> {
    const jobs = await importQueueService.getJobsByMandant(mandantId, limit, offset);
    
    // Get total count
    const countQuery = 'SELECT COUNT(*) as count FROM import_jobs WHERE mandant_id = $1';
    const { rows } = await pool.query(countQuery, [mandantId]);
    const total = parseInt(rows[0].count, 10);

    return { jobs, total };
  }

  static async generateErrorReport(jobId: string, mandantId: string): Promise<Buffer> {
    const job = await this.getJob(jobId, mandantId);
    
    if (job.errors.length === 0) {
      throw createError('No errors found for this import job', 400);
    }

    return ExcelParser.generateErrorReport(job.errors, job.originalName);
  }

  static async rollbackImport(jobId: string, mandantId: string, userId: string): Promise<void> {
    const job = await this.getJob(jobId, mandantId);
    
    if (job.status !== 'completed') {
      throw createError('Can only rollback completed import jobs', 400);
    }

    if (!job.rollbackData || Object.keys(job.rollbackData).length === 0) {
      throw createError('No rollback data available for this job', 400);
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const rollbackData = job.rollbackData as RollbackData;

      // Delete created Anlagen
      if (rollbackData.createdAnlagen && rollbackData.createdAnlagen.length > 0) {
        const anlagenQuery = `
          UPDATE anlagen 
          SET is_active = false, updated_at = CURRENT_TIMESTAMP
          WHERE id = ANY($1::uuid[])
        `;
        await client.query(anlagenQuery, [rollbackData.createdAnlagen]);
      }

      // Restore updated Anlagen (if any)
      if (rollbackData.updatedAnlagen && rollbackData.updatedAnlagen.length > 0) {
        for (const update of rollbackData.updatedAnlagen) {
          const restoreQuery = `
            UPDATE anlagen 
            SET t_nummer = $2, aks_code = $3, name = $4, description = $5,
                status = $6, zustands_bewertung = $7, dynamic_fields = $8,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
          `;
          const prev = update.previousData;
          await client.query(restoreQuery, [
            update.id,
            prev.t_nummer,
            prev.aks_code,
            prev.name,
            prev.description,
            prev.status,
            prev.zustands_bewertung,
            JSON.stringify(prev.dynamic_fields)
          ]);
        }
      }

      // Delete created Objekte (only if no other Anlagen exist)
      if (rollbackData.createdObjekte && rollbackData.createdObjekte.length > 0) {
        for (const objektId of rollbackData.createdObjekte) {
          const anlagenCountQuery = `
            SELECT COUNT(*) as count 
            FROM anlagen 
            WHERE objekt_id = $1 AND is_active = true
          `;
          const { rows } = await client.query(anlagenCountQuery, [objektId]);
          
          if (parseInt(rows[0].count, 10) === 0) {
            await client.query(
              'UPDATE objekte SET is_active = false WHERE id = $1',
              [objektId]
            );
          }
        }
      }

      // Delete created Liegenschaften (only if no other Objekte exist)
      if (rollbackData.createdLiegenschaften && rollbackData.createdLiegenschaften.length > 0) {
        for (const liegenschaftId of rollbackData.createdLiegenschaften) {
          const objekteCountQuery = `
            SELECT COUNT(*) as count 
            FROM objekte 
            WHERE liegenschaft_id = $1 AND is_active = true
          `;
          const { rows } = await client.query(objekteCountQuery, [liegenschaftId]);
          
          if (parseInt(rows[0].count, 10) === 0) {
            await client.query(
              'UPDATE liegenschaften SET is_active = false WHERE id = $1',
              [liegenschaftId]
            );
          }
        }
      }

      // Update job status
      const updateJobQuery = `
        UPDATE import_jobs 
        SET status = 'rolled_back', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;
      await client.query(updateJobQuery, [jobId]);

      await client.query('COMMIT');

      console.log(`Import job ${jobId} rolled back successfully by user ${userId}`);

    } catch (error) {
      await client.query('ROLLBACK');
      throw createError(`Rollback failed: ${error.message}`, 500);
    } finally {
      client.release();
    }
  }

  static async cancelJob(jobId: string, mandantId: string): Promise<void> {
    const job = await this.getJob(jobId, mandantId);
    
    if (job.status !== 'pending' && job.status !== 'processing') {
      throw createError('Can only cancel pending or processing jobs', 400);
    }

    const cancelled = await importQueueService.cancelJob(jobId);
    
    if (!cancelled) {
      throw createError('Failed to cancel job', 500);
    }
  }

  static async getImportStats(mandantId: string): Promise<ImportStats> {
    const query = `
      SELECT 
        COUNT(*) as total_jobs,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_jobs,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_jobs,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_jobs,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_jobs
      FROM import_jobs 
      WHERE mandant_id = $1
    `;
    
    const { rows } = await pool.query(query, [mandantId]);
    const row = rows[0];

    return {
      totalJobs: parseInt(row.total_jobs, 10),
      pendingJobs: parseInt(row.pending_jobs, 10),
      processingJobs: parseInt(row.processing_jobs, 10),
      completedJobs: parseInt(row.completed_jobs, 10),
      failedJobs: parseInt(row.failed_jobs, 10)
    };
  }

  static async getQueueStats() {
    return importQueueService.getQueueStats();
  }

  private static async validateUploadedFile(file: Express.Multer.File): Promise<void> {
    if (!file) {
      throw createError('No file uploaded', 400);
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw createError(
        `File too large. Maximum size is ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`,
        400
      );
    }

    const ext = path.extname(file.originalname).toLowerCase();
    if (!this.ALLOWED_EXTENSIONS.includes(ext)) {
      throw createError(
        `Invalid file type. Allowed types: ${this.ALLOWED_EXTENSIONS.join(', ')}`,
        400
      );
    }
  }

  static getDefaultColumnMapping(): ExcelColumnMapping {
    return {
      tNummer: 'T-Nummer',
      aksCode: 'AKS-Code',
      name: 'Anlagenname',
      description: 'Beschreibung',
      status: 'Status',
      zustandsBewertung: 'Zustandsbewertung',
      objektName: 'Objekt',
      liegenschaftName: 'Liegenschaft',
      floor: 'Etage',
      room: 'Raum'
    };
  }
}