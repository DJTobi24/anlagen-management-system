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
    'aksCode', 'kasCode', 'fieldName', 'fieldType', 'dataType', 'isRequired'
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

    // Map rows to import data
    return this.mapRowsToImportData(dataRows, headers);
  }

  private static validateHeaders(headers: string[]): void {
    const headerMap: Record<string, string> = {
      'AKS-Code': 'aksCode',
      'AKS Code': 'aksCode',
      'AKS_Code': 'aksCode',
      'KAS-Code': 'kasCode',
      'KAS Code': 'kasCode',
      'KAS_Code': 'kasCode',
      'Feldname': 'fieldName',
      'Field Name': 'fieldName',
      'Field_Name': 'fieldName',
      'Anzeigename': 'displayName',
      'Display Name': 'displayName',
      'Display_Name': 'displayName',
      'Feldtyp': 'fieldType',
      'Field Type': 'fieldType',
      'Field_Type': 'fieldType',
      'Datentyp': 'dataType',
      'Data Type': 'dataType',
      'Data_Type': 'dataType',
      'Einheit': 'unit',
      'Unit': 'unit',
      'Pflichtfeld': 'isRequired',
      'Required': 'isRequired',
      'Is Required': 'isRequired',
      'Is_Required': 'isRequired'
    };

    const normalizedHeaders = headers.map(h => headerMap[h] || h);
    
    const missingColumns = this.REQUIRED_COLUMNS.filter(
      col => !normalizedHeaders.includes(col)
    );

    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }
  }

  private static mapRowsToImportData(
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
          aksCode: this.getCellValue(row, headerMap, 'aksCode'),
          aksName: this.getCellValue(row, headerMap, 'aksName'),
          kasCode: this.getCellValue(row, headerMap, 'kasCode'),
          fieldName: this.getCellValue(row, headerMap, 'fieldName'),
          displayName: this.getCellValue(row, headerMap, 'displayName'),
          fieldType: this.getCellValue(row, headerMap, 'fieldType'),
          dataType: this.getCellValue(row, headerMap, 'dataType'),
          unit: this.getCellValue(row, headerMap, 'unit'),
          isRequired: this.parseBoolean(this.getCellValue(row, headerMap, 'isRequired')),
          minValue: this.parseNumber(this.getCellValue(row, headerMap, 'minValue')),
          maxValue: this.parseNumber(this.getCellValue(row, headerMap, 'maxValue')),
          minLength: this.parseNumber(this.getCellValue(row, headerMap, 'minLength')),
          maxLength: this.parseNumber(this.getCellValue(row, headerMap, 'maxLength')),
          regex: this.getCellValue(row, headerMap, 'regex'),
          options: this.getCellValue(row, headerMap, 'options'),
          defaultValue: this.getCellValue(row, headerMap, 'defaultValue'),
          helpText: this.getCellValue(row, headerMap, 'helpText')
        };

        rows.push(importRow);
      }
    });

    return rows;
  }

  private static normalizeHeader(header: string): string {
    const headerMap: Record<string, string> = {
      'AKS-Code': 'aksCode',
      'AKS Code': 'aksCode',
      'AKS_Code': 'aksCode',
      'AKS-Name': 'aksName',
      'AKS Name': 'aksName',
      'AKS_Name': 'aksName',
      'KAS-Code': 'kasCode',
      'KAS Code': 'kasCode',
      'KAS_Code': 'kasCode',
      'Feldname': 'fieldName',
      'Field Name': 'fieldName',
      'Field_Name': 'fieldName',
      'Anzeigename': 'displayName',
      'Display Name': 'displayName',
      'Display_Name': 'displayName',
      'Feldtyp': 'fieldType',
      'Field Type': 'fieldType',
      'Field_Type': 'fieldType',
      'Datentyp': 'dataType',
      'Data Type': 'dataType',
      'Data_Type': 'dataType',
      'Einheit': 'unit',
      'Unit': 'unit',
      'Pflichtfeld': 'isRequired',
      'Required': 'isRequired',
      'Is Required': 'isRequired',
      'Is_Required': 'isRequired',
      'Min Wert': 'minValue',
      'Min Value': 'minValue',
      'Min_Value': 'minValue',
      'Max Wert': 'maxValue',
      'Max Value': 'maxValue',
      'Max_Value': 'maxValue',
      'Min Länge': 'minLength',
      'Min Length': 'minLength',
      'Min_Length': 'minLength',
      'Max Länge': 'maxLength',
      'Max Length': 'maxLength',
      'Max_Length': 'maxLength',
      'Regex': 'regex',
      'Pattern': 'regex',
      'Optionen': 'options',
      'Options': 'options',
      'Standardwert': 'defaultValue',
      'Default Value': 'defaultValue',
      'Default_Value': 'defaultValue',
      'Hilfetext': 'helpText',
      'Help Text': 'helpText',
      'Help_Text': 'helpText'
    };

    return headerMap[header] || header.toLowerCase().replace(/[\s-_]/g, '');
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
      
      if (!aksCodeData) {
        // Create new AKS code
        const firstRow = rows[0];
        aksCodeData = await AksService.createAksCode({
          code: aksCode,
          name: firstRow.aksName || aksCode,
          description: `Imported from Excel on ${new Date().toISOString()}`,
          category: this.extractCategory(aksCode)
        });
        result.createdCodes++;
      } else {
        result.updatedCodes++;
      }

      // Process fields for this AKS code
      for (const row of rows) {
        try {
          await this.processAksField(aksCodeData.id, row, result);
          result.successfulImports++;
        } catch (error) {
          result.failedImports++;
          result.errors.push({
            row: row.row,
            aksCode: row.aksCode,
            kasCode: row.kasCode,
            message: error.message
          });
        }
      }

      await client.query('COMMIT');

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private static async processAksField(
    aksCodeId: string,
    row: AksImportRow,
    result: AksImportResult
  ): Promise<void> {
    // Validate field type and data type
    const fieldType = this.mapFieldType(row.fieldType);
    const dataType = this.mapDataType(row.dataType);

    if (!fieldType) {
      throw new Error(`Invalid field type: ${row.fieldType}`);
    }

    if (!dataType) {
      throw new Error(`Invalid data type: ${row.dataType}`);
    }

    // Parse options if present
    let options = undefined;
    if (row.options && (fieldType === AksFieldType.SELECT || fieldType === AksFieldType.RADIO)) {
      options = this.parseOptions(row.options);
    }

    // Check if field exists
    const existingField = await pool.query(
      'SELECT id FROM aks_fields WHERE aks_code_id = $1 AND kas_code = $2',
      [aksCodeId, row.kasCode]
    );

    if (existingField.rows.length > 0) {
      // Update existing field
      await AksService.updateAksField(existingField.rows[0].id, {
        displayName: row.displayName || row.fieldName,
        isRequired: row.isRequired as boolean,
        minValue: row.minValue,
        maxValue: row.maxValue,
        minLength: row.minLength,
        maxLength: row.maxLength,
        regex: row.regex,
        options,
        defaultValue: row.defaultValue,
        helpText: row.helpText
      });
      result.updatedFields++;
    } else {
      // Create new field
      await AksService.createAksField(aksCodeId, {
        kasCode: row.kasCode,
        fieldName: row.fieldName,
        displayName: row.displayName || row.fieldName,
        fieldType,
        dataType,
        unit: row.unit,
        isRequired: row.isRequired as boolean,
        minValue: row.minValue,
        maxValue: row.maxValue,
        minLength: row.minLength,
        maxLength: row.maxLength,
        regex: row.regex,
        options,
        defaultValue: row.defaultValue,
        helpText: row.helpText,
        order: result.createdFields + result.updatedFields
      });
      result.createdFields++;
    }
  }

  private static mapFieldType(type: string): AksFieldType | null {
    const typeMap: Record<string, AksFieldType> = {
      'text': AksFieldType.TEXT,
      'number': AksFieldType.NUMBER,
      'zahl': AksFieldType.NUMBER,
      'date': AksFieldType.DATE,
      'datum': AksFieldType.DATE,
      'boolean': AksFieldType.BOOLEAN,
      'bool': AksFieldType.BOOLEAN,
      'ja/nein': AksFieldType.BOOLEAN,
      'select': AksFieldType.SELECT,
      'auswahl': AksFieldType.SELECT,
      'multiselect': AksFieldType.MULTISELECT,
      'mehrfachauswahl': AksFieldType.MULTISELECT,
      'textarea': AksFieldType.TEXTAREA,
      'textfeld': AksFieldType.TEXTAREA,
      'file': AksFieldType.FILE,
      'datei': AksFieldType.FILE,
      'radio': AksFieldType.RADIO,
      'checkbox': AksFieldType.CHECKBOX
    };

    return typeMap[type.toLowerCase()] || null;
  }

  private static mapDataType(type: string): AksDataType | null {
    const typeMap: Record<string, AksDataType> = {
      'string': AksDataType.STRING,
      'text': AksDataType.STRING,
      'integer': AksDataType.INTEGER,
      'int': AksDataType.INTEGER,
      'ganzzahl': AksDataType.INTEGER,
      'decimal': AksDataType.DECIMAL,
      'dezimal': AksDataType.DECIMAL,
      'float': AksDataType.DECIMAL,
      'double': AksDataType.DECIMAL,
      'date': AksDataType.DATE,
      'datum': AksDataType.DATE,
      'boolean': AksDataType.BOOLEAN,
      'bool': AksDataType.BOOLEAN,
      'json': AksDataType.JSON
    };

    return typeMap[type.toLowerCase()] || null;
  }

  private static parseOptions(optionsStr: string): any[] {
    // Try to parse as JSON first
    try {
      const parsed = JSON.parse(optionsStr);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      // Not JSON, try other formats
    }

    // Parse comma-separated values
    const options = optionsStr.split(/[,;|]/).map((opt, index) => ({
      value: opt.trim(),
      label: opt.trim(),
      order: index + 1
    }));

    return options.filter(opt => opt.value);
  }

  private static extractCategory(aksCode: string): string {
    // Extract category from AKS code pattern (e.g., AKS.03.xxx.xx.xx -> 03)
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