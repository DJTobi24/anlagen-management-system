import * as XLSX from 'xlsx';
import pool from '../config/database';
import aksFieldService from './aksFieldService';
import { AksFieldDefinition } from './aksFieldService';

interface AksImportData {
  code: string;
  name: string;
  bezeichnung?: string;
  description?: string;
  fields?: AksFieldDefinition[];
}

interface AksFieldImportData {
  aks_code: string;
  field_name: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  is_visible?: boolean;
  display_order?: number;
  unit?: string;
  default_value?: string;
  placeholder?: string;
  help_text?: string;
  min_value?: number;
  max_value?: number;
  regex_pattern?: string;
  select_options?: string[];
}

class AksImportService {
  /**
   * Parse AKS codes and fields from Excel file
   */
  async parseAksExcel(buffer: Buffer): Promise<{
    aksCodes: AksImportData[];
    fields: AksFieldImportData[];
  }> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // Parse AKS codes from first sheet
    const aksSheet = workbook.Sheets[workbook.SheetNames[0]];
    const aksData = XLSX.utils.sheet_to_json(aksSheet) as any[];
    
    const aksCodes: AksImportData[] = aksData.map(row => ({
      code: row['AKS-Code'] || row['code'] || '',
      name: row['Bezeichnung'] || row['name'] || '',
      bezeichnung: row['Bezeichnung'] || row['name'] || '',
      description: row['Beschreibung'] || row['description'] || ''
    }));

    // Parse fields from second sheet if exists
    let fields: AksFieldImportData[] = [];
    if (workbook.SheetNames.length > 1) {
      const fieldsSheet = workbook.Sheets[workbook.SheetNames[1]];
      const fieldsData = XLSX.utils.sheet_to_json(fieldsSheet) as any[];
      
      fields = fieldsData.map(row => ({
        aks_code: row['AKS-Code'] || '',
        field_name: this.sanitizeFieldName(row['Feldname'] || row['field_name'] || ''),
        field_label: row['Bezeichnung'] || row['field_label'] || '',
        field_type: this.mapFieldType(row['Feldtyp'] || row['field_type'] || 'text'),
        is_required: this.parseBoolean(row['Pflichtfeld'] || row['is_required']),
        is_visible: this.parseBoolean(row['Sichtbar'] || row['is_visible'], true),
        display_order: parseInt(row['Reihenfolge'] || row['display_order'] || '0'),
        unit: row['Einheit'] || row['unit'] || '',
        default_value: row['Standardwert'] || row['default_value'] || '',
        placeholder: row['Platzhalter'] || row['placeholder'] || '',
        help_text: row['Hilfetext'] || row['help_text'] || '',
        min_value: row['Min'] ? parseFloat(row['Min']) : undefined,
        max_value: row['Max'] ? parseFloat(row['Max']) : undefined,
        regex_pattern: row['Regex'] || row['regex_pattern'] || '',
        select_options: this.parseSelectOptions(row['Optionen'] || row['select_options'])
      }));
    }

    return { aksCodes, fields };
  }

  /**
   * Import AKS codes with their field definitions
   */
  async importAksWithFields(
    buffer: Buffer,
    mandantId: string,
    userId: string
  ): Promise<{
    success: number;
    failed: number;
    errors: string[];
    importedCodes: string[];
    importedFields: number;
  }> {
    const { aksCodes, fields } = await this.parseAksExcel(buffer);
    
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      importedCodes: [] as string[],
      importedFields: 0
    };

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Import AKS codes
      for (const aksData of aksCodes) {
        try {
          // Check if AKS code exists
          const existing = await client.query(
            'SELECT id FROM aks_codes WHERE code = $1',
            [aksData.code]
          );

          if (existing.rows.length === 0) {
            // Insert new AKS code
            await client.query(
              `INSERT INTO aks_codes (code, name, bezeichnung, created_by) 
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (code) DO UPDATE SET
                 name = EXCLUDED.name,
                 bezeichnung = EXCLUDED.bezeichnung,
                 updated_at = CURRENT_TIMESTAMP`,
              [aksData.code, aksData.name || aksData.bezeichnung, aksData.bezeichnung, userId]
            );
            results.importedCodes.push(aksData.code);
            results.success++;
          } else {
            // Update existing AKS code
            await client.query(
              `UPDATE aks_codes 
               SET name = $2, bezeichnung = $3, updated_at = CURRENT_TIMESTAMP
               WHERE code = $1`,
              [aksData.code, aksData.name || aksData.bezeichnung, aksData.bezeichnung]
            );
            results.importedCodes.push(aksData.code);
            results.success++;
          }
        } catch (error) {
          results.failed++;
          results.errors.push(`AKS ${aksData.code}: ${error.message}`);
        }
      }

      // Import field definitions
      for (const field of fields) {
        try {
          // Validate AKS code exists
          const aksExists = await client.query(
            'SELECT code FROM aks_codes WHERE code = $1',
            [field.aks_code]
          );

          if (aksExists.rows.length === 0) {
            results.errors.push(`Field ${field.field_name}: AKS code ${field.aks_code} not found`);
            continue;
          }

          // Upsert field definition
          const fieldDef: AksFieldDefinition = {
            aks_code: field.aks_code,
            field_name: field.field_name,
            field_label: field.field_label,
            field_type: field.field_type as any,
            is_required: field.is_required,
            is_visible: field.is_visible !== false,
            display_order: field.display_order || 0,
            unit: field.unit,
            default_value: field.default_value,
            placeholder: field.placeholder,
            help_text: field.help_text,
            min_value: field.min_value,
            max_value: field.max_value,
            regex_pattern: field.regex_pattern,
            select_options: field.select_options
          };

          await aksFieldService.upsertFieldDefinition(fieldDef);
          results.importedFields++;
        } catch (error) {
          results.errors.push(`Field ${field.field_name}: ${error.message}`);
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return results;
  }

  /**
   * Generate template for AKS import with fields
   */
  async generateAksImportTemplate(): Promise<Buffer> {
    const workbook = XLSX.utils.book_new();

    // Sheet 1: AKS Codes
    const aksHeaders = ['AKS-Code', 'Bezeichnung', 'Beschreibung'];
    const aksData = [
      aksHeaders,
      ['480.010', 'Lüftungsanlage RLT', 'Raumlufttechnische Anlage'],
      ['452.010', 'Kältemaschine', 'Kälteerzeugung'],
      ['411.010', 'Pumpe Heizung', 'Umwälzpumpe Heizkreis'],
      ['421.010', 'Heizkessel', 'Wärmeerzeuger']
    ];
    
    const aksSheet = XLSX.utils.aoa_to_sheet(aksData);
    XLSX.utils.book_append_sheet(workbook, aksSheet, 'AKS-Codes');

    // Sheet 2: Field Definitions
    const fieldHeaders = [
      'AKS-Code', 'Feldname', 'Bezeichnung', 'Feldtyp', 
      'Pflichtfeld', 'Sichtbar', 'Reihenfolge', 'Einheit',
      'Standardwert', 'Platzhalter', 'Hilfetext', 'Min', 'Max',
      'Regex', 'Optionen'
    ];
    
    const fieldData = [
      fieldHeaders,
      ['480.010', 'volumenstrom', 'Volumenstrom', 'unit_value', 'TRUE', 'TRUE', '1', 'm³/h', '', 'z.B. 5000', 'Nennvolumenstrom der Anlage', '0', '100000', '', ''],
      ['480.010', 'druckverlust', 'Druckverlust', 'unit_value', 'TRUE', 'TRUE', '2', 'Pa', '', 'z.B. 800', 'Gesamtdruckverlust', '0', '5000', '', ''],
      ['452.010', 'kaelteleistung', 'Kälteleistung', 'unit_value', 'TRUE', 'TRUE', '1', 'kW', '', 'z.B. 250', 'Nennkälteleistung', '0', '10000', '', ''],
      ['452.010', 'kaeltemittel', 'Kältemittel', 'select', 'TRUE', 'TRUE', '2', '', '', '', 'Art des Kältemittels', '', '', '', 'R410A|R32|R134a|R407C'],
      ['411.010', 'foerdermenge', 'Fördermenge', 'unit_value', 'TRUE', 'TRUE', '1', 'l/min', '', 'z.B. 150', 'Nenndurchfluss', '0', '5000', '', ''],
      ['411.010', 'foerderhoehe', 'Förderhöhe', 'unit_value', 'TRUE', 'TRUE', '2', 'm', '', 'z.B. 12', 'Förderhöhe', '0', '100', '', ''],
      ['421.010', 'heizleistung', 'Heizleistung', 'unit_value', 'TRUE', 'TRUE', '1', 'kW', '', 'z.B. 500', 'Nennwärmeleistung', '0', '10000', '', ''],
      ['421.010', 'brennstoff', 'Brennstoff', 'select', 'FALSE', 'TRUE', '2', '', '', '', 'Art des Brennstoffs', '', '', '', 'Gas|Öl|Pellets|Strom']
    ];
    
    const fieldSheet = XLSX.utils.aoa_to_sheet(fieldData);
    XLSX.utils.book_append_sheet(workbook, fieldSheet, 'Felder');

    // Sheet 3: Instructions
    const instructionData = [
      ['Anleitung für AKS-Import mit Felddefinitionen'],
      [''],
      ['Blatt "AKS-Codes":'],
      ['- AKS-Code: Der eindeutige AKS-Schlüssel'],
      ['- Bezeichnung: Name/Beschreibung des AKS-Codes'],
      ['- Beschreibung: Zusätzliche Beschreibung (optional)'],
      [''],
      ['Blatt "Felder":'],
      ['- AKS-Code: Zugehöriger AKS-Code'],
      ['- Feldname: Technischer Name (ohne Leerzeichen, nur a-z, 0-9, _)'],
      ['- Bezeichnung: Anzeigename des Feldes'],
      ['- Feldtyp: text, number, decimal, date, boolean, select, multiselect, unit_value'],
      ['- Pflichtfeld: TRUE oder FALSE'],
      ['- Sichtbar: TRUE oder FALSE'],
      ['- Reihenfolge: Anzeigereihenfolge (Zahl)'],
      ['- Einheit: Maßeinheit (z.B. kW, m³/h, bar)'],
      ['- Standardwert: Vorbelegung'],
      ['- Platzhalter: Platzhaltertext'],
      ['- Hilfetext: Hilfetext für Benutzer'],
      ['- Min/Max: Minimale/Maximale Werte für Zahlenfelder'],
      ['- Regex: Regulärer Ausdruck für Validierung'],
      ['- Optionen: Auswahloptionen getrennt mit | (für select/multiselect)']
    ];
    
    const instructionSheet = XLSX.utils.aoa_to_sheet(instructionData);
    XLSX.utils.book_append_sheet(workbook, instructionSheet, 'Anleitung');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return Buffer.from(buffer);
  }

  private sanitizeFieldName(name: string): string {
    return name
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  private mapFieldType(type: string): string {
    const typeMap: { [key: string]: string } = {
      'text': 'text',
      'zahl': 'number',
      'dezimal': 'decimal',
      'datum': 'date',
      'ja/nein': 'boolean',
      'auswahl': 'select',
      'mehrfachauswahl': 'multiselect',
      'wert mit einheit': 'unit_value',
      'number': 'number',
      'decimal': 'decimal',
      'date': 'date',
      'boolean': 'boolean',
      'select': 'select',
      'multiselect': 'multiselect',
      'unit_value': 'unit_value'
    };
    
    return typeMap[type.toLowerCase()] || 'text';
  }

  private parseBoolean(value: any, defaultValue: boolean = false): boolean {
    if (value === undefined || value === null || value === '') {
      return defaultValue;
    }
    
    const strValue = String(value).toLowerCase();
    return strValue === 'true' || strValue === 'ja' || strValue === '1' || strValue === 'x';
  }

  private parseSelectOptions(value: any): string[] | undefined {
    if (!value) return undefined;
    
    const strValue = String(value);
    if (strValue.includes('|')) {
      return strValue.split('|').map(opt => opt.trim()).filter(opt => opt);
    }
    
    if (strValue.includes(',')) {
      return strValue.split(',').map(opt => opt.trim()).filter(opt => opt);
    }
    
    return [strValue.trim()].filter(opt => opt);
  }
}

export default new AksImportService();