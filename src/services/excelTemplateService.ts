import ExcelJS from 'exceljs';
import pool from '../config/database';
import aksFieldService from './aksFieldService';

interface TemplateColumn {
  header: string;
  key: string;
  width: number;
  style?: any;
  validation?: any;
  comment?: string;
}

export class ExcelTemplateService {
  /**
   * Generate Excel template with AKS-specific fields
   */
  static async generateTemplateWithAksFields(mandantId: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    
    // Main data sheet
    const dataSheet = workbook.addWorksheet('Anlagen Import', {
      properties: { tabColor: { argb: 'FF00FF00' } }
    });
    
    // Reference sheets
    const aksSheet = workbook.addWorksheet('AKS Codes', {
      properties: { tabColor: { argb: 'FFFFFF00' } }
    });
    
    const fieldsSheet = workbook.addWorksheet('AKS Felder', {
      properties: { tabColor: { argb: 'FFFF00FF' } }
    });
    
    const instructionSheet = workbook.addWorksheet('Anleitung', {
      properties: { tabColor: { argb: 'FF0000FF' } }
    });
    
    // Setup main data sheet
    await this.setupDataSheet(dataSheet, mandantId);
    
    // Setup AKS reference sheet
    await this.setupAksSheet(aksSheet);
    
    // Setup fields reference sheet
    await this.setupFieldsSheet(fieldsSheet);
    
    // Setup instruction sheet
    this.setupInstructionSheet(instructionSheet);
    
    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
  
  private static async setupDataSheet(sheet: ExcelJS.Worksheet, mandantId: string) {
    // Define base columns
    const baseColumns: TemplateColumn[] = [
      { header: 'Liegenschaft*', key: 'liegenschaft', width: 20 },
      { header: 'Objekt*', key: 'objekt', width: 20 },
      { header: 'AKS-Code*', key: 'aks_code', width: 15 },
      { header: 'T-Nummer*', key: 't_nummer', width: 15 },
      { header: 'Bezeichnung*', key: 'bezeichnung', width: 30 },
      { header: 'Beschreibung', key: 'beschreibung', width: 40 },
      { header: 'Etage', key: 'etage', width: 10 },
      { header: 'Raum', key: 'raum', width: 15 },
      { header: 'Anzahl', key: 'anzahl', width: 10 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Zustandsbewertung', key: 'zustandsbewertung', width: 18 },
      { header: 'Hersteller', key: 'hersteller', width: 20 },
      { header: 'Typ', key: 'typ', width: 20 },
      { header: 'Seriennummer', key: 'seriennummer', width: 20 },
      { header: 'Baujahr', key: 'baujahr', width: 10 },
      { header: 'QR-Code', key: 'qr_code', width: 20 }
    ];
    
    // Get all unique AKS codes and their fields
    const aksFieldsQuery = `
      SELECT DISTINCT 
        afd.aks_code,
        afd.field_name,
        afd.field_label,
        afd.field_type,
        afd.is_required,
        afd.unit,
        afd.help_text,
        afd.select_options
      FROM aks_field_definitions afd
      WHERE afd.is_visible = true
      ORDER BY afd.aks_code, afd.display_order
    `;
    
    const aksFieldsResult = await pool.query(aksFieldsQuery);
    const aksFieldsByCode: {[key: string]: any[]} = {};
    
    // Group fields by AKS code
    for (const field of aksFieldsResult.rows) {
      if (!aksFieldsByCode[field.aks_code]) {
        aksFieldsByCode[field.aks_code] = [];
      }
      aksFieldsByCode[field.aks_code].push(field);
    }
    
    // Add dynamic columns for each unique field across all AKS codes
    const dynamicColumns: TemplateColumn[] = [];
    const addedFields = new Set<string>();
    
    for (const aksCode in aksFieldsByCode) {
      for (const field of aksFieldsByCode[aksCode]) {
        const columnKey = `aks_${field.field_name}`;
        if (!addedFields.has(columnKey)) {
          addedFields.add(columnKey);
          
          let header = field.field_label;
          if (field.is_required) {
            header += '*';
          }
          if (field.unit) {
            header += ` (${field.unit})`;
          }
          
          dynamicColumns.push({
            header,
            key: columnKey,
            width: 20,
            comment: field.help_text || `Feld für AKS-Code: ${aksCode}`
          });
        }
      }
    }
    
    // Combine all columns
    const allColumns = [...baseColumns, ...dynamicColumns];
    
    // Set columns
    sheet.columns = allColumns.map(col => ({
      header: col.header,
      key: col.key,
      width: col.width
    }));
    
    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;
    
    // Add filters
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: allColumns.length }
    };
    
    // Add data validation
    await this.addDataValidation(sheet, mandantId);
    
    // Add comments to columns
    allColumns.forEach((col, index) => {
      if (col.comment) {
        const cell = sheet.getCell(1, index + 1);
        cell.note = col.comment;
      }
    });
    
    // Freeze header row
    sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
    
    // Add sample data rows
    await this.addSampleData(sheet, aksFieldsByCode);
  }
  
  private static async setupAksSheet(sheet: ExcelJS.Worksheet) {
    // Query AKS codes
    const query = `
      SELECT code, bezeichnung, ebene, ist_kategorie 
      FROM aks_codes 
      ORDER BY code
    `;
    const result = await pool.query(query);
    
    // Setup columns
    sheet.columns = [
      { header: 'AKS-Code', key: 'code', width: 15 },
      { header: 'Bezeichnung', key: 'bezeichnung', width: 50 },
      { header: 'Ebene', key: 'ebene', width: 10 },
      { header: 'Kategorie', key: 'ist_kategorie', width: 12 }
    ];
    
    // Style header
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFCC00' }
    };
    
    // Add data
    result.rows.forEach(row => {
      sheet.addRow({
        code: row.code,
        bezeichnung: row.bezeichnung,
        ebene: row.ebene,
        ist_kategorie: row.ist_kategorie ? 'Ja' : 'Nein'
      });
    });
    
    // Add filter
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: result.rows.length + 1, column: 4 }
    };
  }
  
  private static async setupFieldsSheet(sheet: ExcelJS.Worksheet) {
    // Get all field definitions
    const fields = await aksFieldService.getAllFields();
    
    // Setup columns
    sheet.columns = [
      { header: 'AKS-Code', key: 'aks_code', width: 15 },
      { header: 'AKS-Bezeichnung', key: 'aks_bezeichnung', width: 30 },
      { header: 'Feldname', key: 'field_name', width: 20 },
      { header: 'Bezeichnung', key: 'field_label', width: 25 },
      { header: 'Typ', key: 'field_type', width: 15 },
      { header: 'Pflichtfeld', key: 'is_required', width: 12 },
      { header: 'Einheit', key: 'unit', width: 10 },
      { header: 'Hilfetext', key: 'help_text', width: 40 }
    ];
    
    // Style header
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF00FF' }
    };
    
    // Add data
    fields.forEach(field => {
      sheet.addRow({
        aks_code: field.aks_code,
        aks_bezeichnung: field.aks_bezeichnung || '',
        field_name: field.field_name,
        field_label: field.field_label,
        field_type: field.field_type,
        is_required: field.is_required ? 'Ja' : 'Nein',
        unit: field.unit || '',
        help_text: field.help_text || ''
      });
    });
    
    // Style required fields
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1 && row.getCell(6).value === 'Ja') {
        row.getCell(4).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFCCCC' }
        };
      }
    });
    
    // Add filter
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: fields.length + 1, column: 8 }
    };
  }
  
  private static setupInstructionSheet(sheet: ExcelJS.Worksheet) {
    sheet.columns = [
      { header: 'Anleitung für den Anlagen-Import', key: 'instruction', width: 100 }
    ];
    
    const instructions = [
      '',
      '📋 ALLGEMEINE HINWEISE:',
      '• Pflichtfelder sind mit * gekennzeichnet und MÜSSEN ausgefüllt werden',
      '• Verwenden Sie die Dropdown-Listen wo verfügbar',
      '• AKS-spezifische Felder werden automatisch angezeigt, wenn ein AKS-Code ausgewählt wird',
      '• Rote Hinterlegung = Pflichtfeld für den gewählten AKS-Code',
      '• Orange Hinterlegung = Empfohlenes Feld',
      '',
      '📊 ARBEITSBLÄTTER:',
      '• "Anlagen Import": Hier tragen Sie Ihre Daten ein',
      '• "AKS Codes": Referenzliste aller verfügbaren AKS-Codes',
      '• "AKS Felder": Übersicht aller AKS-spezifischen Felder und deren Anforderungen',
      '',
      '🔧 AKS-SPEZIFISCHE FELDER:',
      '• Jeder AKS-Code hat eigene Pflicht- und optionale Felder',
      '• Diese Felder erscheinen in den Spalten mit Präfix "aks_"',
      '• Beispiel: "aks_volumenstrom" für Lüftungsanlagen',
      '• Einheiten sind in Klammern angegeben, z.B. (m³/h)',
      '',
      '✅ VALIDIERUNG:',
      '• Status: aktiv, inaktiv, defekt, ausser_betrieb',
      '• Zustandsbewertung: 1 (sehr schlecht) bis 5 (sehr gut)',
      '• Baujahr: Vierstellige Jahreszahl (z.B. 2023)',
      '• Anzahl: Positive Ganzzahl',
      '',
      '💡 TIPPS:',
      '• Kopieren Sie ähnliche Anlagen und passen Sie nur die unterschiedlichen Werte an',
      '• Nutzen Sie die Filter-Funktion um schnell bestimmte AKS-Codes zu finden',
      '• Prüfen Sie im Blatt "AKS Felder" welche Felder für Ihren AKS-Code relevant sind',
      '• Speichern Sie regelmäßig zwischen, um Datenverlust zu vermeiden',
      '',
      '⚠️ WICHTIGE HINWEISE:',
      '• Maximale Dateigröße: 50 MB',
      '• Unterstützte Formate: .xlsx, .xls',
      '• Maximale Anzahl Zeilen: 10.000 pro Import',
      '• Sonderzeichen in T-Nummern vermeiden',
      '',
      '📞 SUPPORT:',
      '• Bei Fragen wenden Sie sich an Ihren Administrator',
      '• Fehlermeldungen bitte mit Screenshot dokumentieren'
    ];
    
    instructions.forEach((text, index) => {
      const row = sheet.getRow(index + 2);
      row.getCell(1).value = text;
      
      if (text.startsWith('📋') || text.startsWith('📊') || text.startsWith('🔧') || 
          text.startsWith('✅') || text.startsWith('💡') || text.startsWith('⚠️') || 
          text.startsWith('📞')) {
        row.font = { bold: true, size: 12 };
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
      }
    });
    
    // Format first row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, size: 14 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0070C0' }
    };
    headerRow.alignment = { horizontal: 'center' };
    headerRow.height = 30;
  }
  
  private static async addDataValidation(sheet: ExcelJS.Worksheet, mandantId: string) {
    // Get liegenschaften
    const liegenschaftQuery = `
      SELECT name FROM liegenschaften 
      WHERE mandant_id = $1 
      ORDER BY name
    `;
    const liegenschaftResult = await pool.query(liegenschaftQuery, [mandantId]);
    const liegenschaften = liegenschaftResult.rows.map(r => r.name);
    
    // Get AKS codes
    const aksQuery = `
      SELECT code, bezeichnung FROM aks_codes 
      WHERE ist_kategorie = false 
      ORDER BY code
    `;
    const aksResult = await pool.query(aksQuery);
    const aksCodes = aksResult.rows.map(r => `${r.code} - ${r.bezeichnung}`);
    
    // Apply validations
    for (let row = 2; row <= 1000; row++) {
      // Liegenschaft validation
      if (liegenschaften.length > 0) {
        sheet.getCell(row, 1).dataValidation = {
          type: 'list',
          allowBlank: false,
          formulae: [`"${liegenschaften.join(',')}"`],
          showErrorMessage: true,
          errorTitle: 'Ungültige Liegenschaft',
          error: 'Bitte wählen Sie eine gültige Liegenschaft aus der Liste'
        };
      }
      
      // Status validation
      sheet.getCell(row, 10).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"aktiv,inaktiv,defekt,ausser_betrieb"'],
        showErrorMessage: true,
        errorTitle: 'Ungültiger Status',
        error: 'Bitte wählen Sie einen gültigen Status'
      };
      
      // Zustandsbewertung validation
      sheet.getCell(row, 11).dataValidation = {
        type: 'whole',
        allowBlank: true,
        formulae: [1, 5],
        showErrorMessage: true,
        errorTitle: 'Ungültige Bewertung',
        error: 'Bitte geben Sie eine Zahl zwischen 1 und 5 ein'
      };
      
      // Anzahl validation
      sheet.getCell(row, 9).dataValidation = {
        type: 'whole',
        allowBlank: true,
        formulae: [1],
        showErrorMessage: true,
        errorTitle: 'Ungültige Anzahl',
        error: 'Bitte geben Sie eine positive Ganzzahl ein'
      };
      
      // Baujahr validation
      sheet.getCell(row, 15).dataValidation = {
        type: 'whole',
        allowBlank: true,
        formulae: [1900, 2100],
        showErrorMessage: true,
        errorTitle: 'Ungültiges Baujahr',
        error: 'Bitte geben Sie ein gültiges Jahr ein (1900-2100)'
      };
    }
  }
  
  private static async addSampleData(sheet: ExcelJS.Worksheet, aksFieldsByCode: {[key: string]: any[]}) {
    // Add 3 sample rows with different AKS codes
    const sampleData = [
      {
        liegenschaft: 'Hauptgebäude',
        objekt: 'Gebäude A',
        aks_code: '480.010',
        t_nummer: 'T-001',
        bezeichnung: 'Lüftungsanlage Büro EG',
        beschreibung: 'Zentrale Lüftungsanlage für Erdgeschoss',
        etage: 'EG',
        raum: 'Technikraum 1',
        anzahl: 1,
        status: 'aktiv',
        zustandsbewertung: 4,
        hersteller: 'Systemair',
        typ: 'RVU-2000',
        seriennummer: 'SN-2023-001',
        baujahr: 2023,
        qr_code: 'QR-LA-001'
      },
      {
        liegenschaft: 'Hauptgebäude',
        objekt: 'Gebäude A',
        aks_code: '452.010',
        t_nummer: 'T-002',
        bezeichnung: 'Kältemaschine Server',
        beschreibung: 'Kühlung Serverraum',
        etage: 'UG',
        raum: 'Serverraum',
        anzahl: 1,
        status: 'aktiv',
        zustandsbewertung: 5,
        hersteller: 'Carrier',
        typ: 'AquaSnap 30RB',
        seriennummer: 'CAR-2022-445',
        baujahr: 2022,
        qr_code: 'QR-KM-001'
      },
      {
        liegenschaft: 'Hauptgebäude',
        objekt: 'Gebäude B',
        aks_code: '446.010',
        t_nummer: 'T-003',
        bezeichnung: 'Umwälzpumpe Heizkreis',
        beschreibung: 'Hauptpumpe Heizkreislauf',
        etage: 'UG',
        raum: 'Heizungsraum',
        anzahl: 2,
        status: 'aktiv',
        zustandsbewertung: 3,
        hersteller: 'Grundfos',
        typ: 'Magna3 40-120',
        seriennummer: 'GF-2020-789',
        baujahr: 2020,
        qr_code: 'QR-UP-001'
      }
    ];
    
    // Add sample data with dynamic fields
    sampleData.forEach((data, index) => {
      const rowData: any = { ...data };
      
      // Add AKS-specific field values
      if (aksFieldsByCode[data.aks_code]) {
        aksFieldsByCode[data.aks_code].forEach(field => {
          const columnKey = `aks_${field.field_name}`;
          
          // Add sample values based on field type
          switch (field.field_name) {
            case 'volumenstrom':
              rowData[columnKey] = '2500';
              break;
            case 'leistung':
              rowData[columnKey] = '15';
              break;
            case 'kaelteleistung':
              rowData[columnKey] = '120';
              break;
            case 'kaeltemittel':
              rowData[columnKey] = 'R32';
              break;
            case 'fuellmenge':
              rowData[columnKey] = '8.5';
              break;
            case 'foerdermenge':
              rowData[columnKey] = '150';
              break;
            case 'foerderhoehe':
              rowData[columnKey] = '12';
              break;
            default:
              if (field.is_required) {
                rowData[columnKey] = 'Beispielwert';
              }
          }
        });
      }
      
      const row = sheet.addRow(rowData);
      
      // Style sample rows
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF0F0F0' }
      };
      row.font = { italic: true, color: { argb: 'FF808080' } };
    });
  }
}