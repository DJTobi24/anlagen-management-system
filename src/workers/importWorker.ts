import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { ImportJobData, ImportRow, ProcessedRow, WorkerMessage } from '@/types/import';
import { ExcelParser } from '@/services/excelParser';
import pool from '@/config/database';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';

interface WorkerData extends ImportJobData {
  startIndex: number;
  endIndex: number;
  rows: ImportRow[];
}

class ImportWorkerProcessor {
  private jobId: string;
  private mandantId: string;
  private userId: string;
  private rows: ImportRow[];
  private processedCount = 0;

  constructor(data: WorkerData) {
    this.jobId = data.jobId;
    this.mandantId = data.mandantId;
    this.userId = data.userId;
    this.rows = data.rows;
  }

  async processRows(): Promise<ProcessedRow[]> {
    const results: ProcessedRow[] = [];
    
    for (const row of this.rows) {
      try {
        const processedRow = await this.processRow(row);
        results.push(processedRow);
        
        this.processedCount++;
        
        // Send progress update every 10 processed rows
        if (this.processedCount % 10 === 0) {
          this.sendProgress();
        }
        
      } catch (error) {
        results.push({
          ...row,
          success: false,
          error: error.message || 'Unknown error occurred'
        });
        this.processedCount++;
      }
    }

    return results;
  }

  private async processRow(row: ImportRow): Promise<ProcessedRow> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Find or create Liegenschaft
      const liegenschaftId = await this.findOrCreateLiegenschaft(
        client,
        row.liegenschaftName,
        this.mandantId
      );

      // 2. Find or create Objekt
      const objektId = await this.findOrCreateObjekt(
        client,
        row.objektName,
        liegenschaftId,
        row.floor,
        row.room
      );

      // 3. Check for existing Anlage by T-Nummer (duplicate check)
      if (row.tNummer) {
        const existingAnlage = await this.findAnlageByTNummer(client, row.tNummer, this.mandantId);
        if (existingAnlage) {
          await client.query('ROLLBACK');
          return {
            ...row,
            success: false,
            error: `Anlage with T-Nummer ${row.tNummer} already exists`,
            objektId
          };
        }
      }

      // 4. Create Anlage
      const anlageId = await this.createAnlage(client, row, objektId);

      await client.query('COMMIT');

      return {
        ...row,
        success: true,
        anlageId,
        objektId
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async findOrCreateLiegenschaft(
    client: any,
    name: string,
    mandantId: string
  ): Promise<string> {
    // Check if exists
    const existingQuery = `
      SELECT id FROM liegenschaften 
      WHERE name = $1 AND mandant_id = $2 AND is_active = true
    `;
    const existingResult = await client.query(existingQuery, [name, mandantId]);
    
    if (existingResult.rows.length > 0) {
      return existingResult.rows[0].id;
    }

    // Create new
    const createQuery = `
      INSERT INTO liegenschaften (id, mandant_id, name, address, is_active)
      VALUES ($1, $2, $3, $4, true)
      RETURNING id
    `;
    const liegenschaftId = uuidv4();
    await client.query(createQuery, [
      liegenschaftId,
      mandantId,
      name,
      `Auto-created for import ${this.jobId}`
    ]);

    return liegenschaftId;
  }

  private async findOrCreateObjekt(
    client: any,
    name: string,
    liegenschaftId: string,
    floor?: string,
    room?: string
  ): Promise<string> {
    // Check if exists
    const existingQuery = `
      SELECT id FROM objekte 
      WHERE name = $1 AND liegenschaft_id = $2 AND is_active = true
    `;
    const existingResult = await client.query(existingQuery, [name, liegenschaftId]);
    
    if (existingResult.rows.length > 0) {
      return existingResult.rows[0].id;
    }

    // Create new
    const createQuery = `
      INSERT INTO objekte (id, liegenschaft_id, name, floor, room, is_active)
      VALUES ($1, $2, $3, $4, $5, true)
      RETURNING id
    `;
    const objektId = uuidv4();
    await client.query(createQuery, [
      objektId,
      liegenschaftId,
      name,
      floor || null,
      room || null
    ]);

    return objektId;
  }

  private async findAnlageByTNummer(
    client: any,
    tNummer: string,
    mandantId: string
  ): Promise<any> {
    const query = `
      SELECT a.id
      FROM anlagen a
      JOIN objekte o ON a.objekt_id = o.id
      JOIN liegenschaften l ON o.liegenschaft_id = l.id
      WHERE a.t_nummer = $1 AND l.mandant_id = $2 AND a.is_active = true
    `;
    const result = await client.query(query, [tNummer, mandantId]);
    return result.rows[0] || null;
  }

  private async createAnlage(
    client: any,
    row: ImportRow,
    objektId: string
  ): Promise<string> {
    const anlageId = uuidv4();
    const qrCodeData = `ANLAGE:${anlageId}`;
    const qrCode = await QRCode.toDataURL(qrCodeData);

    const query = `
      INSERT INTO anlagen (
        id, objekt_id, t_nummer, aks_code, qr_code, name, description,
        status, zustands_bewertung, dynamic_fields, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
      RETURNING id
    `;

    await client.query(query, [
      anlageId,
      objektId,
      row.tNummer || null,
      row.aksCode,
      qrCode,
      row.name,
      row.description || null,
      row.status,
      row.zustandsBewertung,
      JSON.stringify(row.dynamicFields)
    ]);

    return anlageId;
  }

  private sendProgress() {
    if (parentPort) {
      const message: WorkerMessage = {
        type: 'progress',
        jobId: this.jobId,
        data: {
          processed: this.processedCount,
          total: this.rows.length
        }
      };
      parentPort.postMessage(message);
    }
  }
}

// Worker thread execution
if (!isMainThread && parentPort) {
  const processor = new ImportWorkerProcessor(workerData as WorkerData);
  
  processor.processRows()
    .then(results => {
      const message: WorkerMessage = {
        type: 'complete',
        jobId: workerData.jobId,
        data: results
      };
      parentPort!.postMessage(message);
    })
    .catch(error => {
      const message: WorkerMessage = {
        type: 'error',
        jobId: workerData.jobId,
        data: { error: error.message }
      };
      parentPort!.postMessage(message);
    });
}

export default ImportWorkerProcessor;