import ExcelJS from 'exceljs';
import pool from '@/config/database';
import { v4 as uuidv4 } from 'uuid';
import { createError } from '@/middleware/errorHandler';

interface AksImportRow {
  code: string;
  name: string;
  description?: string;
  maintenance_interval_months?: number;
}

export class AksExcelImportService {
  static async importFromExcel(buffer: Buffer): Promise<{
    success: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
  }> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw createError('No worksheet found in Excel file', 400);
    }

    let success = 0;
    let failed = 0;
    const errors: Array<{ row: number; error: string }> = [];

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Process rows (skip header)
      for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);
        
        const aksCode = row.getCell(1).value?.toString().trim();
        const name = row.getCell(2).value?.toString().trim();
        const description = row.getCell(3).value?.toString().trim();
        const maintenanceInterval = row.getCell(4).value ? 
          parseInt(row.getCell(4).value.toString()) : null;

        if (!aksCode || !name) {
          if (aksCode || name) { // Only count as error if partial data
            errors.push({ 
              row: rowNumber, 
              error: 'AKS-Code und Name sind Pflichtfelder' 
            });
            failed++;
          }
          continue;
        }

        // Validate AKS code format
        if (!this.validateAksCode(aksCode)) {
          errors.push({ 
            row: rowNumber, 
            error: `Ungültiges AKS-Format: ${aksCode}. Erwartet: AKS.XX oder AKS.XX.XXX.XX.XX` 
          });
          failed++;
          continue;
        }

        try {
          await this.insertAksCode(client, {
            code: aksCode,
            name,
            description,
            maintenance_interval_months: maintenanceInterval
          });
          success++;
        } catch (error: any) {
          errors.push({ 
            row: rowNumber, 
            error: error.message || 'Unbekannter Fehler beim Import' 
          });
          failed++;
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return { success, failed, errors };
  }

  static validateAksCode(code: string): boolean {
    // Format: AKS.XX or AKS.XX.XXX or AKS.XX.XXX.XX or AKS.XX.XXX.XX.XX
    const pattern = /^AKS\.(\d{2}|\d{2}\.\d{3}|\d{2}\.\d{3}\.\d{2}|\d{2}\.\d{3}\.\d{2}\.\d{2})$/;
    return pattern.test(code);
  }

  private static async insertAksCode(
    client: any, 
    data: AksImportRow
  ): Promise<void> {
    const { code, name, description, maintenance_interval_months } = data;

    // Check if code already exists
    const existing = await client.query(
      'SELECT id FROM aks_codes WHERE code = $1',
      [code]
    );

    if (existing.rows.length > 0) {
      // Update existing
      await client.query(`
        UPDATE aks_codes 
        SET name = $2, 
            description = $3, 
            maintenance_interval_months = $4,
            updated_at = CURRENT_TIMESTAMP
        WHERE code = $1
      `, [code, name, description, maintenance_interval_months]);
    } else {
      // Insert new
      const id = uuidv4();
      await client.query(`
        INSERT INTO aks_codes (
          id, code, name, description, 
          level, parent_code, is_category, sort_order,
          maintenance_interval_months, is_active
        )
        VALUES (
          $1, $2, $3, $4,
          calculate_aks_level($2), get_parent_aks_code($2), 
          CASE WHEN calculate_aks_level($2) < 4 THEN true ELSE false END,
          0, $5, true
        )
      `, [id, code, name, description, maintenance_interval_months]);
    }
  }

  static async generateTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('AKS-Import');

    // Add headers
    worksheet.columns = [
      { header: 'AKS-Code', key: 'code', width: 20 },
      { header: 'Name', key: 'name', width: 40 },
      { header: 'Beschreibung', key: 'description', width: 50 },
      { header: 'Wartungsintervall (Monate)', key: 'maintenance_interval', width: 25 }
    ];

    // Style headers
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add example data
    worksheet.addRow({
      code: 'AKS.01',
      name: 'Gebäudeleittechnik',
      description: 'Gebäudeleittechnik und Automation',
      maintenance_interval: null
    });

    worksheet.addRow({
      code: 'AKS.01.001',
      name: 'Zentrale Leittechnik',
      description: 'Zentrale Gebäudeleittechnik',
      maintenance_interval: null
    });

    worksheet.addRow({
      code: 'AKS.01.001.01',
      name: 'Leitzentrale',
      description: 'Gebäudeleitzentrale',
      maintenance_interval: null
    });

    worksheet.addRow({
      code: 'AKS.01.001.01.01',
      name: 'Leitrechner',
      description: 'Zentraler Leitrechner',
      maintenance_interval: 12
    });

    // Add borders
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}