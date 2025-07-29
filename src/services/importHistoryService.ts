import pool from '@/config/database';
import { createError } from '@/middleware/errorHandler';

interface ImportJobWithErrors {
  id: string;
  filename: string;
  status: string;
  total_rows: number;
  processed_rows: number;
  success_count: number;
  error_count: number;
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
  created_by_name?: string;
  errors: Array<{
    row: number;
    anlagencode?: string;
    anlagenname?: string;
    error: string;
    data?: any;
  }>;
}

export class ImportHistoryService {
  static async getImportJobs(
    mandantId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{
    jobs: ImportJobWithErrors[];
    total: number;
  }> {
    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM import_jobs WHERE mandant_id = $1`,
      [mandantId]
    );
    const total = parseInt(countResult.rows[0].count);

    // Get jobs with user info
    const jobsResult = await pool.query(`
      SELECT 
        j.id,
        j.original_name as filename,
        j.status,
        j.total_rows,
        j.processed_rows,
        j.successful_rows as success_count,
        j.failed_rows as error_count,
        j.created_at,
        j.updated_at,
        j.completed_at,
        j.errors,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name
      FROM import_jobs j
      LEFT JOIN users u ON j.user_id = u.id
      WHERE j.mandant_id = $1
      ORDER BY j.created_at DESC
      LIMIT $2 OFFSET $3
    `, [mandantId, limit, offset]);

    // Transform jobs with errors from JSONB
    const jobsWithErrors: ImportJobWithErrors[] = jobsResult.rows.map(job => ({
      ...job,
      errors: (job.errors || []).map((e: any) => ({
        row: e.row,
        anlagencode: e.data?.anlagencode,
        anlagenname: e.data?.anlagenname,
        error: e.error,
        data: e.data
      }))
    }));

    return {
      jobs: jobsWithErrors,
      total
    };
  }

  static async getImportJob(
    jobId: string,
    mandantId: string
  ): Promise<ImportJobWithErrors> {
    // Get job with user info
    const jobResult = await pool.query(`
      SELECT 
        j.id,
        j.original_name as filename,
        j.status,
        j.total_rows,
        j.processed_rows,
        j.successful_rows as success_count,
        j.failed_rows as error_count,
        j.created_at,
        j.updated_at,
        j.completed_at,
        j.errors,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name
      FROM import_jobs j
      LEFT JOIN users u ON j.user_id = u.id
      WHERE j.id = $1 AND j.mandant_id = $2
    `, [jobId, mandantId]);

    if (jobResult.rows.length === 0) {
      throw createError('Import job not found', 404);
    }

    const job = jobResult.rows[0];

    return {
      ...job,
      errors: (job.errors || []).map((e: any) => ({
        row: e.row,
        anlagencode: e.data?.anlagencode,
        anlagenname: e.data?.anlagenname,
        error: e.error,
        data: e.data
      }))
    };
  }

  static async generateErrorReportExcel(
    jobId: string,
    mandantId: string
  ): Promise<Buffer> {
    const job = await this.getImportJob(jobId, mandantId);
    
    if (job.errors.length === 0) {
      throw createError('No errors found for this import job', 404);
    }

    // Import ExcelJS dynamically
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Import-Fehler');

    // Define columns
    worksheet.columns = [
      { header: 'Zeile', key: 'row', width: 10 },
      { header: 'T-Nummer', key: 'anlagencode', width: 20 },
      { header: 'Anlagenname', key: 'anlagenname', width: 30 },
      { header: 'Fehlermeldung', key: 'error', width: 50 },
      { header: 'Liegenschaft', key: 'liegenschaft', width: 25 },
      { header: 'Gebäude', key: 'gebaeude', width: 25 },
      { header: 'AKS-Code', key: 'aks', width: 15 }
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data rows
    job.errors.forEach(error => {
      worksheet.addRow({
        row: error.row,
        anlagencode: error.anlagencode || '',
        anlagenname: error.anlagenname || '',
        error: error.error,
        liegenschaft: error.data?.liegenschaft || '',
        gebaeude: error.data?.gebaeude || '',
        aks: error.data?.aks || ''
      });
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as Buffer;
  }
}