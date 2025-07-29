import * as XLSX from 'xlsx';
import * as ExcelJS from 'exceljs';
import { v4 as uuidv4 } from 'uuid';
import pool from '@/config/database';
import { AksService } from './aksService';
import {
  AksImportRow,
  AksImportResult,
  AksImportError,
  AksFieldType,
  AksDataType
} from '@/types/aks';
import { createError } from '@/middleware/errorHandler';

export class AksImportService {
  private static readonly REQUIRED_COLUMNS = [
    'aks_code', 'name', 'description', 'maintenance_interval_months'
  ];

  static async importAksFromExcel(filePath: string): Promise<AksImportResult> {
    const result: AksImportResult = {
      totalRows: 0,
      successfulImports: 0,
      failedImports: 0,
      createdCodes: 0,
      updatedCodes: 0,
      createdFields: 0,
      updatedFields: 0,
      errors: []
    };

    try {
      // Parse Excel file
      const rows = await this.parseAksExcel(filePath);
      result.totalRows = rows.length;

      // Group rows by AKS code
      const groupedByAksCode = this.groupRowsByAksCode(rows);

      // Process each AKS code
      for (const [aksCode, aksRows] of groupedByAksCode.entries()) {
        try {
          await this.processAksCode(aksCode, aksRows, result);
        } catch (error) {
          result.failedImports += aksRows.length;
          result.errors.push({
            row: aksRows[0].row,
            aksCode,
            message: `Failed to process AKS code: ${error.message}`
          });
        }
      }

      return result;

    } catch (error) {
      throw createError(`Failed to import AKS from Excel: ${error.message}`, 400);
    }
  }

  private static async parseAksExcel(filePath: string): Promise<AksImportRow[]> {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: '',
      raw: false
    }) as string[][];

    if (jsonData.length < 2) {
      throw new Error('Excel file must contain headers and at least one data row');
    }

    const headers = jsonData[0] as string[];
    const dataRows = jsonData.slice(1);

    // Validate headers
    this.validateHeaders(headers);

    // Map rows to AKS code import data
    return this.mapRowsToAksCodeData(dataRows, headers);
  }

  private static validateHeaders(headers: string[]): void {
    const headerMap: Record<string, string> = {
      'AKS-Code': 'aks_code',
      'AKS Code': 'aks_code',
      'AKS_Code': 'aks_code',
      'AKS': 'aks_code',
      'Name': 'name',
      'Bezeichnung': 'name',
      'Beschreibung': 'description',
      'Description': 'description',
      'Wartungsintervall': 'maintenance_interval_months',
      'Wartungsintervall (Monate)': 'maintenance_interval_months',
      'Maintenance Interval': 'maintenance_interval_months',
      'Maintenance Interval (Months)': 'maintenance_interval_months',
      'Intervall': 'maintenance_interval_months',
      'Wartungstyp': 'maintenance_type',
      'Maintenance Type': 'maintenance_type',
      'Wartungsbeschreibung': 'maintenance_description',
      'Maintenance Description': 'maintenance_description'
    };

    const normalizedHeaders = headers.map(h => headerMap[h] || h.toLowerCase().replace(/[\s-]/g, '_'));
    
    const missingColumns = this.REQUIRED_COLUMNS.filter(
      col => !normalizedHeaders.includes(col)
    );

    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }
  }

  private static mapRowsToAksCodeData(
    dataRows: string[][],
    headers: string[]
  ): AksImportRow[] {
    const rows: AksImportRow[] = [];

    // Create header mapping
    const headerMap: Record<string, number> = {};
    headers.forEach((header, index) => {
      const normalized = this.normalizeHeader(header);
      headerMap[normalized] = index;
    });

    dataRows.forEach((row, index) => {
      if (row.some(cell => cell && cell.toString().trim())) { // Skip empty rows
        const importRow: AksImportRow = {
          row: index + 2, // Excel row number
          aksCode: this.getCellValue(row, headerMap, 'aks_code'),
          aksName: this.getCellValue(row, headerMap, 'name'),
          description: this.getCellValue(row, headerMap, 'description'),
          maintenanceIntervalMonths: this.parseNumber(this.getCellValue(row, headerMap, 'maintenance_interval_months')),
          maintenanceType: this.getCellValue(row, headerMap, 'maintenance_type'),
          maintenanceDescription: this.getCellValue(row, headerMap, 'maintenance_description'),
          kasCode: '',
          fieldName: '',
          displayName: '',
          fieldType: '',
          dataType: '',
          unit: '',
          isRequired: false,
          minValue: undefined,
          maxValue: undefined,
          minLength: undefined,
          maxLength: undefined,
          regex: '',
          options: '',
          defaultValue: '',
          helpText: ''
        };

        rows.push(importRow);
      }
    });

    return rows;
  }

  private static normalizeHeader(header: string): string {
    const headerMap: Record<string, string> = {
      'AKS-Code': 'aks_code',
      'AKS Code': 'aks_code',
      'AKS_Code': 'aks_code',
      'AKS': 'aks_code',
      'Name': 'name',
      'Bezeichnung': 'name',
      'Beschreibung': 'description',
      'Description': 'description',
      'Wartungsintervall': 'maintenance_interval_months',
      'Wartungsintervall (Monate)': 'maintenance_interval_months',
      'Maintenance Interval': 'maintenance_interval_months',
      'Maintenance Interval (Months)': 'maintenance_interval_months',
      'Intervall': 'maintenance_interval_months',
      'Wartungstyp': 'maintenance_type',
      'Maintenance Type': 'maintenance_type',
      'Wartungsbeschreibung': 'maintenance_description',
      'Maintenance Description': 'maintenance_description'
    };

    return headerMap[header] || header.toLowerCase().replace(/[\s-]/g, '_');
  }

  private static getCellValue(
    row: string[],
    headerMap: Record<string, number>,
    field: string
  ): string {
    const index = headerMap[field];
    return index !== undefined && row[index] ? row[index].toString().trim() : '';
  }

  private static parseBoolean(value: string): boolean {
    const truthy = ['true', 'yes', 'ja', '1', 'x', 'pflicht', 'required'];
    return truthy.includes(value.toLowerCase());
  }

  private static parseNumber(value: string): number | undefined {
    if (!value) return undefined;
    const num = parseFloat(value);
    return isNaN(num) ? undefined : num;
  }

  private static groupRowsByAksCode(rows: AksImportRow[]): Map<string, AksImportRow[]> {
    const grouped = new Map<string, AksImportRow[]>();

    rows.forEach(row => {
      if (row.aksCode) {
        if (!grouped.has(row.aksCode)) {
          grouped.set(row.aksCode, []);
        }
        grouped.get(row.aksCode)!.push(row);
      }
    });

    return grouped;
  }

  private static async processAksCode(
    aksCode: string,
    rows: AksImportRow[],
    result: AksImportResult
  ): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if AKS code exists
      let aksCodeData = await AksService.getAksCodeByCode(aksCode);
      const firstRow = rows[0];
      
      if (!aksCodeData) {
        // Validate AKS code format
        if (!this.validateAksCodeFormat(aksCode)) {
          throw new Error(`Invalid AKS code format: ${aksCode}. Expected format: AKS.XX.XXX.XX.XX`);
        }

        // Create new AKS code
        aksCodeData = await AksService.createAksCode({
          code: aksCode,
          name: firstRow.aksName || aksCode,
          description: firstRow.description || `Imported from Excel on ${new Date().toISOString()}`,
          category: this.extractCategory(aksCode),
          maintenance_interval_months: firstRow.maintenanceIntervalMonths,
          maintenance_type: firstRow.maintenanceType || 'standard',
          maintenance_description: firstRow.maintenanceDescription
        });
        result.createdCodes++;
        result.successfulImports++;
      } else {
        // Update existing AKS code with maintenance data
        await AksService.updateAksCode(aksCodeData.id, {
          name: firstRow.aksName || aksCodeData.name,
          description: firstRow.description || aksCodeData.description,
          maintenance_interval_months: firstRow.maintenanceIntervalMonths,
          maintenance_type: firstRow.maintenanceType || 'standard',
          maintenance_description: firstRow.maintenanceDescription
        });
        result.updatedCodes++;
        result.successfulImports++;
      }

      await client.query('COMMIT');

    } catch (error) {
      await client.query('ROLLBACK');
      result.failedImports++;
      result.errors.push({
        row: rows[0].row,
        aksCode,
        message: error.message
      });
    } finally {
      client.release();
    }
  }

  private static validateAksCodeFormat(aksCode: string): boolean {
    // Check if AKS code matches hierarchical pattern:
    // Level 1: AKS.XX (e.g., AKS.01)
    // Level 2: AKS.XX.XXX (e.g., AKS.01.002)
    // Level 3: AKS.XX.XXX.XX (e.g., AKS.01.002.01)
    // Level 4: AKS.XX.XXX.XX.XX (e.g., AKS.01.002.01.01)
    return /^AKS\.(\d{2}|\d{2}\.\d{3}|\d{2}\.\d{3}\.\d{2}|\d{2}\.\d{3}\.\d{2}\.\d{2})$/.test(aksCode);
  }

  private static parseNumericValue(value: string | number | undefined): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (typeof value === 'number') {
      return value;
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? undefined : parsed;
  }


  private static extractCategory(aksCode: string): string {
    // Extract category from AKS code pattern (e.g., AKS.03 -> 03, AKS.03.330.01 -> 03)
    const parts = aksCode.split('.');
    if (parts.length >= 2) {
      const categoryMap: Record<string, string> = {
        '01': 'Gebäude',
        '02': 'HLK',
        '03': 'Sanitär',
        '04': 'Gas/Medizin',
        '05': 'Elektro',
        '06': 'Sicherheit',
        '07': 'Transport',
        '08': 'Außenanlagen',
        '09': 'Sonstiges'
      };
      return categoryMap[parts[1]] || 'Sonstiges';
    }
    return 'Sonstiges';
  }

  static async generateImportTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('AKS Import Template');

    // Header
    worksheet.columns = [
      { header: 'AKS-Code', key: 'aks_code', width: 25 },
      { header: 'Name', key: 'name', width: 40 },
      { header: 'Beschreibung', key: 'description', width: 50 },
      { header: 'Wartungsintervall (Monate)', key: 'maintenance_interval_months', width: 25 },
      { header: 'Wartungstyp', key: 'maintenance_type', width: 20 },
      { header: 'Wartungsbeschreibung', key: 'maintenance_description', width: 50 }
    ];

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Add sample data
    worksheet.addRow({
      aks_code: 'AKS.03.470.07.03',
      name: 'Enthärtungsanlage',
      description: 'Wasserenthärtung für Gebäudetechnik',
      maintenance_interval_months: 12,
      maintenance_type: 'jährlich',
      maintenance_description: 'Jährliche Wartung und Funktionskontrolle'
    });
    
    worksheet.addRow({
      aks_code: 'AKS.02.310.01.01',
      name: 'Lüftungsanlage',
      description: 'Raumlufttechnische Anlage',
      maintenance_interval_months: 6,
      maintenance_type: 'halbjährlich',
      maintenance_description: 'Halbjährliche Filter- und Funktionskontrolle'
    });

    // Add instructions worksheet
    const instructionsSheet = workbook.addWorksheet('Anweisungen');
    instructionsSheet.columns = [
      { header: 'Spalte', key: 'column', width: 30 },
      { header: 'Beschreibung', key: 'description', width: 60 },
      { header: 'Beispiel', key: 'example', width: 30 }
    ];

    // Style instructions header
    instructionsSheet.getRow(1).font = { bold: true };
    instructionsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' }
    };
    instructionsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Add instructions
    const instructions = [
      {
        column: 'AKS-Code',
        description: 'Eindeutiger AKS-Code im Format AKS.XX.XXX.XX.XX',
        example: 'AKS.03.470.07.03'
      },
      {
        column: 'Name',
        description: 'Kurzer Name der Anlage oder des Systems',
        example: 'Enthärtungsanlage'
      },
      {
        column: 'Beschreibung',
        description: 'Detaillierte Beschreibung der Anlage (optional)',
        example: 'Wasserenthärtung für Gebäudetechnik'
      },
      {
        column: 'Wartungsintervall (Monate)',
        description: 'Wartungsintervall in Monaten (1-120)',
        example: '12'
      },
      {
        column: 'Wartungstyp',
        description: 'Art der Wartung (optional)',
        example: 'jährlich, halbjährlich, monatlich'
      },
      {
        column: 'Wartungsbeschreibung',
        description: 'Beschreibung der durchzuführenden Wartung (optional)',
        example: 'Jährliche Wartung und Funktionskontrolle'
      }
    ];

    instructions.forEach(instruction => {
      instructionsSheet.addRow(instruction);
    });

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  static async generateAksErrorReport(errors: AksImportError[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('AKS Import Errors');

    // Header
    worksheet.columns = [
      { header: 'Row', key: 'row', width: 10 },
      { header: 'AKS Code', key: 'aksCode', width: 20 },
      { header: 'KAS Code', key: 'kasCode', width: 20 },
      { header: 'Error Message', key: 'message', width: 50 },
      { header: 'Data', key: 'data', width: 30 }
    ];

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add error data
    errors.forEach(error => {
      worksheet.addRow({
        row: error.row,
        aksCode: error.aksCode || '',
        kasCode: error.kasCode || '',
        message: error.message,
        data: error.data ? JSON.stringify(error.data) : ''
      });
    });

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }
}