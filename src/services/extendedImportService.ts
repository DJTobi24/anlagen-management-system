import ExcelJS from 'exceljs';
import pool from '@/config/database';
import { v4 as uuidv4 } from 'uuid';
import { createError } from '@/middleware/errorHandler';

interface AnlagenImportRow {
  vertrag?: string;
  anlagencode: string; // T-Nummer
  anlagenTag?: string; // FM-Nummer/QR-Code
  anlagenname: string;
  suchbegriff?: string;
  suchbegriff1?: string;
  liegenschaft: string;
  gebaeude: string;
  aks: string;
  aksName?: string;
  kdWirtschaftseinheit?: string;
  anzahl?: number;
  einheit?: string;
  pruefpflichtig?: boolean;
  archiviert?: boolean;
  vertragspositionenBeschreibung?: string;
  kundeAnsprechpartner?: string;
  attributsatz?: string;
  code?: string;
  aksCobaId?: string;
  aksDlAlt?: string;
}

export class ExtendedImportService {
  static async importAnlagenFromExcel(
    buffer: Buffer,
    mandantId: string,
    userId: string,
    filename?: string
  ): Promise<{
    success: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
    createdLiegenschaften: number;
    createdGebaeude: number;
    jobId: string;
  }> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw createError('No worksheet found in Excel file', 400);
    }

    // Create import job record
    const jobResult = await pool.query(`
      INSERT INTO import_jobs (
        file_name, original_name, mandant_id, user_id, status, total_rows
      ) VALUES ($1, $2, $3, $4, 'processing', $5)
      RETURNING id
    `, [
      filename || 'extended-import.xlsx', 
      filename || 'extended-import.xlsx', 
      mandantId, 
      userId, 
      worksheet.rowCount - 1
    ]);
    
    const jobId = jobResult.rows[0].id;

    let success = 0;
    let failed = 0;
    let createdLiegenschaften = 0;
    let createdGebaeude = 0;
    const errors: Array<{ row: number; error: string; data?: any }> = [];
    
    // Cache for liegenschaften and gebaeude
    const liegenschaftCache = new Map<string, string>();
    const gebaeudeCache = new Map<string, string>();
    
    // Batch size for processing
    const BATCH_SIZE = 100;
    const totalRows = worksheet.rowCount - 1; // Exclude header
    
    // Process in batches
    for (let batchStart = 2; batchStart <= worksheet.rowCount; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, worksheet.rowCount);
      
      // Start transaction for each batch
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Process rows in current batch
        for (let rowNumber = batchStart; rowNumber <= batchEnd; rowNumber++) {
          const row = worksheet.getRow(rowNumber);
          
          try {
            const importData = this.parseRow(row);
            
            if (!importData.anlagencode || !importData.anlagenname || 
                !importData.liegenschaft || !importData.gebaeude || !importData.aks) {
              if (this.hasAnyData(importData)) {
                errors.push({ 
                  row: rowNumber, 
                  error: 'Pflichtfelder fehlen: Anlagencode, Name, Liegenschaft, Gebäude und AKS sind erforderlich',
                  data: importData
                });
                failed++;
              }
              continue;
            }

            // Ensure Liegenschaft exists
            let liegenschaftId = liegenschaftCache.get(importData.liegenschaft);
            if (!liegenschaftId) {
              const result = await this.ensureLiegenschaftExists(
                client, 
                importData.liegenschaft, 
                mandantId
              );
              liegenschaftId = result.id;
              if (result.created) createdLiegenschaften++;
              liegenschaftCache.set(importData.liegenschaft, liegenschaftId);
            }

            // Ensure Gebäude exists
            const gebaeudeKey = `${liegenschaftId}:${importData.gebaeude}`;
            let gebaeudeId = gebaeudeCache.get(gebaeudeKey);
            if (!gebaeudeId) {
              const result = await this.ensureGebaeudeExists(
                client, 
                importData.gebaeude, 
                liegenschaftId
              );
              gebaeudeId = result.id;
              if (result.created) createdGebaeude++;
              gebaeudeCache.set(gebaeudeKey, gebaeudeId);
            }

            // Validate AKS code exists
            const aksCheck = await client.query(
              'SELECT id FROM aks_codes WHERE code = $1 AND is_active = true',
              [importData.aks]
            );

            if (aksCheck.rows.length === 0) {
              errors.push({ 
                row: rowNumber, 
                error: `AKS-Code ${importData.aks} existiert nicht im System`,
                data: importData
              });
              failed++;
              continue;
            }

            // Create or update Anlage
            await this.createOrUpdateAnlage(client, {
              ...importData,
              objektId: gebaeudeId,
              mandantId,
              createdBy: userId
            });

            success++;
          } catch (error: any) {
            const importData = this.parseRow(row);
            errors.push({ 
              row: rowNumber, 
              error: error.message || 'Unbekannter Fehler beim Import',
              data: importData
            });
            failed++;
          }
        }

        await client.query('COMMIT');
        
        // Save errors to the import_jobs table as JSONB
        const batchErrors = errors.filter(e => e.row >= batchStart && e.row <= batchEnd);
        if (batchErrors.length > 0) {
          await pool.query(`
            UPDATE import_jobs 
            SET errors = errors || $1::jsonb
            WHERE id = $2
          `, [
            JSON.stringify(batchErrors), 
            jobId
          ]);
        }
        
        // Update job progress
        await pool.query(`
          UPDATE import_jobs 
          SET processed_rows = $1, successful_rows = $2, failed_rows = $3,
              progress = $4
          WHERE id = $5
        `, [batchEnd, success, failed, Math.round((batchEnd / (worksheet.rowCount - 1)) * 100), jobId]);
        
        // Log progress
        console.log(`Batch processed: rows ${batchStart}-${batchEnd}, success: ${success}, failed: ${failed}`);
        
      } catch (error) {
        await client.query('ROLLBACK');
        // Log batch error but continue with next batch
        console.error(`Batch ${batchStart}-${batchEnd} failed:`, error);
        
        // Add error for all rows in failed batch
        for (let rowNumber = batchStart; rowNumber <= batchEnd; rowNumber++) {
          if (!errors.some(e => e.row === rowNumber)) {
            errors.push({ 
              row: rowNumber, 
              error: 'Batch-Verarbeitung fehlgeschlagen' 
            });
            failed++;
          }
        }
      } finally {
        client.release();
      }
    }

    // Update final job status
    await pool.query(`
      UPDATE import_jobs 
      SET status = $1, processed_rows = $2, successful_rows = $3, 
          failed_rows = $4, completed_at = CURRENT_TIMESTAMP, progress = 100
      WHERE id = $5
    `, [
      failed === 0 && success > 0 ? 'completed' : 'failed', 
      worksheet.rowCount - 1, 
      success, 
      failed, 
      jobId
    ]);

    return { 
      success, 
      failed, 
      errors: errors.map(e => ({ row: e.row, error: e.error })), 
      createdLiegenschaften, 
      createdGebaeude,
      jobId
    };
  }

  private static parseRow(row: ExcelJS.Row): AnlagenImportRow {
    const getValue = (cell: ExcelJS.Cell): string => {
      const val = cell.value;
      if (val === null || val === undefined) return '';
      
      // Handle rich text objects
      if (typeof val === 'object' && val !== null) {
        if ('richText' in val && Array.isArray(val.richText)) {
          return val.richText.map((t: any) => t.text || '').join('');
        }
        
        // Handle hyperlink objects
        if ('text' in val) {
          return String(val.text);
        }
        
        // Handle formula results
        if ('result' in val) {
          return val.result !== null && val.result !== undefined ? String(val.result) : '';
        }
        
        // Handle date objects
        if (val instanceof Date) {
          return val.toISOString();
        }
        
        // For other objects, try to get a string representation
        if ('toString' in val) {
          return val.toString();
        }
      }
      
      return String(val);
    };
    
    const getNumber = (cell: ExcelJS.Cell): number | undefined => {
      const val = getValue(cell);
      if (!val) return undefined;
      const num = parseFloat(val);
      return isNaN(num) ? undefined : num;
    };
    
    return {
      vertrag: getValue(row.getCell(1)).trim(),
      anlagencode: getValue(row.getCell(2)).trim() || '',
      anlagenTag: getValue(row.getCell(3)).trim(),
      anlagenname: getValue(row.getCell(4)).trim() || '',
      suchbegriff: getValue(row.getCell(5)).trim(),
      suchbegriff1: getValue(row.getCell(6)).trim(),
      liegenschaft: getValue(row.getCell(7)).trim() || '',
      gebaeude: getValue(row.getCell(8)).trim() || '',
      aks: getValue(row.getCell(9)).trim() || '',
      aksName: getValue(row.getCell(10)).trim(),
      kdWirtschaftseinheit: getValue(row.getCell(11)).trim(),
      anzahl: getNumber(row.getCell(12)),
      einheit: getValue(row.getCell(13)).trim(),
      pruefpflichtig: this.parseBoolean(getValue(row.getCell(14))),
      archiviert: this.parseBoolean(getValue(row.getCell(15))),
      vertragspositionenBeschreibung: getValue(row.getCell(16)).trim(),
      kundeAnsprechpartner: getValue(row.getCell(17)).trim(),
      attributsatz: getValue(row.getCell(18)).trim(),
      code: getValue(row.getCell(19)).trim(),
      aksCobaId: getValue(row.getCell(20)).trim(),
      aksDlAlt: getValue(row.getCell(21)).trim()
    };
  }

  private static parseBoolean(value: string): boolean | undefined {
    if (!value) return undefined;
    const strValue = value.toLowerCase().trim();
    return strValue === 'ja' || strValue === 'yes' || strValue === 'true' || strValue === '1';
  }

  private static hasAnyData(data: AnlagenImportRow): boolean {
    return Object.values(data).some(value => value !== undefined && value !== '');
  }

  private static async ensureLiegenschaftExists(
    client: any,
    name: string,
    mandantId: string
  ): Promise<{ id: string; created: boolean }> {
    // Check if exists
    const existing = await client.query(
      'SELECT id FROM liegenschaften WHERE name = $1 AND mandant_id = $2',
      [name, mandantId]
    );

    if (existing.rows.length > 0) {
      return { id: existing.rows[0].id, created: false };
    }

    // Create new
    const id = uuidv4();
    await client.query(`
      INSERT INTO liegenschaften (id, name, address, mandant_id, is_active)
      VALUES ($1, $2, $3, $4, true)
    `, [id, name, `Adresse für ${name}`, mandantId]);

    return { id, created: true };
  }

  private static async ensureGebaeudeExists(
    client: any,
    name: string,
    liegenschaftId: string
  ): Promise<{ id: string; created: boolean }> {
    // Check if exists
    const existing = await client.query(
      'SELECT id FROM objekte WHERE name = $1 AND liegenschaft_id = $2',
      [name, liegenschaftId]
    );

    if (existing.rows.length > 0) {
      return { id: existing.rows[0].id, created: false };
    }

    // Create new
    const id = uuidv4();
    await client.query(`
      INSERT INTO objekte (id, name, liegenschaft_id, is_active)
      VALUES ($1, $2, $3, true)
    `, [id, name, liegenschaftId]);

    return { id, created: true };
  }

  private static async createOrUpdateAnlage(
    client: any,
    data: AnlagenImportRow & {
      objektId: string;
      mandantId: string;
      createdBy: string;
    }
  ): Promise<void> {
    // Check if exists by T-Nummer
    const existing = await client.query(
      'SELECT id FROM anlagen WHERE t_nummer = $1',
      [data.anlagencode]
    );

    const metadaten = {
      vertrag: data.vertrag,
      suchbegriff: data.suchbegriff,
      suchbegriff1: data.suchbegriff1,
      kd_wirtschaftseinheit: data.kdWirtschaftseinheit,
      anzahl: data.anzahl,
      einheit: data.einheit,
      vertragspositionen_beschreibung: data.vertragspositionenBeschreibung,
      kunde_ansprechpartner: data.kundeAnsprechpartner,
      attributsatz: data.attributsatz,
      code: data.code,
      aks_coba_id: data.aksCobaId,
      aks_dl_alt: data.aksDlAlt
    };

    if (existing.rows.length > 0) {
      // Update existing
      await client.query(`
        UPDATE anlagen 
        SET name = $2,
            qr_code = $3,
            aks_code = $4,
            description = $5,
            pruefpflichtig = $6,
            status = $7,
            objekt_id = $8,
            metadaten = $9,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [
        existing.rows[0].id,
        data.anlagenname,
        data.anlagenTag,
        data.aks,
        data.attributsatz,
        data.pruefpflichtig || false,
        data.archiviert ? 'inaktiv' : 'aktiv',
        data.objektId,
        JSON.stringify(metadaten)
      ]);
    } else {
      // Create new
      const id = uuidv4();
      await client.query(`
        INSERT INTO anlagen (
          id, t_nummer, name, qr_code, aks_code, 
          description, pruefpflichtig, status, objekt_id, 
          metadaten, is_active,
          zustands_bewertung
        ) VALUES (
          $1, $2, $3, $4, $5, 
          $6, $7, $8, $9, 
          $10, $11, $12
        )
      `, [
        id,
        data.anlagencode,
        data.anlagenname,
        data.anlagenTag || `QR-${data.anlagencode}`,
        data.aks,
        data.attributsatz,
        data.pruefpflichtig || false,
        data.archiviert ? 'inaktiv' : 'aktiv',
        data.objektId,
        JSON.stringify(metadaten),
        !data.archiviert,
        3 // Default Zustandsbewertung
      ]);
    }
  }
}