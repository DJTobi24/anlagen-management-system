import * as XLSX from 'xlsx';
import * as ExcelJS from 'exceljs';
import { ImportRow, ExcelColumnMapping, ImportError, ImportValidationResult } from '@/types/import';
import { AnlageStatus } from '@/types';

export class ExcelParser {
  private static readonly MAX_ROWS = 5000;
  private static readonly REQUIRED_COLUMNS = ['aksCode', 'name', 'objektName', 'liegenschaftName'];

  static async parseExcelFile(filePath: string, columnMapping: ExcelColumnMapping): Promise<ImportRow[]> {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '',
        raw: false
      }) as string[][];

      if (jsonData.length === 0) {
        throw new Error('Excel file is empty');
      }

      if (jsonData.length > this.MAX_ROWS + 1) { // +1 for header
        throw new Error(`Excel file contains ${jsonData.length - 1} rows. Maximum allowed is ${this.MAX_ROWS}`);
      }

      const headers = jsonData[0] as string[];
      const dataRows = jsonData.slice(1);

      return this.mapRowsToImportData(dataRows, headers, columnMapping);
    } catch (error) {
      throw new Error(`Failed to parse Excel file: ${error.message}`);
    }
  }

  static async validateExcelStructure(filePath: string, columnMapping: ExcelColumnMapping): Promise<ImportValidationResult> {
    const errors: ImportError[] = [];
    const warnings: ImportError[] = [];

    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '',
        raw: false
      }) as string[][];

      if (jsonData.length === 0) {
        errors.push({ row: 0, message: 'Excel file is empty' });
        return { isValid: false, errors, warnings, totalRows: 0 };
      }

      const headers = jsonData[0] as string[];
      const dataRows = jsonData.slice(1);
      const totalRows = dataRows.length;

      if (totalRows > this.MAX_ROWS) {
        errors.push({ 
          row: 0, 
          message: `Too many rows: ${totalRows}. Maximum allowed is ${this.MAX_ROWS}` 
        });
      }

      // Validate required columns exist
      const missingColumns = this.validateColumnMapping(headers, columnMapping);
      if (missingColumns.length > 0) {
        errors.push({
          row: 0,
          message: `Missing required columns: ${missingColumns.join(', ')}`
        });
      }

      // Validate data in rows (sample first 100 rows for performance)
      const sampleSize = Math.min(100, totalRows);
      for (let i = 0; i < sampleSize; i++) {
        const rowErrors = this.validateRow(dataRows[i], headers, columnMapping, i + 2); // +2 for Excel row number
        errors.push(...rowErrors);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        totalRows
      };

    } catch (error) {
      errors.push({ row: 0, message: `Failed to validate Excel file: ${error.message}` });
      return { isValid: false, errors, warnings, totalRows: 0 };
    }
  }

  static async generateErrorReport(errors: ImportError[], originalFileName: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Import Errors');

    // Header
    worksheet.columns = [
      { header: 'Row', key: 'row', width: 10 },
      { header: 'Field', key: 'field', width: 20 },
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
        field: error.field || '',
        message: error.message,
        data: error.data ? JSON.stringify(error.data) : ''
      });
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      if (column.key && column.key !== 'data') {
        column.width = Math.max(column.width || 10, 15);
      }
    });

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  private static mapRowsToImportData(
    dataRows: string[][],
    headers: string[],
    columnMapping: ExcelColumnMapping
  ): ImportRow[] {
    return dataRows.map((row, index) => {
      const rowData: any = {};
      
      headers.forEach((header, colIndex) => {
        const value = row[colIndex] || '';
        rowData[header] = value.toString().trim();
      });

      const dynamicFields: Record<string, any> = {};
      
      // Extract mapped fields and put others in dynamicFields
      Object.keys(rowData).forEach(key => {
        if (!Object.values(columnMapping).includes(key)) {
          dynamicFields[key] = rowData[key];
        }
      });

      return {
        row: index + 2, // Excel row number (starts from 2 after header)
        tNummer: rowData[columnMapping.tNummer] || null,
        aksCode: rowData[columnMapping.aksCode] || '',
        name: rowData[columnMapping.name] || '',
        description: rowData[columnMapping.description] || '',
        status: this.mapStatus(rowData[columnMapping.status] || 'aktiv'),
        zustandsBewertung: this.parseZustandsBewertung(rowData[columnMapping.zustandsBewertung]),
        objektName: rowData[columnMapping.objektName] || '',
        liegenschaftName: rowData[columnMapping.liegenschaftName] || '',
        floor: rowData[columnMapping.floor] || '',
        room: rowData[columnMapping.room] || '',
        dynamicFields
      };
    });
  }

  private static validateColumnMapping(headers: string[], columnMapping: ExcelColumnMapping): string[] {
    const missingColumns: string[] = [];
    
    this.REQUIRED_COLUMNS.forEach(requiredField => {
      const mappedColumn = columnMapping[requiredField];
      if (!mappedColumn || !headers.includes(mappedColumn)) {
        missingColumns.push(mappedColumn || requiredField);
      }
    });

    return missingColumns;
  }

  private static validateRow(
    row: string[],
    headers: string[],
    columnMapping: ExcelColumnMapping,
    rowNumber: number
  ): ImportError[] {
    const errors: ImportError[] = [];
    const rowData: any = {};
    
    headers.forEach((header, colIndex) => {
      rowData[header] = (row[colIndex] || '').toString().trim();
    });

    // Validate required fields
    if (!rowData[columnMapping.aksCode]) {
      errors.push({
        row: rowNumber,
        field: 'aksCode',
        message: 'AKS-Code is required'
      });
    }

    if (!rowData[columnMapping.name]) {
      errors.push({
        row: rowNumber,
        field: 'name',
        message: 'Name is required'
      });
    }

    if (!rowData[columnMapping.objektName]) {
      errors.push({
        row: rowNumber,
        field: 'objektName',
        message: 'Objekt name is required'
      });
    }

    if (!rowData[columnMapping.liegenschaftName]) {
      errors.push({
        row: rowNumber,
        field: 'liegenschaftName',
        message: 'Liegenschaft name is required'
      });
    }

    // Validate Zustandsbewertung
    const zustandsBewertung = this.parseZustandsBewertung(rowData[columnMapping.zustandsBewertung]);
    if (zustandsBewertung < 1 || zustandsBewertung > 5) {
      errors.push({
        row: rowNumber,
        field: 'zustandsBewertung',
        message: 'Zustandsbewertung must be between 1 and 5'
      });
    }

    // Validate Status
    const status = this.mapStatus(rowData[columnMapping.status]);
    if (!Object.values(AnlageStatus).includes(status as AnlageStatus)) {
      errors.push({
        row: rowNumber,
        field: 'status',
        message: `Invalid status: ${status}. Must be one of: ${Object.values(AnlageStatus).join(', ')}`
      });
    }

    return errors;
  }

  private static parseZustandsBewertung(value: string): number {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? 1 : Math.max(1, Math.min(5, parsed));
  }

  private static mapStatus(value: string): string {
    const statusMap: Record<string, string> = {
      'aktiv': 'aktiv',
      'active': 'aktiv',
      'inaktiv': 'inaktiv',
      'inactive': 'inaktiv',
      'wartung': 'wartung',
      'maintenance': 'wartung',
      'defekt': 'defekt',
      'defective': 'defekt',
      'broken': 'defekt'
    };

    const normalizedValue = value.toLowerCase().trim();
    return statusMap[normalizedValue] || 'aktiv';
  }
}