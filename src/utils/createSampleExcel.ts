import * as ExcelJS from 'exceljs';
import path from 'path';

export async function createSampleExcelFile(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Anlagen Import');

  // Define columns
  worksheet.columns = [
    { header: 'T-Nummer', key: 'tNummer', width: 15 },
    { header: 'AKS-Code', key: 'aksCode', width: 15 },
    { header: 'Anlagenname', key: 'name', width: 30 },
    { header: 'Beschreibung', key: 'description', width: 40 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Zustandsbewertung', key: 'zustandsBewertung', width: 18 },
    { header: 'Objekt', key: 'objektName', width: 20 },
    { header: 'Liegenschaft', key: 'liegenschaftName', width: 20 },
    { header: 'Etage', key: 'floor', width: 10 },
    { header: 'Raum', key: 'room', width: 10 }
  ];

  // Style header
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  // Sample data
  const sampleData = [
    {
      tNummer: 'T123456',
      aksCode: 'HLK.001.01',
      name: 'Lüftungsanlage Nord',
      description: 'Zu- und Abluftanlage mit Wärmerückgewinnung',
      status: 'aktiv',
      zustandsBewertung: 4,
      objektName: 'Technikraum EG',
      liegenschaftName: 'Hauptgebäude',
      floor: 'EG',
      room: 'T001'
    },
    {
      tNummer: 'T123457',
      aksCode: 'HLK.002.01',
      name: 'Heizung Bürotrakt',
      description: 'Gasheizung 150kW mit Brennwerttechnik',
      status: 'aktiv',
      zustandsBewertung: 3,
      objektName: 'Heizungsraum',
      liegenschaftName: 'Hauptgebäude',
      floor: 'UG',
      room: 'H001'
    },
    {
      tNummer: '',
      aksCode: 'ELT.001.01',
      name: 'Hauptverteilung',
      description: '400V Schaltanlage mit Notstromversorgung',
      status: 'aktiv',
      zustandsBewertung: 5,
      objektName: 'Elektroraum',
      liegenschaftName: 'Nebengebäude',
      floor: 'EG',
      room: 'E001'
    },
    {
      tNummer: 'T123458',
      aksCode: 'SAN.001.01',
      name: 'Trinkwassererwärmung',
      description: 'Warmwasserbereitung für Verwaltung',
      status: 'wartung',
      zustandsBewertung: 2,
      objektName: 'Technikraum UG',
      liegenschaftName: 'Hauptgebäude',
      floor: 'UG',
      room: 'T002'
    },
    {
      tNummer: 'T123459',
      aksCode: 'HLK.003.01',
      name: 'Kältemaschine',
      description: 'Kompressionskältemaschine 50kW',
      status: 'defekt',
      zustandsBewertung: 1,
      objektName: 'Maschinenraum',
      liegenschaftName: 'Hauptgebäude',
      floor: 'Dach',
      room: 'M001'
    },
    {
      tNummer: '',
      aksCode: 'BMA.001.01',
      name: 'Brandmeldeanlage',
      description: 'Automatische Brandmeldeanlage Hauptgebäude',
      status: 'aktiv',
      zustandsBewertung: 4,
      objektName: 'Brandmeldezentrale',
      liegenschaftName: 'Hauptgebäude',
      floor: 'EG',
      room: 'B001'
    },
    {
      tNummer: 'T123460',
      aksCode: 'ELT.002.01',
      name: 'Notbeleuchtung',
      description: 'Zentrale Notbeleuchtungsanlage',
      status: 'aktiv',
      zustandsBewertung: 3,
      objektName: 'Elektroraum',
      liegenschaftName: 'Hauptgebäude',
      floor: 'EG',
      room: 'E002'
    },
    {
      tNummer: '',
      aksCode: 'AUS.001.01',
      name: 'Außenbeleuchtung',
      description: 'LED-Außenbeleuchtung Parkplatz',
      status: 'aktiv',
      zustandsBewertung: 5,
      objektName: 'Außenanlage',
      liegenschaftName: 'Hauptgebäude',
      floor: 'EG',
      room: 'AUßEN'
    }
  ];

  // Add sample data
  sampleData.forEach(data => {
    worksheet.addRow(data);
  });

  // Auto-fit columns
  worksheet.columns.forEach(column => {
    if (column.key) {
      const lengths = worksheet.getColumn(column.key!).values?.map(v => 
        v ? v.toString().length : 0
      ) || [];
      const maxLength = Math.max(...lengths, column.header?.length || 0);
      column.width = Math.min(Math.max(maxLength + 2, 10), 50);
    }
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

  // Conditional formatting for status
  worksheet.addConditionalFormatting({
    ref: 'E2:E100',
    rules: [
      {
        type: 'cellIs',
        operator: 'equal',
        formulae: ['"aktiv"'],
        style: {
          fill: {
            type: 'pattern',
            pattern: 'solid',
            bgColor: { argb: 'FF90EE90' }
          }
        }
      },
      {
        type: 'cellIs',
        operator: 'equal',
        formulae: ['"wartung"'],
        style: {
          fill: {
            type: 'pattern',
            pattern: 'solid',
            bgColor: { argb: 'FFFFFF00' }
          }
        }
      },
      {
        type: 'cellIs',
        operator: 'equal',
        formulae: ['"defekt"'],
        style: {
          fill: {
            type: 'pattern',
            pattern: 'solid',
            bgColor: { argb: 'FFFF6B6B' }
          }
        }
      }
    ]
  });

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

// Export function for use in routes
export async function generateSampleExcelRoute(): Promise<Buffer> {
  return createSampleExcelFile();
}