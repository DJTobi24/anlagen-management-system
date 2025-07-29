import Bull, { Job, Queue, DoneCallback } from 'bull';
import redisClient from '@/config/redis';
import { ImportJobData, ImportJob, ImportJobStatus, ProcessedRow, ImportError } from '@/types/import';
import { ExcelParser } from './excelParser';
import { importWorkerManager } from './importWorkerManager';
import pool from '@/config/database';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

interface ImportQueueData extends ImportJobData {
  totalRows: number;
}

class ImportQueueService {
  private queue: Queue<ImportQueueData>;

  constructor() {
    // Initialize Bull queue with Redis connection
    this.queue = new Bull<ImportQueueData>('import-queue', {
      redis: {
        host: process.env.REDIS_URL?.includes('mock') ? 'mock' : '192.168.1.126',
        port: 6379,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });

    this.setupJobProcessing();
    this.setupEventHandlers();
  }

  private setupJobProcessing() {
    // Process jobs with concurrency limit
    this.queue.process('import', 5, this.processImportJob.bind(this));
  }

  private setupEventHandlers() {
    this.queue.on('completed', (job: Job<ImportQueueData>) => {
      console.log(`Import job ${job.data.jobId} completed successfully`);
    });

    this.queue.on('failed', (job: Job<ImportQueueData>, err: Error) => {
      console.error(`Import job ${job.data.jobId} failed:`, err.message);
    });

    this.queue.on('progress', (job: Job<ImportQueueData>, progress: number) => {
      console.log(`Import job ${job.data.jobId} progress: ${progress}%`);
    });
  }

  async addImportJob(jobData: ImportJobData): Promise<string> {
    try {
      // Validate and count rows in Excel file
      const rows = await ExcelParser.parseExcelFile(jobData.filePath, jobData.columnMapping);
      
      // Create job record in database
      await this.createJobRecord({
        ...jobData,
        totalRows: rows.length,
        status: ImportJobStatus.PENDING
      });

      // Add job to queue
      const job = await this.queue.add('import', {
        ...jobData,
        totalRows: rows.length
      }, {
        jobId: jobData.jobId,
        priority: 1
      });

      console.log(`Import job ${jobData.jobId} added to queue with ${rows.length} rows`);
      
      return job.id.toString();
    } catch (error) {
      await this.updateJobStatus(jobData.jobId, ImportJobStatus.FAILED, {
        errors: [{ row: 0, message: `Failed to add job: ${error.message}` }]
      });
      throw error;
    }
  }

  private async processImportJob(job: Job<ImportQueueData>, done: DoneCallback): Promise<void> {
    const { jobId, filePath, columnMapping, mandantId, userId } = job.data;
    
    try {
      console.log(`Starting import job ${jobId}`);
      
      // Update job status to processing
      await this.updateJobStatus(jobId, ImportJobStatus.PROCESSING);
      
      // Parse Excel file
      const rows = await ExcelParser.parseExcelFile(filePath, columnMapping);
      
      if (rows.length === 0) {
        throw new Error('No data rows found in Excel file');
      }

      // Process rows using worker threads
      const results = await importWorkerManager.processRowsInParallel(
        job.data,
        rows,
        // Progress callback
        async (processed: number, total: number) => {
          const progress = Math.round((processed / total) * 100);
          job.progress(progress);
          
          await this.updateJobProgress(jobId, processed, total, progress);
        },
        // Worker complete callback
        async (workerResults: ProcessedRow[]) => {
          console.log(`Worker completed ${workerResults.length} rows for job ${jobId}`);
        }
      );

      // Calculate final statistics
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      
      const errors: ImportError[] = failed.map(row => ({
        row: row.row,
        message: row.error || 'Unknown error',
        data: { aksCode: row.aksCode, name: row.name }
      }));

      // Create rollback data for successful imports
      const rollbackData = {
        createdAnlagen: successful.filter(r => r.anlageId).map(r => r.anlageId!),
        updatedAnlagen: [],
        createdObjekte: [...new Set(successful.filter(r => r.objektId).map(r => r.objektId!))],
        createdLiegenschaften: []
      };

      // Update job status to completed
      await this.updateJobStatus(jobId, ImportJobStatus.COMPLETED, {
        processedRows: results.length,
        successfulRows: successful.length,
        failedRows: failed.length,
        progress: 100,
        errors,
        rollbackData,
        completedAt: new Date()
      });

      // Clean up uploaded file
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.warn(`Failed to delete uploaded file ${filePath}:`, error.message);
      }

      console.log(`Import job ${jobId} completed: ${successful.length} successful, ${failed.length} failed`);
      done();

    } catch (error) {
      console.error(`Import job ${jobId} failed:`, error.message);
      
      await this.updateJobStatus(jobId, ImportJobStatus.FAILED, {
        errors: [{ row: 0, message: error.message }],
        completedAt: new Date()
      });
      
      done(new Error(error.message));
    }
  }

  private async createJobRecord(data: ImportJobData & { totalRows: number; status: ImportJobStatus }): Promise<void> {
    const query = `
      INSERT INTO import_jobs (
        id, mandant_id, user_id, file_name, original_name, status, 
        total_rows, processed_rows, successful_rows, failed_rows, 
        progress, errors, rollback_data, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    `;

    await pool.query(query, [
      data.jobId,
      data.mandantId,
      data.userId,
      data.fileName,
      data.fileName, // Use fileName as originalName for now
      data.status,
      data.totalRows,
      0, // processedRows
      0, // successfulRows
      0, // failedRows
      0, // progress
      JSON.stringify([]), // errors
      JSON.stringify({}), // rollbackData
      new Date(),
      new Date()
    ]);
  }

  private async updateJobStatus(
    jobId: string, 
    status: ImportJobStatus, 
    updates: Partial<{
      processedRows: number;
      successfulRows: number;
      failedRows: number;
      progress: number;
      errors: ImportError[];
      rollbackData: any;
      completedAt: Date;
    }> = {}
  ): Promise<void> {
    const fields = ['status = $2', 'updated_at = $3'];
    const values = [jobId, status, new Date()];
    let paramCount = 4;

    if (updates.processedRows !== undefined) {
      fields.push(`processed_rows = $${paramCount++}`);
      values.push(updates.processedRows.toString());
    }
    if (updates.successfulRows !== undefined) {
      fields.push(`successful_rows = $${paramCount++}`);
      values.push(updates.successfulRows.toString());
    }
    if (updates.failedRows !== undefined) {
      fields.push(`failed_rows = $${paramCount++}`);
      values.push(updates.failedRows.toString());
    }
    if (updates.progress !== undefined) {
      fields.push(`progress = $${paramCount++}`);
      values.push(updates.progress.toString());
    }
    if (updates.errors) {
      fields.push(`errors = $${paramCount++}`);
      values.push(JSON.stringify(updates.errors));
    }
    if (updates.rollbackData) {
      fields.push(`rollback_data = $${paramCount++}`);
      values.push(JSON.stringify(updates.rollbackData));
    }
    if (updates.completedAt) {
      fields.push(`completed_at = $${paramCount++}`);
      values.push(updates.completedAt);
    }

    const query = `
      UPDATE import_jobs 
      SET ${fields.join(', ')}
      WHERE id = $1
    `;

    await pool.query(query, values);
  }

  private async updateJobProgress(
    jobId: string,
    processedRows: number,
    totalRows: number,
    progress: number
  ): Promise<void> {
    await this.updateJobStatus(jobId, ImportJobStatus.PROCESSING, {
      processedRows,
      progress
    });
  }

  async getJob(jobId: string): Promise<ImportJob | null> {
    const query = `
      SELECT * FROM import_jobs WHERE id = $1
    `;
    
    const { rows } = await pool.query(query, [jobId]);
    
    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      id: row.id,
      mandantId: row.mandant_id,
      userId: row.user_id,
      fileName: row.file_name,
      originalName: row.original_name,
      status: row.status,
      totalRows: row.total_rows,
      processedRows: row.processed_rows,
      successfulRows: row.successful_rows,
      failedRows: row.failed_rows,
      progress: row.progress,
      startedAt: row.created_at,
      completedAt: row.completed_at,
      errors: JSON.parse(row.errors || '[]'),
      rollbackData: JSON.parse(row.rollback_data || '{}'),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async getJobsByMandant(mandantId: string, limit = 50, offset = 0): Promise<ImportJob[]> {
    const query = `
      SELECT * FROM import_jobs 
      WHERE mandant_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const { rows } = await pool.query(query, [mandantId, limit, offset]);
    
    return rows.map(row => ({
      id: row.id,
      mandantId: row.mandant_id,
      userId: row.user_id,
      fileName: row.file_name,
      originalName: row.original_name,
      status: row.status,
      totalRows: row.total_rows,
      processedRows: row.processed_rows,
      successfulRows: row.successful_rows,
      failedRows: row.failed_rows,
      progress: row.progress,
      startedAt: row.created_at,
      completedAt: row.completed_at,
      errors: JSON.parse(row.errors || '[]'),
      rollbackData: JSON.parse(row.rollback_data || '{}'),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  async cancelJob(jobId: string): Promise<boolean> {
    try {
      const job = await this.queue.getJob(jobId);
      
      if (job) {
        await job.remove();
        await this.updateJobStatus(jobId, ImportJobStatus.CANCELLED);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Failed to cancel job ${jobId}:`, error.message);
      return false;
    }
  }

  async getQueueStats() {
    const waiting = await this.queue.getWaiting();
    const active = await this.queue.getActive();
    const completed = await this.queue.getCompleted();
    const failed = await this.queue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      workerStats: importWorkerManager.getStats()
    };
  }

  async shutdown(): Promise<void> {
    await this.queue.close();
    await importWorkerManager.shutdown();
    console.log('Import queue service shut down');
  }
}

export const importQueueService = new ImportQueueService();